# 📋 Guía: Sincronización de Datos del Perfil de Usuario

## 🚨 Problema Identificado

### 1. **Redes Sociales**
- ✅ **Se guardan correctamente** en `redes_sociales` (columna dedicada) en `Profile.tsx`
- ⚠️ **Pero NO se sincronizan** automáticamente a `respuestas.redes`
- **Solución:** Trigger SQL bidireccional

### 2. **Preguntas del Perfil**
- ❌ **NO se guardan** `dato_curioso` y `gusta_bailar`
- ❌ **NO hay editor** para estas preguntas en `/profile/edit`
- **Solución:** Crear editor de preguntas

---

## ✅ Solución Implementada

### **Paso 1: Ejecutar Script SQL**

El archivo `supabase/fix_user_profile_data_sync.sql` contiene:

1. **Backfill:** Migra datos existentes de `respuestas.redes` → `redes_sociales`
2. **Trigger:** Sincroniza automáticamente ambas columnas
3. **Vista actualizada:** `v_user_public` expone ambas columnas
4. **Diagnóstico:** Queries para verificar el estado

```sql
-- Ejecutar este script en Supabase SQL Editor
```

### **Paso 2: Crear Editor de Preguntas del Perfil**

Necesitas crear un componente para editar las preguntas. Ubicación sugerida:

**`apps/web/src/components/profile/ProfileQuestionsEditor.tsx`**

```typescript
import React, { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { mergeProfile } from '@/utils/profileHelpers';
import { useToast } from '@/hooks/useToast';

export const ProfileQuestionsEditor: React.FC = () => {
  const { profile, updateProfileFields } = useUserProfile();
  const { showToast } = useToast();
  
  const [datoCurioso, setDatoCurioso] = useState(
    profile?.respuestas?.dato_curioso || ''
  );
  const [gustaBailar, setGustaBailar] = useState(
    profile?.respuestas?.gusta_bailar || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const updates = mergeProfile(profile, {
        respuestas: {
          ...(profile.respuestas || {}),
          dato_curioso: datoCurioso,
          gusta_bailar: gustaBailar,
        }
      });
      
      await updateProfileFields(updates);
      showToast('Preguntas guardadas exitosamente ✅', 'success');
    } catch (error: any) {
      showToast('Error al guardar preguntas', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      padding: '1.5rem',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '1.5rem'
    }}>
      <h3 style={{
        margin: '0 0 1rem 0',
        fontSize: '1.5rem',
        fontWeight: '800',
        background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span>❓</span>
        <span>Preguntas del Perfil</span>
      </h3>

      {/* Dato Curioso */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{
          display: 'block',
          marginBottom: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.9)'
        }}>
          💡 Dime un dato curioso de ti
        </label>
        <textarea
          value={datoCurioso}
          onChange={(e) => setDatoCurioso(e.target.value)}
          placeholder="Cuéntanos algo interesante sobre ti..."
          maxLength={500}
          rows={4}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.95rem',
            lineHeight: '1.5',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
        <div style={{
          marginTop: '0.25rem',
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'right'
        }}>
          {datoCurioso.length}/500 caracteres
        </div>
      </div>

      {/* Qué te gusta bailar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{
          display: 'block',
          marginBottom: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.9)'
        }}>
          💃 ¿Qué es lo que más te gusta bailar?
        </label>
        <textarea
          value={gustaBailar}
          onChange={(e) => setGustaBailar(e.target.value)}
          placeholder="Cuéntanos tu estilo favorito de baile..."
          maxLength={500}
          rows={4}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.95rem',
            lineHeight: '1.5',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
        <div style={{
          marginTop: '0.25rem',
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'right'
        }}>
          {gustaBailar.length}/500 caracteres
        </div>
      </div>

      {/* Botón Guardar */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: isSaving 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: isSaving ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          opacity: isSaving ? 0.6 : 1
        }}
      >
        {isSaving ? '⏳ Guardando...' : '💾 Guardar Preguntas'}
      </button>
    </div>
  );
};
```

### **Paso 3: Integrar en el Editor del Perfil**

En `apps/web/src/screens/app/Profile.tsx`, importar y usar el componente:

```typescript
import { ProfileQuestionsEditor } from '@/components/profile/ProfileQuestionsEditor';

// ... dentro del render, en la sección de edición:
{isEditing && (
  <>
    {/* ... otros campos ... */}
    
    <ProfileQuestionsEditor />
    
    {/* ... más campos ... */}
  </>
)}
```

---

## 🔍 Diagnóstico y Verificación

### **1. Verificar estructura actual**

```sql
-- Ver cómo están guardadas las redes sociales
SELECT 
  user_id,
  display_name,
  redes_sociales,
  respuestas->'redes' as respuestas_redes,
  respuestas->'dato_curioso' as dato_curioso,
  respuestas->'gusta_bailar' as gusta_bailar
FROM public.profiles_user
WHERE user_id = 'TU_USER_ID_AQUI';
```

### **2. Después de ejecutar el script SQL**

```sql
-- Verificar que el trigger funciona
UPDATE public.profiles_user
SET redes_sociales = jsonb_build_object(
  'instagram', 'test_instagram',
  'tiktok', 'test_tiktok'
)
WHERE user_id = 'TU_USER_ID_AQUI';

-- Ver si se sincronizó a respuestas.redes
SELECT 
  redes_sociales,
  respuestas->'redes' as respuestas_redes
FROM public.profiles_user
WHERE user_id = 'TU_USER_ID_AQUI';
```

---

## 📊 Estado Actual vs Estado Deseado

### **Estado Actual (❌)**
```json
{
  "redes_sociales": {},  // ❌ Vacío
  "respuestas": {
    "redes": {           // ✅ Aquí están los datos
      "instagram": "@usuario",
      "tiktok": "@usuario"
    }
    // ❌ dato_curioso y gusta_bailar no existen
  }
}
```

### **Estado Deseado (✅)**
```json
{
  "redes_sociales": {     // ✅ Datos aquí
    "instagram": "@usuario",
    "tiktok": "@usuario"
  },
  "respuestas": {
    "redes": {           // ✅ Sincronizado automáticamente
      "instagram": "@usuario",
      "tiktok": "@usuario"
    },
    "dato_curioso": "Me encanta bailar desde los 5 años...",  // ✅
    "gusta_bailar": "Salsa y bachata son mis favoritos..."    // ✅
  }
}
```

---

## 🎯 Pasos para Completar la Solución

1. ✅ **Ejecutar** `supabase/fix_user_profile_data_sync.sql` en Supabase
2. ⏳ **Crear** `ProfileQuestionsEditor.tsx` (código arriba)
3. ⏳ **Integrar** en `Profile.tsx`
4. ✅ **Verificar** que los datos se guardan correctamente
5. ✅ **Actualizar** `BioSection.tsx` para leer de ambas fuentes

---

## 🚀 Próximos Pasos

1. Ejecuta el script SQL primero
2. Verifica el diagnóstico
3. Crea el componente `ProfileQuestionsEditor`
4. Intégralo en el editor del perfil
5. Prueba que todo funcione correctamente

¿Necesitas ayuda con algún paso específico?

