import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://alethigmedia.com',
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
});
