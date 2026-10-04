import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, Fog } from "three";
import { VaultDoor, DoorWall } from "./VaultDoor";
import { Corridor } from "./Corridor";
import { FeaturedDrawers } from "./FeaturedDrawers";
import { EndChamber, NameplateWall } from "./EndChamber";
import { CameraRig } from "./CameraRig";
import { applyPalette } from "./materials";
import { paletteAt } from "./palette";
import { scroll } from "./progress";

/**
 * The whole vault. Registered first in the tree so its useFrame runs before
 * everything else, which is what lets the palette be written once per frame
 * into the shared materials instead of traversed.
 */
export function VaultScene() {
  const scene = useThree((s) => s.scene);

  // The e2e pass needs the scene to verify fog and outlines survive the low tier.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("debug")) return;
    (window as unknown as Record<string, unknown>).__ftScene = scene;
  }, [scene]);

  useEffect(() => {
    scene.background = new Color(paletteAt(0).bg);
    const fog = new Fog(new Color(paletteAt(0).bg), 12, 58);
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useFrame(() => {
    const colors = paletteAt(scroll.progress);
    applyPalette(colors);

    if (scene.background instanceof Color) scene.background.copy(colors.bg);
    const fog = scene.fog as Fog | null;
    // Fog stays on at every tier. With no lights and no shading it is one of
    // only two depth cues the scene has, and without it the corridor stops
    // reading as a corridor at any distance. The low tier takes its budget from
    // the drawer count instead.
    if (fog) fog.color.copy(colors.bg);
  });

  return (
    <>
      <CameraRig />
      <DoorWall />
      <VaultDoor />
      <Corridor />
      <FeaturedDrawers />
      <EndChamber />
      <NameplateWall />
    </>
  );
}