import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://alethigmedia.com',
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  integrations: [
    sitemap({
      // /gracias es noindex (página de agradecimiento post-formulario);
      // /api/* no son páginas. Ambas quedan fuera del sitemap.
      filter: (page) => !page.includes('/gracias') && !page.includes('/api/'),
    }),
  ],
});
