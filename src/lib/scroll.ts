/**
 * Single source of truth for scroll geometry.
 *
 * DESIGN.md section 5 fixes the master `progress` ranges for every beat of the
 * journey, and section heights are DERIVED from those ranges so the 3D
 * choreography and the DOM always line up no matter how the content changes.
 *
 * The arithmetic that matters: `progress` is ScrollTrigger's normalised value,
 * scrollTop / (scrollHeight - viewportHeight). So a section boundary at
 * progress p sits at document offset p * (TOTAL_VH - 100) vh, not p * TOTAL_VH.
 * SCALE below is that conversion factor, which is why the hero comes out at
 * exactly 100vh instead of the 92vh a naive multiply would give.
 *
 * Deviation from DESIGN.md, flagged in the plan: the brief says "about 700vh"
 * total but gives the Hero only 0.00-0.08, which is too little scroll for a
 * full-screen hero. The ranges win (they drive the 3D), so TOTAL_VH is the one
 * knob that sets the whole page length.
 */
export const TOTAL_VH = 1350;
const SCALE = TOTAL_VH - 100;

export type SectionId = "hero" | "about" | "transition" | "goals" | "events" | "committee" | "contact";

export interface ScrollRange {
  id: SectionId;
  label: string;
  /** master progress where this section starts */
  start: number;
  /** master progress where this section ends */
  end: number;
}

export const RANGES: ScrollRange[] = [
  { id: "hero", label: "Index", start: 0.0, end: 0.08 },
  { id: "about", label: "About Us", start: 0.08, end: 0.22 },
  { id: "transition", label: "", start: 0.22, end: 0.3 },
  { id: "goals", label: "Goals / Ideology", start: 0.3, end: 0.62 },
  { id: "events", label: "Upcoming Events", start: 0.62, end: 0.78 },
  { id: "committee", label: "Committee", start: 0.78, end: 0.9 },
  { id: "contact", label: "Contact Us", start: 0.9, end: 1.0 },
];

/**
 * Height of a section in vh, derived straight from its progress range. The last
 * section absorbs the remainder, because progress 1.0 is the bottom of the
 * document rather than a scroll position anyone can actually reach.
 */
export function sectionVh(id: SectionId): number {
  const r = RANGES.find((s) => s.id === id)!;
  if (r.end >= 1) {
    // The last section absorbs the remainder: progress 1.0 is the bottom of the
    // document, not a scroll position anyone can actually reach.
    return TOTAL_VH - r.start * SCALE;
  }
  return (r.end - r.start) * SCALE;
}

/** Anchor targets for the nav, in the order DESIGN.md section 5 lays them out. */
export const NAV_ITEMS = RANGES.filter((r) => r.label !== "").map((r) => ({
  id: r.id,
  label: r.label,
}));

/** Which section a global progress falls inside. */
export function sectionAt(p: number): ScrollRange {
  for (let i = RANGES.length - 1; i >= 0; i--) {
    if (p >= RANGES[i].start) return RANGES[i];
  }
  return RANGES[0];
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Smooth, mechanical-feeling ramp used for camera sub-beats. */
export function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

export function smootherstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}