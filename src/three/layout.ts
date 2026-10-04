import { Vector3 } from "three";

/**
 * The physical dimensions of the vault and every beat of the camera.
 *
 * DESIGN.md section 5 alignment rule, restated as geometry: DOM panels are
 * centred in the viewport and the camera always stops with the featured drawer
 * centred in the frame. Both sit on the same vertical axis — the 3D in the
 * upper-middle band, the ledger card in the lower-middle — so alignment holds
 * by construction and no DOM element is ever positioned from a projected 3D
 * coordinate.
 */

/* ------------------------------------------------------------- the vault -- */

export const VAULT = {
  /** inner faces of the corridor walls */
  halfWidth: 3.8,
  ceiling: 6.4,
  wallThickness: 0.7,

  /** the door */
  doorRadius: 3.2,
  doorCentre: new Vector3(0, 3.2, 0),
  /** the door swings on its left edge */
  hingeX: -3.2,

  /** corridor drawer grid */
  rowY: [1.5, 3.2, 4.9] as const,
  colStep: 3.2,
  colStart: -5,
  colCount: 28,
  drawerW: 3.0,
  drawerH: 1.4,
  drawerD: 0.16,
  handleW: 0.9,
  handleH: 0.16,
  handleD: 0.34,
  slotW: 1.5,
  slotH: 0.22,
  slotD: 0.1,

  /** where the corridor stops and the round chamber begins */
  portalZ: -94,

  /** end chamber */
  chamberRadius: 9,
  chamberHeight: 7.2,
  chamberBackZ: -110,

  /** the two lockers in the end chamber */
  lockerZ: -104,
  lockerW: 3.6,
  lockerH: 3.4,
  lockerD: 1.8,
  lockerY: 2.0,
  lockerX: 3.5,

  /** how far a featured drawer slides out of its wall */
  drawerOut: 2.5,
} as const;

/* --------------------------------------------------- featured drawers --- */

export type FeaturedProp = "barChart" | "redaction" | "financeTech" | "openDrawer" | "network";

export interface FeaturedDrawer {
  index: number;
  /** -1 = left wall, +1 = right wall */
  side: -1 | 1;
  z: number;
  y: number;
  prop: FeaturedProp;
  title: string;
}

/** One per goal, in order. The camera stops at each of these. */
export const FEATURED: FeaturedDrawer[] = [
  { index: 0, side: -1, z: -18, y: 3.2, prop: "barChart", title: "Learn by doing" },
  { index: 1, side: 1, z: -36, y: 3.2, prop: "redaction", title: "Awareness and protection" },
  { index: 2, side: -1, z: -54, y: 3.2, prop: "financeTech", title: "Bridge finance and technology" },
  { index: 3, side: 1, z: -72, y: 3.2, prop: "openDrawer", title: "Open to everyone" },
  { index: 4, side: -1, z: -88, y: 3.2, prop: "network", title: "Build the community" },
];

  /* ------------------------------------------------- camera choreography -- */

export interface Station {
  /** master progress this station sits at */
  p: number;
  pos: [number, number, number];
  look: [number, number, number];
  /**
   * Fraction of the segment that BEGINS at this station spent standing still
   * here before travelling on. The last station of a track has no segment.
   */
  dwell?: number;
}

/**
 * Camera station for a featured drawer: on the opposite side of the corridor
 * from the drawer, a little way back, looking ACROSS at it. The drawer lands on
 * the frame's vertical axis in the upper-middle band, leaving the lower-middle
 * for the ledger card.
 */
function goalStation(side: -1 | 1, z: number): Pick<Station, "pos" | "look"> {
  return {
    pos: [-side * 0.75, 3.9, z + 6.0],
    // Same sign as the drawer, and far enough across that the OPEN drawer's
    // landed position (x = side * (halfWidth - drawerOut) = side * 1.3) sits on
    // the frame's vertical axis.
    look: [side * 1.5, 2.75, z - 0.3],
  };
}

/**
 * 0.00 - 0.30: door front, breathing push-in, then through the doorway.
 *
 * The About station carries NO dwell. DESIGN.md section 5 asks for "camera
 * pushes toward the opening" across 0.08-0.22, and a dwell here parks the camera
 * at exactly one z for most of that range, which reads as a frozen vault even
 * though the door and wheel are animating. The dwell after the threshold is
 * deliberate: a beat of stillness as the camera arrives at the doorway.
 */
