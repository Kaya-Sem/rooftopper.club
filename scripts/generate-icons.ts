import sharp from "sharp";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dir, "..");
const OUT_DIR = path.join(PROJECT_ROOT, "public", "icons");
const BG = "#1a1a1a";

const TWEMOJI_URL =
  "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f3d7.svg";

async function fetchEmojiInner(): Promise<string> {
  const res = await fetch(TWEMOJI_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch emoji SVG: ${res.status} ${res.statusText}`);
  }
  const raw = await res.text();
  const inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return inner;
}

function svg(emojiInner: string, size: number, contentScale: number, background = BG): string {
  const artSize = size * contentScale;
  const offset = (size - artSize) / 2;
  const scale = artSize / 36;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${background}" />
  <g transform="translate(${offset},${offset}) scale(${scale})">
    ${emojiInner}
  </g>
</svg>`;
}

async function renderPng(
  emojiInner: string,
  outFile: string,
  size: number,
  contentScale: number,
  background = BG,
) {
  await sharp(Buffer.from(svg(emojiInner, size, contentScale, background)))
    .resize(size, size)
    .png()
    .toFile(outFile);
  console.log(`wrote ${outFile}`);
}

async function main() {
  await Bun.$`mkdir -p ${OUT_DIR}`;
  const emojiInner = await fetchEmojiInner();

  await renderPng(emojiInner, path.join(OUT_DIR, "icon-192.png"), 192, 0.8);
  await renderPng(emojiInner, path.join(OUT_DIR, "icon-512.png"), 512, 0.8);
  await renderPng(emojiInner, path.join(OUT_DIR, "icon-maskable-512.png"), 512, 0.55);
  await renderPng(emojiInner, path.join(OUT_DIR, "apple-touch-icon.png"), 180, 0.8);
}

main();
