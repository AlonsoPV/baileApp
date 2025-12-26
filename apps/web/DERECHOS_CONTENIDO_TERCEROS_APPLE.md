# 📄 Derechos sobre Contenido de Terceros - Apple App Store Connect

## Análisis de Contenido de Terceros en la App

### ✅ Respuesta para el Formulario de Apple

**"¿Tu app contiene, muestra o accede a contenido de terceros?"**

**Respuesta:** ✅ **"Sí, contiene, muestra o accede a contenido de terceros y tengo los derechos necesarios"**

---

## 📋 Detalle del Contenido de Terceros

### 1. **Videos Embebidos de YouTube y Vimeo**

**Tipo:** Contenido embebido de plataformas de terceros

**Ubicación en el código:**
- `apps/web/src/components/competitionGroups/CompetitionGroupDetail.tsx` (líneas 1077-1104)
- La app permite a los usuarios proporcionar URLs de videos de YouTube o Vimeo para embeberse en perfiles y grupos de competencia

**Implementación:**
```typescript
// La app detecta si la URL es de YouTube o Vimeo y la embebe usando iframes
{group.promo_video_url.includes('youtube.com') || group.promo_video_url.includes('youtu.be') ? (
  <iframe src={group.promo_video_url.replace('watch?v=', 'embed/')} />
) : group.promo_video_url.includes('vimeo.com') ? (
  <iframe src={group.promo_video_url.replace('vimeo.com/', 'player.vimeo.com/video/')} />
) : (
  <video src={group.promo_video_url} />
)}
```

**Derechos:**
- ✅ YouTube y Vimeo permiten el embedding de videos a través de sus APIs y términos de servicio
- ✅ Los usuarios que proporcionan las URLs son responsables de tener los derechos sobre el contenido que suben
- ✅ La app actúa como plataforma que permite a los usuarios compartir contenido que ellos mismos tienen derecho a compartir

---

### 2. **Enlaces a Redes Sociales**

**Tipo:** Enlaces externos a plataformas de terceros

**Ubicación:**
- Perfiles de usuarios, maestros, academias, organizadores y marcas
- Campos: Instagram, TikTok, YouTube, Facebook, WhatsApp

**Implementación:**
- La app muestra enlaces (no embebe contenido) a perfiles de redes sociales
- Los usuarios proporcionan sus propios enlaces a sus perfiles sociales

**Derechos:**
- ✅ Los usuarios son dueños de sus propios perfiles de redes sociales
- ✅ La app solo muestra enlaces, no reproduce contenido de terceros
- ✅ Los usuarios tienen derecho a compartir enlaces a sus propios perfiles

---

### 3. **Contenido Generado por Usuarios (UGC)**

**Tipo:** Contenido subido por usuarios de la app

**Incluye:**
- Fotos y videos subidos por usuarios
- Biografías y descripciones escritas por usuarios
- Eventos, clases y productos creados por usuarios
- Reseñas y comentarios de usuarios

**Derechos:**
- ✅ Los usuarios son responsables de tener los derechos sobre el contenido que suben
- ✅ La app incluye términos de servicio que establecen que los usuarios deben tener derechos sobre el contenido que comparten
- ✅ La app tiene políticas de moderación de contenido (ver `LegalScreen.tsx` - Sección 5: Moderación de contenido)

---

## 🔒 Medidas de Protección de Derechos

### 1. **Términos de Servicio y Políticas**

La app incluye:
- **Aviso de Privacidad** (`/aviso-de-privacidad`)
- **Políticas de moderación de contenido** que permiten eliminar contenido que viole derechos de terceros
- **Términos que establecen** que los usuarios son responsables del contenido que comparten

### 2. **Moderación de Contenido**

Según el Aviso de Privacidad (Sección 5):
- Los administradores pueden revisar y eliminar contenido que:
  - Viole derechos de terceros
  - Sea inapropiado o viole términos de servicio
  - Incite violencia o falte a la moral

### 3. **Responsabilidad del Usuario**

- Los usuarios deben garantizar que tienen derechos sobre el contenido que suben
- La app actúa como plataforma intermediaria (similar a redes sociales)
- Los usuarios son responsables de cumplir con derechos de autor y propiedad intelectual

---

## ✅ Justificación de Derechos

### Para Videos Embebidos (YouTube/Vimeo):

1. **YouTube:**
   - YouTube permite el embedding de videos públicos a través de iframes
   - Los términos de servicio de YouTube permiten compartir videos mediante embedding
   - Los usuarios que proporcionan URLs de YouTube son responsables de tener derechos sobre esos videos

2. **Vimeo:**
   - Vimeo permite el embedding de videos según sus términos de servicio
   - Los usuarios que proporcionan URLs de Vimeo son responsables de tener derechos sobre esos videos

3. **Responsabilidad:**
   - La app no aloja ni reproduce directamente el contenido de terceros
   - La app solo proporciona un iframe que carga contenido desde YouTube/Vimeo
   - YouTube/Vimeo manejan la reproducción y los derechos de su propio contenido

### Para Contenido Generado por Usuarios:

1. **Modelo de Plataforma:**
   - La app funciona como plataforma (similar a Instagram, Facebook, etc.)
   - Los usuarios son responsables del contenido que suben
   - La app tiene políticas y herramientas de moderación

2. **Términos de Servicio:**
   - Los usuarios aceptan términos que establecen su responsabilidad sobre el contenido
   - Los usuarios garantizan que tienen derechos sobre el contenido que comparten

3. **Cumplimiento Legal:**
   - La app cumple con leyes de protección de derechos de autor (DMCA, etc.)
   - La app tiene capacidad de eliminar contenido que viole derechos de terceros

---

## 📝 Declaración para Apple

**"Sí, contiene, muestra o accede a contenido de terceros y tengo los derechos necesarios"**

**Justificación:**

1. **Videos embebidos:** La app permite embeberse videos de YouTube/Vimeo proporcionados por usuarios. YouTube y Vimeo permiten el embedding a través de sus términos de servicio. Los usuarios son responsables de tener derechos sobre el contenido que comparten.

2. **Contenido generado por usuarios:** La app funciona como plataforma donde los usuarios suben su propio contenido. Los usuarios son responsables de tener derechos sobre el contenido que comparten, y la app incluye términos de servicio y políticas de moderación que protegen los derechos de terceros.

3. **Enlaces a redes sociales:** La app muestra enlaces a perfiles de redes sociales de usuarios, que son dueños de sus propios perfiles.

4. **Medidas de protección:** La app incluye políticas de moderación de contenido y capacidad de eliminar contenido que viole derechos de terceros, cumpliendo con leyes de protección de derechos de autor.

---

## ⚠️ Nota Importante

Aunque la app permite contenido de terceros (videos embebidos, UGC), la responsabilidad principal recae en:

1. **Los usuarios** que proporcionan el contenido
2. **Las plataformas de terceros** (YouTube, Vimeo) que alojan el contenido embebido
3. **La app** actúa como plataforma intermediaria con políticas de moderación

Esta es una estructura estándar para plataformas de contenido generado por usuarios (similar a Instagram, Facebook, TikTok, etc.).

---

**Última actualización:** Enero 2025  
**Versión del documento:** 1.0

