import { defineMiddleware } from 'astro:middleware';

// Bloquea el endpoint interno de transformación de imágenes de Astro
// (GHSA-88gm-j2wx-58h6 en @astrojs/cloudflare: SSRF vía redirects en
// /_image). El sitio no usa <Image>/astro:assets — todas las imágenes
// son <img> estáticas servidas desde /uploads — así que este endpoint
// no tiene ningún uso legítimo aquí y se cierra por completo.
export const onRequest = defineMiddleware((context, next) => {
  if (context.url.pathname === '/_image' || context.url.pathname.startsWith('/_image/')) {
    return new Response('Not found', { status: 404 });
  }
  return next();
});
