import type { GetServerSideProps } from "next";
import { absoluteUrl } from "@/lib/site";

// /styles stays crawlable so its noindex is seen.
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
  res.end(`User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${absoluteUrl("/sitemap.xml")}
`);
  return { props: {} };
};

export default function Robots() {
  return null;
}
