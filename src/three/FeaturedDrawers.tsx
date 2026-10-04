import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BoxGeometry, MeshBasicMaterial, PlaneGeometry, type Group, type Mesh } from "three";
import { Solid, Decal } from "./Solid";
import { materials } from "./materials";
import { current } from "./palette";
import { FEATURED, VAULT, goalWindows, type FeaturedDrawer } from "./layout";
import { scroll } from "./progress";
import { clamp, smoothstep } from "../lib/scroll";
import { makeLabelTexture, makeRedactionTexture } from "./geom/textures";
import { GOALS } from "../content/site";

/**
 * The five featured drawers — DESIGN.md section 4.
 *
 * Real meshes, one per goal, replacing a grid drawer on the corridor sides. The
 * camera stops at each and the matching DOM entry panel appears centred in the
 * viewport at the same moment, so the two can never be out of step — see
 * goalWindows(), which derives both windows from one station table.
 *
 * Each drawer is a shallow open tray on a front plate. Shut, the tray is inside
 * the wall and you see only the face; opening pulls the tray into the corridor
 * and presents the prop lying on it.
 */

const WINDOWS = goalWindows();

/** 0 shut, 1 fully drawn out, with a plateau so the prop can be read. */
function openAmount(p: number, i: number): number {
  const w = WINDOWS[i];
  const span = Math.max(0.0001, w.end - w.start);
  const pull = smoothstep(clamp((p - w.start) / (span * 0.62), 0, 1));
  const shut = 1 - smoothstep(clamp((p - w.end) / 0.02, 0, 1));
  return pull * shut;
}

/* ------------------------------------------------------------------ box -- */

function Box({
  sx,
  sy,
  sz,
  position,
  material = materials.surface,
  outline = true,
}: {
  sx: number;
  sy: number;
  sz: number;
  position: [number, number, number];
  material?: (typeof materials)["surface"];
  outline?: boolean;
}) {
  const g = useMemo(() => new BoxGeometry(sx, sy, sz), [sx, sy, sz]);
  return <Solid geometry={g} material={material} position={position} outline={outline} />;
}

/* -------------------------------------------------------------- the five -- */

function FeaturedDrawerMesh({ spec }: { spec: FeaturedDrawer }) {
  const group = useRef<Group>(null);
  const s = spec.side;

  const geo = useMemo(
    () => ({
      face: new PlaneGeometry(4.2, 2.4),
      label: new PlaneGeometry(1.6, 0.5),
      alt: new PlaneGeometry(1.6, 0.8),
      strip: new PlaneGeometry(3.7, 1.5),
      bar: new BoxGeometry(0.5, 1, 0.5),
      chip: new BoxGeometry(0.7, 0.3, 0.7),
      line: new BoxGeometry(1.4, 0.07, 0.07),
      dot: new BoxGeometry(0.2, 0.2, 0.2),
    }),
    [],
  );

  const labelTex = useMemo(() => makeLabelTexture(GOALS[spec.index].entry), [spec.index]);
  const moneyTex = useMemo(() => makeLabelTexture("₿"), []);
  const codeTex = useMemo(() => makeLabelTexture("</>"), []);
  const redactionTex = useMemo(() => makeRedactionTexture(), []);

  // goal 04 has no lock and is left slightly ajar the whole way through
  const minOpen = spec.prop === "openDrawer" ? 0.34 : 0;

  // Local +x always points into the corridor, whichever wall this drawer is in.
  const ix = (n: number) => -s * n;
  const faceTurn = s > 0 ? Math.PI : 0;

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.position.x = s * (VAULT.halfWidth - Math.max(minOpen, openAmount(scroll.progress, spec.index)) * VAULT.drawerOut);
  });

  return (
    <group ref={group} position={[s * VAULT.halfWidth, spec.y, spec.z]}>
      {/* front plate */}
      <Box sx={0.16} sy={2.4} sz={4.2} position={[ix(0.08), 0, 0]} material={materials.face} />
      {/* pull handle */}
      <Box sx={0.34} sy={0.2} sz={1.3} position={[ix(0.32), 0, 0]} />
      <Decal geometry={geo.label} map={labelTex} role="outline" position={[ix(0.17), 0.85, 0]} rotation={[0, faceTurn, 0]} />

      {/* the tray. Side walls are deliberately low so the prop on it stays
          visible from the camera's eye level rather than being walled in. */}
      <Box sx={1.5} sy={0.12} sz={4.0} position={[ix(0.95), -0.2, 0]} />
      <Box sx={1.5} sy={0.28} sz={0.14} position={[ix(0.95), -0.06, -1.93]} />
      <Box sx={1.5} sy={0.28} sz={0.14} position={[ix(0.95), -0.06, 1.93]} />
      <Box sx={0.14} sy={0.44} sz={4.0} position={[ix(0.26), 0.02, 0]} />

      {spec.prop === "barChart" && <BarChart ix={ix} />}
      {spec.prop === "redaction" && <Redaction geo={geo} ix={ix} faceTurn={faceTurn} tex={redactionTex} />}
      {spec.prop === "financeTech" && <FinanceTech geo={geo} ix={ix} faceTurn={faceTurn} money={moneyTex} code={codeTex} />}
      {spec.prop === "openDrawer" && <OpenDrawer ix={ix} />}
      {spec.prop === "network" && <Network ix={ix} />}
    </group>
  );
}

