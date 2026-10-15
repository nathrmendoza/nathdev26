// npm run images [-- --force]
// Every image under images/ -> public/images/ as WebP, same folders and names
// (images/foo.png -> /images/foo.webp), plus lib/data/image-sizes.json.
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC_ROOT = 'images';
const OUT_ROOT = 'public/images';
const MANIFEST = 'lib/data/image-sizes.json';

const INPUT_EXT = /\.(png|jpe?g|webp|avif|tiff?)$/i;
const MAX_WIDTH = 1440;
// Full-page screenshots are cropped from the top past this. Under WebP's 16383px limit.
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

async function listImages(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listImages(full)));
    else if (INPUT_EXT.test(entry.name)) files.push(full);
  }
  return files;
}

async function main() {
  const sources = await listImages(SRC_ROOT);
  if (!sources.length) {
    console.log(`No images in ${SRC_ROOT}/ -- add some and run again.`);
    return;
  }

  const manifest = {};
  let written = 0;

  for (const src of sources) {
    const { dir, name } = path.parse(path.relative(SRC_ROOT, src));
    const out = path.join(OUT_ROOT, dir, `${name}.webp`);
    const publicPath = '/' + path.relative('public', out).split(path.sep).join('/');

    if (force || (await mtime(out)) < (await mtime(src))) {
      await mkdir(path.dirname(out), { recursive: true });
      const meta = await sharp(src).metadata();
      const width = Math.min(meta.width, MAX_WIDTH);
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

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${written} written, ${sources.length - written} unchanged. Sizes in ${MANIFEST}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
