"""Measures each effect against the voice around it in a mix folder: effect peak (50 ms RMS) minus the voice's
400 ms RMS level at that moment, both as they sit in the pre-master. Usage: python -I sfx-levels.py <outDir> <cue-sheet>"""
import sys, wave, re
from pathlib import Path
import numpy as np

out = Path(sys.argv[1]); SR = 48000
def rd(p):
    with wave.open(str(p)) as w: x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float).reshape(-1, 2).mean(1) / 32768
    return x
pre, sfx = rd(out / 'mix-premaster.wav'), rd(out / 'stem-sfx.wav')
voice_music = pre[: len(sfx)] - sfx[: len(pre)]
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
rows = []
for line in Path(sys.argv[2]).read_text().splitlines():
    m = re.match(r'\s*([\d.]+)\s+(ACCENT|foley)\s+(\w+)', line)
    if not m: continue
    t, tier, kind = float(m[1]), m[2], m[3]; a = int(t * SR)
    seg = sfx[max(0, a - 2400): a + int(0.5 * SR)]; k = np.argmax(np.abs(seg)); c = max(0, a - 2400) + k
    e = rms(sfx[max(0, c - 9600): c + 9600]); v = rms(voice_music[max(0, a - 9600): a + 9600])
    rows.append((t, tier, kind, e - v))
for tier in ('ACCENT', 'foley'):
    d = np.array([r[3] for r in rows if r[1] == tier]); print(f'{tier}: n={len(d)}  effect vs voice+music  median {np.median(d):+.1f} dB  range {d.min():+.1f} .. {d.max():+.1f}')
print('loudest five:', ', '.join(f'{k}@{t:.2f} {x:+.1f}' for t, _, k, x in sorted(rows, key=lambda r: -r[3])[:5]))
print('quietest five:', ', '.join(f'{k}@{t:.2f} {x:+.1f}' for t, _, k, x in sorted(rows, key=lambda r: r[3])[:5]))
print('true peak of pre-master', round(20 * np.log10(np.max(np.abs(pre)) + 1e-9), 1), 'dBFS')
