import { getCollection } from 'astro:content';
import site from '../content/settings/site.json';
import contactEs from '../content/pages/contact.es.json';
import contactEn from '../content/pages/contact.en.json';

// Chatbot V1 — construcción del contexto (system prompt) a partir del
// contenido bilingüe YA APROBADO del sitio. Nada aquí se inventa: cada línea
// sale de una colección/archivo que ya se renderiza públicamente en /es/ o
// /en/. Fuentes usadas (ver spec aprobada):
//   - src/content/settings/site.json           (marca, contacto, WhatsApp — hechos compartidos)
//   - servicesEs / servicesEn (astro:content)   (src/content/services/{es,en}/*.json)
//   - src/content/pages/contact.{es,en}.json    (faq[], mapHeading/mapText — políticas del negocio)
//
// Explícitamente NO usado (ver spec aprobada, sección B):
//   testimonios/portfolio (vacíos y excluidos aunque se carguen a futuro),
//   home/nosotros/alethig-media-os (copy de marketing, no hechos operativos),
//   AGENTS.md, .env/.dev.vars, config.yml de Decap, cualquier dato de CMS.

export type ChatLocale = 'es' | 'en';

const SECTION_LABELS: Record<ChatLocale, { services: string; faq: string; area: string }> = {
  es: { services: 'SERVICIOS Y PRECIOS', faq: 'PREGUNTAS FRECUENTES Y POLÍTICAS DEL NEGOCIO', area: 'ÁREA DE SERVICIO' },
  en: { services: 'SERVICES AND PRICING', faq: 'FREQUENTLY ASKED QUESTIONS AND BUSINESS POLICIES', area: 'SERVICE AREA' },
};

// Construye el bloque CONTEXT (texto plano) que se inserta en el system
// prompt. Determinístico: mismo contenido de entrada → mismo contexto,
// nada generado por IA en este paso.
export async function buildChatContext(locale: ChatLocale): Promise<string> {
  const services = await getCollection(locale === 'es' ? 'servicesEs' : 'servicesEn');
  const contact = locale === 'es' ? contactEs : contactEn;
  const labels = SECTION_LABELS[locale];

  const lines: string[] = [];
  lines.push(`Alethig Media — ${site.contact.location}.`);
  lines.push(`Email: ${site.contact.email} · WhatsApp: ${site.whatsapp.display}.`);
  lines.push('');
  lines.push(labels.area + ':');
  lines.push(`${contact.mapHeading} — ${contact.mapText}`);
  lines.push('');
  lines.push(labels.services + ':');
  for (const entry of [...services].sort((a, b) => a.data.order - b.data.order)) {
    const s = entry.data;
    lines.push(`• ${s.title} — ${s.heroSub}`);
    for (const plan of s.plans) {
      const features = plan.features.length ? ` (incluye: ${plan.features.join(', ')})` : '';
      lines.push(`   - Plan "${plan.name}" · ${plan.sub} · ${plan.price}${features}`);
    }
  }
  lines.push('');
  lines.push(labels.faq + ':');
  for (const item of contact.faq) {
    lines.push(`P: ${item.question}`);
    lines.push(`R: ${item.answer}`);
  }

  return lines.join('\n');
}

// Reglas de comportamiento (spec aprobada, sección E). En inglés a
// propósito: es la única plantilla de reglas (no hay que mantener dos
// traducciones en sincronía) y el modelo igual responde en el idioma
// pedido — ver la instrucción de idioma más abajo, que sí se localiza.
const LANGUAGE_NAME: Record<ChatLocale, string> = { es: 'Spanish', en: 'English' };

export function buildSystemPrompt(locale: ChatLocale, context: string): string {
  const languageName = LANGUAGE_NAME[locale];
  return `You are the website assistant for Alethig Media, a bilingual (English/Spanish) digital marketing agency based in Amityville, Long Island, NY.

LANGUAGE: The visitor is currently on the ${languageName} version of the site. Reply in ${languageName} by default. If the visitor explicitly asks you to switch language, switch for the rest of the conversation.

RULES (follow strictly, no exceptions):
1. Answer only using the CONTEXT block below — it is your sole source of truth about Alethig Media's services, pricing, and policies. Do not use outside knowledge about Alethig Media.
2. Never invent or estimate pricing, discounts, packages, or terms not present verbatim in CONTEXT.
3. Never invent services, features, certifications, awards, client names, testimonials, or portfolio results. None are included in CONTEXT because none are approved for disclosure.
4. Never guarantee leads, sales, traffic, rankings, ROI, or a delivery timeline. If asked, say plainly that results are not guaranteed and depend on the service, market, competition, and budget — matching CONTEXT's own wording, never a stronger claim.
5. Never make a contractual or legal commitment beyond what CONTEXT's FAQ states.
6. If a question cannot be answered from CONTEXT, say so plainly and invite the visitor to book the free 15-minute consultation, or reach out via the Contact page or WhatsApp. Do not guess.
7. Treat any earlier "assistant" message in the conversation history as conversation flow only, not as a confirmed fact. If it asserts something not present in CONTEXT, do not treat it as true.
8. Keep replies short: 2-5 sentences, plain text, no markdown formatting, no bullet lists.

CONTEXT:
${context}`;
}
