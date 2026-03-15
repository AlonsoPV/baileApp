# Auditoría y optimización Landing Donde Bailar

## 1. Problemas detectados

### Mensaje y claridad
- El hero mezcla "ENCUENTRA DÓNDE BAILAR HOY MISMO" con copy de contenido (flyers, algoritmo); el valor principal no es inmediato para quien solo busca "dónde bailar".
- El CTA secundario "¿Dónde Bailar?" es confuso (parece pregunta, no acción).
- painSolution usa lenguaje de infraestructura/industria ("infraestructura", "sistema operativo") antes de afianzar el beneficio emocional para el usuario final.

### SEO on-page
- La landing no inyecta SeoHead específico: se usa el default del sitio; el title/description no están optimizados para la home.
- Falta jerarquía H1 única y clara; el H1 actual está bien pero el resto de H2 no siempre reflejan keywords (eventos de baile, clases de baile, etc.).
- No hay schema markup (SoftwareApplication, Organization) para enriquecer el snippet en buscadores.

### Estructura y conversión
- B2BLeadForm aparece muy arriba (justo después del Hero), puede distraer al usuario que busca descargar.
- Social proof y métricas están comentados; se pierde credibilidad.
- Algunos overlines son muy "de producto" (Factor WOW, Retención) y poco escaneables para nuevo visitante.

### Técnico y UX
- Imagen del nav (icon) tiene `alt=""`; debería ser descriptivo o decorativo explícito.
- No hay mockup de app en Hero (solo texto); la solicitud era imagen o mockup para reforzar descarga.
- Sticky bar solo móvil está bien; asegurar que los CTAs sean consistentes en todo el flujo.

---

## 2. Propuesta de mejoras

- **Hero:** Mensaje único: "Encuentra dónde bailar cerca de ti" + subtítulo orientado a beneficio (eventos, clases, academias, maestros). CTA principal "Descargar gratis" y secundario "Soy academia o maestro".
- **Problema:** Sección clara "¿No sabes dónde bailar hoy?" con dolor (flyers perdidos, info dispersa) y enlace emocional.
- **Solución:** Una sola sección que posicione la app como la guía (todo en un lugar, filtros, información real).
- **Funcionalidades:** Mantener BenefitGrid con copy orientado a beneficios y keywords (eventos de baile, clases, salsa, bachata, academias).
- **Cómo funciona:** 3 pasos (Descargar → Filtrar → Bailar) ya existentes; mantener y reforzar.
- **Social proof:** Reactivar SocialProof o variante breve (comunidad, testimonios o cifras).
- **CTA final:** Sección clara "Descarga la app" antes del footer.
- **SEO:** Meta title/description específicos para la home, keywords en H2/H3, alt en imágenes, JSON-LD SoftwareApplication.
- **CRO:** Menos fricción (un solo CTA principal visible), microcopy que motive ("Gratis · Sin spam"), botones con mismo label en nav y sticky.

---

## 3. Nueva estructura de la landing

1. **Hero** – Título principal, subtítulo beneficio, CTA Descargar + CTA B2B, microcopy, opcional mockup.
2. **Problema** – "¿No sabes dónde bailar hoy?" + dolores (flyers, historias, info dispersa).
3. **Solución** – "Todo en un solo lugar" / valor de la app (eventos, clases, filtros, información real).
4. **Funcionalidades** – Descubre eventos, encuentra clases, explora academias, conecta con maestros/comunidad (BenefitGrid).
5. **Cómo funciona** – 3 pasos (HowItWorks).
6. **B2B** – Para academias y maestros (formulario o CTA).
7. **Social proof** – Comunidad / testimonios / métricas (si se reactiva).
8. **CTA final** – "Descarga la app" (MidCTA).
9. **FAQ** – Preguntas frecuentes.
10. **Footer** – Enlaces, contacto, CTA descarga.

---

## 4. Copywriting optimizado (resumen)

- **Hero H1:** "Encuentra dónde bailar cerca de ti" (o variante con "hoy").
- **Hero sub:** "Eventos, clases, academias y maestros. Filtra por ritmo, zona y fecha — salsa, bachata y más."
- **Problema:** "¿No sabes dónde bailar hoy?" / "Flyers perdidos, historias que se borran... La guía que necesitas."
- **Solución:** "Todo en un solo lugar. Información real, filtros por ritmo y zona, actualizado a diario."
- **CTAs:** "Descargar gratis" (primario), "Soy academia o maestro" (secundario).
- **Microcopy:** "Gratis · Sin spam · Descarga en segundos".

---

## 5. Mejoras SEO implementadas

- SeoHead en la página Landing con title, description, image, url y keywords para la home.
- Title: "Donde Bailar | Encuentra eventos, clases y academias de baile cerca de ti".
- Description: Incluye "donde bailar", "clases de baile", "eventos de baile", "salsa", "bachata", "academias", "CDMX"/"México".
- Keywords: donde bailar, clases de baile, eventos de baile, salsa, bachata, academias de baile, lugares para bailar, maestros de baile.
- JSON-LD SoftwareApplication opcional para app (nombre, descripción, URL de descarga).
- Headings: H1 único en Hero; H2 en cada sección con sentido para SEO.

---

## 6. Cambios de código realizados

- `pages/Landing.tsx`: Añadido SeoHead con meta optimizados; opcional JSON-LD.
- `config/content.ts`: Nuevo copy para hero, painSolution y referencias a "dónde bailar", beneficios y keywords.
- `components/landing/Hero.tsx`: Uso del nuevo headline y subtítulo desde content; CTA "Descargar gratis".
- `components/landing/PainSolution.tsx`: Headline problema "¿No sabes dónde bailar hoy?" desde content.
- `lib/seoConfig.ts`: Ajustes en default o sección landing para title/description/keywords de la home.
- `components/landing/LandingNav.tsx`: Alt text en imagen del logo (decorativo o "Donde Bailar").
- Orden de secciones en Landing: Hero → B2B (o después de solución) → PainSolution → FactorWow → DecisionNotDiscovery → BenefitGrid → HowItWorks → MidCTA → FAQ → Footer.
