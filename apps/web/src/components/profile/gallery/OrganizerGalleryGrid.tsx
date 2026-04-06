import React from "react";
import ImageWithFallback from "../../ImageWithFallback";
import type { OrganizerGalleryItem, UploadQueueItem } from "./galleryTypes";
import { normalizePhotoUrl } from "./galleryUtils";

type OrganizerGalleryGridProps = {
  photos: OrganizerGalleryItem[];
  queue: UploadQueueItem[];
  onRemove: (slot: string) => void;
  onMove: (slot: string, direction: "left" | "right") => void;
  onSetPrimary: (slot: string) => void;
  onOpenPhoto: (index: number) => void;
  busySlots: Set<string>;
};

export default function OrganizerGalleryGrid({
  photos,
  queue,
  onRemove,
  onMove,
  onSetPrimary,
  onOpenPhoto,
  busySlots,
}: OrganizerGalleryGridProps) {
  if (!photos.length && !queue.length) {
    return (
      <div
        style={{
          borderRadius: 16,
          padding: "24px 16px",
          border: "1px dashed rgba(255,255,255,0.25)",
          background: "rgba(255,255,255,0.03)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
        <h4 style={{ margin: 0, color: "#fff" }}>Aún no hay fotos en tu galería</h4>
        <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
          Agrega imágenes para mejorar cómo se ve tu perfil público.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {!!photos.length && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
          {photos.map((photo, index) => {
            const isPrimary = photo.slot === "p1";
            const isBusy = busySlots.has(photo.slot);
            return (
              <div
                key={photo.id}
                style={{
                  borderRadius: 14,
                  overflow: "hidden",
                  border: isPrimary
                    ? "2px solid rgba(39, 195, 255, 0.9)"
                    : "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.24)",
                }}
              >
                <button
                  type="button"
                  onClick={() => onOpenPhoto(index)}
                  style={{
                    width: "100%",
                    padding: 0,
                    border: "none",
                    cursor: "pointer",
                    background: "transparent",
                  }}
                >
                  <ImageWithFallback
                    src={normalizePhotoUrl(photo.url)}
                    alt={`Foto ${index + 1}`}
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      objectFit: "contain",
                      background: "rgba(7, 12, 20, 0.92)",
                      display: "block",
                    }}
                  />
                </button>
                <div style={{ padding: 8, display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#dce6fa", fontSize: 12, fontWeight: 700 }}>
                      {isPrimary ? "Principal" : photo.slot.toUpperCase()}
                    </span>
                    {isPrimary ? (
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 999,
                          background: "rgba(39,195,255,0.18)",
                          color: "#8ddfff",
                          border: "1px solid rgba(39,195,255,0.45)",
                        }}
                      >
                        Portada
                      </span>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <SmallAction disabled={isBusy || index === 0} onClick={() => onMove(photo.slot, "left")} label="←" />
                    <SmallAction
                      disabled={isBusy || index === photos.length - 1}
                      onClick={() => onMove(photo.slot, "right")}
                      label="→"
                    />
                    <SmallAction disabled={isBusy || isPrimary} onClick={() => onSetPrimary(photo.slot)} label="★" />
                    <SmallAction disabled={isBusy} onClick={() => onRemove(photo.slot)} label="🗑" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!!queue.length && (
        <div style={{ display: "grid", gap: 8 }}>
          {queue.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: "grid",
                gridTemplateColumns: "52px 1fr",
                gap: 10,
                alignItems: "center",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.16)",
                padding: 8,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <img
                src={entry.previewUrl}
                alt={entry.file.name}
                style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover" }}
              />
              <div>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  {entry.file.name}
                </div>
                <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${entry.progress}%`,
                      height: "100%",
                      background:
                        entry.status === "error"
                          ? "linear-gradient(90deg, #ff5f7a, #ff3562)"
                          : "linear-gradient(90deg, #4cb8ff, #00c9a7)",
                    }}
                  />
                </div>
                <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
                  {entry.status === "queued" ? "En cola" : null}
                  {entry.status === "uploading" ? "Subiendo..." : null}
                  {entry.status === "success" ? "Subida completada" : null}
                  {entry.status === "error" ? entry.error || "No se pudo subir" : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SmallAction({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        minHeight: 30,
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.2)",
        background: disabled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)",
        color: "#fff",
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );
}
