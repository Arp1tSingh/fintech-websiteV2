import { BRANCHES, type Exec } from "../content/site";

/**
 * Contact slips — deposit-slip style cards with name, role and a tap-to-call
 * number (brief section 3.6). The number is a tel: link rather than plain text,
 * which is what DESIGN_BRIEF.md section 8 asks for to reduce scraping, and the
 * visible digits are exactly as written in DESIGN.md section 0.
 */
export function ContactSlip({ exec, index }: { exec: Exec; index: number }) {
  return (
    <div className="slip torn-photo">
      <div className="slip__head">
        <span className="slip__no label">NO. {String(index + 1).padStart(3, "0")}</span>
        <span className="slip__role label">{exec.role}</span>
      </div>
      <p className="slip__name">{exec.name}</p>
      <p className="slip__tag">{exec.tagline}</p>
      <a className="slip__tel label-lg" href={`tel:${exec.tel}`}>
        {exec.telLabel}
      </a>
      <div className="slip__perf" aria-hidden="true" />
    </div>
  );
}

/**
 * Committee member card. Torn-paper portrait with the two-tone dot texture
 * (brief section 3.5); hover or tap swaps the role label for the tagline.
 *
 * Only the three execs carry a portrait — DESIGN.md rules out photo assets, so
 * the team heads are typographic nameplates.
 */
export function MemberCard({ exec, index }: { exec: Exec; index: number }) {
  return (
    <li className="member">
      <div className="member__photo torn-photo">
        <img src={exec.photo} alt="" width={320} height={400} loading="lazy" decoding="async" />
        <span className="member__dots" aria-hidden="true" />
        <span className="member__no label">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="member__text">
        <p className="member__name">{exec.name}</p>
        <p className="member__swap">
          <span className="member__role label">{exec.role}</span>
          <span className="member__tagline">{exec.tagline}</span>
        </p>
      </div>
    </li>
  );
}

/** Team head nameplate: type only, no photo. */
export function Nameplate({
  name,
  role,
  tagline,
}: {
  name: string;
  role: string;
  tagline: string;
}) {
  return (
    <li className="plate">
      <span className="plate__cord" aria-hidden="true" />
      <div className="plate__body torn-photo">
        <p className="plate__name">{name}</p>
        <p className="plate__swap">
          <span className="plate__role label">{role}</span>
          <span className="plate__tagline">{tagline}</span>
        </p>
      </div>
    </li>
  );
}

/** Branch chips, static version used by the mobile stack instead of the marquee. */
export function BranchChips() {
  return (
    <ul className="chips" aria-label="Every branch, no prior finance background required">
      {BRANCHES.map((b) => (
        <li key={b} className="chip label">
          {b}
        </li>
      ))}
    </ul>
  );
}