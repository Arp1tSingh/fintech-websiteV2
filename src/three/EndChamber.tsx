import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { BoxGeometry, CylinderGeometry, PlaneGeometry, type Group } from "three";
import { Solid, Decal } from "./Solid";
import { materials } from "./materials";
import { VAULT } from "./layout";
import { scroll } from "./progress";
import { clamp, smoothstep } from "../lib/scroll";
import { makeLabelTexture, makeNameplateTexture } from "./geom/textures";
import { NAMEPLATE_NAMES, TEAM_HEADS } from "../content/site";

/**
 * The end chamber — DESIGN.md section 4.
 *
 * A short round room at the corridor's end with two larger lockers: Build with
 * n8n (7 Oct) and Black Ledger (12 Oct). The Black Ledger locker is oxblood, its
 * door ajar, its interior near-black, with a single paper tag hanging from the
 * handle — and it is the ONLY oxblood surface inside the dark corridor, which
 * is what makes it the focal point of the whole page (DESIGN.md section 10).
 */

const BLACK_LEDGER_START = 0.66;

export function EndChamber() {
  const n8n = useRef<Group>(null);
  const ledger = useRef<Group>(null);
  const tag = useRef<Group>(null);

  const geo = useMemo(
    () => ({
      body: new BoxGeometry(VAULT.lockerW, VAULT.lockerH, VAULT.lockerD),
      cavity: new BoxGeometry(VAULT.lockerW - 0.5, VAULT.lockerH - 0.5, VAULT.lockerD - 0.2),
      door: new BoxGeometry(VAULT.lockerW - 0.12, VAULT.lockerH - 0.12, 0.14),
      handle: new BoxGeometry(0.5, 0.14, 0.3),
      label: new PlaneGeometry(2.6, 0.8),
      date: new PlaneGeometry(1.4, 0.4),
      tag: new PlaneGeometry(0.5, 0.9),
      cord: new CylinderGeometry(0.02, 0.02, 0.5, 5),
      plinth: new BoxGeometry(VAULT.lockerW + 0.5, 0.24, VAULT.lockerD + 0.4),
    }),
    [],
  );

  const n8nLabel = useMemo(() => makeLabelTexture("N8N"), []);
  const n8nDate = useMemo(() => makeLabelTexture("07 OCT"), []);
  const ledgerLabel = useMemo(() => makeLabelTexture("BLACK LEDGER"), []);
  const ledgerDate = useMemo(() => makeLabelTexture("12 OCT"), []);

  useFrame((state) => {
    const p = scroll.progress;

    // n8n opens first, then the ajar Black Ledger locker is held in frame.
    const n = smoothstep(clamp((p - 0.63) / 0.05, 0, 1));
    if (n8n.current) n8n.current.rotation.y = -n * 1.15;

    const b = smoothstep(clamp((p - BLACK_LEDGER_START) / 0.05, 0, 1));
    if (ledger.current) ledger.current.rotation.y = -b * 0.44;

    // A single paper tag hanging from the handle, swaying on scroll.
    if (tag.current) {
      const sway = Math.sin(state.clock.elapsedTime * 0.9) * 0.05;
      tag.current.rotation.z = sway + clamp((p - 0.66) * 0.6, 0, 0.4) * 0.5;
      tag.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.7 + 1.2) * 0.04;
    }
  });

  return (
    <group>
      <Locker
        // n8n, stage left
        x={-VAULT.lockerX}
        label={n8nLabel}
        date={n8nDate}
        surface={materials.face}
        doorRef={n8n}
        geo={geo}
        oxblood={false}
      />
      <Locker
        // Black Ledger, stage right, and the only oxblood in the corridor
        x={VAULT.lockerX}
        label={ledgerLabel}
        date={ledgerDate}
        surface={materials.oxblood}
        doorRef={ledger}
        geo={geo}
        oxblood
        tagRef={tag}
      />
    </group>
  );
}

