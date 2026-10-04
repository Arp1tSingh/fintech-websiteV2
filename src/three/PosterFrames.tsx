import { useEffect, useRef, useState } from "react";

/**
 * Poster frames for the two fallback tiers (DESIGN.md section 8):
 *
 *  - prefers-reduced-motion: no scrubbed camera. Six stills, one per section,
 *    crossfaded as sections enter.
 *  - no WebGL at all: the same six stills.
 *
 * They are generated FROM the scene rather than shipped as images, so they
 * always match the live thing. If capture fails for any reason the fallback
 * degrades to a CSS-only ledger composition rather than breaking the page.
 */

export interface Poster {
  /** data URL, or null if capture was not possible */
  src: string | null;
  label: string;
}

/** One still per DOM section, sampled at that section's most representative beat. */
const SAMPLES = [
  { label: "Index", progress: 0.04 },
  { label: "About Us", progress: 0.16 },
  { label: "Goals / Ideology", progress: 0.38 },
  { label: "Upcoming Events", progress: 0.72 },
  { label: "Committee", progress: 0.85 },
  { label: "Contact Us", progress: 0.99 },
];

let posters: Poster[] = SAMPLES.map((s) => ({ src: null, label: s.label }));
const listeners = new Set<() => void>();

export function setPosters(next: Poster[]): void {
  posters = next;
  listeners.forEach((l) => l());
}

export function usePosters(): Poster[] {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return posters;
}

/**
 * Renders the scene once per sample point and reads the pixels back. Uses R3F's
 * `advance` so every useFrame callback (palette, camera, drawer slides) runs
 * exactly as it would during a real frame.
 */
export async function capturePosters(
  render: (progress: number) => string | null,
): Promise<Poster[]> {
  const out: Poster[] = [];
  for (const s of SAMPLES) {
    let src: string | null = null;
    try {
      src = render(s.progress);
    } catch {
      src = null;
    }
    out.push({ src, label: s.label });
    // Yield so a slow device does not jank the first paint.
    await new Promise((r) => setTimeout(r, 0));
  }
  return out;
}

/* ------------------------------------------------------- still placement -- */

/**
 * Exactly one still is on screen at a time, chosen as the section whose midpoint
 * is nearest the middle of the viewport.
 *
 * Two simpler rules both fail. Anchoring each still to the top of its section
 * leaves a bare parchment gap between one section scrolling away and the next
 * arriving, because sections are several screens tall. Letting every section
 * within a screen's reach fade in at once fills that gap but blends two stills
 * into mush for the whole handover. Nearest-midpoint has neither problem: there
 * is always a still filling the viewport, and there is never more than one.
 */
interface Still {
  section: HTMLElement | null;
  host: HTMLElement;
}

const stills = new Set<Still>();
let listening = false;

function placeStills() {
  const mid = window.scrollY + window.innerHeight / 2;
  let nearest: Still | null = null;
  let nearestD = Infinity;

  for (const s of stills) {
    // The no-WebGL backdrop has no section; it always wins.
    if (!s.section) {
      if (nearest) nearest.host.dataset.near = "0";
      nearest = s;
      nearestD = -Infinity;
      continue;
    }
    const r = s.section.getBoundingClientRect();
    const d = Math.abs(r.top + window.scrollY + r.height / 2 - mid);
    if (d < nearestD) {
      nearestD = d;
      nearest = s;
    }
  }

  for (const s of stills) s.host.dataset.near = s === nearest ? "1" : "0";
}

function onScroll() {
  if (stills.size === 0) return;
  requestAnimationFrame(placeStills);
}

function watchStills() {
  if (listening) return;
  listening = true;
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
}

function unwatchStills() {
  if (!listening || stills.size > 0) return;
  listening = false;
  removeEventListener("scroll", onScroll);
  removeEventListener("resize", onScroll);
}

/**
 * The backdrop for one section: its poster still, shown while that section owns
 * the viewport. Purely decorative — the canvas stays aria-hidden and all real
 * content stays in the DOM (DESIGN.md section 8).
 */
export function PosterBackdrop({ index, className = "" }: { index?: number; className?: string }) {
  const list = usePosters();
  const poster = index === undefined ? undefined : list[index];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const still: Still = { section: host.closest("section"), host };
    stills.add(still);
    watchStills();
    placeStills();
    return () => {
      stills.delete(still);
      unwatchStills();
    };
  }, [poster?.src]);

  if (!poster?.src) return null;
  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-near="0"
      className={`poster-backdrop ${className}`}
      style={{ backgroundImage: `url(${poster.src})` }}
    />
  );
}