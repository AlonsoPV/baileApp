# 🚀 Guía de Optimización de Imágenes

## Optimizaciones Implementadas

### 1. **Formato Moderno de Imágenes** ✅
- **AVIF** (mejor compresión, 50% más pequeño que JPEG)
- **WebP** (fallback, soporte amplio)
- **JPEG/PNG** (fallback final)

### 2. **Lazy Loading** ✅
- Todas las imágenes usan `loading="lazy"` excepto las prioritarias
- Las imágenes fuera del viewport no se cargan hasta que son necesarias

### 3. **Compresión Inteligente** ✅
- Quality 80% para balance calidad/tamaño
- Supabase Transform API para optimización automática

### 4. **Async Decoding** ✅
- `decoding="async"` para no bloquear el render

## Optimizaciones Adicionales Recomendadas

### 1. **Prioridad de Carga (fetchpriority)**
```tsx
// Para imágenes críticas (hero, avatar principal)
<ImageWithFallback 
  src={avatarUrl} 
  priority={true}
  // Ahora incluye fetchpriority="high"
/>
```

### 2. **Responsive Images con srcset**
```tsx
// Múltiples tamaños para diferentes pantallas
sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
```

### 3. **Preload de Imágenes Críticas**
```html
<!-- En el <head> de la página -->
<link 
  rel="preload" 
  as="image" 
  href="/optimized-avatar.webp"
  fetchpriority="high"
/>
```

### 4. **Thumbnails Pequeños para Grids**
- Usar quality: 60 para thumbnails
- Usar width reducido (ej: 200px) para miniaturas

### 5. **Caché del Navegador**
- Headers HTTP correctos en Supabase Storage
- Cache-Control: public, max-age=31536000, immutable

### 6. **CDN y Edge Locations**
- Supabase Storage ya usa CDN
- Considerar Cloudflare para mejor distribución geográfica

### 7. **Placeholder Blur (LQIP)**
- Generar miniaturas de 20-40px
- Mostrar blur mientras carga la imagen real

### 8. **Intersection Observer**
- Para galerías grandes, cargar solo imágenes visibles
- Implementado parcialmente en GalleryGrid

### 9. **Optimización de Calidad por Contexto**
- Avatares pequeños: quality 70, width 100-200px
- Hero banners: quality 85, width según breakpoint
- Productos: quality 80, responsive widths
- Thumbnails: quality 60, width 200px

### 10. **Preconnect a Supabase**
```html
<link rel="preconnect" href="https://xjagwppplovcqmztcymd.supabase.co" />
<link rel="dns-prefetch" href="https://xjagwppplovcqmztcymd.supabase.co" />
```

## Implementaciones Específicas

### Imágenes Prioritarias (Hero, Avatar Principal)
```tsx
<ImageWithFallback
  src={avatarUrl}
  priority={true}
  width={250}
  height={250}
  sizes="(max-width: 768px) 50vw, 300px"
/>
```

### Imágenes en Cards/Carousels
```tsx
<ImageWithFallback
  src={imageUrl}
  priority={false} // Lazy por defecto
  width={360}
  sizes="(max-width: 768px) 100vw, 360px"
/>
```

### Thumbnails
```tsx
<ImageWithFallback
  src={thumbnailUrl}
  width={200}
  // Calidad reducida automáticamente
/>
```

## Métricas Objetivo

- **LCP (Largest Contentful Paint)**: < 2.5s
- **Tamaño de imagen**: < 200KB por imagen
- **Formato moderno**: 80%+ imágenes en AVIF/WebP
- **Lazy loading**: 100% imágenes no críticas

## Herramientas de Medición

- Chrome DevTools Lighthouse
- WebPageTest
- Chrome Performance Tab
- Supabase Storage Analytics

## Checklist de Optimización

- [x] Formato moderno (AVIF/WebP)
- [x] Lazy loading
- [x] Async decoding
- [x] Compresión (quality 80)
- [x] fetchpriority en imágenes críticas (priority={true})
- [x] Responsive srcset múltiples tamaños (responsive={true})
- [x] Calidad adaptativa según tamaño de imagen
- [x] Preconnect a Supabase CDN
- [ ] Preload imágenes hero (manual)
- [ ] Thumbnails optimizados (quality reducido)
- [ ] Placeholder blur (futuro)

## Ejemplos de Uso

### Imagen Crítica (Avatar Principal)
```tsx
<ImageWithFallback
  src={avatarUrl}
  alt="Avatar"
  priority={true}  // Carga inmediata, fetchpriority="high"
  width={250}
  height={250}
  sizes="(max-width: 768px) 50vw, 250px"
/>
```

### Imagen Responsive (Productos, Cards)
```tsx
<ImageWithFallback
  src={imageUrl}
  alt="Producto"
  priority={false}  // Lazy loading
  width={360}
  responsive={true}  // Genera srcset con múltiples tamaños
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
/>
```

### Thumbnail Pequeño (Grid, Miniaturas)
```tsx
<ImageWithFallback
  src={thumbnailUrl}
  alt="Miniatura"
  width={200}
  quality={60}  // Calidad reducida para thumbnails
  sizes="200px"
/>
```

### Imagen con Calidad Personalizada
```tsx
<ImageWithFallback
  src={heroImage}
  alt="Banner"
  priority={true}
  width={1920}
  quality={85}  // Mayor calidad para banners
  sizes="100vw"
/>
```

