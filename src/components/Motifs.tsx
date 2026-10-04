import { useRef } from "react";
import { dashSet, gsap } from "../lib/gsap";
import { motion } from "../lib/motion";
import { useEnterWhenVisible } from "./Motion";
import { BRANCHES } from "../content/site";

/**
 * The SVG motifs the brief asks for, each drawn in with stroke-dashoffset or a
 * stepped scale. No glow, no blur, no easing that drifts.
 *
 * All of them sit inside pinned panels, so they are triggered by their section
 * arriving rather than by their own layout position — see useEnterWhenVisible.
 */

/* ---------------------------------------------- 01 simulation motif ----- */

/** ENTRY 01: a small bar chart that builds itself. */
export function BarChartMotif({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const ref = useRef<SVGGElement>(null);
  const bars = () => Array.from(ref.current?.querySelectorAll<SVGRectElement>("[data-grow]") ?? []);

  useEnterWhenVisible(
    host,
    () => {
      gsap.fromTo(
        bars(),
        { scaleY: 0, transformOrigin: "bottom center" },
        { scaleY: 1, duration: 0.5, ease: "steps(6)", stagger: motion.stagger.cards },
      );
    },
    0.1,
    () => gsap.set(bars(), { scaleY: 0 }),
  );

  const heights = [10, 18, 14, 26, 34, 30, 42];

  return (
    <div ref={host}>
      <svg className={`motif ${className}`} viewBox="0 0 220 60" aria-hidden="true">
        <line x1="0" y1="52" x2="220" y2="52" stroke="currentColor" strokeWidth="1.5" />
        <g ref={ref}>
          {heights.map((h, i) => (
            <rect
              key={i}
              data-grow
              x={6 + i * 30}
              y={52 - h}
              width="20"
              height={h}
              fill={i === heights.length - 1 ? "var(--color-oxblood)" : "currentColor"}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

/* ----------------------------------------------- 03 node graph ---------- */

/**
 * ENTRY / Build with n8n: three or four nodes connected by lines that draw in
 * sequence on scroll — the automation theme (brief section 3.3).
 */
export function NodeGraph({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const ref = useRef<SVGSVGElement>(null);

  const nodes = [
    { x: 18, y: 30 },
    { x: 76, y: 12 },
    { x: 76, y: 50 },
    { x: 140, y: 30 },
    { x: 200, y: 16 },
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
    [3, 4],
  ];

  const lines = () => Array.from(ref.current?.querySelectorAll<SVGPathElement>("[data-link]") ?? []);
  const dots = () => Array.from(ref.current?.querySelectorAll<SVGCircleElement>("[data-node]") ?? []);

  useEnterWhenVisible(
    host,
    () => {
      lines().forEach((l, i) => {
        gsap.to(l, { strokeDashoffset: 0, duration: 0.45, ease: "none", delay: i * 0.14 });
      });
      dots().forEach((d, i) => {
        gsap.fromTo(
          d,
          { scale: 0, transformOrigin: "center" },
          { scale: 1, duration: 0.3, ease: motion.ease.out, delay: 0.1 + i * 0.14 },
        );
      });
    },
    0.1,
    () => {
      dashSet(lines(), true);
      gsap.set(dots(), { scale: 0 });
    },
  );

  return (
    <div ref={host}>
      <svg ref={ref} className={`motif motif--wide ${className}`} viewBox="0 0 220 62" aria-hidden="true">
        {edges.map(([a, b], i) => (
          <path
            key={i}
            data-link
            d={`M ${nodes[a].x} ${nodes[a].y} L ${nodes[b].x} ${nodes[b].y}`}
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle
              data-node
              cx={n.x}
              cy={n.y}
              r="7"
              fill="var(--color-parchment)"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx={n.x} cy={n.y} r="2.5" fill="currentColor" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* -------------------------------------------- 05 network of dots -------- */

/** ENTRY 05: a row of dots that connect into a network with SVG line draws. */
export function NetworkMotif({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const ref = useRef<SVGSVGElement>(null);

  const dots = [
    { x: 12, y: 34 },
    { x: 62, y: 12 },
    { x: 62, y: 56 },
    { x: 118, y: 34 },
    { x: 172, y: 14 },
    { x: 172, y: 54 },
    { x: 214, y: 34 },
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 4],
    [3, 5],
    [4, 6],
    [5, 6],
  ];

  const netLines = () => Array.from(ref.current?.querySelectorAll<SVGPathElement>("[data-link]") ?? []);

  useEnterWhenVisible(
    host,
    () => {
      netLines().forEach((l, i) => {
        gsap.to(l, { strokeDashoffset: 0, duration: 0.35, ease: "none", delay: i * 0.08 });
      });
    },
    0.1,
    () => dashSet(netLines(), true),
  );

  return (
    <div ref={host}>
      <svg ref={ref} className={`motif motif--wide ${className}`} viewBox="0 0 226 68" aria-hidden="true">
        {edges.map(([a, b], i) => (
          <path
            key={i}
            data-link
            d={`M ${dots[a].x} ${dots[a].y} L ${dots[b].x} ${dots[b].y}`}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.7"
          />
        ))}
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r="4.5" fill={i === 3 ? "var(--color-oxblood)" : "currentColor"} />
        ))}
      </svg>
    </div>
  );
}

/* --------------------------------------------- 04 branch marquee -------- */

/**
 * ENTRY 04: a marquee of branch names (brief section 3.4). The list is a data
 * file, so confirming it with the committee is a one-line change.
 */
export function BranchMarquee({ className = "" }: { className?: string }) {
  const track = useRef<HTMLDivElement>(null);

  useEnterWhenVisible(
    track,
    () => {
      const el = track.current;
      if (!el) return;
      gsap.to(el, { x: () => -el.scrollWidth / 2, duration: 18, ease: "none", repeat: -1 });
    },
    0.1,
  );

  const items = [...BRANCHES, ...BRANCHES];

  return (
    <div className={`marquee ${className}`} aria-label={`Every branch: ${BRANCHES.join(", ")}`}>
      <div ref={track} className="marquee__track">
        {items.map((b, i) => (
          <span key={`${b}-${i}`} className="marquee__item label" aria-hidden={i >= BRANCHES.length}>
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------- 03 finance / tech split line ----- */

/**
 * ENTRY 03: finance and tech words alternate in a split line, then lock
 * together (brief section 3.3).
 */
export function SplitLine({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  const alt = () => Array.from(ref.current?.querySelectorAll<HTMLElement>("[data-alt]") ?? []);

  useEnterWhenVisible(
    ref,
    () => {
      const spans = alt();
      const tl = gsap.timeline();
      spans.forEach((s, i) => {
        tl.to(s, { opacity: i % 2 === 0 ? 0.25 : 1, duration: 0.4, ease: motion.ease.inOut }, i * 0.12);
      });
      tl.to(spans[spans.length - 1], { opacity: 1, duration: 0.3 }, "+=0.1");
    },
    0.1,
    () => gsap.set(alt(), { opacity: 1 }),
  );

  const words = ["FINANCE", "TECH", "FINANCE", "TECH", "LOCKED"];

  return (
    <span ref={ref} className={`split-line label ${className}`}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} data-alt className={i === words.length - 1 ? "split-line__lock" : undefined}>
          {w}
          {i < words.length - 1 ? <span className="split-line__sep"> · </span> : null}
        </span>
      ))}
    </span>
  );
}