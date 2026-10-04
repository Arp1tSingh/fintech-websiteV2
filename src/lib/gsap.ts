import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

/**
 * One place for every reduced-motion decision (DESIGN_BRIEF.md section 6).
 * Everything animated goes through gsap.matchMedia() with these queries, so
 * "no pinning, no scrub, no ticker; show final states instantly" is a single
 * flip rather than a scattering of `if` statements.
 */
export const mm = {
  /** Full experience: pinning, scrubbed reveals, ticker. */
  full: "(prefers-reduced-motion: no-preference)",
  /** Reduced motion: final states, no scrub. */
  still: "(prefers-reduced-motion: reduce)",
  /** Mobile gets the vertical stack instead of the horizontal pinned track. */
  desktop: "(min-width: 768px)",
  mobile: "(max-width: 767.98px)",
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Puts a set of SVG paths into the "not yet drawn" state.
 *
 * Set per path rather than in one call with an array: with multiple targets an
 * array value gets distributed across them instead of applied to each, and the
 * dash lengths differ per path anyway.
 */
export function dashSet(paths: SVGPathElement[], hidden: boolean): void {
  paths.forEach((p) => {
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: hidden ? len : 0 });
  });
}

export function refreshScroll(): void {
  ScrollTrigger.refresh();
}