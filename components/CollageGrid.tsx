'use client';

/**
 * CollageGrid.tsx
 *
 * A photo grid that isn't uniform tiles: each image gets a row/column span
 * based on its declared size (tall/wide/square), with dense packing so the
 * mixed sizes still fill in without odd gaps. DitherImage cover-crops to
 * whatever box that span gives it, so this is about layout rhythm, not
 * preserving each source image's literal aspect ratio.
 */

import DitherImage from '@/components/DitherImage';
import type { WorkImage } from '@/lib/works-data';

const SIZE_CLASSES: Record<WorkImage['size'], string> = {
  tall: 'row-span-2 col-span-1',
  wide: 'row-span-1 col-span-2',
  square: 'row-span-1 col-span-1',
};

export default function CollageGrid({
  images,
  onOpen,
}: {
  images: WorkImage[];
  onOpen: (index: number) => void;
}) {
  return (
    <div className="grid auto-rows-[9rem] grid-cols-2 grid-flow-row-dense gap-3 sm:auto-rows-[10rem] sm:grid-cols-3">
      {images.map((img, i) => (
        <button
          key={img.src}
          type="button"
          onClick={() => onOpen(i)}
          aria-label={`Open ${img.alt}`}
          data-dither-mask
          className={`relative overflow-hidden rounded-sm ${SIZE_CLASSES[img.size]}`}
        >
          <DitherImage src={img.src} alt={img.alt} className="h-full w-full" />
        </button>
      ))}
    </div>
  );
}
