import { PosterBackdrop } from "./PosterFrames";
import { SITE } from "../content/site";

/**
 * The no-WebGL tier (DESIGN.md section 8).
 *
 * "Same poster frames — generate them from the scene itself so they match." On a
 * machine with no WebGL there is no scene to generate from, so this is the
 * honest fallback: the ruled ledger paper plus an outlined wordmark and the
 * palette arc's three key colours as flat bands. It keeps the page's identity
 * and loses the vault, rather than pretending.
 *
 * If poster capture succeeds on a reduced-motion machine, those stills are used
 * instead and this never renders.
 */
export function StaticBackdrop({ reason }: { reason: "no-webgl" }) {
  const hasPosters = reason === "no-webgl";
  return (
    <div className={`static-backdrop static-backdrop--${reason}`} aria-hidden="true">
      {hasPosters ? <PosterBackdrop index={0} className="static-backdrop__poster" /> : null}
      <div className="static-backdrop__bands">
        <span className="static-backdrop__band static-backdrop__band--parchment" />
        <span className="static-backdrop__band static-backdrop__band--ink" />
        <span className="static-backdrop__band static-backdrop__band--parchment" />
        <span className="static-backdrop__band static-backdrop__band--oxblood" />
      </div>
      <span className="static-backdrop__mark">{SITE.wordmark}</span>
    </div>
  );
}