import { Path, Shape } from 'three';
// Outlines baked offline from Archivo with opentype.js -- hero copy is limited
// to the characters in this file.
import glyphData from './data/hero-glyphs.json';

type Command = readonly [string, ...number[]];

interface GlyphEntry {
  advanceWidth: number;
  commands: Command[];
}

const data = glyphData as unknown as { unitsPerEm: number; glyphs: Record<string, GlyphEntry> };
const GLYPHS = data.glyphs;

export const HERO_UNITS_PER_EM = data.unitsPerEm;

/** First subpath is the outer contour, the rest are holes. earcut only needs
 *  consistent winding, so this split is enough. */
function buildShape(commands: Command[]): Shape {
  const shape = new Shape();
  let target: Shape | Path = shape;
  let subpathIndex = -1;

  for (const command of commands) {
    const [type, ...args] = command;
    if (type === 'M') {
      subpathIndex += 1;
      if (subpathIndex === 0) {
        target = shape;
      } else {
        const hole = new Path();
        shape.holes.push(hole);
        target = hole;
      }
      target.moveTo(args[0], -args[1]);
    } else if (type === 'L') {
      target.lineTo(args[0], -args[1]);
    } else if (type === 'Q') {
      target.quadraticCurveTo(args[0], -args[1], args[2], -args[3]);
    } else if (type === 'C') {
      target.bezierCurveTo(args[0], -args[1], args[2], -args[3], args[4], -args[5]);
    } else if (type === 'Z') {
      target.closePath();
    }
  }
  return shape;
}

export interface LaidOutGlyph {
  shape: Shape;
  /** Left edge, in font units, from the line's own origin. */
  x: number;
}

export interface LaidOutLine {
  glyphs: LaidOutGlyph[];
  /** Total advance width, in font units. */
  width: number;
}

/** Lays out baked glyphs left to right (no kerning); unknown characters are
 *  skipped. Space is keyed 'space' and only advances. */
export function layoutLine(text: string): LaidOutLine {
  let cursor = 0;
  const glyphs: LaidOutGlyph[] = [];
  for (const ch of text) {
    const entry = GLYPHS[ch === ' ' ? 'space' : ch];
    if (!entry) continue;
    if (entry.commands.length > 0) {
      glyphs.push({ shape: buildShape(entry.commands), x: cursor });
    }
    cursor += entry.advanceWidth;
  }
  return { glyphs, width: cursor };
}
