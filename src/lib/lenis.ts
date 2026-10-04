import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "./gsap";

/**
 * Lenis + ScrollTrigger wiring — verbatim from DESIGN_BRIEF.md section 5.
 * Lenis is the ONLY smoothing layer; the 3D camera adds none of its own
 * (DESIGN.md section 5, "Camera").
 */
let lenis: Lenis | null = null;
let started = false;
/**
 * The exact ticker callback we registered. `gsap.ticker.remove` matches by
 * reference, and `lenis.raf` is a bound method — passing that instead would
 * silently fail to unregister and leak a dead callback on every remount.
 */
let tick: ((time: number) => void) | null = null;

export function initScroll(): Lenis | null {
  if (started) return lenis;
  started = true;

  // Reduced motion: no smooth-scroll hijack, native scrolling stays native.
  if (prefersReducedMotion()) {
    lenis = null;
    return null;
  }

  lenis = new Lenis({
    lerp: 0.1,
    smoothWheel: true,
    // Sync with ScrollTrigger's own resize/scroll bookkeeping.
    autoRaf: false,
  });

  lenis.on("scroll", ScrollTrigger.update);
  tick = (t: number) => lenis?.raf(t * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function destroyScroll(): void {
  if (lenis && tick) gsap.ticker.remove(tick);
  tick = null;
  lenis?.destroy();
  lenis = null;
  started = false;
}

/** Anchor nav: lenis.scrollTo(target, { offset: -80 }) instead of hash jumps. */
export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, { offset: -80, duration: 1.2 });
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "auto" });
  }
}

export function scrollToProgress(p: number, immediate = false): void {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const top = max * p;
  if (lenis) lenis.scrollTo(top, immediate ? { immediate: true } : { duration: 1.2 });
  else window.scrollTo({ top, behavior: "auto" });
}