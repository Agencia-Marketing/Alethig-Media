import type { APIRoute } from 'astro';
import { buildChatContext, buildSystemPrompt, type ChatLocale } from '../../lib/chatbot-context';

export const prerender = false;

// Chatbot V1 — Workers AI vía binding de cuenta (sin API key, ver
// wrangler.jsonc: "ai": { "binding": "AI" }). Modelo confirmado vigente
// (no deprecado) contra el catálogo de Workers AI al momento de
// implementar — @cf/meta/llama-3.1-8b-instruct-fast (128k de contexto,
// multilingüe). Si Cloudflare lo retira en el futuro, cambiar solo esta
// constante.
const MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';
const MAX_TOKENS = 400;

// --- Validación de entrada (spec aprobada, sección F/G) ---
const MAX_MESSAGE_LEN = 500;
const MAX_HISTORY = 16;
const MAX_BODY_CHARS = 8000; // guarda burda contra payloads enormes, antes de parsear JSON

// --- Rate limiting (spec aprobada, sección D) — obligatorio en V1 ---
// Binding nativo de Rate Limiting de Cloudflare (wrangler.jsonc: "ratelimits"),
// no KV: el conteo KV manual (lectura+escritura no atómica) se probó en vivo
// y se pudo saltar por completo con una ráfaga de 10 solicitudes concurrentes
// desde una misma IP (el contador final quedó en 3, no en 10). El binding
// nativo evalúa el límite en el borde de Cloudflare de forma atómica, sin
// esa condición de carrera. El límite real (8 solicitudes / 60s) se define
// en wrangler.jsonc, no aquí — ver el binding "CHAT_RATE_LIMIT".
//
// env.CHAT_RATE_LIMIT.limit({ key }) solo devuelve { success: boolean } — no
// expone el conteo restante ni el instante en que se reinicia la ventana, así
// que el valor de Retry-After abajo NO sale de la API (que no ofrece esa
// información): es el período configurado en wrangler.jsonc, usado como cota
// conservadora, no como un cálculo exacto del tiempo restante.
const RATE_LIMIT_PERIOD_SECONDS = 60; // debe coincidir con "period" en wrangler.jsonc

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const json = (status: number, body: Record<string, unknown>, extraHeaders?: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...(extraHeaders ?? {}) },
  });

const isValidLocale = (v: unknown): v is ChatLocale => v === 'es' || v === 'en';

const isValidHistory = (v: unknown): v is ChatMessage[] => {
  if (!Array.isArray(v) || v.length > MAX_HISTORY) return false;
  return v.every(
    (m) =>
      m &&
      typeof m === 'object' &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.length > 0 &&
      m.content.length <= MAX_MESSAGE_LEN,
  );
};

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env ?? {};

  // --- Parse con guarda de tamaño ANTES de JSON.parse ---
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return json(400, { ok: false, error: 'invalid_request' });
  }
  if (!raw || raw.length > MAX_BODY_CHARS) {
    return json(400, { ok: false, error: 'invalid_request' });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, error: 'invalid_request' });
  }

  const locale = body?.locale;
  const message = body?.message;
  const history = body?.history ?? [];

  if (!isValidLocale(locale)) return json(400, { ok: false, error: 'invalid_request' });
  if (typeof message !== 'string') return json(400, { ok: false, error: 'invalid_request' });
  const trimmedMessage = message.trim();
  if (trimmedMessage.length === 0 || trimmedMessage.length > MAX_MESSAGE_LEN) {
    return json(400, { ok: false, error: 'invalid_request' });
  }
  if (!isValidHistory(history)) return json(400, { ok: false, error: 'invalid_request' });

  // --- Rate limit: binding nativo de Cloudflare (obligatorio en V1) ---
  // CF-Connecting-IP: mismo header ya usado y confiado en src/pages/api/contact.ts
  // para Turnstile — lo pone el borde de Cloudflare, no lo puede falsear el cliente
  // en este despliegue. En local (wrangler dev) no está presente: se usa una clave
  // fija ("local-dev"), documentado en la spec aprobada — todo el tráfico local
  // comparte un único cubo, aceptable porque es tráfico de desarrollo, no público.
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local-dev';
  const rateLimiter = env.CHAT_RATE_LIMIT;
  if (!rateLimiter) {
    // El chatbot no debe operar sin protección contra abuso (requisito de V1) —
    // si falta el binding, se falla cerrado en vez de servir sin límite.
    console.error('Falta el binding nativo CHAT_RATE_LIMIT (Rate Limiting): no se puede aplicar el rate limit.');
    return json(503, { ok: false, error: 'unavailable' });
  }
  try {
    const { success } = await rateLimiter.limit({ key: ip });
    if (!success) {
      return json(
        429,
        { ok: false, error: 'rate_limited' },
        { 'Retry-After': String(RATE_LIMIT_PERIOD_SECONDS) },
      );
    }
  } catch (e) {
    console.error('El binding de Rate Limiting falló:', e);
    return json(503, { ok: false, error: 'unavailable' });
  }

  // --- Contexto + system prompt, generados desde el contenido aprobado ---
  let systemPrompt: string;
  try {
    const context = await buildChatContext(locale);
    systemPrompt = buildSystemPrompt(locale, context);
  } catch (e) {
    console.error('No se pudo construir el contexto del chatbot:', e);
    return json(503, { ok: false, error: 'unavailable' });
  }

  // --- Workers AI ---
  const ai = env.AI;
  if (!ai) {
    console.error('Falta el binding AI: Workers AI no está configurado.');
    return json(503, { ok: false, error: 'unavailable' });
  }
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: trimmedMessage },
    ];
    const result = await ai.run(MODEL, { messages, max_tokens: MAX_TOKENS });
    const reply = result?.response;
    if (typeof reply !== 'string' || reply.trim().length === 0) {
      throw new Error('Respuesta vacía o con forma inesperada del modelo.');
    }
    return json(200, { ok: true, reply: reply.trim() });
  } catch (e) {
    console.error('Workers AI falló:', e);
    return json(502, { ok: false, error: 'unavailable' });
  }
};
