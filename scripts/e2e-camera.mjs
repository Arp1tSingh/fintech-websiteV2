/**
 * End-to-end proof that the vault MOVES.
 *
 * The earlier suites checked DOM properties and would happily pass with a frozen
 * camera, which is exactly what went unnoticed. This reads the live three.js
 * camera position at every step of a real wheel-driven scroll and asserts it
 * travels through each range of the DESIGN.md section 5 choreography — with the
 * About push (0.08-0.22) asserted explicitly, because that is where the camera
 * used to sit parked.
 *
 *   node scripts/e2e-camera.mjs [--url http://localhost:5173] [--out shots]
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : fallback;
};

const dist = path.resolve("dist");
const SERVE_DIST = argv.includes("--dist");
/** Not named URL: that would shadow the global URL constructor used below. */
const TARGET = arg("--url", SERVE_DIST ? "http://localhost/" : "http://localhost:5173/");
const OUT = arg("--out", "shots/e2e");
const WIDTH = Number(arg("--width", 1440));
const HEIGHT = Number(arg("--height", 900));

fs.mkdirSync(OUT, { recursive: true });

const results = [];
const ok = (name, pass, detail = "") => results.push({ name, pass, detail });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

/**
 * The choreography that must actually happen (DESIGN.md section 5), as
 * [label, fromProgress, toProgress, what must change].
 */
const BEATS = [
  ["hero", 0.0, 0.08, "slow breathing push-in"],
  ["about", 0.08, 0.22, "camera pushes toward the opening"],
  ["through-door", 0.22, 0.3, "camera passes through the doorway"],
  ["goals", 0.3, 0.62, "dolly the corridor, stop at five drawers"],
  ["events", 0.62, 0.78, "arc around the two lockers"],
  ["committee", 0.78, 0.9, "rises slightly in the chamber"],
  // The Contact DOM section is gone, but its 0.90-1.00 range still drives the
  // retreat and the door shutting — the runway stays, the section does not.
  ["outro", 0.9, 1.0, "pulls back out and the door shuts"],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

if (SERVE_DIST) {
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    const rel = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = path.join(dist, rel);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      route.fulfill({ status: 200, body: fs.readFileSync(file), contentType: MIME[path.extname(file)] ?? "application/octet-stream" });
    } else route.fulfill({ status: 404, body: "nf" });
  });
}

const target = `${TARGET}?debug=1`;
console.log(`=== e2e camera test: ${target} at ${WIDTH}x${HEIGHT} ===`);
await page.goto(target, { waitUntil: "load" });
await page.waitForTimeout(2200);

const hasCamera = await page.evaluate(() => Boolean(window.__ftCamera));
ok("live three.js camera is reachable", hasCamera);
if (!hasCamera) {
  console.log("cannot continue without the camera handle");
  process.exit(1);
}

const readCam = () =>
  page.evaluate(() => {
    const c = window.__ftCamera;
    const scene = window.__ftScene;
    const fog = scene?.fog;
    // Count the outline geometry that is actually being drawn.
    let outlines = 0;
    let outlinesHidden = 0;
    scene?.traverse((o) => {
      if (o.isLineSegments || o.isLine) {
        if (o.visible) outlines += 1;
        else outlinesHidden += 1;
      }
    });
    return {
      x: +c.position.x.toFixed(3),
      y: +c.position.y.toFixed(3),
      z: +c.position.z.toFixed(3),
      fov: +c.fov.toFixed(2),
      fog: fog ? { near: +fog.near.toFixed(2), far: +fog.far.toFixed(2) } : null,
      outlines,
      outlinesHidden,
      tier: window.__ftRuntime?.tier ?? "unknown",
      scrubbing: window.__ftState?.scrubbing ?? false,
      p: +(window.scrollY / (document.documentElement.scrollHeight - innerHeight)).toFixed(4),
    };
  });

const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
await page.mouse.move(Math.round(WIDTH / 2), Math.round(HEIGHT / 2));

/** Drive to a target scroll position with real wheel events. */
async function scrollTo(targetY) {
  let guard = 0;
  while (Math.abs((await page.evaluate(() => window.scrollY)) - targetY) > 25 && guard++ < 400) {
    const cur = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, Math.max(-700, Math.min(700, targetY - cur)));
    await page.waitForTimeout(12);
  }
  await page.waitForTimeout(180);
}

