import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  EdgesGeometry,
  MeshBasicMaterial,
  type BufferGeometry,
  type Euler,
  type Texture,
  type Vector3Tuple,
} from "three";
import { materials } from "./materials";
import { current } from "./palette";

/**
 * Every solid in the vault is drawn twice: a MeshBasicMaterial fill and a
 * near-black EdgesGeometry line on top. That outline is what makes the scene
 * read as a printed ledger illustration that happens to be three-dimensional
 * (DESIGN.md section 3) — there are no lights and therefore no shading to
 * describe form.
 */
const edgeCache = new WeakMap<BufferGeometry, EdgesGeometry>();

function edgesOf(geometry: BufferGeometry): EdgesGeometry {
  let e = edgeCache.get(geometry);
  if (!e) {
    e = new EdgesGeometry(geometry, 1);
    edgeCache.set(geometry, e);
  }
  return e;
}

export interface SolidProps {
  geometry: BufferGeometry;
  material?: typeof materials.surface;
  position?: Vector3Tuple;
  rotation?: Euler | [number, number, number];
  scale?: number | Vector3Tuple;
  /** set false for things whose outlines would fight the palette */
  outline?: boolean;
  renderOrder?: number;
}

export function Solid({
  geometry,
  material = materials.surface,
  position,
  rotation,
  scale,
  outline = true,
  renderOrder,
}: SolidProps) {
  const edges = useMemo(() => (outline ? edgesOf(geometry) : null), [geometry, outline]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geometry} material={material} renderOrder={renderOrder} />
      {edges ? <lineSegments geometry={edges} material={materials.outline} renderOrder={renderOrder} /> : null}
    </group>
  );
}

/**
 * A flat plane carrying a procedurally generated texture — the door wordmark,
 * locker label plates, nameplate tags. Drawn white in the canvas and tinted
 * from the live palette each frame, which is what lets the same wordmark read
 * as near-black ink on parchment and as cream inside the dark corridor.
 */
export function Decal({
  geometry,
  map,
  role = "outline",
  position,
  rotation,
  opacity = 1,
}: {
  geometry: BufferGeometry;
  map: Texture;
  role?: "outline" | "face" | "surface";
  position?: Vector3Tuple;
  rotation?: Euler | [number, number, number];
  opacity?: number;
}) {
  const material = useMemo(
    () => new MeshBasicMaterial({ map, transparent: true, opacity, depthWrite: false, toneMapped: false }),
    [map, opacity],
  );
  useFrame(() => material.color.copy(current[role]));
  useEffect(() => () => material.dispose(), [material]);
  return <mesh geometry={geometry} material={material} position={position} rotation={rotation} />;
}