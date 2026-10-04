import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  type InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Path,
  PlaneGeometry,
  Shape,
} from "three";
import { Solid } from "./Solid";
import { materials } from "./materials";
import { current } from "./palette";
import { FEATURED, VAULT } from "./layout";
import { runtime } from "./progress";
import { makeRuledTexture } from "./geom/textures";
import { EdgeBaker } from "./geom/outlines";

/**
 * The corridor — DESIGN.md section 4.
 *
 * Long rectangular tunnel whose walls are a grid of deposit-box drawer fronts:
 * roughly 20-30 drawers deep per side with a small handle and a label slot on
 * each. Everything repeated is instanced, and every repeated outline is baked
 * once into a single LineSegments, so the whole corridor is a handful of draw
 * calls and costs nothing per frame.
 *
 * The five positions where a featured drawer replaces a grid drawer are skipped
 * here and built as real meshes in FeaturedDrawers.tsx.
 */

const CORRIDOR_LENGTH = Math.abs(VAULT.portalZ);
const FEATURED_ROW = VAULT.rowY.indexOf(3.2);

interface Column {
  z: number;
  side: -1 | 1;
  row: number;
}

/** Every grid drawer, minus the slots the featured drawers occupy. */
function buildColumns(stride: number): Column[] {
  const cols: Column[] = [];
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < VAULT.colCount; i += stride) {
      const z = VAULT.colStart - i * VAULT.colStep;
      for (let row = 0; row < VAULT.rowY.length; row++) {
        const blocked =
          row === FEATURED_ROW && FEATURED.some((f) => f.side === side && Math.abs(f.z - z) < 2.6);
        if (!blocked) cols.push({ z, side, row });
      }
    }
  }
  return cols;
}

interface InstanceSet {
  front: Matrix4[];
  handle: Matrix4[];
  slot: Matrix4[];
}

function buildTransforms(cols: Column[]): InstanceSet {
  const front: Matrix4[] = [];
  const handle: Matrix4[] = [];
  const slot: Matrix4[] = [];

  for (const c of cols) {
    const y = VAULT.rowY[c.row];
    front.push(
      new Matrix4()
        .makeScale(VAULT.drawerD, VAULT.drawerH, VAULT.drawerW)
        .setPosition(c.side * (VAULT.halfWidth - VAULT.drawerD / 2), y, c.z),
    );
    handle.push(
      new Matrix4()
        .makeScale(VAULT.handleD, VAULT.handleH, VAULT.handleW)
        .setPosition(
          c.side * (VAULT.halfWidth - VAULT.drawerD - VAULT.handleD / 2),
          y,
          c.z,
        ),
    );
    slot.push(
      new Matrix4()
        .makeScale(VAULT.slotD, VAULT.slotH, VAULT.slotW)
        .setPosition(
          c.side * (VAULT.halfWidth - VAULT.drawerD + VAULT.slotD * 0.5),
          y + VAULT.drawerH / 2 - VAULT.slotH / 2 - 0.14,
          c.z,
        ),
    );
  }
  return { front, handle, slot };
}

