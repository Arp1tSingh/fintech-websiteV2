import { useEffect, useRef, useState } from "react";
import { SectionShell, Panel } from "../components/SectionShell";
import { NodeGraph } from "../components/Motifs";
import { Stamp, EntryLabel } from "../components/Stamp";
import { gsapSet, useEnterWhenVisible } from "../components/Motion";
import { gsap } from "../lib/gsap";
import { motion } from "../lib/motion";
import { EVENTS, eventStatus, type ClubEvent } from "../content/site";

/**
 * Upcoming Events — brief section 3.3, and DESIGN.md section 4.
 *
 * Two large entries, stacked. Each has the date in mono, the title, a one-line
 * hook and a CTA. Build with n8n gets an SVG node graph whose lines draw in
 * sequence; Black Ledger is an inverted block with an oxblood CLASSIFIED / OPEN
 * stamp that lands with a small scale and rotation, its details starting partly
 * redacted and clearing as the block enters view.
 *
 * The countdown reads from the date constant and flips to HAPPENED on its own,
 * so the site does not go stale.
 *
 * Over the 3D, this is the end chamber: the camera arcs slowly around the two
 * lockers, the n8n locker opens first, then the ajar Black Ledger locker is held
 * in frame (DESIGN.md range 0.62-0.78).
 */

/** Re-renders once a minute so the countdown ticks without a scroll listener. */
function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function EventEntry({ ev, now }: { ev: ClubEvent; now: number }) {
  const status = eventStatus(ev, now);
  const card = useRef<HTMLDivElement>(null);

  // Start from the pre-animation state so the entrance is never missed, and so
  // nothing is briefly visible before its section arrives.
  useEnterWhenVisible(
    card,
    () => {
      gsap.fromTo(
        card.current,
        { y: motion.enter.y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: motion.dur.base,
          ease: motion.ease.out,
        },
      );
      // Black Ledger's details start redacted and clear as the block arrives.
      if (ev.motif === "classified") {
        gsap.fromTo(
          card.current?.querySelectorAll("[data-redact]") ?? [],
          { scaleX: 1, transformOrigin: "left center" },
          {
            scaleX: 0,
            duration: motion.dur.base,
            ease: motion.ease.inOut,
            stagger: 0.1,
          },
        );
      }
    },
    0.08,
    () => {
      gsap.set(card.current, { y: motion.enter.y, opacity: 0 });
      gsapSet(card.current?.querySelectorAll("[data-redact]"), { scaleX: 1 });
    },
  );

  // The oxblood CLASSIFIED / OPEN stamp lands with a small scale and rotation.
  const stampHost = useRef<HTMLDivElement>(null);
  const stampRef = useRef<HTMLDivElement>(null);

  useEnterWhenVisible(
    stampHost,
    () => {
      gsap.fromTo(
        stampRef.current,
        { scale: 1.55, opacity: 0 },
        { scale: 1, opacity: 1, duration: motion.dur.fast, ease: motion.ease.out },
      );
    },
    0.14,
    // The outer wrapper owns the landing tween; the inner Stamp keeps the
    // printed rotation, so reset to identity here rather than -7deg.
    () => gsap.set(stampRef.current, { scale: 1.55, opacity: 0 }),
  );

  const happened = status.status === "happened";

  return (
    <div
      ref={card}
      className={`event${ev.inverted ? " event--inverted on-ink" : ""}`}
      id={ev.id}
    >
      <Panel tone={ev.inverted ? "ink" : "parchment"} className="event__card">
        <div className="event__meta">
          <EntryLabel>{ev.dateLabel}</EntryLabel>
          <span className={`event__status label${happened ? " event__status--done" : ""}`}>
            {status.label}
          </span>
        </div>

        <h3 className="event__title">{ev.title}</h3>

        {ev.inverted ? (
          // Details start redacted and clear as the block enters view: the real
          // copy sits underneath, aria-hidden, and the bars wipe off it.
          <p className="event__hook event__hook--redacted">
            <span aria-hidden="true">{ev.hook}</span>
            <span data-redact className="event__redact" aria-hidden="true" />
            <span data-redact className="event__redact event__redact--short" aria-hidden="true" />
          </p>
        ) : (
          <p className="event__hook">{ev.hook}</p>
        )}

        <div className="event__motif">{ev.motif === "nodes" ? <NodeGraph /> : null}</div>

        <a className="event__cta label" href={ev.cta.href}>
          {ev.cta.label}
          <span aria-hidden="true"> →</span>
        </a>
      </Panel>

      {ev.motif === "classified" ? (
        <div className="event__stamp-host" ref={stampHost}>
          <div className="event__stamp" ref={stampRef}>
            <Stamp lines={["CLASSIFIED", "OPEN"]} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Events() {
  const now = useNow();
  return (
    <SectionShell id="events" poster={3} align="lower">
      <div className="section__stack">
        <header className="events__head">
          <p className="label">SECTION 04 — UPCOMING EVENTS</p>
          <h2 className="events__title">Two entries in the register</h2>
        </header>

        <div className="events__list">
          {EVENTS.map((ev) => (
            <EventEntry key={ev.id} ev={ev} now={now} />
          ))}
        </div>
      </div>
    </SectionShell>
  );
}