import Hero from "@/components/Hero";
import DitherLinkButton from "@/components/DitherLinkButton";
import Seo from "@/components/Seo";

export default function NotFoundPage() {
  return (
    <>
      <Seo title="Page Not Found | Nathan Mendoza" path="/404" noindex />
      <Hero
        text="404 / ERR"
        heading="404 — Page not found"
        tagline="This page doesn’t exist, or it’s moved. Let’s get you back on track."
        action={
          <DitherLinkButton href="/" className="px-7 py-4 text-[16px] tracking-[0.14em] uppercase">
            Back to Home
          </DitherLinkButton>
        }
      />
    </>
  );
}
