import { SectionShell, Panel } from "../components/SectionShell";
import { MemberCard, Nameplate } from "../components/Cards";
import { EXECS, TEAM_HEADS } from "../content/site";

/**
 * Committee — brief section 3.5, and DESIGN.md section 5 (0.78-0.90).
 *
 * Two tiers: the three execs larger, the seven team heads in a grid. Cards are
 * torn paper with the two-tone dot texture, the name in display type, the role
 * in mono; hover or tap swaps the role label for the tagline.
 *
 * Phone numbers do NOT appear here — they live in Contact Us only, so there is
 * exactly one place to change if the committee decides otherwise.
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
        </section>

        <section className="committee__tier" aria-labelledby="heads-heading">
          <h3 id="heads-heading" className="committee__sub label">
            Team Heads
          </h3>
          <ul className="committee__heads">
            {TEAM_HEADS.map((t) => (
              <Nameplate key={t.name} name={t.name} role={t.role} tagline={t.tagline} />
            ))}
          </ul>
        </section>
      </Panel>
    </SectionShell>
  );
}