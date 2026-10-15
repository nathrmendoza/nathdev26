import type { GetStaticProps } from "next";
import ContactSection from "@/components/ContactSection";

// Hidden for launch -- this content lives on `/`. Remove to restore.
export const getStaticProps: GetStaticProps = () => ({ notFound: true });

export default function ContactPage() {
  return <ContactSection />;
}
