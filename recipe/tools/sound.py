"""Sound for a 3D Cartoon short: an original music bed and designed sound effects synthesised from code (no samples),
placed from the film's cues, mixed to the style's numbers and muxed with the silent render.

Effects follow motion-design practice (layers that peak together, moving filters on anything that moves, tonal sounds
in the music's key, round-robin variation, frame-accurate sync, a short music dip before the biggest hits), as
documented in earshot's docs/motion-sfx-techniques.md and docs/SFX.md (github.com/Leonxlnx/earshot, MIT). The code
here is our own, written from those notes.

Two tiers: accents (story beats, at most ~20 a minute) and foley (every visible action, quiet).
Levels: voice -16 LUFS; music bed 18 LU under it with no ducking; accents peak around -9 to -13 dBFS, foley
-18 to -30 dBFS; master -14 LUFS.

Usage: python -I sound.py <roundDir> <silentVideo> <shotsJson> <outVideo> [bpm]
Writes stems (voice, music, sfx), mix.wav and cue-sheet.txt next to the output video.
"""
import json, math, os, re, subprocess, sys, wave
from pathlib import Path
import numpy as np

ROUND, SILENT, SHOTS, OUT = map(Path, sys.argv[1:5])
BPM = float(sys.argv[5]) if len(sys.argv) > 5 else 100.0
FFMPEG = os.environ.get("CARTOON_FFMPEG") or "ffmpeg"  # ffmpeg on your PATH, or set CARTOON_FFMPEG
SR = 48_000
info = json.loads(SHOTS.read_text(encoding="utf-8"))
DUR = float(info["duration"])
N = int(SR * DUR) + SR // 2
t_ = lambda d: np.arange(max(1, int(SR * d))) / SR


# ---------- io ----------
def read_wav(path):
    with wave.open(str(path)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float64) / 32768
        if w.getnchannels() == 2: x = x.reshape(-1, 2).mean(1)
        assert w.getframerate() == SR, "voice must be 48 kHz"
    return x


