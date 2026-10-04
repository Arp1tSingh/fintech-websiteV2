import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { TICKER } from "../content/site";

/**
 * Ticker tape across the bottom of the hero — brief section 3.0, verbatim:
 * "BIDBLAZE · 13 TEAMS · ₹29 CR KOHLI SALE · …". Constant, slow, mechanical.
 *
 * Under reduced motion the loop stops but the line stays, because the content
 * is information and not decoration.
 */
export function Ticker() {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const half = () => el.scrollWidth / 2;
      const tween = gsap.to(el, {
        x: () => -half(),
        duration: 32,
        ease: "none",
        repeat: -1,
      });
      return () => {
        tween.kill();
      };
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div className="ticker" aria-label={TICKER}>
      <div className="ticker__rule" aria-hidden="true" />
      <div className="ticker__viewport">
        <div ref={track} className="ticker__track">
          {/* Two copies so the loop has no visible seam. */}
          <span className="ticker__item">{TICKER}</span>
          <span className="ticker__item" aria-hidden="true">
            {TICKER}
          </span>
        </div>
      </div>
      <div className="ticker__rule" aria-hidden="true" />
    </div>
  );
}