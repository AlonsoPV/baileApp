import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** id for aria-labelledby on the dialog */
  ariaLabelledBy?: string;
  /** id for aria-describedby on the dialog */
  ariaDescribedBy?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  ariaLabelledBy,
  ariaDescribedBy,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousActiveElement.current = document.activeElement as HTMLElement | null;
    const focusable =
      overlayRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    focusable?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy ?? (title ? "modal-title" : undefined)}
      aria-describedby={ariaDescribedBy}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Enter" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Cerrar modal"
      />
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#1a0a2e] shadow-xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <h2 id="modal-title" className="text-xl font-semibold text-white">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {!title && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );

  const root = document.getElementById("overlay-root") ?? document.body;
  return createPortal(content, root);
}
