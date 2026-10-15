import type { GetServerSideProps } from "next";
import { absoluteUrl } from "@/lib/site";

// /styles is left out (noindex).
const PATHS = ["/"];

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const urls = PATHS.map((p) => `  <url><loc>${absoluteUrl(p)}</loc></url>`).join("\n");
  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
  res.end(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);
  return { props: {} };
};

export default function Sitemap() {
  return null;
}
