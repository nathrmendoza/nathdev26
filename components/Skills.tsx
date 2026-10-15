'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';

interface Skill {
  name: string;
  level: number;
}

const SKILL_MAX = 5;

const SKILL_GROUPS: { label: string; skills: Skill[] }[] = [
  {
    label: 'Markup & Styling',
    skills: [
      { name: 'HTML', level: 5 },
      { name: 'PHP', level: 5 },
      { name: 'Liquid', level: 5 },
      { name: 'Twig', level: 5 },
      { name: 'CSS', level: 5 },
      { name: 'Sass', level: 5 },
      { name: 'Tailwind CSS', level: 5 },
      { name: 'Styled Components', level: 4 },
      { name: 'Bootstrap', level: 3 },
      { name: 'Laravel', level: 3 },
    ],
  },
  {
    label: 'JavaScript & Frameworks',
    skills: [
      { name: 'JavaScript', level: 5 },
      { name: 'React', level: 5 },
      { name: 'Next.js', level: 5 },
      { name: 'TypeScript', level: 5 },
      { name: 'jQuery', level: 5 },
      { name: 'Vite', level: 4 },
      { name: 'Webpack', level: 4 },
      { name: 'Gulp.js', level: 4 },
      { name: 'Remix.js', level: 3 },
    ],
  },
  {
    label: 'CMS Platforms',
    skills: [
      { name: 'Craft CMS', level: 5 },
      { name: 'WordPress', level: 4 },
      { name: 'Shopify', level: 4 },
      { name: 'Silverstripe', level: 3 },
      { name: 'Sanity', level: 3 },
    ]
  },
  {
    label: 'Other Tools',
    skills: [
      { name: 'Git', level: 5 },
      { name: 'GitHub', level: 5 },
      { name: 'Bitbucket', level: 5 },
      { name: 'Jira', level: 5 },
      { name: 'Asana', level: 5 },
      { name: 'Trello', level: 5 },
      { name: 'Adobe Photoshop', level: 4 },
      { name: 'Figma', level: 4 },
      { name: 'Adobe XD', level: 4 },
      { name: 'Google Tag Manager', level: 3},
      { name: 'Google Analytics', level: 3}
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
            i < level ? `h-2.5 w-2.5 rounded-full ${highlight ? 'bg-accent' : 'bg-ink'}` : 'h-2.5 w-2.5 rounded-full border border-line'
          }
        />
      ))}
    </div>
  );
}

export default function Skills() {
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState('');

  const addSkillTag = (raw: string) => {
    const term = raw.trim();
    if (!term) return;
    setSkillTags((prev) => (prev.some((t) => t.toLowerCase() === term.toLowerCase()) ? prev : [...prev, term]));
  };
  const removeSkillTag = (term: string) => setSkillTags((prev) => prev.filter((t) => t !== term));
  const resetSkillSearch = () => {
    setSkillTags([]);
    setSkillDraft('');
  };

  // A comma commits everything before it as a tag -- handles pasted lists too.
  const handleSkillDraftChange = (value: string) => {
    if (value.includes(',')) {
      const parts = value.split(',');
      const trailing = parts.pop() ?? '';
      parts.forEach(addSkillTag);
      setSkillDraft(trailing);
    } else {
      setSkillDraft(value);
    }
  };
  const handleSkillDraftKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkillTag(skillDraft);
      setSkillDraft('');
    } else if (e.key === 'Backspace' && skillDraft === '' && skillTags.length > 0) {
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
    <section id="stack" className="px-6 py-32 sm:px-12 sm:py-40">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-2">Tech Stack</h2>
        <p className="mb-10 max-w-xl text-ink-dim">Search whatever&rsquo;s in the job spec — matches light up.</p>

        <div className="mb-10 flex flex-wrap items-start gap-3">
          <div className="flex w-full max-w-md flex-wrap items-center gap-2 rounded-sm border border-ink bg-black/15 px-3 py-2 focus-within:border-ink">
            {skillTags.map((term) => {
              const found = ALL_SKILLS.some((s) => s.name.toLowerCase().includes(term.toLowerCase()));
              return (
                <span
                  key={term}
                  className={`flex items-center gap-1.5 rounded-sm border py-1 pl-2.5 font-mono text-[11px] font-medium uppercase text-ink ${
                    found ? 'border-accent/60 bg-accent/25' : 'border-warn/60 bg-warn/25'
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
              placeholder={skillTags.length === 0 ? 'Search skills — e.g. PHP, Laravel, C#' : 'Add another...'}
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
                    !isSearchingSkills || groupHasMatch ? 'opacity-100' : 'opacity-30'
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
                          !isSearchingSkills || isMatch ? 'opacity-100' : 'opacity-25'
                        }`}
                      >
                        <span
                          className={`font-mono text-[12px] whitespace-nowrap transition-colors duration-300 ${
                            spotlight ? 'text-accent' : 'text-ink'
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
          <p className="mt-6 font-mono text-[12px] text-ink-faint">No matches — not in the current stack (yet).</p>
        )}
      </div>
    </section>
  );
}
