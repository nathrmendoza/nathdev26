import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en-NZ">
      {/* Per-page tags (title, description, OG) are in Seo.tsx. */}
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0d0f10" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
