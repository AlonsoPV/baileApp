import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type BulkValidationError = { id: number; field: string; message: string };

const REQUEST_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Timeout: la operación tardó demasiado. Intenta de nuevo.")), ms);
    Promise.resolve(promise)
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

const isHHmm = (v?: string | null) => {
  if (!v) return true;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v));
};

const isYmd = (v?: string | null) => {
  if (!v) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v));
};

export function useBulkUpdateEventDates() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { dateIds: number[]; patch: Record<string, any> }) => {
      const { dateIds, patch } = input;
      if (!dateIds.length) throw new Error("No hay fechas seleccionadas.");

      const errors: BulkValidationError[] = [];
      if ("hora_inicio" in patch || "hora_fin" in patch) {
        if (!isHHmm(patch.hora_inicio)) errors.push({ id: -1, field: "hora_inicio", message: "Formato inválido (HH:mm)" });
        if (!isHHmm(patch.hora_fin)) errors.push({ id: -1, field: "hora_fin", message: "Formato inválido (HH:mm)" });
      }
      if ("fecha" in patch) {
        if (!isYmd(patch.fecha)) errors.push({ id: -1, field: "fecha", message: "Formato inválido (YYYY-MM-DD)" });
      }
      if (errors.length) {
        const msg = errors.map((e) => `${e.field}: ${e.message}`).join(" · ");
        throw new Error(msg);
      }

      const { data, error } = await withTimeout(
        supabase
        .from("events_date")
        .update(patch as any)
        .in("id", dateIds)
        .select("id"),
        REQUEST_TIMEOUT_MS
      );
      if (error) throw error;
      const updatedIds = (data || []).map((r: any) => Number(r.id)).filter(Boolean);
      return { updatedIds };
    },
    onSuccess: () => {
      // refrescar listas relevantes
      qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
      qc.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });
      qc.invalidateQueries({ queryKey: ["dates"] });
    },
  });
}

