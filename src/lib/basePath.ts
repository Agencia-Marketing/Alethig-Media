/**
 * Prefija un href interno con un base path de idioma (p.ej. "/es"),
 * dejando intactas las URLs absolutas (http:, https:, mailto:, tel:,
 * wa.me…) y los anclajes de la misma página ("#..."). Así el contenido
 * compartido (nav, footer, CTAs con href como "/contacto" o "/#servicios")
 * no se duplica por idioma — cada árbol de rutas simplemente prefija los
 * mismos valores al renderizar.
 *
 * withBase('/es', '/contacto')   -> '/es/contacto'
 * withBase('/es', '/#servicios') -> '/es/#servicios'
 * withBase('/es', '#historia')   -> '#historia'        (ancla misma página)
 * withBase('/es', 'https://…')   -> 'https://…'          (URL absoluta)
 * withBase('', '/contacto')      -> '/contacto'          (sin prefijo = hoy)
 */
export function withBase(base: string, href: string): string {
  if (!base || !href) return href;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return href;
  if (href.startsWith('#')) return href;
  return base + href;
}
