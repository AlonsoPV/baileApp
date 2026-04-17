# Formulario de creación / edición de clases (perfil academia y maestro)

Este documento indica **dónde está el código** del formulario de clases para poder analizarlo sin buscar en todo el monorepo.

## Resumen del flujo

1. **`ProfileEditorCrearClaseForm`** — Envoltorio compartido: mensajes de estado, aviso si el perfil aún no está guardado, y el componente real del formulario.
2. **`CrearClase`** — Formulario completo (campos, validación, UI).
3. **`AcademyProfileEditor`** / **`TeacherProfileEditor`** — Preparan datos (`ritmos`, `zonas`, `ubicaciones`, etc.) y definen `onSubmit` / `onCancel` para persistir en `cronograma` y `costos`.

---

## 1. Envoltorio compartido (recomendado empezar aquí)

**Archivo:** `apps/web/src/components/profile/ProfileEditorCrearClaseForm.tsx`

Incluye props TypeScript, textos por tipo de perfil y el render que monta `CrearClase`.

```tsx
import React from "react";
import CrearClase, { type CrearClaseValue } from "../events/CrearClase";

type Tag = { id: number; nombre: string };

type ZonaTag = { id: number; nombre: string; slug?: string; tipo?: string };

export type ProfileEditorClassStatus = { type: "ok" | "err"; text: string } | null;

export type ProfileEditorCrearClaseFormProps = {
  profileKind: "academy" | "teacher";
  /** Perfil ya persistido (academy / teacher); si es false se muestra el aviso de guardar primero. */
  profileSaved: boolean;
  statusMsg: ProfileEditorClassStatus;
  ritmos: Tag[];
  zonas: Tag[];
  zonaTags?: ZonaTag[];
  selectedZonaIds: number[];
  locations: Array<{
    id?: string;
    nombre?: string;
    direccion?: string;
    referencias?: string;
    zonas?: number[] | null;
  }>;
  editingIndex: number | null;
  editInitial: CrearClaseValue | undefined;
  title: string;
  onCancel: () => void;
  onSubmit: (v: CrearClaseValue) => void | Promise<void>;
};

const COPY = {
  academy: {
    saveTitle: "Debes guardar el perfil de la academia primero antes de crear clases",
    saveSubtitle: "Completa el nombre de la academia y haz clic en 💾 Guardar arriba",
  },
  teacher: {
    saveTitle: "Debes guardar el perfil del maestro primero antes de crear clases",
    saveSubtitle: "Completa el nombre del maestro y haz clic en 💾 Guardar arriba",
  },
} as const;

/**
 * Bloque compartido entre AcademyProfileEditor y TeacherProfileEditor:
 * mensaje de estado, aviso si falta guardar perfil, y el formulario CrearClase.
 */
export default function ProfileEditorCrearClaseForm({
  profileKind,
  profileSaved,
  statusMsg,
  ritmos,
  zonas,
  zonaTags,
  selectedZonaIds,
  locations,
  editingIndex,
  editInitial,
  title,
  onCancel,
  onSubmit,
}: ProfileEditorCrearClaseFormProps) {
  const copy = COPY[profileKind];

  return (
    <>
      {statusMsg && (
        <div
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 10,
            border:
              statusMsg.type === "ok"
                ? "1px solid rgba(16,185,129,0.4)"
                : "1px solid rgba(239,68,68,0.4)",
            background:
              statusMsg.type === "ok"
                ? "rgba(16,185,129,0.12)"
                : "rgba(239,68,68,0.12)",
            color: "#fff",
            fontSize: 14,
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {!profileSaved && (
        <div
          style={{
            padding: "1.5rem",
            marginBottom: "1rem",
            background: "rgba(255, 140, 66, 0.15)",
            border: "2px solid rgba(255, 140, 66, 0.3)",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚠️</div>
          <p style={{ fontSize: "1rem", fontWeight: "600", margin: 0 }}>{copy.saveTitle}</p>
          <p style={{ fontSize: "0.875rem", opacity: 0.8, margin: "0.5rem 0 0 0" }}>{copy.saveSubtitle}</p>
        </div>
      )}

      {profileSaved && (
        <CrearClase
          ritmos={ritmos}
          zonas={zonas}
          zonaTags={zonaTags}
          selectedZonaIds={selectedZonaIds}
          locations={locations}
          editIndex={editingIndex}
          editValue={editInitial}
          title={title}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      )}
    </>
  );
}
```

*(Copia alineada con el repo; si el archivo fuente cambia, la referencia canónica sigue siendo la ruta anterior.)*

---

## 2. Formulario visual y lógica de campos

**Archivo:** `apps/web/src/components/events/CrearClase.tsx` (~1423 líneas)

| Zona del archivo | Contenido |
|------------------|-----------|
| ~L56–L102 | Tipo `CrearClaseValue` y `Props` del componente (contrato del payload que sale en `onSubmit`). |
| ~L274 en adelante | Implementación del formulario (`React.memo`, estado local, validación, JSX). |

Para analizar UX, validaciones y campos concretos, abre este archivo en el editor y navega desde el componente principal (~L274).

---

## 3. Uso en el editor de academia

**Archivo:** `apps/web/src/screens/profile/AcademyProfileEditor.tsx`

| Qué buscar | Líneas orientativas |
|-------------|---------------------|
| Datos memoizados para el form (`ritmosForCrearClase`, `zonasForCrearClase`, `locationsForCrearClase`) | ~1461–1499 |
| Cancelar / enviar (`handleCrearClaseCancel`, `handleCrearClaseSubmit`) | ~1501–1665 |
| JSX: `<ProfileEditorCrearClaseForm … />` | ~2496–2510 |

---

## 4. Uso en el editor de maestro

**Archivo:** `apps/web/src/screens/profile/TeacherProfileEditor.tsx`

| Qué buscar | Líneas orientativas |
|-------------|---------------------|
| Cancelar / enviar (`handleClassCancel`, `handleClassSubmit`) | ~1690–1855 |
| `ritmosForCrearClase` y ubicaciones | ~1882+ |
| JSX: `<ProfileEditorCrearClaseForm … />` | ~2465–2479 |

---

## 5. Contrato de datos al guardar

Lo que devuelve el formulario al padre sigue el tipo **`CrearClaseValue`** (`CrearClase.tsx`). Los editores transforman ese objeto en ítems de **`cronograma`** y filas de **`costos`** dentro de `handleCrearClaseSubmit` / `handleClassSubmit`.

Si analizas persistencia o inconsistencias DB, revisa además:

- `autoSaveClasses` en cada editor (llamada a `upsert` con `cronograma` y `costos`).

---

## 6. Lista de archivos (checklist de análisis)

- [ ] `apps/web/src/components/profile/ProfileEditorCrearClaseForm.tsx`
- [ ] `apps/web/src/components/events/CrearClase.tsx`
- [ ] `apps/web/src/screens/profile/AcademyProfileEditor.tsx` (handlers + uso del formulario)
- [ ] `apps/web/src/screens/profile/TeacherProfileEditor.tsx` (handlers + uso del formulario)

Las líneas de las tablas son **orientativas**; tras refactors pueden desplazarse ligeramente. Usa búsqueda por símbolo (`ProfileEditorCrearClaseForm`, `handleCrearClaseSubmit`, `handleClassSubmit`) en el IDE.
