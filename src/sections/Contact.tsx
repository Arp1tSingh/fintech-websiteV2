import { useEffect, useRef } from "react";
import { SectionShell, Panel } from "../components/SectionShell";
import { ContactSlip } from "../components/Cards";
import { Stamp } from "../components/Stamp";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { gsapSet, useEnterWhenVisible } from "../components/Motion";
import { motion } from "../lib/motion";
import { EXECS, FOOTER, CONVENERS, SITE } from "../content/site";

/**
 * Contact Us / footer — brief section 3.6, and the last beat of DESIGN.md
 * section 5 (0.90-1.00).
 *
 * The three execs as deposit-slip cards with tap-to-call numbers, a giant
 * outlined wordmark slowly parallaxing at the bottom, and the door swinging
 * shut behind it all with a GET IN TOUCH stamp.
 *
 * The door closing is the ending chosen in the build plan: it costs a little
 * extra scroll but gives the journey an actual end, and the stamp is the last
 * mechanical gesture on the page.
 */
export function Contact() {
  const wordmark = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Contact slips arrive with the panel, not at page load: this is a pinned
  // section, so its own layout position is not where it is seen.
  useEnterWhenVisible(
    panel,
    () => {
      gsap.fromTo(
        panel.current?.querySelectorAll("[data-slice]") ?? [],
        { y: motion.enter.y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: motion.dur.base,
          ease: motion.ease.out,
          stagger: motion.stagger.cards,
        },
      );
    },
    0.1,
    () => gsapSet(panel.current?.querySelectorAll("[data-slice]"), { y: motion.enter.y, opacity: 0 }),
  );

  // The giant outlined wordmark parallaxes against the scroll. Scrubbed off the
  // section element itself, which is a normal block and therefore measures
  // correctly.
  useEffect(() => {
    const el = wordmark.current;
    if (!el || prefersReducedMotion()) return;

    const tween = gsap.fromTo(
      el,
      { yPercent: 14 },
      {
        yPercent: -14,
        ease: "none",
        scrollTrigger: {
          trigger: "#contact",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
      },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <SectionShell id="contact" poster={5} align="lower">
      <Panel tone="parchment" className="contact">
        <div ref={panel}>
          <header className="contact__head">
            <p className="label">SECTION 06 — CONTACT US</p>
            <h2 className="panel__heading">Get in touch</h2>
          </header>

          <ul className="contact__slips">
            {EXECS.map((exec, i) => (
              <li key={exec.name} data-slice>
                <ContactSlip exec={exec} index={i} />
              </li>
            ))}
          </ul>

          <footer className="contact__foot">
            <p className="contact__inst">{SITE.institute}</p>
            <p className="contact__conv label">
              {FOOTER.auditedBy}: {CONVENERS.join(" · ")}
            </p>
          </footer>
        </div>
      </Panel>

      <div ref={wordmark} className="contact__wordmark" aria-hidden="true">
        <span>{SITE.wordmark}</span>
      </div>

      <Stamp lines={[FOOTER.closing]} className="contact__stamp" rotate={-4} />
    </SectionShell>
  );
}