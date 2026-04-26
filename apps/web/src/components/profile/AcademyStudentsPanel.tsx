import React from "react";
import { motion } from "framer-motion";
import {
  useAcademyStudentDetail,
  useAcademyStudentsGlobalMetrics,
  useAcademyStudentsList,
  type DateFilter,
  type StudentRoleFilter,
  type StudentSegment,
  type StudentsFilters,
} from "@/hooks/useAcademyStudents";
import { StudentMetricCard } from "@/components/profile/academy-metrics/StudentMetricCard";
import { StudentDetailPanel } from "@/components/profile/academy-metrics/StudentDetailPanel";
import { Modal } from "@/components/ui/Modal";
import { friendlyAcademyMetricsRpcMessage } from "@/lib/cronogramaSubscriptionRpcErrors";

type PanelProps = {
  academyId: number;
  canEditAttendanceAndPayment?: boolean;
};

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

function statusLabel(status: string): string {
  const key = status.toLowerCase();
  if (key.includes("paid")) return "Pagado";
  if (key.includes("tentative")) return "Por confirmar";
  if (key.includes("attend")) return "Asistencia";
  if (key.includes("cancel")) return "Cancelado";
  return status;
}

export function AcademyStudentsPanel({ academyId, canEditAttendanceAndPayment = false }: PanelProps) {
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
  const paidVsTentative = React.useMemo(() => {
    const entries = Object.entries(metrics?.statusRecordBreakdown || {});
    let paid = 0;
    let tentative = 0;
    entries.forEach(([status, count]) => {
      const n = Number(count || 0);
      const key = status.toLowerCase();
      if (key.includes("paid")) paid += n;
      if (key.includes("tentative")) tentative += n;
    });
    return { paid, tentative };
  }, [metrics?.statusRecordBreakdown]);

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
          {friendlyAcademyMetricsRpcMessage((error as Error)?.message) ||
            (error as Error)?.message ||
            "Error desconocido"}
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
        .students-card--filters,
        .students-card--kpis {
          padding: 0.85rem;
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
        .students-head--compact {
          margin-bottom: 0.5rem;
          padding-bottom: 0.45rem;
        }
        .students-head--compact h3 {
          font-size: 1.02rem;
        }
        .students-head--compact p {
          margin-top: 0.25rem;
          font-size: 0.72rem;
          color: rgba(255,255,255,.48);
        }
        .students-filters {
          display: grid;
          gap: 0.55rem;
          grid-template-columns: 1fr;
          padding: 0;
        }
        .students-filter-strip {
          display: flex;
          gap: 0.45rem;
          overflow-x: auto;
          padding-bottom: 0.2rem;
          scrollbar-width: thin;
        }
        .students-filter-strip::-webkit-scrollbar {
          height: 5px;
        }
        .students-filter-strip::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: rgba(255,255,255,.2);
        }
        .students-filter-chip {
          flex: 0 0 auto;
          min-width: 9.6rem;
        }
        .students-select,
        .students-input {
          width: 100%;
          min-height: 2.35rem;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.14);
          padding: 0.55rem 0.78rem;
          background: rgba(16,16,24,.58);
          color: #fff;
          font-size: 0.8rem;
          font-weight: 600;
          transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
        }
        .students-select {
          padding-right: 2rem;
        }
        .students-search-wrap {
          width: 100%;
        }
        .students-search-input {
          border-radius: 12px;
          min-height: 2.5rem;
          padding-left: 0.95rem;
          font-size: 0.86rem;
        }
        .students-input::placeholder {
          color: rgba(255,255,255,.36);
          font-weight: 500;
        }
        .students-select:focus,
        .students-input:focus {
          outline: none;
          border-color: rgba(164, 126, 255, 0.62);
          box-shadow: 0 0 0 3px rgba(164, 126, 255, 0.18);
          background: rgba(10,10,20,.38);
        }
        .students-select:hover,
        .students-input:hover {
          border-color: rgba(255,255,255,.22);
        }
        .students-filter-range {
          display: grid;
          gap: 0.5rem;
          grid-template-columns: 1fr;
        }
        .students-kpi-grid {
          display: grid;
          gap: 0.5rem;
          grid-template-columns: 1fr;
        }
        .students-kpi-primary {
          display: grid;
          gap: 0.5rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .students-kpi-main {
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 14px;
          background: rgba(255,255,255,.03);
          padding: 0.58rem 0.68rem;
        }
        .students-kpi-main span {
          display: block;
          font-size: 0.66rem;
          color: rgba(255,255,255,.5);
          font-weight: 600;
          line-height: 1.2;
        }
        .students-kpi-main strong {
          display: block;
          margin-top: 0.12rem;
          color: #fff;
          font-size: 1.36rem;
          font-weight: 900;
          line-height: 1.15;
          font-variant-numeric: tabular-nums;
        }
        .students-kpi-secondary {
          display: grid;
          gap: 0.45rem;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .students-kpi-mini {
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 11px;
          background: rgba(255,255,255,.02);
          padding: 0.5rem;
        }
        .students-kpi-mini span {
          display: block;
          font-size: 0.62rem;
          color: rgba(255,255,255,.45);
          font-weight: 600;
        }
        .students-kpi-mini strong {
          display: block;
          margin-top: 0.12rem;
          color: #fff;
          font-size: 0.95rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
        .students-kpi-inline {
          color: rgba(255,255,255,.52);
          font-size: 0.72rem;
          display: flex;
          gap: 0.65rem;
          flex-wrap: wrap;
        }
        .students-kpi-inline strong {
          color: rgba(255,255,255,.9);
          font-variant-numeric: tabular-nums;
        }
        .students-status-breakdown {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }
        .students-status-pill {
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 999px;
          padding: 0.34rem 0.65rem;
          background: rgba(255,255,255,.04);
          color: rgba(255,255,255,.74);
          font-size: 0.72rem;
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
        .students-row-main--compact .students-row-meta {
          display: none;
        }
        .students-row-dates--one {
          margin-top: 0.35rem;
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
        .students-detail-kpis--compact {
          margin-top: 0.5rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.4rem;
        }
        @media (min-width: 520px) {
          .students-detail-kpis--compact {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        .students-detail-meta-compact {
          margin-top: 0.45rem;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.72rem;
          line-height: 1.4;
        }
        .students-detail-hint {
          margin: 0.35rem 0 0;
          color: rgba(255, 255, 255, 0.42);
          font-size: 0.7rem;
          line-height: 1.4;
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
        .students-history-rows--std {
          gap: 0.4rem;
        }
        .students-history-std {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          padding: 0.5rem 0.55rem;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.45rem 0.65rem;
        }
        .students-history-std--updating {
          opacity: 0.7;
        }
        .students-history-std__name {
          flex: 1 1 8rem;
          min-width: 0;
          font-size: 0.84rem;
          font-weight: 600;
          color: #fff;
          line-height: 1.3;
        }
        .students-history-std__controls {
          flex: 1 1 14rem;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: 0.5rem 0.75rem;
        }
        .students-history-std__readonly {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.48);
          line-height: 1.4;
        }
        .students-std-ctl {
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          gap: 0.35rem;
        }
        .students-std-ctl--pay {
          gap: 0.35rem;
        }
        .students-std-ctl__lbl {
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
        }
        .students-std-ctl__hint {
          font-size: 0.68rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          min-width: 1.25rem;
        }
        .students-switch {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          min-height: 40px;
          min-width: 0;
          padding: 0;
          border: none;
          background: none;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .students-switch:disabled,
        .students-pay-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .students-switch__track {
          display: block;
          width: 2.4rem;
          height: 1.35rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.2);
          position: relative;
          flex-shrink: 0;
        }
        .students-switch[aria-checked="true"] .students-switch__track {
          background: rgba(100, 200, 150, 0.55);
        }
        .students-switch__thumb {
          position: absolute;
          top: 0.1rem;
          left: 0.1rem;
          width: 1.1rem;
          height: 1.1rem;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
          transition: transform 0.12s ease;
        }
        .students-switch[aria-checked="true"] .students-switch__thumb {
          transform: translateX(1.02rem);
        }
        @media (prefers-reduced-motion: reduce) {
          .students-switch__thumb {
            transition: none;
          }
        }
        .students-pay-btn {
          min-height: 40px;
          padding: 0 0.6rem;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.72);
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
        }
        .students-pay-btn--on {
          background: rgba(200, 170, 90, 0.2);
          border-color: rgba(200, 170, 90, 0.45);
          color: #f5e5b8;
        }
        @media (max-width: 420px) {
          .students-filter-chip {
            min-width: 8.75rem;
          }
          .students-kpi-secondary {
            grid-template-columns: 1fr 1fr 1fr;
            gap: 0.38rem;
          }
          .students-kpi-inline {
            font-size: 0.68rem;
            gap: 0.4rem;
          }
          .students-filter-range {
            grid-template-columns: 1fr;
          }
          .students-history-std__controls {
            justify-content: space-between;
            width: 100%;
          }
        }
        @media (min-width: 720px) {
          .students-card--filters,
          .students-card--kpis {
            padding: 1rem;
          }
          .students-filter-strip {
            overflow: visible;
            flex-wrap: wrap;
          }
          .students-filter-chip {
            min-width: 11.5rem;
          }
          .students-search-wrap {
            width: min(23rem, 100%);
          }
          .students-filter-range {
            max-width: 23rem;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (min-width: 960px) {
          .students-detail-breakdowns {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        .students-list-block {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .students-row--lite {
          text-align: left;
          display: block;
          width: 100%;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
          padding: 0.65rem 0.7rem 0.65rem 0.8rem;
          color: inherit;
          cursor: pointer;
          transition: background 0.12s ease, border-color 0.12s ease;
        }
        .students-row--lite:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.12);
        }
        .students-row--selected,
        .students-row--selected:hover {
          border-color: rgba(240,147,251,0.35);
          background: rgba(240,147,251,0.08);
        }
        .students-row-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .students-row--lite .students-row-name {
          font-size: 0.95rem;
        }
        .students-row-chevron {
          color: rgba(255,255,255,0.3);
          flex-shrink: 0;
          display: flex;
        }
        .students-row-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 0.4rem;
        }
        .students-chip {
          font-size: 0.68rem;
          font-weight: 600;
          padding: 0.2rem 0.45rem;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
          background: rgba(0,0,0,0.15);
        }
        .students-chip--accent {
          border-color: rgba(120,200,160,0.35);
          color: rgba(200,255,220,0.9);
        }
        .students-row-hint {
          margin: 0.35rem 0 0;
          font-size: 0.66rem;
          color: rgba(255,255,255,0.4);
        }
        .students-detail-panel--embed {
          border: none;
          background: transparent;
          box-shadow: none;
          border-radius: 0;
          padding: 1rem 1rem 1.25rem;
        }
        .students-detail-head--app {
          align-items: flex-start;
        }
        .students-detail-identity {
          min-width: 0;
        }
        .students-detail-name {
          margin: 0;
          color: #fff;
          font-size: 1.05rem;
          font-weight: 700;
          line-height: 1.25;
        }
        .students-detail-email {
          margin: 0.25rem 0 0;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
          word-break: break-word;
        }
        .students-detail-kpi-strip {
          display: flex;
          gap: 0.45rem;
          margin-top: 0.6rem;
          padding: 0.45rem 0.15rem 0.55rem;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .students-detail-kpi-pill {
          flex: 1 1 0;
          min-width: 0;
        }
        .students-detail-kpi-pill span {
          display: block;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255,255,255,0.4);
          font-weight: 700;
        }
        .students-detail-kpi-pill strong {
          display: block;
          margin-top: 0.08rem;
          font-size: 1.05rem;
          font-weight: 800;
          color: #fff;
          font-variant-numeric: tabular-nums;
        }
        .students-detail-one-liner {
          margin: 0.4rem 0 0;
          font-size: 0.7rem;
          line-height: 1.4;
          color: rgba(255,255,255,0.45);
        }
        .students-detail-section--flat {
          border-top: 1px solid rgba(255,255,255,0.08);
          margin-top: 0.65rem;
          padding-top: 0.55rem;
        }
        .students-detail-section--flat h5 {
          margin: 0 0 0.4rem;
          color: rgba(255,255,255,0.5);
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .students-history-list--flat {
          gap: 0.85rem;
        }
        .students-history-rows--flat {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .students-hist-line {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          padding: 0.55rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .students-hist-line:last-child {
          border-bottom: none;
        }
        .students-hist-line--busy {
          opacity: 0.65;
        }
        .students-hist-line__title {
          font-size: 0.84rem;
          font-weight: 600;
          color: rgba(255,255,255,0.95);
          line-height: 1.3;
        }
        .students-hist-line__actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem 0.55rem;
        }
        .students-hist-line__premium-hint {
          flex: 1 1 100%;
          width: 100%;
          text-align: right;
          font-size: 0.65rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.38);
          line-height: 1.3;
        }
        .students-hist-line__ro {
          margin: 0;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.45);
        }
        .students-hist-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          min-height: 2.3rem;
          border: none;
          background: none;
          padding: 0;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .students-hist-toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .students-hist-toggle__track {
          width: 2.15rem;
          height: 1.2rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.18);
          position: relative;
        }
        .students-hist-toggle[aria-checked="true"] .students-hist-toggle__track {
          background: rgba(100,200,150,0.55);
        }
        .students-hist-toggle__thumb {
          position: absolute;
          top: 0.1rem;
          left: 0.1rem;
          width: 0.95rem;
          height: 0.95rem;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
          transition: transform 0.12s ease;
        }
        .students-hist-toggle[aria-checked="true"] .students-hist-toggle__thumb {
          transform: translateX(0.92rem);
        }
        .students-hist-toggle__text {
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(255,255,255,0.45);
        }
        .students-hist-pay {
          min-height: 2.3rem;
          padding: 0 0.65rem;
          border-radius: 9px;
          font-size: 0.75rem;
          font-weight: 700;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.65);
          cursor: pointer;
        }
        .students-hist-pay:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .students-hist-pay--on {
          background: rgba(200, 170, 90, 0.18);
          border-color: rgba(200, 170, 90, 0.4);
          color: #f0e4c0;
        }
        @media (min-width: 480px) {
          .students-hist-line {
            flex-direction: row;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 0.4rem 0.75rem;
          }
          .students-hist-line__title {
            flex: 1 1 10rem;
            min-width: 0;
          }
          .students-hist-line__actions {
            flex: 0 0 auto;
            justify-content: flex-end;
            max-width: 100%;
          }
        }
      `}</style>

      <div className="students-panel">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="students-card students-card--filters"
        >
          <div className="students-head students-head--compact">
            <h3>Alumnos</h3>
            <p>Seguimiento por persona: actividad, reservas, compras e historial real de clases.</p>
          </div>

          <div className="students-filters">
            <div className="students-filter-strip">
              <div className="students-filter-chip">
                <select
                  className="students-select"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                >
                  <option value="all">Fecha: todas</option>
                  <option value="today">Fecha: hoy</option>
                  <option value="this_week">Fecha: esta semana</option>
                  <option value="this_month">Fecha: este mes</option>
                  <option value="custom">Fecha: personalizado</option>
                </select>
              </div>
              <div className="students-filter-chip">
                <select className="students-select" value={role} onChange={(e) => setRole(e.target.value as StudentRoleFilter)}>
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      Rol: {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="students-filter-chip">
                <select
                  className="students-select"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value as StudentSegment)}
                >
                  {segmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      Segmento: {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="students-filter-chip">
                <select className="students-select" value={zone} onChange={(e) => setZone(e.target.value)}>
                  <option value="">Zona: todas</option>
                  {zoneOptions.map((zoneName) => (
                    <option key={zoneName} value={zoneName}>
                      Zona: {zoneName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="students-search-wrap">
              <input
                className="students-input students-search-input"
                type="search"
                placeholder="Buscar alumno por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {dateFilter === "custom" ? (
              <div className="students-filter-range">
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
            ) : null}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="students-card students-card--kpis"
        >
          <div className="students-head students-head--compact">
            <h3>KPIs de alumnos</h3>
            <p>Prioriza métricas clave y deja el detalle como contexto.</p>
          </div>
          <div className="students-kpi-grid">
            <div className="students-kpi-primary">
              <div className="students-kpi-main">
                <span>Alumnos únicos</span>
                <strong>{metrics?.uniqueStudents ?? 0}</strong>
              </div>
              <div className="students-kpi-main">
                <span>Total registros</span>
                <strong>{metrics?.totalRecords ?? 0}</strong>
              </div>
            </div>
            <div className="students-kpi-secondary">
              <div className="students-kpi-mini">
                <span>Activos</span>
                <strong>{metrics?.activeStudents ?? 0}</strong>
              </div>
              <div className="students-kpi-mini">
                <span>Recurrentes</span>
                <strong>{metrics?.recurrentStudents ?? 0}</strong>
              </div>
              <div className="students-kpi-mini">
                <span>Con historial</span>
                <strong>{metrics?.studentsWithHistory ?? 0}</strong>
              </div>
            </div>
            <div className="students-kpi-inline">
              <span>Nuevos <strong>{metrics?.newStudents ?? 0}</strong></span>
              <span>{toPct(metrics?.newStudents ?? 0, metrics?.uniqueStudents ?? 0)} del total</span>
            </div>
          </div>
          <div className="students-status-breakdown" style={{ marginTop: "0.2rem" }}>
            <span className="students-status-pill">{paidVsTentative.paid} pagados</span>
            <span className="students-status-pill">{paidVsTentative.tentative} por confirmar</span>
          </div>
          <div className="students-status-breakdown">
            {Object.entries(metrics?.statusRecordBreakdown || {}).map(([status, count]) => (
              <span key={status} className="students-status-pill">
                {statusLabel(status)}: {count} ({toPct(Number(count), totalStatusRecords)})
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
          <div className="students-head students-head--compact">
            <h3>Alumnos en tu lista</h3>
            <p>Toca un nombre para abrir su ficha y el historial.</p>
          </div>

          <div className="students-list-block">
            {loadingList ? (
              <div className="students-empty">Actualizando listado...</div>
            ) : students.length === 0 ? (
              <div className="students-empty">Sin alumnos para los filtros seleccionados.</div>
            ) : (
              students.map((student) => (
                <StudentMetricCard
                  key={student.userId}
                  student={student}
                  selected={Boolean(selectedUserId) && selectedUserId === student.userId}
                  onSelect={() => setSelectedUserId(student.userId)}
                />
              ))
            )}
          </div>
        </motion.section>

        <Modal
          open={Boolean(selectedUserId)}
          onClose={() => setSelectedUserId(null)}
          contentClassName="p-0"
          panelClassName="relative max-h-[min(90vh,720px)] w-full max-w-md sm:max-w-lg overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#131118] border border-white/10 shadow-2xl self-end sm:self-center"
        >
          <StudentDetailPanel
            embedInModal
            detail={detail}
            loading={loadingDetail}
            errorMessage={
              detailError
                ? friendlyAcademyMetricsRpcMessage((detailError as Error).message) ??
                  (detailError as Error).message
                : undefined
            }
            onClose={() => setSelectedUserId(null)}
            academyId={academyId}
            canEditAttendancePayment={canEditAttendanceAndPayment}
          />
        </Modal>
      </div>
    </>
  );
}
