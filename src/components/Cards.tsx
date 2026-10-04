import { useState } from "react";
import { BRANCHES, type Exec } from "../content/site";

/**
 * Committee member card. Torn-paper portrait with the two-tone dot texture
 * (brief section 3.5); hover swaps the role label for the tagline, and tapping
 * the name copies the exec's phone number — the footnote under the execs says
 * so. Only the three execs carry a portrait — DESIGN.md rules out photo
 * assets, so the team heads live on the 3D nameplate wall instead.
 */
export function MemberCard({ exec, index }: { exec: Exec; index: number }) {
  const [copied, setCopied] = useState(false);

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(exec.tel);
    } catch {
      // No async clipboard (old browser, no permission): the classic shim.
      const ta = document.createElement("textarea");
      ta.value = exec.tel;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <li className="member">
      <div className="member__photo torn-photo">
        <img src={exec.photo} alt="" width={320} height={400} loading="lazy" decoding="async" />
        <span className="member__dots" aria-hidden="true" />
        <span className="member__no label">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="member__text">
        <button
          type="button"
          className="member__name member__copy"
          onClick={copyNumber}
          title={`Copy ${exec.name}'s number`}
        >
          {exec.name}
        </button>
        <span className="member__copied label" aria-live="polite">
          {copied ? `Copied ${exec.telLabel}` : ""}
        </span>
        <p className="member__swap">
          <span className="member__role label">{exec.role}</span>
          <span className="member__tagline">{exec.tagline}</span>
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