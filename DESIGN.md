# Fintech VIT: 3D Background Design ("The Vault")

One continuous 3D scroll journey behind the whole site: a vault door opens, the camera flies down a corridor of safe-deposit boxes, and each content section happens at a drawer or chamber along the way. Companion to `DESIGN_BRIEF.md` (ledger concept, palette, motion tokens). Where the two conflict, this file wins for anything in the 3D canvas.

## 0. Site copy (final, use verbatim)

Do not rewrite, shorten or "improve" this text. Section order on the page follows the scroll table in section 5.

### FINTECH VIT

### About Us
Fintech VIT is the fintech committee of Vidyalankar Institute of Technology. We bring finance and technology together through hands-on events, expert talks, and competitions that turn textbook ideas into experiences. From a mock IPL auction with a valuation twist to a satirical pitch battle exposing real scam tactics, we make financial literacy practical, engaging, and a little unconventional. Our work is guided by our faculty conveners, Dr. Nayana Mahajan and Prof. Manoj Suryavanshi.

### Goals / Ideology
1. **Learn by doing:** we build events around simulation, competition, and real-world cases.
2. **Awareness and protection:** we teach students how financial scams, frauds, and crimes work so they can spot them early.
3. **Bridge finance and technology:** we cover crypto, blockchain, DeFi, and automation alongside the fundamentals of markets and money.
4. **Open to everyone:** our events welcome students from every branch, with no prior finance background required.
5. **Build the community:** we create a space for students to meet industry speakers, work in teams, and grow together.

### Events Planned
- **Build with n8n:** 7th October
- **Black Ledger:** 12th October

### Execs
- Sanika Chandankar, President: +44 7982 307004
- Jatin Sharma, Vice President: +91 93247 92683
- Ajinkya Repale, General Secretary: +91 87792 60512

### Team Heads
- Arnav Vartak, PR & Operations Head
- Eshna Kumar, Events Head
- Vedant Parab, Events Head
- Shashwat Labhane, Creative Head
- Kunal Sawant, Photography Head
- Arpit Singh, Technical Head
- Shravan Khedekar, Sponsorships Head

### Where the copy goes
| Copy | Section |
|---|---|
| About Us | About (door opening) |
| Goals 1 to 5 | Goals (one featured drawer each, in order) |
| Events Planned | Events (end chamber: n8n locker, then Black Ledger locker) |
| Execs (names and roles only) and Team Heads | Committee |
| Execs (names, roles and phone numbers) | Contact Us (final section) |

Phone numbers appear only in Contact Us, as `tel:` links, in the international format exactly as written above.

## 1. Concept

- The club's work is "opening the books": exposing how money, markets and scams actually work. The vault is the literal version of that.
- Ending on **Black Ledger** as the one drawer that is already open and half-empty is the story beat: something was taken.
- No video, no photo assets needed. Everything is procedural geometry.

## 2. Stack

- Vite + React + TypeScript, Tailwind for DOM panels.
- `three` with `@react-three/fiber` (and `@react-three/drei` only if needed). Fixed full-screen `<Canvas>` at `z-index: -1`.
- Lenis for scroll, GSAP ScrollTrigger for the master timeline.
- One shared scroll value, `progress` (0 to 1), written by ScrollTrigger and read in `useFrame`. No other source of truth.

## 3. Look

**Flat, illustrated, not realistic.** Think printed ledger illustration made three-dimensional.

- Materials: `MeshBasicMaterial` only. No lights, no shadows, no PBR, no bloom, no glow.
- Every solid gets a near-black outline (`EdgesGeometry` + `LineSegments`, or inverted-hull) so it matches the existing outlined team-graphic style.
- Depth cue: linear fog fading to the scene background colour. It is flat colour falloff, not blur.
- Palette (sample real values from the team graphic): parchment `#F1E8D4`, oxblood `#5E0F1A`, near-black `#141011`.

**Colour arc across the scroll**
| Progress | Scene background | Vault surfaces | Outlines |
|---|---|---|---|
| 0.00 - 0.20 | parchment | cream with oxblood accents | near-black |
| 0.20 - 0.70 | lerps to near-black | near-black with cream faces | cream |
| 0.70 - 0.90 | near-black | oxblood on the Black Ledger drawer only | cream |
| 0.90 - 1.00 | lerps back to parchment | cream | near-black |

Going into the dark and coming back out is the "inside the vault" feeling without any lighting.

## 4. The scene

### Vault door (hero)
- Circular door: a thick disc, an outer ring, a centre hub, and 8 radial bolts around the rim.
- A spoked wheel on the face (3 or 4 spokes). The Fintech VIT wordmark engraved above the wheel as flat geometry or a texture.
- Hinge on the left edge. Door pivots about that edge.

### Corridor
- Long rectangular tunnel, walls made of a grid of drawer fronts (instanced boxes, each with a small handle and label slot).
- Floor and ceiling carry faint ruled lines (texture) so the ledger idea persists.
- Roughly 20 to 30 drawers deep per side, one wall panel every few units, to give a sense of length.

