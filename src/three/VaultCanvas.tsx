import { useEffect, useRef, useState } from "react";
import { Canvas, advance, useThree } from "@react-three/fiber";
import { VaultScene } from "./VaultScene";
import { runtime, scroll, releaseScrub, setScrubProgress } from "./progress";
import { capturePosters, setPosters } from "./PosterFrames";

/**
 * The fixed full-screen canvas (DESIGN.md section 2).
 *
 * Decorative only: aria-hidden and pointer-events-none, behind everything. All
 * real content stays in the DOM, so the page remains fully usable with the
 * canvas removed.
 */

export function detectWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

export function VaultCanvas() {
  // Cap pixel ratio at 1.5; on mobile halve the draw distance and cap 1.25.
  const mobile = window.matchMedia("(max-width: 767.98px)").matches;
  const dpr: [number, number] = mobile ? [1, 1.25] : [1, 1.5];

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  runtime.reducedMotion = reduced;
  runtime.mobile = mobile;

  return (
    <>
      <div
        aria-hidden="true"
        className={`vault-canvas${reduced ? " vault-canvas--still" : ""}`}
        data-tier={runtime.tier}
      >
      <Canvas
          flat
          dpr={dpr}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
            // Only the reduced-motion poster pass calls toDataURL(), which needs
            // the buffer to still be readable after presentation. Leaving it on
            // for the whole page makes the driver stall on every frame to keep
            // the buffer copyable — a real cost for a path nothing else uses.
            preserveDrawingBuffer: reduced,
          }}
          camera={{ fov: 46, near: 0.1, far: 240, position: [0, 3.3, 22.0] }}
          frameloop={reduced ? "demand" : "always"}
        >
          <VaultScene />
          {reduced ? <PosterCapture /> : null}
        </Canvas>
      </div>

      {/* A sibling of the canvas, never a child of it. .vault-canvas sits in a
          z-index 0 stacking context, so a scrubber nested inside it could never
          be raised above the content — it rendered in the corner but every
          click landed on the section panel underneath. */}
      {!reduced && import.meta.env.DEV ? <DevScrubber /> : null}
    </>
  );
}

/**
 * Reduced-motion tier: render the scene once per section, read the pixels back
 * and hand them to the DOM as poster frames. The live canvas is hidden by CSS.
 */
function PosterCapture() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    let cancelled = false;
    const run = async () => {
      // Let the first real frame land before sampling.
      advance(performance.now());
      const posters = await capturePosters((p) => {
        setScrubProgress(p);
        advance(performance.now());
        gl.render(scene, camera);
        return gl.domElement.toDataURL("image/jpeg", 0.72);
      });
      setScrubProgress(null);
      scroll.progress = 0;
      if (!cancelled) setPosters(posters);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);

  return null;
}

/**
 * The scrub slider from DESIGN.md section 9, step 1: "Door only, with a dev
 * slider that scrubs progress 0 to 0.3." Development-only — it is compiled out
 * of the production bundle entirely.
 *
 * It is a MOMENTARY override. Releasing the slider hands control straight back
 * to the scroll, and the current tier is on screen beside it. This was a real
 * bug: the scrub flag used to latch with no way to release it, which froze the
 * vault permanently while the DOM carried on scrolling normally.
 */
function DevScrubber() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(0);
  const [held, setHeld] = useState(false);
  const [, force] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  const release = () => {
    releaseScrub();
    setHeld(false);
  };

  return (
    <div className="dev-scrub">
      <button
        type="button"
        className="label dev-scrub__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        progress
      </button>
      {open ? (
        <>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={value}
            aria-label="Scrub master scroll progress (releases back to scroll)"
            onChange={(e) => {
              const v = Number(e.target.value);
              setValue(v);
              setScrubProgress(v);
              setHeld(true);
            }}
            onPointerUp={release}
            onPointerCancel={release}
            onBlur={release}
            onKeyUp={release}
          />
          <span className="label dev-scrub__state">
            {held ? "held" : "live"} · {runtime.tier} · {Math.round(scroll.fps)}fps
          </span>
        </>
      ) : null}
    </div>
  );
}