import React from "react";
import { FaWhatsapp } from "react-icons/fa";

export interface ContactSectionProps {
  whatsappUrl: string;
  whatsappLabel?: string;
  organizerName?: string;
}

export function ContactSection({
  whatsappUrl,
  whatsappLabel = "Contactar por WhatsApp",
  organizerName,
}: ContactSectionProps) {
  return (
    <section className="eds-contact" aria-label="Contacto">
      {organizerName && (
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>
          Organiza: {organizerName}
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
