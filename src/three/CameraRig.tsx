import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Vector3 } from "three";
import { StationTrack } from "./StationTrack";
import { APPROACH, JOURNEY, RETREAT } from "./layout";
import { runtime, sampleFps, scroll } from "./progress";
import { prefersReducedMotion } from "../lib/gsap";

const DEG = Math.PI / 180;
/** Vertical FOV, and the aspect it was authored against. */
const BASE_FOV = 46;
const REF_ASPECT = 1.6;
/** Never crop so tight that the corridor walls leave the frame. */
const MIN_FOV = 32;

/**
 * The camera rig — DESIGN.md section 5.
 *
 * Three tracks: the approach through the doorway (0.00-0.30), the journey down
 * the corridor and around the lockers (0.30-0.90), and the retreat back out to
 * the door (0.90-1.00). Smoothing comes from Lenis and from nowhere else —
 * there is deliberately no second damping layer on the camera.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const tracks = useMemo(
    () => ({
      approach: new StationTrack(APPROACH),
      journey: new StationTrack(JOURNEY),
      retreat: new StationTrack(RETREAT),
    }),
    [],
  );

  const still = prefersReducedMotion();
  const offset = useMemo(() => new Vector3(), []);

  /**
   * Ultrawide framing. A fixed VERTICAL fov means a wider window simply shows
   * more world, so on a 1900px monitor the vault reads small and distant. Past
   * the reference aspect we hold the HORIZONTAL field constant instead, which
   * keeps the door the same size on screen whatever the window shape.
   */
  useEffect(() => {
    const cam = camera as PerspectiveCamera;
    if (!(cam instanceof PerspectiveCamera)) return;
    const aspect = size.width / Math.max(1, size.height);
    if (aspect <= REF_ASPECT) {
      cam.fov = BASE_FOV;
    } else {
      const hAtRef = 2 * Math.atan(Math.tan((BASE_FOV * DEG) / 2) * REF_ASPECT);
      cam.fov = Math.max(MIN_FOV, (2 * Math.atan(Math.tan(hAtRef / 2) / aspect)) / DEG);
    }
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  // The motion probe reads the live camera to prove it is actually travelling.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("debug")) return;
    (window as unknown as Record<string, unknown>).__ftCamera = camera;
  }, [camera]);

  useFrame((state, dt) => {
    sampleFps(dt * 1000);
    if (runtime.reducedMotion) return;

    const p = scroll.progress;
    const { pos, look } =
      p < 0.3 ? tracks.approach.sample(p) : p < 0.9 ? tracks.journey.sample(p) : tracks.retreat.sample(p);

    offset.copy(pos);

    /* Very slow breathing push-in while the door is still shut. */
    if (p < 0.08) {
      const breathe = (Math.sin(state.clock.elapsedTime * 0.32) + 1) * 0.5;
      offset.z -= breathe * 0.7;
      offset.y += Math.sin(state.clock.elapsedTime * 0.21) * 0.06;
    }

    /* Optional desktop mouse parallax: a few percent, off under reduced motion. */
    if (!still) {
      offset.x += scroll.pointerX * 0.5;
      offset.y += scroll.pointerY * 0.32;
    }

    camera.position.copy(offset);
    camera.lookAt(look);
  });

  return null;
}