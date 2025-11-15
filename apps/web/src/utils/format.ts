export const fmtDate = (iso: string) => {
  if (!iso) return '';

  try {
    // Asegurar que usamos solo la parte de fecha (YYYY-MM-DD)
    const datePart = iso.split('T')[0];
    const [y, m, d] = datePart.split('-').map((v) => parseInt(v, 10));

    if (!y || !m || !d) {
      return iso;
    }

    // Crear fecha en hora local (NO como UTC) para evitar que se recorra un día
    const localDate = new Date(y, m - 1, d);

    return localDate.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return iso;
  }
};

export const fmtTime = (t?: string|null) => (t ? t.slice(0,5) : '');

export const fmtDateTime = (fecha: string, hora?: string|null) => {
  const date = fmtDate(fecha);
  const time = fmtTime(hora);
  return time ? `${date} a las ${time}` : date;
};

export const fmtRSVPStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    'voy': '✅ Voy',
    'interesado': '🤔 Interesado', 
    'no_voy': '❌ No voy'
  };
  return statusMap[status] || status;
};
