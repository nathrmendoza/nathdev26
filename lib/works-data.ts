/**
 * works-data.ts
 *
 * Placeholder project content -- swap in real names, copy, tech stacks, and
 * photography before shipping. Image `size` drives the collage grid's
 * row/column span (see components/CollageGrid.tsx); DitherImage itself
 * cover-crops to whatever box that gives it, so these are about the layout
 * rhythm, not each source file's literal pixel dimensions.
 */

export type ImageSize = 'tall' | 'wide' | 'square';

export interface WorkImage {
  src: string;
  alt: string;
  size: ImageSize;
}

export interface WorkProject {
  slug: string;
  name: string;
  description: string;
  thumbnail: string;
  techStack: string[];
  images: WorkImage[];
}

export const WORKS: WorkProject[] = [
  {
    slug: 'dither-kit',
    name: 'Dither Kit',
    description:
      'A component library built around ordered dithering -- buttons, images, and backgrounds all sharing one Bayer-matrix threshold instead of blur or opacity for their transitions.',
    thumbnail: '/works/dither-kit/thumb.svg',
    techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'WebGL', 'Canvas 2D'],
    images: [
      { src: '/works/dither-kit/1.svg', alt: 'Dither Kit -- mobile screen', size: 'tall' },
      { src: '/works/dither-kit/2.svg', alt: 'Dither Kit -- wide screen', size: 'wide' },
      { src: '/works/dither-kit/3.svg', alt: 'Dither Kit -- detail', size: 'square' },
      { src: '/works/dither-kit/4.svg', alt: 'Dither Kit -- wide screen', size: 'wide' },
      { src: '/works/dither-kit/5.svg', alt: 'Dither Kit -- mobile screen', size: 'tall' },
      { src: '/works/dither-kit/6.svg', alt: 'Dither Kit -- detail', size: 'wide' },
    ],
  },
  {
    slug: 'nathdev26',
    name: 'nathdev26',
    description:
      'This portfolio -- a fluid-scale, terminal-flavoured site with a 3D hero, a scroll-driven timeline, and a combination-lock nav dial for mobile.',
    thumbnail: '/works/nathdev26/thumb.svg',
    techStack: ['Next.js', 'React', 'Three.js', 'Tailwind CSS', 'Lenis'],
    images: [
      { src: '/works/nathdev26/1.svg', alt: 'nathdev26 -- mobile screen', size: 'tall' },
      { src: '/works/nathdev26/2.svg', alt: 'nathdev26 -- wide screen', size: 'wide' },
      { src: '/works/nathdev26/3.svg', alt: 'nathdev26 -- detail', size: 'square' },
      { src: '/works/nathdev26/4.svg', alt: 'nathdev26 -- mobile screen', size: 'tall' },
      { src: '/works/nathdev26/5.svg', alt: 'nathdev26 -- wide screen', size: 'wide' },
    ],
  },
  {
    slug: 'pixel-lab',
    name: 'Pixel Lab',
    description:
      'An experiment in ordered-noise image dissolves for a small client gallery site -- hover a thumbnail and it degrades into a halftone preview before the real photo resolves.',
    thumbnail: '/works/pixel-lab/thumb.svg',
    techStack: ['React', 'Vite', 'Sass'],
    images: [
      { src: '/works/pixel-lab/1.svg', alt: 'Pixel Lab -- wide screen', size: 'wide' },
      { src: '/works/pixel-lab/2.svg', alt: 'Pixel Lab -- mobile screen', size: 'tall' },
      { src: '/works/pixel-lab/3.svg', alt: 'Pixel Lab -- detail', size: 'square' },
      { src: '/works/pixel-lab/4.svg', alt: 'Pixel Lab -- wide screen', size: 'wide' },
      { src: '/works/pixel-lab/5.svg', alt: 'Pixel Lab -- mobile screen', size: 'tall' },
      { src: '/works/pixel-lab/6.svg', alt: 'Pixel Lab -- detail', size: 'wide' },
    ],
  },
];

export function getWorkBySlug(slug: string): WorkProject | undefined {
  return WORKS.find((w) => w.slug === slug);
}
