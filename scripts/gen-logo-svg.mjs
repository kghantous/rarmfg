import opentype from 'opentype.js';
import { readFileSync, writeFileSync } from 'fs';

const FONT_DIR = 'C:\\Windows\\Fonts\\';
const serifFont  = opentype.parse(readFileSync(FONT_DIR + 'timesbi.ttf').buffer);
const sansFont   = opentype.parse(readFileSync(FONT_DIR + 'arialbd.ttf').buffer);

// ── layout constants ────────────────────────────────────────────────
const H = 68;
const RED   = '#c41a1a';
const BLACK = '#000000';

// R · A · R staircase — font-size 26, diagonal step ~24px per letter
const SERIF_SIZE = 26;
const stairSteps = [
  { char: 'R', x:  2, y: 22 },
  { char: 'A', x: 16, y: 45 },
  { char: 'R', x: 31, y: 66 },
];

// MANUFACTURING, LLC — Arial Bold, size 20, positioned to the right
const SANS_SIZE  = 20;
const LABEL_X    = 56;
const LABEL_Y    = 42;

// ── path builder ────────────────────────────────────────────────────
function glyphPath(font, char, x, y, fontSize) {
  const scale = fontSize / font.unitsPerEm;
  const glyph = font.charToGlyph(char);
  // opentype.js path commands → SVG d string
  const path  = glyph.getPath(x, y, fontSize);
  return path.toSVG(2);          // 2 decimal places
}

function stringPath(font, text, x, y, fontSize) {
  const scale = fontSize / font.unitsPerEm;
  let cursor = x;
  const parts = [];
  for (let i = 0; i < text.length; i++) {
    const char  = text[i];
    const glyph = font.charToGlyph(char);
    parts.push(glyphPath(font, char, cursor, y, fontSize));
    const advance = glyph.advanceWidth * scale;
    const kern = i < text.length - 1
      ? font.getKerningValue(glyph, font.charToGlyph(text[i + 1])) * scale
      : 0;
    cursor += advance + kern;
  }
  return parts.join('\n    ');
}

// ── calculate actual text width for viewBox ─────────────────────────
function textWidth(font, text, fontSize) {
  const scale = fontSize / font.unitsPerEm;
  let w = 0;
  for (let i = 0; i < text.length; i++) {
    const g = font.charToGlyph(text[i]);
    w += g.advanceWidth * scale;
    if (i < text.length - 1)
      w += font.getKerningValue(g, font.charToGlyph(text[i + 1])) * scale;
  }
  return w;
}

const LABEL_TEXT = 'MANUFACTURING, LLC';
const W = Math.ceil(LABEL_X + textWidth(sansFont, LABEL_TEXT, SANS_SIZE)) + 4;

// ── build SVG ───────────────────────────────────────────────────────
const serifPaths = stairSteps.map(({ char, x, y }) =>
  glyphPath(serifFont, char, x, y, SERIF_SIZE)
).join('\n    ');

const sansPaths = stringPath(sansFont, LABEL_TEXT, LABEL_X, LABEL_Y, SANS_SIZE);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="RAR Manufacturing, LLC">
  <title>RAR Manufacturing, LLC</title>
  <g fill="${RED}">
    ${serifPaths}
  </g>
  <g fill="${BLACK}">
    ${sansPaths}
  </g>
  <line x1="0" y1="${H - 1}" x2="${W}" y2="${H - 1}" stroke="${BLACK}" stroke-width="1.5"/>
</svg>`;

writeFileSync('images/logo.svg', svg);
console.log('Written images/logo.svg');
