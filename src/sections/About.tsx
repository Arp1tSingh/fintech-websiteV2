import { useEffect, useRef } from "react";
import { SectionShell, Panel } from "../components/SectionShell";
import { gsap, prefersReducedMotion } from "../lib/gsap";
import { ABOUT } from "../content/site";

/**
 * About Us — brief section 3.1.
 *
 * Pinned and scrubbed: the paragraph reveals word by word, "textbook ideas"
 * takes an oxblood strike-through that draws across it, then "experiences"
 * underlines itself. That one line is the thesis of the whole committee, so it
 * gets the only two gestures on the page.
 *
 * Over the 3D, this is the door opening: the wheel spins about 1.5 turns, the
 * bolts retract radially, the door swings open about 100 degrees and the camera
 * pushes toward the opening (DESIGN.md range 0.08-0.22).
 */

/**
 * The About copy is verbatim, so the two emphasised phrases are located in the
 * string rather than re-authored — that way editing ABOUT.body cannot silently
 * break the typography.
 */
function splitAbout(body: string, strike: string, underline: string) {
  const out: { text: string; kind: "plain" | "strike" | "underline" }[] = [];
  const marks: { start: number; end: number; kind: "strike" | "underline" }[] = [];

  for (const [phrase, kind] of [
    [strike, "strike"],
    [underline, "underline"],
  ] as const) {
    const start = body.indexOf(phrase);
    if (start >= 0) marks.push({ start, end: start + phrase.length, kind });
  }
  marks.sort((a, b) => a.start - b.start);

  let cursor = 0;
  for (const m of marks) {
    if (m.start > cursor) out.push({ text: body.slice(cursor, m.start), kind: "plain" });
    out.push({ text: body.slice(m.start, m.end), kind: m.kind });
    cursor = m.end;
  }
  if (cursor < body.length) out.push({ text: body.slice(cursor), kind: "plain" });
  return out;
}

/** One scrub target per word. Real spaces between them so the line still wraps. */
function Words({ text }: { text: string }) {
  const words = text.split(" ").filter(Boolean);
  return (
    <>
      {words.map((w, i) => (
        <span key={`${w}-${i}`}>
          <span data-word>{w}</span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

export function About() {
  const bodyRef = useRef<HTMLParagraphElement>(null);

  const parts = splitAbout(ABOUT.body, ABOUT.strike, ABOUT.underline);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const words = Array.from(el.querySelectorAll<HTMLElement>("[data-word]"));
    // The strike and underline live inside the paragraph, not the footer.
    const rules = Array.from(el.querySelectorAll<SVGPathElement>("[data-draw]"));

    if (prefersReducedMotion()) {
      gsap.set(words, { opacity: 1 });
      gsap.set(rules, { strokeDashoffset: 0 });
      return;
    }

    rules.forEach((r) => {
      const len = r.getTotalLength();
      gsap.set(r, { strokeDasharray: len, strokeDashoffset: len });
    });
    gsap.set(words, { opacity: 0.15 });

    // Scrubbed to scroll: word opacity 0.15 -> 1, then the strike draws across,
    // then the underline pulls itself. Reverses exactly on the way back up.
    //
    // Timed to finish by ~36% of the section. A section's panel only occupies the
    // viewport until it starts sliding away, which here is around 43% of the
    // range — spreading the reveal across the whole range meant the last beats
    // played on a card that was already fading out and partly transparent.
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#about",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });

    tl.to(words, { opacity: 1, duration: 0.2, ease: "none" }, 0);
    rules.forEach((r, i) => {
      tl.to(r, { strokeDashoffset: 0, duration: 0.07, ease: "none" }, 0.23 + i * 0.07);
    });
    tl.to({}, { duration: 0.02 });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [parts.length]);

  return (
    <SectionShell id="about" poster={1} align="lower">
      <Panel className="about" tone="parchment">
        <header className="about__head">
          <p className="label">ENTRY — ABOUT US</p>
          <h2 className="panel__heading">{ABOUT.heading}</h2>
        </header>

        <p className="about__body measure" ref={bodyRef}>
          <span className="visually-hidden">{ABOUT.body}</span>
          <span aria-hidden="true">
            {parts.map((p, i) =>
              p.kind === "plain" ? (
                <Words key={i} text={p.text} />
              ) : (
                <span key={i} className={`about__mark about__mark--${p.kind}`}>
                  <Words text={p.text} />
                  {p.kind === "strike" ? (
                    <svg
                      className="about__strike"
                      viewBox="0 0 100 10"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path
                        data-draw
                        d="M1 6 C 30 2, 62 9, 99 4"
                        stroke="var(--color-oxblood)"
                        strokeWidth="2.5"
                        fill="none"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="about__underline"
                      viewBox="0 0 100 8"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path data-draw d="M1 4 H 99" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  )}
                </span>
              ),
            )}
          </span>
        </p>
      </Panel>
    </SectionShell>
  );
}