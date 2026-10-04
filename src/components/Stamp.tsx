import { useRef, type ReactNode } from "react";
import { gsap } from "../lib/gsap";
import { motion } from "../lib/motion";
import { useEnterWhenVisible } from "./Motion";

/**
 * An oxblood stamp: mechanical, never soft. Presentational only — the landing
 * animation belongs to whoever places it, because a stamp inside a pinned panel
 * cannot be triggered by its own position (see useEnterWhenVisible).
 */
export function Stamp({
  lines,
  className = "",
  rotate = -7,
}: {
  lines: string[];
  className?: string;
  rotate?: number;
}) {
  return (
    <div
      className={`stamp label-lg ${className}`}
      style={{ rotate: `${rotate}deg` }}
      aria-hidden="true"
    >
      {lines.map((l) => (
        <span key={l} className="stamp__line">
          {l}
        </span>
      ))}
    </div>
  );
}

/**
 * Hand-drawn signature-style underline for the convener sign-off (brief
 * section 3.1). Drawn with stroke-dashoffset, not a gradient.
 */
export function SignatureRule({ className = "" }: { className?: string }) {
  const host = useRef<HTMLSpanElement>(null);
  const ref = useRef<SVGPathElement>(null);

  const line = () => ref.current;

  useEnterWhenVisible(
    host,
    () => {
      const p = line();
      if (!p) return;
      gsap.to(p, { strokeDashoffset: 0, duration: motion.dur.slow, ease: motion.ease.inOut });
    },
    0.1,
    () => {
      const p = line();
      if (p) {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      }
    },
  );

  return (
    <span ref={host} className="signature-host">
      <svg className={`signature ${className}`} viewBox="0 0 220 18" fill="none" aria-hidden="true">
        <path
          ref={ref}
          data-draw
          d="M3 12 C 34 4, 52 15, 78 9 S 122 3, 148 10 S 190 14, 217 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Small caps mono label with a leading rule, used all over the ledger cards. */
export function EntryLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`entry-label label ${className}`}>
      <span className="entry-label__rule" aria-hidden="true" />
      {children}
    </p>
  );
}