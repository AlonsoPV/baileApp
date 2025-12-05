# 📊 Capacidad Actual de la Plataforma - Análisis de Usuarios Soportados

## 🎯 Resumen Ejecutivo

La capacidad de usuarios que puede soportar la plataforma **depende principalmente del plan de Supabase** que estés utilizando. A continuación, un análisis detallado según cada plan.

---

## 📋 Límites por Plan de Supabase

### **🆓 Plan FREE (Gratuito)**

**Límites principales:**
- **Base de datos:** 500 MB
- **API Requests:** 50,000/mes (≈1,667/día)
- **Storage:** 1 GB
- **Bandwidth:** 2 GB/mes
- **Edge Functions:** 500,000 invocaciones/mes
- **Emails:** ~3-4 emails/hora (sin SMTP personalizado)
- **Concurrent connections:** Limitado

**Capacidad estimada de usuarios:**
- **Usuarios registrados:** ~500-1,000 usuarios
- **Usuarios activos diarios:** ~50-100 usuarios
- **Usuarios simultáneos:** ~10-20 usuarios

**⚠️ Limitaciones críticas:**
- Rate limit de emails muy bajo (3-4/hora)
- Base de datos pequeña (500 MB)
- Ancho de banda limitado (2 GB/mes)

---

### **💼 Plan PRO ($25/mes)**

**Límites principales:**
- **Base de datos:** 8 GB (escalable)
- **API Requests:** 2 millones/mes (≈66,667/día)
- **Storage:** 100 GB
- **Bandwidth:** 250 GB/mes
- **Edge Functions:** 2 millones de invocaciones/mes
- **Emails:** Sin límite (con SMTP personalizado)
- **Concurrent connections:** Hasta 200

**Capacidad estimada de usuarios:**
- **Usuarios registrados:** ~10,000-20,000 usuarios
- **Usuarios activos diarios:** ~1,000-2,000 usuarios
- **Usuarios simultáneos:** ~100-200 usuarios

**✅ Ventajas:**
- Base de datos suficiente para crecimiento
- Sin límites de email (con SMTP configurado)
- Ancho de banda adecuado para media

---

### **👥 Plan TEAM ($599/mes)**

**Límites principales:**
- **Base de datos:** 8 GB (escalable)
- **API Requests:** 10 millones/mes (≈333,333/día)
- **Storage:** 1 TB
- **Bandwidth:** 1 TB/mes
- **Edge Functions:** 10 millones de invocaciones/mes
- **Concurrent connections:** Hasta 400

**Capacidad estimada de usuarios:**
- **Usuarios registrados:** ~50,000-100,000 usuarios
- **Usuarios activos diarios:** ~5,000-10,000 usuarios
- **Usuarios simultáneos:** ~200-400 usuarios

---

### **🏢 Plan ENTERPRISE (Custom)**

**Límites principales:**
- **Base de datos:** Ilimitado (escalable)
- **API Requests:** Ilimitado
- **Storage:** Ilimitado
- **Bandwidth:** Ilimitado
- **Concurrent connections:** Ilimitado

**Capacidad estimada de usuarios:**
- **Usuarios registrados:** Ilimitado
- **Usuarios activos diarios:** Ilimitado
- **Usuarios simultáneos:** Ilimitado (depende de infraestructura)

---

## 🔍 Factores que Afectan la Capacidad

### **1. Tipo de Uso de la Aplicación**

**Uso ligero (solo navegación):**
- Más usuarios pueden usar la app simultáneamente
- Menos carga en la base de datos

**Uso intensivo (subida de media, clases en vivo):**
- Menos usuarios simultáneos
- Mayor consumo de storage y bandwidth

### **2. Configuración Actual**

Según tu configuración:

```91:92:ENV_STAGING_SETUP.md
VITE_RATE_LIMIT_REQUESTS=1000
VITE_RATE_LIMIT_WINDOW=60000
```

- **Rate limit configurado:** 1,000 requests por minuto (60 segundos)
- Esto permite ~1,440,000 requests/día desde el frontend

### **3. Storage Buckets**

```26:26:supabase/setup_storage_policies.sql
  52428800, -- 50 MB
```

- **Límite por archivo:** 50 MB
- **Buckets:** `media` (principal)

### **4. Edge Functions**

Tienes 4 funciones Edge de Stripe:
- `stripe-create-account-link`
- `stripe-create-checkout-session`
- `stripe-create-connected-account`
- `stripe-webhook`

Cada invocación cuenta contra el límite mensual.

---

## 📊 Cálculo de Capacidad Real

### **Fórmula básica:**

```
Usuarios simultáneos = (API Requests límite/día) / (Requests promedio por usuario/hora × 24)
```

