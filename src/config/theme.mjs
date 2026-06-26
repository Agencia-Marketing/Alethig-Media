/* ============================================================
   TEMA DEL SITIO — única fuente de marca (Alethig Media · Navy-Gold)
   ------------------------------------------------------------
   Esto es LO ÚNICO que cambias al crear un sitio nuevo:
   colores, tipografías y logo. No toques el markup ni global.css.
   Paleta oficial Alethig Media: navy #000326 (PANTONE 296C) +
   dorado #D8A62A (PANTONE 2007C). Fuentes: Nord (títulos) + Montserrat.
   ============================================================ */

// --- Colores (hex). Las claves son los nombres de clase Tailwind:
//     bg-bg-void, text-accent, text-text-secondary, from-accent, etc.
export const colors = {
  'bg-void':        '#000326',  // navy oficial (fondo)
  'bg-depth':       '#060A33',  // navy elevado (secciones)
  accent:           '#D8A62A',  // dorado oficial
  'accent-2':       '#E9C46A',  // dorado claro (degradados/hover)
  'text-primary':   '#F5F1E6',  // blanco cálido
  'text-secondary': '#A7AEC9',  // azul-gris legible
  'text-dim':       '#5C638A',
  'grad-indigo':    '#1B2A6B',  // azul profundo
  'grad-violet':    '#8C6A12',  // ámbar oscuro
  'grad-pink':      '#E9C46A',  // dorado claro
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
