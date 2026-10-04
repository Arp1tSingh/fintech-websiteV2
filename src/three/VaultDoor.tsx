import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Path,
  PlaneGeometry,
  Shape,
  TorusGeometry,
  type Group,
} from "three";
import { Solid, Decal } from "./Solid";
import { materials } from "./materials";
import { VAULT } from "./layout";
import { scroll } from "./progress";
import { clamp, smoothstep } from "../lib/scroll";
import { makeWordmarkTexture } from "./geom/textures";
import { SITE } from "../content/site";

const DEG = Math.PI / 180;

/**
 * The vault door — DESIGN.md section 4.
 *
 * A thick disc, an outer ring, a centre hub, 8 radial bolts around the rim, a
 * four-spoke wheel on the face and the wordmark engraved above it, hinged on
 * the left edge. Choreography (DESIGN.md section 5): across 0.08-0.22 the wheel
 * spins about 1.5 turns, the bolts retract radially, the door swings open about
 * 100 degrees and the camera pushes toward the opening. Across 0.96-1.00 the
 * whole thing runs backwards and the door stamps shut.
 */
export function VaultDoor() {
  const hinge = useRef<Group>(null);
  const wheel = useRef<Group>(null);
  const bolts = useRef<Group>(null);

  const geo = useMemo(
    () => ({
      disc: new CylinderGeometry(VAULT.doorRadius, VAULT.doorRadius, 0.62, 48, 1),
      ring: new TorusGeometry(VAULT.doorRadius + 0.16, 0.3, 10, 48),
      face: new CylinderGeometry(VAULT.doorRadius - 0.28, VAULT.doorRadius - 0.28, 0.12, 48, 1),
      hub: new CylinderGeometry(0.82, 0.82, 0.9, 24, 1),
      bolt: new CylinderGeometry(0.19, 0.19, 0.52, 12, 1),
      boltWasher: new CylinderGeometry(0.3, 0.3, 0.14, 12, 1),
      wheelRim: new TorusGeometry(1.72, 0.13, 8, 40),
      spoke: new BoxGeometry(3.3, 0.15, 0.15),
      wheelHub: new CylinderGeometry(0.44, 0.44, 0.34, 16, 1),
      wordmark: new PlaneGeometry(3.5, 0.875),
    }),
    [],
  );

  const wordmark = useMemo(() => makeWordmarkTexture(SITE.wordmark), []);

  const boltPositions = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = i * ((Math.PI * 2) / 8) + Math.PI / 8;
        return {
          x: Math.cos(a) * (VAULT.doorRadius - 0.42),
          y: Math.sin(a) * (VAULT.doorRadius - 0.42),
          a,
        };
      }),
    [],
  );

  useFrame((state) => {
    const p = scroll.progress;

    const opening = smoothstep(clamp((p - 0.08) / 0.14, 0, 1));
    const closing = smoothstep(clamp((p - 0.962) / 0.034, 0, 1));
    const open = clamp(opening - closing, 0, 1);

    if (hinge.current) {
      // About 100 degrees about the left edge, swinging into the vault.
      hinge.current.rotation.y = open * 100 * DEG;
      // A whisper of sag as the mass swings: mechanical, not digital.
      hinge.current.rotation.z = Math.sin(open * Math.PI) * 0.012;
    }

    if (wheel.current) {
      const spin = open * 1.5 * Math.PI * 2;
      const idle = (1 - open) * state.clock.elapsedTime * 0.06;
      wheel.current.rotation.z = -(spin + idle);
    }

    if (bolts.current) {
      const retract = open * 0.62;
      for (let i = 0; i < bolts.current.children.length; i++) {
        const child = bolts.current.children[i];
        const a = boltPositions[i].a;
        const r = VAULT.doorRadius - 0.42 - retract;
        child.position.x = Math.cos(a) * r;
        child.position.y = Math.sin(a) * r;
        child.rotation.z = a;
        child.position.z = 0.34 - retract * 0.3;
      }
    }
  });

  return (
    <group>
      {/* Door frame: jamb, sill and lintel. Part of the wall; it never moves. */}
      <group position={[0, VAULT.doorCentre.y, -VAULT.wallThickness * 0.5]}>
        <Solid
          geometry={geo.ring}
          material={materials.surface}
          scale={[1.09, 1.09, 1]}
          position={[0, 0, VAULT.wallThickness * 0.5]}
        />
      </group>

      {/* The door itself, hinged on its left edge. */}
      <group ref={hinge} position={[VAULT.hingeX, VAULT.doorCentre.y, 0]}>
        <group position={[-VAULT.hingeX, 0, 0]}>
          <Solid geometry={geo.disc} material={materials.surface} rotation={[Math.PI / 2, 0, 0]} />
          <Solid
            geometry={geo.face}
            material={materials.face}
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, 0, 0.34]}
          />
          <Solid geometry={geo.ring} material={materials.surface} position={[0, 0, 0.06]} />

          <group ref={bolts}>
            {boltPositions.map((b, i) => (
              <group key={i} position={[b.x, b.y, 0.34]} rotation={[Math.PI / 2, 0, b.a]}>
                <Solid geometry={geo.boltWasher} material={materials.oxblood} />
                <Solid geometry={geo.bolt} material={materials.surface} position={[0, 0.24, 0]} />
              </group>
            ))}
          </group>

          <Solid
            geometry={geo.hub}
            material={materials.surface}
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, 0, 0.42]}
          />

          <group ref={wheel} position={[0, 0, 0.78]}>
            <Solid geometry={geo.wheelRim} material={materials.oxblood} />
            {[0, 45, 90, 135].map((deg) => (
              <Solid
                key={deg}
                geometry={geo.spoke}
                material={materials.oxblood}
                rotation={[0, 0, deg * DEG]}
              />
            ))}
            <Solid
              geometry={geo.wheelHub}
              material={materials.surface}
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, 0, 0.04]}
            />
          </group>

          <Decal geometry={geo.wordmark} map={wordmark} role="outline" position={[0, 1.95, 0.44]} />
        </group>
      </group>
    </group>
  );
}

/**
 * The wall the doorway is cut into, built as an extruded shape with a circular
 * hole so the corridor is genuinely visible once the door swings. Also carries
 * the ruled ledger margin that the brief wants on every large surface.
 */
export function DoorWall() {
  const halfW = VAULT.halfWidth + VAULT.wallThickness;
  const h = VAULT.ceiling;
  const t = VAULT.wallThickness;

  const geometry = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-halfW, 0);
    shape.lineTo(halfW, 0);
    shape.lineTo(halfW, h);
    shape.lineTo(-halfW, h);
    shape.closePath();

    const hole = new Path();
    hole.absarc(0, VAULT.doorCentre.y, VAULT.doorRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const geo = new ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 48 });
    geo.translate(0, 0, -t);
    return geo;
  }, [halfW, h, t]);

  return <Solid geometry={geometry} material={materials.surface} />;
}