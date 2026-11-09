// Genereert een bundel PNG's op vaste formaten uit één bronlogo, plus public/favicon.ico.
// Gebruik: plaats een hi-res bronbestand op src/assets/images/logo-source.png en run `npm run generate:icons`.
// Het bronbestand wordt eerst bijgesneden op de zichtbare pixels (transparante rand weg) en daarna vierkant
// gemaakt, zodat het logo in elk formaat de volledige ruimte vult (belangrijk voor favicons en de header).
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SOURCE = path.resolve('src/assets/images/logo-source.png');
const OUT_DIR = path.resolve('public/icons');
const FAVICON = path.resolve('public/favicon.ico');

// favicons, apple/android touch icons, en een algemene 400x400 voor social/meta gebruik
const SIZES = [16, 32, 48, 180, 192, 400, 512, 900];
// formaten in favicon.ico
const ICO_SIZES = [16, 32, 48];
// ruimte rond het logo als fractie van de logozijde (klein, zodat het logo zo groot mogelijk blijft)
const PADDING = 0.03;
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function buildSquareLogo() {
  const { data, info } = await sharp(SOURCE).trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
  const side = Math.round(Math.max(info.width, info.height) * (1 + PADDING * 2));
  const left = Math.floor((side - info.width) / 2);
  const top = Math.floor((side - info.height) / 2);
  return sharp(data)
    .extend({ top, bottom: side - info.height - top, left, right: side - info.width - left, background: TRANSPARENT })
    .png()
    .toBuffer();
}

// Een .ico is een kleine container met PNG-afbeeldingen (ondersteund door alle moderne browsers).
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // gereserveerd
  header.writeUInt16LE(1, 2); // type: icoon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  const square = await buildSquareLogo();

  for (const size of SIZES) {
    const outFile = path.join(OUT_DIR, `logo-${size}x${size}.png`);
    await sharp(square).resize(size, size, { fit: 'contain', background: TRANSPARENT }).png().toFile(outFile);
    console.log(`✓ ${path.relative(process.cwd(), outFile)}`);
  }

  const icoImages = [];
  for (const size of ICO_SIZES) {
    const data = await sharp(square).resize(size, size, { fit: 'contain', background: TRANSPARENT }).png().toBuffer();
    icoImages.push({ size, data });
  }
  await writeFile(FAVICON, buildIco(icoImages));
  console.log(`✓ ${path.relative(process.cwd(), FAVICON)}`);
}

run().catch((err) => {
  console.error('Genereren van icons mislukt:', err.message);
  process.exitCode = 1;
});