### **Ejemplo con Plan PRO:**

- **API Requests/día:** 66,667
- **Requests promedio/usuario/hora:** 10-20 (navegación normal)
- **Usuarios simultáneos estimados:** ~140-280 usuarios

### **Considerando picos de tráfico:**

- **Pico de tráfico (hora punta):** 3-5x el promedio
- **Usuarios simultáneos en pico:** ~50-100 usuarios (Plan PRO)

---

## 🚨 Cuellos de Botella Actuales

### **1. Rate Limit de Emails (si estás en FREE)**

```44:44:SOLUCIONAR_RATE_LIMIT_SUPABASE.md
   - Límite: ~3-4 emails por hora por proyecto
```

**Solución:** Configurar SMTP personalizado (SendGrid, Resend, etc.)

### **2. Storage (si estás en FREE)**

- **Límite:** 1 GB
- Con avatares, flyers y videos, esto se llena rápido

**Solución:** Actualizar a Plan PRO o usar CDN externo

### **3. Base de Datos (si estás en FREE)**

- **Límite:** 500 MB
- Con perfiles, eventos, clases, esto puede ser limitante

**Solución:** Actualizar a Plan PRO

---

## ✅ Recomendaciones por Escenario

### **Escenario 1: Inicio / MVP (< 1,000 usuarios)**

**Plan recomendado:** FREE o PRO
- FREE si el presupuesto es limitado
- PRO si necesitas más emails y storage

### **Escenario 2: Crecimiento (1,000 - 10,000 usuarios)**

**Plan recomendado:** PRO ($25/mes)
- Base de datos suficiente
- Storage adecuado
- Sin límites de email (con SMTP)

### **Escenario 3: Escala Media (10,000 - 50,000 usuarios)**

**Plan recomendado:** TEAM ($599/mes)
- Mayor capacidad de requests
- Más storage y bandwidth
- Soporte prioritario

### **Escenario 4: Escala Grande (> 50,000 usuarios)**

**Plan recomendado:** ENTERPRISE
- Límites personalizados
- SLA garantizado
- Soporte dedicado

---

## 🔧 Optimizaciones para Aumentar Capacidad

### **1. Implementar Caché**

- Cachear queries frecuentes
- Usar CDN para assets estáticos
- Implementar Redis (si es necesario)

### **2. Optimizar Queries**

- Índices en columnas frecuentemente consultadas
- Paginación en listados
- Lazy loading de imágenes

### **3. Comprimir Media**

- Comprimir imágenes antes de subir
- Usar formatos modernos (WebP)
- Límites de tamaño por tipo de archivo

### **4. Rate Limiting Inteligente**

- Rate limiting por usuario (ya implementado en magicLinkAuth)
- Rate limiting por IP
- Throttling en endpoints pesados

---

## 📈 Monitoreo de Capacidad

### **Métricas a monitorear:**

1. **API Requests/día**
   - Supabase Dashboard → API → Usage

2. **Base de datos: tamaño y conexiones**
   - Supabase Dashboard → Database → Usage

3. **Storage: espacio usado**
   - Supabase Dashboard → Storage → Usage

4. **Edge Functions: invocaciones**
   - Supabase Dashboard → Edge Functions → Usage

5. **Bandwidth: transferencia**
   - Supabase Dashboard → Settings → Usage

### **Alertas recomendadas:**

- ⚠️ Alerta al 80% de capacidad de base de datos
- ⚠️ Alerta al 80% de API requests mensuales
- ⚠️ Alerta al 80% de storage usado
- ⚠️ Alerta si hay errores 429 (rate limit)

---

## 🎯 Conclusión

**Para determinar la capacidad EXACTA de tu plataforma:**

1. **Verifica tu plan actual:**
   - Ve a Supabase Dashboard → Settings → Billing
   - Revisa qué plan tienes activo

2. **Revisa el uso actual:**
   - Supabase Dashboard → Settings → Usage
   - Compara con los límites de tu plan

3. **Calcula según tus métricas:**
   - Usa las fórmulas arriba
   - Ajusta según tu patrón de uso

4. **Planifica el crecimiento:**
   - Monitorea el uso mensual
   - Actualiza el plan antes de llegar a los límites

---

## 📝 Notas Importantes

- Los límites de Supabase son **mensuales**, no diarios
- El tráfico puede variar significativamente día a día
- Los usuarios simultáneos son más limitantes que usuarios totales
- El plan FREE es solo para desarrollo/testing, no producción
- Configurar SMTP personalizado elimina límites de email

---

**Última actualización:** Enero 2025  
**Basado en:** Supabase Pricing (2025), configuración actual de la app

