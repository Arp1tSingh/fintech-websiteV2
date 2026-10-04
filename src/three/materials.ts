import {
  Color,
  DoubleSide,
  FrontSide,
  LineBasicMaterial,
  MeshBasicMaterial,
} from "three";
import { PALETTE } from "./palette";

/**
 * DESIGN.md section 3: "Materials: MeshBasicMaterial only. No lights, no
 * shadows, no PBR, no bloom, no glow." Every surface in the vault is one of
 * these six shared materials, mutated once per frame by applyPalette(). Sharing
 * them keeps the whole scene at a handful of draw calls and makes the colour
 * arc a single write instead of a scene traversal.
 */
export const materials = {
  /** structural bodies: drawer boxes, walls, floor, ceiling, vault door */
  surface: new MeshBasicMaterial({ side: FrontSide }),
  /** drawer faces, label plates, props — reads lighter than `surface` inside */
  face: new MeshBasicMaterial({ side: FrontSide }),
  /** the Black Ledger interior and the deepest shadows */
  deep: new MeshBasicMaterial({ side: FrontSide }),
  /** oxblood accent: door bolts ring, stamps, the Black Ledger drawer only */
  oxblood: new MeshBasicMaterial({ side: FrontSide }),
  /** paper: hanging tags, slips, ruled-line overlays */
  paper: new MeshBasicMaterial({ side: FrontSide }),
  /** every outline in the scene */
  outline: new LineBasicMaterial({ vertexColors: false }),
  /** inverted/outward-facing shells: corridor skin and chamber walls */
  shell: new MeshBasicMaterial({ side: DoubleSide }),
} as const;

export type MaterialName = keyof typeof materials;

/**
 * Oxblood is the one constant in the whole scene. Per DESIGN.md section 10 it
 * appears only as the accent on the bright sections and on the Black Ledger
 * drawer inside the dark corridor, so it is set once here rather than being
 * driven by the colour arc — otherwise it would fade out exactly when it is
 * supposed to be the focal point.
 */
materials.oxblood.color.set(PALETTE.oxblood);

/** Push one frame of the palette arc into every shared material. */
export function applyPalette(colors: {
  surface: Color;
  face: Color;
  outline: Color;
}): void {
  materials.surface.color.copy(colors.surface);
  materials.face.color.copy(colors.face);
  materials.outline.color.copy(colors.outline);

  // The deep interior and paper never fully invert: a black hole and a white
  // tag are what make the Black Ledger drawer legible inside a near-black room.
  materials.deep.color.copy(colors.surface).multiplyScalar(0.35);
  materials.paper.color.copy(colors.face);
  materials.shell.color.copy(colors.surface);
}