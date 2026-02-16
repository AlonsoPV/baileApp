# ✅ Validación: Icono y Nombre de la App - Google Play

## 📋 Configuración Actual en la App

### Nombre de la App
- **Configurado en `app.config.ts`**: `"Donde Bailar MX"`
- **Package ID**: `com.tuorg.dondebailarmx.app`

### Iconos Configurados
- **Icono principal**: `./assets/icon.png`
- **Icono Android adaptativo**: `./assets/adaptive-icon.png`
  - Foreground: `./assets/adaptive-icon.png`
  - Background color: `#000000` (negro)

### Versión Actual
- **Versión**: `1.0.2`
- **Runtime Version**: `1.0.2`

---

## 🔍 Dónde Revisar en Google Play Console

### Paso 1: Acceder a Google Play Console

1. Ve a: **https://play.google.com/console/**
2. Inicia sesión con tu cuenta de desarrollador
3. Selecciona tu app: **"Donde Bailar MX"** (o el nombre que tenga)

### Paso 2: Revisar la Ficha de Play Store

#### Opción A: Desde el Menú Principal
1. En el menú lateral izquierdo, busca **"Crecimiento"** o **"Store presence"**
2. Haz clic en **"Ficha de Play Store"** o **"Store listing"**
3. Selecciona el idioma (probablemente **Español (España)** o **Español (México)**)

#### Opción B: Desde la Página Principal de la App
1. En la página principal de tu app en Play Console
2. Busca la sección **"Ficha de Play Store"** en el menú lateral
3. Haz clic en **"Ficha principal"** o **"Ficha predeterminada"**

### Paso 3: Verificar los Elementos Clave

Una vez en la ficha de Play Store, verifica estos elementos:

#### 1. **Nombre de la App** (Título)
- **Ubicación**: Sección "Título de la app"
- **Debe decir**: `Donde Bailar MX` (exactamente como en `app.config.ts`)
- **Límite**: 50 caracteres
- **⚠️ Verifica**: Que coincida exactamente con `name: "Donde Bailar MX"` en `app.config.ts`

#### 2. **Icono de la App**
- **Ubicación**: Sección "Icono de la app"
- **Tamaño requerido**: 512x512 píxeles (PNG, sin transparencia)
- **⚠️ Verifica**: 
  - Que el icono mostrado sea el mismo que `./assets/icon.png`
  - Que no tenga diferencias visuales significativas
  - Que los colores y diseño coincidan

#### 3. **Capturas de Pantalla**
- **Ubicación**: Sección "Capturas de pantalla"
- **⚠️ Verifica**: Que las capturas muestren el icono correcto de la app

#### 4. **Nombre Corto**
- **Ubicación**: Sección "Nombre corto" (si está habilitado)
- **Límite**: 30 caracteres
- **⚠️ Verifica**: Que no cause confusión con el nombre principal

---

## 📸 Cómo Comparar el Icono

### Método 1: Descargar el Icono de Play Store
1. En la ficha de Play Store, haz clic en el icono actual
2. Descárgalo o toma una captura de pantalla
3. Compara visualmente con `./assets/icon.png` y `./assets/adaptive-icon.png`

### Método 2: Instalar la App y Verificar
1. Instala la app desde Google Play en un dispositivo Android
2. Verifica el icono en el launcher/cajón de apps
3. Compara con el icono mostrado en Play Store

---

## ✅ Checklist de Validación

### Nombre de la App
- [ ] El nombre en Play Store es: `Donde Bailar MX`
- [ ] El nombre en `app.config.ts` es: `"Donde Bailar MX"`
- [ ] Ambos coinciden exactamente (sin espacios extra, mayúsculas/minúsculas iguales)

### Icono de la App
- [ ] El icono en Play Store es de 512x512 px
- [ ] El icono visualmente coincide con `./assets/icon.png`
- [ ] El icono visualmente coincide con `./assets/adaptive-icon.png`
- [ ] No hay diferencias significativas en colores, diseño o elementos

### Package ID
- [ ] El Package ID en Play Store es: `com.tuorg.dondebailarmx.app`
- [ ] El Package ID en `app.config.ts` es: `com.tuorg.dondebailarmx.app`
- [ ] Ambos coinciden exactamente

---

## 🔧 Si Encuentras Diferencias

### Si el Nombre NO Coincide:

**Opción 1: Actualizar en Play Store (Recomendado si la app está correcta)**
1. Ve a Ficha de Play Store
2. Edita el "Título de la app"
3. Cambia a: `Donde Bailar MX`
4. Guarda los cambios
5. **No necesitas build nuevo** - Solo actualización de metadatos

**Opción 2: Actualizar en la App (Requiere build nuevo)**
1. Edita `app.config.ts`:
   ```typescript
   name: "Nuevo Nombre Aquí",
   ```
2. Haz build nuevo:
   ```bash
   pnpm build:prod:android
   pnpm submit:android
   ```

### Si el Icono NO Coincide:

**Opción 1: Actualizar en Play Store (Recomendado si la app está correcta)**
1. Ve a Ficha de Play Store
2. Edita el "Icono de la app"
3. Sube el icono desde `./assets/icon.png` (redimensionado a 512x512 si es necesario)
4. Guarda los cambios
5. **No necesitas build nuevo** - Solo actualización de metadatos

**Opción 2: Actualizar en la App (Requiere build nuevo)**
1. Reemplaza `./assets/icon.png` y `./assets/adaptive-icon.png` con el icono correcto
2. Haz build nuevo:
   ```bash
   pnpm build:prod:android
   pnpm submit:android
   ```

---

## 📝 Notas Importantes

1. **Los metadatos de Play Store se pueden actualizar sin build nuevo**
   - Nombre, descripción, capturas, icono de la ficha
   - Estos cambios se reflejan inmediatamente en Play Store

2. **El icono/nombre en la app instalada requiere build nuevo**
   - Si cambias `app.config.ts` o los assets, necesitas rebuild
   - El build nuevo actualizará el icono/nombre en la app instalada

3. **Google Play verifica ambos**
   - El icono/nombre en la ficha de Play Store
   - El icono/nombre en la app instalada
   - Ambos deben coincidir

---

## 🚀 Próximos Pasos

1. **Revisa en Google Play Console** siguiendo los pasos arriba
2. **Compara** el nombre e icono con la configuración actual
3. **Decide** si actualizar en Play Store (sin build) o en la app (con build)
4. **Documenta** qué encontraste para poder ayudarte mejor

---

## 📞 Si Necesitas Ayuda

Una vez que revises en Play Console, comparte:
- Qué nombre aparece en la ficha de Play Store
- Si el icono coincide o no
- Qué prefieres hacer (actualizar ficha o actualizar app)

Con esa información, puedo ayudarte a hacer los cambios necesarios.

