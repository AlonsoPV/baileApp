import React from "react";
import { FaWhatsapp } from "react-icons/fa";

export interface ContactSectionProps {
  whatsappUrl: string;
  whatsappLabel?: string;
  organizerName?: string;
  /** When contact comes from organizer fallback (not saved on this date). */
  showOrganizerContactBadge?: boolean;
}

export function ContactSection({
  whatsappUrl,
  whatsappLabel = "Contactar por WhatsApp",
  organizerName,
  showOrganizerContactBadge,
}: ContactSectionProps) {
  return (
    <section className="eds-contact" aria-label="Contacto">
      {organizerName && (
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>
          Organiza: {organizerName}
        </p>
      )}
      {showOrganizerContactBadge && (
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.02,
            color: "rgba(255,255,255,0.78)",
            marginBottom: 10,
            padding: "6px 10px",
            borderRadius: 999,
            display: "inline-block",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          Contacto del organizador
        </p>
      )}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="eds-contact__btn"
      >
        <FaWhatsapp size={22} />
        {whatsappLabel}
      </a>
    </section>
  );
}
