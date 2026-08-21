import sharp from "sharp";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dir, "..");
const OUT_DIR = path.join(PROJECT_ROOT, "public", "icons");
const BG = "#1a1a1a";
const STROKE = "#e5e5e5";

const CRANE_PATHS = `
  <path d="M2 21h20" />
  <path d="M7 21V3" />
  <path d="M7 4L22 6.5" />
  <path d="M7 4L2 5" />
  <rect x="1" y="4.3" width="2" height="1.8" fill="${STROKE}" stroke="none" />
  <path d="M16 5.7v8.3" />
  <path d="M16 14l-1.2 1.5h2.4z" fill="${STROKE}" stroke="none" />
  <rect x="5.5" y="2" width="3" height="2.2" rx="0.3" />
`;

function svg(size: number, contentScale: number, background = BG): string {
  const scale = (size / 24) * contentScale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${background}" />
  <g transform="translate(${size / 2},${
    size / 2
  }) scale(${scale}) translate(-12,-12)"
     fill="none" stroke="${STROKE}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    ${CRANE_PATHS}
  </g>
</svg>`;
}

async function renderPng(
  outFile: string,
  size: number,
  contentScale: number,
  background = BG,
) {
  await sharp(Buffer.from(svg(size, contentScale, background)))
    .resize(size, size)
    .png()
    .toFile(outFile);
  console.log(`wrote ${outFile}`);
}

async function main() {
  await Bun.$`mkdir -p ${OUT_DIR}`;

  await renderPng(path.join(OUT_DIR, "icon-192.png"), 192, 0.85);
  await renderPng(path.join(OUT_DIR, "icon-512.png"), 512, 0.85);

  await renderPng(path.join(OUT_DIR, "icon-maskable-512.png"), 512, 0.55);

  await renderPng(path.join(OUT_DIR, "apple-touch-icon.png"), 180, 0.85);
}

main();
