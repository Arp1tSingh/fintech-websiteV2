/**
 * The ONLY file that holds copy or data.
 * Adding an event or an exec is a one-line change (DESIGN_BRIEF.md section 8).
 *
 * All prose below the "site copy" banner is verbatim from DESIGN.md section 0
 * and must not be rewritten, shortened or "improved".
 */

/** Year the season's events belong to. Change once, everything re-derives. */
export const EVENT_YEAR = 2026;

export const SITE = {
  wordmark: "FINTECH VIT",
  institute: "Vidyalankar Institute of Technology",
  scrollCue: "Scroll to open the file",
} as const;

/* ------------------------------------------------------------------ copy -- */

export const ABOUT = {
  heading: "About Us",
  body: "Fintech VIT is the fintech committee of Vidyalankar Institute of Technology. We bring finance and technology together through hands-on events, expert talks, and competitions that turn textbook ideas into experiences. From a mock IPL auction with a valuation twist to a satirical pitch battle exposing real scam tactics, we make financial literacy practical, engaging, and a little unconventional.",
  /** Words that get the oxblood strike-through / underline treatment. */
  strike: "textbook ideas",
  underline: "experiences",
  auditLine: "Audited by",
} as const;

/** Goals / Ideology — one featured vault drawer each, in order. */
export interface Goal {
  entry: string;
  title: string;
  body: string;
  /** which drawer prop the 3D scene builds for this goal */
  prop: "barChart" | "redaction" | "financeTech" | "openDrawer" | "network";
}

export const GOALS: Goal[] = [
  {
    entry: "ENTRY 01",
    title: "Learn by doing",
    body: "We build events around simulation, competition, and real-world cases.",
    prop: "barChart",
  },
  {
    entry: "ENTRY 02",
    title: "Awareness and protection",
    body: "We teach students how financial scams, frauds, and crimes work so they can spot them early.",
    prop: "redaction",
  },
  {
    entry: "ENTRY 03",
    title: "Bridge finance and technology",
    body: "We cover crypto, blockchain, DeFi, and automation alongside the fundamentals of markets and money.",
    prop: "financeTech",
  },
  {
    entry: "ENTRY 04",
    title: "Open to everyone",
    body: "Our events welcome students from every branch, with no prior finance background required.",
    prop: "openDrawer",
  },
  {
    entry: "ENTRY 05",
    title: "Build the community",
    body: "We create a space for students to meet industry speakers, work in teams, and grow together.",
    prop: "network",
  },
];

/* ---------------------------------------------------------------- events -- */

export type EventStatus = "upcoming" | "happened";

export interface ClubEvent {
  id: string;
  title: string;
  /** ISO date, local time. Drives the mono date, the countdown and the stamp. */
  date: string;
  /** Short mono form used on the entry, e.g. "07 OCT". */
  dateLabel: string;
  hook: string;
  /** Placeholder until the registration link exists. */
  cta: { label: string; href: string };
  inverted?: boolean;
  motif: "nodes" | "classified";
}

export const EVENTS: ClubEvent[] = [
  {
    id: "build-with-n8n",
    title: "Build with n8n",
    date: `${EVENT_YEAR}-10-07T10:00:00`,
    dateLabel: "07 OCT",
    hook: "Wire real automations together on stage — from a webhook to a live dashboard, in an afternoon.",
    cta: { label: "Details to follow", href: "#events" },
    motif: "nodes",
  },
  {
    id: "black-ledger",
    title: "Black Ledger",
    date: `${EVENT_YEAR}-10-12T18:00:00`,
    dateLabel: "12 OCT",
    hook: "A pitch battle where every deck hides something. Learn to read a scam before it reads you.",
    cta: { label: "Details to follow", href: "#events" },
    inverted: true,
    motif: "classified",
  },
];

/* ------------------------------------------------------------- committee -- */