### Featured drawers
Five drawers on the corridor sides are "special" (real meshes, not instanced), one per goal:
1. Learn by doing: drawer contains a small stepped bar-chart prop.
2. Awareness and protection: drawer front covered in a black redaction strip that slides away.
3. Bridge finance and technology: a drawer whose label alternates between a currency symbol and a code bracket.
4. Open to everyone: a drawer with no lock, left slightly ajar.
5. Build the community: two drawers linked by a thin line.

### End chamber
- A short round room at the corridor's end with two larger lockers: **Build with n8n** (7 Oct) and **Black Ledger** (12 Oct).
- Black Ledger locker is oxblood, door ajar, interior near-black, a single paper tag hanging from the handle.

## 5. Scroll choreography

Total page length about 700vh. All ranges are of the master `progress`.

| Progress | Site section | What the 3D does |
|---|---|---|
| 0.00 - 0.08 | Hero | Door closed, front-on, camera static with a very slow breathing push-in. Wheel idle. |
| 0.08 - 0.22 | About (pinned) | Wheel spins about 1.5 turns, bolts retract radially, door swings open about 100 degrees. Camera pushes toward the opening. |
| 0.22 - 0.30 | Transition | Camera passes through the doorway. Background lerps toward near-black. |
| 0.30 - 0.62 | Goals | Camera dollies down the corridor and stops at each of the 5 featured drawers in turn. At each stop the drawer slides out and the matching DOM entry panel appears centred in screen. |
| 0.62 - 0.78 | Events | Entry to the end chamber. Camera arcs slowly around the two lockers. n8n locker opens first, then the Black Ledger locker (the ajar one) is held in frame. |
| 0.78 - 0.90 | Committee | Camera stays in the chamber and rises slightly. Execs and Team Heads appear on DOM panels over a wall of nameplate tags. Optional: hanging key tags sway on scroll. |
| 0.90 - 1.00 | Contact Us / footer | Camera pulls back out toward the door and the background returns to parchment. The three execs appear as contact slips (deposit-slip style cards) with tap-to-call numbers. The door swings shut with a stamp: GET IN TOUCH. Footer: Vidyalankar Institute of Technology and the convener names. |

### Alignment rule (important)
DOM panels are centred in the viewport and the camera always stops with the featured drawer centred in the frame. Content and 3D are aligned by construction, so never position DOM text relative to projected 3D coordinates.

### Camera
- A `CatmullRomCurve3` path along the corridor plus a separate look-at curve. Sample both with `progress`, with each section's range remapped to its own local 0 to 1.
- Smoothing comes from Lenis; do not add a second smoothing layer on the camera.

## 6. Interaction

- Scroll is the only required input.
- Optional on desktop: slight mouse parallax (camera offset of a few percent), disabled under reduced motion.
- Hover on a committee nameplate tilts it and reveals the tagline (DOM side, not 3D).

## 7. Performance

- Instance all repeated drawers (`InstancedMesh`). Only the 5 featured drawers and 2 lockers are separate meshes.
- Cap pixel ratio at 1.5. On mobile, halve the drawer count and cap at 1.25.
- Move only transforms each frame; no geometry rebuilds, no texture uploads during scroll.
- Frame budget: stays at 60 fps on a mid-range laptop with integrated graphics. If the average falls below 45 fps for 2 seconds, auto-switch to the low tier (fewer drawers, no fog, no outlines on instanced meshes).

## 8. Accessibility and fallbacks

- `prefers-reduced-motion: reduce`: no scrubbed camera. Show 6 static poster frames (one per section) crossfaded as sections enter, or render the scene once per section at its end state.
- No WebGL, or a very low-end device: same poster frames. Generate them from the scene itself so they match.
- The canvas is decorative: `aria-hidden="true"`. All real content stays in the DOM.
- DOM panels sit on opaque parchment or near-black cards so text contrast never depends on what the 3D is doing behind it.

## 9. Build order

1. Door only, with a dev slider that scrubs `progress` 0 to 0.3. Get wheel, bolts and hinge feeling right before anything else.
2. Corridor with instanced drawers and the camera path, scrubbed by the slider.
3. Colour arc and fog.
4. Wire to Lenis and ScrollTrigger; replace the slider.
5. Five featured drawers, then the end chamber and lockers.
6. Hook up the DOM panels per section, and check alignment at several viewport sizes.
7. Mobile tier, reduced-motion posters, performance auto-tiering.

## 10. Acceptance checks

- Scrolling back up reverses every animation exactly (no state stuck from forward play).
- Jumping via anchor nav (`lenis.scrollTo`) lands with the correct drawer in frame.
- No shadows, blur or glow anywhere.
- Black Ledger is the only oxblood surface inside the dark corridor, so it is the visual focal point of the page.
- Page stays usable with the canvas disabled.

## 11. Open decisions

- Final length of the corridor, which sets the scroll length.
- Whether the wordmark on the door is geometry or a texture.
- Whether the footer re-closing the door is worth the extra scroll length, or the page should end with the door open.
