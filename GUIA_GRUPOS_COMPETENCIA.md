# 🎯 Guía: Configuración de Grupos de Competencia

## 📋 Requisitos Previos

Para crear un Grupo de Competencia necesitas:
- Tener el rol de **Maestro** o **Academia** aprobado
- Estar autenticado en BaileApp

## 🚀 Cómo Crear un Grupo de Competencia

### Paso 1: Acceder a la Sección

1. Abre el menú (☰) en la parte superior
2. Selecciona **"Grupos de Competencia"** 🎯
3. O navega directamente a: `/competition-groups`

### Paso 2: Crear el Grupo

1. Haz clic en el botón **"➕ Crear Grupo"**
2. Completa el formulario con la siguiente información:

#### Campos Obligatorios:
- **Nombre del Grupo**: Ej. "Grupo de Competencia Bachata Avanzada"
- **Ubicación de Entrenamientos**: Dirección o descripción del lugar
- **Tipo de Costo**: 
  - Mensual
  - Por Sesión
  - Paquete
- **Monto**: Cantidad en MXN (ej. 500.00)

#### Campos Opcionales:
- **Descripción**: Información sobre el grupo, objetivos, nivel requerido
- **Horarios de Entrenamiento**: Ej. "Lunes y Miércoles de 7:00 PM a 9:00 PM"
- **Imagen de Portada**: Sube una imagen representativa del grupo
- **Video de Promoción**: 
  - Sube un archivo de video, o
  - Pega una URL de YouTube/Vimeo
- **Asociar a Academia**: Si eres dueño de una academia, puedes asociar el grupo

### Paso 3: Guardar

1. Revisa que todos los campos obligatorios estén completos
2. Haz clic en **"Crear Grupo"**
3. Serás redirigido automáticamente a la página de detalle del grupo

## 👥 Invitar Miembros al Grupo

### Como Dueño del Grupo:

1. Ve a la página de detalle de tu grupo (`/competition-groups/:id`)
2. Haz clic en el botón **"👥 Invitar Miembros"**
3. En el buscador, escribe el nombre o email del usuario
4. Selecciona uno o varios usuarios de la lista
5. (Opcional) Añade un mensaje personalizado
6. Haz clic en **"Enviar Invitación(es)"**

### Estados de Invitaciones:

- **Pendientes**: Invitaciones enviadas que aún no han sido respondidas
- **Aceptadas**: Usuarios que aceptaron y ahora son miembros del grupo
- **Rechazadas**: Invitaciones que fueron rechazadas

## 📝 Editar un Grupo

1. Ve a la página de detalle de tu grupo
2. Haz clic en **"✏️ Editar Grupo"** (solo visible para el dueño)
3. Modifica los campos que necesites
4. Haz clic en **"Actualizar Grupo"**

## 👤 Gestionar Miembros

### Ver Miembros:
- En la página de detalle del grupo, verás la sección **"👥 Miembros"**
- Se muestra el nombre, avatar y rol de cada miembro

### Roles de Miembros:
- **👨‍🏫 Maestro**: Creador del grupo o maestros invitados
- **👨‍💼 Asistente**: Asistentes del grupo
- **👤 Alumno**: Alumnos del grupo (rol por defecto)

## 📬 Responder Invitaciones

### Como Usuario Invitado:

1. Cuando recibas una invitación, aparecerá en tu centro de notificaciones
2. Verás la información del grupo:
   - Nombre del grupo
   - Quién te invitó
   - Ubicación y horarios
   - Costos
3. Puedes:
   - **✅ Aceptar**: Te convertirás en miembro del grupo
   - **❌ Rechazar**: Declinar la invitación
   - **👁️ Ver Detalles**: Ver más información antes de decidir

## 🔍 Ver Mis Grupos

1. Ve a `/competition-groups`
2. Verás todos los grupos donde:
   - Eres el dueño
   - Eres miembro activo

## 💡 Consejos

- **Imagen de Portada**: Usa una imagen atractiva que represente el grupo (recomendado: 1200x600px)
- **Video de Promoción**: Un video corto puede ayudar a atraer más miembros
- **Descripción Clara**: Explica bien el nivel requerido, objetivos y qué esperar del grupo
- **Horarios Detallados**: Sé específico con días y horarios para evitar confusiones
- **Costos Transparentes**: Indica claramente qué incluye el costo (mensual, por sesión, etc.)

## ❓ Preguntas Frecuentes

### ¿Puedo crear múltiples grupos?
Sí, puedes crear tantos grupos como necesites.

### ¿Puedo eliminar un grupo?
Sí, como dueño puedes eliminar el grupo (esto eliminará también todas las invitaciones y miembros).

### ¿Qué pasa si rechazo una invitación?
Puedes volver a ser invitado más adelante si el dueño lo desea.

### ¿Puedo cambiar el rol de un miembro?
Sí, como dueño puedes cambiar el rol de los miembros (student/teacher/assistant).

### ¿Los grupos son públicos?
Los grupos solo son visibles para:
- El dueño del grupo
- Los miembros activos
- Usuarios con invitaciones pendientes

## 🛠️ Solución de Problemas

### No puedo crear un grupo
- Verifica que tengas el rol de Maestro o Academia aprobado
- Asegúrate de estar autenticado

### No veo el botón "Invitar Miembros"
- Solo el dueño del grupo puede invitar miembros
- Verifica que estés viendo tu propio grupo

### No recibo invitaciones
- Verifica tu centro de notificaciones
- Asegúrate de que el dueño haya enviado la invitación correctamente

---

**¿Necesitas ayuda?** Contacta al soporte de BaileApp.

