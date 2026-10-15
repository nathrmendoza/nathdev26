import { useState } from "react";
import dynamic from "next/dynamic";
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
import PageTransition from "@/components/PageTransition";
import CommandPalette, { type Command, type Route } from "@/components/CommandPalette";
import { useDitherControlsUnlocked } from "@/lib/useDitherControlsUnlock";

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

// Pages the command palette's `cd` can reach -- kept in sync with Header's nav.
const ROUTES: Route[] = [
  { name: "home", path: "/" },
  { name: "works", path: "/works" },
  // { name: "gallery", path: "/gallery" }, // hidden until the gallery page exists
  { name: "contact", path: "/contact" },
  { name: "styles", path: "/styles" },
];

// Placeholders -- Work/Contact pages and the GitHub/LinkedIn URLs need swapping in.
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
    run: () => window.open("https://github.com", "_blank", "noopener,noreferrer"),
  },
  {
    id: "linkedin",
    alias: "linkedin",
    description: "open linkedin",
    feedback: "Opening linkedin...",
    run: () => window.open("https://linkedin.com", "_blank", "noopener,noreferrer"),
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
    feedback: "Permission granted. (Would redirect to Contact.)",
    run: () => {},
  },
];

// Lives here, not in a page, so the background config and the command
// palette's state persist across every route instead of remounting.
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
      {/* Desktop only -- the terminal assumes a keyboard. */}
      <CommandPalette commands={COMMANDS} routes={ROUTES} user="nath" className="hidden sm:block" />
      <Header />
      <PageTransition Component={Component} pageProps={pageProps} />
      <Footer />
    </div>
  );
}