console.log("\n--- walking each beat of the choreography ---");
const perBeat = [];
for (const [label, from, to, intent] of BEATS) {
  await scrollTo(Math.round(maxScroll * from));
  const a = await readCam();
  const midY = Math.round(maxScroll * ((from + to) / 2));
  await scrollTo(midY);
  const m = await readCam();
  await scrollTo(Math.round(maxScroll * to));
  const b = await readCam();

  const travel = (u, v) => Math.hypot(v.x - u.x, v.y - u.y, v.z - u.z);
  const total = travel(a, b);
  const legA = travel(a, m);
  const legB = travel(m, b);
  perBeat.push({ label, a, b, total, legA, legB, intent });

  console.log(
    `  ${label.padEnd(13)} p ${from.toFixed(2)}->${to.toFixed(2)}  ` +
      `z ${String(a.z).padStart(8)} -> ${String(b.z).padStart(8)}  ` +
      `moved ${total.toFixed(2).padStart(7)} units   (${intent})`,
  );
  ok(
    `vault camera travels during "${label}" (${intent})`,
    total > 0.5,
    `moved ${total.toFixed(2)} units`,
  );
}

/* ---- the specific regression: the About push must not be a parked camera ---- */
const about = perBeat.find((b) => b.label === "about");
ok(
  "About (0.08-0.22) is a continuous push, not a park-then-jump",
  about.legA > 0.4 && about.legB > 0.4,
  `first half ${about.legA.toFixed(2)} units, second half ${about.legB.toFixed(2)} units ` +
    `(a parked camera gives ~0 then a lurch)`,
);
ok(
  "About camera closes on the doorway",
  about.b.z < about.a.z - 5,
  `z ${about.a.z} -> ${about.b.z}`,
);

/* ---- depth cues must survive the low tier (option b) ---- */
// Note: this run may well land on the low tier — headless software rendering is
// genuinely slow. That is the auto-tier doing its job. What matters is that the
// low tier does NOT delete the depth cues, which is the whole point of option b.
const cues = [];
for (const f of [0.1, 0.35, 0.5, 0.8]) {
  await scrollTo(Math.round(maxScroll * f));
  const s = await readCam();
  cues.push({ f, tier: s.tier, fog: s.fog, outlines: s.outlines, hidden: s.outlinesHidden });
}
ok(
  "fog stays enabled at every tier (kept per your call, not DESIGN.md §7)",
  cues.every((c) => c.fog && c.fog.far > c.fog.near && c.fog.far < 1000),
  JSON.stringify(cues.map((c) => ({ tier: c.tier, fog: c.fog }))),
);
ok(
  "outlines stay visible at every tier",
  cues.every((c) => c.outlines > 0 && c.hidden === 0),
  JSON.stringify(cues.map((c) => ({ tier: c.tier, outlines: c.outlines, hidden: c.hidden }))),
);
console.log(`\n  tier during this run: ${[...new Set(cues.map((c) => c.tier))].join(", ")}`);
console.log(`  outlines drawn: ${cues.map((c) => c.outlines).join(", ")}`);

/* ---- ultrawide framing ---- */
const fov = (await readCam()).fov;
const expectedAtRef = 46;
ok(
  `horizontal field is held constant at ${WIDTH}px wide`,
  WIDTH / HEIGHT > 1.6 ? fov < expectedAtRef - 0.5 : Math.abs(fov - expectedAtRef) < 0.5,
  `fov ${fov} (vertical 46 authored at 16:10)`,
);

/* ---- the scrubber must not ship, and must never latch ---- */
const scrubber = await page.evaluate(() => Boolean(document.querySelector(".dev-scrub")));
ok(
  SERVE_DIST ? "dev scrubber is absent from the production bundle" : "dev scrubber present in dev",
  SERVE_DIST ? !scrubber : scrubber,
  `found: ${scrubber}`,
);

if (!SERVE_DIST) {
  // Drag the scrubber, release it, and confirm scroll control comes back.
  await scrollTo(Math.round(maxScroll * 0.4));
  await page.click(".dev-scrub__toggle");
  const slider = page.locator(".dev-scrub input[type=range]");
  const box = await slider.boundingBox();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  const heldProgress = (await readCam()).p;
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(500);
  const after = await readCam();
  ok(
    "releasing the scrubber hands control back to the scroll",
    !after.scrubbing && after.p > heldProgress + 0.001,
    `scrubbing=${after.scrubbing}, p ${heldProgress} -> ${after.p}`,
  );
}

/* ---- visual evidence ---- */
const SHOTS = [
  ["a-hero", 0.02],
  ["b-about-push", 0.16],
  ["c-through-door", 0.27],
  ["d-goal-01", 0.375],
  ["e-chamber", 0.7],
  ["f-committee", 0.8],
  ["g-outro", 0.955],
];
for (const [name, f] of SHOTS) {
  await scrollTo(Math.round(maxScroll * f));
  await page.waitForTimeout(260);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}
console.log(`\nscreenshots -> ${OUT}`);

ok("no page or console errors", errors.length === 0, [...new Set(errors)].join(" | "));

await browser.close();

let failed = 0;
console.log("\n=== results ===");
for (const r of results) {
  if (!r.pass) failed++;
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `\n        ${r.detail}` : ""}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;