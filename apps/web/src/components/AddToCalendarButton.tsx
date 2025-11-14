import React from "react";
import { createEvent } from "ics";
import { saveAs } from "file-saver";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

interface Event {
  titulo: string;
  descripcion?: string;
  fecha: string;
  hora_inicio?: string;
  hora_fin?: string;
  lugar?: string;
}

interface AddToCalendarButtonProps {
  event: Event;
}

export default function AddToCalendarButton({ event }: AddToCalendarButtonProps) {
  function handleDownload() {
    try {
      const start = new Date(`${event.fecha}T${event.hora_inicio || "20:00"}:00`);
      const end = new Date(`${event.fecha}T${event.hora_fin || "23:59"}:00`);
      
      const { error, value } = createEvent({
        title: event.titulo,
        description: event.descripcion || `Evento: ${event.titulo}`,
        start: [
          start.getFullYear(),
          start.getMonth() + 1,
          start.getDate(),
          start.getHours(),
          start.getMinutes()
        ],
        end: [
          end.getFullYear(),
          end.getMonth() + 1,
          end.getDate(),
          end.getHours(),
          end.getMinutes()
        ],
        location: event.lugar || "",
        status: "CONFIRMED" as const,
        busyStatus: "BUSY" as const,
        organizer: { name: "Dónde Bailar", email: "info@baileapp.com" },
        url: window.location.href
      });
      
      if (error) {
        console.error('Error creating calendar event:', error);
        return;
      }
      
      const blob = new Blob([value!], { type: "text/calendar;charset=utf-8" });
      const fileName = `${event.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
      saveAs(blob, fileName);
      
    } catch (err) {
      console.error('Error downloading calendar file:', err);
    }
  }

  return (
    <button 
      onClick={handleDownload}
      style={{
        background: 'linear-gradient(135deg, #1E88E5, #FF3D57)',
        padding: '12px 24px',
        borderRadius: '50px',
        border: 'none',
        color: colors.light,
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(30, 136, 229, 0.4)',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(30, 136, 229, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(30, 136, 229, 0.4)';
      }}
      title="Descargar archivo .ics para agregar a tu calendario"
    >
      📅 Agregar a mi calendario
    </button>
  );
}
