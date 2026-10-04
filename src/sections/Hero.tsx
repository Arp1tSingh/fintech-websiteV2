import { useEffect, useRef } from "react";
import { SectionShell } from "../components/SectionShell";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { motion } from "../lib/motion";
import { SITE } from "../content/site";

/**
 * Hero — brief section 3.0.
 *
 * Just the giant FINTECH VIT wordmark over the closed vault door: characters
 * rise in a stagger out of a masked overflow, with a very slow breathing
 * push-in behind them (DESIGN.md range 0.00-0.08). The marginalia, lede,
 * scroll cue and ticker were removed per the site owner — the first screen is
 * the wordmark and nothing else.
 */
export function Hero() {
  const title = useRef<HTMLHeadingElement>(null);

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
      );

      return () => {
        tl.kill();
      };
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <SectionShell id="hero" poster={0} align="center" hold>
      <div className="hero hero--wordmark">
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
    </SectionShell>
  );
}