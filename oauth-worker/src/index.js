/**
 * Proxy OAuth de GitHub para Decap CMS sobre Cloudflare Workers.
 *
 * Flujo:
 *   1. Decap abre  /auth          -> redirige a GitHub (authorize)
 *   2. GitHub vuelve a /callback?code=...
 *   3. El Worker intercambia el code por un access_token
 *   4. Devuelve un HTML que hace postMessage al opener (Decap) con el token
 *
 * Secrets requeridos (wrangler secret put):
 *   - GITHUB_CLIENT_ID
 *   - GITHUB_CLIENT_SECRET
 */

const GITHUB_AUTHORIZE = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN = 'https://github.com/login/oauth/access_token';

function renderResult(status, content) {
  // Decap escucha un mensaje 'authorization:github:success:{...}' del popup.
  const body = JSON.stringify(content);
  return `<!DOCTYPE html><html><body><script>
    (function () {
      function receiveMessage(e) {
        window.opener.postMessage(
          'authorization:github:${status}:${body.replace(/'/g, "\\'")}',
          e.origin
        );
        window.removeEventListener('message', receiveMessage, false);
      }
      window.addEventListener('message', receiveMessage, false);
      window.opener.postMessage('authorizing:github', '*');
    })();
  </script></body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Paso 1: iniciar el flujo
    if (url.pathname === '/auth') {
      const redirectUri = `${url.origin}/callback`;
      const authUrl = new URL(GITHUB_AUTHORIZE);
      authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'repo,user');
      authUrl.searchParams.set('state', crypto.randomUUID());
      return Response.redirect(authUrl.toString(), 302);
    }

    // Paso 2-4: intercambiar code por token
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response('Falta el parámetro code', { status: 400 });
      }

      const tokenResp = await fetch(GITHUB_TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const data = await tokenResp.json();

      if (data.error || !data.access_token) {
        return new Response(renderResult('error', { message: data.error || 'sin token' }), {
          headers: { 'Content-Type': 'text/html' },
        });
      }

      return new Response(
        renderResult('success', { token: data.access_token, provider: 'github' }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    return new Response('Decap OAuth proxy activo. Usa /auth para iniciar sesión.', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};
