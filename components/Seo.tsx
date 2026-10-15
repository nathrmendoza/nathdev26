import Head from 'next/head';
import { SITE, absoluteUrl } from '@/lib/site';

interface SeoProps {
  /** Full <title>. Defaults to the site title. */
  title?: string;
  description?: string;
  /** Path for the canonical/og:url, e.g. '/'. */
  path?: string;
  /** Keep this page out of search results (dev pages, style guide). */
  noindex?: boolean;
}

export default function Seo({ title = SITE.title, description = SITE.description, path = '/', noindex = false }: SeoProps) {
  const url = absoluteUrl(path);
  const image = absoluteUrl(SITE.ogImage);

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:locale" content={SITE.locale} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={SITE.ogImageAlt} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Head>
  );
}
