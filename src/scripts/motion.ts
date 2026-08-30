// PREMIUM EXPERIENCE UPGRADE V1 — módulo centralizado de movimiento.
//
// Reemplaza ATÓMICAMENTE el antiguo sistema de reveal por IntersectionObserver
// que vivía en Layout.astro (ver git history) por GSAP + ScrollTrigger, y
// añade scroll suave con Lenis sincronizado al ticker de GSAP. Los dos
// sistemas NUNCA corren a la vez: este módulo es la única fuente de verdad.
//
// Redes de seguridad (contenido SIEMPRE visible, sin depender del todo de
// que este script cargue o corra sin errores):
//   1. <noscript> en Layout.astro fuerza opacidad:1 si JS está deshabilitado
//      por completo (este módulo nunca llega a ejecutarse en ese caso).
//   2. @media (prefers-reduced-motion: reduce) en global.css fuerza
//      opacidad:1 con !important, sin importar qué haga este script.
//   3. forceVisible() + un timeout de seguridad aquí abajo: si GSAP lanza una
//      excepción o tarda demasiado, todo el contenido queda visible igual.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const REVEAL_SELECTOR = '.reveal, .stagger-fade > *, .hero-reveal';
const SAFETY_TIMEOUT_MS = 2500;

// Deja todo lo que el sistema de reveal pudiera animar en su estado final
// visible. Idempotente: llamarla después de que GSAP ya animó un elemento no
// tiene efecto visual (ya está en opacity:1 / transform:none).
function forceVisible(): void {
  document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
}

export function initMotion(): void {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Bajo reduced-motion: NO se inicializa Lenis, NO corren animaciones de
  // entrada de GSAP. global.css ya fuerza la visibilidad con !important, pero
  // se refuerza aquí también por si acaso.
  if (prefersReduced) {
    forceVisible();
    return;
  }

  // Red de seguridad: pase lo que pase con GSAP/Lenis (excepción, carga
  // lenta, bug futuro), nada queda invisible para siempre.
  window.setTimeout(forceVisible, SAFETY_TIMEOUT_MS);

  try {
    gsap.registerPlugin(ScrollTrigger);

    // ---- Lenis: una sola instancia, sincronizada con el ticker de GSAP ----
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // ---- Hero: un único timeline restringido (headline + texto + CTA) ----
    // .hero-reveal solo existe en el home (texto + tarjeta de imagen). El
    // segundo elemento (si existe) trae su propia imagen → fade+scale en vez
    // de fade+rise, igual que el resto de imágenes de la sección "reveal".
    const heroEls = gsap.utils.toArray<HTMLElement>('.hero-reveal');
    if (heroEls.length) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.7 } });
      heroEls.forEach((el, i) => {
        const hasImage = !!el.querySelector('img');
        const from = hasImage ? { opacity: 0, scale: 0.96 } : { opacity: 0, y: 24 };
        const to = hasImage ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 };
        tl.fromTo(el, from, to, i === 0 ? 0 : '-=0.45');
      });
    }

    // ---- Encabezados de sección / tarjetas CTA de cierre / imágenes ----
    // .reveal cubre headings, hero de páginas internas (servicio/contacto) y
    // las secciones de CTA de cierre. Si el elemento contiene una imagen se
    // anima con fade+scale en vez de fade+rise (plan de animación aprobado).
    const heroElSet = new Set(heroEls);
    document.querySelectorAll<HTMLElement>('.reveal').forEach((el) => {
      if (heroElSet.has(el)) return; // ya animado en el timeline del hero
      const hasImage = !!el.querySelector('img');
      const from = hasImage ? { opacity: 0, scale: 0.96 } : { opacity: 0, y: 28 };
      const to = hasImage ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 };
      gsap.fromTo(el, from, {
        ...to,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    // ---- Grupos con stagger (tarjetas de servicios, planes, etc.) ----
    // ScrollTrigger.batch anima cada grupo con un stagger corto al entrar en
    // viewport — reemplazo directo del nth-child transition-delay anterior.
    document.querySelectorAll<HTMLElement>('.stagger-fade').forEach((group) => {
      const items = Array.from(group.children) as HTMLElement[];
      if (!items.length) return;
      ScrollTrigger.batch(items, {
        start: 'top 90%',
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 }),
      });
    });
  } catch (e) {
    // Cualquier fallo aquí (excepción de GSAP/Lenis, navegador incompatible,
    // etc.) nunca debe dejar contenido invisible — se revela todo de una vez
    // sin animación y se registra el error para diagnóstico.
    console.error('motion.ts: fallo al inicializar GSAP/Lenis, mostrando contenido sin animación:', e);
    forceVisible();
  }
}
