# 🧪 Guía de Pruebas para Usuarios

Esta guía te ayudará a probar las funciones principales de la plataforma.

## 📱 Inicio de Sesión y Registro

### Prueba 1: Registro con Email
1. Ve a la página de inicio de sesión
2. Busca la sección de "Crear Cuenta" o "Registrarse"
3. Ingresa tu email
4. Haz clic en "Registrarse con enlace mágico"
5. **Resultado esperado**: Deberías recibir un email con un enlace
6. Abre el email y haz clic en el enlace
7. **Resultado esperado**: Deberías ser redirigido a la plataforma y estar autenticado

### Prueba 2: Inicio de Sesión con Google
1. Ve a la página de inicio de sesión
2. Haz clic en el botón "Continuar con Google"
3. **Resultado esperado**: Se abre una ventana de Google para autorizar
4. Selecciona tu cuenta de Google
5. Autoriza el acceso
6. **Resultado esperado**: Deberías ser redirigido a la plataforma y estar autenticado

### Prueba 3: Inicio de Sesión con Facebook
1. Ve a la página de inicio de sesión
2. Haz clic en el botón "Continuar con Facebook"
3. **Resultado esperado**: Se abre una ventana de Facebook para autorizar
4. Ingresa tus credenciales de Facebook (si no estás logueado)
5. Autoriza el acceso
6. **Resultado esperado**: Deberías ser redirigido a la plataforma y estar autenticado

### Prueba 4: Inicio de Sesión con Contraseña
1. Ve a la página de inicio de sesión
2. Ingresa tu email y contraseña
3. Haz clic en "Entrar con contraseña"
4. **Resultado esperado**: Deberías iniciar sesión correctamente

---

## 👤 Perfil de Usuario

### Prueba 5: Completar Onboarding
1. Si es tu primera vez, deberías ver una pantalla de bienvenida
2. Completa los pasos del onboarding:
   - Información básica (nombre, cómo te identificas)
   - Selección de ritmos de baile
   - Selección de zonas
3. **Resultado esperado**: Al finalizar, deberías ver tu perfil

### Prueba 6: Editar Perfil
1. Ve a tu perfil
2. Busca el botón de "Editar" o "Configuración"
3. Modifica alguna información (nombre, biografía, foto)
4. Guarda los cambios
5. **Resultado esperado**: Los cambios deberían guardarse y verse en tu perfil

### Prueba 7: Agregar Redes Sociales
1. En la edición de perfil, busca la sección "Redes Sociales"
2. Agrega tus perfiles de Instagram, TikTok, Facebook, etc.
3. Guarda los cambios
4. **Resultado esperado**: Las redes sociales deberían aparecer en tu perfil público

---

## 🏫 Perfil de Academia

### Prueba 8: Crear Perfil de Academia
1. Si tienes el rol de academia, ve a crear/editar perfil de academia
2. Completa la información básica:
   - Nombre de la academia
   - Descripción
   - Ubicación
3. Guarda los cambios
4. **Resultado esperado**: Deberías ver tu perfil de academia creado

### Prueba 9: Agregar Clases
1. En el editor de academia, busca la sección "Clases"
2. Haz clic en "Agregar Clase" o "Crear Clase"
3. Completa la información:
   - Nombre de la clase
   - Ritmo
   - Día y hora
   - Costo
4. Guarda la clase
5. **Resultado esperado**: La clase debería aparecer en tu perfil y en el explorador

### Prueba 10: Agregar Promociones
1. En el editor de academia, busca la sección "Promociones"
2. Crea una nueva promoción:
   - Nombre
   - Descripción
   - Precio
   - Fechas de vigencia
3. Guarda la promoción
4. **Resultado esperado**: La promoción debería aparecer en tu perfil público

---

## 👨‍🏫 Perfil de Maestro

### Prueba 11: Crear Perfil de Maestro
1. Si tienes el rol de maestro, ve a crear/editar perfil de maestro
2. Completa la información:
   - Nombre
   - Especialidades (ritmos)
   - Zonas donde enseñas
3. Guarda los cambios
4. **Resultado esperado**: Deberías ver tu perfil de maestro creado

### Prueba 12: Agregar Clases como Maestro
1. En el editor de maestro, busca la sección "Clases"
2. Crea una nueva clase
3. Completa la información necesaria
4. Guarda la clase
5. **Resultado esperado**: La clase debería aparecer en tu perfil

---

## 🎉 Eventos y Sociales

### Prueba 13: Crear un Evento Social
1. Si eres organizador, ve a crear evento
2. Completa la información:
   - Nombre del evento
   - Descripción
   - Fecha y hora
   - Ubicación
3. Guarda el evento
4. **Resultado esperado**: El evento debería aparecer en el explorador

### Prueba 14: Agregar Fecha a un Evento
1. Ve a un evento existente
2. Busca la opción "Agregar Fecha" o "Crear Fecha"
3. Selecciona una nueva fecha y hora
4. Guarda la fecha
5. **Resultado esperado**: La nueva fecha debería aparecer en el evento