def write_wav(path, stereo):
    pcm = (np.clip(stereo, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.reshape(-1).tobytes())


def place(buf, sound, at, pan=0.0):
    """Adds a mono or stereo sound at time `at` (equal-power pan for mono)."""
    i = int(round(at * SR))
    if sound.ndim == 1:
        s = np.stack([sound * math.cos((pan + 1) * math.pi / 4), sound * math.sin((pan + 1) * math.pi / 4)], 1) * math.sqrt(2)
    else:
        s = sound
    if i < 0: s, i = s[-i:], 0
    j = min(len(buf), i + len(s))
    if j > i: buf[i:j] += s[: j - i]


# ---------- dsp ----------
def fft_filter(x, lo=None, hi=None, order=2):
    """Zero-phase band filter with smooth (Butterworth-like) magnitude, in the frequency domain."""
    n = 1 << int(math.ceil(math.log2(len(x) + 256)))
    X = np.fft.rfft(x, n); f = np.fft.rfftfreq(n, 1 / SR) + 1e-9; g = np.ones_like(f)
    if lo: g *= 1 / np.sqrt(1 + (lo / f) ** (2 * order))
    if hi: g *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    return np.fft.irfft(X * g, n)[: len(x)]


def moving_band(x, centre, octaves=0.8):
    """A band-pass whose centre (Hz) follows `centre`, an array with one value per sample (STFT overlap-add)."""
    n, hop = 1024, 256; win = np.hanning(n); out = np.zeros(len(x) + n); norm = np.zeros(len(x) + n)
    f = np.fft.rfftfreq(n, 1 / SR) + 1e-9; xp = np.concatenate([x, np.zeros(n)])
    for s in range(0, len(x), hop):
        fr = xp[s:s + n] * win; fc = max(60.0, float(centre[min(len(centre) - 1, s + n // 2)]))
        g = np.exp(-0.5 * (np.log2(f / fc) / octaves) ** 2)
        out[s:s + n] += np.fft.irfft(np.fft.rfft(fr) * g, n) * win; norm[s:s + n] += win ** 2
    return out[: len(x)] / np.maximum(norm[: len(x)], 1e-6)


def pink(n, rng):
    X = np.fft.rfft(rng.normal(0, 1, n)); f = np.fft.rfftfreq(n, 1 / SR); X[1:] /= np.sqrt(f[1:]); X[0] = 0
    y = np.fft.irfft(X, n); return y / (np.max(np.abs(y)) + 1e-9)


def env_ad(n, attack_s, decay_s, power=1.0):
    t = np.arange(n) / SR; a = np.clip(t / max(attack_s, 1e-4), 0, 1); d = np.exp(-np.maximum(0, t - attack_s) / max(decay_s, 1e-4))
    return (a * d) ** power


def sat(x, drive=2.0): return np.tanh(drive * x) / math.tanh(drive)


def room(x, size=0.12, wet=0.18, dark=4500, rng=None):
    """A small dark room: x plus a short decaying-noise tail (sub stays dry because the tail is high-passed)."""
    rng = rng or np.random.default_rng(1)
    ir = rng.normal(0, 1, int(SR * size)) * np.exp(-np.arange(int(SR * size)) / (SR * size / 5)); ir = fft_filter(ir, 180, dark)
    ir[: int(SR * 0.012)] = 0; ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    n = 1 << int(math.ceil(math.log2(len(x) + len(ir))))
    tail = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x) + len(ir)]
    y = np.concatenate([x, np.zeros(len(ir))]); return y + wet * tail


def tone(freqs_hz, d, amps=None, phase=0.0):
    """Sum of sines; freqs may be arrays (glides)."""
    t = t_(d); out = np.zeros(len(t))
    for k, f in enumerate(freqs_hz):
        f = np.broadcast_to(np.asarray(f, float), t.shape); out += (amps[k] if amps else 1.0) * np.sin(2 * np.pi * np.cumsum(f) / SR + phase)
    return out


def finish(x, fade_ms=4):
    """Starts on the first sample, ends on a short fade, peak-normalised."""
    x = x - np.mean(x[: min(64, len(x))]) * 0
    f = int(SR * fade_ms / 1000)
    if len(x) > 2 * f: x[-f:] *= np.linspace(1, 0, f) ** 2
    x[: min(24, len(x))] *= np.linspace(0, 1, min(24, len(x)))
    return x / (np.max(np.abs(x)) + 1e-9)


def note_hz(midi): return 440.0 * 2 ** ((midi - 69) / 12)


PENTA = [72, 74, 76, 79, 81, 84, 86, 88]  # C major pentatonic C5..E6, the music's key


# ---------- designed effects (each returns a mono or stereo array at unit peak) ----------
def fx_whoosh(rng, d=0.55, peak=0.6, big=False):
    """Air pass: pink noise through three moving bands (1 : 1.6 : 2.5) whose centre follows the speed; pan sweeps."""
    n = int(SR * d); t = np.arange(n) / n
    speed = np.where(t < peak, (t / peak) ** 2.6, np.exp(-(t - peak) / (1 - peak) * 3.2))
    lo, hi = (180, 1800) if big else (420, 3800)
    centre = lo + (hi - lo) * speed ** 0.8
    src = pink(n, rng); y = sum(w * moving_band(src, centre * r, 0.55) for r, w in ((1, 1.0), (1.6, 0.6), (2.5, 0.35)))
    y *= speed ** 1.4
    if big: y += 0.3 * tone([np.full(n, 55.0) * (1 + 0.15 * speed)], d) * speed ** 2
    pan = np.tanh((t - peak) / 0.18) * 0.55; L = y * np.cos((pan + 1) * np.pi / 4); R = y * np.sin((pan + 1) * np.pi / 4)
    s = np.stack([L, R], 1); return s / (np.max(np.abs(s)) + 1e-9)


def fx_swish(rng, d=0.2):
    """A thin fast flick (an arm, a book, cloth): bright, steep rise, 150-250 ms."""
    n = int(SR * d); t = np.arange(n) / n; sp = np.where(t < 0.55, (t / 0.55) ** 3, np.exp(-(t - 0.55) * 9))
    y = moving_band(rng.normal(0, 1, n), 1500 + 4500 * sp, 0.5) * sp
    return finish(y)


def fx_pop(rng, f0=None):
    """An element popping in: a tonal blip sweeping up into the key, a 1-2 ms tick, a small daughter ring."""
    f0 = f0 or note_hz(PENTA[rng.integers(0, 5)]) / 2
    d = 0.18; t = t_(d); f = f0 * (0.55 + 0.45 * (1 - np.exp(-t / 0.018)))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(t), 0.0008, 0.05)
    tick = fft_filter(rng.normal(0, 1, len(t)), 2000, 4500) * env_ad(len(t), 0.0003, 0.0015) * 0.25
    dau = np.zeros(len(t)); k = int(SR * 0.011); dau[k:] = 0.35 * np.sin(2 * np.pi * f0 * 1.5 * np.arange(len(t) - k) / SR) * env_ad(len(t) - k, 0.0008, 0.03)
    return finish(fft_filter(body + tick + dau, 150, 5000))


def fx_tick(rng):
    """A counter tick: a tiny bright knock with a short tonal ping, varied per take."""
    d = 0.05; t = t_(d); f = 3100 * 2 ** (rng.uniform(-0.6, 0.6) / 12)
    ping = np.sin(2 * np.pi * f * t) * env_ad(len(t), 0.0004, 0.008)
    click = fft_filter(rng.normal(0, 1, len(t)), 2500, 9000) * env_ad(len(t), 0.0002, 0.0012)
    body = np.sin(2 * np.pi * 900 * t) * env_ad(len(t), 0.0005, 0.006) * 0.4
    return finish(ping + 0.7 * click + body)


def fx_tap(rng):
    """A soft knock of a small object on wood: one damped block mode, its rattle, a touch of thump."""
    d = 0.16; t = t_(d); f = 520 * 2 ** (rng.uniform(-1, 1) / 12)
    y = np.sin(2 * np.pi * f * t) * env_ad(len(t), 0.0006, 0.018) + 0.4 * np.sin(2 * np.pi * f * 2.3 * t) * env_ad(len(t), 0.0004, 0.008)
    y += 0.5 * np.sin(2 * np.pi * 140 * t) * env_ad(len(t), 0.001, 0.02) + 0.3 * fft_filter(rng.normal(0, 1, len(t)), 1500, 6000) * env_ad(len(t), 0.0002, 0.002)
    return finish(y)


def fx_thunk(rng):
    """The apple landing on grass: a dull body falling 150->70 Hz, a soft low-passed transient, a little grass."""
    d = 0.4; t = t_(d); f = 70 + 80 * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(t), 0.001, 0.07)
    trans = fft_filter(rng.normal(0, 1, len(t)), 300, 2200) * env_ad(len(t), 0.0005, 0.012) * 0.6
    grass = fft_filter(rng.normal(0, 1, len(t)), 2500, 7000) * env_ad(len(t), 0.004, 0.05) * 0.12
    return finish(sat(body + trans + grass, 1.6))


def fx_thud(rng, heavy=1.0):
    """A heavy settle: sub falling 90->42 Hz, a body, a transient; the sub stays dry."""
    d = 0.6; t = t_(d); f = 42 + 50 * np.exp(-t / 0.06)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(t), 0.002, 0.18)
    body = fft_filter(rng.normal(0, 1, len(t)), 90, 700) * env_ad(len(t), 0.001, 0.04) * 0.6
    tr = fft_filter(rng.normal(0, 1, len(t)), 1200, 5000) * env_ad(len(t), 0.0003, 0.004) * 0.3
    return finish(sub * heavy + sat(body + tr, 2.0))


