import React from "react";
import { AlertTriangle } from "lucide-react";
import CrearClase, { type CrearClaseValue } from "../events/CrearClase";
import "@/styles/crearClase.css";

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
        <div className="cc__warn">
          <div className="cc__warn-icon">
            <AlertTriangle />
          </div>
          <div>
            <div className="cc__warn-title">{copy.saveTitle}</div>
            <div className="cc__warn-sub">{copy.saveSubtitle}</div>
          </div>
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
