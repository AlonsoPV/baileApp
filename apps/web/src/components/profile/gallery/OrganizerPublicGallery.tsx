import React from "react";
import ImageWithFallback from "../../ImageWithFallback";
import GalleryLightbox from "./GalleryLightbox";
import { colors, typography, spacing, borderRadius } from "../../../theme/colors";

type OrganizerPublicGalleryProps = {
  photos: string[];
  title?: string;
  maxVisibleThumbs?: number;
  /** Stable DOM id for audits / e2e (default: organizer-profile-photo-gallery). */
  galleryDomId?: string;
};

export default function OrganizerPublicGallery({
  photos,
  title = "Galería de fotos",
  maxVisibleThumbs = 4,
  galleryDomId = "organizer-profile-photo-gallery",
}: OrganizerPublicGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  if (!photos.length) return null;

  const hero = photos[0];
  const thumbs = photos.slice(1, maxVisibleThumbs + 1);
  const hiddenCount = Math.max(0, photos.length - 1 - thumbs.length);

  const imageAreaBg = "rgba(7, 12, 20, 0.92)";

  return (
    <section
      id={galleryDomId}
      data-baile-id={galleryDomId}
      data-test-id={galleryDomId}
      className="glass-card"
      style={{
        marginBottom: spacing[8],
        padding: spacing[8],
        borderRadius: borderRadius["2xl"],
      }}
    >
      {/* Mismo patrón que «Próximas Fechas»: icono circular + título */}
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
            {title}
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
            {photos.length} {photos.length === 1 ? "foto" : "fotos"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setIndex(0);
          setLightboxOpen(true);
        }}
        style={{
          width: "100%",
          padding: 0,
          border: "none",
          borderRadius: 16,
          overflow: "hidden",
          cursor: "pointer",
          marginBottom: thumbs.length ? 8 : 0,
          background: imageAreaBg,
          display: "block",
        }}
      >
        <ImageWithFallback
          src={hero}
          alt="Foto principal"
          style={{
            width: "100%",
            aspectRatio: "16 / 10",
            objectFit: "contain",
            objectPosition: "center",
            display: "block",
            background: imageAreaBg,
          }}
        />
      </button>

      {thumbs.length ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {thumbs.map((src, thumbIndex) => {
              const absoluteIndex = thumbIndex + 1;
              const isLastVisible = thumbIndex === thumbs.length - 1 && hiddenCount > 0;
              return (
                <button
                  type="button"
                  key={`${src}-${absoluteIndex}`}
                  onClick={() => {
                    setIndex(absoluteIndex);
                    setLightboxOpen(true);
                  }}
                  style={{
                    width: "100%",
                    padding: 0,
                    border: "none",
                    borderRadius: 10,
                    overflow: "hidden",
                    cursor: "pointer",
                    position: "relative",
                    background: imageAreaBg,
                  }}
                >
                  <ImageWithFallback
                    src={src}
                    alt={`Foto ${absoluteIndex + 1}`}
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      objectFit: "contain",
                      objectPosition: "center",
                      display: "block",
                      background: imageAreaBg,
                    }}
                  />
                  {isLastVisible ? (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.45)",
                        display: "grid",
                        placeItems: "center",
                        color: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      +{hiddenCount}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
          {hiddenCount > 0 ? (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
              <button
                type="button"
                onClick={() => {
                  setIndex(thumbs.length + 1);
                  setLightboxOpen(true);
                }}
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Ver más fotos
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      <GalleryLightbox
        images={photos}
        currentIndex={index}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onChangeIndex={setIndex}
      />
    </section>
  );
}
