# 📊 Plantilla de Excel para Importar Eventos

## 📥 Descargar Plantilla

Puedes crear tu Excel basándote en esta estructura:

---

## 📋 Hoja 1: eventos_parent (Eventos Sociales)

### Columnas Requeridas:

| Columna | Tipo | Ejemplo | Descripción |
|---------|------|---------|-------------|
| **nombre** | Texto | Salsa Night CDMX | Nombre del evento social |
| **descripcion** | Texto | Evento mensual de salsa | Descripción del evento |
| **organizer_email** | Email | organizador@email.com | Email del organizador (debe existir) |
| **estilos** | Texto | 1,2,3 | IDs de ritmos separados por comas |
| **zonas** | Texto | 1,2 | IDs de zonas separados por comas |
| **sede_general** | Texto | Av. Reforma 123, CDMX | Dirección general (opcional) |

### Ejemplo de Datos:

```
| nombre              | descripcion                    | organizer_email        | estilos | zonas | sede_general           |
|---------------------|--------------------------------|------------------------|---------|-------|------------------------|
| Salsa Night CDMX    | Evento mensual de salsa        | organizador@email.com  | 1,2     | 1,2   | Av. Reforma 123, CDMX  |
| Bachata Social      | Evento semanal de bachata      | organizador@email.com  | 3,4     | 1     | Calle Principal 456     |
| Kizomba Weekend     | Fin de semana de kizomba       | otro@email.com         | 5       | 2     | Hotel Centro           |
```

---

## 📅 Hoja 2: eventos_date (Fechas Específicas)

### Columnas Requeridas:

| Columna | Tipo | Ejemplo | Descripción |
|---------|------|---------|-------------|
| **parent_nombre** | Texto | Salsa Night CDMX | Nombre del evento parent (debe coincidir) |
| **fecha** | Fecha | 2025-02-15 | Fecha del evento (YYYY-MM-DD) |
| **hora_inicio** | Hora | 20:00 | Hora de inicio (HH:MM formato 24h) |
| **hora_fin** | Hora | 23:00 | Hora de fin (HH:MM formato 24h) |
| **lugar** | Texto | Salón Principal | Nombre del lugar |
| **direccion** | Texto | Av. Reforma 123 | Dirección completa |
| **ciudad** | Texto | CDMX | Ciudad |
| **zona** | Número | 1 | ID de zona (número) |
| **estilos** | Texto | 1,2 | IDs de ritmos separados por comas |
| **nombre_fecha** | Texto | Febrero 2025 | Nombre específico de esta fecha (opcional) |
| **biografia** | Texto | Noche especial... | Descripción de la fecha (opcional) |
| **referencias** | Texto | Cerca del metro... | Referencias de ubicación (opcional) |
| **requisitos** | Texto | Mayores de 18... | Requisitos del evento (opcional) |

### Ejemplo de Datos:

```
| parent_nombre       | fecha       | hora_inicio | hora_fin | lugar          | direccion          | ciudad | zona | estilos | nombre_fecha | biografia                    | referencias              | requisitos              |
|---------------------|-------------|-------------|----------|----------------|--------------------|--------|------|---------|--------------|------------------------------|--------------------------|-------------------------|
| Salsa Night CDMX    | 2025-02-15  | 20:00       | 23:00    | Salón Principal| Av. Reforma 123    | CDMX   | 1    | 1,2     | Febrero 2025 | Noche especial con DJ        | Cerca del metro          | Mayores de 18 años      |
| Salsa Night CDMX    | 2025-03-15  | 20:00       | 23:00    | Salón Principal| Av. Reforma 123    | CDMX   | 1    | 1,2     | Marzo 2025   | Noche especial con DJ        | Cerca del metro          | Mayores de 18 años      |
| Bachata Social      | 2025-02-20  | 19:00       | 22:00    | Club Dance     | Calle Principal 456| CDMX   | 1    | 3,4     | Febrero 2025 | Social con clase incluida    | Estacionamiento          | Cambio de calzado       |
```

---

## 🔢 IDs de Ritmos y Zonas

### Cómo obtener los IDs:

1. Ve a Supabase Dashboard → **Table Editor**
2. Busca la tabla `ritmos_catalog` para ver IDs de ritmos
3. Busca la tabla `zonas_catalog` para ver IDs de zonas

### Ejemplos comunes:

**Ritmos (pueden variar según tu catálogo):**
- Salsa On1: 1
- Salsa On2: 2
- Bachata Tradicional: 3
- Bachata Sensual: 4
- Kizomba: 5
- etc.

**Zonas (pueden variar según tu catálogo):**
- CDMX Centro: 1
- CDMX Norte: 2
- CDMX Sur: 3
- etc.

---

## 📝 Notas Importantes

### 1. Formato de Fechas
- ✅ Correcto: `2025-02-15`
- ❌ Incorrecto: `15/02/2025`, `02-15-2025`

### 2. Formato de Horas
- ✅ Correcto: `20:00`, `19:30`
- ❌ Incorrecto: `8:00 PM`, `7:30pm`

### 3. Arrays (estilos, zonas)
- ✅ Correcto: `1,2,3` (sin espacios)
- ❌ Incorrecto: `1, 2, 3` (con espacios), `[1,2,3]`

### 4. Emails de Organizadores
- El email debe existir en la tabla `profiles_user`
- Debe coincidir exactamente (mayúsculas/minúsculas)
- Si no existe, créalo primero

### 5. parent_nombre
- Debe coincidir exactamente con el nombre en `eventos_parent`
- Se usa para relacionar fechas con eventos parent

---

## 🚀 Pasos para Usar la Plantilla

1. **Descarga o crea** un Excel con las dos hojas
2. **Completa** los datos según la estructura
3. **Guarda** como CSV (Archivo → Guardar como → CSV)
4. **Usa el script SQL** `import_events_from_excel.sql`
5. **Reemplaza** los valores INSERT con tus datos del CSV
6. **Ejecuta** el script en Supabase SQL Editor

---

## ✅ Checklist Antes de Importar

- [ ] Los emails de organizadores existen en la plataforma
- [ ] Los IDs de ritmos son correctos
- [ ] Los IDs de zonas son correctos
- [ ] Las fechas están en formato YYYY-MM-DD
- [ ] Las horas están en formato HH:MM (24 horas)
- [ ] Los arrays (estilos, zonas) no tienen espacios
- [ ] Los nombres de eventos parent coinciden entre hojas

---

## 🔍 Validación Rápida

Antes de importar, puedes validar tus datos con este query:

```sql
-- Verificar que los organizadores existan
SELECT email, user_id, display_name
FROM public.profiles_user
WHERE email IN ('organizador@email.com', 'otro@email.com');
-- ⬆️ Reemplaza con los emails de tu Excel

-- Verificar IDs de ritmos
SELECT id, nombre
FROM public.ritmos_catalog
WHERE id IN (1, 2, 3, 4, 5);
-- ⬆️ Reemplaza con los IDs que usas

-- Verificar IDs de zonas
SELECT id, nombre
FROM public.zonas_catalog
WHERE id IN (1, 2, 3);
-- ⬆️ Reemplaza con los IDs que usas
```

---

## 💡 Consejos

1. **Empieza con pocos eventos** para probar
2. **Verifica los resultados** antes de importar muchos
3. **Guarda una copia** de tu Excel original
4. **Revisa los logs** si hay errores
5. **Usa nombres únicos** para eventos parent

---

¡Listo para importar! 🎉

