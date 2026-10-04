import { Color } from "three";
import { clamp } from "../lib/scroll";

/**
 * Palette — DESIGN.md section 3.
 *
 * Three colours only. Going into the dark and coming back out is the whole
 * "inside the vault" feeling, achieved with flat colour falloff and no lights
 * anywhere. Values are duplicated from src/styles/theme.css on purpose: the
 * canvas cannot read CSS custom properties per frame cheaply enough to be
 * worth the coupling, so this is the 3D-side copy.
 */
export const PALETTE = {
  parchment: "#f1e8d4",
  oxblood: "#5e0f1a",
  ink: "#141011",
  /** surface tone at the bright end — the "cream" of DESIGN.md section 3 */
  cream: "#f8f3e7",
} as const;

export const C = {
  parchment: new Color(PALETTE.parchment),
  oxblood: new Color(PALETTE.oxblood),
  ink: new Color(PALETTE.ink),
  /**
   * The "cream" of DESIGN.md section 3's table ("parchment bg, cream with
   * oxblood accents"): the surface tone at the bright end, held a step away from
   * the background so the vault still reads as solid objects before the dark.
   */
  cream: new Color(PALETTE.cream),
};

interface ArcStop {
  /** master progress */
  p: number;
  bg: Color;
  /** drawer / wall body colour */
  surface: Color;
  /** drawer faces and props */
  face: Color;
  /** every outline in the scene */
  outline: Color;
}

function stop(p: number, bg: Color, surface: Color, face: Color, outline: Color): ArcStop {
  return { p, bg: bg.clone(), surface: surface.clone(), face: face.clone(), outline: outline.clone() };
}

/**
 * The colour arc from DESIGN.md section 3, with one structural change.
 *
 * The brief lerps background, surfaces and outlines between the same two
 * colours at the same rate. In a scene with no lights and no shading that is
 * fatal mid-transition: surfaces, background and outlines all converge on one
 * value at the same instant, and the vault disappears exactly while the camera
 * is pushing toward the opening — which reads as a frozen scene.
 *
 * So the channels are staggered. Surfaces go dark FIRST (0.08 -> 0.17), the
 * background follows (0.17 -> 0.30), and outlines stay near-black until the
 * background is already dark enough to need cream ones. Surfaces are therefore
 * always offset from the background, and the scene reads continuously through
 * the whole descent.
 */
const ARC: ArcStop[] = [
  stop(0.0, C.parchment, C.cream, C.parchment, C.ink),
  stop(0.08, C.parchment, C.cream, C.parchment, C.ink),
  // surfaces darken first, while the background is still parchment
  stop(0.17, C.parchment, C.ink, C.parchment, C.ink),
  // background follows; outlines cross over to cream only once it is dark
  stop(0.3, C.ink, C.ink, C.parchment, C.parchment),
  stop(0.7, C.ink, C.ink, C.parchment, C.parchment),
  stop(0.9, C.ink, C.ink, C.parchment, C.parchment),
  stop(1.0, C.parchment, C.cream, C.parchment, C.ink),
];

export interface FramePalette {
  bg: Color;
  surface: Color;
  face: Color;
  outline: Color;
}

const scratch: FramePalette = {
  bg: new Color(),
  surface: new Color(),
  face: new Color(),
  outline: new Color(),
};

/**
 * The palette for the frame currently being drawn. The scene's driver writes
 * this once per frame; anything that needs to tint itself (text decals) reads
 * it from its own useFrame rather than being traversed.
 */
export const current: FramePalette = {
  bg: new Color(),
  surface: new Color(),
  face: new Color(),
  outline: new Color(),
};

/** Sample the arc at a master progress. Returns a shared, mutated object. */
export function paletteAt(p: number): FramePalette {
  const t = clamp(p, 0, 1);
  let i = 0;
  while (i < ARC.length - 2 && t > ARC[i + 1].p) i += 1;

  const a = ARC[i];
  const b = ARC[i + 1];
  const span = b.p - a.p;
  const local = span <= 0 ? 0 : clamp((t - a.p) / span, 0, 1);

  scratch.bg.copy(a.bg).lerp(b.bg, local);
  scratch.surface.copy(a.surface).lerp(b.surface, local);
  scratch.face.copy(a.face).lerp(b.face, local);
  scratch.outline.copy(a.outline).lerp(b.outline, local);

  current.bg.copy(scratch.bg);
  current.surface.copy(scratch.surface);
  current.face.copy(scratch.face);
  current.outline.copy(scratch.outline);

  return scratch;
}