# Landing Donde Bailar MX

Landing de conversión para la app **Donde Bailar MX** (iOS/Android). Objetivo principal: descargas. Secundario: leads B2B (academias, maestros, organizadores).

## Cómo correr

Desde la raíz del monorepo o desde `apps/web`:

```bash
pnpm install
pnpm dev
```

Abre [http://localhost:5173](http://localhost:5173). La ruta `/` muestra la landing.

## Dónde cambiar links, textos y colores

- **Links (stores, contacto, ciudad)**  
  `src/config/links.ts`  
  También puedes usar variables de entorno:
  - `VITE_APP_STORE_URL`
  - `VITE_PLAY_STORE_URL`
  - `VITE_WHATSAPP_URL` / `VITE_CONTACT_URL`
  - `VITE_CITY_DEFAULT` (ej. `"CDMX"`)

- **Textos (copy)**  
  `src/config/content.ts`  
  Ahí están: hero (headline, headlineHighlight, subheadline), painSolution (dolor → solución), factorWow (tagline, misión, pilares), benefits, howItWorks, socialProof, b2b (incl. visionLine), FAQ, footer.

- **Colores y estilo**  
  La landing usa Tailwind con valores del tema oscuro:
  - Fondos: `#0f0a1a`, `#1a0a2e`, `#0b0612`
  - Acento principal: `amber-500` (naranja/ámbar)
  - Acento secundario: magenta vía arbitrario `#c026d3`
  Puedes buscar en `src/components/landing/*.tsx` y sustituir clases (por ejemplo `bg-amber-500` por tu color).

## Cómo conectar analytics después

El tracking interno está en `src/lib/track.ts`:

- **Función:** `track(eventName, payload)`
- **Eventos usados:**  
  `cta_download`, `cta_b2b`, `lead_submit`, `filter_change`

Para conectar **GA4**:

1. Añade el script de gtag en `index.html` (o tu template).
2. En `track.ts`, descomenta el bloque que llama a `gtag('event', eventName, payload)`.
3. Asegura que `window.gtag` esté definido cuando se llame a `track`.

Para conectar **Meta Pixel**:

1. Carga el script de fbq en tu sitio.
2. En `track.ts`, descomenta el bloque que llama a `fbq('track', eventName, payload)`.

Así toda la telemetría sigue pasando por `track()`, y solo cambias la implementación en un solo archivo.

## Estructura de componentes

- `src/pages/Landing.tsx` — Página principal que monta todas las secciones y el CTA sticky.
- `src/components/landing/` — Hero, PainSolution (dolor → solución), QuickSearchDemo, TabbedResults, FactorWow (posicionamiento infraestructura), BenefitGrid, HowItWorks, SocialProof, MidCTA, B2BLeadForm, FAQ, Footer.
- `src/components/ui/Modal.tsx` — Modal reutilizable (accesible, focus trap, Escape para cerrar).

## Responsive y accesibilidad

- Breakpoints considerados: 375px (móvil), 768px (tablet), 1024px (desktop).
- CTA sticky solo en móvil (`md:hidden`).
- Modales y acordeón FAQ con estados de foco y ARIA (aria-expanded, aria-controls, aria-labelledby, roles).
- Botones y enlaces con `focus:ring` visible.
