import { useEffect, useRef } from "react";
import { SectionShell } from "../components/SectionShell";
import { DrawSVG, useIsMobile } from "../components/Motion";
import { Ticker } from "../components/Ticker";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { motion } from "../lib/motion";
import { SITE } from "../content/site";
import { scrollToSection } from "../lib/lenis";

/**
 * Hero — brief section 3.0.
 *
 * Giant FINTECH VIT split into characters, rising in a stagger out of a masked
 * overflow; ruled lines draw in from the left, then marginalia fade in beside
 * the title; ticker tape loops along the bottom; a small cue to scroll.
 *
 * Over the 3D, this section is the closed vault door seen head-on with a very
 * slow breathing push-in (DESIGN.md range 0.00-0.08).
 */
export function Hero() {
  const title = useRef<HTMLHeadingElement>(null);
  const marginalia = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const mobile = useIsMobile();

  useEffect(() => {
    const el = title.current;
    if (!el || prefersReducedMotion()) return;
    const chars = el.querySelectorAll<HTMLElement>("[data-hero-char]");

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: motion.ease.out } });

      // Characters rise in a stagger: y 100% to 0 inside a masked line.
      tl.fromTo(
        chars,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: motion.dur.slow,
          stagger: motion.stagger.chars,
        },
        0.1,
      )
        // Then the marginalia fade in beside the title. The ruled lines are NOT
        // animated here: <DrawSVG> owns their stroke-dashoffset. They were never
        // [data-hero-rule] elements, so that selector only made GSAP log a
        // missing target on every load.
        .fromTo(
          marginalia.current?.querySelectorAll("[data-marg]") ?? [],
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: motion.dur.base, stagger: 0.1 },
          0.85,
        )
        .fromTo(
          cue.current,
          { opacity: 0 },
          { opacity: 1, duration: motion.dur.base },
          1.1,
        );

      return () => {
        tl.kill();
      };
    }, el);
    return () => ctx.revert();
  }, [mobile]);

  return (
    <SectionShell id="hero" poster={0} align="center" hold>
      <div className="hero">
        <div className="hero__top">
          <DrawSVG className="hero__rules" viewBox="0 0 200 20">
            <path data-draw d="M2 3 H 198" stroke="currentColor" strokeWidth="0.5" />
            <path data-draw d="M2 10 H 198" stroke="currentColor" strokeWidth="1" />
            <path data-draw d="M2 17 H 198" stroke="currentColor" strokeWidth="0.5" />
          </DrawSVG>

          <div className="hero__marginalia" ref={marginalia} aria-hidden="true">
            {[
              "FILE NO. FV-01",
              "AUDITED",
              "COMMITTEE OF",
              "VIDYALANKAR INSTITUTE OF TECHNOLOGY",
            ].map((m) => (
              <span key={m} data-marg className="label">
                {m}
              </span>
            ))}
          </div>

          <h1 className="hero__title" ref={title}>
            <span className="visually-hidden">{SITE.wordmark}</span>
            <span aria-hidden="true">
              {[...SITE.wordmark].map((c, i) => (
                <span className="mask-line" key={`${c}-${i}`}>
                  <span data-hero-char className="hero__char">
                    {c === " " ? "\u00A0" : c}
                  </span>
                </span>
              ))}
            </span>
          </h1>
        </div>

        {/* Bottom band, clear of the vault door which owns the middle of frame. */}
        <div className="hero__foot">
          <p className="hero__lede measure">
            We bring finance and technology together through hands-on events, expert talks and
            competitions that turn textbook ideas into experiences.
          </p>

          <div className="hero__cue" ref={cue}>
            <button
              type="button"
              className="label hero__cue-btn"
              onClick={() => scrollToSection("about")}
            >
              {SITE.scrollCue}
              <span className="hero__cue-arrow" aria-hidden="true">
                ↓
              </span>
            </button>
          </div>
        </div>
      </div>

      <Ticker />
    </SectionShell>
  );
}