import React from "react";
import { useNavigate } from "react-router-dom";
import { StudentClassHistoryList } from "@/components/profile/academy-metrics/StudentClassHistoryList";
import { useMyClassAttendance } from "@/hooks/useMyClassAttendance";

function normalizeStatus(status: string): string {
  const key = status.toLowerCase();
  if (key === "asistio" || key === "asistió") return "attended";
  return key;
}

export default function MyClassAttendanceScreen() {
  const navigate = useNavigate();
  const { data = [], isLoading, error } = useMyClassAttendance();

  const tentative = React.useMemo(
    () => data.filter((item) => normalizeStatus(item.status) === "tentative"),
    [data],
  );
  const attended = React.useMemo(
    () => data.filter((item) => normalizeStatus(item.status) === "attended"),
    [data],
  );

  return (
    <div style={{ padding: "1rem", maxWidth: 960, margin: "0 auto", color: "#fff" }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "1rem",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.18)",
          padding: "0.55rem 0.85rem",
          background: "rgba(255,255,255,0.06)",
          color: "#fff",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        ← Volver
      </button>

      <div style={{ display: "grid", gap: "1rem" }}>
        <section style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "1rem", background: "rgba(255,255,255,0.04)" }}>
          <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Mis clases</h1>
          <p style={{ margin: "0.4rem 0 0", color: "rgba(255,255,255,0.7)" }}>
            Aqui puedes distinguir tus clases tentativas de las asistencias confirmadas.
          </p>
        </section>

        {isLoading ? (
          <section style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "1rem", background: "rgba(255,255,255,0.04)" }}>
            Cargando historial...
          </section>
        ) : error ? (
          <section style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "1rem", background: "rgba(255,255,255,0.04)", color: "#ffb3b3" }}>
            {(error as Error).message || "No se pudo cargar el historial"}
          </section>
        ) : (
          <>
            <section style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "1rem", background: "rgba(255,255,255,0.04)" }}>
              <h2 style={{ marginTop: 0 }}>Asistire</h2>
              <StudentClassHistoryList history={tentative} />
            </section>
            <section style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "1rem", background: "rgba(255,255,255,0.04)" }}>
              <h2 style={{ marginTop: 0 }}>Asisti</h2>
              <StudentClassHistoryList history={attended} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
