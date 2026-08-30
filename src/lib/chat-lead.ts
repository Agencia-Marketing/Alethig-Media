import site from '../content/settings/site.json';
import type { ChatLocale } from './chatbot-context';

// Chatbot V2 — captura de leads. Reutiliza la misma infraestructura de
// Resend que ya usa src/pages/api/contact.ts (mismo secret RESEND_API_KEY,
// mismo FROM/dominio verificado, mismo destinatario), pero como un envío
// SEPARADO — no se reutiliza el handler de contact.ts porque su modelo de
// validación (todos los campos requeridos) no encaja con un lead
// conversacional y progresivo, que puede llegar con solo algunos campos.
//
// Cualquier fallo aquí se registra y se ignora — nunca debe romper la
// conversación del visitante (ver el llamado en chat.ts, envuelto en
// try/catch adicional por seguridad).

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const FROM = 'Alethig Media Web <no-reply@notify.alethigmedia.com>';

export type ChatLead = {
  name?: string;
  business?: string;
  business_type?: string;
  location?: string;
  phone?: string;
  email?: string;
  service_interest?: string;
  marketing_goal?: string;
};

export type ChatHistoryMessage = { role: 'user' | 'assistant'; content: string };

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Resumen corto de la conversación para dar contexto humano en el correo —
// no es una transcripción completa ni se vuelve a mostrar al visitante.
const MAX_SUMMARY_TURNS = 12;
const MAX_SUMMARY_LINE_LEN = 200;

function summarizeConversation(history: ChatHistoryMessage[], locale: ChatLocale): string {
  const whoLabel = locale === 'en' ? { user: 'Visitor', assistant: 'Assistant' } : { user: 'Visitante', assistant: 'Asistente' };
  return history
    .slice(-MAX_SUMMARY_TURNS)
    .map((m) => {
      const who = whoLabel[m.role];
      const text = m.content.length > MAX_SUMMARY_LINE_LEN ? m.content.slice(0, MAX_SUMMARY_LINE_LEN) + '…' : m.content;
      return `${who}: ${text}`;
    })
    .join('\n');
}

const FIELD_LABELS: Record<ChatLocale, Record<keyof ChatLead, string>> = {
  es: {
    name: 'Nombre', business: 'Negocio', business_type: 'Tipo de negocio', location: 'Ubicación',
    phone: 'Teléfono', email: 'Email', service_interest: 'Servicio de interés', marketing_goal: 'Objetivo principal',
  },
  en: {
    name: 'Name', business: 'Business', business_type: 'Business type', location: 'Location',
    phone: 'Phone', email: 'Email', service_interest: 'Service of interest', marketing_goal: 'Main goal',
  },
};

// Envía el lead por Resend. Nunca lanza — cualquier error se registra por
// consola (visible en `wrangler tail`) y la función retorna normalmente,
// para que el chat del visitante nunca se vea afectado por un fallo aquí.
export async function sendChatLead(
  env: any,
  locale: ChatLocale,
  lead: ChatLead,
  history: ChatHistoryMessage[],
): Promise<void> {
  const apiKey = env?.RESEND_API_KEY;
  if (!apiKey) {
    console.error('Falta RESEND_API_KEY: no se puede enviar el lead del chatbot.');
    return;
  }

  const labels = FIELD_LABELS[locale] ?? FIELD_LABELS.es;
  const fieldOrder: (keyof ChatLead)[] = [
    'name', 'business', 'business_type', 'location', 'phone', 'email', 'service_interest', 'marketing_goal',
  ];
  const presentFields = fieldOrder
    .map((key) => [labels[key], lead[key]] as const)
    .filter(([, value]) => typeof value === 'string' && value.trim().length > 0);

  const ts = new Date().toISOString();
  const localeLabel = locale === 'en' ? 'English' : 'Español';
  const summary = summarizeConversation(history, locale);

  const subject = `Nuevo lead del chatbot — ${lead.business || lead.name || (locale === 'en' ? 'unnamed' : 'sin nombre')}`;

  const textLines = [
    `Timestamp: ${ts}`,
    `Locale: ${localeLabel}`,
    ...presentFields.map(([label, value]) => `${label}: ${value}`),
    `Source: chatbot`,
    '',
    locale === 'en' ? 'Conversation summary:' : 'Resumen de la conversación:',
    summary,
  ];

  const htmlRows = [
    `<tr><td><b>Timestamp</b></td><td>${esc(ts)}</td></tr>`,
    `<tr><td><b>Locale</b></td><td>${esc(localeLabel)}</td></tr>`,
    ...presentFields.map(([label, value]) => `<tr><td><b>${esc(label)}</b></td><td>${esc(String(value))}</td></tr>`),
    `<tr><td><b>Source</b></td><td>chatbot</td></tr>`,
  ].join('');

  const html =
    `<h2>Nuevo lead del chatbot</h2>` +
    `<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif">${htmlRows}</table>` +
    `<p><b>${locale === 'en' ? 'Conversation summary' : 'Resumen de la conversación'}:</b></p>` +
    `<pre style="white-space:pre-wrap;font-family:sans-serif">${esc(summary)}</pre>`;

  try {
    const r = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [site.contact.email],
        ...(lead.email ? { reply_to: lead.email } : {}),
        subject,
        html,
        text: textLines.join('\n'),
      }),
    });
    if (!r.ok) {
      console.error('Resend error (lead del chatbot)', r.status, await r.text().catch(() => ''));
    }
  } catch (e) {
    console.error('Resend fetch falló (lead del chatbot):', e);
  }
}
