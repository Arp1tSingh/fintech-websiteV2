/**
 * Acceptance checks from DESIGN.md section 10, plus the accessibility
 * guarantees in DESIGN_BRIEF.md section 6. Runs against dist/ through an
 * in-process route shim: no dev server, no bound port.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

const results = [];
const ok = (name, pass, detail = "") => results.push({ name, pass, detail });

/* ---------------------------------------- 1. no shadow / blur / glow ----- */
{
  const cssFile = fs.readdirSync(path.join(dist, "assets")).find((f) => f.endsWith(".css"));
  const css = fs.readFileSync(path.join(dist, "assets", cssFile), "utf8");

  // Tailwind v4 ships baseline declarations for its shadow/blur custom
  // properties (`--tw-shadow`, `--tw-blur`, `--tw-backdrop-blur`, …). Those are
  // empty by default and are not effects; only literal values count.
  const isReal = (v) => v.trim() !== "" && !/^var\(--tw-/.test(v.trim());
  const find = (re) => [...css.matchAll(re)].map((m) => m[1].trim()).filter(isReal);

  const bad = [
    ...find(/box-shadow:\s*(?!none)([^;}]*)/g).map((v) => `box-shadow: ${v}`),
    ...find(/(?<!-webkit-)\bfilter:\s*(?!none)([^;}]*)/g).map((v) => `filter: ${v}`),
    ...find(/backdrop-filter:\s*([^;}]*)/g).map((v) => `backdrop-filter: ${v}`),
    ...find(/text-shadow:\s*(?!none)([^;}]*)/g).map((v) => `text-shadow: ${v}`),
  ];
  ok("no box-shadow / blur / glow in compiled CSS", bad.length === 0, bad.join(" ; "));
}

/* ------------------------------------------------------------ browser ---- */
const browser = await chromium.launch();

async function newPage(ctxOpts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...ctxOpts });
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
  return { ctx, page, errors };
}

