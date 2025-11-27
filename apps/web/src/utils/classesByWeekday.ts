import type { Clase } from "@/types/classes";

const WEEKDAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export type WeekdayKey = 0|1|2|3|4|5|6;

export function dateToWeekdayKey(dateStr: string): WeekdayKey {
  // Asume dateStr 'YYYY-MM-DD'
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0-6
  return (day as WeekdayKey);
}

export function getWeekdayLabel(key: WeekdayKey) {
  return WEEKDAYS_ES[key];
}

/**
 * Convierte nombre de día (string) a número (0-6)
 */
function dayNameToNumber(dayName: string | number): number | null {
  if (typeof dayName === 'number' && dayName >= 0 && dayName <= 6) {
    return dayName;
  }
  const normalized = String(dayName).toLowerCase().trim();
  const map: Record<string, number> = {
    'domingo': 0, 'dom': 0,
    'lunes': 1, 'lun': 1,
    'martes': 2, 'mar': 2,
    'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3,
    'jueves': 4, 'jue': 4,
    'viernes': 5, 'vie': 5,
    'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6,
  };
  return map[normalized] ?? null;
}

/**
 * Toma clases con dia_semana o fecha y las agrupa por clave weekday 0-6.
 * - Si una clase tiene fecha -> calcula weekday desde esa fecha
 * - Si una clase tiene dia_semana (único) -> usa ese valor
 * - Si una clase tiene diasSemana (array) -> expande en múltiples copias, una por cada día
 * - Si una clase no tiene ninguno, se ignora
 */
export function groupClassesByWeekday(classes: Clase[]) {
  console.log("[groupClassesByWeekday] Input classes:", classes);
  const map = new Map<WeekdayKey, Clase[]>();
  
  for (const c of classes) {
    // Si tiene diasSemana (array) PERO también tiene diaSemana/dia_semana específico,
    // significa que ya fue expandida en useLiveClasses, así que NO expandir de nuevo
    // Solo expandir si NO tiene diaSemana/dia_semana específico
    if (c.diasSemana && Array.isArray(c.diasSemana) && c.diasSemana.length > 0) {
      // Si ya tiene un diaSemana específico, significa que ya fue expandida
      if (c.diaSemana !== null && c.diaSemana !== undefined && typeof c.diaSemana === 'number') {
        // Ya fue expandida, usar el diaSemana específico
        const wd = c.diaSemana as WeekdayKey;
        if (!map.has(wd)) map.set(wd, []);
        map.get(wd)!.push(c);
        continue;
      }
      if (c.dia_semana !== null && c.dia_semana !== undefined && typeof c.dia_semana === 'number') {
        // Ya fue expandida, usar el dia_semana específico
        const wd = c.dia_semana as WeekdayKey;
        if (!map.has(wd)) map.set(wd, []);
        map.get(wd)!.push(c);
        continue;
      }
      
      // Si no tiene diaSemana específico, expandir aquí (caso legacy o datos sin procesar)
      const dayNumbers: number[] = [];
      for (const dayStr of c.diasSemana) {
        const dayNum = dayNameToNumber(dayStr);
        if (dayNum !== null && dayNum >= 0 && dayNum <= 6) {
          dayNumbers.push(dayNum);
        }
      }
      
      // Crear una copia de la clase para cada día
      for (const dayNum of dayNumbers) {
        const wd = dayNum as WeekdayKey;
        if (!map.has(wd)) map.set(wd, []);
        // Crear una copia de la clase con el diaSemana específico para este día
        map.get(wd)!.push({
          ...c,
          dia_semana: dayNum,
          diaSemana: dayNum,
        });
      }
      continue;
    }
    
    // Lógica original para clases con un solo día
    let wd: WeekdayKey | null = null;

    if (c.fecha) {
      wd = dateToWeekdayKey(c.fecha);
      console.log(`[groupClassesByWeekday] Class ${c.id} has fecha ${c.fecha}, weekday: ${wd}`);
    } else if (typeof c.dia_semana === "number" && c.dia_semana >= 0 && c.dia_semana <= 6) {
      wd = c.dia_semana as WeekdayKey;
      console.log(`[groupClassesByWeekday] Class ${c.id} has dia_semana ${c.dia_semana}`);
    } else if (typeof c.diaSemana === "number" && c.diaSemana >= 0 && c.diaSemana <= 6) {
      wd = c.diaSemana as WeekdayKey;
      console.log(`[groupClassesByWeekday] Class ${c.id} has diaSemana ${c.diaSemana}`);
    } else {
      console.warn(`[groupClassesByWeekday] Class ${c.id} (${c.titulo || c.nombre}) has no fecha or dia_semana, skipping`);
    }

    if (wd === null) continue;
    if (!map.has(wd)) map.set(wd, []);
    map.get(wd)!.push(c);
  }
  
  console.log("[groupClassesByWeekday] Grouped map:", Array.from(map.entries()));

  // Ordenar clases dentro de cada día por hora de inicio si existe
  for (const [k, arr] of map.entries()) {
    arr.sort((a, b) => {
      const ai = a.hora_inicio || a.inicio || "00:00";
      const bi = b.hora_inicio || b.inicio || "00:00";
      return ai.localeCompare(bi);
    });
    map.set(k, arr);
  }

  // Retornar solo días con clases, ordenados Lun→Dom (o el orden que quieras)
  const order: WeekdayKey[] = [1,2,3,4,5,6,0];
  const result = order
    .filter(k => map.has(k))
    .map(k => ({ key: k, label: getWeekdayLabel(k), items: map.get(k)! }));

  return result;
}

