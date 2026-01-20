# Hotjar Setup - Analytics optimizado para rendimiento

## Configuración

Hotjar está integrado de forma **optimizada para no afectar el rendimiento**. Solo se carga de forma asíncrona después de que el contenido crítico esté listo.

### Variables de entorno

Agrega a tu archivo `.env` (producción) o `.env.staging`:

```env
VITE_HOTJAR_ID=tu_hotjar_id_aqui
```

El `HOTJAR_ID` es el número que te da Hotjar cuando creas un proyecto (p. ej. `1234567`).

### Funcionamiento

#### ✅ Optimizaciones de rendimiento implementadas:

1. **Carga asíncrona**: No bloquea el render inicial de la app
2. **requestIdleCallback**: Espera a que el navegador esté idle (tiempo libre)
3. **Fallback inteligente**: Si `requestIdleCallback` no está disponible, usa `setTimeout` con delay mínimo
4. **Solo en producción**: No se carga en desarrollo (a menos que uses `?hotjar=1` en la URL)
5. **Lazy loading**: Solo se inicializa cuando es necesario
6. **No bloquea main thread**: Todo se ejecuta en segundo plano

#### 📊 Qué se trackea automáticamente:

- **Cambios de página**: Se trackean automáticamente cuando cambia la ruta
- **Identificación de usuario**: Cuando un usuario inicia sesión, se identifica en Hotjar
- **Tiempo en sesión**: Hotjar mide automáticamente el tiempo en sesión

#### 🚫 Qué NO se carga en desarrollo:

- Por defecto, Hotjar **no se carga** en modo desarrollo
- Para probar en desarrollo, agrega `?hotjar=1` a la URL: `http://localhost:5173?hotjar=1`

### Uso manual (opcional)

Si necesitas trackear eventos personalizados:

```typescript
import { trackEvent, identifyUser } from '@/lib/hotjar';

// Trackear evento personalizado
trackEvent('button_clicked', { buttonName: 'cta_register' });

// Identificar usuario (ya se hace automáticamente en AuthProvider)
identifyUser(userId, { email: user.email });
```

### App móvil (React Native)

Hotjar funciona **automáticamente en la app móvil** porque la app carga la web dentro de un WebView. No se requiere configuración adicional en React Native.

### Verificación

1. **Producción**: Abre la app en producción y verifica en la consola del navegador que no hay errores
2. **Hotjar Dashboard**: Ve a tu dashboard de Hotjar y verifica que las sesiones se están registrando
3. **Network tab**: Verifica que las peticiones a `static.hotjar.com` se hacen después del contenido principal

### Troubleshooting

- **No se carga en desarrollo**: Normal. Usa `?hotjar=1` para probar
- **No aparece en producción**: Verifica que `VITE_HOTJAR_ID` esté configurado
- **Afecta rendimiento**: Si notas lentitud, verifica que no haya otras herramientas de analytics cargándose

### Privacidad

- Hotjar respeta las políticas de privacidad de tu app
- Los datos se envían a Hotjar según sus términos de servicio
- Considera mostrar un banner de cookies/analytics según las regulaciones locales (GDPR, etc.)