function Locker({
  x,
  label,
  date,
  surface,
  doorRef,
  geo,
  oxblood,
  tagRef,
}: {
  x: number;
  label: import("three").Texture;
  date: import("three").Texture;
  surface: (typeof materials)["face"];
  doorRef: RefObject<Group | null>;
  geo: Record<string, BoxGeometry | PlaneGeometry | CylinderGeometry>;
  oxblood: boolean;
  tagRef?: RefObject<Group | null>;
}) {
  const z = VAULT.lockerZ;
  const y = VAULT.lockerY;
  // Hinged on its left edge, like the vault door.
  const hingeX = x - VAULT.lockerW / 2;

  return (
    <group>
      <Solid geometry={geo.plinth} material={materials.surface} position={[x, 0.12, z]} />

      {/* carcass: outer box with a near-black cavity inside it */}
      <Solid geometry={geo.body} material={materials.surface} position={[x, y, z]} />
      <Solid geometry={geo.cavity} material={materials.deep} position={[x, y, z + VAULT.lockerD / 2 - 0.05]} />

      {/* door */}
      <group ref={doorRef} position={[hingeX, y, z + VAULT.lockerD / 2 + 0.07]}>
        <group position={[VAULT.lockerW / 2, 0, 0]}>
          <Solid geometry={geo.door} material={surface} />
          <Solid geometry={geo.handle} material={materials.surface} position={[0, -1.1, 0.18]} />
          <Decal geometry={geo.label} map={label} role="outline" position={[0, 0.55, 0.09]} />
          <Decal geometry={geo.date} map={date} role="outline" position={[0, -0.35, 0.09]} />
          {oxblood && (
            <group ref={tagRef} position={[0, -1.1, 0.3]}>
              <mesh geometry={geo.cord} material={materials.surface} position={[0, -0.25, 0]} />
              <mesh geometry={geo.tag} material={materials.paper} position={[0, -0.95, 0]} />
            </group>
          )}
        </group>
      </group>
    </group>
  );
}

/**
 * A wall of hanging nameplate tags behind the lockers, which the Committee panel
 * sits over (DESIGN.md section 5, 0.78-0.90). Geometry only — no photos, no
 * textures beyond the lettering.
 */
export function NameplateWall() {
  const wall = useRef<Group>(null);
  const tag = useMemo(() => new PlaneGeometry(2.1, 0.8), []);
  const cord = useMemo(() => new CylinderGeometry(0.015, 0.015, 0.22, 4), []);

  const tags = useMemo(() => {
    const cols = 4;
    return NAMEPLATE_NAMES.map((name, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      return {
        name,
        x: (c - (cols - 1) / 2) * 2.5,
        y: 5.4 - r * 1.15,
        phase: i * 0.7,
      };
    });
  }, []);

  useFrame((state) => {
    const g = wall.current;
    if (!g) return;
    const p = scroll.progress;
    // The wall of nameplate tags belongs to the Committee beat only; before
    // that it would just be clutter behind the lockers.
    g.visible = p > 0.72;
    if (!g.visible) return;
    // Hanging tags sway, strongest while the panel is actually on screen.
    const vis = clamp(1 - Math.abs(p - 0.84) / 0.1, 0, 1);
    g.children.forEach((child, i) => {
      child.rotation.z = Math.sin(state.clock.elapsedTime * 0.8 + tags[i].phase) * 0.07 * vis;
    });
  });

  const roles = new Map<string, string>([...TEAM_HEADS.map((t) => [t.name, t.role] as const)]);

  return (
    <group ref={wall} position={[0, 0, VAULT.chamberBackZ + 0.12]}>
      {tags.map((t) => (
        <group key={t.name} position={[t.x, t.y, 0]}>
          <mesh geometry={cord} material={materials.surface} position={[0, 0.5, 0]} />
          <Decal
            geometry={tag}
            map={nameplateTexture(t.name, roles.get(t.name) ?? "")}
            role="face"
            position={[0, 0, 0]}
          />
        </group>
      ))}
    </group>
  );
}

const plateCache = new Map<string, import("three").Texture>();

/** Nameplate textures are generated once and shared; there are only seven. */
function nameplateTexture(name: string, role: string) {
  const key = `${name}|${role}`;
  let t = plateCache.get(key);
  if (!t) {
    t = makeNameplateTexture(name, role);
    plateCache.set(key, t);
  }
  return t;
}