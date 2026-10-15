import type { GetStaticPaths, GetStaticProps } from "next";
import WorkCarousel from "@/components/WorkCarousel";
import DitherLinkButton from "@/components/DitherLinkButton";
import { ExternalLinkIcon } from "@/components/icons";
import { WORKS, getWorkBySlug, type WorkProject } from "@/lib/works-data";

interface Props {
  project: WorkProject;
}

export default function WorkDetailPage({ project }: Props) {
  return (
    // Fills exactly the space between header and footer, content centred --
    // so a project whose media fits on one screen doesn't scroll at all.
    // Taller media just grows the section and scrolls as normal.
    <section className="flex min-h-[calc(100vh-var(--header-h,96px)-var(--footer-h,0px))] items-center px-6 py-10 sm:px-12">
      <div className="mx-auto grid w-full max-w-6xl gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <h1 className="mb-4">{project.name}</h1>
          <p className="mb-10 max-w-md text-ink-dim">{project.description}</p>

          <h6 className="mb-3">Tech Stack</h6>
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-sm border border-line px-2.5 py-1 font-mono text-[11px] text-ink-dim uppercase"
              >
                {tech}
              </span>
            ))}
          </div>

          {project.site && (
            <DitherLinkButton
              href={project.site}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 px-7 py-4 text-[16px] tracking-[0.14em] uppercase"
            >
              <span className="inline-flex items-center gap-3">
                Visit Site
                <span className="h-[1.1em] w-[1.1em]">
                  <ExternalLinkIcon />
                </span>
                <span className="sr-only">(opens in a new tab)</span>
              </span>
            </DitherLinkButton>
          )}
        </div>

        {project.media.length > 0 && <WorkCarousel media={project.media} />}
      </div>
    </section>
  );
}

// Hidden for launch (one-pager): every project 404s. Set false to bring
// them back, along with the Works links in Header NAV_ITEMS and _app ROUTES.
const HIDDEN = true;

export const getStaticPaths: GetStaticPaths = () => ({
  paths: HIDDEN ? [] : WORKS.map((w) => ({ params: { slug: w.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = ({ params }) => {
  if (HIDDEN) return { notFound: true };
  const project = getWorkBySlug(params!.slug as string);
  if (!project) return { notFound: true };
  return { props: { project } };
};
