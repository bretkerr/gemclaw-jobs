// render.mjs — headless Chromium calls drawFrame(t) for every frame and pipes PNGs to ffmpeg.
//   node render.mjs stills 0.5 8.7 ...   -> build/stills/t_XX.png
//   node render.mjs audio                -> build/music.wav (the Web Audio score)
//   node render.mjs video [workers]      -> build/video.mp4 (silent)
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { extname, join } from "node:path";
const { chromium } = await import("playwright").catch(() => import("/opt/node22/lib/node_modules/playwright/index.mjs"));

const ROOT = new URL(".", import.meta.url).pathname;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".woff2": "font/woff2" };
const server = createServer(async (req, res) => {
  try {
    const p = join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
    res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
    res.end(await readFile(p));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const URL_ = `http://127.0.0.1:${server.address().port}/index.html`;

const browser = await chromium.launch({ args: ["--disable-gpu", "--font-render-hinting=none", "--autoplay-policy=no-user-gesture-required"] });
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("pageerror:", e.message));
  page.on("console", (m) => m.type() === "error" && console.error("console:", m.text()));
  await page.goto(URL_);
  await page.evaluate(() => window.ready);
  return page;
}
async function shot(page, t) {
  await page.evaluate((t) => window.drawFrame(t), t);
  return page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1080, height: 1920 } });
}

const [mode, ...rest] = process.argv.slice(2);
await mkdir(join(ROOT, "build"), { recursive: true });
if (mode === "stills") {
  await mkdir(join(ROOT, "build/stills"), { recursive: true });
  const page = await openPage();
  for (const s of rest) {
    const t = Number(s);
    await writeFile(join(ROOT, `build/stills/t_${t.toFixed(2).padStart(5, "0")}.png`), await shot(page, t));
  }
} else if (mode === "audio") {
  const page = await openPage();
  const t0 = Date.now();
  const b64 = await page.evaluate(async () => {
    const r = await window.SCORE.render();
    console.log("peak", r.peak);
    return window.SCORE.wavBase64(r);
  });
  await writeFile(join(ROOT, "build/music.wav"), Buffer.from(b64, "base64"));
  console.log(`music rendered in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
} else if (mode === "video") {
  const workers = Number(rest[0] || 4);
  const fps = 30;
  const total = 90 * fps;
  const per = Math.ceil(total / workers);
  const t0 = Date.now();
  let done = 0;
  await Promise.all(
    Array.from({ length: workers }, async (_, w) => {
      const a = w * per;
      const b = Math.min(total, a + per);
      const page = await openPage();
      const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
        "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-threads", "1",
        join(ROOT, `build/part${w}.mp4`)], { stdio: ["pipe", "inherit", "inherit"] });
      const closed = new Promise((r) => ff.on("close", r));
      for (let f = a; f < b; f++) {
        const png = await shot(page, f / fps);
        if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
        if (++done % 150 === 0) console.log(`${done}/${total} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      }
      ff.stdin.end();
      await closed;
    }),
  );
  const list = Array.from({ length: workers }, (_, w) => `file 'part${w}.mp4'`).join("\n");
  await writeFile(join(ROOT, "build/parts.txt"), list + "\n");
  await new Promise((r) =>
    spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", join(ROOT, "build/parts.txt"), "-c", "copy", join(ROOT, "build/video.mp4")], {
      stdio: "inherit",
    }).on("close", r),
  );
  console.log(`video rendered in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
server.close();
