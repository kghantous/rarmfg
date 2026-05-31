import opentype from 'opentype.js';
import { readFileSync } from 'fs';
const sansFont = opentype.parse(readFileSync('C:\\Windows\\Fonts\\arialbd.ttf').buffer);
const text = 'MANUFACTURING, LLC';
const size = 20;
const scale = size / sansFont.unitsPerEm;
let w = 0;
for (let i = 0; i < text.length; i++) {
  const g = sansFont.charToGlyph(text[i]);
  w += g.advanceWidth * scale;
  if (i < text.length - 1)
    w += sansFont.getKerningValue(g, sansFont.charToGlyph(text[i + 1])) * scale;
}
console.log('Text width:', w.toFixed(1), '  x=56 + width =', (56 + w).toFixed(1));
