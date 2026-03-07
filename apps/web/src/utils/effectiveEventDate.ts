export function getEffectiveEventDate(event: any): string | null {
  return event?.instance_date || event?.fecha || event?.fecha_inicio || null;
}

export function getEffectiveEventDateYmd(event: any): string {
  const raw = getEffectiveEventDate(event);
  if (!raw) return "";
  return String(raw).split("T")[0] || "";
}

export function normalizeDateOnly(dateValue?: string | Date | null): Date | null {
  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    if (Number.isNaN(dateValue.getTime())) return null;
    return new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());
  }

  if (typeof dateValue === "string") {
    const ymdMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdMatch) {
      const [, y, m, d] = ymdMatch;
      return new Date(Number(y), Number(m) - 1, Number(d));
    }

    // Si viene datetime (ISO o similar), tomamos solo YYYY-MM-DD para evitar corrimientos por TZ.
    const ymdFromIso = (dateValue.split("T")[0] || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdFromIso) {
      const [, y, m, d] = ymdFromIso;
      return new Date(Number(y), Number(m) - 1, Number(d));
    }

    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