def fx_slam(rng):
    """Heavy wooden doors shutting: low wood body, a latch click, a rattle, a stone-arch room tail."""
    d = 0.5; t = t_(d); f = 85 + 60 * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(t), 0.001, 0.09)
    wood = sum(a * np.sin(2 * np.pi * fm * t) * env_ad(len(t), 0.0005, dm) for fm, a, dm in ((210, 0.6, 0.05), (395, 0.4, 0.03), (760, 0.25, 0.015)))
    crack = fft_filter(rng.normal(0, 1, len(t)), 800, 6000) * env_ad(len(t), 0.0003, 0.006) * 0.7
    latch = np.zeros(len(t)); k = int(SR * 0.045); latch[k:] = fft_filter(rng.normal(0, 1, len(t) - k), 2500, 8000) * env_ad(len(t) - k, 0.0002, 0.003) * 0.4
    return finish(room(sat(body + wood + crack, 1.8) + latch, size=0.35, wet=0.35, dark=3500, rng=rng))


def fx_creak(rng, d=0.34):
    """A slow wooden creak: a rough, slightly rising pulse train (stick-slip) through wood resonances."""
    n = int(SR * d); t = np.arange(n) / SR; rate = 55 + 40 * (t / d) + 8 * np.sin(2 * np.pi * 3.3 * t)
    ph = np.cumsum(rate / SR); pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float) * (0.6 + 0.4 * rng.random(n))
    y = sum(fft_filter(pulses, fm * 0.8, fm * 1.25) for fm in (330, 720, 1450))
    return finish(y * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.6)


