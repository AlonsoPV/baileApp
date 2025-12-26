# 🔐 Documentación sobre Encriptación - Apple App Store Connect

## Resumen Ejecutivo

**Donde Bailar MX** utiliza **únicamente encriptación estándar** proporcionada por:
- El sistema operativo iOS (para almacenamiento local)
- Protocolos estándar de Internet (HTTPS/TLS para comunicación)
- APIs estándar del navegador (Web Crypto API para hash de PIN)

**La app NO utiliza algoritmos de encriptación propietarios** ni algoritmos no estándar.

---

## ✅ Configuración en Info.plist

La app está configurada correctamente en `app.config.ts`:

```typescript
ios: {
  infoPlist: {
    ITSAppUsesNonExemptEncryption: false, // ✅ Usa cifrado estándar/exento (HTTPS)
  },
}
```

Esto se traduce al archivo `Info.plist` generado como:

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

**✅ Valor: `false`** - La app usa **encriptación exenta** (estándar del sistema).

---

## 📋 Detalle de Uso de Encriptación

### 1. **Comunicación de Red (HTTPS/TLS)**

**Tipo:** Encriptación estándar del sistema operativo

**Uso:**
- Todas las comunicaciones entre la app y el servidor utilizan **HTTPS/TLS**
- El protocolo TLS es estándar y proporcionado por el sistema operativo iOS
- No se implementa encriptación personalizada para comunicación de red

**Implementación:**
- Utiliza el framework de red nativo de iOS (`URLSession` a través de React Native/Expo)
- Las conexiones HTTPS son manejadas automáticamente por iOS
- Todas las peticiones a Supabase (backend) se realizan sobre HTTPS

**Estándares utilizados:**
- TLS 1.2 o superior (estándar IETF RFC 5246, RFC 8446)
- Cifrados estándar (AES, ChaCha20-Poly1305, etc.)
- Certificados SSL/TLS estándar

**Documentación estándar:**
- IETF RFC 5246 (TLS 1.2)
- IETF RFC 8446 (TLS 1.3)
- IEEE 802.1AE (MACsec)

---

### 2. **Almacenamiento Local Seguro**

**Tipo:** Encriptación estándar del sistema operativo

**Uso:**
- iOS proporciona encriptación automática para datos almacenados localmente
- La app utiliza `SecureStore` (Expo) / `Keychain` (iOS nativo) para tokens sensibles
- Los datos almacenados en `localStorage`/`AsyncStorage` están protegidos por el encriptado del sistema

**Implementación:**
- **Tokens de autenticación:** Almacenados en Keychain (iOS) mediante Expo SecureStore
- **Datos locales:** Protegidos por el encriptado de disco del sistema operativo iOS
- No se implementa encriptación adicional personalizada

**Estándares utilizados:**
- Encriptación de disco de iOS (FileVault/AES-256)
- Keychain Services API de Apple (estándar Apple)

---

### 3. **Autenticación y Tokens (JWT)**

**Tipo:** Tokens JWT estándar (proporcionados por Supabase)

**Uso:**
- La app utiliza tokens JWT para autenticación
- Los tokens son proporcionados y firmados por Supabase (backend)
- Los tokens se almacenan de forma segura usando Keychain

**Implementación:**
- Los tokens JWT son generados y firmados por Supabase Auth
- La app NO implementa algoritmos de firma personalizados
- Los tokens utilizan algoritmos estándar (RS256, HS256)

**Estándares utilizados:**
- IETF RFC 7519 (JWT)
- IETF RFC 7518 (Algoritmos de firma estándar: RS256, HS256)

---

### 4. **Hash de PIN Local**

**Tipo:** Hash criptográfico estándar (Web Crypto API)

**Uso:**
- Los PINs de 4 dígitos se hashean localmente antes de almacenarse
- Se utiliza para verificación rápida de PIN sin enviar el PIN en texto plano

**Implementación:**
```typescript
// apps/web/src/lib/pin.ts
export async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(pin);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
```

**Estándares utilizados:**
- **SHA-256** (FIPS 180-4, estándar NIST)
- **Web Crypto API** (estándar W3C)
- No se utiliza algoritmo propietario

**Documentación estándar:**
- NIST FIPS 180-4 (SHA-256)
- W3C Web Crypto API Specification

---

### 5. **Contraseñas de Usuario**

**Tipo:** Hash estándar (manejado por Supabase)

**Uso:**
- Las contraseñas se hashean en el servidor (Supabase) antes de almacenarse
- La app NO maneja contraseñas en texto plano ni implementa hash de contraseñas

**Implementación:**
- Supabase Auth utiliza **bcrypt** para hash de contraseñas
- El hash se realiza en el servidor, no en la app cliente
- La app solo envía la contraseña sobre HTTPS (ya encriptada en tránsito)

**Estándares utilizados:**
- **bcrypt** (OpenBSD, estándar de la industria)
- No se utiliza algoritmo propietario

---

### 6. **Datos en Reposo (Base de Datos)**

**Tipo:** Encriptación estándar del proveedor (Supabase)

