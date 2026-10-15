/**
 * works-data.ts
 *
 * Placeholder project content -- swap in real names, copy, tech stacks, and
 * screenshots before shipping. `media` feeds the project page's carousel
 * (components/WorkCarousel.tsx), in order. Each item shows at its own
 * natural height, so mix freely: full-page captures, single-viewport shots,
 * or a tight crop of one feature.
 *
 * Images: drop originals in images/works/<slug>/ (name thumbnails thumb.*)
 * and run `npm run images` -- it resizes, converts to WebP, and writes
 * public/works/<slug>/<name>.webp, which is the path to use here. See
 * scripts/optimize-images.mjs.
 */

export interface WorkMedia {
  src: string;
  alt: string;
  /** Optional line shown under the image -- most useful on feature crops. */
  caption?: string;
}

export interface WorkProject {
  slug: string;
  name: string;
  site: string;
  description: string;
  thumbnail: string;
  techStack: string[];
  media: WorkMedia[];
}

export const WORKS: WorkProject[] = [
  {
    slug: 'thebiggrin',
    name: 'The Big Grin',
    site: 'https://thebiggrin.co.nz/',
    description:
      '',
    thumbnail: '',
    techStack: ['PHP', 'Javascript', 'Jquery', 'Sass', 'TailwindCSS', 'Craft CMS'],
    media: []
  },
  {
    slug: 'westhaven',
    name: 'Westhaven',
    site: 'https://westhavenrolleston.co.nz/',
    description:
      '',
    thumbnail: '',
    techStack: ['PHP', 'Javascript', 'Jquery', 'Vue JS', 'Sass', 'TailwindCSS', 'Craft CMS'],
    media: []
  },
  {
    slug: 'earlsbrook',
    name: 'Earlsbrook',
    site: 'https://earlsbrook.co.nz/',
    description:
      '',
    thumbnail: '',
    techStack: ['PHP', 'Javascript', 'Jquery', 'SVG.js', 'Sass', 'TailwindCSS', 'Craft CMS'],
    media: []
  },
  {
    slug: 'tinshed',
    name: 'The Tin Shed',
    site: 'https://thetinshed.co.nz/',
    description:
      '',
    thumbnail: '',
    techStack: ['Liquid', 'Javascript', 'Jquery', 'Shopify'],
    media: []
  },
  {
    slug: 'glasshousenz',
    name: 'Glasshouse',
    site: 'https://glasshousenz.com/',
    description:
      '',
    thumbnail: '',
    techStack: ['PHP', 'Javascript', 'Jquery', 'Sass', 'TailwindCSS', 'Craft CMS'],
    media: []
  },
  {
    slug: 'laika-shop',
    name: 'Laika Shop',
    site: '',
    description:
      'Built a Shopify theme for Laika, the animation studio behind Coraline. Primarily used Liquid for templating, Sass and Javascript alongside jQuery for the build.',
    thumbnail: '',
    techStack: ['Liquid', 'Sass', 'JavaScript', 'jQuery', 'Shopify'],
    media: [],
  },
  {
    slug: 'cobram-estate-olive-oil',
    name: 'Cobram Estate Olive Oil',
    site: '',
    description:
      'Built and managed a Shopify store for Cobram Estate Olive Oil. Built the theme, managed/configred complex solutions for subscriptions, built internal apps using remix.',
    thumbnail: '',
    techStack: ['Liquid', 'Sass', 'JavaScript', 'jQuery', 'React', 'Remix.js', 'jQuery', 'Shopify'],
    media: [],
  },
  {
    slug: 'bruce-insurance',
    name: 'Bruce Insurance',
    site: '',
    description:
      'Built a wordpress site for Bruce Insurance, an AU insurance company. Tech used were PHP, Sass, Javascript alongside jQuery.',
    thumbnail: '',
    techStack: ['PHP', 'Sass', 'Javascript', 'jQuery'],
    media: [],
  },
  {
    slug: 'dither-kit',
    name: 'Dither Kit',
    site: '',
    description:
      'A component library built around ordered dithering -- buttons, images, and backgrounds all sharing one Bayer-matrix threshold instead of blur or opacity for their transitions.',
    thumbnail: '/works/dither-kit/thumb.svg',
    techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'WebGL', 'Canvas 2D'],
    media: [
      { src: '/works/dither-kit/home.svg', alt: 'Dither Kit -- full homepage' },
      { src: '/works/dither-kit/feature.svg', alt: 'Dither Kit -- feature detail', caption: 'Placeholder feature caption' },
    ],
  },
  {
    slug: 'nathdev26',
    name: 'nathdev26',
    site: '',
    description:
      'This portfolio -- a fluid-scale, terminal-flavoured site with a 3D hero, a scroll-driven timeline, and a command-line palette for getting around.',
    thumbnail: '/works/nathdev26/thumb.svg',
    techStack: ['Next.js', 'React', 'Three.js', 'Tailwind CSS', 'Lenis'],
    media: [
      { src: '/works/nathdev26/home.svg', alt: 'nathdev26 -- full homepage' },
      { src: '/works/nathdev26/feature.svg', alt: 'nathdev26 -- feature detail', caption: 'Placeholder feature caption' },
    ],
  },
  {
    slug: 'pixel-lab',
    name: 'Pixel Lab',
    site: '',
    description:
      'An experiment in ordered-noise image dissolves for a small client gallery site -- hover a thumbnail and it degrades into a halftone preview before the real photo resolves.',
    thumbnail: '/works/pixel-lab/thumb.svg',
    techStack: ['React', 'Vite', 'Sass'],
    media: [
      { src: '/works/pixel-lab/home.svg', alt: 'Pixel Lab -- full homepage' },
      { src: '/works/pixel-lab/feature.svg', alt: 'Pixel Lab -- feature detail', caption: 'Placeholder feature caption' },
    ],
  },
];

export function getWorkBySlug(slug: string): WorkProject | undefined {
  return WORKS.find((w) => w.slug === slug);
}
