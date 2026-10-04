import { CatmullRomCurve3, Vector3 } from "three";
import { clamp, smootherstep } from "../lib/scroll";
import type { Station } from "./layout";

/**
 * Samples a list of camera stations with a CatmullRomCurve3 path plus a
 * separate look-at curve, exactly as DESIGN.md section 5 describes: both curves
 * are sampled with `progress`, with each section's range remapped to its own
 * local 0 to 1.
 *
 * Station parameters are INDEX-based (i / (n-1)) rather than arc-length based,
 * because `getPoint(i/(n-1))` returns station i exactly. That exactness is the
 * whole point: the alignment rule requires the camera to arrive precisely at a
 * featured drawer, and an arc-length remap puts it a unit or two off. Speed
 * along the path is shaped by each segment's `dwell` and easing instead.
 *
 * A station's `dwell` is the fraction of the segment that begins there spent
 * standing still, which is how the camera "stops with the featured drawer
 * centred in the frame" instead of gliding past it.
 */
export class StationTrack {
  private readonly stations: Station[];
  private readonly curve: CatmullRomCurve3;
  private readonly lookCurve: CatmullRomCurve3;
  /** Curve parameter for each station: exactly i / (n - 1). */
  private readonly us: number[];

  private readonly outPos = new Vector3();
  private readonly outLook = new Vector3();

  constructor(stations: Station[]) {
    // A segment whose endpoints share a progress value has zero length: `dwell`
    // becomes dead code and the camera snaps instead of travelling. That is
    // exactly what happens when two phase tables are concatenated and both end
    // on the boundary, so drop the duplicate rather than shipping a jump.
    const clean = stations.filter(
      (s, i) => i === 0 || s.p > stations[i - 1].p + 1e-6,
    );
    this.stations = clean.length >= 2 ? clean : stations;

    this.curve = new CatmullRomCurve3(
      this.stations.map((s) => new Vector3(...s.pos)),
      false,
      "centripetal",
      0.5,
    );
    this.lookCurve = new CatmullRomCurve3(
      this.stations.map((s) => new Vector3(...s.look)),
      false,
      "centripetal",
      0.5,
    );
    const denom = Math.max(1, this.stations.length - 1);
    this.us = this.stations.map((_, i) => i / denom);
  }

  sample(p: number): { pos: Vector3; look: Vector3 } {
    const st = this.stations;

    // Which segment are we in?
    let i = 0;
    while (i < st.length - 2 && p >= st[i + 1].p) i++;

    const from = st[i];
    const to = st[Math.min(i + 1, st.length - 1)];
    const span = to.p - from.p;

    let t: number;
    if (span <= 0) t = 1;
    else if (p <= from.p) t = 0;
    else if (p >= to.p) t = 1;
    else t = (p - from.p) / span;

    const dwell = clamp(from.dwell ?? 0, 0, 0.98);
    const k = t <= dwell ? 0 : smootherstep((t - dwell) / Math.max(0.0001, 1 - dwell));

    const j = Math.min(i + 1, this.us.length - 1);
    const u = clamp(this.us[i] + (this.us[j] - this.us[i]) * k, 0, 1);
    this.curve.getPoint(u, this.outPos);
    this.lookCurve.getPoint(u, this.outLook);
    return { pos: this.outPos, look: this.outLook };
  }
}