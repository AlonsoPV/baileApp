import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { FlyerQueueItem } from "../../hooks/useUploadFlyerQueue";

type Row = {
  id: number;
  parent_id: number | null;
  fecha: string;
  hora_inicio?: string | null;
  flyer_url: string | null;
};

type QueueApi = {
  items: FlyerQueueItem[];
  statusByDateId: Map<number, FlyerQueueItem>;
  enqueue: (input: { dateId: number; parentId?: number | null; file: File }) => string;
  retryItem: (key: string) => void;
  clearDone: () => void;
  concurrency: number;
};

export default function PendingFlyersPanel({
  rows,
  queue,
  title = "🧾 Flyers pendientes",
}: {
  rows: Row[];
  queue: QueueApi;
  title?: string;
}) {
  const pendingRows = useMemo(() => rows.filter((r) => !r.flyer_url), [rows]);
  const [pickForDateId, setPickForDateId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (pendingRows.length === 0) return null;

  return (
    <div className="org-editor-card" style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontWeight: 900, color: "#fff", fontSize: 16 }}>{title}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontSize: 12, opacity: 0.85, color: "#fff" }}>
            Concurrency: <b>{queue.concurrency}</b>
          </div>
          <button
            type="button"
            onClick={queue.clearDone}
            style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 12 }}
          >
            Limpiar completados
          </button>
        </div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.85, color: "#fff", marginBottom: 12 }}>
        Pendientes: <b>{pendingRows.length}</b>. Los uploads corren en segundo plano; el bulk editor no se bloquea.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pendingRows.slice(0, 80).map((r) => {
          const q = queue.statusByDateId.get(r.id);
          const status = q?.status || "PENDING";
          const statusLabel =
            status === "UPLOADING" ? "⏳ Subiendo…" :
            status === "DONE" ? "✅ Listo" :
            status === "ERROR" ? "❌ Error" :
            "⏳ Pendiente";
          return (
            <div
              key={r.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 12,
                alignItems: "center",
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 900 }}>
                  📅 {String(r.fecha).split("T")[0]} {r.hora_inicio ? `· ${r.hora_inicio}` : ""}{" "}
                  <span style={{ fontSize: 12, opacity: 0.8, fontWeight: 800 }}>#{r.id}</span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.85, color: "#fff" }}>
                  {statusLabel}
                  {status === "ERROR" && q?.errorMessage ? (
                    <span style={{ marginLeft: 8, color: "#FFD166" }}>{q.errorMessage}</span>
                  ) : null}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setPickForDateId(r.id);
                    inputRef.current?.click();
                  }}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(39,195,255,0.40)",
                    background: "rgba(39,195,255,0.10)",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 900,
                    fontSize: 12,
                  }}
                >
                  Subir flyer
                </motion.button>

                {status === "ERROR" && q?.key && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => queue.retryItem(q.key)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,209,102,0.40)",
                      background: "rgba(255,209,102,0.12)",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: 900,
                      fontSize: 12,
                    }}
                  >
                    Reintentar
                  </motion.button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          const dateId = pickForDateId;
          // reset input so selecting same file again triggers onChange
          e.currentTarget.value = "";
          if (!file || !dateId) return;
          const row = pendingRows.find((x) => x.id === dateId);
          queue.enqueue({ dateId, parentId: row?.parent_id ?? null, file });
        }}
      />
    </div>
  );
}

