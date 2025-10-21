export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-MX', {
  weekday: 'short', 
  day: 'numeric', 
  month: 'short'
});

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
