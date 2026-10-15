const vercelProduction = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (vercelProduction ? `https://${vercelProduction}` : 'http://localhost:3000')
).replace(/\/$/, '');

export const SITE = {
  name: 'Nathan Mendoza',
  title: 'Nathan Mendoza | Web Developer, Christchurch NZ',
  description:
    'Nathan Mendoza is a web developer in Christchurch, New Zealand, building fast, well-crafted websites for clients across NZ, Australia and the US.',
  jobTitle: 'Web Developer',
  locality: 'Christchurch',
  country: 'NZ',
  locale: 'en_NZ',
  ogImage: '/og-image.png',
  ogImageAlt: 'NDEV — Nathan Mendoza, web developer, Christchurch, New Zealand',
};

export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
