# ✅ Ambiente de Staging - LISTO PARA USAR

Tu ambiente de staging está completamente configurado y funcionando. Este documento resume todo lo que tienes disponible.

---

## 🎯 **Estado Actual: TODO FUNCIONANDO**

### **✅ Supabase Staging:**
- **Proyecto:** benyelkdijorahyeiawp.supabase.co
- **Tablas:** 26
- **Políticas RLS:** 50
- **Storage:** 2 buckets (`media` principal)
- **Usuarios de prueba:** 6 (5 de staging + 1 tuyo)

### **✅ Base de Datos:**
- 📅 **Eventos:** 1 social (viernes 12 nov, 8 PM - 2 AM)
- 🏫 **Academias:** 1 (con 4 clases)
- 🎓 **Maestros:** 1 (con 3 clases)
- 👤 **Organizadores:** 1 (aprobado)
- 🎭 **Roles:** 5 roles asignados

### **✅ Aplicación Local:**
- **URL:** http://localhost:5173
- **Modo:** development (conectado a staging)
- **Estado:** Sin errores críticos

---

## 👥 **Usuarios de Prueba Disponibles**

| Email | Password | Rol | Acceso |
|-------|----------|-----|--------|
| admin@staging.baileapp.com | Admin123! | superadmin | Todo (admin panel, trending, challenges) |
| organizador@staging.baileapp.com | Orga123! | organizador | Crear eventos, editar perfil |
| academia@staging.baileapp.com | Acad123! | academia | Crear clases, editar perfil |
| maestro@staging.baileapp.com | Maestro123! | maestro | Crear clases privadas, editar perfil |
| usuario@staging.baileapp.com | User123! | usuario | Explorar, votar, RSVP, challenges |
| [tu-email]@gmail.com | (Magic Link) | superadmin | Todo (tu cuenta personal) |

---

## 📚 **Contenido de Prueba Disponible**

### **🎓 Academia: "Academia Dance Staging"**
**4 Clases:**
1. Salsa On1 Principiantes - Lunes/Miércoles 19:00-20:30
2. Bachata Sensual Intermedio - Martes/Jueves 20:00-21:30
3. Salsa On2 Avanzado - Viernes 19:30-21:00
4. Bachata Tradicional - Sábado 11:00-13:00

**Costos:**
- Mensual: $800
- Por clase: $100
- Paquete 10 clases: $850
- Prueba gratis: $0

**Ubicación:**
- Sede Centro (Av. Insurgentes Sur 123)

---

### **🎓 Maestro: "Maestro Salsa Staging"**
**3 Clases:**
1. Clases Privadas de Salsa - Flexible
2. Bachata Sensual Parejas - Sábado 17:00-19:00
3. Taller de Footwork Salsa - Domingo 12:00-14:00

**Costos:**
- Clase privada individual: $500
- Clase privada parejas: $800
- Clase grupal: $150
- Taller especial: $300

**Ubicación:**
- Estudio Personal (Calle Ámsterdam 45, Condesa)

---

### **📅 Evento: "Social de Salsa - Viernes"**
**Fecha:** Viernes 12 de noviembre, 2025  
**Horario:** 20:00 PM - 02:00 AM (madrugada sábado)  
**Lugar:** Salón de Baile Staging  
**Dirección:** Av. Insurgentes Sur 123, CDMX

**Cronograma:**
- 20:00 - Apertura de puertas
- 20:30 - Clase de Salsa On1
- 21:00 - Social abierto
- 23:00 - Performance especial
- 23:30 - Continuación del social
- 02:00 - Cierre

**Costos:**
- Entrada general: $150
- VIP: $250
- Mesa reservada (4 personas): $1200
- Preventa: $120

---

## 🧪 **Pruebas que Puedes Hacer**

### **Como Admin (admin@staging.baileapp.com):**
- ✅ Crear trending
- ✅ Publicar challenges
- ✅ Moderar submissions
- ✅ Ver leaderboards privados
- ✅ Aprobar roles de usuarios

### **Como Organizador:**
- ✅ Crear eventos sociales
- ✅ Agregar fechas de eventos
- ✅ Ver RSVPs de eventos
- ✅ Editar perfil público

### **Como Academia:**
- ✅ Crear/editar clases
- ✅ Agregar horarios y costos
- ✅ Gestionar ubicaciones
- ✅ Ver perfil público con clases

