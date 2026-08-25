import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://alethigmedia.com',
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  // Fase 2 — bilingüe: URLs previas a /es/ redirigen permanentemente (301
  // en GET) a su equivalente en /es/. El destino incluye la barra final
  // para no depender de un segundo salto de normalización de Cloudflare.
  // "/" queda fuera de este mapa a propósito: su redirect es dinámico
  // (cookie/Accept-Language, ver src/pages/index.astro), no un destino fijo.
  redirects: {
    '/contacto': '/es/contacto/',
    '/nosotros': '/es/nosotros/',
    '/gracias': '/es/gracias/',
    '/alethig-media-os': '/es/alethig-media-os/',
    '/servicios/desarrollo-web': '/es/servicios/desarrollo-web/',
    '/servicios/diseno-de-marca': '/es/servicios/diseno-de-marca/',
    '/servicios/manejo-de-redes-sociales': '/es/servicios/manejo-de-redes-sociales/',
    '/servicios/produccion-de-video': '/es/servicios/produccion-de-video/',
    '/servicios/publicidad-pagada': '/es/servicios/publicidad-pagada/',
  },
  integrations: [
    sitemap({
      // /gracias (ES) y /thank-you (EN) son noindex (agradecimiento
      // post-formulario); /api/* no son páginas. Todas quedan fuera del
      // sitemap. hreflang/locales del sitemap: fase 5, no aquí.
      filter: (page) => !page.includes('/gracias') && !page.includes('/thank-you') && !page.includes('/api/'),
    }),
  ],
});
