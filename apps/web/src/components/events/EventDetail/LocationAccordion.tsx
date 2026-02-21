import React, { useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";

export interface LocationAccordionProps {
  venueName: string;
  address: string;
  references?: string;
  mapsUrl: string;
  mapsLabel?: string;
  copyLabel?: string;
  copiedLabel?: string;
}

export function LocationAccordion({
  venueName,
  address,
  references,
  mapsUrl,
  mapsLabel = "Abrir en Google Maps",
  copyLabel = "Copiar dirección",
  copiedLabel = "Copiado",
}: LocationAccordionProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullText = [venueName, address, references].filter(Boolean).join("\n");

  const handleCopy = async () => {
    if (!fullText) return;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      //
    }
  };

  return (
    <section className="eds-accordion" aria-label="Ubicación detallada">
      <button
        type="button"
        className="eds-accordion__trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>Ubicación</span>
        <ChevronDown
          size={20}
          strokeWidth={2}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        />
      </button>
      {open && (
        <div className="eds-accordion__body">
          {venueName && (
            <p className="eds-accordion__text" style={{ fontWeight: 700, marginBottom: 4 }}>
              {venueName}
            </p>
          )}
          {address && <p className="eds-accordion__text">{address}</p>}
          {references && (
            <p className="eds-accordion__text" style={{ color: "rgba(255,138,0,0.9)" }}>
              {references}
            </p>
          )}
          <div className="eds-accordion__btns">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="eds-accordion__btn"
            >
              <MapPin size={18} strokeWidth={2} />
              {mapsLabel}
            </a>
            <button
              type="button"
              className="eds-accordion__btn"
              onClick={handleCopy}
              disabled={!fullText}
            >
              {copied ? copiedLabel : copyLabel}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
