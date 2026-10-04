/**
 * Motion tokens — verbatim from DESIGN_BRIEF.md section 4.
 * Mechanical and deliberate: stamps land, lines draw, numbers tick.
 */
export const motion = {
  ease: { out: "power3.out", inOut: "power2.inOut", step: "steps(12)" },
  dur: { fast: 0.3, base: 0.7, slow: 1.2 },
  stagger: { chars: 0.025, words: 0.04, cards: 0.12 },
  enter: { y: 40, opacity: 0 },
  trigger: { start: "top 80%", toggleActions: "play none none reverse" },
} as const;

export type Motion = typeof motion;