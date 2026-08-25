import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Servicios con layout uniforme (features + planes). Las páginas bespoke
// (agentes-ia, embudos-venta, creadores-ugc) son páginas propias y NO van aquí.
//
// Contenido bilingüe: cada idioma vive en su propia carpeta
// (src/content/services/es/, src/content/services/en/ cuando exista),
// una colección por idioma, mismo esquema. Fase 1 solo define la
// colección en español — servicesEn se agrega junto con las rutas /en/.
const serviceSchema = z.object({
  title: z.string(),
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
  })),
  ctaHeading: z.string(),
  ctaText: z.string(),
  ctaButtonLabel: z.string(),
  ctaButtonIcon: z.string(),
});

const servicesEs = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/services/es' }),
  schema: serviceSchema,
});

export const collections = { servicesEs };
