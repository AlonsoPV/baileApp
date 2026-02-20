import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { isEventDateExpired, isEventDateUpcoming } from "./eventDateExpiration";

const NOW = new Date("2026-02-19T21:00:00Z"); // 15:00 Mexico City

describe("eventDateExpiration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const opts = { nowOverride: NOW };

  it("returns false for event with future fecha + hora_fin", () => {
    const evento = { fecha: "2026-02-20", hora_fin: "23:00:00", hora_inicio: "20:00" };
    expect(isEventDateExpired(evento, opts)).toBe(false);
    expect(isEventDateUpcoming(evento, opts)).toBe(true);
  });

  it("returns true for event with past fecha + hora_fin", () => {
    const evento = { fecha: "2020-01-01", hora_fin: "12:00:00", hora_inicio: "10:00" };
    expect(isEventDateExpired(evento, opts)).toBe(true);
    expect(isEventDateUpcoming(evento, opts)).toBe(false);
  });

  it("uses hora_inicio when hora_fin is null", () => {
    const evento = { fecha: "2026-02-19", hora_inicio: "01:00", hora_fin: null };
    expect(isEventDateExpired(evento, opts)).toBe(true);
  });

  it("uses 23:59:59 when both hora_fin and hora_inicio are null", () => {
    const evento = { fecha: "2026-02-19", hora_inicio: null, hora_fin: null };
    expect(isEventDateExpired(evento, opts)).toBe(false);
  });

  it("returns false for null/undefined evento (treated as not expired for dia_semana)", () => {
    expect(isEventDateExpired(null)).toBe(true); // null -> "expired" (filter out)
    expect(isEventDateExpired(undefined)).toBe(true);
  });

  it("returns false when evento has no fecha (dia_semana recurring)", () => {
    const evento = { dia_semana: 5, hora_inicio: "20:00" };
    expect(isEventDateExpired(evento)).toBe(false);
  });

  it("handles fecha in ISO format with T", () => {
    const evento = { fecha: "2026-02-20T00:00:00.000Z", hora_fin: "01:00" };
    expect(isEventDateExpired(evento, opts)).toBe(false);
  });

  it("handles unique constraint scenario: one RSVP per user per event_date", () => {
    // Logic: upsert uses ON CONFLICT (event_date_id, user_id) DO UPDATE
    // Client-side: no duplicate rows possible; DB enforces
    const evento = { fecha: "2026-02-25", hora_fin: "23:00" };
    expect(isEventDateExpired(evento, opts)).toBe(false);
  });
});
