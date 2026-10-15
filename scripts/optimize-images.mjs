/**
 * optimize-images.mjs  --  `npm run images` (add `-- --force` to redo all)
 *
 * Turns original project screenshots into the WebP files the site serves.
 *
 *   images/works/<slug>/<name>.png   ->   public/works/<slug>/<name>.webp
 *
 * Drop originals (PNG/JPG/WebP/AVIF/TIFF, any size) into images/works/<slug>/,
 * run this, then point lib/works-data.ts at the /works/<slug>/<name>.webp
 * paths. Originals are gitignored -- only the optimised output ships.
 *
 *  - Files named thumb* are works-grid thumbnails: 1000px wide. Everything
 *    else is a carousel screenshot: 1440px wide. Never upscaled.
 *  - Anything taller than MAX_HEIGHT after resizing is cropped from the top
 *    down -- a full-page capture keeps its top and loses its far bottom.
 *  - WebP over AVIF: AVIF smears small UI text at the sizes that make it
 *    worth using; WebP at this quality keeps screenshots crisp.
 *  - Writes lib/data/image-sizes.json (width/height per output), so the
 *    carousel can reserve each image's space before it loads.
 *
 * Unchanged originals are skipped (output newer than source).
 */

import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC_DIR = 'images/works';
const OUT_DIR = 'public/works';
const MANIFEST = 'lib/data/image-sizes.json';

const INPUT_EXT = /\.(png|jpe?g|webp|avif|tiff?)$/i;
const SCREENSHOT_WIDTH = 1440;
const THUMB_WIDTH = 1000;
// Well under WebP's 16383px hard limit, and about as long as a screenshot
// is still worth scrolling through.
const MAX_HEIGHT = 8000;
const QUALITY = 82;

const force = process.argv.includes('--force');

const kb = (bytes) => `${Math.round(bytes / 1024)}KB`;

async function mtime(file) {
  try {
    return (await stat(file)).mtimeMs;
  } catch {
    return 0;
  }
}

async function main() {
  let slugs;
  try {
    slugs = (await readdir(SRC_DIR, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    console.log(`No ${SRC_DIR}/ folder yet -- put originals in ${SRC_DIR}/<slug>/ and run again.`);
    return;
  }

  const manifest = {};
  let written = 0;

  for (const slug of slugs.sort()) {
    const files = (await readdir(path.join(SRC_DIR, slug))).filter((f) => INPUT_EXT.test(f)).sort();
    if (!files.length) continue;
    await mkdir(path.join(OUT_DIR, slug), { recursive: true });

    for (const file of files) {
      const name = path.parse(file).name;
      const src = path.join(SRC_DIR, slug, file);
      const out = path.join(OUT_DIR, slug, `${name}.webp`);
      const publicPath = `/works/${slug}/${name}.webp`;

      if (force || (await mtime(out)) < (await mtime(src))) {
        const meta = await sharp(src).metadata();
        const maxWidth = /^thumb/i.test(name) ? THUMB_WIDTH : SCREENSHOT_WIDTH;
        const width = Math.min(meta.width, maxWidth);
        const fullHeight = Math.round((meta.height * width) / meta.width);
        const height = Math.min(fullHeight, MAX_HEIGHT);

        await sharp(src)
          .resize({ width, height, fit: 'cover', position: 'top' })
          .webp({ quality: QUALITY, effort: 6, smartSubsample: true })
          .toFile(out);

        const note = fullHeight > MAX_HEIGHT ? `  (cropped from ${fullHeight}px tall)` : '';
        console.log(`${publicPath}  ${width}x${height}  ${kb((await stat(src)).size)} -> ${kb((await stat(out)).size)}${note}`);
        written++;
      }

      const { width, height } = await sharp(out).metadata();
      manifest[publicPath] = { width, height };
    }
  }

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  const total = Object.keys(manifest).length;
  console.log(`${written} written, ${total - written} unchanged. Sizes in ${MANIFEST}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
