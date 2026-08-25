import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Servicios con layout uniforme (features + planes). Las páginas bespoke
// (agentes-ia, embudos-venta, creadores-ugc) son páginas propias y NO van aquí.
//
// Contenido bilingüe: cada idioma vive en su propia carpeta
// (src/content/services/es/, src/content/services/en/), una colección
// por idioma, mismo esquema. El id de la colección (nombre de archivo)
// se mantiene igual entre idiomas a propósito — así se puede emparejar
// un servicio ES con su equivalente EN por id, sin depender de la URL.
//
// urlSlug: solo lo usa el inglés. La URL pública en inglés
// (/en/services/<urlSlug>) es distinta del id/nombre de archivo
// (que se conserva en español, p.ej. "desarrollo-web", para el
// emparejamiento); en español la URL pública SÍ es el id directamente,
// por eso el campo queda opcional y sin uso ahí.
const serviceSchema = z.object({
  title: z.string(),
  urlSlug: z.string().optional(),
  metaDescription: z.string(),
  order: z.number(),
  icon: z.string(),
  heroHeading: z.string(),
  heroHighlight: z.string(),
  heroSub: z.string(),
  heroCtaLabel: z.string(),
  image: z.string(),
  imageAlt: z.string(),
  features: z.array(z.object({ icon: z.string(), title: z.string(), desc: z.string() })),
  plans: z.array(z.object({
    name: z.string(), sub: z.string(), price: z.string(), featured: z.boolean(),
    features: z.array(z.string()),
    // Clave de grupo opcional (p.ej. "package"/"individual") para separar
    // visualmente un paquete principal de ítems sueltos — ver planGroups.
    // Sin esto, todos los planes se renderizan en una sola grilla (como hoy).
    group: z.string().optional(),
  })),
  // Grupos visuales opcionales para la sección de precios (P2C-1). Si está
  // presente, la plantilla agrupa `plans` por su campo `group` bajo cada
  // título; si no está, renderiza la grilla plana de siempre. 100%
  // data-driven: ningún servicio necesita lógica especial en la plantilla.
  planGroups: z.array(z.object({ key: z.string(), label: z.string() })).optional(),
  // Reemplaza el titular genérico "Planes y precios"/"Plans and pricing"
  // cuando el encuadre de precios de un servicio necesita ser más específico
  // (p.ej. "Elige tu canal de publicidad"). Opcional; sin esto, el titular
  // genérico se mantiene igual que antes.
  plansHeading: z.string().optional(),
  ctaHeading: z.string(),
  ctaText: z.string(),
  ctaButtonLabel: z.string(),
  ctaButtonIcon: z.string(),
});

const servicesEs = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/services/es' }),
  schema: serviceSchema,
});

// Registrada para que el contenido en inglés se valide en cada build
// (npm run build revisa su esquema aunque ninguna página la use todavía).
// Las rutas /en/ que la consuman llegan en una fase aparte.
const servicesEn = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/services/en' }),
  schema: serviceSchema,
});

export const collections = { servicesEs, servicesEn };
