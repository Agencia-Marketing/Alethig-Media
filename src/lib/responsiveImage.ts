import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Lee el manifest generado por scripts/generate-responsive-images.mjs
// (corre como prebuild/predev de npm, ver package.json). Si el manifest
// no existe todavía —por ejemplo, alguien corrió `astro build` directo
// sin pasar por npm— cada imagen simplemente se sirve sin srcset, igual
// que antes de este cambio. Nunca rompe el build.
type Manifest = Record<string, { width: number; height: number | null; variants: { width: number; path: string; bytes: number }[] }>;

let manifest: Manifest = {};
try {
  const manifestPath = path.resolve(process.cwd(), 'public/uploads/_responsive-manifest.json');
  if (existsSync(manifestPath)) {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  }
} catch {
  // Sin manifest: las imágenes se sirven sin srcset (comportamiento anterior).
}

/**
 * Dado un path de imagen tal como se guarda en el contenido (p.ej.
 * "/uploads/home-hero.webp"), devuelve el atributo `srcset` con los
 * anchos generados, o `undefined` si no hay variantes (imagen fuera
 * del manifest, o manifest no generado).
 */
export function getSrcSet(imagePath: string): string | undefined {
  const entry = manifest[imagePath];
  if (!entry || entry.variants.length < 2) return undefined;
  return entry.variants.map((v) => `${v.path} ${v.width}w`).join(', ');
}
