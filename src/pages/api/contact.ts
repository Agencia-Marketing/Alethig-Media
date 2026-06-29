import type { APIRoute } from 'astro';
import site from '../../content/settings/site.json';
import contact from '../../content/pages/contact.json';

export const prerender = false;

// Fase B: remitente. Debe ser un buzón de un dominio onboarded en Cloudflare Email
// Sending. Mientras no haya dominio, el binding EMAIL no existe y solo se guarda en KV.
const FROM_EMAIL = 'no-reply@alethigmedia.com';
const FROM_NAME = 'Alethig Media Web';

const REQUIRED = ['nombre', 'negocio', 'telefono', 'email'] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const serviceLabel = (value: string) =>
  contact.serviceOptions.find((o) => o.value === value)?.label ?? value ?? '—';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const env = (locals as any).runtime?.env ?? {};

  const wantsJson =
    request.headers.get('accept')?.includes('application/json') ||
    request.headers.get('x-requested-with') === 'fetch';

  const fail = (status: number, error: string) =>
    wantsJson
      ? new Response(JSON.stringify({ ok: false, error }), {
          status,
          headers: { 'content-type': 'application/json' },
        })
      : redirect('/contacto?error=1', 303);

  // --- Parse (JSON, urlencoded o FormData) ---
  let data: Record<string, string> = {};
  try {
    const ct = request.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      const body = await request.json();
      data = Object.fromEntries(
        Object.entries(body ?? {}).map(([k, v]) => [k, String(v ?? '').trim()]),
      );
    } else {
      const fd = await request.formData();
      for (const [k, v] of fd.entries()) data[k] = String(v ?? '').trim();
    }
  } catch {
    return fail(400, 'Solicitud inválida.');
  }

  // --- Honeypot: si el bot rellenó "website", fingir éxito sin guardar ni enviar ---
  if (data.website) {
    return wantsJson
      ? new Response(JSON.stringify({ ok: true }), {
          headers: { 'content-type': 'application/json' },
        })
      : redirect('/gracias', 303);
  }

  // --- Validación ---
  for (const field of REQUIRED) {
    if (!data[field]) return fail(400, 'Faltan campos requeridos.');
  }
  if (!EMAIL_RE.test(data.email)) return fail(400, 'Correo electrónico inválido.');

  const record = {
    nombre: data.nombre,
    negocio: data.negocio,
    telefono: data.telefono,
    email: data.email,
    servicio: serviceLabel(data.servicio),
    mensaje: data.mensaje ?? '',
    ts: new Date().toISOString(),
  };

  // --- Fase A: guardar en KV (garantiza captura, sin dominio) ---
  if (env.SUBMISSIONS) {
    try {
      await env.SUBMISSIONS.put(
        `contacto:${Date.now()}:${crypto.randomUUID()}`,
        JSON.stringify(record),
      );
    } catch (e) {
      console.error('KV put falló:', e);
      // Si no hay email configurado, KV es la única entrega → fallar honestamente.
      if (!env.EMAIL) return fail(500, 'No se pudo enviar. Intenta de nuevo.');
    }
  } else if (!env.EMAIL) {
    // Ni KV ni EMAIL configurados → no podemos entregar nada. No mentir.
    console.error('Sin binding SUBMISSIONS ni EMAIL: el formulario no entrega.');
    return fail(500, 'El formulario no está configurado. Intenta más tarde.');
  }

  // --- Fase B: email (solo si el binding existe; no rompe el flujo si falla) ---
  if (env.EMAIL) {
    const subject = `Nuevo mensaje de contacto — ${record.nombre} (${record.negocio})`;
    const text =
      `Nombre: ${record.nombre}\n` +
      `Negocio: ${record.negocio}\n` +
      `Teléfono: ${record.telefono}\n` +
      `Email: ${record.email}\n` +
      `Servicio: ${record.servicio}\n` +
      `Mensaje:\n${record.mensaje}\n`;
    const html =
      `<h2>Nuevo mensaje de contacto</h2>` +
      `<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif">` +
      `<tr><td><b>Nombre</b></td><td>${esc(record.nombre)}</td></tr>` +
      `<tr><td><b>Negocio</b></td><td>${esc(record.negocio)}</td></tr>` +
      `<tr><td><b>Teléfono</b></td><td>${esc(record.telefono)}</td></tr>` +
      `<tr><td><b>Email</b></td><td>${esc(record.email)}</td></tr>` +
      `<tr><td><b>Servicio</b></td><td>${esc(record.servicio)}</td></tr>` +
      `<tr><td valign="top"><b>Mensaje</b></td><td>${esc(record.mensaje).replace(/\n/g, '<br>')}</td></tr>` +
      `</table>`;
    try {
      await env.EMAIL.send({
        to: site.contact.email,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        replyTo: record.email,
        subject,
        html,
        text,
      });
    } catch (e) {
      console.error('EMAIL.send falló:', e);
      // KV ya capturó (si está). No fallar el flujo del usuario por esto.
    }
  }

  return wantsJson
    ? new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' },
      })
    : redirect('/gracias', 303);
};