def fx_slap(rng):
    """A paper notice slapped on wood: a flat broadband smack and a paper flutter."""
    d = 0.22; t = t_(d)
    smack = fft_filter(rng.normal(0, 1, len(t)), 600, 5500) * env_ad(len(t), 0.0004, 0.014)
    thump = np.sin(2 * np.pi * 160 * t) * env_ad(len(t), 0.001, 0.025) * 0.6
    flut = fft_filter(rng.normal(0, 1, len(t)), 2000, 7000) * env_ad(len(t), 0.01, 0.05) * 0.15
    return finish(smack + thump + flut)


def fx_flip(rng):
    """A calendar page flip: a paper swish that sweeps up and a soft settle."""
    n = int(SR * 0.26); t = np.arange(n) / n; sp = np.sin(np.pi * np.clip(t / 0.75, 0, 1)) ** 2
    y = moving_band(rng.normal(0, 1, n), 1800 + 3500 * sp, 0.7) * sp
    k = int(SR * 0.2); y[k:] += fft_filter(rng.normal(0, 1, n - k), 1000, 5000) * env_ad(n - k, 0.0005, 0.008) * 0.6
    return finish(y)


def fx_click(rng):
    """A switch: press and latch 35 ms apart (bright, short), then a tiny housing ring."""
    d = 0.1; out = np.zeros(int(SR * d))
    for at, fc, a in ((0.0, 4200, 1.0), (0.035, 2900, 0.55)):
        k = int(SR * at); m = len(out) - k
        out[k:] += a * fft_filter(rng.normal(0, 1, m), fc * 0.7, fc * 1.4) * env_ad(m, 0.0004, 0.003)
    out += 0.2 * np.sin(2 * np.pi * 1100 * t_(d)) * env_ad(len(out), 0.001, 0.01)
    return finish(out)


def fx_light(rng):
    """A sign lighting: a soft electric hum swelling briefly and a small chime in key."""
    d = 0.5; t = t_(d)
    hum = (np.sin(2 * np.pi * 120 * t) + 0.5 * np.sin(2 * np.pi * 240 * t) + 0.25 * np.sin(2 * np.pi * 360 * t)) * env_ad(len(t), 0.02, 0.15) * 0.5
    chime = np.sin(2 * np.pi * note_hz(88) * t) * env_ad(len(t), 0.001, 0.12) * 0.5
    return finish(hum + chime)


def fx_chirp(rng):
    """A small bird: two quick downward-upward whistles 3-4.5 kHz."""
    out = np.zeros(int(SR * 0.3))
    for at in (0.0, 0.12 + rng.uniform(0, 0.03)):
        k = int(SR * at); d = 0.07; tt = t_(d); f = 3600 + 900 * np.sin(np.pi * tt / d) * (1 if at == 0 else -0.6) + rng.uniform(-150, 150)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2; out[k:k + len(s)] += s[: len(out) - k]
    return finish(out)


def fx_rattle(rng):
    """Leaves shivering: quick filtered noise bursts at a wobble rate."""
    d = 0.32; t = t_(d); am = (0.5 + 0.5 * np.sin(2 * np.pi * 24 * t)) ** 3 * np.exp(-t / 0.12)
    return finish(fft_filter(rng.normal(0, 1, len(t)), 2200, 7500) * am)


