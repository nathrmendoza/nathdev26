import type { GetStaticProps } from "next";
import ContactSection from "@/components/ContactSection";

// Hidden for launch (one-pager) -- this content lives at the bottom of `/`
// instead, and this page 404s. Delete this to bring it back, along with its
// links in Header NAV_ITEMS and _app ROUTES.
export const getStaticProps: GetStaticProps = () => ({ notFound: true });

export default function ContactPage() {
  return <ContactSection />;
}
