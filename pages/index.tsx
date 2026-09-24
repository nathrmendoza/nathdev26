import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-between px-16 py-32 sm:items-start">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-16 sm:items-start">
        <Image
          data-dither-mask
          className="invert h-5 w-[100px]"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div
          data-dither-mask
          className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left"
        >
          <h1 className="max-w-xs text-3xl leading-10 font-semibold tracking-tight text-ink">
            To get started, edit the{" "}
            <code className="rounded bg-white/[.06] px-1.5 py-0.5 font-mono text-[0.9em]">
              index.tsx
            </code>{" "}
            file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-ink-dim">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app"
              className="font-medium text-ink"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app"
              className="font-medium text-ink"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            data-dither-mask
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 text-ground no-underline transition-colors hover:bg-ink-dim md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="invert h-[14px] w-4"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={14}
            />
            Deploy Now
          </a>
          <a
            data-dither-mask
            className="flex h-12 w-full items-center justify-center rounded-full border border-line-lit px-5 transition-colors hover:bg-white/[.04] md:w-[158px]"
            href="https://nextjs.org/docs/pages/getting-started?utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=default-template-tw"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </div>
    </div>
  );
}
