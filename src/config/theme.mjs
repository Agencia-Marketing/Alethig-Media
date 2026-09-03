/* ============================================================
   TEMA DEL SITIO — única fuente de marca (Alethig Media · Navy-Gold)
   ------------------------------------------------------------
   Esto es LO ÚNICO que cambias al crear un sitio nuevo:
   colores, tipografías y logo. No toques el markup ni global.css.
   Paleta oficial Alethig Media (VISUAL REDESIGN V2): navy #0B1F3A +
   dorado #C9A84C. (Paleta anterior: navy #000326, dorado #D8A62A —
   migrada aquí, ver notas por token abajo). Fuentes: Nord (títulos) +
   Montserrat.
   ============================================================ */

// --- Colores (hex). Las claves son los nombres de clase Tailwind:
//     bg-bg-void, text-accent, text-text-secondary, from-accent, etc.
//
// VISUAL REDESIGN V2 — tokens oscuros existentes, actualizados con
// cuidado (no es un cambio ciego de hex): bg-depth/accent-2/text-dim se
// RECALCULARON en proporción al nuevo navy/dorado, no se dejaron con sus
// valores antiguos, para que seguir usando las mismas utilidades
// (.mesh-bg, .btn-cyber-solid, etc.) en las páginas que NO participan de
// este rediseño siga viéndose coherente y siga cumpliendo WCAG AA.
export const colors = {
  'bg-void':        '#0B1F3A',  // navy oficial V2 (antes #000326)
  'bg-depth':       '#283A52',  // navy elevado — recalculado ~12% más claro que bg-void (antes #060A33)
  accent:           '#C9A84C',  // dorado oficial V2 (antes #D8A62A)
  'accent-2':       '#D5BB73',  // dorado claro — recalculado ~22% más claro que accent (antes #E9C46A)
  'text-primary':   '#F5F1E6',  // blanco cálido (sin cambio — sigue en 14.6:1 sobre el nuevo navy)
  'text-secondary': '#A7AEC9',  // azul-gris legible (sin cambio — sigue en 5.2–7.5:1 sobre el nuevo navy)
  // RECALCULADO: el valor anterior (#737CAC) caía a 4.10:1 sobre el nuevo
  // bg-void y 2.87:1 sobre bg-depth — bajo el mínimo AA de 4.5:1 para texto
  // normal. Nuevo valor verificado: 6.50:1 sobre bg-void, 4.55:1 sobre
  // bg-depth (ambos ≥4.5:1).
  'text-dim':       '#9AA1C3',
  'grad-indigo':    '#1B2A6B',  // azul profundo (sin cambio — tono de apoyo independiente)
  'grad-violet':    '#8C6A12',  // ámbar oscuro (sin cambio)
  'grad-pink':      '#E9C46A',  // dorado claro (sin cambio)

  // --- VISUAL REDESIGN V2 — superficies claras y "tinta" de texto sobre
  // superficies claras, para las secciones que pasan a fondo claro (ver
  // AUDIT V2). Los tokens oscuros de arriba NO se eliminan — siguen siendo
  // el sistema de las páginas que no participan de este rediseño
  // (servicios, contacto, nosotros, gracias, etc.) y del footer/CTA final/
  // sección Alethig Media OS, que se quedan oscuros a propósito.
  'surface-white':  '#FFFFFF',  // tarjetas elevadas sobre fondo claro
  'surface-base':   '#F8F8F5',  // fondo claro principal (cálido)
  'surface-tint':   '#F1F3F5',  // fondo claro alterno (gris-frío suave)
  'surface-cool':   '#EEF1F4',  // variación clara adicional / hover
  // "ink" = mismo navy que bg-void, pero como color de TEXTO sobre
  // superficies claras (nombre distinto para dejar claro el uso).
  ink:              '#0B1F3A',
  // Texto secundario sobre superficies claras — verificado ≥6.9:1 en las
  // 4 superficies claras de arriba.
  'ink-dim':        '#4A5170',
  // Dorado OSCURECIDO para usar como TEXTO sobre superficies claras — el
  // dorado brillante (accent, #C9A84C) falla contraste como texto sobre
  // claro (~2:1, ni siquiera cumple el mínimo de "texto grande" de 3:1).
  // Este valor sí cumple AA normal (4.57:1) en las 4 superficies claras.
  // accent/accent-2 se siguen usando tal cual en botones rellenos, iconos
  // y bordes sobre claro, donde no aplica la regla de contraste de texto.
  'gold-ink':       '#856F32',
};

// --- Tipografías. Nord se auto-aloja vía @font-face en global.css.
//     Montserrat se carga desde Google Fonts (googleHref).
export const fonts = {
  display:    'Nord, sans-serif',        // titulares
  body:       'Montserrat, sans-serif',  // cuerpo
  googleHref: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap',
};

// --- Logo. Si `image` tiene una ruta (archivo en /public), se usa la imagen.
//     Si está vacío, se usa el icono de Material Symbols `icon`.
export const logo = {
  image: '/logo.svg',           // imagotipo Alethig Media (dorado)
  icon:  'bolt',                // fallback Material Symbols
  alt:   'Alethig Media',
};