def fx_slide(rng):
    """A small scoot: a soft squeak gliding up then back, with a little friction noise."""
    d = 0.22; t = t_(d); f = 950 + 320 * np.sin(np.pi * t / d) + 25 * np.sin(2 * np.pi * 30 * t)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 1.5 + 0.2 * fft_filter(rng.normal(0, 1, len(t)), 1500, 5000) * np.sin(np.pi * t / d)
    return finish(y)


def fx_boing(rng, f0=160.0):
    """A spring or trampoline: a wobbling tone falling slightly, with a low body."""
    d = 0.7; t = t_(d); f = f0 + 0.55 * f0 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 4) - 20 * t
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(t), 0.002, 0.22) + 0.4 * np.sin(2 * np.pi * f0 / 2 * t) * env_ad(len(t), 0.002, 0.12)
    return finish(y)


def fx_twang(rng, f0=220.0):
    """A taut string plucked: harmonic partials with a short pitch wobble and a fast decay of the highs."""
    d = 0.8; t = t_(d); bend = 1 + 0.05 * np.exp(-t * 9) * np.sin(2 * np.pi * 7 * t)
    y = sum((0.8 ** k) * np.sin(2 * np.pi * np.cumsum(f0 * (k + 1) * bend) / SR) * env_ad(len(t), 0.001, 0.4 / (1 + 0.7 * k)) for k in range(6))
    return finish(y)


def fx_stretch(rng, d=0.2):
    """Rubber stretching: a low rough creak rising in pitch."""
    n = int(SR * d); t = np.arange(n) / SR; rate = 90 + 160 * (t / d)
    ph = np.cumsum(rate / SR); pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float)
    y = fft_filter(pulses, 150, 900) + 0.5 * fft_filter(pulses, 900, 2500)
    return finish(y * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.7)


def fx_whir(rng, d=1.0):
    """A tape running out: ratchet clicks that speed up then settle, over a light flutter."""
    n = int(SR * d); t = np.arange(n) / SR; u = t / d
    rate = 14 + 30 * np.sin(np.pi * np.clip(u, 0, 1)) ** 0.8; ph = np.cumsum(rate / SR)
    pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float)
    clicks = fft_filter(pulses, 2000, 7000)
    flutter = fft_filter(rng.normal(0, 1, n), 2500, 6000) * 0.08 * (0.5 + 0.5 * np.sin(2 * np.pi * rate * t))
    return finish((clicks + flutter) * np.minimum(1, u * 12) * np.minimum(1, (1 - u) * 12 + 0.05))


def fx_ding(rng):
    """A clean bell ding in key (C6): FM-like inharmonic partials with a bright attack that mellows."""
    d = 1.3; t = t_(d); f = note_hz(84)
    y = sum(a * np.sin(2 * np.pi * f * r * t) * env_ad(len(t), 0.001, dk) for r, a, dk in ((1, 1.0, 0.55), (2.0, 0.35, 0.3), (2.76, 0.25, 0.18), (5.4, 0.12, 0.07)))
    return finish(room(y, size=0.6, wet=0.25, dark=6000, rng=rng))


def fx_chalk(rng, d=0.3):
    """Chalk on a board: a scratchy band of noise chopped by the stroke rhythm."""
    n = int(SR * d); t = np.arange(n) / SR
    am = (0.55 + 0.45 * np.sin(2 * np.pi * (38 + 12 * np.sin(2 * np.pi * 2.5 * t)) * t)) * (0.7 + 0.3 * rng.random(n))
    stroke = np.clip(np.sin(2 * np.pi * 3.2 * t + 0.3), 0, 1) ** 0.5 if d > 0.4 else np.ones(n)
    y = fft_filter(rng.normal(0, 1, n), 2500, 9000) * am * stroke
    return finish(y * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.04 + 0.02))


def fx_snip(rng):
    """Scissors: two bright blade clicks and a short metallic shing."""
    d = 0.32; out = np.zeros(int(SR * d))
    for at, a in ((0.0, 1.0), (0.07, 0.8)):
        k = int(SR * at); m = len(out) - k
        out[k:] += a * fft_filter(rng.normal(0, 1, m), 3000, 11000) * env_ad(m, 0.0003, 0.004)
        out[k:] += a * 0.5 * sum(np.sin(2 * np.pi * fm * np.arange(m) / SR) * env_ad(m, 0.0005, dk) for fm, dk in ((3150, 0.05), (4720, 0.03), (6900, 0.02)))
    return finish(out)


