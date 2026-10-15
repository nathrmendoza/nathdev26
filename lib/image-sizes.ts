import manifest from './data/image-sizes.json';

export interface ImageSize {
  width: number;
  height: number;
}

const SIZES = manifest as Record<string, ImageSize>;

export function imageSize(src: string): ImageSize | undefined {
  return SIZES[src];
}
