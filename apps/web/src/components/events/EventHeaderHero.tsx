import React from "react";
import { getLocaleFromI18n } from "../../utils/locale";

const ACCENT_COLOR = "#FF8C42"; // naranja/ámbar

/**
 * Formatea una fecha ISO a "Vie, 27 feb"
 */
export function formatHeaderDate(fechaISO: string): string {
  if (!fechaISO) return "";
  const safeDate = (() => {
    const plain = String(fechaISO).split("T")[0];
    const [year, month, day] = plain.split("-").map((part) => parseInt(part, 10));
    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day)
    ) {
      return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    }
    const parsed = new Date(fechaISO);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  })();

  const locale = getLocaleFromI18n();
  return safeDate.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "America/Mexico_City",
  });
}

/**
 * Formatea una hora a "22:00"
 */
export function formatHeaderTime(hora: string): string {
  if (!hora) return "";
  const segments = hora.split(":");
  const hours = segments[0] ?? "00";
  const minutes = segments[1] ?? "00";
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

export interface EventHeaderHeroProps {
  title: string;
  date: string;
  time: string;
  venueName: string;
}

const styles = `
  .event-header-hero {
    background: linear-gradient(180deg, #0a0a0a 0%, #121212 50%, #0d0d0d 100%);
    background-image: 
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255, 140, 66, 0.04) 0%, transparent 50%),
      linear-gradient(180deg, #0a0a0a 0%, #121212 50%, #0d0d0d 100%);
    padding: clamp(2rem, 5vw, 3.5rem) 0;
    margin: 0 0 0.5rem;
  }
  .event-header-hero__title {
    margin: 0 0 0.75rem;
    font-size: clamp(2rem, 6vw, 3.5rem);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: #ffffff;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
    font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .event-header-hero__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    font-size: clamp(0.9rem, 2vw, 1.05rem);
    color: rgba(255, 255, 255, 0.75);
    font-weight: 500;
    line-height: 1.5;
    font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .event-header-hero__separator {
    color: ${ACCENT_COLOR};
    font-size: 0.85em;
    font-weight: 600;
    user-select: none;
    flex-shrink: 0;
  }
  @media (max-width: 480px) {
    .event-header-hero {
      padding: 1.5rem 0;
    }
    .event-header-hero__title {
      font-size: 1.75rem;
      -webkit-line-clamp: 2;
    }
  }
`;

export function EventHeaderHero({
  title,
  date,
  time,
  venueName,
}: EventHeaderHeroProps) {
  const hasDate = Boolean(date);
  const hasTime = Boolean(time);
  const hasVenue = Boolean(venueName);
  const parts: string[] = [];
  if (hasDate) parts.push(date);
  if (hasTime) parts.push(time);
  if (hasVenue) parts.push(venueName);
  const metaText = parts.join(" • ");

  return (
    <header className="event-header-hero" role="banner">
      <style>{styles}</style>
      <h1 className="event-header-hero__title">{title || "Evento"}</h1>
      {metaText && (
        <p className="event-header-hero__meta" aria-label="Fecha, hora y lugar">
          {hasDate && <span>{date}</span>}
          {hasDate && (hasTime || hasVenue) && (
            <span className="event-header-hero__separator" aria-hidden>•</span>
          )}
          {hasTime && <span>{time}</span>}
          {hasTime && hasVenue && (
            <span className="event-header-hero__separator" aria-hidden>•</span>
          )}
          {hasVenue && <span>{venueName}</span>}
        </p>
      )}
    </header>
  );
}
