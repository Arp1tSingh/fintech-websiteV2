/**
 * Fine-grained motion probe.
 *
 * Samples finely THROUGH each section boundary rather than at a few coarse
 * positions, so an entrance that plays over 0.7s is actually caught mid-flight
 * instead of being sampled only after it has finished.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2" };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.route("**/*", (route) => {
  const url = new URL(route.request().url());
  const rel = url.pathname === "/" ? "/index.html" : url.pathname;
  const file = path.join(dist, rel);
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    route.fulfill({ status: 200, body: fs.readFileSync(file), contentType: MIME[path.extname(file)] ?? "application/octet-stream" });
  } else route.fulfill({ status: 404, body: "nf" });
});
await page.goto("http://localhost/", { waitUntil: "load" });
await page.waitForTimeout(2500);

const probe = () =>
  page.evaluate(() => {
    const g = (sel, prop) => {
      const el = document.querySelector(sel);
      return el ? Number(getComputedStyle(el)[prop]).toFixed(2) : "NA";
    };
    const scaleX = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return "NA";
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return Number.isFinite(m.a) ? m.a.toFixed(2) : "NA";
    };
    const dash = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return "NA";
      const v = parseFloat(getComputedStyle(el).strokeDashoffset);
      return Number.isFinite(v) ? v.toFixed(0) : "NA";
    };
    return {
      p: (window.scrollY / (document.documentElement.scrollHeight - innerHeight)).toFixed(3),
      aboutWord: g(".about__body [data-word]", "opacity"),
      aboutStrike: dash(".about__strike path"),
      goalsI: getComputedStyle(document.querySelector(".goals__track")).getPropertyValue("--i").trim().slice(0, 5),
      redactBar: scaleX(".entry__redacted [data-bar]"),
      barMotif: (() => {
        const r = document.querySelector(".entry--1 .motif rect");
        return r ? getComputedStyle(r).transform.slice(7, 20) : "NA";
      })(),
      nodeLink: dash(".event .motif--wide [data-link]"),
      // The entrance tween is on the .event wrapper, not the inner panel.
      eventWrap: g(".event", "opacity"),
      eventRedact: scaleX(".event--inverted [data-redact]"),
      stamp: g(".event__stamp", "opacity"),
      // The Contact slips are gone; the committee panel's own handover fade
      // takes this slot in the animation census.
      committeePanel: g("#committee .section__panel", "opacity"),
    };
  });

const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
await page.mouse.move(700, 450);

// Walk the whole journey in small steps so nothing is missed, then report the
// min/max each property reaches.
const seen = {};
const track = (s) => {
  for (const [k, v] of Object.entries(s)) {
    if (k === "p") continue;
    (seen[k] ??= new Set()).add(String(v));
  }
};

const STEPS = 70;
for (let i = 0; i <= STEPS; i++) {
  const want = Math.round(maxScroll * (i / STEPS));
  let guard = 0;
  while (Math.abs((await page.evaluate(() => window.scrollY)) - want) > 40 && guard++ < 80) {
    const cur = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, Math.max(-600, Math.min(600, want - cur)));
    await page.waitForTimeout(14);
  }
  await page.waitForTimeout(70);
  track(await probe());
}

const pad = (v, n) => String(v).padEnd(n).slice(0, n);
console.log(`=== values reached across the journey (${STEPS} steps) ===`);
const stuck = [];
for (const [k, set] of Object.entries(seen)) {
  const vals = [...set];
  const animates = vals.length > 1;
  if (!animates) stuck.push(k);
  console.log(`  ${pad(k, 13)} ${pad(animates ? "animates" : "NEVER CHANGES", 14)} ${vals.length} distinct  e.g. ${vals.slice(0, 5).join(" | ")}`);
}

console.log("\n=== the events entrance, watched while it plays ===");
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
for (let i = 0; i < 10; i++) {
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(60);
}
for (let i = 0; i < 12; i++) {
  const s = await probe();
  console.log(`  p=${s.p}  eventWrap=${s.eventWrap}  stamp=${s.stamp}  eventRedact=${s.eventRedact}`);
  await page.mouse.wheel(0, 90);
  await page.waitForTimeout(60);
}

if (errors.length) {
  console.log("\n--- ERRORS ---");
  for (const e of [...new Set(errors)]) console.log("  " + e);
}
console.log(stuck.length ? `\nSTILL STATIC: ${stuck.join(", ")}` : "\neverything animates");
await browser.close();