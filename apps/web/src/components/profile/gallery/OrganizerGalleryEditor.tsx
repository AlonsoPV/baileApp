import React from "react";
import { useToast } from "../../Toast";
import GalleryLightbox from "./GalleryLightbox";
import OrganizerGalleryUploader from "./OrganizerGalleryUploader";
import OrganizerGalleryGrid from "./OrganizerGalleryGrid";
import {
  getAvailablePhotoSlots,
  getOrganizerPhotos,
  normalizePhotoUrl,
  swapPhotoSlots,
} from "./galleryUtils";
import type { UploadQueueItem } from "./galleryTypes";
import { colors, typography, spacing, borderRadius } from "../../../theme/colors";

type OrganizerGalleryEditorProps = {
  media: any[];
  onUploadPhoto: (file: File, slot: string) => Promise<void>;
  onRemovePhoto: (slot: string) => Promise<void>;
  onReplaceMedia: (nextMedia: any[]) => Promise<void>;
  busySlots?: Set<string>;
};

function makeQueueId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export default function OrganizerGalleryEditor({
  media,
  onUploadPhoto,
  onRemovePhoto,
  onReplaceMedia,
  busySlots = new Set<string>(),
}: OrganizerGalleryEditorProps) {
  const { showToast } = useToast();
  const [queue, setQueue] = React.useState<UploadQueueItem[]>([]);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const queueUrlsRef = React.useRef<string[]>([]);

  const photos = React.useMemo(() => getOrganizerPhotos(media), [media]);
  const lightboxImages = React.useMemo(() => photos.map((item) => normalizePhotoUrl(item.url)).filter(Boolean), [photos]);

  React.useEffect(() => {
    return () => {
      for (const url of queueUrlsRef.current) URL.revokeObjectURL(url);
      queueUrlsRef.current = [];
    };
  }, []);

  const setQueuePatch = React.useCallback(
    (id: string, patch: Partial<UploadQueueItem>) => {
      setQueue((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    },
    []
  );

  const handleFilesSelected = React.useCallback(
    async (files: File[]) => {
      const freeSlots = getAvailablePhotoSlots(media);
      if (!freeSlots.length) {
        showToast("Ya alcanzaste el límite de fotos disponibles.", "info");
        return;
      }

      const toQueue = files.slice(0, freeSlots.length).map((file, idx) => {
        const previewUrl = URL.createObjectURL(file);
        queueUrlsRef.current.push(previewUrl);
        return {
          id: makeQueueId(),
          file,
          slot: freeSlots[idx],
          previewUrl,
          progress: 6,
          status: "queued" as const,
        };
      });

      if (!toQueue.length) return;
      setQueue((current) => [...current, ...toQueue]);

      for (const item of toQueue) {
        try {
          setQueuePatch(item.id, { status: "uploading", progress: 26 });
          await new Promise((resolve) => setTimeout(resolve, 80));
          setQueuePatch(item.id, { progress: 56 });
          await onUploadPhoto(item.file, item.slot);
          setQueuePatch(item.id, { progress: 100, status: "success" });
        } catch (error) {
          setQueuePatch(item.id, {
            progress: 100,
            status: "error",
            error: error instanceof Error ? error.message : "Error al subir",
          });
        }
      }

      window.setTimeout(() => {
        setQueue((current) => current.filter((entry) => entry.status !== "success"));
      }, 1200);
    },
    [media, onUploadPhoto, setQueuePatch, showToast]
  );

  const handleMove = React.useCallback(
    async (slot: string, direction: "left" | "right") => {
      const index = photos.findIndex((item) => item.slot === slot);
      if (index < 0) return;
      const targetIndex = direction === "left" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= photos.length) return;
      const targetSlot = photos[targetIndex].slot;
      const next = swapPhotoSlots(media, slot, targetSlot);
      await onReplaceMedia(next);
    },
    [media, onReplaceMedia, photos]
  );

  const handleSetPrimary = React.useCallback(
    async (slot: string) => {
      if (slot === "p1") return;
      const next = swapPhotoSlots(media, slot, "p1");
      await onReplaceMedia(next);
      showToast("Foto principal actualizada.", "success");
    },
    [media, onReplaceMedia, showToast]
  );

  const onOpenPhoto = React.useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  return (
    <section
      className="org-editor-card"
      style={{
        marginBottom: spacing[8],
        padding: spacing[8],
        borderRadius: borderRadius["2xl"],
      }}
    >
      {/* Mismo patrón de header que «Próximas Fechas» en perfil organizador */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing[4],
          marginBottom: spacing[6],
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: colors.gradients.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: typography.fontSize["2xl"],
            boxShadow: colors.shadows.glow,
            flexShrink: 0,
          }}
        >
          📷
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 className="section-title" style={{ margin: 0 }}>
            Galería de fotos
          </h3>
          <p
            style={{
              fontSize: typography.fontSize.sm,
              opacity: 0.85,
              margin: `${spacing[1]} 0 0`,
              fontWeight: 500,
              color: colors.light,
            }}
          >
            Sube, ordena y define tu portada sin salir del editor.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <OrganizerGalleryUploader
          disabled={queue.some((item) => item.status === "uploading")}
          maxSelectable={Math.max(0, 10 - photos.length)}
          onFilesSelected={handleFilesSelected}
          onValidationInfo={(message) => showToast(message, "info")}
        />

        <OrganizerGalleryGrid
          photos={photos}
          queue={queue}
          busySlots={busySlots}
          onRemove={onRemovePhoto}
          onMove={handleMove}
          onSetPrimary={handleSetPrimary}
          onOpenPhoto={onOpenPhoto}
        />
      </div>

      <GalleryLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onChangeIndex={setLightboxIndex}
      />
    </section>
  );
}
