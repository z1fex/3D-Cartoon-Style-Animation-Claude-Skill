// Where the tools find FFmpeg, Chrome and Playwright, in one place. Each can be set with an environment variable;
// otherwise the tools use `ffmpeg` from your PATH and the Playwright that `npm install` puts in this package.
// See ../../README.md, "Set up".
//   CARTOON_FFMPEG       ffmpeg (ffprobe must sit beside it or be on your PATH); default: `ffmpeg` on your PATH
//   CARTOON_CHROME       optional: a Chrome or chrome-headless-shell with GPU WebGL2; default: Playwright's own Chromium
//   CARTOON_PLAYWRIGHT   optional: a node_modules folder that contains `playwright`; default: this package's node_modules
// sound.py and sfx-levels.py read CARTOON_FFMPEG too, and are run with any Python 3.10+ that has NumPy.
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
export const FFMPEG = process.env.CARTOON_FFMPEG || 'ffmpeg';
export const FFPROBE = FFMPEG.replace(/ffmpeg(\.exe)?$/i, m => m.replace(/ffmpeg/i, 'ffprobe'));
export const CHROME = process.env.CARTOON_CHROME || undefined;

/** The `chromium` launcher from Playwright: the CARTOON_PLAYWRIGHT folder if set, else this package's node_modules. */
export function chromium() {
  const dir = process.env.CARTOON_PLAYWRIGHT;
  try { return require(dir ? path.join(dir, 'playwright') : 'playwright').chromium; }
  catch { throw Error('Playwright was not found. Run `npm install` in the package folder, or set CARTOON_PLAYWRIGHT.'); }
}

/** GPU flags for WebGL2 in headless Chrome: Direct3D 11 on Windows, Metal on macOS, the default elsewhere. */
export const GPU_ARGS = [
  ...({ win32: ['--use-angle=d3d11'], darwin: ['--use-angle=metal'] }[process.platform] ?? []),
  '--enable-gpu', '--ignore-gpu-blocklist',
];