### Prueba 15: Confirmar Asistencia (RSVP)
1. Ve a un evento o clase
2. Busca el botón "Confirmar Asistencia" o "Agregar a Calendario"
3. Haz clic en el botón
4. **Resultado esperado**: Deberías ver un mensaje de confirmación y el contador de asistentes debería aumentar

---

## 🔍 Explorar y Buscar

### Prueba 16: Buscar Clases
1. Ve a la página principal de exploración
2. Usa los filtros para buscar:
   - Por ritmo (Salsa, Bachata, etc.)
   - Por zona
   - Por fecha
3. **Resultado esperado**: Deberías ver clases filtradas según tus criterios

### Prueba 17: Buscar Eventos
1. En la página de exploración, busca eventos
2. Aplica filtros similares
3. **Resultado esperado**: Deberías ver eventos filtrados

### Prueba 18: Ver Perfiles de Academias
1. En la página de exploración, busca academias
2. Haz clic en una academia
3. **Resultado esperado**: Deberías ver el perfil completo con clases, promociones, etc.

---

## 📱 Responsive (Móvil)

### Prueba 19: Navegación en Móvil
1. Abre la plataforma en tu teléfono móvil
2. Navega por las diferentes secciones
3. **Resultado esperado**: Todo debería verse bien y ser fácil de usar

### Prueba 20: Menú en Móvil
1. En móvil, busca el menú (generalmente un ícono de hamburguesa)
2. Abre el menú
3. Navega a diferentes secciones
4. **Resultado esperado**: El menú debería funcionar correctamente

### Prueba 21: Formularios en Móvil
1. Intenta editar tu perfil desde el móvil
2. Completa un formulario
3. Guarda los cambios
4. **Resultado esperado**: Los formularios deberían ser fáciles de usar en móvil

---

## 🔗 Compartir

### Prueba 22: Compartir Perfil
1. Ve a cualquier perfil (academia, maestro, evento)
2. Busca el botón "Compartir"
3. Haz clic en compartir
4. **Resultado esperado**: Deberías poder compartir el enlace del perfil

### Prueba 23: Compartir Evento
1. Ve a un evento
2. Busca el botón "Compartir"
3. Comparte el evento
4. **Resultado esperado**: Deberías poder compartir el enlace del evento

---

## ⚙️ Configuración

### Prueba 24: Cambiar Configuración
1. Ve a tu perfil
2. Busca "Configuración" o el ícono de engranaje
3. Revisa las opciones disponibles
4. **Resultado esperado**: Deberías poder acceder a la configuración

### Prueba 25: Cerrar Sesión
1. Busca la opción de "Cerrar Sesión" o "Logout"
2. Haz clic en cerrar sesión
3. **Resultado esperado**: Deberías ser redirigido a la página de inicio de sesión

---

## ✅ Checklist de Pruebas Completas

Marca las pruebas que hayas completado:

### Autenticación
- [ ] Registro con email
- [ ] Inicio de sesión con Google
- [ ] Inicio de sesión con Facebook
- [ ] Inicio de sesión con contraseña

### Perfil de Usuario
- [ ] Completar onboarding
- [ ] Editar perfil
- [ ] Agregar redes sociales

### Perfil de Academia
- [ ] Crear perfil de academia
- [ ] Agregar clases
- [ ] Agregar promociones

### Perfil de Maestro
- [ ] Crear perfil de maestro
- [ ] Agregar clases

### Eventos
- [ ] Crear evento social
- [ ] Agregar fecha a evento
- [ ] Confirmar asistencia

### Exploración
- [ ] Buscar clases
- [ ] Buscar eventos
- [ ] Ver perfiles de academias

### Móvil
- [ ] Navegación en móvil
- [ ] Menú en móvil
- [ ] Formularios en móvil

### Otros
- [ ] Compartir perfil
- [ ] Compartir evento
- [ ] Configuración
- [ ] Cerrar sesión

---

## 📝 Notas para Reportar Problemas

Si encuentras algún problema, anota:

1. **Qué estabas haciendo**: Describe los pasos que seguiste
2. **Qué esperabas**: Qué debería haber pasado
3. **Qué pasó realmente**: Qué ocurrió en su lugar
4. **Dispositivo**: ¿Estás en computadora, tablet o móvil?
5. **Navegador**: ¿Qué navegador estás usando? (Chrome, Firefox, Safari, etc.)

**Ejemplo**:
> Estaba intentando crear una clase en mi perfil de academia. Llené todos los campos y guardé, pero la clase no apareció en mi perfil. Estoy usando Chrome en mi computadora.

---

## 💡 Consejos

- **Tómate tu tiempo**: No tengas prisa al hacer las pruebas
- **Prueba en diferentes dispositivos**: Si es posible, prueba en computadora y móvil
- **Anota los problemas**: Escribe cualquier problema que encuentres
- **Sé específico**: Cuando reportes un problema, sé lo más específico posible

---

¡Gracias por ayudarnos a mejorar la plataforma! 🎉

