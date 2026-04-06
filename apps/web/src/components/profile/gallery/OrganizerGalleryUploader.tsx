import React from "react";

type OrganizerGalleryUploaderProps = {
  disabled?: boolean;
  maxSelectable: number;
  onFilesSelected: (files: File[]) => void;
  onValidationInfo?: (message: string) => void;
};

const MAX_FILE_MB = 12;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function OrganizerGalleryUploader({
  disabled,
  maxSelectable,
  onFilesSelected,
  onValidationInfo,
}: OrganizerGalleryUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const triggerPicker = React.useCallback(() => {
    if (disabled || maxSelectable <= 0) return;
    inputRef.current?.click();
  }, [disabled, maxSelectable]);

  return (
    <div
      style={{
        border: "1px dashed rgba(255,255,255,0.3)",
        borderRadius: 16,
        padding: 14,
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <button
        type="button"
        onClick={triggerPicker}
        disabled={disabled || maxSelectable <= 0}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.2)",
          background:
            disabled || maxSelectable <= 0
              ? "rgba(255,255,255,0.08)"
              : "linear-gradient(135deg, #1E88E5, #00BCD4)",
          color: "#fff",
          fontWeight: 700,
          cursor: disabled || maxSelectable <= 0 ? "not-allowed" : "pointer",
        }}
      >
        {maxSelectable <= 0 ? "Límite de fotos alcanzado" : "Agregar fotos"}
      </button>
      <p style={{ margin: "10px 0 0", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
        JPG, PNG o WEBP. Máx {MAX_FILE_MB}MB por imagen. Puedes seleccionar varias.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(event) => {
          const list = Array.from(event.target.files || []);
          event.currentTarget.value = "";
          if (!list.length) return;
          const valid: File[] = [];
          const unique = new Set<string>();
          let rejectedByType = 0;
          let rejectedBySize = 0;
          let rejectedByDuplicates = 0;
          for (const file of list) {
            const key = `${file.name}-${file.size}-${file.lastModified}`;
            if (unique.has(key)) {
              rejectedByDuplicates += 1;
              continue;
            }
            unique.add(key);
            if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
              rejectedByType += 1;
              continue;
            }
            if (file.size > MAX_FILE_MB * 1024 * 1024) {
              rejectedBySize += 1;
              continue;
            }
            valid.push(file);
            if (valid.length >= maxSelectable) break;
          }
          if ((rejectedByType || rejectedBySize || rejectedByDuplicates) && onValidationInfo) {
            const parts = [];
            if (rejectedByType) parts.push(`${rejectedByType} por formato no permitido`);
            if (rejectedBySize) parts.push(`${rejectedBySize} por tamaño`);
            if (rejectedByDuplicates) parts.push(`${rejectedByDuplicates} duplicadas`);
            onValidationInfo(`Se omitieron archivos: ${parts.join(", ")}.`);
          }
          if (valid.length) onFilesSelected(valid);
        }}
      />
    </div>
  );
}
