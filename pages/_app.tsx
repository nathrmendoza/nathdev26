import { useState } from "react";
import dynamic from "next/dynamic";
import Router from "next/router";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Archivo, JetBrains_Mono } from "next/font/google";
import DitherBackground, {
  DEFAULT_CONFIG,
  type DitherBackgroundConfig,
} from "@/components/DitherBackground";
import SplashCurtain from "@/components/SplashCurtain";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import PageTransition from "@/components/PageTransition";
import CommandPalette, { type Command, type Route } from "@/components/CommandPalette";
import { useDitherControlsUnlocked } from "@/lib/useDitherControlsUnlock";
import { scrollToId } from "@/lib/scroll-to";

const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// Dynamic import: visitors who never unlock the panel never download its code either.
const DitherControls = dynamic(() => import("@/components/DitherControls"), {
  ssr: false,
});

// Pages the command palette's `cd` can reach. Empty hides `cd` entirely --
// hidden for launch (one-pager); restore these when the pages are back.
const ROUTES: Route[] = [
  // { name: "home", path: "/" },
  // { name: "works", path: "/works" },
  // { name: "gallery", path: "/gallery" },
  // { name: "contact", path: "/contact" },
  // { name: "styles", path: "/styles" },
];

const COMMANDS: Command[] = [
  {
    id: "cp-email",
    alias: "cp email",
    description: "copy email to clipboard",
    feedback: "Copied nathmendoza.dev@gmail.com to clipboard.",
    run: () => navigator.clipboard.writeText("nathmendoza.dev@gmail.com"),
  },
  {
    id: "cp-phone",
    alias: "cp phone",
    description: "copy phone to clipboard",
    feedback: "Copied 0221064237 to clipboard.",
    run: () => navigator.clipboard.writeText("0221064237"),
  },
  {
    id: "github",
    alias: "gh",
    description: "open github",
    feedback: "Opening github...",
    run: () => window.open("https://github.com/nathrmendoza", "_blank", "noopener,noreferrer"),
  },
  {
    id: "linkedin",
    alias: "linkedin",
    description: "open linkedin",
    feedback: "Opening linkedin...",
    run: () => window.open("https://www.linkedin.com/in/nathaniel-mendoza-425203163/", "_blank", "noopener,noreferrer"),
  },
  {
    id: "whoami",
    alias: "whoami",
    description: "who is this",
    feedback: "Nath — web developer, Christchurch NZ.",
    run: () => {},
  },
  {
    id: "sudo",
    alias: "sudo hire-me",
    description: "...worth a shot",
    feedback: "Permission granted. Scrolling to contact...",
    run: () => {
      // Off the homepage, PageTransition lands on the section.
      if (!scrollToId("contact")) Router.push("/#contact", undefined, { scroll: false });
    },
  },
];

// Here, not in a page, so background and palette state survive route changes.
export default function App({ Component, pageProps }: AppProps) {
  const [config, setConfig] = useState<DitherBackgroundConfig>(DEFAULT_CONFIG);
  const [pulseSignal, setPulseSignal] = useState(0);
  const controlsUnlocked = useDitherControlsUnlocked();

  return (
    <div className={`${archivo.variable} ${jetbrainsMono.variable} font-sans`}>
      <DitherBackground config={config} pulseSignal={pulseSignal} />
      <SplashCurtain ground={config.ground} />
      {controlsUnlocked && (
        <DitherControls
          value={config}
          onChange={setConfig}
          onFirePulse={() => setPulseSignal((n) => n + 1)}
        />
      )}
      {/* Keyboard-only; lg+ because its hint sits in the footer's left column. */}
      <CommandPalette commands={COMMANDS} routes={ROUTES} user="nath" className="hidden lg:block" />
      <Header />
      <PageTransition Component={Component} pageProps={pageProps} />
      <Footer />
      <BackToTop />
    </div>
  );
}