/** 01 Learn by doing: a stepped bar-chart prop that builds itself. */
function BarChart({ ix }: { ix: (n: number) => number }) {
  const heights = [0.22, 0.4, 0.58, 0.8, 1.02];
  const bars = useRef<Group>(null);

  useFrame(() => {
    const g = bars.current;
    if (!g) return;
    // The chart steps up as the drawer comes out — one bar at a time, never a
    // smooth tween, because everything here is mechanical.
    const open = openAmount(scroll.progress, 0);
    g.children.forEach((child, i) => {
      const built = clamp(open * 1.7 - i * 0.1, 0, 1);
      child.scale.y = Math.max(0.001, built);
      child.position.y = -0.14 + (heights[i] * built) / 2;
    });
  });

  return (
    <group ref={bars}>
      {heights.map((h, i) => (
        <Box
          key={i}
          sx={0.5}
          sy={h}
          sz={0.5}
          position={[ix(0.98), -0.14 + h / 2, -1.2 + i * 0.62]}
          material={i === heights.length - 1 ? materials.oxblood : materials.paper}
        />
      ))}
      {/* baseline rule the bars sit on */}
      <Box sx={0.06} sy={0.06} sz={3.4} position={[ix(0.98), -0.16, 0]} material={materials.oxblood} />
    </group>
  );
}

