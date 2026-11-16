// Crisp 2D pixel-art drawing helpers for 320x180 virtual canvas resolution

export const PIXEL_W = 320;
export const PIXEL_H = 180;

export function pxRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function pxDot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

export function pxCircleOutline(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string
): void {
  const rx = Math.round(cx);
  const ry = Math.round(cy);
  const rad = Math.max(1, Math.round(r));
  ctx.fillStyle = color;
  let x = rad;
  let y = 0;
  let err = 1 - x;
  while (x >= y) {
    ctx.fillRect(rx + x, ry + y, 1, 1);
    ctx.fillRect(rx + y, ry + x, 1, 1);
    ctx.fillRect(rx - y, ry + x, 1, 1);
    ctx.fillRect(rx - x, ry + y, 1, 1);
    ctx.fillRect(rx - x, ry - y, 1, 1);
    ctx.fillRect(rx - y, ry - x, 1, 1);
    ctx.fillRect(rx + y, ry - x, 1, 1);
    ctx.fillRect(rx + x, ry - y, 1, 1);
    y++;
    if (err < 0) {
      err += 2 * y + 1;
    } else {
      x--;
      err += 2 * (y - x + 1);
    }
  }
}

export function pxCircleFill(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string
): void {
  const rx = Math.round(cx);
  const ry = Math.round(cy);
  const rad = Math.max(1, Math.round(r));
  ctx.fillStyle = color;
  for (let dy = -rad; dy <= rad; dy++) {
    const span = Math.floor(Math.sqrt(rad * rad - dy * dy));
    ctx.fillRect(rx - span, ry + dy, span * 2 + 1, 1);
  }
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  palette: Record<string, string>,
  x: number,
  y: number,
  scale = 1
): void {
  const ox = Math.round(x);
  const oy = Math.round(y);
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + c * scale, oy + r * scale, scale, scale);
    }
  }
}

const PIXEL_FONT_3X5: Record<string, string[]> = {
  '1': ['.1.', '11.', '.1.', '.1.', '111'],
  '2': ['111', '..1', '111', '1..', '111'],
  '3': ['111', '..1', '.11', '..1', '111'],
  '4': ['1.1', '1.1', '111', '..1', '..1'],
  'A': ['.1.', '1.1', '111', '1.1', '1.1'],
  'D': ['11.', '1.1', '1.1', '1.1', '11.'],
  'E': ['111', '1..', '11.', '1..', '111'],
  'F': ['111', '1..', '11.', '1..', '1..'],
  'G': ['111', '1..', '1.1', '1.1', '111'],
  'I': ['111', '.1.', '.1.', '.1.', '111'],
  'M': ['1.1', '111', '1.1', '1.1', '1.1'],
  'O': ['111', '1.1', '1.1', '1.1', '111'],
  'R': ['11.', '1.1', '11.', '1.1', '1.1'],
  'S': ['111', '1..', '111', '..1', '111'],
  'U': ['1.1', '1.1', '1.1', '1.1', '111'],
  'V': ['1.1', '1.1', '1.1', '1.1', '.1.'],
  '/': ['..1', '..1', '.1.', '1..', '1..'],
  '.': ['...', '...', '...', '...', '.1.'],
  ' ': ['...', '...', '...', '...', '...'],
};

export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  topY: number,
  color: string,
  scale = 1
): void {
  const upper = text.toUpperCase();
  const charW = 3 * scale;
  const gap = 1 * scale;
  const totalW = upper.length * charW + Math.max(0, upper.length - 1) * gap;
  let cursorX = Math.round(centerX - totalW / 2);
  const oy = Math.round(topY);
  ctx.fillStyle = color;

  for (let i = 0; i < upper.length; i++) {
    const glyph = PIXEL_FONT_3X5[upper[i]] ?? PIXEL_FONT_3X5[' '];
    for (let r = 0; r < glyph.length; r++) {
      const row = glyph[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === '1') {
          ctx.fillRect(cursorX + c * scale, oy + r * scale, scale, scale);
        }
      }
    }
    cursorX += charW + gap;
  }
}

// Hand-crafted pixel art sprites
export const SPRITE_LOTUS_FLOWER = [
  '....p....',
  '...ppp...',
  '.p.pwp.p.',
  'pp.www.pp',
  'ppwwywwpp',
  '.ppwwwpp.',
  '..ggggg..',
];

export const SPRITE_KOI = [
  '..ooo....',
  '.oowoo.o.',
  'oowooooop',
  '.oowoo.o.',
  '..ooo....',
];

export const SPRITE_LANTERN_SPIRIT = [
  '...aaa...',
  '..abbba..',
  '.abcccba.',
  '.abcbcba.',
  '..abbba..',
  '...ddd...',
  '..ddddd..',
  '..dd.dd..',
];

export const SPRITE_PAPER_LANTERN = [
  '...ttt...',
  '..lllll..',
  '.llwwwll.',
  '.llwswll.',
  '.llwwwll.',
  '..lllll..',
  '...ttt...',
  '....t....',
];

export const SPRITE_PINE_TREE = [
  '....a....',
  '...aaa...',
  '..aabaa..',
  '...aaa...',
  '..aabaa..',
  '.aaabaaa.',
  '..aabaa..',
  '.aaabaaa.',
  'aaaabaaaa',
  '....t....',
  '....t....',
];

export const SPRITE_CRYSTAL = [
  '...ccc...',
  '..clllc..',
  '.clwwwlc.',
  '.clwwwlc.',
  '..clllc..',
  '...ccc...',
];