**Uso:**
- Los datos almacenados en la base de datos están encriptados en reposo
- La encriptación es manejada por Supabase (proveedor de infraestructura)
- La app NO implementa encriptación adicional de datos

**Implementación:**
- Supabase utiliza encriptación AES-256 para datos en reposo
- La app no accede directamente a la base de datos, solo a través de API
- Todas las conexiones a la base de datos son encriptadas (HTTPS)

**Estándares utilizados:**
- AES-256 (NIST FIPS 197)
- Estándares de Supabase (proveedor certificado)

---

## ❌ Algoritmos NO Utilizados

La app **NO utiliza**:
- ❌ Algoritmos de encriptación propietarios
- ❌ Algoritmos no estándar
- ❌ Implementaciones personalizadas de encriptación
- ❌ Cifrados propios o modificados
- ❌ Algoritmos no documentados o no certificados

---

## ✅ Declaración de Cumplimiento

### Para Apple App Store Connect:

**"La app usa encriptación no exenta"**: **NO** (marca `false`)

**Justificación:**
- La app utiliza **únicamente encriptación estándar** proporcionada por el sistema operativo iOS y protocolos estándar de Internet
- Todos los algoritmos utilizados son estándar y están documentados por organismos internacionales (IETF, NIST, W3C, IEEE)
- No se implementan algoritmos propietarios ni no estándar
- La encriptación se realiza a través de APIs estándar del sistema o servicios estándar

---

## 📚 Referencias de Estándares Utilizados

1. **TLS/HTTPS:**
   - IETF RFC 5246 (TLS 1.2)
   - IETF RFC 8446 (TLS 1.3)

2. **JWT:**
   - IETF RFC 7519 (JSON Web Token)
   - IETF RFC 7518 (JSON Web Algorithms)

3. **SHA-256:**
   - NIST FIPS 180-4 (Secure Hash Standard)
   - IETF RFC 6234 (US Secure Hash Algorithms)

4. **AES:**
   - NIST FIPS 197 (Advanced Encryption Standard)

5. **Web Crypto API:**
   - W3C Web Cryptography API (Recommendation)

6. **Keychain Services:**
   - Apple Keychain Services API (Apple estándar)

7. **bcrypt:**
   - OpenBSD bcrypt implementation (estándar de la industria)

---

## 🔍 Verificación Técnica

### Archivos Relevantes:

1. **Configuración iOS:**
   - `app.config.ts` (línea 168): `ITSAppUsesNonExemptEncryption: false`
   - `ios/DondeBailarMX/Info.plist`: Generado automáticamente desde `app.config.ts`

2. **Código de Encriptación:**
   - `apps/web/src/lib/pin.ts`: Utiliza Web Crypto API (SHA-256 estándar)
   - No hay código adicional de encriptación personalizada

3. **Comunicación:**
   - Todas las peticiones HTTP utilizan HTTPS (configurado automáticamente)
   - Utiliza `fetch` nativo y librerías estándar de React Native/Expo

---

## 📝 Documentación Adicional para Apple

Si Apple solicita documentación adicional, se puede proporcionar:

1. **Especificación de protocolos:**
   - Todos los protocolos utilizados son estándar y están documentados públicamente

2. **Fuentes de implementación:**
   - iOS System APIs (para HTTPS, Keychain)
   - Web Crypto API (para hash de PIN)
   - Supabase (para JWT, hash de contraseñas, encriptación de base de datos)

3. **Verificación:**
   - Todos los algoritmos son estándar y están documentados por organismos internacionales
   - No hay implementaciones propietarias de encriptación

---

## ✅ Conclusión y Respuesta para el Formulario de Apple

**Donde Bailar MX** utiliza **exclusivamente encriptación estándar** y está correctamente configurada con:

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

### 📋 Respuesta para el Formulario de Apple (Paso 2 de 3)

**Si es obligatorio seleccionar una opción, selecciona:**

✅ **"Algoritmos de encriptación estándar en lugar de, o además de, utilizar o acceder a la encriptación del sistema operativo de Apple."**

**Justificación:**
- La app utiliza **SHA-256** (algoritmo estándar NIST FIPS 180-4) a través de **Web Crypto API** para hash de PINs
- Aunque Web Crypto API es proporcionada por el sistema, Apple puede considerarlo como uso de algoritmos estándar además de la encriptación nativa del sistema operativo iOS
- La app también utiliza HTTPS/TLS (del sistema operativo) **además de** SHA-256 (a través de Web Crypto API)
- Todos los algoritmos son estándar (no propietarios) y están documentados por organismos internacionales

**NO selecciones:**
❌ "Algoritmos de encriptación propietarios o no aceptados como estándar" - La app NO utiliza algoritmos propietarios.

**No se requiere documentación adicional** porque la app:
- ✅ Utiliza únicamente algoritmos estándar documentados
- ✅ Los algoritmos están certificados por organismos internacionales (IETF, NIST, W3C)
- ✅ No implementa algoritmos propietarios
- ✅ Cumple con los requisitos de exención de Apple (por eso `ITSAppUsesNonExemptEncryption: false`)

---

**Última actualización:** Enero 2025  
**Versión del documento:** 1.0

