# Decap OAuth Proxy (Cloudflare Worker)

Proxy mínimo para que **Decap CMS** se autentique con **GitHub** desde producción
(Cloudflare Pages no tiene Netlify Identity/Git Gateway).

## Despliegue

1. Crea una **OAuth App** en GitHub:
   - GitHub → *Settings → Developer settings → OAuth Apps → New OAuth App*
   - **Homepage URL:** `https://<tu-sitio>` (dominio de Cloudflare Pages)
   - **Authorization callback URL:** `https://decap-oauth.<subdominio>.workers.dev/callback`
   - Anota el **Client ID** y genera un **Client Secret**.

2. Despliega el Worker:
   ```bash
   cd oauth-worker
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   npx wrangler deploy
   ```

3. Copia la URL resultante (`https://decap-oauth.<subdominio>.workers.dev`) en
   `public/admin/config.yml` → `backend.base_url`.

4. Haz commit/push. Entra a `https://<tu-sitio>/admin`, pulsa
   *"Login with GitHub"* y empieza a editar. Cada guardado hace commit a `main`.

## Edición local (sin OAuth)

No necesitas el Worker para editar en local:

```bash
npm run dev      # Astro en :4321
npm run cms      # decap-server (proxy local) en :8081
```

Abre `http://localhost:4321/admin` — usa `local_backend: true` del config.yml.
