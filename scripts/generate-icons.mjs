// Genereert een bundel PNG's op vaste formaten uit één bronlogo.
// Gebruik: plaats een hi-res bronbestand op src/assets/images/logo-source.png en run `npm run generate:icons`.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SOURCE = path.resolve('src/assets/images/logo-source.png');
const OUT_DIR = path.resolve('public/icons');

// favicons, apple/android touch icons, en een algemene 400x400 voor social/meta gebruik
// 900px wordt gebruikt als grote, vervaagde crest achter de hero-titel
const SIZES = [16, 32, 48, 180, 192, 400, 512, 900];

async function run() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const size of SIZES) {
    const outFile = path.join(OUT_DIR, `logo-${size}x${size}.png`);

    await sharp(SOURCE)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(outFile);

    console.log(`✓ ${path.relative(process.cwd(), outFile)}`);
  }
}

run().catch((err) => {
  console.error('Genereren van icons mislukt:', err.message);
  process.exitCode = 1;
});
