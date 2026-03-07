/**
 * Calcula las fechas específicas para clases recurrentes basadas en día de la semana
 * @param diaSemana - Número del día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
 * @param mesesAdelante - Número de meses hacia adelante para calcular (default: 3)
 * @returns Array de fechas en formato YYYY-MM-DD
 */
export function calculateRecurringDates(
  diaSemana: number,
  mesesAdelante: number = 3
): string[] {
  const fechas: string[] = [];
  const hoy = new Date();
  const hoyDia = hoy.getDay();
  
  // Calcular la primera ocurrencia
  let diasHastaPrimera = diaSemana - hoyDia;
  if (diasHastaPrimera < 0) {
    diasHastaPrimera += 7; // Si ya pasó esta semana, ir a la próxima
  }
  
  const primeraFecha = new Date(hoy);
  primeraFecha.setDate(hoy.getDate() + diasHastaPrimera);
  
  // Calcular todas las ocurrencias en los próximos meses
  const fechaLimite = new Date(hoy);
  fechaLimite.setMonth(hoy.getMonth() + mesesAdelante);
  
  let fechaActual = new Date(primeraFecha);
  
  while (fechaActual <= fechaLimite) {
    // Formatear como YYYY-MM-DD
    const year = fechaActual.getFullYear();
    const month = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const day = String(fechaActual.getDate()).padStart(2, '0');
    fechas.push(`${year}-${month}-${day}`);
    
    // Avanzar 7 días (siguiente semana)
    fechaActual.setDate(fechaActual.getDate() + 7);
  }
  
  return fechas;
}

/**
 * Calcula fechas específicas para clases con múltiples días de la semana
 * @param diasSemana - Array de números de días de la semana (0-6)
 * @param mesesAdelante - Número de meses hacia adelante (default: 3)
 * @returns Array de fechas en formato YYYY-MM-DD
 */
export function calculateMultipleRecurringDates(
  diasSemana: number[],
  mesesAdelante: number = 3
): string[] {
  const todasLasFechas = new Set<string>();
  
  for (const dia of diasSemana) {
    const fechas = calculateRecurringDates(dia, mesesAdelante);
    fechas.forEach(fecha => todasLasFechas.add(fecha));
  }
  
  // Ordenar fechas
  return Array.from(todasLasFechas).sort();
}

/**
 * Calcula la próxima fecha y hora basada en el día de la semana y la hora especificada
 * Si hoy es jueves y el evento es miércoles a las 7 PM, calcula para el siguiente miércoles a las 7 PM
 * @param diaSemana - Número del día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
 * @param horaInicio - Hora en formato HH:MM (ej: "19:00")
 * @returns Date con la próxima fecha y hora
 */
export function calculateNextDateWithTime(
  diaSemana: number,
  horaInicio: string = '20:00'
): Date {
  const hoy = new Date();
  const hoyDia = hoy.getDay();
  const [hora, minutos] = horaInicio.split(':').map(Number);
  
  // Calcular días hasta la próxima ocurrencia
  let diasHastaPrimera = diaSemana - hoyDia;
  
  // Si el día ya pasó esta semana, o si es el mismo día pero la hora ya pasó, ir a la próxima semana
  if (diasHastaPrimera < 0 || (diasHastaPrimera === 0 && hoy.getHours() * 60 + hoy.getMinutes() >= (hora || 20) * 60 + (minutos || 0))) {
    diasHastaPrimera += 7;
  }
  
  const proximaFecha = new Date(hoy);
  proximaFecha.setDate(hoy.getDate() + diasHastaPrimera);
  proximaFecha.setHours(hora || 20, minutos || 0, 0, 0);
  
  return proximaFecha;
}

/**
 * Devuelve la primera fecha en el rango [dateFromYmd, dateToYmd] que coincide con el día de la semana.
 * Útil para mostrar un evento recurrente cuando el usuario filtra por una fecha futura específica.
 * @param diaSemana - 0=Domingo, 1=Lunes, ..., 6=Sábado
 * @param dateFromYmd - YYYY-MM-DD (inclusive)
 * @param dateToYmd - YYYY-MM-DD (inclusive)
 * @returns YYYY-MM-DD o null si no hay ocurrencia en el rango
 */
export function firstOccurrenceInRange(
  diaSemana: number,
  dateFromYmd: string,
  dateToYmd: string
): string | null {
  if (!dateFromYmd || !dateToYmd) return null;
  const [yFrom, mFrom, dFrom] = dateFromYmd.split("-").map((x) => parseInt(x, 10));
  const [yTo, mTo, dTo] = dateToYmd.split("-").map((x) => parseInt(x, 10));
  if (!Number.isFinite(yFrom) || !Number.isFinite(mFrom) || !Number.isFinite(dFrom)) return null;
  if (!Number.isFinite(yTo) || !Number.isFinite(mTo) || !Number.isFinite(dTo)) return null;

  const fromDate = new Date(Date.UTC(yFrom, mFrom - 1, dFrom, 12, 0, 0));
  const toDate = new Date(Date.UTC(yTo, mTo - 1, dTo, 12, 0, 0));
  if (fromDate > toDate) return null;

  const dayOfWeek = fromDate.getUTCDay();
  let daysToAdd = (diaSemana - dayOfWeek + 7) % 7;
  let candidate = new Date(fromDate);
  candidate.setUTCDate(candidate.getUTCDate() + daysToAdd);

  if (candidate <= toDate) {
    const y = candidate.getUTCFullYear();
    const m = String(candidate.getUTCMonth() + 1).padStart(2, "0");
    const d = String(candidate.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
}

