import React from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAcademyStudentDetail,
  useAcademyStudentsGlobalMetrics,
  useAcademyStudentsList,
  type StudentHistoryItem,
  type DateFilter,
  type StudentRoleFilter,
  type StudentSegment,
  type StudentsFilters,
} from "@/hooks/useAcademyStudents";
import { StudentMetricCard } from "@/components/profile/academy-metrics/StudentMetricCard";
import { StudentDetailPanel } from "@/components/profile/academy-metrics/StudentDetailPanel";
import { useMarkClassAttendanceAttended } from "@/hooks/useClassAttendanceActions";

type PanelProps = { academyId: number };

const roleOptions: Array<{ value: StudentRoleFilter; label: string }> = [
  { value: "all", label: "Todos roles" },
  { value: "leader", label: "Lead" },
  { value: "follower", label: "Follow" },
  { value: "ambos", label: "Ambos" },
  { value: "otro", label: "Otros" },
];

const segmentOptions: Array<{ value: StudentSegment; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "new", label: "Nuevos" },
  { value: "recurrent", label: "Recurrentes" },
  { value: "with_history", label: "Con historial" },
];

function toPct(value: number, total: number): string {
  if (!total) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function AcademyStudentsPanel({ academyId }: PanelProps) {
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("all");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState<StudentRoleFilter>("all");
  const [segment, setSegment] = React.useState<StudentSegment>("all");
  const [zone, setZone] = React.useState("");
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);

  const filters = React.useMemo<StudentsFilters>(
    () => ({
      dateFilter,
      from: dateFilter === "custom" ? customFrom : undefined,
      to: dateFilter === "custom" ? customTo : undefined,
      search,
      role,
      segment,
      zone,
      limit: 200,
      offset: 0,
    }),
    [customFrom, customTo, dateFilter, role, search, segment, zone],
  );

  const { metrics, loading: loadingGlobal, error: globalError, refetch: refetchGlobal } =
    useAcademyStudentsGlobalMetrics(academyId, filters);
  const { students, loading: loadingList, error: listError, refetch: refetchList } =
    useAcademyStudentsList(academyId, filters);
  const { detail, loading: loadingDetail, error: detailError } = useAcademyStudentDetail(
    academyId,
    selectedUserId,
    filters,
  );
  const markAttended = useMarkClassAttendanceAttended();

  const handleMarkAttended = React.useCallback(
    async (item: StudentHistoryItem) => {
      await markAttended.mutateAsync(item.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["academy-students-global", academyId] }),
        queryClient.invalidateQueries({ queryKey: ["academy-students-list", academyId] }),
        queryClient.invalidateQueries({ queryKey: ["academy-student-detail", academyId, selectedUserId] }),
        queryClient.invalidateQueries({ queryKey: ["academy-metrics", academyId] }),
        queryClient.invalidateQueries({ queryKey: ["academy-class-metrics", academyId] }),
      ]);
    },
    [academyId, markAttended, queryClient, selectedUserId],
  );

  React.useEffect(() => {
    if (selectedUserId && !students.some((s) => s.userId === selectedUserId)) {
      setSelectedUserId(null);
    }
  }, [selectedUserId, students]);

  const zoneOptions = React.useMemo(() => {
    const fromGlobal = (metrics?.zoneBreakdown || []).map((z) => z.zoneName);
    const fromRows = students.map((s) => s.primaryZone).filter(Boolean) as string[];
    return Array.from(new Set([...fromGlobal, ...fromRows])).sort((a, b) => a.localeCompare(b, "es"));
  }, [metrics?.zoneBreakdown, students]);

  const totalStatusRecords = React.useMemo(
    () =>
      Object.values(metrics?.statusRecordBreakdown || {}).reduce((acc, value) => acc + Number(value || 0), 0),
    [metrics?.statusRecordBreakdown],
  );

  if (loadingGlobal && loadingList) {
    return (
      <div style={{ padding: "2rem", color: "#fff", textAlign: "center" }}>
        Cargando gestión por alumnos...
      </div>
    );
  }

  const error = globalError || listError;
  if (error) {
    return (
      <div style={{ padding: "1.5rem", color: "#ff9d9d", textAlign: "center" }}>
        <p style={{ margin: 0, fontWeight: 700 }}>No se pudo cargar la gestión de alumnos.</p>
        <p style={{ margin: "0.35rem 0 0", opacity: 0.85 }}>
          {(error as Error)?.message || "Error desconocido"}
        </p>
        <button
          type="button"
          onClick={() => {
            refetchGlobal();
            refetchList();
          }}
          style={{
            marginTop: "0.8rem",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.2)",
            padding: "0.5rem 0.9rem",
            background: "rgba(255,255,255,0.06)",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .students-panel {
          display: grid;
          gap: 1rem;
          padding: 1rem 0;
        }
        .students-card {
          border: 1px solid rgba(255,255,255,0.11);
          border-radius: 18px;
          background: linear-gradient(165deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
          box-shadow: 0 10px 35px -18px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.03);
          padding: 1rem;
        }
        .students-head {
          margin-bottom: 0.8rem;
          border-bottom: 1px solid rgba(255,255,255,.08);
          padding-bottom: 0.65rem;
        }
        .students-head h3 {
          margin: 0;
          font-size: 1.15rem;
          color: #fff;
        }
        .students-head p {
          margin: 0.35rem 0 0;
          font-size: 0.78rem;
          color: rgba(255,255,255,.56);
          line-height: 1.4;
        }
        .students-filters {
          display: grid;
          gap: 0.55rem;
          grid-template-columns: 1fr;
        }
        .students-filter-row {
          display: grid;
          gap: 0.55rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .students-select,
        .students-input {
          width: 100%;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.14);
          padding: 0.6rem 0.7rem;
          background: rgba(0,0,0,.22);
          color: #fff;
          font-size: 0.82rem;
        }
        .students-input::placeholder {
          color: rgba(255,255,255,.42);
        }
        .students-kpi-grid {
          display: grid;
          gap: 0.55rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .students-kpi {
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 12px;
          background: rgba(255,255,255,.03);
          padding: 0.65rem 0.7rem;
        }
        .students-kpi span {
          display: block;
          font-size: 0.65rem;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: rgba(255,255,255,.46);
          font-weight: 700;
        }
        .students-kpi strong {
          display: block;
          margin-top: 0.2rem;
          font-size: 1.2rem;
          color: #fff;
          font-weight: 800;
        }
        .students-kpi small {
          display: block;
          margin-top: 0.2rem;
          font-size: 0.66rem;
          color: rgba(255,255,255,.48);
        }
        .students-status-breakdown {
          margin-top: 0.75rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .students-status-pill {
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 999px;
          padding: 0.28rem 0.55rem;
          background: rgba(255,255,255,.05);
          color: rgba(255,255,255,.72);
          font-size: 0.7rem;
          font-weight: 600;
        }
        .students-layout {
          display: grid;
          gap: 0.9rem;
          grid-template-columns: 1fr;
        }
        .students-list {
          display: grid;
          gap: 0.6rem;
        }
        .students-row {
          display: block;
          width: 100%;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 14px;
          background: rgba(255,255,255,.025);
          text-align: left;
          padding: 0.7rem;
          color: inherit;
          cursor: pointer;
        }
        .students-row.selected {
          border-color: rgba(240,147,251,.36);
          background: rgba(240,147,251,.08);
        }
        .students-row-main {
          min-width: 0;
        }
        .students-row-name {
          color: #fff;
          font-size: 0.94rem;
          font-weight: 700;
          line-height: 1.25;
        }
        .students-row-meta {
          color: rgba(255,255,255,.52);
          font-size: 0.74rem;
          margin-top: 0.2rem;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.2rem;
        }
        .dot {
          opacity: 0.5;
          padding: 0 0.22rem;
        }
        .students-row-kpis {
          display: grid;
          gap: 0.35rem;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-top: 0.55rem;
        }
        .students-row-kpi {
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 9px;
          padding: 0.35rem 0.4rem;
          background: rgba(255,255,255,.04);
        }
        .students-row-kpi span {
          display: block;
          color: rgba(255,255,255,.45);
          font-size: 0.58rem;
          text-transform: uppercase;
          letter-spacing: .06em;
          font-weight: 700;
        }
        .students-row-kpi strong {
          display: block;
          color: #fff;
          font-size: 0.95rem;
          margin-top: 0.15rem;
          font-weight: 800;
        }
        .students-row-dates {
          margin-top: 0.45rem;
          display: flex;
          gap: 0.65rem;
          flex-wrap: wrap;
          color: rgba(255,255,255,.43);
          font-size: 0.68rem;
        }
        .students-empty {
          color: rgba(255,255,255,.58);
          font-size: 0.83rem;
          text-align: center;
          padding: 1rem 0.5rem;
        }
        .students-detail-panel {
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 16px;
          background: rgba(0,0,0,.22);
          padding: 0.85rem;
        }
        .students-detail-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.6rem;
        }
        .students-detail-head h4 {
          margin: 0;
          color: #fff;
          font-size: 0.95rem;
        }
        .students-detail-head p {
          margin: 0.25rem 0 0;
          color: rgba(255,255,255,.58);
          font-size: 0.72rem;
        }
        .students-detail-close {
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 8px;
          background: rgba(255,255,255,.06);
          color: #fff;
          font-size: 0.73rem;
          padding: 0.35rem 0.55rem;
          font-weight: 600;
          cursor: pointer;
        }
        .students-detail-kpis {
          margin-top: 0.7rem;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.45rem;
        }
        .students-detail-kpi {
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          background: rgba(255,255,255,.03);
          padding: 0.45rem 0.55rem;
        }
        .students-detail-kpi span {
          display: block;
          color: rgba(255,255,255,.5);
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: .06em;
          font-weight: 700;
        }
        .students-detail-kpi strong {
          display: block;
          margin-top: 0.1rem;
          color: #fff;
          font-size: 1rem;
          font-weight: 800;
        }
        .students-detail-meta-grid {
          margin-top: 0.7rem;
          display: grid;
          gap: 0.5rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .students-detail-meta-grid label {
          display: block;
          color: rgba(255,255,255,.44);
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: .06em;
          margin-bottom: 0.1rem;
          font-weight: 700;
        }
        .students-detail-meta-grid p {
          margin: 0;
          color: #fff;
          font-size: 0.78rem;
          line-height: 1.35;
        }
        .students-detail-breakdowns {
          margin-top: 0.7rem;
          display: grid;
          gap: 0.55rem;
          grid-template-columns: 1fr;
        }
        .students-detail-breakdowns h5 {
          margin: 0 0 0.35rem;
          color: rgba(255,255,255,.65);
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .06em;
        }
        .students-detail-breakdowns ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 0.25rem;
        }
        .students-detail-breakdowns li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: rgba(255,255,255,.58);
          font-size: 0.74rem;
        }
        .students-detail-breakdowns li strong {
          color: #fff;
          font-variant-numeric: tabular-nums;
        }
        .students-detail-section {
          margin-top: 0.75rem;
          border-top: 1px solid rgba(255,255,255,.08);
          padding-top: 0.65rem;
        }
        .students-detail-section h5 {
          margin: 0 0 0.4rem;
          color: rgba(255,255,255,.68);
          text-transform: uppercase;
          letter-spacing: .06em;
          font-size: 0.72rem;
        }
        .students-detail-empty {
          color: rgba(255,255,255,.54);
          font-size: 0.8rem;
          padding: 0.6rem 0.1rem;
        }
        .students-detail-error {
          color: #ffb3b3;
        }
        .students-history-list {
          display: grid;
          gap: 0.6rem;
        }
        .students-history-date {
          color: rgba(255,255,255,.52);
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: .06em;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .students-history-rows {
          display: grid;
          gap: 0.35rem;
        }
        .students-history-row {
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 10px;
          background: rgba(255,255,255,.03);
          padding: 0.45rem 0.55rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .students-history-class {
          color: #fff;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .students-history-meta {
          color: rgba(255,255,255,.52);
          font-size: 0.69rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.14rem;
        }
        .students-history-created {
          color: rgba(255,255,255,.38);
          font-size: 0.66rem;
        }
        .students-history-action {
          justify-self: flex-start;
          border: 1px solid rgba(76,175,80,.35);
          border-radius: 999px;
          background: rgba(76,175,80,.16);
          color: #d8ffd8;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.32rem 0.6rem;
          cursor: pointer;
        }
        .students-history-action:disabled {
          opacity: 0.65;
          cursor: wait;
        }
        @media (min-width: 960px) {
          .students-layout {
            grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
            align-items: start;
          }
          .students-detail-breakdowns {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>

      <div className="students-panel">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="students-card"
        >
          <div className="students-head">
            <h3>Alumnos</h3>
            <p>Seguimiento por persona: actividad, reservas, compras e historial real de clases.</p>
          </div>

          <div className="students-filters">
            <div className="students-filter-row">
              <select
                className="students-select"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="this_week">Esta semana</option>
                <option value="this_month">Este mes</option>
                <option value="custom">Personalizado</option>
              </select>
              <input
                className="students-input"
                type="search"
                placeholder="Buscar alumno..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="students-filter-row">
              <select className="students-select" value={role} onChange={(e) => setRole(e.target.value as StudentRoleFilter)}>
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="students-select"
                value={segment}
                onChange={(e) => setSegment(e.target.value as StudentSegment)}
              >
                {segmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="students-filter-row">
              <select className="students-select" value={zone} onChange={(e) => setZone(e.target.value)}>
                <option value="">Todas las zonas</option>
                {zoneOptions.map((zoneName) => (
                  <option key={zoneName} value={zoneName}>
                    {zoneName}
                  </option>
                ))}
              </select>
              {dateFilter === "custom" ? (
                <div className="students-filter-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <input
                    className="students-input"
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                  />
                  <input
                    className="students-input"
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                  />
                </div>
              ) : (
                <div />
              )}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="students-card"
        >
          <div className="students-head">
            <h3>KPIs de alumnos</h3>
            <p>Con desglose por estado para distinguir reservas, compras y actividad real.</p>
          </div>
          <div className="students-kpi-grid">
            <div className="students-kpi">
              <span>Únicos</span>
              <strong>{metrics?.uniqueStudents ?? 0}</strong>
            </div>
            <div className="students-kpi">
              <span>Activos</span>
              <strong>{metrics?.activeStudents ?? 0}</strong>
            </div>
            <div className="students-kpi">
              <span>Nuevos</span>
              <strong>{metrics?.newStudents ?? 0}</strong>
              <small>
                {toPct(metrics?.newStudents ?? 0, metrics?.uniqueStudents ?? 0)} de alumnos
              </small>
            </div>
            <div className="students-kpi">
              <span>Recurrentes</span>
              <strong>{metrics?.recurrentStudents ?? 0}</strong>
              <small>
                {toPct(metrics?.recurrentStudents ?? 0, metrics?.uniqueStudents ?? 0)} de alumnos
              </small>
            </div>
            <div className="students-kpi">
              <span>Con historial</span>
              <strong>{metrics?.studentsWithHistory ?? 0}</strong>
            </div>
            <div className="students-kpi">
              <span>Registros</span>
              <strong>{metrics?.totalRecords ?? 0}</strong>
            </div>
          </div>
          <div className="students-status-breakdown">
            {Object.entries(metrics?.statusRecordBreakdown || {}).map(([status, count]) => (
              <span key={status} className="students-status-pill">
                {status}: {count} ({toPct(Number(count), totalStatusRecords)})
              </span>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="students-card"
        >
          <div className="students-head">
            <h3>Listado y detalle</h3>
            <p>Toca un alumno para ver su ficha, métricas e historial de clases.</p>
          </div>

          <div className="students-layout">
            <div className="students-list">
              {loadingList ? (
                <div className="students-empty">Actualizando listado...</div>
              ) : students.length === 0 ? (
                <div className="students-empty">Sin alumnos para los filtros seleccionados.</div>
              ) : (
                students.map((student) => (
                  <StudentMetricCard
                    key={student.userId}
                    student={student}
                    selected={selectedUserId === student.userId}
                    onSelect={() =>
                      setSelectedUserId((prev) => (prev === student.userId ? null : student.userId))
                    }
                  />
                ))
              )}
            </div>

            <StudentDetailPanel
              detail={detail}
              loading={loadingDetail}
              errorMessage={detailError ? (detailError as Error).message : undefined}
              onClose={() => setSelectedUserId(null)}
              onMarkAttended={handleMarkAttended}
              markingId={markAttended.isPending ? Number(markAttended.variables ?? 0) : null}
            />
          </div>
        </motion.section>
      </div>
    </>
  );
}