def fx_roll(rng, d=1.4):
    """A small ball rolling on a stretched surface: a low rumble whose rate follows the speed, plus surface ticks."""
    n = int(SR * d); t = np.arange(n) / SR; u = t / d; speed = 0.3 + 0.7 * u
    rumble = fft_filter(rng.normal(0, 1, n), 80, 420) * (0.6 + 0.4 * np.sin(2 * np.pi * (6 + 10 * speed) * t))
    ph = np.cumsum((8 + 14 * speed) / SR); ticks = (np.diff(np.floor(ph), prepend=0) > 0).astype(float)
    y = rumble * speed + 0.4 * fft_filter(ticks, 1200, 4000)
    return finish(y * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.08))


FX = {"whoosh": fx_whoosh, "swish": fx_swish, "pop": fx_pop, "tick": fx_tick, "tap": fx_tap, "thunk": fx_thunk, "thud": fx_thud,
      "slam": fx_slam, "creak": fx_creak, "slap": fx_slap, "flip": fx_flip, "click": fx_click, "light": fx_light, "chirp": fx_chirp,
      "rattle": fx_rattle, "slide": fx_slide, "boing": fx_boing, "twang": fx_twang, "stretch": fx_stretch, "whir": fx_whir,
      "ding": fx_ding, "chalk": fx_chalk, "snip": fx_snip, "roll": fx_roll}
# Loudness of each effect relative to the speech (dB, 400 ms RMS of the effect's loudest moment against the median
# 400 ms RMS of the voice while speaking). Accents sit 8-11 dB under the voice (the reference measured ~10 LU), whooshes
# and pops ~15, ticks quieter.
REL = {"thunk": -8, "slam": -8, "snip": -9, "boing": -9, "ding": -10, "twang": -10, "thud": -11,
       "slap": -13, "flip": -14, "whoosh": -15, "tap": -15, "chalk": -15, "roll": -16, "pop": -16, "click": -16, "light": -17,
       "creak": -17, "whir": -18, "stretch": -18, "slide": -18, "swish": -19, "rattle": -19, "tick": -21, "chirp": -22}
ACCENT = {"thunk", "slam", "snip", "boing", "ding", "twang", "thud"}
SUSTAINED = {"creak", "whir", "chalk", "roll", "stretch"}


def make_effect(c, rng):
    kind = c["type"]; fn = FX[kind]
    if kind in SUSTAINED: return fn(rng, d=max(0.08, float(c.get("dur", 0.3))))
    if kind == "whoosh": return fn(rng, d=0.9 if c.get("long") else 0.5, peak=0.62, big=bool(c.get("long")))
    return fn(rng)


# ---------- music: C - Am - F - G, marimba, plucked bass, pad, kick, shaker ----------
def marimba(hz, d=0.9, vel=1.0):
    x = t_(d); s = np.sin(2 * np.pi * hz * x) * np.exp(-x * 5.5) + 0.35 * np.sin(2 * np.pi * hz * 3.93 * x) * np.exp(-x * 16) + 0.12 * np.sin(2 * np.pi * hz * 9.2 * x) * np.exp(-x * 30)
    return s * env_ad(len(x), 0.002, 10) * vel


def pluck_bass(hz, d=0.5, vel=1.0):
    x = t_(d); s = np.sin(2 * np.pi * hz * x) + 0.3 * np.sin(4 * np.pi * hz * x) * np.exp(-x * 8)
    return s * np.exp(-x * 5) * vel


def pad(hzs, d, vel=1.0):
    x = t_(d); s = sum(np.sin(2 * np.pi * h * (1 + dt) * x + ph) for h in hzs for dt, ph in ((0, 0), (0.003, 1.3), (-0.003, 2.1)))
    e = np.minimum(1, x / 0.5) * np.minimum(1, (d - x) / 0.8 + 0.001)
    return s / (3 * len(hzs)) * np.clip(e, 0, 1) * vel


