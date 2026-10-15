import Hero from "@/components/Hero";
import Experience from "@/components/Experience";
import About from "@/components/About";
import Skills from "@/components/Skills";
import ContactSection from "@/components/ContactSection";
import Marquee from '@/components/Marquee';
import Head from "next/head";
import Seo from "@/components/Seo";
import { SITE, SITE_URL, absoluteUrl } from "@/lib/site";

const PERSON_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE.name,
  jobTitle: SITE.jobTitle,
  url: SITE_URL,
  image: absoluteUrl(SITE.ogImage),
  address: { "@type": "PostalAddress", addressLocality: SITE.locality, addressCountry: SITE.country },
  sameAs: ["https://github.com/nathrmendoza", "https://www.linkedin.com/in/nathaniel-mendoza-425203163/"],
};

const MARQUEE_PHRASES = ['INTERESTED?', 'UNCOMPLICATED', "MADE TO LAST", "LET'S TALK"];

export default function Home() {
  return (
    <>
      <Seo path="/" />
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSON_LD) }}
        />
      </Head>
      <Hero />
      <Experience />
      <About />
      <Skills />
      <Marquee phrases={MARQUEE_PHRASES} className="w-full py-16 sm:py-24" />
      <ContactSection />
    </>
  );
}