/* ------------------------- 2. reverse scroll reverses every animation ---- */
{
  const { ctx, page, errors } = await newPage();
  await page.goto("http://localhost/?debug=1", { waitUntil: "load" });
  await page.waitForTimeout(1500);

  const snapshot = () =>
    page.evaluate(() => {
      const track = document.querySelector(".goals__track");
      const red = [...document.querySelectorAll(".entry__redacted")];
      return {
        i: getComputedStyle(track).getPropertyValue("--i").trim(),
        redactions: red.map((el) =>
          [...el.querySelectorAll("[data-bar]")].map((b) => getComputedStyle(b).transform),
        ),
      };
    });

  // Let the one-shot tweens settle before reading: their phase depends on how
  // long they have been running, not on stuck state.
  const settle = 1400;

  await page.evaluate(() => window.ft.progress(0.4, true));
  await page.waitForTimeout(settle);
  const down = await snapshot();

  await page.evaluate(() => window.ft.progress(0.05, true));
  await page.waitForTimeout(settle);
  const backTop = await snapshot();

  await page.evaluate(() => window.ft.progress(0.4, true));
  await page.waitForTimeout(settle);
  const downAgain = await snapshot();

  ok(
    "scrolling back up reverses state (no residue from forward play)",
    JSON.stringify(down) === JSON.stringify(downAgain),
    `forward=${JSON.stringify(down)} returned=${JSON.stringify(downAgain)}`,
  );
  ok("state actually changed between positions", JSON.stringify(down) !== JSON.stringify(backTop));

  /* ---------------------- 3. anchor nav lands with the right drawer ---- */
  await page.evaluate(() => window.ft.progress(0, true));
  await page.waitForTimeout(150);
  await page.click('.nav__link[href="#goals"]');
  await page.waitForTimeout(1800);
  const afterAnchor = await page.evaluate(() => {
    const el = document.getElementById("goals");
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), height: Math.round(r.height) };
  });
  ok(
    "anchor nav lands at the top of its section",
    Math.abs(afterAnchor.top) < 90,
    `goals top after anchor = ${afterAnchor.top}px`,
  );

  /* ------------------- 3b. the canvas is decorative, before removal ---- */
  const aria = await page.evaluate(() => document.querySelector(".vault-canvas")?.getAttribute("aria-hidden") === "true");
  ok("canvas is aria-hidden", aria);

  /* -------- 4. every section's panel is opaque and visible when owned --- */
  // innerText only returns rendered text, so walk each section into view and
  // confirm its panel is actually shown rather than faded out by the handover.
  const sectionVisibility = [];
  for (const id of ["hero", "about", "goals", "events", "committee"]) {
    const r = await page.evaluate(async (sectionId) => {
      const el = document.getElementById(sectionId);
      const top = el.getBoundingClientRect().top + window.scrollY;
      const mid = top + Math.min(el.offsetHeight - window.innerHeight, 0) / 2 + window.innerHeight / 2;
      window.scrollTo({ top: mid, behavior: "auto" });
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
      const panel = el.querySelector(".section__panel");
      const cs = getComputedStyle(panel);
      const card = panel.querySelector(".panel");
      const cardBg = card ? getComputedStyle(card).backgroundColor : "none";
      return {
        id: sectionId,
        opacity: Number(cs.opacity),
        visibility: cs.visibility,
        cardBg,
        hasText: (panel.textContent ?? "").trim().length > 40,
        hasTitle: Boolean(panel.querySelector(".hero__title")),
      };
    }, id);
    sectionVisibility.push(r);
  }
  ok(
    "each section's panel is visible and on an opaque card when it owns the viewport",
    sectionVisibility.every((s) =>
      s.opacity > 0.95 && s.visibility === "visible" &&
      // The hero is wordmark-only by owner request: the title sits directly on
      // the 3D door (the poster composition), so it has no card and little text.
      (s.id === "hero" ? s.hasTitle : s.hasText && s.cardBg !== "rgba(0, 0, 0, 0)"),
    ),
    JSON.stringify(sectionVisibility),
  );

  /* ------------------------- 5. page usable with the canvas removed ---- */
  const withoutCanvas = await page.evaluate(() => {
    document.querySelector(".vault-canvas")?.remove();
    // textContent, not innerText: this is "is the content in the DOM".
    const text = document.body.textContent ?? "";
    return {
      hasAbout: text.includes("Fintech VIT is the fintech committee"),
      hasGoal: text.includes("Learn by doing"),
      hasExecs: ["Sanika Chandankar", "Jatin Sharma", "Ajinkya Repale"].every((n) => text.includes(n)),
      canvasGone: !document.querySelector(".vault-canvas"),
      copyButtons: document.querySelectorAll(".member__copy").length,
    };
  });
  ok(
    "page content intact with the canvas removed",
    withoutCanvas.canvasGone && withoutCanvas.hasAbout && withoutCanvas.hasGoal && withoutCanvas.hasExecs,
    JSON.stringify(withoutCanvas),
  );
  ok("three copy-number buttons, one per exec", withoutCanvas.copyButtons === 3, `found ${withoutCanvas.copyButtons}`);

  /* ----------------- 6. exec numbers copy, and live nowhere as text ----- */
  // Numbers must not be readable off the page (that was the point of removing
  // the slips); they only leave through the copy button.
  const phonePlacement = await page.evaluate(() => {
    const text = document.body.textContent ?? "";
    return { asText: /\+44|\+91/.test(text) };
  });
  ok("phone numbers appear nowhere as page text", !phonePlacement.asText, JSON.stringify(phonePlacement));

  /* --------------------------- 7. redaction does not hide text -------- */
  const redaction = await page.evaluate(() => {
    const el = document.querySelector(".entry--2 .entry__redacted");
    const bars = [...el.querySelectorAll(".redaction")];
    return {
      barsHidden: bars.every((b) => b.getAttribute("aria-hidden") === "true"),
      // textContent: innerText would drop this entry because its panel is
      // faded out wherever the page happens to be parked.
      textPresent: (el.textContent ?? "").includes("financial scams"),
    };
  });
  ok("redaction bars are decorative, text still present", redaction.barsHidden && redaction.textPresent, JSON.stringify(redaction));

  /* ------------------------ 8. split text keeps a clean aria-label ----- */
  const ariaLabel = await page.evaluate(() => {
    const h1 = document.querySelector(".hero__title");
    return {
      label: h1.querySelector(".visually-hidden")?.textContent,
      fragments: h1.querySelectorAll('[aria-hidden="true"] .mask-line').length,
    };
  });
  ok("hero wordmark is one aria-label, not 11 fragments", ariaLabel.label === "FINTECH VIT" && ariaLabel.fragments > 5, JSON.stringify(ariaLabel));

  /* ---------------------------- 9. every section has a heading --------- */
  const headings = await page.evaluate(() =>
    [...document.querySelectorAll("section[id]")].map((s) => ({
      id: s.id,
      label: s.getAttribute("aria-label"),
      heading: s.querySelector("h1, h2")?.textContent?.trim().slice(0, 40) ?? null,
    })),
  );
  ok(
    "every section is labelled and has a heading",
    headings.every((h) => h.label || h.heading),
    JSON.stringify(headings),
  );

  ok("no page errors during the interaction pass", errors.length === 0, errors.join(" | "));
  await ctx.close();
}

/* ------------------------------------ 10. no-WebGL fallback ------------ */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // Kill WebGL before any app code runs.
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (String(type).includes("webgl")) return null;
      return orig.call(this, type, ...rest);
    };
  });
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    const rel = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = path.join(dist, rel);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      route.fulfill({ status: 200, body: fs.readFileSync(file), contentType: MIME[path.extname(file)] ?? "application/octet-stream" });
    } else route.fulfill({ status: 404, body: "nf" });
  });
  await page.goto("http://localhost/", { waitUntil: "load" });
  await page.waitForTimeout(1200);
  const fb = await page.evaluate(() => ({
    canvas: Boolean(document.querySelector("canvas")),
    fallback: Boolean(document.querySelector(".static-backdrop")),
    hasCopy: (document.body.textContent ?? "").includes("Learn by doing"),
    hasAbout: (document.body.textContent ?? "").includes("Fintech VIT is the fintech committee"),
    height: document.documentElement.scrollHeight,
  }));
  ok(
    "no WebGL: static fallback renders and the page still works",
    !fb.canvas && fb.fallback && fb.hasCopy && fb.hasAbout && fb.height > 3000,
    JSON.stringify(fb),
  );
  ok("no page errors in the no-WebGL tier", errors.length === 0, errors.join(" | "));
  await page.screenshot({ path: "shots/nowebgl-fallback.png" });
  await ctx.close();
}

await browser.close();

/* -------------------------------------------------------------- report --- */
let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `\n        ${r.detail}` : ""}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exitCode = failed ? 1 : 0;