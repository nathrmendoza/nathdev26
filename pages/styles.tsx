import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import DitherButton from "@/components/DitherButton";
import ScrambleLink from "@/components/ScrambleLink";
import ContactForm from "@/components/ContactForm";
import Marquee from "@/components/Marquee";
import ScrambleReveal from "@/components/ScrambleReveal";
import DigitCounter from "@/components/DigitCounter";
import DitherImage from "@/components/DitherImage";
import Seo from "@/components/Seo";

interface Skill {
  name: string;
  level: number;
}

const SKILL_MAX = 5;

const SKILL_GROUPS: { label: string; skills: Skill[] }[] = [
  {
    label: "Markup & Styling",
    skills: [
      { name: "HTML", level: 5 },
      { name: "CSS", level: 5 },
      { name: "Sass", level: 5 },
      { name: "Tailwind CSS", level: 5 },
      { name: "Styled Components", level: 4 },
      { name: "Bootstrap", level: 3 },
      { name: "Liquid", level: 3 },
      { name: "PHP", level: 3 },
      { name: "Laravel", level: 3 },
    ],
  },
  {
    label: "JavaScript & Frameworks",
    skills: [
      { name: "JavaScript", level: 5 },
      { name: "React", level: 5 },
      { name: "Next.js", level: 5 },
      { name: "TypeScript", level: 4 },
      { name: "Vite", level: 4 },
      { name: "Redux", level: 3 },
      { name: "jQuery", level: 3 },
      { name: "Webpack", level: 3 },
      { name: "Remix.js", level: 2 },
      { name: "Gulp.js", level: 2 },
    ],
  },
  {
    label: "Platforms & Tools",
    skills: [
      { name: "Git", level: 5 },
      { name: "GitHub", level: 5 },
      { name: "Figma", level: 4 },
      { name: "WordPress", level: 4 },
      { name: "Shopify", level: 3 },
      { name: "Bitbucket", level: 3 },
      { name: "Sanity", level: 3 },
      { name: "Adobe Photoshop", level: 3 },
      { name: "Adobe XD", level: 3 },
      { name: "Craft CMS", level: 2 },
      { name: "Silverstripe", level: 2 },
      { name: "Joomla", level: 2 },
    ],
  },
];

const ALL_SKILLS = SKILL_GROUPS.flatMap((group) => group.skills);

function SkillMeter({
  level,
  max = SKILL_MAX,
  highlight = false,
}: {
  level: number;
  max?: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5" role="img" aria-label={`${level} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={
            i < level
              ? `h-2.5 w-2.5 rounded-full ${highlight ? "bg-accent" : "bg-ink"}`
              : "h-2.5 w-2.5 rounded-full border border-line"
          }
        />
      ))}
    </div>
  );
}

const COLORS: { name: string; value: string; className: string }[] = [
  { name: "ground", value: "#0D0F10", className: "bg-ground" },
  { name: "ink", value: "#D9DCD6", className: "bg-ink" },
  { name: "ink-dim", value: "#B4B9AF", className: "bg-ink-dim" },
  { name: "ink-faint", value: "#9CA199", className: "bg-ink-faint" },
  { name: "accent", value: "#6FD3C4", className: "bg-accent" },
  { name: "warn", value: "#D98C6A", className: "bg-warn" },
  { name: "line", value: "rgba(255,255,255,0.24)", className: "bg-line" },
  { name: "line-lit", value: "rgba(255,255,255,0.4)", className: "bg-line-lit" },
  { name: "panel", value: "rgba(10,12,13,0.82)", className: "bg-panel" },
];

