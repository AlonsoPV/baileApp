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
 * Toma clases con dia_semana o fecha y las agrupa por clave weekday 0-6.
 * - Si una clase tiene fecha -> calcula weekday desde esa fecha
 * - Si una clase tiene dia_semana -> usa ese valor
 * - Si una clase no tiene ninguno, se ignora
 */
export function groupClassesByWeekday(classes: Clase[]) {
  const map = new Map<WeekdayKey, Clase[]>();
  
  for (const c of classes) {
    let wd: WeekdayKey | null = null;

    if (c.fecha) {
      wd = dateToWeekdayKey(c.fecha);
    } else if (typeof c.dia_semana === "number" && c.dia_semana >= 0 && c.dia_semana <= 6) {
      wd = c.dia_semana as WeekdayKey;
    } else if (typeof c.diaSemana === "number" && c.diaSemana >= 0 && c.diaSemana <= 6) {
      wd = c.diaSemana as WeekdayKey;
    }

    if (wd === null) continue;
    if (!map.has(wd)) map.set(wd, []);
    map.get(wd)!.push(c);
  }

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

