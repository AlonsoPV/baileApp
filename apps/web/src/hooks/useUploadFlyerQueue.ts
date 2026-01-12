import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { uploadEventFlyer } from "../lib/uploadEventFlyer";

export type FlyerQueueStatus = "PENDING" | "UPLOADING" | "DONE" | "ERROR";

export type FlyerQueueItem = {
  key: string;
  dateId: number;
  parentId?: number | null;
  file: File;
  status: FlyerQueueStatus;
  attempts: number;
  errorMessage?: string;
  flyerUrl?: string | null;
};

type Options = {
  concurrency?: number; // default 3
  maxAttempts?: number; // default 2 retries => 3 total? We'll use 2 total attempts by default.
  onUploaded?: (dateId: number, flyerUrl: string) => void;
  onError?: (dateId: number, message: string) => void;
};

const makeKey = () => `q_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export function useUploadFlyerQueue(opts?: Options) {
  const concurrency = Math.max(1, Math.min(5, opts?.concurrency ?? 3));
  const maxAttempts = Math.max(1, Math.min(5, opts?.maxAttempts ?? 2));

  const [items, setItems] = useState<FlyerQueueItem[]>([]);
  const runningRef = useRef(0);

  const enqueue = useCallback(
    (input: { dateId: number; parentId?: number | null; file: File }) => {
      const key = makeKey();
      setItems((prev) => [
        ...prev,
        {
          key,
          dateId: input.dateId,
          parentId: input.parentId ?? null,
          file: input.file,
          status: "PENDING",
          attempts: 0,
        },
      ]);
      return key;
    },
    []
  );

  const clearDone = useCallback(() => {
    setItems((prev) => prev.filter((it) => it.status !== "DONE"));
  }, []);

  const retryItem = useCallback((key: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.key === key
          ? { ...it, status: "PENDING", errorMessage: undefined, attempts: 0 }
          : it
      )
    );
  }, []);

  const statusByDateId = useMemo(() => {
    const map = new Map<number, FlyerQueueItem>();
    // prefer non-done latest item
    for (const it of items) {
      const cur = map.get(it.dateId);
      if (!cur) {
        map.set(it.dateId, it);
        continue;
      }
      if (cur.status === "DONE" && it.status !== "DONE") {
        map.set(it.dateId, it);
      } else {
        map.set(it.dateId, it);
      }
    }
    return map;
  }, [items]);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      const availableSlots = concurrency - runningRef.current;
      if (availableSlots <= 0) return;

      const pending = items.filter((it) => it.status === "PENDING");
      if (pending.length === 0) return;

      const toStart = pending.slice(0, availableSlots);
      if (toStart.length === 0) return;

      // mark UPLOADING
      setItems((prev) =>
        prev.map((it) =>
          toStart.some((s) => s.key === it.key)
            ? { ...it, status: "UPLOADING" }
            : it
        )
      );

      runningRef.current += toStart.length;

      await Promise.all(
        toStart.map(async (it) => {
          try {
            let lastErr: any = null;
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
              try {
                const url = await uploadEventFlyer({
                  file: it.file,
                  parentId: it.parentId ?? null,
                  dateId: it.dateId,
                });
                // persist to DB
                const { error } = await supabase
                  .from("events_date")
                  .update({ flyer_url: url as any })
                  .eq("id", it.dateId);
                if (error) throw error;

                if (cancelled) return;
                setItems((prev) =>
                  prev.map((x) =>
                    x.key === it.key
                      ? { ...x, status: "DONE", flyerUrl: url, attempts: attempt }
                      : x
                  )
                );
                opts?.onUploaded?.(it.dateId, url);
                return;
              } catch (e: any) {
                lastErr = e;
                setItems((prev) =>
                  prev.map((x) =>
                    x.key === it.key ? { ...x, attempts: attempt } : x
                  )
                );
                // small backoff
                await new Promise((r) => setTimeout(r, 250 * attempt));
              }
            }
            const msg = lastErr?.message || "Error subiendo el flyer.";
            if (cancelled) return;
            setItems((prev) =>
              prev.map((x) =>
                x.key === it.key
                  ? { ...x, status: "ERROR", errorMessage: msg }
                  : x
              )
            );
            opts?.onError?.(it.dateId, msg);
          } finally {
            runningRef.current -= 1;
          }
        })
      );
    };

    tick();
  }, [items, concurrency, maxAttempts, opts]);

  return {
    items,
    statusByDateId,
    enqueue,
    clearDone,
    retryItem,
    concurrency,
  };
}

