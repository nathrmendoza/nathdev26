import Link from "next/link";
import DitherImage from "@/components/DitherImage";
import { WORKS } from "@/lib/works-data";

export default function WorksPage() {
  return (
    <section className="px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4">Featured Works</h1>
        <p className="mb-16 max-w-xl text-ink-dim">Stuff I’ve worked on over the years.”</p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WORKS.map((project) => (
            <Link
              key={project.slug}
              href={`/works/${project.slug}`}
              scroll={false}
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
