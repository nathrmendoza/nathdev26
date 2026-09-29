import Link from "next/link";
import DitherImage from "@/components/DitherImage";
import { WORKS } from "@/lib/works-data";

export default function WorksPage() {
  return (
    <section className="px-6 py-32 sm:px-12 sm:py-40">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4">Works</h1>
        <p className="mb-16 max-w-xl text-ink-dim">A handful of things I&rsquo;ve built recently.</p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WORKS.map((project) => (
            <Link
              key={project.slug}
              href={`/works/${project.slug}`}
              data-dither-mask
              className="block no-underline"
            >
              <DitherImage
                src={project.thumbnail}
                alt={project.name}
                label={project.name}
                className="aspect-[4/3] w-full rounded-sm"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
