import { CanvasTexture, LinearFilter, RepeatWrapping, SRGBColorSpace } from "three";

/**
 * Every texture in the vault is generated procedurally, once, at mount.
 * DESIGN.md section 7: "no geometry rebuilds, no texture uploads during
 * scroll" — so nothing here is ever called from useFrame.
 *
 * Text is drawn white on transparent and tinted per-frame through
 * material.color, which is what lets the wordmark flip from near-black ink on
 * parchment to cream inside the dark corridor without a second texture.
 */

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  return [c, ctx];
}

function finish(c: HTMLCanvasElement, opts: { srgb?: boolean } = {}): CanvasTexture {
  const tex = new CanvasTexture(c);
  if (opts.srgb !== false) tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 1;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

/** The engraved wordmark on the vault door. */
export function makeWordmarkTexture(text: string): CanvasTexture {
  const [c, ctx] = canvas(1024, 256);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const letters = [...text];
  const track = 18;
  const maxWidth = 1024 * 0.9;

  // Fit to the canvas: the wordmark has to survive being engraved across a
  // 6.4-unit door without being cropped at either end.
  let size = 150;
  let widths: number[] = [];
  let total = 0;
  for (let pass = 0; pass < 8; pass++) {
    ctx.font = `700 ${size}px "Fraunces Variable", Fraunces, Georgia, serif`;
    widths = letters.map((ch) => ctx.measureText(ch).width);
    total = widths.reduce((a, b) => a + b, 0) + track * (letters.length - 1);
    if (total <= maxWidth) break;
    size = Math.floor(size * (maxWidth / total));
  }

  let x = 512 - total / 2;
  letters.forEach((ch, i) => {
    ctx.fillText(ch, x + widths[i] / 2, 128);
    x += widths[i] + track;
  });

  // Engraved rules above and below the wordmark.
  const halfW = Math.min(total, maxWidth) / 2;
  ctx.fillRect(512 - halfW - 24, 40, halfW * 2 + 48, 6);
  ctx.fillRect(512 - halfW - 24, 210, halfW * 2 + 48, 6);

  return finish(c);
}

/** A locker label plate: mono, uppercase, wide tracking. */
export function makeLabelTexture(text: string, sub?: string): CanvasTexture {
  const [c, ctx] = canvas(512, 160);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = '600 62px "JetBrains Mono Variable", monospace';
  const spaced = [...text].join(" ");
  ctx.fillText(spaced, 256, sub ? 62 : 80);

  if (sub) {
    ctx.font = '500 40px "JetBrains Mono Variable", monospace';
    ctx.fillText([...sub].join(" "), 256, 124);
  }

  // Label-slot rules top and bottom.
  ctx.globalAlpha = 0.5;
  ctx.fillRect(24, 22, 464, 3);
  ctx.fillRect(24, 136, 464, 3);
  ctx.globalAlpha = 1;

  return finish(c);
}

/** A committee nameplate tag: name over role. */
export function makeNameplateTexture(name: string, role: string): CanvasTexture {
  const [c, ctx] = canvas(512, 192);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Fit to the plate: long names and roles ("PR & OPERATIONS HEAD") shrink
  // instead of running off the tag's edge.
  const fit = (text: string, weight: number, family: string, start: number, maxWidth: number) => {
    let size = start;
    for (let pass = 0; pass < 8; pass++) {
      ctx.font = `${weight} ${size}px ${family}`;
      if (ctx.measureText(text).width <= maxWidth) break;
      size = Math.max(10, Math.floor((size * maxWidth) / ctx.measureText(text).width));
    }
    return size;
  };

  const nameSize = fit(name, 600, '"Fraunces Variable", Georgia, serif', 52, 512 * 0.9);
  ctx.font = `600 ${nameSize}px "Fraunces Variable", Georgia, serif`;
  ctx.fillText(name, 256, 74);

  const spacedRole = [...role].join(" ");
  ctx.globalAlpha = 0.72;
  const roleSize = fit(spacedRole, 500, '"JetBrains Mono Variable", monospace', 30, 512 * 0.9);
  ctx.font = `500 ${roleSize}px "JetBrains Mono Variable", monospace`;
  ctx.fillText(spacedRole, 256, 132);
  ctx.globalAlpha = 1;

  ctx.globalAlpha = 0.4;
  ctx.fillRect(96, 104, 320, 2);
  ctx.globalAlpha = 1;

  return finish(c);
}

/**
 * Floor and ceiling ruled lines, tileable along the corridor.
 * The ledger idea persists underfoot even though there are no lights.
 */
export function makeRuledTexture(): CanvasTexture {
  const [c, ctx] = canvas(256, 256);
  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2;

  // Ledger rows every 32px.
  for (let y = 0; y <= 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(256, y + 0.5);
    ctx.stroke();
  }
  // Ruled margin, the way a real ledger page has one.
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40.5, 0);
  ctx.lineTo(40.5, 256);
  ctx.stroke();

  const tex = finish(c, { srgb: false });
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(2, 26);
  return tex;
}

/** The redaction bar that slides off the "Awareness and protection" drawer. */
export function makeRedactionTexture(): CanvasTexture {
  const [c, ctx] = canvas(512, 256);
  ctx.clearRect(0, 0, 512, 256);
  ctx.fillStyle = "#ffffff";
  ctx.font = '700 54px "JetBrains Mono Variable", monospace';
  ctx.textBaseline = "middle";
  ctx.fillText("S C A M  S C A M", 26, 84);
  ctx.fillText("F R A U D", 26, 148);
  ctx.fillText("C R I M E", 26, 212);
  return finish(c);
}

