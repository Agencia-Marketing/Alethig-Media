#!/usr/bin/env node
// Genera variantes .webp más livianas (varios anchos) de las imágenes
// principales en public/uploads/ para poder servir srcset responsive.
//
// 100% build-time: corre como prebuild/predev de npm, escribe archivos
// estáticos .webp en public/uploads/ y un manifest JSON. No usa
// astro:assets ni el endpoint /_image (bloqueado a propósito por
// src/middleware.ts) — las variantes se sirven como cualquier otro
// archivo estático de /uploads/, vía el binding ASSETS de Cloudflare.
//
// Es seguro correr esto varias veces: solo reprocesa imágenes fuente
// (ignora las variantes -Nw.webp que él mismo genera) y sobreescribe.

import { readdir, mkdir, stat } from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const UPLOADS_DIR = path.resolve(process.cwd(), 'public/uploads');
const MANIFEST_PATH = path.join(UPLOADS_DIR, '_responsive-manifest.json');
const WIDTH_LADDER = [480, 768, 1200];
const VARIANT_SUFFIX = /-\d+w\.webp$/;
const QUALITY = 82;

async function main() {
  let files;
  try {
    files = await readdir(UPLOADS_DIR);
  } catch {
    console.warn('[responsive-images] public/uploads no existe todavía, nada que hacer.');
    return;
  }

  const sources = files.filter(
    (f) => f.toLowerCase().endsWith('.webp') && !VARIANT_SUFFIX.test(f) && f !== '_responsive-manifest.json'
  );

  const manifest = {};
  const report = [];

  for (const file of sources) {
    const srcPath = path.join(UPLOADS_DIR, file);
    const { size: srcBytes } = await stat(srcPath);
    const img = sharp(srcPath);
    const meta = await img.metadata();
    const srcWidth = meta.width ?? 0;
    if (!srcWidth) continue;

    const base = file.replace(/\.webp$/i, '');
    const targets = WIDTH_LADDER.filter((w) => w < srcWidth);
    const variants = [];

    for (const w of targets) {
      const outName = `${base}-${w}w.webp`;
      const outPath = path.join(UPLOADS_DIR, outName);
      await sharp(srcPath).resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(outPath);
      const { size: outBytes } = await stat(outPath);
      variants.push({ width: w, path: `/uploads/${outName}`, bytes: outBytes });
    }

    // El archivo original ya existente actúa como el peldaño más ancho del srcset.
    variants.push({ width: srcWidth, path: `/uploads/${file}`, bytes: srcBytes });

    manifest[`/uploads/${file}`] = {
      width: srcWidth,
      height: meta.height ?? null,
      variants,
    };

    report.push({ file, srcWidth, srcBytes, variants });
  }

  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  // Resumen legible para verificación manual.
  console.log('\n[responsive-images] Variantes generadas:\n');
  let totalOriginal = 0;
  let totalLargestVariant = 0;
  for (const r of report) {
    console.log(`  ${r.file}  (original ${r.srcWidth}px, ${(r.srcBytes / 1024).toFixed(1)} KB)`);
    for (const v of r.variants) {
      const tag = v.width === r.srcWidth ? 'original' : 'generado';
      console.log(`    ${String(v.width).padStart(4)}w  ${(v.bytes / 1024).toFixed(1).padStart(7)} KB  (${tag})  ${v.path}`);
    }
    totalOriginal += r.srcBytes;
    // Estimación de ahorro: variante más pequeña (480w, típico móvil) vs original.
    const smallest = r.variants[0];
    if (smallest && smallest.width !== r.srcWidth) totalLargestVariant += smallest.bytes;
    else totalLargestVariant += r.srcBytes;
  }
  const savingsPct = totalOriginal > 0 ? (100 * (1 - totalLargestVariant / totalOriginal)) : 0;
  console.log(
    `\n  Total original: ${(totalOriginal / 1024).toFixed(0)} KB · si un móvil carga siempre el peldaño más chico (480w): ${(totalLargestVariant / 1024).toFixed(0)} KB (~${savingsPct.toFixed(0)}% menos)\n`
  );
}

main().catch((err) => {
  console.error('[responsive-images] Error:', err);
  process.exit(1);
});