export interface Exec {
  name: string;
  role: string;
  /** International format exactly as written in DESIGN.md section 0. */
  tel: string;
  telLabel: string;
  tagline: string;
  /** Placeholder portrait in /public/committee — drop a real photo over it. */
  photo: string;
}

export const EXECS: Exec[] = [
  {
    name: "Sanika Chandankar",
    role: "President",
    tel: "+447982307004",
    telLabel: "+44 7982 307004",
    tagline: "Opens the vault.",
    photo: "./committee/sanika.svg",
  },
  {
    name: "Jatin Sharma",
    role: "Vice President",
    tel: "+919324792683",
    telLabel: "+91 93247 92683",
    tagline: "Keeps the books straight.",
    photo: "./committee/jatin.svg",
  },
  {
    name: "Ajinkya Repale",
    role: "General Secretary",
    tel: "+918779260512",
    telLabel: "+91 87792 60512",
    tagline: "Reads between the lines.",
    photo: "./committee/ajinkya.svg",
  },
];

export interface TeamHead {
  name: string;
  role: string;
  tagline: string;
}

export const TEAM_HEADS: TeamHead[] = [
  { name: "Arnav Vartak", role: "PR & Operations Head", tagline: "Makes sure people hear about it." },
  { name: "Eshna Kumar", role: "Events Head", tagline: "Runs the room." },
  { name: "Vedant Parab", role: "Events Head", tagline: "Builds the run of show." },
  { name: "Shashwat Labhane", role: "Creative Head", tagline: "Owns the ink." },
  { name: "Kunal Sawant", role: "Photography Head", tagline: "Holds the record." },
  { name: "Arpit Singh", role: "Technical Head", tagline: "Keeps the pipes flowing." },
  { name: "Shravan Khedekar", role: "Sponsorships Head", tagline: "Finds the capital." },
];

/* ------------------------------------------------------------- chrome ----- */

/**
 * TODO(committee): confirm the branch list. These are the departments we
 * believe run at VIT — swap freely, the marquee is generated from this array.
 */
export const BRANCHES = ["COMP", "IT", "EXCS", "EXTC", "MECH", "CIV", "AIDS", "AIML"];

/** Nameplate wall behind the Committee panel (3D, geometry only): the seven
 * team heads. The execs live in the DOM panel in front, not on the wall. */
export const NAMEPLATE_NAMES = [...TEAM_HEADS.map((t) => t.name)];

/**
 * The Record (DESIGN_BRIEF.md section 3.4) is skipped for now, per the build
 * plan. The shape of it is kept here so re-enabling is a one-line change plus
 * uncommenting <Record /> in App.tsx.
 */
export const RECORD = {
  enabled: false,
  receipts: ["Bidblaze 2026", "Bitcoin India Tour", "Scam Tank"],
  stats: [
    { value: 13, suffix: "", label: "Teams" },
    { value: 80, suffix: "", label: "Attendees" },
    { value: 29, prefix: "₹", suffix: " CR", label: "Kohli sale" },
    { value: 576, suffix: " vs 569 pts", label: "Auction spread" },
  ],
} as const;

/* --------------------------------------------------------------- helpers -- */

export interface EventStatus_ {
  status: EventStatus;
  days: number;
  label: string;
}

/** Countdown helper: "IN 3 DAYS" before, "HAPPENED" after, so the site never goes stale. */
export function eventStatus(ev: ClubEvent, now: number = Date.now()): EventStatus_ {
  const target = new Date(ev.date).getTime();
  if (now >= target) return { status: "happened", days: 0, label: "HAPPENED" };
  const ms = target - now;
  const days = Math.max(0, Math.floor(ms / 86_400_000));
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const label =
    days > 0
      ? `IN ${days} DAY${days === 1 ? "" : "S"}`
      : hours > 0
        ? `IN ${hours} HRS`
        : `IN ${minutes} MIN`;
  return { status: "upcoming", days, label };
}