import React from "react";

export interface EventHeaderHeroProps {
  title: string;
  date: string;
  time: string;
  venueName: string;
}

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
    <header className="event-header-hero-ed" role="banner">
      <h1 className="event-header-hero-ed__title">{title || "Evento"}</h1>
      {metaText && (
        <p className="event-header-hero-ed__meta" aria-label="Fecha, hora y lugar">
          {hasDate && <span>{date}</span>}
          {hasDate && (hasTime || hasVenue) && (
            <span className="event-header-hero-ed__separator" aria-hidden>•</span>
          )}
          {hasTime && <span>{time}</span>}
          {hasTime && hasVenue && (
            <span className="event-header-hero-ed__separator" aria-hidden>•</span>
          )}
          {hasVenue && <span>{venueName}</span>}
        </p>
      )}
    </header>
  );
}
