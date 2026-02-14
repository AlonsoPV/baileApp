# Landing — Responsive y validación

## Breakpoints

| Ancho   | Nombre   | Uso                          |
|---------|----------|------------------------------|
| 360px   | small    | Móvil muy estrecho           |
| 480px   | mobile   | Móvil estándar               |
| 768px   | tablet   | Tablet portrait / móvil ancho|
| 1024px  | desktop  | Desktop / tablet landscape   |
| 1280px  | large    | Desktop ancho                |
| 1440px+ | xl/ultra | Ultra-wide                   |

## Validación manual (DevTools)

1. Abrir la landing en el navegador.
2. DevTools → Toggle device toolbar (Ctrl+Shift+M).
3. Probar estos anchos:
   - **360** (Galaxy S8, etc.)
   - **390** (iPhone 14)
   - **414** (iPhone Plus)
   - **768** (iPad portrait)
   - **1024** (iPad landscape / desktop)
   - **1280** (desktop)
   - **1440** (ultra-wide)

### Checklist

- [ ] No hay scroll horizontal (overflow-x).
- [ ] CTAs y botones tienen al menos 44px de altura (área táctil).
- [ ] Textos no se cortan; títulos escalan con clamp().
- [ ] Footer: 1 col (móvil), 2 col (tablet), 3 col (desktop).
- [ ] Barra sticky solo visible ≤760px; no tapa contenido (padding-bottom en .landing-body-bg).

## Debug overflow (solo dev)

- **Outline en todos los nodos:** en la consola ejecutar  
  `document.body.setAttribute('data-landing-debug', 'overflow')`  
  para pintar un contorno rojo suave en todos los elementos. Quitar:  
  `document.body.removeAttribute('data-landing-debug')`.

- **Detección automática:** en dev, `useLandingOverflowDebug()` ya está activo en la landing. Los elementos con `scrollWidth > clientWidth` se marcan con la clase `landing-overflow-flagged` y se loguean en consola.

## Panel de breakpoint (solo dev)

En desarrollo, el botón **Breakpoint** (abajo a la derecha) muestra el ancho actual y el nombre del breakpoint. Útil para comprobar 360, 390, 414, 768, 1024, 1280, 1440 sin abrir DevTools.

## Tamaños de vista para screenshots

Si usas herramientas de screenshot o pruebas visuales, estos tamaños son los de referencia:

- 360×800 (móvil pequeño)
- 390×844 (iPhone 14)
- 768×1024 (tablet)
- 1024×768 (desktop)
- 1440×900 (large)
