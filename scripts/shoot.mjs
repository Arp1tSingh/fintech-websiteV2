/**
 * Screenshot pass. Serves dist/ through an in-process Playwright route shim, so
 * no dev server and no bound port is involved — the page runs exactly as the
 * production bundle would.
 *
 *   node scripts/shoot.mjs [--reduced] [--out shots]
 */
import { chromium } from "playwright";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const dist = path.resolve("dist");
const args = process.argv.slice(2);
const reduced = args.includes("--reduced");
const outDir = path.resolve(args.includes("--out") ? args[args.indexOf("--out") + 1] : "shots");
fs.mkdirSync(outDir, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

/**
 * The scroll positions that matter: one per DESIGN.md beat. Each is chosen to
 * sit inside its section's STICKY window, not merely inside its progress range
 * — a panel that has started scrolling away is not what the section looks like
 * when it owns the viewport.
 */
const BEATS = [
  ["00-hero", 0.02],
  ["01-about", 0.15],
  ["02-through-door", 0.26],
  ["03-goal-01", 0.3645],
  ["04-goal-03", 0.4745],
  ["05-goal-05", 0.5805],
  ["06-events", 0.665],
  ["07-events-ledger", 0.695],
  ["08-committee", 0.8],
  ["09-contact", 0.955],
  ["10-door-shut", 0.999],
];

const VIEWPORTS = [
  ["1440x900", 1440, 900],
  ["1280x800", 1280, 800],
  ["768x1024", 768, 1024],
  ["390x844", 390, 844],
];

const browser = await chromium.launch();
const errors = [];

for (const [label, width, height] of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();

  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[${label}] console: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[${label}] pageerror: ${e.message}\n${e.stack ?? ""}`));

  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    const rel = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = path.join(dist, rel);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      route.fulfill({
        status: 200,
        body: fs.readFileSync(file),
        contentType: MIME[path.extname(file)] ?? "application/octet-stream",
      });
    } else {
      route.fulfill({ status: 404, body: "not found" });
    }
  });

  await page.goto("http://localhost/?debug=1", { waitUntil: "load" });
  await page.waitForTimeout(reduced ? 2500 : 1500);

  const info = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    const hasFt = "ft" in window;
    return {
      canvas: Boolean(c),
      canvasSize: c ? `${c.width}x${c.height}` : null,
      hasFt,
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
      sections: [...document.querySelectorAll("section[id]")].map((s) => `${s.id}:${Math.round(s.getBoundingClientRect().height)}`),
      reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  });

  console.log(`\n=== ${label}${reduced ? " (reduced-motion)" : ""} ===`);
  console.log(JSON.stringify(info, null, 1));

  if (info.hasFt) {
    for (const [name, p] of BEATS) {
      // Scroll the document for real AND let the 3D follow: the master progress
      // is derived from scroll position, so both have to move together.
      await page.evaluate((v) => window.ft.progress(v, true), p);
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
      );
      await page.waitForTimeout(260);
      const file = path.join(outDir, `${reduced ? "rm-" : ""}${label}-${name}.png`);
      await page.screenshot({ path: file });
    }
    console.log(`wrote ${BEATS.length} shots to ${outDir}`);
  }

  await ctx.close();
}

await browser.close();

if (errors.length) {
  console.log("\n--- PAGE ERRORS ---");
  for (const e of [...new Set(errors)]) console.log(e);
  process.exitCode = 1;
} else {
  console.log("\nno console or page errors");
}