# Fintech VIT: Design Brief

Stack: Vite + React + TypeScript, Tailwind, GSAP + ScrollTrigger, Lenis. Build ONE section at a time, in the order listed under "Build order".

## 1. Core concept: "The Ledger"

The site is an audit file. Finance, scams and "Black Ledger" all point at the same metaphor, and it needs no video or photography to feel cinematic.

- Ruled ledger lines, entry numbers, stamps, redaction bars, receipts, ticker tape.
- Motion should feel mechanical and deliberate: stamps land, lines draw, numbers tick. No glow, no soft drift.
- Two registers (already adopted): **Committee** = personality (torn paper, taglines, photos). **Record** = numbers (mono type, receipts, count-ups).

## 2. Visual system

**Palette** (sample exact values from the existing team graphic; these are placeholders)
- Parchment cream `#F1E8D4` (page background)
- Oxblood `#5E0F1A` (accent, stamps, key words)
- Near-black `#141011` (text, outlines, inverted sections)
- No other colours. Inverted sections swap cream and near-black, with oxblood staying as the accent.

**Type**
- Display: high-contrast serif or condensed grotesque, very large, tight leading (e.g. Fraunces / Instrument Serif / Anton).
- Body: clean grotesque (Inter / Manrope).
- Numbers, labels, dates, entry numbers: monospace (JetBrains Mono / IBM Plex Mono), uppercase, wide tracking.

**Texture and edges**
- Faint ruled lines as a fixed background layer (1px, ~8% opacity).
- Torn-paper edges between sections (SVG mask or clip-path), not straight cuts.
- Committee photos: torn edge + small even two-tone dot texture, photo fully visible.

**Hard rules**
- No box-shadow, no blur, no glow anywhere.
- Animate only `transform` and `opacity` (plus SVG `stroke-dashoffset`).
- Count-ups must be stepped/mechanical (`ease: "steps(N)"`), never smooth.

## 3. Sections and scroll choreography

### 0. Hero
- Giant "FINTECH VIT", split into characters. Characters rise in a stagger (y: 100% to 0, mask overflow hidden).
- Ruled lines draw in from the left (scaleX 0 to 1), then marginalia fade in beside the title.
- Ticker tape across the bottom, constant slow loop: `BIDBLAZE · 13 TEAMS · ₹29 CR KOHLI SALE · BITCOIN INDIA TOUR · 80 ATTENDEES · SCAM TANK · BUILD WITH N8N 7 OCT · BLACK LEDGER 12 OCT`
- Small scroll cue: "Scroll to open the file".

### 1. About Us (pinned, scrubbed)
- Pin the section. Reveal the paragraph word by word, scrubbed to scroll (opacity 0.15 to 1).
- Emphasise "textbook ideas" with an oxblood strike-through that draws across it, then "experiences" underlines itself. This is the one-line thesis.
- Conveners appear at the end as signature lines: "Audited by Dr. Nayana Mahajan & Prof. Manoj Suryavanshi", with a hand-drawn signature-style underline.

### 2. Goals / Ideology (horizontal pinned track, 5 entries)
- Five ledger entries numbered `ENTRY 01` to `ENTRY 05`, scrolling horizontally while pinned.
- 01 Learn by doing: a small SVG simulation motif (a bar chart that builds itself).
- 02 Awareness and protection: text covered by black redaction bars that wipe away as the card enters. This is the signature interaction for the scam theme.
- 03 Bridge finance and technology: finance and tech words alternate in a split line, then lock together.
- 04 Open to everyone: a marquee of branch names (COMP · IT · EXCS · EXTC · MECH · ...), confirm the branch list with the committee.
- 05 Build the community: a row of dots that connect into a network with SVG line draws.

### 3. Upcoming Events (the conversion section)
- Two large "entries", stacked, each with date in mono, title, a one-line hook, and CTA (link or placeholder).
- **Build with n8n, 7 Oct**: SVG node-graph motif. 3 to 4 nodes connected by lines that draw in sequence on scroll (automation theme).
- **Black Ledger, 12 Oct**: inverted block (near-black background), oxblood "CLASSIFIED / OPEN" stamp that lands with a small scale and rotation. Details start partly redacted and clear as the block enters view.
- Live countdown or "IN X DAYS" label on each, updating from the date constant. Switch to "HAPPENED" automatically after the date, so the site does not go stale.

### 4. The Record (optional, past events, stat register)
- Past events as receipts or ticket stubs (typographic only, no photos needed): Bidblaze 2026, Bitcoin India Tour, Scam Tank.
- Stepped count-ups for 13 teams / 80 attendees / ₹29 crore / 576 vs 569 pts.
- Receipts "print" out of a slot as you scroll (translateY with clip).

### 5. Committee
- Two tiers. Execs larger, Team Heads in a grid.
- Cards: torn-paper photo with dot texture, name in display type, role in mono, tagline in italic.
- Hover or tap swaps the role label to the tagline. Taglines can be revealed by stepped typing on hover.
- Phone numbers do not appear here; they live in the Contact Us section only.

### 6. Contact Us / Footer
- Heading "Contact Us". The three execs as contact slips (deposit-slip style cards) with name, role and tap-to-call number.
- Giant outlined wordmark at the bottom, slowly parallaxing.
- Footer: Vidyalankar Institute of Technology, convener names.

## 4. Motion tokens

```ts
export const motion = {
  ease: { out: "power3.out", inOut: "power2.inOut", step: "steps(12)" },
  dur: { fast: 0.3, base: 0.7, slow: 1.2 },
  stagger: { chars: 0.025, words: 0.04, cards: 0.12 },
  enter: { y: 40, opacity: 0 },
  trigger: { start: "top 80%", toggleActions: "play none none reverse" },
};
```

## 5. Lenis + ScrollTrigger wiring

```ts
const lenis = new Lenis({ lerp: 0.1 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
// Anchor nav: lenis.scrollTo(target, { offset: -80 }) instead of hash jumps
```

## 6. Accessibility and performance

- Wrap every animation in `gsap.matchMedia()`. Under `prefers-reduced-motion: reduce`: no pinning, no scrub, no ticker; show final states instantly.
- Mobile (< 768px): replace horizontal pinned track with a vertical stack; keep stamps and draws, drop parallax.
- Keep text real DOM text (split for animation, but retain an `aria-label` on the full string).
- Contrast: oxblood on parchment passes for large text; check small text.
- Redaction bars must not hide content from screen readers.

## 7. Build order (one section per prompt)

1. Global: tokens, fonts, ruled-line background, Lenis + ScrollTrigger setup, reduced-motion helper.
2. Hero + ticker.
3. About (pinned reveal).
4. Goals (horizontal track).
5. Events (countdown, stamp, node graph).
6. Committee (cards, tap-to-call).
7. Record (receipts, count-ups).
8. Footer, then a responsive and reduced-motion pass.

## 8. Content notes

- The latest content lists two upcoming events: Build with n8n (7 Oct) and Black Ledger (12 Oct). Make the event list data-driven (an array in one file) so adding or archiving events is a one-line change.
- The site shows personal phone numbers for three execs. Confirm they are comfortable with that being public; consider `tel:` links rather than plain text to reduce scraping.
