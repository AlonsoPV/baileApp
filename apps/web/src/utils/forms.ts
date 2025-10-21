export function required(v?: string | null) {
  return v && v.trim().length > 0 ? null : 'Este campo es obligatorio';
}

export function asDateInput(d?: string | Date | null) {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toISOString().slice(0,10);
}
