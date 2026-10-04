import { useEffect } from "react";
import { Nav } from "./components/Nav";
import { Hero } from "./sections/Hero";
import { About } from "./sections/About";
import { Goals } from "./sections/Goals";
import { Events } from "./sections/Events";
import { Committee } from "./sections/Committee";
import { VaultCanvas, detectWebGL } from "./three/VaultCanvas";
import { runtime, scroll, setPointer, setProgress } from "./three/progress";
import { initScroll, destroyScroll, scrollToProgress } from "./lib/lenis";
import { sectionVh } from "./lib/scroll";
import { ScrollTrigger, prefersReducedMotion, refreshScroll } from "./lib/gsap";
import { StaticBackdrop } from "./three/StaticBackdrop";
import { setScrubProgress } from "./three/progress";
import { RECORD } from "./content/site";

/**
 * App shell and scroll wiring.
 *
 * One master ScrollTrigger writes `progress` for the whole document; the 3D
 * reads it in useFrame and every section reads its own local 0..1. That is the
 * only source of truth (DESIGN.md section 2).
 */
export default function App() {
  const webgl = detectWebGL();
  runtime.webgl = webgl;
  runtime.reducedMotion = prefersReducedMotion();

  useEffect(() => {
    initScroll();

    // The master progress. A single trigger over the whole document; the dev
    // scrub slider takes precedence while it is being dragged.
    const master = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        if (!scroll.scrubbing) setProgress(self.progress);
      },
    });

    // Fonts change the height of everything; re-measure once they land.
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    void fonts?.ready.then(() => refreshScroll());

    // Optional desktop mouse parallax, a few percent of camera offset.
    const onPointer = (e: PointerEvent) => {
      if (prefersReducedMotion()) return;
      if (e.pointerType !== "mouse") return;
      setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    const onLeave = () => setPointer(0, 0);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    // A tiny handle for driving the page from outside (used by the screenshot
    // pass, and handy for re-tuning the choreography by hand). Opt-in only.
    if (new URLSearchParams(window.location.search).has("debug")) {
      const w = window as unknown as Record<string, unknown>;
      w.ft = { progress: scrollToProgress, scrub: (p: number) => setScrubProgress(p), state: scroll };
      w.__ftState = scroll;
      w.__ftRuntime = runtime;
    }

    return () => {
      master.kill();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
      destroyScroll();
    };
  }, []);

  return (
    <>
      <a className="skip-link label" href="#about">
        Skip to content
      </a>

      {/* The canvas is decorative: aria-hidden, behind everything, and the page
          is fully usable with it removed. */}
      {webgl ? <VaultCanvas /> : <StaticBackdrop reason="no-webgl" />}

      {/* Ruled ledger paper, between the canvas and the content. */}
      <div className="ruled-layer" aria-hidden="true" />

      <Nav />

      <main className="content">
        <Hero />
        <About />
        {/* 0.22-0.30 is the camera passing through the doorway: no DOM beats,
            just scroll runway, so the section is a labelled spacer. */}
        <div id="transition" className="spacer" aria-hidden="true" />
        <Goals />
        <Events />
        <Committee />
        {/* 0.90-1.00 is the retreat and the door shutting: no DOM beats, just
            scroll runway, so this section is a labelled spacer exactly like
            the through-doorway one above. The CONTACT section was removed per
            the site owner — but its progress range stays, because the range is
            what drives the 3D retreat. */}
        <div
          id="contact"
          className="spacer"
          style={{ height: `${sectionVh("contact")}vh` }}
          aria-hidden="true"
        />
      </main>

      {/*
        The Record (brief section 3.4) is skipped for now, per the build plan.
        Flip RECORD.enabled in src/content/site.ts and mount Record here to bring
        the receipts and stepped count-ups back.
      */}
      {RECORD.enabled ? <div data-record-slot /> : null}
    </>
  );
}