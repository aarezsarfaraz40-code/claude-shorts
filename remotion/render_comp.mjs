#!/usr/bin/env node
// Render any composition with static assets: node render_comp.mjs --comp BazaarPromo --out file.mp4 [--frames a-b]
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const a = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => (i % 2 === 0 ? [...acc, [v.replace(/^--/, ""), arr[i + 1]]] : acc), []));
const browserExecutable = [process.env.REMOTION_BROWSER_EXECUTABLE, "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"].filter(Boolean).find((p) => fs.existsSync(p)) || null;
const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve(__dirname, "src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });
try {
  const composition = await selectComposition({ serveUrl, id: a.comp, inputProps: {}, puppeteerInstance: browser, browserExecutable });
  await renderMedia({ composition, serveUrl, codec: "h264", crf: 18, outputLocation: path.resolve(a.out), inputProps: {}, puppeteerInstance: browser, browserExecutable, frameRange: a.frames ? a.frames.split("-").map(Number) : undefined });
  console.log(JSON.stringify({ action: "render", comp: a.comp, out: a.out, seconds: ((Date.now() - t0) / 1000).toFixed(1) }));
} finally {
  await browser.close({ silent: true });
}