/** 02 Awareness and protection: a black redaction strip that slides away. */
function Redaction({
  geo,
  ix,
  faceTurn,
  tex,
}: {
  geo: Record<string, BoxGeometry | PlaneGeometry>;
  ix: (n: number) => number;
  faceTurn: number;
  tex: import("three").Texture;
}) {
  const strip = useRef<Group>(null);
  const lettering = useRef<Mesh>(null);

  useFrame(() => {
    const g = strip.current;
    if (!g) return;
    // The strip wipes off along the tray as the drawer comes out.
    const open = openAmount(scroll.progress, 1);
    g.position.z = -open * 5.4;
    // Keep the lettering in the scene's ink, not raw white.
    const m = lettering.current?.material as MeshBasicMaterial | undefined;
    m?.color.copy(current.outline);
  });

  return (
    <group ref={strip}>
      <Box sx={0.08} sy={1.5} sz={3.7} position={[ix(0.42), 0.4, 0]} material={materials.deep} />
      <mesh
        ref={lettering}
        geometry={geo.strip as PlaneGeometry}
        position={[ix(0.34), 0.4, 0]}
        rotation={[0, faceTurn, 0]}
      >
        <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** 03 Bridge finance and technology: the label alternates currency and code. */
function FinanceTech({
  geo,
  ix,
  faceTurn,
  money,
  code,
}: {
  geo: Record<string, BoxGeometry | PlaneGeometry>;
  ix: (n: number) => number;
  faceTurn: number;
  money: import("three").Texture;
  code: import("three").Texture;
}) {
  const a = useRef<Mesh>(null);
  const b = useRef<Mesh>(null);

  useFrame((state) => {
    // Alternates on a fixed beat, then locks when the drawer stops moving.
    const held = openAmount(scroll.progress, 2);
    const beat = Math.floor(state.clock.elapsedTime * 1.1) % 2 === 0;
    if (a.current) {
      a.current.visible = held > 0.05 && beat;
      (a.current.material as MeshBasicMaterial).color.copy(current.outline);
    }
    if (b.current) {
      b.current.visible = held <= 0.05 || !beat;
      (b.current.material as MeshBasicMaterial).color.copy(current.outline);
    }
  });

  return (
    <>
      <mesh ref={a} geometry={geo.alt as PlaneGeometry} position={[ix(0.36), 0.35, -0.95]} rotation={[0, faceTurn, 0]}>
        <meshBasicMaterial map={money} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={b} geometry={geo.alt as PlaneGeometry} position={[ix(0.36), 0.35, -0.95]} rotation={[0, faceTurn, 0]}>
        <meshBasicMaterial map={code} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <Box sx={0.9} sy={0.5} sz={0.9} position={[ix(0.95), 0.05, 0.95]} material={materials.paper} />
      <Box sx={0.5} sy={0.5} sz={0.5} position={[ix(1.2), 0.05, 1.55]} material={materials.oxblood} />
    </>
  );
}

/** 04 Open to everyone: no lock at all, and the drawer is never fully shut. */
function OpenDrawer({ ix }: { ix: (n: number) => number }) {
  const hasp = useRef<Group>(null);

  useFrame(() => {
    // The hasp hangs open, swinging gently as the drawer moves.
    const g = hasp.current;
    if (!g) return;
    const open = openAmount(scroll.progress, 3);
    g.rotation.z = -0.5 - open * 0.9;
  });

  return (
    <>
      {/* hasp plate, swung clear of the lock */}
      <group ref={hasp} position={[ix(0.22), -0.8, -1.7]}>
        <Box sx={0.1} sy={0.52} sz={0.52} position={[ix(0.16), 0, 0]} material={materials.oxblood} />
      </group>
      {/* no lock body anywhere on this drawer */}
      {[1.3, 0, -1.3].map((z, i) => (
        <Box
          key={i}
          sx={0.7}
          sy={0.28}
          sz={0.7}
          position={[ix(0.9 + i * 0.05), -0.02, z]}
          material={materials.paper}
        />
      ))}
    </>
  );
}

/** 05 Build the community: two drawers linked by a thin line. */
function Network({ ix }: { ix: (n: number) => number }) {
  return (
    <>
      <Box sx={0.7} sy={0.5} sz={1.0} position={[ix(0.8), 0.05, -0.95]} material={materials.paper} />
      <Box sx={0.7} sy={0.5} sz={1.0} position={[ix(0.95), 0.05, 0.95]} material={materials.paper} />
      <Box sx={1.5} sy={0.07} sz={0.07} position={[ix(0.875), 0.06, 0]} material={materials.oxblood} />
      <Box sx={0.2} sy={0.2} sz={0.2} position={[ix(0.8), 0.4, -0.95]} material={materials.oxblood} />
      <Box sx={0.2} sy={0.2} sz={0.2} position={[ix(0.95), 0.4, 0.95]} material={materials.oxblood} />
      <Box sx={0.2} sy={0.2} sz={0.2} position={[ix(0.875), 0.4, 0]} material={materials.paper} />
    </>
  );
}

export function FeaturedDrawers() {
  return (
    <group>
      {FEATURED.map((spec) => (
        <FeaturedDrawerMesh key={spec.index} spec={spec} />
      ))}
    </group>
  );
}