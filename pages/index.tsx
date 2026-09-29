import Hero from "@/components/Hero";
import Experience from "@/components/Experience";
import Skills from "@/components/Skills";
import CallToAction from "@/components/CallToAction";
import Marquee from '@/components/Marquee';

const MARQUEE_PHRASES = ['INTERESTED?', 'UNCOMPLICATED', "MADE TO LAST", "LET'S TALK"];

export default function Home() {
  return (
    <>
      <Hero />
      <Experience />
      <Skills />
      <Marquee phrases={MARQUEE_PHRASES} className="w-full py-16 sm:py-24" />
      <CallToAction />
    </>
  );
}
