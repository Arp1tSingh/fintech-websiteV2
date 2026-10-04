import { BufferGeometry, EdgesGeometry, Float32BufferAttribute, Matrix4 } from "three";

/**
 * Outline baking.
 *
 * DESIGN.md section 3 wants a near-black edge on every solid. three only
 * enables the USE_INSTANCING path for real InstancedMesh objects, not for a
 * LineSegments wearing an InstancedBufferGeometry, so instanced lines are not
 * an option. Instead every repeated edge is transformed once on the CPU at
 * mount and merged into ONE LineSegments — one draw call for the outlines of
 * the entire corridor, and zero cost per frame.
 */
export class EdgeBaker {
  private positions: number[] = [];

  /** Add the edges of `source` transformed by `matrix`. */
  add(source: BufferGeometry, matrix: Matrix4): void {
    const edges = new EdgesGeometry(source, 1);
    const pos = edges.getAttribute("position");
    const v = { x: 0, y: 0, z: 0 };
    const m = matrix.elements;
    for (let i = 0; i < pos.count; i++) {
      v.x = pos.getX(i);
      v.y = pos.getY(i);
      v.z = pos.getZ(i);
      // Manual matrix application: avoids allocating a Vector3 per vertex.
      const x = m[0] * v.x + m[4] * v.y + m[8] * v.z + m[12];
      const y = m[1] * v.x + m[5] * v.y + m[9] * v.z + m[13];
      const z = m[2] * v.x + m[6] * v.y + m[10] * v.z + m[14];
      this.positions.push(x, y, z);
    }
    edges.dispose();
  }

  addAll(source: BufferGeometry, matrices: Matrix4[]): void {
    for (const m of matrices) this.add(source, m);
  }

  get count(): number {
    return this.positions.length / 3;
  }

  toGeometry(): BufferGeometry {
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(this.positions, 3));
    return geo;
  }
}

const _m = new Matrix4();
const _s = new Matrix4();

/** Convenience: translation + rotation-Y + uniform scale into one Matrix4. */
export function trs(
  x: number,
  y: number,
  z: number,
  rotY = 0,
  scale = 1,
  out: Matrix4 = _m,
): Matrix4 {
  _s.makeScale(scale, scale, scale);
  out.makeRotationY(rotY);
  out.setPosition(x, y, z);
  out.multiply(_s);
  return out;
}