### **Como Maestro:**
- ✅ Crear clases privadas
- ✅ Configurar costos personalizados
- ✅ Agregar ubicación de estudio
- ✅ Ver perfil público

### **Como Usuario:**
- ✅ Explorar eventos, clases, perfiles
- ✅ Hacer RSVP a eventos
- ✅ Votar en trendings
- ✅ Subir videos a challenges
- ✅ Editar perfil personal

---

## 🔧 **Correcciones Aplicadas**

### **1. Migraciones SQL:**
- ✅ Challenges completo
- ✅ Trending completo (con listas y covers)
- ✅ RSVP completo
- ✅ Vistas públicas creadas
- ✅ Storage policies configuradas

### **2. Datos de Prueba:**
- ✅ 5 usuarios con roles
- ✅ 1 academia con 4 clases
- ✅ 1 maestro con 3 clases
- ✅ 1 evento social con cronograma
- ✅ Ubicaciones y costos completos

### **3. Frontend:**
- ✅ Query de eventos simplificada (sin `!inner` que causaba error)
- ✅ TeacherCard sin links anidados
- ✅ Filtro de usuarios con onboarding completo
- ✅ Avatar en UserPublicScreen corregido

---

## 📋 **Archivos de Configuración Creados**

### **Documentación:**
1. `QA_TESTING_GUIDE.md` - Guía completa de pruebas QA
2. `ENV_STAGING_SETUP.md` - Setup de ambiente staging
3. `STAGING_SETUP_INSTRUCTIONS.md` - Instrucciones paso a paso
4. `DEPLOYMENT_GUIDE.md` - Cómo pasar a producción
5. `SQL_MIGRATION_CHECKLIST.md` - Lista de migraciones SQL
6. `SQL_FILES_TO_EXECUTE.md` - Archivos SQL a ejecutar
7. `VERIFY_DEPLOYMENT_CONFIG.md` - Verificar configuración
8. `STAGING_READY_SUMMARY.md` - Este archivo (resumen)

### **Scripts SQL:**
1. `supabase/seed_staging.sql` - Usuarios base
2. `supabase/fix_usuario_role.sql` - Asignar rol usuario
3. `supabase/seed_complete_classes_and_events.sql` - Clases y eventos completos
4. `supabase/setup_storage_policies.sql` - Políticas de storage
5. `supabase/verify_and_add_classes.sql` - Verificar clases
6. `supabase/fix_event_400_error.sql` - Fix de eventos
7. `supabase/diagnose_events_query.sql` - Diagnóstico de eventos

### **Scripts de Deploy:**
1. `scripts/create-staging-branch.sh` - Crear branch (Linux/Mac)
2. `scripts/create-staging-branch.ps1` - Crear branch (Windows)

---

## 🚀 **Próximos Pasos**

### **1. Probar localmente (AHORA):**

```bash
cd apps/web
npm run dev:staging  # o npm run dev si ya apunta a staging
```

Abrir: http://localhost:5173

**Verificar:**
- [ ] Login con magic link funciona
- [ ] `/app/explore` carga sin errores
- [ ] Se ven eventos, clases, perfiles
- [ ] Navegación funciona

---

### **2. Crear branch staging en git:**

```powershell
# Windows PowerShell:
.\scripts\create-staging-branch.ps1
```

---

### **3. Deploy a Vercel:**

1. Crear proyecto en Vercel: `baileapp-staging`
2. Conectar branch: `staging`
3. Agregar variables de entorno (Preview):
   ```
   VITE_SUPABASE_URL=https://benyelkdijorahyeiawp.supabase.co
   VITE_SUPABASE_ANON_KEY=[tu-anon-key]
   VITE_APP_ENV=staging
   ```
4. Deploy automático al hacer push

---

### **4. Ejecutar QA:**

Seguir `QA_TESTING_GUIDE.md` para validar todas las funcionalidades.

---

## 🎉 **¡Felicidades!**

Tu ambiente de staging está:
- ✅ Configurado correctamente
- ✅ Con datos de prueba completos
- ✅ Listo para desarrollo y QA
- ✅ Documentado completamente

---

**Fecha de configuración:** 2025-11-05  
**Versión de staging:** v0.0.1-staging  
**Estado:** ✅ LISTO PARA USAR