export function Corridor() {
  const fronts = useRef<InstancedMesh>(null);
  const handles = useRef<InstancedMesh>(null);
  const slots = useRef<InstancedMesh>(null);

  const unit = useMemo(() => new BoxGeometry(1, 1, 1), []);

  const transforms = useMemo(
    () => ({ full: buildTransforms(buildColumns(1)), half: buildTransforms(buildColumns(2)) }),
    [],
  );

  const uploaded = useRef<"full" | "half" | null>(null);

  /* ------------------------------------------------------------ geometry -- */

  const geo = useMemo(
    () => ({
      wall: new BoxGeometry(VAULT.wallThickness, VAULT.ceiling, CORRIDOR_LENGTH),
      floor: new PlaneGeometry(VAULT.halfWidth * 2, CORRIDOR_LENGTH + 20),
      portal: (() => {
        const shape = new Shape();
        shape.absarc(0, 3.6, VAULT.chamberRadius, 0, Math.PI * 2, false);
        const hole = new Path();
        hole.moveTo(-VAULT.halfWidth, 0);
        hole.lineTo(VAULT.halfWidth, 0);
        hole.lineTo(VAULT.halfWidth, VAULT.ceiling);
        hole.lineTo(-VAULT.halfWidth, VAULT.ceiling);
        hole.closePath();
        shape.holes.push(hole);
        const g = new ExtrudeGeometry(shape, {
          depth: VAULT.wallThickness,
          bevelEnabled: false,
          curveSegments: 40,
        });
        g.translate(0, 0, -VAULT.wallThickness);
        return g;
      })(),
      chamberWall: new CylinderGeometry(VAULT.chamberRadius, VAULT.chamberRadius, 16, 44, 1, true),
      chamberCap: new CircleGeometry(VAULT.chamberRadius, 44),
    }),
    [],
  );

  /* ------------------------------------------------------- ruled surfaces -- */

  const ruled = useMemo(() => {
    const tex = makeRuledTexture();
    const mat = new MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      toneMapped: false,
    });
    return { tex, mat };
  }, []);

  /* ------------------------------------------------------ baked outlines --- */

  const outlineGeo = useMemo(() => {
    const baker = new EdgeBaker();
    for (const t of transforms.full.front) baker.add(unit, t);
    for (const t of transforms.full.handle) baker.add(unit, t);
    for (const t of transforms.full.slot) baker.add(unit, t);

    baker.add(
      geo.wall,
      new Matrix4().setPosition(
        -(VAULT.halfWidth + VAULT.wallThickness / 2),
        VAULT.ceiling / 2,
        -CORRIDOR_LENGTH / 2,
      ),
    );
    baker.add(
      geo.wall,
      new Matrix4().setPosition(
        VAULT.halfWidth + VAULT.wallThickness / 2,
        VAULT.ceiling / 2,
        -CORRIDOR_LENGTH / 2,
      ),
    );
    baker.add(geo.portal, new Matrix4().setPosition(0, 0, VAULT.portalZ));
    baker.add(geo.chamberCap, new Matrix4().setPosition(0, 3.6, VAULT.chamberBackZ));

    return baker.toGeometry();
  }, [transforms, unit, geo]);

  /* ------------------------------------------------------------- upload ---- */

  function upload(set: InstanceSet): void {
    const f = fronts.current;
    const h = handles.current;
    const s = slots.current;
    if (!f || !h || !s) return;
    set.front.forEach((m, i) => f.setMatrixAt(i, m));
    set.handle.forEach((m, i) => h.setMatrixAt(i, m));
    set.slot.forEach((m, i) => s.setMatrixAt(i, m));
    f.count = set.front.length;
    h.count = set.handle.length;
    s.count = set.slot.length;
    f.instanceMatrix.needsUpdate = true;
    h.instanceMatrix.needsUpdate = true;
    s.instanceMatrix.needsUpdate = true;
    f.computeBoundingSphere();
  }

  useFrame(() => {
    const want = runtime.tier === "low" ? "half" : "full";
    if (uploaded.current !== want) {
      upload(transforms[want]);
      uploaded.current = want;
    }
    // Outlines stay at every tier — see the note on auto-tiering in progress.ts.
    // They are the other half of the scene's depth cue, and they cost one draw
    // call for the whole corridor because they are baked into a single
    // LineSegments rather than instanced per drawer.
    ruled.mat.color.copy(current.surface);
  });

  return (
    <group>
      <Solid
        geometry={geo.wall}
        material={materials.surface}
        position={[
          -(VAULT.halfWidth + VAULT.wallThickness / 2),
          VAULT.ceiling / 2,
          -CORRIDOR_LENGTH / 2,
        ]}
      />
      <Solid
        geometry={geo.wall}
        material={materials.surface}
        position={[
          VAULT.halfWidth + VAULT.wallThickness / 2,
          VAULT.ceiling / 2,
          -CORRIDOR_LENGTH / 2,
        ]}
      />

      {/* portal into the round end chamber, and the chamber itself */}
      <Solid geometry={geo.portal} material={materials.surface} position={[0, 0, VAULT.portalZ]} />
      <mesh
        geometry={geo.chamberWall}
        material={materials.shell}
        position={[0, 3.6, -102]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh geometry={geo.chamberCap} material={materials.shell} position={[0, 3.6, VAULT.chamberBackZ]} />

      {/* floor and ceiling carry faint ruled lines so the ledger persists */}
      <mesh
        geometry={geo.floor}
        material={ruled.mat}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, -CORRIDOR_LENGTH / 2 - 8]}
      />
      <mesh
        geometry={geo.floor}
        material={ruled.mat}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, VAULT.ceiling - 0.02, -CORRIDOR_LENGTH / 2 - 8]}
      />

      {/* the grid: drawer fronts, handles, label slots */}
      <instancedMesh ref={fronts} args={[unit, materials.face, transforms.full.front.length]} />
      <instancedMesh ref={handles} args={[unit, materials.surface, transforms.full.handle.length]} />
      <instancedMesh ref={slots} args={[unit, materials.paper, transforms.full.slot.length]} />

      <lineSegments geometry={outlineGeo} material={materials.outline} />
    </group>
  );
}