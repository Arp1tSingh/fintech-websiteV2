import { useEffect, useRef } from "react";
import { SectionShell, Panel } from "../components/SectionShell";
import { BarChartMotif, BranchMarquee, NetworkMotif, SplitLine } from "../components/Motifs";
import { BranchChips } from "../components/Cards";
import { RedactionBar, useIsMobile } from "../components/Motion";
import { prefersReducedMotion } from "../lib/gsap";
import { clamp, RANGES } from "../lib/scroll";
import { goalWindows } from "../three/layout";
import { scroll } from "../three/progress";
import { GOALS } from "../content/site";

/**
 * Goals / Ideology — brief section 3.2, and DESIGN.md section 4.
 *
 * Five ledger entries, ENTRY 01 to ENTRY 05, on a horizontal track that scrolls
 * while the section is pinned. Each entry has a signature interaction: a bar
 * chart that builds itself, redaction bars that wipe away, a finance/tech split
 * line, a branch marquee, and a network of connecting dots.
 *
 * THE ALIGNMENT RULE (DESIGN.md section 5): the track position is derived from
 * goalWindows(), the same station table the 3D camera samples, so entry i is
 * centred in the viewport exactly while the camera dwells at featured drawer i.
 * Nothing here is positioned from a projected 3D coordinate.
 */

const WINDOWS = goalWindows();
const GOALS_RANGE = RANGES.find((r) => r.id === "goals")!;

/** Master progress -> the goals section's own local 0..1. */
function localOf(p: number): number {
  return clamp((p - GOALS_RANGE.start) / (GOALS_RANGE.end - GOALS_RANGE.start), 0, 1);
}

/**
 * Which entry is centred, as a continuous index. Inside entry i's window the
 * value pins to i; between windows it slides, so the track glides rather than
 * snapping one card at a time.
 */
function centredIndex(masterProgress: number): number {
  const l = localOf(masterProgress);
  const keys: [number, number][] = [];
  WINDOWS.forEach((w, i) => {
    keys.push([localOf(w.start), i]);
    keys.push([localOf(w.end), i]);
  });
  keys.sort((a, b) => a[0] - b[0]);

  if (l <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (l >= t0 && l <= t1) {
      const k = t1 === t0 ? 0 : (l - t0) / (t1 - t0);
      return v0 + (v1 - v0) * k;
    }
  }
  return keys[keys.length - 1][1];
}

export function Goals() {
  const track = useRef<HTMLDivElement>(null);
  const mobile = useIsMobile();
  // Reduced motion and mobile both drop the horizontal pinned track for a
  // vertical stack (DESIGN_BRIEF.md section 6).
  const stack = mobile || prefersReducedMotion();

  useEffect(() => {
    const el = track.current;
    if (!el || stack) return;

    let raf = requestAnimationFrame(function loop() {
      const i = centredIndex(scroll.progress);
      // calc() with a unitless custom property keeps this resolution-independent.
      el.style.setProperty("--i", i.toFixed(4));
      el.style.setProperty("--active", String(Math.round(i)));
      raf = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(raf);
  }, [stack]);

  return (
    <SectionShell id="goals" poster={2} align="lower">
      <div className="section__stack">
        <header className="goals__head">
          <p className="label">SECTION 03 — GOALS / IDEOLOGY</p>
          <h2 className="goals__title">Five entries</h2>
        </header>

        <div ref={track} className={`goals__track${stack ? " goals__track--stack" : ""}`} role="list">
        {GOALS.map((goal, i) => (
          <Panel
            key={goal.entry}
            as="article"
            className={`entry entry--${i + 1}`}
            tone={i % 2 === 0 ? "parchment" : "ink"}
          >
            <div role="listitem" className="entry__inner">
              <p className="entry__no label">{goal.entry}</p>
              <h3 className="entry__title">{goal.title}</h3>

              {i === 1 ? (
                // The redaction wipe is the signature interaction for the scam
                // theme, so the copy sits under it rather than beside it.
                <div className="entry__redacted">
                  <p className="entry__body">{goal.body}</p>
                  <RedactionBar lines={3} />
                </div>
              ) : (
                <>
                  {i === 0 ? <BarChartMotif /> : null}
                  <p className="entry__body">{goal.body}</p>
                  {i === 2 ? <SplitLine /> : null}
                  {i === 3 ? (mobile ? <BranchChips /> : <BranchMarquee />) : null}
                  {i === 4 ? <NetworkMotif /> : null}
                </>
              )}
            </div>
          </Panel>
        ))}
        </div>
      </div>
    </SectionShell>
  );
}