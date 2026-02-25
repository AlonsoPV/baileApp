// path: src/pages/profile/EventDateEditor.tsx
import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useDatesByParent, useCreateDate, useUpdateDate } from "../../hooks/useEvents";
import { useEventDateMedia } from "../../hooks/useEventDateMedia";
import { useToast } from "../../components/Toast";
import EventCreateForm from "../../components/events/EventCreateForm";
import { PhotoManagementSection } from "../../components/profile/PhotoManagementSection";
import { VideoManagementSection } from "../../components/profile/VideoManagementSection";
import { ensureMaxVideoDuration } from "../../utils/videoValidation";

const colors = {
  coral: "#FF3D57",
  orange: "#FF8C42",
  yellow: "#FFD166",
  blue: "#1E88E5",
  dark: "#121212",
  light: "#F5F5F5",
};

export const EventDateEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id, parentId } = useParams<{ id: string; parentId: string }>();
  const isEditing = !!id;

  const idNum = useMemo(() => (id ? parseInt(id, 10) : null), [id]);
  const parentIdNumFromRoute = useMemo(() => (parentId ? parseInt(parentId, 10) : null), [parentId]);

  const { data: organizer } = useMyOrganizer();
  const { data: dates } = useDatesByParent(parentIdNumFromRoute ?? undefined);
  const createMutation = useCreateDate();
  const updateMutation = useUpdateDate();
  const { showToast } = useToast();

  const currentDate = useMemo(() => {
    if (!isEditing || !idNum || !Array.isArray(dates)) return null;
    return dates.find((d: any) => Number(d.id) === Number(idNum)) ?? null;
  }, [isEditing, idNum, dates]);

  const parentIdNum = parentIdNumFromRoute ?? (currentDate as any)?.parent_id ?? null;

  // Media management (DB: events_date.media)
  const { media, add, remove } = useEventDateMedia((currentDate as any)?.id);
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

  const uploadFile = async (file: File, slot: string, kind: "photo" | "video") => {
    if (kind === "video") {
      try {
        await ensureMaxVideoDuration(file, 25);
      } catch (error) {
        console.error("[EventDateEditor] Video demasiado largo:", error);
        showToast(error instanceof Error ? error.message : "El video debe durar máximo 25 segundos", "error");
        return;
      }
    }

    setUploading((prev) => ({ ...prev, [slot]: true }));
    try {
      await add.mutateAsync({ file, slot });
      showToast(`${kind === "photo" ? "Foto" : "Video"} subido correctamente`, "success");
    } catch (error) {
      console.error("Error uploading file:", error);
      showToast("Error al subir el archivo", "error");
    } finally {
      setUploading((prev) => ({ ...prev, [slot]: false }));
    }
  };

  const removeFile = async (slot: string) => {
    try {
      const list = Array.isArray(media) ? media : [];
      const mediaItem = list.find((m: any) => m?.slot === slot);
      if (mediaItem?.id) {
        await remove.mutateAsync(mediaItem.id);
        showToast("Archivo eliminado", "success");
      } else {
        showToast("No se encontró el archivo", "error");
      }
    } catch (error) {
      console.error("Error removing file:", error);
      showToast("Error al eliminar el archivo", "error");
    }
  };

  const handleSubmit = async (values: any) => {
    if (!parentIdNum) throw new Error("ID del evento padre no válido");

    // Normalizaciones defensivas (evitan borrar datos si values viene incompleto)
    const nextCronograma =
      values?.cronograma ?? (isEditing ? (currentDate as any)?.cronograma : undefined) ?? [];
    const nextCostos =
      values?.costos ?? (isEditing ? (currentDate as any)?.costos : undefined) ?? [];

    const basePayload = {
      nombre: values?.nombre || null,
      biografia: values?.biografia || null,
      djs: values?.djs || null,
      telefono_contacto: values?.telefono_contacto || null,
      mensaje_contacto: values?.mensaje_contacto || null,

      fecha: values?.fecha || null,
      dia_semana: typeof values?.dia_semana === "number" ? values.dia_semana : null,

      hora_inicio: values?.hora_inicio || null,
      hora_fin: values?.hora_fin || null,

      lugar: values?.lugar || null,
      direccion: values?.direccion || null,
      ciudad: values?.ciudad || null,
      zona: values?.zona ?? null,

      estilos: Array.isArray(values?.estilos) ? values.estilos : (isEditing ? (currentDate as any)?.estilos ?? [] : []),
      ritmos_seleccionados: Array.isArray(values?.ritmos_seleccionados)
        ? values.ritmos_seleccionados
        : (isEditing ? (currentDate as any)?.ritmos_seleccionados ?? [] : []),
      zonas: Array.isArray(values?.zonas) ? values.zonas : (isEditing ? (currentDate as any)?.zonas ?? [] : []),

      ubicaciones: Array.isArray(values?.ubicaciones)
        ? values.ubicaciones
        : (isEditing ? (currentDate as any)?.ubicaciones ?? [] : []),

      referencias: values?.referencias || null,
      requisitos: values?.requisitos || null,

      // ✅ IMPORTANT: do NOT overwrite with [] if values is missing
      cronograma: Array.isArray(nextCronograma) ? nextCronograma : [],
      costos: Array.isArray(nextCostos) ? nextCostos : [],

      flyer_url: values?.flyer_url || null,
      estado_publicacion: values?.estado_publicacion || "borrador",

      // ❌ IMPORTANT: NO mandar `media` aquí.
      // El media se gestiona con useEventDateMedia (events_date.media).
    };

    if (isEditing && currentDate) {
      await updateMutation.mutateAsync({
        id: (currentDate as any).id,
        ...basePayload,
      });
    } else {
      const createPayload = {
        organizer_id: (organizer as any)?.id ?? null,
        parent_id: parentIdNum,
        ...basePayload,
      };
      await createMutation.mutateAsync(createPayload as any);
    }
  };

  const handleSuccess = (_dateId: number) => {
    if (parentIdNum) navigate(`/profile/organizer/events/${parentIdNum}`);
    else navigate("/profile/organizer/edit");
  };

  const handleCancel = () => {
    if (parentIdNum) navigate(`/profile/organizer/events/${parentIdNum}`);
    else navigate("/profile/organizer/edit");
  };

  if (!organizer) {
    return (
      <div
        style={{
          padding: "48px 24px",
          textAlign: "center",
          color: colors.light,
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <h2 style={{ fontSize: "2rem", marginBottom: "16px" }}>No tienes organizador</h2>
        <p style={{ marginBottom: "24px", opacity: 0.7 }}>Primero debes crear tu perfil de organizador</p>
        <button
          onClick={() => navigate("/profile/organizer/edit")}
          style={{
            padding: "14px 28px",
            borderRadius: "50px",
            border: "none",
            background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            color: colors.light,
            fontSize: "1rem",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(30,136,229,0.5)",
          }}
        >
          🎤 Crear Organizador
        </button>
      </div>
    );
  }

  if (!parentIdNum) {
    return (
      <div
        style={{
          padding: "48px 24px",
          textAlign: "center",
          color: colors.light,
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <h2 style={{ fontSize: "2rem", marginBottom: "16px" }}>Evento padre no encontrado</h2>
        <p style={{ marginBottom: "24px", opacity: 0.7 }}>No se pudo determinar el evento padre para esta fecha</p>
        <button
          onClick={() => navigate("/profile/organizer/edit")}
          style={{
            padding: "14px 28px",
            borderRadius: "50px",
            border: "none",
            background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            color: colors.light,
            fontSize: "1rem",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(30,136,229,0.5)",
          }}
        >
          ← Volver al Organizador
        </button>
      </div>
    );
  }

  return (
    <div
      className="date-editor-container"
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        padding: "24px 0",
      }}
    >
      <style>{`
        .date-editor-container { padding: 24px 0; }
        .date-editor-inner { max-width: 800px; margin: 0 auto; padding: 0 24px; }
        .date-media-section { margin-top: 48px; }

        @media (max-width: 768px) {
          .date-editor-container { padding: 16px 0 !important; }
          .date-editor-inner { padding: 0 16px !important; }
          .date-media-section { margin-top: 24px !important; }
        }
        @media (max-width: 480px) {
          .date-editor-container { padding: 12px 0 !important; }
          .date-editor-inner { padding: 0 12px !important; }
        }
      `}</style>

      <EventCreateForm
        mode="date"
        date={currentDate as any}
        parentId={parentIdNum}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        showHeader={true}
      />

      {/* Media sections only for editing an existing date */}
      {isEditing && currentDate && (
        <div className="date-editor-inner">
          <div className="date-media-section">
            <PhotoManagementSection
              media={media as any}
              uploading={uploading}
              uploadFile={uploadFile}
              removeFile={removeFile}
              title="📷 Galería de Fotos de la Fecha"
              description="Sube fotos promocionales de esta fecha específica"
              slots={["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10"]}
              isMainPhoto={false}
            />
          </div>

          <div className="date-media-section">
            <VideoManagementSection
              media={media as any}
              uploading={uploading}
              uploadFile={uploadFile}
              removeFile={removeFile}
              title="🎥 Videos de la Fecha"
              description="Sube videos promocionales y demostraciones de esta fecha"
              slots={["v1", "v2", "v3"]}
            />
          </div>
        </div>
      )}
    </div>
  );
};