function ColorSwatch({ name, value, className }: { name: string; value: string; className: string }) {
  return (
    <div className="grid gap-2">
      <div className={`h-20 w-full rounded-sm border border-line ${className}`} />
      <div>
        <p className="text-ink">{name}</p>
        <p className="text-small text-ink-faint">{value}</p>
      </div>
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="border-t border-line py-8 first:border-t-0">{children}</div>;
}

export default function StyleGuidePage() {
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");

  const addSkillTag = (raw: string) => {
    const term = raw.trim();
    if (!term) return;
    setSkillTags((prev) => (prev.some((t) => t.toLowerCase() === term.toLowerCase()) ? prev : [...prev, term]));
  };
  const removeSkillTag = (term: string) => setSkillTags((prev) => prev.filter((t) => t !== term));
  const resetSkillSearch = () => {
    setSkillTags([]);
    setSkillDraft("");
  };

  // A comma commits everything before it as a tag -- handles pasted lists too.
  const handleSkillDraftChange = (value: string) => {
    if (value.includes(",")) {
      const parts = value.split(",");
      const trailing = parts.pop() ?? "";
      parts.forEach(addSkillTag);
      setSkillDraft(trailing);
    } else {
      setSkillDraft(value);
    }
  };
  const handleSkillDraftKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkillTag(skillDraft);
      setSkillDraft("");
    } else if (e.key === "Backspace" && skillDraft === "" && skillTags.length > 0) {
      setSkillTags((prev) => prev.slice(0, -1));
    }
  };

  // The in-progress draft filters live too.
  const skillTerms = useMemo(
    () => [...skillTags, skillDraft].map((t) => t.trim().toLowerCase()).filter(Boolean),
    [skillTags, skillDraft]
  );
  const matchesSkillQuery = (name: string) =>
    skillTerms.length === 0 || skillTerms.some((t) => name.toLowerCase().includes(t));
  const isSearchingSkills = skillTerms.length > 0;
  const hasAnySkillMatch = ALL_SKILLS.some((s) => matchesSkillQuery(s.name));

  return (
    <div className="min-h-screen px-6 py-20 sm:px-12 lg:px-20">
      <Seo title="Style Guide | Nathan Mendoza" path="/styles" noindex />
      <div className="mx-auto max-w-4xl">
        <p className="mb-3 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
          Internal reference -- not a public route
        </p>
        <h1>Style Guide</h1>
        <p className="mt-4 max-w-2xl">
          Typography, colour and component tokens for this site, generated from{" "}
          <code>tailwind.config.js</code> and <code>styles/globals.css</code>. Update the tokens
          there; this page just reflects them.
        </p>

        {/* ===================== TYPOGRAPHY ===================== */}
        <section className="mt-20">
          <h2 className="mb-2">Typography</h2>
          <p className="mb-10 max-w-2xl">
            Every entry below renders from the bare HTML tag, no utility classes applied. H5/H6
            read as small tracked mono labels rather than shrunken display type -- matching the
            eyebrow-label pattern already used elsewhere in the kit.
          </p>

          <Row>
            <h1>H1 - Heading 1</h1>
          </Row>
          <Row>
            <h2>H2 - Heading 2</h2>
          </Row>
          <Row>
            <h3>H3 - Heading 3</h3>
          </Row>
          <Row>
            <h4>H4 - Heading 4</h4>
          </Row>
          <Row>
            <h5>H5 - Heading 5</h5>
          </Row>
          <Row>
            <h6>H6 - Heading 6</h6>
          </Row>
          <Row>
            <p>
              This is a paragraph. It sets the tone for how body copy reads across the site --
              JetBrains Mono, relaxed leading, dimmed a touch below full ink so headings keep
              priority.
            </p>
          </Row>
          <Row>
            <p>
              <strong>This is bold text.</strong>
            </p>
          </Row>
          <Row>
            <p>
              <em>This is italic text.</em>
            </p>
          </Row>
          <Row>
            <small>This is small text.</small>
          </Row>
          <Row>
            <blockquote>
              This is a blockquote -- set off with the accent rail rather than quote marks.
            </blockquote>
          </Row>
          <Row>
            <p>
              This is <code>inline code</code>, sitting inside a normal paragraph.
            </p>
          </Row>
          <Row>
            <pre>
              <code>{`function hello() {\n  return "world";\n}`}</code>
            </pre>
          </Row>
          <Row>
            <ul>
              <li>This is an unordered list item</li>
              <li>Another item, for rhythm</li>
              <li>And a third</li>
            </ul>
          </Row>
          <Row>
            <ol>
              <li>This is an ordered list item</li>
              <li>Another item, for rhythm</li>
              <li>And a third</li>
            </ol>
          </Row>
          <Row>
            <hr />
          </Row>
        </section>

        {/* ===================== COLOURS ===================== */}
        <section className="mt-20">
          <h2 className="mb-10">Colours</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {COLORS.map((c) => (
              <ColorSwatch key={c.name} {...c} />
            ))}
          </div>
        </section>

        {/* ===================== COMPONENTS ===================== */}
        <section className="mt-20 mb-20">
          <h2 className="mb-10">Components</h2>

          <h3 className="mb-6">Buttons</h3>
          <div className="mb-16 flex flex-wrap items-center gap-4">
            <DitherButton className="px-5 py-3.5 text-[11px] tracking-[0.14em] uppercase">
              Primary action
            </DitherButton>
            <DitherButton invert className="px-5 py-3.5 text-[11px] tracking-[0.14em] uppercase">
              Secondary action
            </DitherButton>
          </div>

          <h3 className="mb-6">Links</h3>
          <div className="mb-16">
            <ScrambleLink text="hello@example.dev" href="mailto:hello@example.dev" className="text-ink" />
          </div>

          <h3 className="mb-6">Form inputs</h3>
          <div className="max-w-xl border border-line">
            <ContactForm />
          </div>
        </section>
      </div>

      {/* Full-bleed, breaking out of the max-w-4xl container. */}
      <section className="mt-4 mb-20">
        <div className="mx-auto mb-6 max-w-4xl">
          <h3>Marquee</h3>
        </div>
        <div className="relative left-1/2 right-1/2 mx-[-50vw] w-screen py-8">
          <Marquee
            phrases={["Interested?", "Enquire now!"]}
          />
        </div>
      </section>

      {/* ===================== SCROLL REVEAL ===================== */}
      <div className="mx-auto max-w-4xl">
        <section className="mt-4 mb-20">
          <h2 className="mb-2">Scroll Reveal</h2>
          <p className="mb-10 max-w-2xl">
            Scroll away, then back to these -- both resolve out of noise once they cross into
            view, in the same bit-reversed order ScrambleLink uses for its hover resolve, just
            triggered by an IntersectionObserver instead of a pointer event. Set to replay here so
            you can re-trigger them without reloading; the default is once-only.
          </p>

          <h3 className="mb-6">Scramble heading</h3>
          <div className="mb-16">
            <ScrambleReveal as="h2" text="Selected Work" replay />
          </div>

          <h3 className="mb-6">Digit counter</h3>
          <div className="flex flex-wrap gap-x-16 gap-y-8">
            <DigitCounter value={8} suffix="years experience" replay />
            <DigitCounter value={42} suffix="projects shipped" replay />
            <DigitCounter value={100} suffix="% dithered" replay />
          </div>
        </section>

        {/* ===================== PROJECT THUMBNAIL ===================== */}
        <section className="mt-4 mb-20">
          <h2 className="mb-2">Project Thumbnail</h2>
          <p className="mb-10 max-w-2xl">
            Full colour at rest. Hover dissolves it through the same ordered-noise threshold as
            everything else here into a desaturated, chunky-pixel pass, with the project name
            fading in over that -- legible in a way the colour photo underneath usually isn&rsquo;t.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <DitherImage
              src="/demo-thumb.svg"
              alt="Demo project thumbnail"
              label="Project One"
              className="aspect-square"
            />
            <DitherImage
              src="/demo-thumb.svg"
              alt="Demo project thumbnail"
              label="Project Two"
              className="aspect-square"
            />
          </div>
        </section>

        {/* ===================== COMMAND PALETTE ===================== */}
        <section className="mt-4 mb-20">
          <h2 className="mb-2">Command Palette</h2>
          <p className="max-w-2xl">
            A real typed prompt, not a browsable list -- press <code>/</code>, type an alias and
            hit Enter to run it, or <code>/h</code> for what&rsquo;s available. Up/down arrows
            recall previous input, same as a real shell. Same panel chrome as the field parameters
            panel (<code>bg-panel</code>, <code>border-line</code>, mono uppercase) on purpose, no
            retro-terminal skin -- the interaction is what&rsquo;s terminal-like here, not the
            paint job.
          </p>
          <p className="mt-4 max-w-2xl">
            Mounted once in <code>_app.tsx</code>, not on this page -- it&rsquo;s already live in
            the bottom-left corner, and stays open with its scrollback intact across every route.
            Type <code>cd styles</code> (or <code>cd home</code>) to jump pages -- fed by a{" "}
            <code>routes</code> list in <code>_app.tsx</code>, so a new page just gets added there.
          </p>
        </section>

        {/* ===================== SKILLS ===================== */}
        <section className="mt-4 mb-20">
          <h2 className="mb-2">Services</h2>
          <p className="mb-6 max-w-2xl">
            Name and its dots sit together as one unit, several per line, wrapping naturally.
            Filled dots for how far it goes, outlined for the rest -- quieter than a blocky HUD
            meter, closer to an app-store rating. Type a term and hit enter (or comma) to add it
            as a tag -- matches light up, everything else dims in place. Paste a whole
            requirements list and it splits into tags automatically.
          </p>

          <div className="mb-10 flex flex-wrap items-start gap-3">
            <div className="flex w-full max-w-md flex-wrap items-center gap-2 rounded-sm border border-ink bg-black/15 px-3 py-2 focus-within:border-ink">
              {skillTags.map((term) => {
                const found = ALL_SKILLS.some((s) => s.name.toLowerCase().includes(term.toLowerCase()));
                return (
                  <span
                    key={term}
                    className={`flex items-center gap-1.5 rounded-sm border py-1 pl-2.5 font-mono text-[11px] font-medium uppercase text-ink ${
                      found ? "border-accent/60 bg-accent/25" : "border-warn/60 bg-warn/25"
                    }`}
                  >
                    {term}
                    <button
                      type="button"
                      onClick={() => removeSkillTag(term)}
                      aria-label={`Remove ${term}`}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[15px] font-bold leading-none text-ink/70 transition-colors hover:bg-ink/15 hover:text-ink"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
              <input
                type="text"
                value={skillDraft}
                onChange={(e) => handleSkillDraftChange(e.target.value)}
                onKeyDown={handleSkillDraftKeyDown}
                placeholder={skillTags.length === 0 ? "Search skills — e.g. PHP, Laravel, C#" : "Add another..."}
                className="min-w-[8ch] flex-1 bg-transparent py-1 font-mono text-[12px] text-ink placeholder:text-ink focus:outline-none"
              />
            </div>
            {(skillTags.length > 0 || skillDraft) && (
              <button
                type="button"
                onClick={resetSkillSearch}
                className="rounded-sm border border-line px-3 py-2.5 font-mono text-[10px] tracking-wide text-ink-dim uppercase transition-colors hover:border-line-lit hover:text-ink"
              >
                Reset
              </button>
            )}
          </div>

          <div className="grid gap-10">
            {SKILL_GROUPS.map((group) => {
              const groupHasMatch = group.skills.some((s) => matchesSkillQuery(s.name));
              return (
                <div key={group.label}>
                  <h6
                    className={`mb-4 transition-opacity duration-300 ${
                      !isSearchingSkills || groupHasMatch ? "opacity-100" : "opacity-30"
                    }`}
                  >
                    {group.label}
                  </h6>
                  <div className="flex flex-wrap gap-x-8 gap-y-4">
                    {group.skills.map((skill) => {
                      const isMatch = matchesSkillQuery(skill.name);
                      const spotlight = isSearchingSkills && isMatch;
                      return (
                        <div
                          key={skill.name}
                          className={`flex items-center gap-2.5 transition-opacity duration-300 ease-out ${
                            !isSearchingSkills || isMatch ? "opacity-100" : "opacity-25"
                          }`}
                        >
                          <span
                            className={`font-mono text-[12px] whitespace-nowrap transition-colors duration-300 ${
                              spotlight ? "text-accent" : "text-ink"
                       }`}
                          >
                            {skill.name}
                          </span>
                          <SkillMeter level={skill.level} highlight={spotlight} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {isSearchingSkills && !hasAnySkillMatch && (
            <p className="mt-6 font-mono text-[12px] text-ink-faint">
              No matches -- not in the current stack (yet).
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
