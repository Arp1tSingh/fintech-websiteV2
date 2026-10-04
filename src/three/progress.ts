/**
 * The one shared scroll value (DESIGN.md section 2).
 *
 * ScrollTrigger writes `progress`; useFrame reads it. No other source of
 * truth, and deliberately NOT React state — re-rendering the tree every frame
 * is what kills the frame budget.
 */
export interface ScrollState {
  /** master scroll progress, 0..1 */
  progress: number;
  /** pointer position, -1..1, for the optional desktop parallax */
  pointerX: number;
  pointerY: number;
  /** true while the dev scrub slider is overriding progress */
  scrubbing: boolean;
  /** last measured frames per second, for the auto-tier */
  fps: number;
}

export const scroll: ScrollState = {
  progress: 0,
  pointerX: 0,
  pointerY: 0,
  scrubbing: false,
  fps: 60,
};

export function setProgress(p: number): void {
  scroll.progress = p;
}

/** Used by the dev slider in development (DESIGN.md section 9, step 1). */
export function setScrubProgress(p: number | null): void {
  if (p === null) {
    releaseScrub();
    return;
  }
  scroll.scrubbing = true;
  scroll.progress = Math.min(1, Math.max(0, p));
}

/**
 * Hands control back to the scroll.
 *
 * Releasing has to actively re-derive progress from the current scroll position.
 * ScrollTrigger only writes progress on its next update, so simply clearing the
 * flag would leave the scene parked wherever the slider was last left — which is
 * how the scrubber used to be able to freeze the vault with no way back.
 */
export function releaseScrub(): void {
  scroll.scrubbing = false;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  scroll.progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}

export function setPointer(x: number, y: number): void {
  scroll.pointerX = x;
  scroll.pointerY = y;
}

/* ------------------------------------------------------------- tiers ---- */

export type Tier = "high" | "low" | "poster";

export interface Runtime {
  tier: Tier;
  reducedMotion: boolean;
  /** mobile halves the drawer count and caps DPR at 1.25 (DESIGN.md section 7) */
  mobile: boolean;
  webgl: boolean;
}

export const runtime: Runtime = {
  tier: "high",
  reducedMotion: false,
  mobile: false,
  webgl: true,
};

/**
 * Auto-tiering.
 *
 * Two deliberate deviations from DESIGN.md section 7, both agreed with the user:
 *
 *  1. The low tier keeps fog and keeps outlines, and only halves the drawer
 *     count. The brief's "no fog, no outlines on instanced meshes" is a poor
 *     trade in a scene with no lights, no shading and no PBR: outlines and fog
 *     ARE the depth cues, so dropping them does not degrade the scene, it
 *     deletes the only things that make the camera's movement legible.
 *
 *  2. Auto-tiering never runs in development. A dev machine is slow for reasons
 *     that say nothing about a visitor's machine — unminified React, StrictMode
 *     double-rendering, HMR — and demoting there hides the scene behind a
 *     one-line latch. Real users are the only audience whose framerate counts.
 */
const AUTO_TIER = import.meta.env.PROD;
const LOW_TIER_FPS = 45;
const LOW_TIER_HOLD_MS = 4000;

let accum = 0;
let frames = 0;
let lowSince = 0;
let tierLocked = false;

export function sampleFps(dtMs: number): void {
  if (!AUTO_TIER) return;
  if (dtMs <= 0 || dtMs > 500) return;
  accum += dtMs;
  frames += 1;
  if (accum < 500) return;

  const fps = (frames * 1000) / accum;
  scroll.fps = fps;
  accum = 0;
  frames = 0;

  if (tierLocked || runtime.tier !== "high") return;

  if (fps < LOW_TIER_FPS) {
    if (lowSince === 0) lowSince = performance.now();
    else if (performance.now() - lowSince > LOW_TIER_HOLD_MS) {
      runtime.tier = "low";
      tierLocked = true;
    }
  } else {
    lowSince = 0;
  }
}