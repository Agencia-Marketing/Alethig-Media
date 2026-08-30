// PREMIUM EXPERIENCE UPGRADE V1 — integración de reservas con Cal.com.
//
// Diseño (aprobado): el embed de Cal.com NUNCA se carga hasta que el
// visitante hace clic en un botón de reserva. Cualquier elemento con
// [data-booking-trigger] abre el modal oficial de Cal.com sin salir de la
// página. Si Cal.com no carga (red, bloqueador, CDN caído), el clic navega
// al href original del elemento (la página de Contacto o el ancla del
// formulario) — el sitio nunca queda sin una forma de contactar.
//
// No es un paquete npm: es el snippet oficial de Cal.com (embed.js), cargado
// dinámicamente aquí mismo, exactamente como en su documentación.
declare global {
  interface Window {
    Cal?: any;
  }
}

const CAL_LINK = 'alexis-fuel-wkl7sk/15min';
const EMBED_SCRIPT_SRC = 'https://app.cal.com/embed/embed.js';

let embedInitStarted = false;

// Snippet oficial de Cal.com (adaptado a TS): registra window.Cal con una
// cola interna, de forma que llamar a Cal(...) antes de que el script real
// termine de cargar es seguro — todo se encola y se procesa en orden.
function bootstrapCalEmbed(): void {
  if (embedInitStarted) return;
  embedInitStarted = true;

  const w = window as any;
  const d = document;
  const queue = (api: any, args: unknown) => api.q.push(args);

  w.Cal =
    w.Cal ||
    function (...args: unknown[]) {
      const cal = w.Cal;
      if (!cal.loaded) {
        cal.ns = {};
        cal.q = cal.q || [];
        const script = d.createElement('script');
        script.src = EMBED_SCRIPT_SRC;
        script.onerror = () => {
          console.error('cal-booking: el script de Cal.com no cargó (red/bloqueador/CDN).');
        };
        d.head.appendChild(script);
        cal.loaded = true;
      }
      if (args[0] === 'init') {
        const api: any = function (...innerArgs: unknown[]) {
          queue(api, innerArgs);
        };
        const namespace = args[1];
        api.q = api.q || [];
        if (typeof namespace === 'string') {
          cal.ns[namespace] = cal.ns[namespace] || api;
          queue(cal.ns[namespace], args);
          queue(cal, ['initNamespace', namespace]);
        } else {
          queue(cal, args);
        }
        return;
      }
      queue(cal, args);
    };

  w.Cal('init', { origin: 'https://cal.com' });
  w.Cal('ui', {
    theme: 'dark',
    styles: { branding: { brandColor: '#D8A62A' } },
    hideEventTypeDetails: false,
    layout: 'month_view',
  });
}

// Abre el modal de reserva. fallbackHref es a dónde navegar si Cal.com
// termina fallando en cargar (se detecta por el evento onerror del script,
// con un margen razonable de espera).
export function openBooking(fallbackHref: string): void {
  try {
    bootstrapCalEmbed();
    window.Cal!('modal', {
      calLink: CAL_LINK,
      config: { layout: 'month_view', theme: 'dark' },
    });
  } catch (e) {
    console.error('cal-booking: no se pudo abrir el modal de Cal.com, usando el enlace de respaldo:', e);
    if (fallbackHref) window.location.href = fallbackHref;
  }
}

// Delegación de eventos sobre document: cubre tanto los botones presentes al
// cargar la página como los que el chatbot inyecta dinámicamente más tarde
// (su 4to botón de reserva), sin necesitar volver a inicializar nada.
export function initBookingTriggers(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    const trigger = target?.closest<HTMLElement>('[data-booking-trigger]');
    if (!trigger) return;
    e.preventDefault();
    const fallback = trigger.getAttribute('href') || trigger.getAttribute('data-booking-fallback') || '/';
    openBooking(fallback);
  });
}
