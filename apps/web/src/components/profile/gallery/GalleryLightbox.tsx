import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import ImageWithFallback from "../../ImageWithFallback";

type GalleryLightboxProps = {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
};

export default function GalleryLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onChangeIndex,
}: GalleryLightboxProps) {
  const hasMany = images.length > 1;
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const goPrev = React.useCallback(() => {
    if (!images.length) return;
    onChangeIndex((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onChangeIndex]);

  const goNext = React.useCallback(() => {
    if (!images.length) return;
    onChangeIndex((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onChangeIndex]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (!hasMany) return;
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, hasMany, isOpen, onClose]);

  if (!images.length) return null;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(4, 10, 22, 0.93)",
            backdropFilter: "blur(6px)",
            display: "grid",
            placeItems: "center",
            padding: "16px",
          }}
          onClick={onClose}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            touchStartX.current = touch.clientX;
            touchStartY.current = touch.clientY;
          }}
          onTouchEnd={(event) => {
            if (!hasMany) return;
            if (touchStartX.current === null || touchStartY.current === null) return;
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - touchStartX.current;
            const deltaY = touch.clientY - touchStartY.current;
            touchStartX.current = null;
            touchStartY.current = null;
            if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;
            if (deltaX < 0) goNext();
            if (deltaX > 0) goPrev();
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              display: "grid",
              gap: "12px",
            }}
          >
            <div
              style={{
                position: "relative",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.35)",
                minHeight: "280px",
              }}
            >
              <ImageWithFallback
                src={images[currentIndex]}
                alt={`Foto ${currentIndex + 1}`}
                style={{
                  width: "100%",
                  height: "min(80vh, 720px)",
                  objectFit: "contain",
                  background: "#0a0f19",
                }}
              />

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar galería"
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(13, 20, 34, 0.85)",
                  color: "#fff",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ×
              </button>

              {hasMany ? (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Foto anterior"
                    style={navButtonStyle("left")}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Siguiente foto"
                    style={navButtonStyle("right")}
                  >
                    ›
                  </button>
                </>
              ) : null}
            </div>

            <div style={{ textAlign: "center", color: "#d8e0ef", fontSize: 13, fontWeight: 600 }}>
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function navButtonStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    ...(side === "left" ? { left: 10 } : { right: 10 }),
    width: 42,
    height: 42,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(13, 20, 34, 0.85)",
    color: "#fff",
    fontSize: 24,
    cursor: "pointer",
  };
}
