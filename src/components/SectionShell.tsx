import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { PosterBackdrop } from "../three/PosterFrames";
import { RANGES, clamp, sectionVh, type SectionId } from "../lib/scroll";
import { prefersReducedMotion } from "../lib/gsap";

/**
 * A section of the scroll journey.
 *
 * Height comes from the SCROLL table so every section occupies exactly the
 * master-progress range DESIGN.md gives it, which is what keeps the DOM and the
 * camera locked together. The inner panel is CSS-sticky rather than GSAP-pinned:
 * sticky adds no pin-spacer to the document, so the height arithmetic stays
 * exact, and under reduced motion it simply falls back to static flow.
 */

/* --------------------------------------------------------- crossfade ---- */

/**
 * Consecutive sticky panels are each a full viewport tall, so as one section
 * hands over to the next the outgoing panel is leaving while the incoming one
 * is arriving. Without this they would sit stacked on top of each other, both
 * opaque, which reads as a bug rather than a transition.
 *
 * One shared rAF for every panel, and all the layout reads happen before any of
 * the writes, so this cannot thrash.
 */
interface Fader {
  section: HTMLElement;
  panel: HTMLElement;
  /** held panels are position:fixed and simply fade out as the next section arrives */
  hold: boolean;
}

const faders = new Set<Fader>();
let faderRaf = 0;

function tickFaders(): void {
  const vh = window.innerHeight || 1;
  const scrollVh = window.scrollY;

  for (const f of faders) {
    const rect = f.section.getBoundingClientRect();
    const top = rect.top + scrollVh;

    if (f.hold) {
      // A held panel is fixed: it sits still for the whole of its range and
      // dissolves over the last stretch as the next section takes over.
      const o = clamp((top + rect.height - scrollVh) / (vh * 0.4), 0, 1);
      f.panel.style.opacity = o < 0.02 ? "0" : o.toFixed(3);
      f.panel.style.visibility = o < 0.02 ? "hidden" : "visible";
      f.section.style.setProperty("--sp", clamp(scrollVh / Math.max(1, rect.height), 0, 1).toFixed(4));
      continue;
    }

    // A section exactly one screenful tall has no handover to do.
    if (rect.height <= vh + 4) {
      f.panel.style.opacity = "1";
      f.panel.style.visibility = "visible";
      continue;
    }

    // The two windows are deliberately different. Fading IN over a full viewport
    // means the card is only fully opaque at the moment it sticks — any earlier
    // and a section's heading turns up solid in the middle of the previous
    // section's beat. Fading OUT is narrow, so a card stays solid right up to
    // the moment it slides away instead of going translucent while its own
    // content is still animating.
    const inW = vh;
    const outW = vh * 0.5;
    const inFade = clamp((scrollVh - (top - vh)) / inW, 0, 1);
    const outFade = clamp((top + rect.height - scrollVh) / outW, 0, 1);
    const o = Math.min(inFade, outFade);

    f.panel.style.opacity = o < 0.02 ? "0" : o.toFixed(3);
    f.panel.style.visibility = o < 0.02 ? "hidden" : "visible";

    // Local progress through the section's sticky window, 0..1. This is what
    // scroll-linked reveals read instead of a ScrollTrigger: ScrollTrigger
    // measures an element's position from its un-stuck layout box, which for a
    // sticky panel is nowhere near where the element is actually seen. Anything
    // inside a pinned panel therefore fires on page load instead of on arrival.
    f.section.style.setProperty(
      "--sp",
      clamp((scrollVh - top) / Math.max(1, rect.height - vh), 0, 1).toFixed(4),
    );
  }

  faderRaf = requestAnimationFrame(tickFaders);
}

/** Reads a section's local sticky-window progress. See `--sp` above. */
export function readSectionProgress(el: HTMLElement | null): number {
  if (!el) return 0;
  const n = Number(getComputedStyle(el).getPropertyValue("--sp"));
  return Number.isFinite(n) ? n : 0;
}

function registerFader(section: HTMLElement, panel: HTMLElement, hold: boolean): () => void {
  const f: Fader = { section, panel, hold };
  faders.add(f);
  if (!faderRaf) faderRaf = requestAnimationFrame(tickFaders);
  return () => {
    faders.delete(f);
    if (faders.size === 0 && faderRaf) {
      cancelAnimationFrame(faderRaf);
      faderRaf = 0;
    }
  };
}

export function SectionShell({
  id,
  children,
  className = "",
  poster,
  inverted = false,
  align = "center",
  hold = false,
  style,
}: {
  id: SectionId;
  children: ReactNode;
  className?: string;
  /** index into the poster-frame list, for the reduced-motion / no-WebGL tiers */
  poster?: number;
  inverted?: boolean;
  align?: "center" | "lower";
  /**
   * Hold the panel fixed for the whole of this section's range instead of
   * sticking it. For sections that are exactly one screenful tall — the hero —
   * sticky gives zero runway, so the content would scroll away immediately.
   */
  hold?: boolean;
  style?: CSSProperties;
}) {
  const section = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const height = sectionVh(id);
  const label = RANGES.find((r) => r.id === id)?.label;
  // Reduced motion stacks the sections instead of handing over, so there is
  // nothing to crossfade.
  const fade = !prefersReducedMotion();

  useEffect(() => {
    if (!fade) return;
    const sec = section.current;
    const pan = panel.current;
    if (!sec || !pan) return;
    return registerFader(sec, pan, hold);
  }, [fade, hold]);

  return (
    <section
      id={id}
      ref={section}
      className={`section section--${id}${inverted ? " section--inverted" : ""} ${className}`}
      style={{ height: `${height}vh`, ...style }}
      {...(label ? { "aria-label": label } : { "aria-hidden": "true" })}
    >
      {poster !== undefined ? <PosterBackdrop index={poster} /> : null}
      <div
        ref={panel}
        className={`section__panel section__panel--${align}${hold ? " section__panel--hold" : ""}`}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * A panel that holds DOM text in the lower-middle band, clear of the 3D above it.
 * Opaque by design: contrast never depends on what the vault is doing behind it.
 */
export function Panel({
  children,
  className = "",
  tone = "parchment",
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  tone?: "parchment" | "ink";
  as?: "div" | "article" | "li";
}) {
  return <As className={`panel panel--${tone} torn-x ${className}`}>{children}</As>;
}