export const APPROACH: Station[] = [
  { p: 0.0, pos: [0, 3.3, 22.0], look: [0, 3.3, 0] },
  { p: 0.08, pos: [0, 3.3, 17.4], look: [0, 3.25, 0], dwell: 0 },
  { p: 0.22, pos: [0, 3.25, 7.0], look: [0, 3.1, -2], dwell: 0.25 },
  { p: 0.3, pos: [0, 3.4, -2.0], look: [0, 3.2, -18] },
];

/**
 * 0.30 - 0.62: dolly the corridor, stopping at each of the five drawers.
 *
 * The five goal stations are spread evenly across the range and each spends half
 * of the segment that begins at it standing still, so every drawer is framed for
 * a real stretch of scroll. The last goal sits at 0.567, well before the 0.62
 * boundary, leaving the run into the chamber as genuine travel time.
 */
export const JOURNEY_CORRIDOR: Station[] = [
  { p: 0.3, pos: [0, 3.4, -2.0], look: [0, 3.2, -18] },
  { p: 0.354, ...goalStation(-1, -18), dwell: 0.5 },
  { p: 0.407, ...goalStation(1, -36), dwell: 0.5 },
  { p: 0.461, ...goalStation(-1, -54), dwell: 0.5 },
  { p: 0.514, ...goalStation(1, -72), dwell: 0.5 },
  { p: 0.567, ...goalStation(-1, -88), dwell: 0.5 },
];

/** 0.62 - 0.90: the end chamber, the arc around the lockers, then the rise. */
export const JOURNEY_CHAMBER: Station[] = [
  { p: 0.62, pos: [-4.7, 3.1, -97.4], look: [0, 2.2, -104], dwell: 0.28 },
  { p: 0.7, pos: [4.7, 3.3, -97.4], look: [0, 2.2, -104], dwell: 0.3 },
  { p: 0.77, pos: [0.4, 3.5, -95.0], look: [0, 2.2, -104.5], dwell: 0.45 },
  { p: 0.83, pos: [0, 4.7, -96.0], look: [0, 3.2, -105], dwell: 0.55 },
  { p: 0.9, pos: [0, 5.3, -97.6], look: [0, 3.7, -106] },
];

export const JOURNEY: Station[] = [...JOURNEY_CORRIDOR, ...JOURNEY_CHAMBER];

/** 0.90 - 1.00: pull all the way back out to the door and watch it shut. */
export const RETREAT: Station[] = [
  { p: 0.9, pos: [0, 5.3, -97.6], look: [0, 3.7, -106] },
  { p: 0.93, pos: [0, 4.0, -78], look: [0, 3.2, -92], dwell: 0.3 },
  { p: 0.96, pos: [0, 3.6, -46], look: [0, 3.2, -62], dwell: 0.2 },
  { p: 0.985, pos: [0, 3.35, 1.5], look: [0, 3.2, 0], dwell: 0.25 },
  { p: 1.0, pos: [0, 3.3, 11.6], look: [0, 3.3, 0] },
];

/* ----------------------------------------------- DOM <-> 3D alignment --- */

/**
 * Progress window in which each featured drawer is framed and its matching DOM
 * entry is on screen.
 *
 * Featured drawer i sits at station i+1 of JOURNEY_CORRIDOR — station 0 is the
 * corridor mouth, which is where the camera arrives, not a drawer. Both the
 * camera dwell and the card's on-screen window are read off that one station,
 * so a card and its drawer can never be out of step.
 */
export function goalWindows(): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  for (let i = 0; i < FEATURED.length; i++) {
    const s = JOURNEY_CORRIDOR[i + 1];
    const next = JOURNEY_CORRIDOR[i + 2];
    const span = (next ? next.p : s.p + 0.064) - s.p;
    const dwell = s.dwell ?? 0.5;
    out.push({
      // the card fades up slightly before the dwell and clears at its end
      start: s.p - span * 0.12,
      end: s.p + span * dwell,
    });
  }
  return out;
}

