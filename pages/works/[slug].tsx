import { useState } from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import CollageGrid from "@/components/CollageGrid";
import Lightbox from "@/components/Lightbox";
import { WORKS, getWorkBySlug, type WorkProject } from "@/lib/works-data";

interface Props {
  project: WorkProject;
}

export default function WorkDetailPage({ project }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <section className="px-6 py-32 sm:px-12 sm:py-40">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-20">
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
        </div>

        <div>
          <CollageGrid images={project.images} onOpen={setLightboxIndex} />
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={project.images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </section>
  );
}

export const getStaticPaths: GetStaticPaths = () => ({
  paths: WORKS.map((w) => ({ params: { slug: w.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = ({ params }) => {
  const project = getWorkBySlug(params!.slug as string);
  if (!project) return { notFound: true };
  return { props: { project } };
};
