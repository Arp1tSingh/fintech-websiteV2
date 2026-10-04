import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { gsap, mm, prefersReducedMotion } from "../lib/gsap";
import { readSectionProgress } from "./SectionShell";
import { motion } from "../lib/motion";

/**
 * `gsap.set` that quietly no-ops on an empty target list.
 *
 * GSAP logs "GSAP target [object NodeList] not found" for an empty NodeList and
 * then does nothing at all. Harmless in isolation, but it was masking a genuine
 * no-op: EventCard's leave handler queried `[data-redact]` on every card,
 * including the n8n card, which has none — so on every section exit that branch
 * did nothing while reporting that it had tried.
 */
export function gsapSet(
  targets: Element[] | NodeListOf<Element> | null | undefined,
  vars: gsap.TweenVars,
): void {
  const list = Array.from(targets ?? []);
  if (list.length === 0) return;
  gsap.set(list, vars);
}

/**
 * Plays an entrance when its section actually arrives, and reverses it on the
 * way out.
 *
 * This replaces ScrollTrigger for everything living inside a pinned panel.
 * ScrollTrigger resolves a trigger's position from the element's un-stuck layout
 * box, and for a `position: sticky` panel that box is nowhere near where the
 * element is actually seen — so `start: "top 80%"` reads as already passed on
 * page load, the animation plays off-screen, and the visitor sees no animation
 * at all. Reading the section's own sticky-window progress (`--sp`, written once
 * per frame by the panel crossfade) sidesteps the measurement entirely and
 * matches the brief's `play none none reverse` intent.
 */
export function useEnterWhenVisible(
  target: RefObject<HTMLElement | null>,
  onEnter: () => void,
  threshold = 0.1,
  onLeave?: () => void,
): void {
  const enter = useRef(onEnter);
  const leave = useRef(onLeave);
  enter.current = onEnter;
  leave.current = onLeave;

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const section = el.closest<HTMLElement>("section");
    if (!section) return;

    // Reduced motion: show the final state immediately, no tween at all.
    if (prefersReducedMotion()) {
      enter.current();
      return;
    }

    // Establish the "before" state up front. Without this the element sits at
    // its final value until its section arrives, so the entrance is never seen —
    // and anything drawn (a redaction bar, an SVG line) is briefly visible in a
    // section that has not been reached yet.
    leave.current?.();

    let raf = 0;
    let inside = false;

    // If the element is already on screen when the page loads, play straight
    // away: the hero's ruled lines are drawn as part of its opening, not after
    // a scroll. Anything further down waits for its section to arrive.
    if (el.getBoundingClientRect().top < window.innerHeight) {
      inside = true;
      enter.current();
    }

    const tick = () => {
      const local = readSectionProgress(section);
      if (!inside && local >= threshold) {
        inside = true;
        enter.current();
      } else if (inside && local < threshold * 0.6 && leave.current) {
        inside = false;
        leave.current();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, threshold]);
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

/**
 * Redaction bars — the signature interaction for the scam theme (brief section
 * 3.2). Purely decorative: aria-hidden, and the text underneath is untouched,
 * so nothing is ever hidden from a screen reader.
 */
export function RedactionBar({
  className = "",
  lines = 3,
  delay = 0,
}: {
  className?: string;
  lines?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEnterWhenVisible(
    ref,
    () => {
      const bars = ref.current?.querySelectorAll<HTMLElement>("[data-bar]") ?? [];
      gsap.fromTo(
        bars,
        { scaleX: 1, transformOrigin: "left center" },
        {
          scaleX: 0,
          duration: motion.dur.base,
          ease: motion.ease.inOut,
          stagger: 0.08,
          delay,
        },
      );
    },
    0.08,
    () => gsapSet(ref.current?.querySelectorAll("[data-bar]"), { scaleX: 1 }),
  );

  return (
    <div ref={ref} className={`redaction ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} data-bar className="redaction__bar" style={{ width: `${88 - i * 15}%` }} />
      ))}
    </div>
  );
}

/**
 * A ruled line that draws itself. Animates stroke-dashoffset only (brief
 * section 2: transform and opacity are the only other animatable properties).
 */
export function DrawSVG({
  className = "",
  children,
  viewBox = "0 0 100 10",
}: {
  className?: string;
  children: ReactNode;
  viewBox?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const host = useRef<HTMLSpanElement>(null);

  useEnterWhenVisible(
    host,
    () => {
      const paths = Array.from(ref.current?.querySelectorAll<SVGPathElement>("[data-draw]") ?? []);
      paths.forEach((p, i) => {
        gsap.to(p, {
          strokeDashoffset: 0,
          duration: motion.dur.slow,
          ease: motion.ease.inOut,
          delay: i * 0.12,
        });
      });
    },
    0.1,
    () =>
      dashSet(Array.from(ref.current?.querySelectorAll<SVGPathElement>("[data-draw]") ?? []), true),
  );

  return (
    <span ref={host} className="draw-svg-host">
      <svg ref={ref} className={className} viewBox={viewBox} fill="none" aria-hidden="true">
        {children}
      </svg>
    </span>
  );
}

/** Mobile switch: the horizontal pinned track becomes a vertical stack (brief 6). */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(
    typeof window !== "undefined" && window.matchMedia(mm.mobile).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(mm.mobile);
    const on = () => setMobile(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}