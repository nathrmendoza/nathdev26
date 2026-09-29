/**
 * hero-glyphs.ts
 *
 * Turns the baked glyph outlines in data/hero-glyphs.json into extrudable
 * THREE.Shape objects. The JSON was generated once, offline, by decoding
 * the real Archivo variable font woff2 (cached locally by next/font) with
 * opentype.js -- not shipped at runtime, so there's no font-parsing cost
 * or extra bundle weight here, just the outline coordinates themselves.
 *
 * Font coordinates are Y-down from the baseline (SVG/canvas convention);
 * Three.js is Y-up, so every Y gets negated on the way in.
 */

import { Path, Shape } from 'three';
import glyphData from './data/hero-glyphs.json';

type Command = readonly [string, ...number[]];

interface GlyphEntry {
  advanceWidth: number;
  commands: Command[];
}

const data = glyphData as unknown as { unitsPerEm: number; glyphs: Record<string, GlyphEntry> };
const GLYPHS = data.glyphs;

export const HERO_UNITS_PER_EM = data.unitsPerEm;

/** A glyph can be several subpaths (holes for letters like A/D/O) -- the
 *  first is the outer contour, every subpath after it is a hole. Three.js's
 *  earcut triangulation only needs the winding to be *consistent*, not a
 *  specific direction, so this split is all that's required. */
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

/** Lays out a line of (already-known, no kerning) glyphs left to right.
 *  Unsupported characters are skipped -- keep hero copy to the baked set.
 *  Space is keyed as 'space' in the data (a literal ' ' key doesn't survive
 *  JSON round-tripping cleanly) and has no outline, so it only ever
 *  advances the cursor -- never becomes a mesh. */
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
