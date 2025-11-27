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
  // Función auxiliar para validar formato de hora (HH:MM o HH:MM:SS)
  const isValidTimeFormat = (timeStr: string): boolean => {
    if (!timeStr || typeof timeStr !== 'string') return false;
    // Acepta HH:MM o HH:MM:SS
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return timeRegex.test(timeStr);
  };

  // Función auxiliar para normalizar hora (asegurar formato HH:MM)
  const normalizeTime = (timeStr: string | undefined, defaultTime: string): string => {
    if (!timeStr) return defaultTime;
    
    // Si ya está en formato correcto, usarlo
    if (isValidTimeFormat(timeStr)) {
      // Asegurar que tenga solo HH:MM (sin segundos)
      const parts = timeStr.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    
    // Intentar extraer hora de diferentes formatos
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    
    console.warn('[AddToCalendarButton] ⚠️ Invalid time format, using default:', {
      received: timeStr,
      default: defaultTime
    });
    return defaultTime;
  };

  // Función auxiliar para validar y construir fecha completa
  const buildDateTime = (fecha: string, hora: string, defaultHora: string): Date => {
    try {
      // Validar formato de fecha (YYYY-MM-DD)
      const fechaMatch = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!fechaMatch) {
        throw new Error(`Invalid date format: ${fecha}`);
      }

      const normalizedHora = normalizeTime(hora, defaultHora);
      const dateTimeStr = `${fecha}T${normalizedHora}:00`;
      const date = new Date(dateTimeStr);
      
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date/time: ${dateTimeStr}`);
      }

      console.log('[AddToCalendarButton] ✅ Date/time built:', {
        fecha,
        hora: normalizedHora,
        dateTimeStr,
        parsed: date.toISOString(),
        local: date.toLocaleString()
      });

      return date;
    } catch (err) {
      console.error('[AddToCalendarButton] ❌ Error building date/time:', {
        fecha,
        hora,
        error: err
      });
      // Fallback: usar fecha actual con hora por defecto
      const fallbackDate = new Date(fecha);
      if (isNaN(fallbackDate.getTime())) {
        return new Date(); // Último recurso: fecha actual
      }
      const [hours, minutes] = normalizeTime(hora, defaultHora).split(':').map(Number);
      fallbackDate.setHours(hours, minutes, 0, 0);
      return fallbackDate;
    }
  };

  function handleDownload() {
    try {
      console.log('[AddToCalendarButton] 📅 Building calendar event:', {
        fecha: event.fecha,
        hora_inicio: event.hora_inicio,
        hora_fin: event.hora_fin
      });

      const start = buildDateTime(event.fecha, event.hora_inicio || "20:00", "20:00");
      const end = buildDateTime(event.fecha, event.hora_fin || event.hora_inicio || "23:59", "23:59");
      
      // Validar que end sea después de start
      if (end.getTime() <= start.getTime()) {
        console.warn('[AddToCalendarButton] ⚠️ End time is before or equal to start time, adjusting...');
        end.setHours(start.getHours() + 2);
        end.setMinutes(start.getMinutes());
      }

      console.log('[AddToCalendarButton] ✅ Final dates:', {
        start: start.toISOString(),
        end: end.toISOString(),
        durationHours: (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      });
      
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