def kick(vel=1.0):
    x = t_(0.3); f = 48 + 80 * np.exp(-x * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 11) * vel


def shaker(rng, vel=1.0):
    x = t_(0.07); n = rng.normal(0, 1, len(x)); return np.diff(n, prepend=0) * np.exp(-x * 60) * 0.5 * vel


def build_music(rng):
    beat = 60 / BPM; music = np.zeros((N, 2))
    chords = [(60, [60, 64, 67]), (57, [57, 60, 64]), (53, [53, 57, 60]), (55, [55, 59, 62])]
    melody = [72, 76, 79, 76, 74, 72, 74, 76, 72, 69, 72, 76, 77, 76, 74, 71]
    drop = info.get("musicDrop")
    bars = int(DUR / (4 * beat)) + 2
    for b in range(bars):
        root, tones = chords[b % 4]; bar_t = b * 4 * beat
        place(music, pad([note_hz(m) for m in tones], 4 * beat + 0.6, 0.55), bar_t)
        for k in range(4):
            at = bar_t + k * beat
            if drop and drop[0] - 0.05 <= at < drop[1]: continue
            place(music, pluck_bass(note_hz(root - 12 + (7 if k == 2 else 0)), 0.45, 0.9), at, -0.1)
            if k in (0, 2): place(music, kick(0.55), at)
            place(music, shaker(rng, 0.5), at + beat / 2, 0.3); place(music, shaker(rng, 0.3), at, -0.3)
            m = melody[(b * 4 + k) % len(melody)]
            place(music, marimba(note_hz(m), 0.8, 0.55), at, 0.2)
            if k % 2 == 1: place(music, marimba(note_hz(m + 7), 0.5, 0.25), at + beat / 2, -0.2)
    if drop:
        x = t_(1.1); f = 300 * 2 ** (x / 1.1); place(music, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / 1.1) * 0.25, drop[0])
    fade = int(0.6 * SR); music[-fade:] *= np.linspace(1, 0, fade)[:, None]
    return music


def lufs(path):
    r = subprocess.run([FFMPEG, "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=framelog=quiet", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)[-1])


