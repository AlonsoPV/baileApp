import { getEffectiveEventDateYmd } from "@/utils/effectiveEventDate";

export function buildEventOccurrenceKey(event: any): string {
  const instanceId = event?.instance_id;
  if (instanceId) return `instance_${String(instanceId)}`;

  const effectiveDate = getEffectiveEventDateYmd(event);
  const horaInicio = String(event?.hora_inicio || event?.evento_hora_inicio || "");
  const parentOrOwn = String(event?.parent_id ?? event?.id ?? "no_id");

  if (effectiveDate) {
    return `${parentOrOwn}_${effectiveDate}_${horaInicio}_${String(event?.id ?? "no_id")}`;
  }

  return `id_${String(event?.id ?? "no_id")}`;
}
