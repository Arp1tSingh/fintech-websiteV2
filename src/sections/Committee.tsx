import { SectionShell, Panel } from "../components/SectionShell";
import { MemberCard } from "../components/Cards";
import { EXECS } from "../content/site";

/**
 * Committee — brief section 3.5, and DESIGN.md section 5 (0.78-0.90).
 *
 * The three execs only. The team heads live on the 3D nameplate wall behind,
 * not in this panel — showing both lists in front was the duplication the
 * site owner flagged. Tapping an exec's name copies their phone number; the
 * footnote says so.
 *
 * Over the 3D, the camera stays in the chamber and rises slightly while the
 * panel sits over a wall of hanging nameplate tags.
 */
export function Committee() {
  return (
    <SectionShell id="committee" poster={4} align="lower" inverted>
      <Panel tone="ink" className="committee on-ink">
        <header className="committee__head">
          <p className="label">SECTION 05 — COMMITTEE</p>
          <h2 className="panel__heading">Who opens the file</h2>
        </header>

        <section className="committee__tier" aria-labelledby="execs-heading">
          <h3 id="execs-heading" className="visually-hidden">
            Executives
          </h3>
          <ul className="committee__execs">
            {EXECS.map((exec, i) => (
              <MemberCard key={exec.name} exec={exec} index={i} />
            ))}
          </ul>
          <p className="committee__hint label">Tap a name to copy their number</p>
        </section>
      </Panel>
    </SectionShell>
  );
}