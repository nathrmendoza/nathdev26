'use client';

import StackedFigure, { type StackedFigureItem } from '@/components/StackedFigure';

interface AboutBlock {
  heading: string;
  body: string[];
  figure: StackedFigureItem[];
}

// Figures come from images/ via `npm run images`.
const BLOCKS: AboutBlock[] = [
  {
    heading: 'I Build Websites',
    body: [
      'I’ve been working on websites at agencies for about seven years now, for clients in NZ, Australia and the US.',
      'Marketing and brochure sites, property and real estate listings, and e-commerce — turned from design files into fast, responsive builds on Craft CMS, Shopify and plenty of custom front-end.',
    ],
    figure: [
      { src: '/images/tepae-sample.webp', alt: 'Te Pae website' },
      { src: '/images/thebiggrin-sample.webp', alt: 'The Big Grin website' },
      { src: '/images/glasshouse-sample.webp', alt: 'Glasshouse website' },
      { src: '/images/tinshed-sample.webp', alt: 'The Tin Shed website' },
    ],
  },
  {
    heading: 'More Than Pages',
    body: [
      'Every now and then a project gets more interesting. Like custom JavaScript maps for property developments, where buyers can click through lots, check what’s available and grab the stage plans.',
      'Plus a few internal tools I’ve built behind the scenes to save the team some time.',
    ],
    figure: [
      { src: '/images/ear-map.webp', alt: 'Earlsbrook interactive lot map' },
      { src: '/images/ear-map2.webp', alt: 'Earlsbrook lot details' },
      { src: '/images/wes-map.webp', alt: 'Westhaven interactive lot map' },
      { src: '/images/wes-map2.webp', alt: 'Westhaven lot details' },
    ],
  },
];

export default function About() {
  return (
    <section id="about" className="px-6 py-32 sm:px-12 sm:py-40">
      <div className="mx-auto flex max-w-4xl flex-col gap-32 sm:gap-40">
        {BLOCKS.map((block, i) => {
          const flipped = i % 2 === 1;
          return (
            <div key={block.heading} className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <h2 className="mb-4">{block.heading}</h2>
                {block.body.map((para) => (
                  <p key={para} className="mb-4 max-w-xl text-ink-dim last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
              <StackedFigure
                items={block.figure}
                fan={flipped ? 'left' : 'right'}
                className={flipped ? 'lg:order-first' : ''}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
