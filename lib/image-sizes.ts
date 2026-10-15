/**
 * image-sizes.ts
 *
 * Intrinsic width/height of every image `npm run images` produced (see
 * scripts/optimize-images.mjs), keyed by public path. Lets an <img> carry
 * real width/height attributes, so its space is reserved before it loads.
 * Anything not in the manifest (hand-placed files, SVG placeholders) just
 * returns undefined.
 */

import manifest from './data/image-sizes.json';

export interface ImageSize {
  width: number;
  height: number;
}

const SIZES = manifest as Record<string, ImageSize>;

export function imageSize(src: string): ImageSize | undefined {
  return SIZES[src];
}
