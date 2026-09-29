import ContactForm from "@/components/ContactForm";
import ScrambleLink from "@/components/ScrambleLink";
import { LinkedinIcon } from "@/components/icons";

const EMAIL = "nathmendoza.dev@gmail.com";
const PHONE_DISPLAY = "022 106 4237";
const PHONE_HREF = "0221064237";
const LINKEDIN_URL = "https://linkedin.com";

export default function ContactPage() {
  return (
    <section className="flex min-h-[calc(100vh-var(--header-h,96px))] items-center px-6 py-16 sm:px-12">
      <div className="mx-auto grid w-full max-w-6xl gap-16 lg:grid-cols-2 lg:gap-24">
        <div className="flex flex-col justify-center">
          <h1 className="mb-4">Get in Touch</h1>
          <p className="mb-8 max-w-md text-ink-dim">
            Got a project in mind, or just want to say hi? Fill in the details below and I&rsquo;ll get back to you.
          </p>
          <ContactForm />
        </div>

        <div className="flex flex-col justify-center gap-10 lg:pl-8">
          <div>
            <p className="text-h4 font-bold text-ink">Nathan Mendoza</p>
            <p className="text-ink-dim">Christchurch, New Zealand</p>
          </div>

          <div className="flex flex-col gap-3 font-mono">
            <div className="flex items-baseline gap-3">
              <span className="text-ink-faint">E.</span>
              <ScrambleLink text={EMAIL} href={`mailto:${EMAIL}`} className="text-ink" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-ink-faint">P.</span>
              <ScrambleLink text={PHONE_DISPLAY} href={`tel:${PHONE_HREF}`} className="text-ink" />
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-line pt-6">
            <span className="font-mono text-body tracking-[0.15em] text-ink-dim">Or connect through</span>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              data-dither-mask
              className="h-7 w-7 text-ink transition-all hover:-translate-y-0.5 hover:text-accent"
            >
              <LinkedinIcon />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