def main():
    out_dir = OUT.parent; out_dir.mkdir(parents=True, exist_ok=True); rng = np.random.default_rng(7)
    voice = read_wav(ROUND / "vo" / "voice-final.wav"); v = np.zeros((N, 2)); v[: len(voice)] += voice[: N, None]
    music = build_music(rng)
    # Level the voice first (-16 LUFS), so every effect is set against the speech as it will play.
    write_wav(out_dir / "stem-voice.wav", v / max(1e-9, np.max(np.abs(v))) * 0.5)
    v *= 10 ** ((-16 - lufs(out_dir / "stem-voice.wav")) / 20) * 0.5 / max(1e-9, np.max(np.abs(v)))
    win = int(0.4 * SR); vm = v.mean(1); frames = np.array([np.sqrt(np.mean(vm[i:i + win] ** 2)) + 1e-9 for i in range(0, len(vm) - win, SR // 20)])
    fdb = 20 * np.log10(frames); speech_ref = float(np.median(fdb[fdb > fdb.max() - 25]))
    voice_rms_at = lambda tt: float(fdb[min(len(fdb) - 1, max(0, int((tt - 0.2) * 20)))])
    def loudest_400ms(s):
        m = s.mean(1) if s.ndim == 2 else s
        if len(m) <= win: return 20 * math.log10(np.sqrt(np.sum(m ** 2) / win) + 1e-9)
        c2 = np.cumsum(np.concatenate([[0], m ** 2])); return 10 * math.log10(np.max(c2[win:] - c2[:-win]) / win + 1e-12)
    print("speech reference (400 ms RMS):", round(speech_ref, 1), "dBFS")

    # ---------- effects: accents capped at ~20 a minute; foley on every action ----------
    cues = sorted(info.get("cues", []), key=lambda c: c["t"])
    cap = max(6, round(20 * DUR / 60)); accents = [c for c in cues if c["type"] in ACCENT]
    keep_acc = set(id(c) for c in sorted(accents, key=lambda c: -float(c.get("gain", 1)))[:cap])
    fx = np.zeros((N, 2)); sheet = []; last = {}
    stops = []
    for i, c in enumerate(cues):
        kind = c["type"]
        if kind in ACCENT and id(c) not in keep_acc: continue
        if kind == "tick" and c["t"] - last.get(kind, -9) < 0.045: continue
        last[kind] = c["t"]
        crng = np.random.default_rng(1000 + i * 7919)
        s = make_effect(c, crng)
        rel = REL[kind] + (2 if kind == "whoosh" and c.get("long") else 0) + 20 * math.log10(max(1e-3, float(c.get("gain", 1)))) + crng.uniform(-1.2, 1.2)
        gain_db = speech_ref + rel - loudest_400ms(s)
        s = s * 10 ** (gain_db / 20)
        at = c["t"] - 0.01  # lead the picture by under a frame, never lag
        if kind == "whoosh": at = c["t"] - 0.62 * (0.9 if c.get("long") else 0.5)  # peak on the cue
        place(fx, s, at, float(c.get("pan", 0.0)))
        if c.get("stop"): stops.append(c["t"])
        sheet.append(f"{c['t']:7.3f}  {'ACCENT' if kind in ACCENT else 'foley '}  {kind:8s} {gain_db:6.1f} dB" + (f"  dur {c['dur']:.2f}" if 'dur' in c else ""))
    # Stop-down: the bed dips 7 dB over the 0.35 s before each marked accent and comes back on the hit.
    g = np.ones(N)
    for st in stops:
        a, b = int((st - 0.4) * SR), int(st * SR); r = int(0.05 * SR)
        if a < 0: continue
        dip = 10 ** (-7 / 20)
        g[a:a + r] = np.minimum(g[a:a + r], np.linspace(1, dip, r)); g[a + r:b] = np.minimum(g[a + r:b], dip)
        g[b:b + int(0.08 * SR)] = np.minimum(g[b:b + int(0.08 * SR)], np.linspace(dip, 1, int(0.08 * SR)))
    music *= g[:, None]
    (out_dir / "cue-sheet.txt").write_text("\n".join(sheet) + "\n", encoding="utf-8")
    n_acc = sum(1 for s in sheet if 'ACCENT' in s)
    print(f"effects placed: {len(sheet)} ({n_acc} accents, {len(sheet) - n_acc} foley); stop-downs: {len(stops)}")

    # ---------- levels: voice -16 LUFS, music 18 LU under; effects keep their designed peaks ----------
    write_wav(out_dir / "stem-music.wav", music / max(1e-9, np.max(np.abs(music))) * 0.5)
    Lv, Lm = -16.0, lufs(out_dir / "stem-music.wav")
    vg = 1.0; mg = 10 ** ((-34 - Lm) / 20) * 0.5 / max(1e-9, np.max(np.abs(music)))
    write_wav(out_dir / "stem-sfx.wav", fx)
    mix = v * vg + music * mg + fx
    write_wav(out_dir / "mix-premaster.wav", mix / max(1.0, np.max(np.abs(mix)) / 0.98))
    print("stem loudness before levelling (LUFS): voice", round(Lv, 1), "music", round(Lm, 1), "| sfx stem", round(lufs(out_dir / "stem-sfx.wav"), 1))

    # ---------- master to -14 LUFS (two-pass loudnorm, linear) and mux ----------
    pre = out_dir / "mix-premaster.wav"
    r = subprocess.run([FFMPEG, "-hide_banner", "-i", str(pre), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    meas = json.loads(r.stderr[r.stderr.rindex("{"): r.stderr.rindex("}") + 1])
    ln = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={meas['input_i']}:measured_TP={meas['input_tp']}:measured_LRA={meas['input_lra']}:measured_thresh={meas['input_thresh']}:offset={meas['target_offset']}:linear=true"
    final = out_dir / "mix.wav"
    subprocess.run([FFMPEG, "-v", "error", "-y", "-i", str(pre), "-af", ln, "-ar", str(SR), str(final)], check=True)
    subprocess.run([FFMPEG, "-v", "error", "-y", "-i", str(SILENT), "-i", str(final), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(OUT)], check=True)
    print("master LUFS:", round(lufs(final), 1), "->", OUT)


main()
