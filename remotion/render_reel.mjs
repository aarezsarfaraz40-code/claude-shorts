#!/usr/bin/env node
/**
 * Render one GtaReel from a spec JSON.
 *
 *   node render_reel.mjs --spec reels/specs/r01.json --assets-dir DIR --out out.mp4
 *
 * All file names in the spec (trailer, voiceover, logo, sfx) are relative
 * to --assets-dir, which is served over a local HTTP server during render.
 */
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import http from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, v, i, a) => (i % 2 === 0 ? [...acc, [v.replace(/^--/, ""), a[i + 1]]] : acc), [])
);
if (!args.spec || !args["assets-dir"] || !args.out) {
  console.error("usage: node render_reel.mjs --spec FILE --assets-dir DIR --out FILE [--scale 1]");
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(args.spec, "utf-8"));
const assetsDir = path.resolve(args["assets-dir"]);
const TYPES = { ".mp4": "video/mp4", ".wav": "audio/wav", ".mp3": "audio/mpeg", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

const server = http.createServer((req, res) => {
  const fp = path.join(assetsDir, decodeURIComponent(req.url.split("?")[0].slice(1)));
  if (!fp.startsWith(assetsDir) || !fs.existsSync(fp)) { res.writeHead(404); return res.end(); }
  const size = fs.statSync(fp).size;
  const type = TYPES[path.extname(fp).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range;
  if (range) {
    const [a, b] = range.replace("bytes=", "").split("-");
    const start = parseInt(a, 10), end = b ? parseInt(b, 10) : size - 1;
    res.writeHead(206, { "Access-Control-Allow-Origin": "*", "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1, "Content-Type": type });
    return fs.createReadStream(fp, { start, end }).pipe(res);
  }
  res.writeHead(200, { "Access-Control-Allow-Origin": "*", "Content-Length": size, "Content-Type": type, "Accept-Ranges": "bytes" });
  fs.createReadStream(fp).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const assetBase = `http://127.0.0.1:${server.address().port}/`;

const browserExecutable = [
  process.env.REMOTION_BROWSER_EXECUTABLE,
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
  "/opt/pw-browsers/headless_shell_as_downloaded/chrome-headless-shell",
].filter(Boolean).find((p) => fs.existsSync(p)) || null;

const inputProps = { ...spec, assetBase };
const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve(__dirname, "src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });
try {
  const composition = await selectComposition({ serveUrl, id: "GtaReel", inputProps, puppeteerInstance: browser, browserExecutable });
  let last = -1;
  await renderMedia({
    composition, serveUrl, codec: "h264", crf: 18, outputLocation: path.resolve(args.out),
    inputProps, puppeteerInstance: browser, browserExecutable,
    scale: args.scale ? Number(args.scale) : 1,
    frameRange: args.frames ? args.frames.split("-").map(Number) : undefined,
    onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p !== last) { last = p; console.log(JSON.stringify({ progress: p * 10 })); } },
  });
  console.log(JSON.stringify({ action: "render_reel", out: args.out, seconds: ((Date.now() - t0) / 1000).toFixed(1) }));
} finally {
  await browser.close({ silent: true });
  server.close();
}
