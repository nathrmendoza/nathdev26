'use client';

/**
 * Lightbox.tsx
 *
 * Fullscreen image viewer for CollageGrid: arrow buttons + keyboard
 * left/right to navigate, Escape or a click outside the image to close.
 * "Zoom" is a click-to-toggle 2x scale centred on the image, not a full
 * pinch-and-pan viewer -- a portfolio gallery doesn't need more than that,
 * and it's a much smaller surface to get right.
 */

import { useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@/components/icons';
import type { WorkImage } from '@/lib/works-data';

export interface LightboxProps {
  images: WorkImage[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({ images, index, onClose, onNavigate }: LightboxProps) {
  const [zoomed, setZoomed] = useState(false);
  // Resets zoom on navigation without an effect -- adjusting state during
  // render (not after) when a prop changes, per React's own recommended
  // pattern for this.
  const [prevIndex, setPrevIndex] = useState(index);
  if (index !== prevIndex) {
    setPrevIndex(index);
    setZoomed(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onNavigate((index - 1 + images.length) % images.length);
      else if (e.key === 'ArrowRight') onNavigate((index + 1) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, images.length, onClose, onNavigate]);

  const image = images[index];
  const goPrev = () => onNavigate((index - 1 + images.length) % images.length);
  const goNext = () => onNavigate((index + 1) % images.length);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${image.alt}, image ${index + 1} of ${images.length}`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ground/95 backdrop-blur-sm"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        data-dither-mask
        className="absolute top-6 right-6 h-6 w-6 text-ink transition-colors hover:text-accent"
      >
        <CloseIcon />
      </button>

      {images.length > 1 && (
        <button
          type="button"
          aria-label="Previous image"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          data-dither-mask
          className="absolute top-1/2 left-4 h-8 w-8 -translate-y-1/2 text-ink transition-colors hover:text-accent sm:left-8"
        >
          <ChevronLeftIcon />
        </button>
      )}

      <div className="max-h-[80vh] max-w-[85vw] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element -- lightbox source is a plain public asset, not next/image */}
        <img
          src={image.src}
          alt={image.alt}
          onClick={() => setZoomed((z) => !z)}
          className={`max-h-[80vh] max-w-[85vw] object-contain transition-transform duration-300 ${
            zoomed ? 'scale-[2] cursor-zoom-out' : 'scale-100 cursor-zoom-in'
          }`}
        />
      </div>

      {images.length > 1 && (
        <button
          type="button"
          aria-label="Next image"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          data-dither-mask
          className="absolute top-1/2 right-4 h-8 w-8 -translate-y-1/2 text-ink transition-colors hover:text-accent sm:right-8"
        >
          <ChevronRightIcon />
        </button>
      )}

      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[11px] text-ink-dim">
        {index + 1} / {images.length}
      </span>
    </div>
  );
}
