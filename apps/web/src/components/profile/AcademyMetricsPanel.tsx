import React from "react";
import { motion } from "framer-motion";
import { useAcademyMetrics, type DateFilter, type MetricsFilters } from "@/hooks/useAcademyMetrics";
import { ClassMetricCard } from "@/components/profile/academy-metrics/ClassMetricCard";
import { friendlyAcademyMetricsRpcMessage } from "@/lib/cronogramaSubscriptionRpcErrors";

type PanelProps = {
  academyId: number;
  /** Marcar asistió / pago en filas (solo Premium). */
  canEditAttendanceAndPayment?: boolean;
};

export function AcademyMetricsPanel({ academyId, canEditAttendanceAndPayment = false }: PanelProps) {
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("all");
  const [customFrom, setCustomFrom] = React.useState<string>("");
  const [customTo, setCustomTo] = React.useState<string>("");
  const [expandedClasses, setExpandedClasses] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  
  const filters: MetricsFilters = {
    dateFilter,
    from: dateFilter === "custom" ? customFrom : undefined,
    to: dateFilter === "custom" ? customTo : undefined,
  };
  
  const { global, byClass, loading, error, refetch } = useAcademyMetrics(academyId, filters);
  
  // Refrescar métricas cuando cambian los filtros
  React.useEffect(() => {
    if (academyId) {
      refetch();
    }
  }, [academyId, refetch, filters]);
  
  const toggleClassExpanded = (sessionKey: string) => {
    setExpandedClasses(prev => {
      const next = new Set(prev);
      if (next.has(sessionKey)) {
        next.delete(sessionKey);
      } else {
        next.add(sessionKey);
      }
      return next;
    });
  };
  
  // Filtrar clases por búsqueda
  const filteredClasses = React.useMemo(() => {
    if (!searchQuery.trim()) return byClass;
    const query = searchQuery.toLowerCase();
    return byClass.filter(cls => 
      cls.className.toLowerCase().includes(query) ||
      cls.reservations.some(r => r.userName.toLowerCase().includes(query))
    );
  }, [byClass, searchQuery]);
  
  const roleBase = global?.totalAttendanceRecords ?? 0;

  const rolePercentages = React.useMemo(() => {
    if (!global || roleBase === 0) return null;
    return {
      leader: ((global.byRole.leader || 0) / roleBase) * 100,
      follower: ((global.byRole.follower || 0) / roleBase) * 100,
      ambos: ((global.byRole.ambos || 0) / roleBase) * 100,
      otro: ((global.byRole.otro || 0) / roleBase) * 100,
    };
  }, [global, roleBase]);

  const sumClassRecords = React.useMemo(
    () => byClass.reduce((s, c) => s + (c.totalAsistentes ?? 0), 0),
    [byClass],
  );
  const recordsMismatch =
    !!global &&
    sumClassRecords > 0 &&
    Math.abs(sumClassRecords - (global.totalAttendanceRecords ?? 0)) > 1;
  
  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>⏳</div>
        <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>Cargando métricas...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#ff6b6b" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>❌</div>
        <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          Hubo un problema al cargar métricas
        </p>
        <p style={{ fontSize: "0.875rem", opacity: 0.8 }}>
          {friendlyAcademyMetricsRpcMessage(error?.message) || error?.message || "Error desconocido"}
        </p>
        <button
          onClick={() => refetch()}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            borderRadius: 8,
            border: "1px solid rgba(255,107,107,0.3)",
            background: "rgba(255,107,107,0.1)",
            color: "#ff6b6b",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }
  
  return (
    <>
      <style>{`
        .metrics-container {
          display: grid;
          gap: 1.25rem;
          padding: 1.5rem 0;
        }
        .metrics-section {
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            165deg,
            rgba(255,255,255,.095) 0%,
            rgba(255,255,255,.045) 42%,
            rgba(255,255,255,.02) 100%
          );
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 22px;
          padding: 1.35rem 1.35rem 1.45rem;
          box-shadow:
            0 0 0 1px rgba(255,255,255,.04) inset,
            0 14px 42px -14px rgba(0,0,0,.55),
            0 4px 16px rgba(0,0,0,.22);
          transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;
        }
        .metrics-section::before {
          content: "";
          position: absolute;
          top: 0;
          left: 1.1rem;
          right: 1.1rem;
          height: 2px;
          border-radius: 0 0 2px 2px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(240,147,251,.5),
            rgba(33,212,253,.42),
            transparent
          );
          opacity: 0.9;
          pointer-events: none;
        }
        @media (hover: hover) and (pointer: fine) {
          .metrics-section:hover {
            border-color: rgba(255,255,255,.17);
            box-shadow:
              0 0 0 1px rgba(255,255,255,.06) inset,
              0 18px 48px -12px rgba(0,0,0,.6),
              0 6px 20px rgba(240,147,251,.08);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .metrics-section {
            transition: none;
          }
        }
        .metrics-section__head {
          margin-bottom: 1.05rem;
          padding-bottom: 0.85rem;
          border-bottom: 1px solid rgba(255,255,255,.075);
        }
        .metrics-section__head--row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 0.75rem 1rem;
        }
        .metrics-section__head--row .metrics-section__title {
          flex: 1 1 auto;
          min-width: min(100%, 200px);
        }
        .metrics-section__lead {
          margin: 0.42rem 0 0;
          font-size: 0.78rem;
          line-height: 1.45;
          font-weight: 500;
          color: rgba(255,255,255,.56);
          max-width: 52rem;
        }
        .metrics-section h3,
        .metrics-section__title {
          margin: 0;
          font-size: clamp(1.05rem, 2.9vw, 1.38rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }
        .metrics-filters {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .metrics-filter-button {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
          color: #fff;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .metrics-filter-button:hover {
          background: rgba(255,255,255,0.1);
          transform: translateY(-1px);
        }
        .metrics-filter-button.active {
          background: linear-gradient(135deg, rgba(240,147,251,0.3), rgba(245,87,108,0.3));
          border-color: rgba(240,147,251,0.5);
          box-shadow: 0 4px 12px rgba(240,147,251,0.2);
        }
        .metrics-search {
          width: 100%;
          padding: 0.75rem;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.1);
          color: #fff;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }
        .metrics-search::placeholder {
          color: rgba(255,255,255,0.5);
        }
        .metrics-classes-search {
          flex: 1 1 240px;
          max-width: min(100%, 340px);
          min-width: 0;
          padding: 0.65rem 0.85rem 0.65rem 2.35rem;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.25) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='rgba(255,255,255,0.35)' stroke-linecap='round' stroke-width='2' d='M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z'/%3E%3Cpath stroke='rgba(255,255,255,0.35)' stroke-linecap='round' stroke-width='2' d='M16.5 16.5 21 21'/%3E%3C/svg%3E") no-repeat 0.75rem 50%;
          background-size: 16px 16px;
          color: #fff;
          font-size: 0.84rem;
          margin-bottom: 0;
        }
        .metrics-classes-search::placeholder {
          color: rgba(255,255,255,0.38);
        }
        .metrics-classes-search:focus {
          outline: none;
          border-color: rgba(240,147,251,0.35);
          box-shadow: 0 0 0 1px rgba(240,147,251,0.15);
        }
        .metrics-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .metrics-kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }
        @media (min-width: 720px) {
          .metrics-kpi-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 1rem;
          }
        }
        .metrics-kpi-grid--mgmt {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 148px), 1fr));
        }
        @media (min-width: 960px) {
          .metrics-kpi-grid--mgmt {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        .metrics-optional-row {
          margin-top: 0.85rem;
          padding: 0.75rem 1rem;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          font-size: 0.8rem;
          color: rgba(255,255,255,0.78);
          line-height: 1.5;
        }
        .metrics-optional-row strong {
          color: #fff;
          font-weight: 800;
        }
        .metrics-reconcile-hint {
          margin-top: 0.65rem;
          font-size: 0.72rem;
          color: rgba(255,200,120,0.85);
          line-height: 1.4;
        }
        .metrics-details {
          margin-top: 1.1rem;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.18);
          overflow: hidden;
        }
        .metrics-details summary {
          cursor: pointer;
          padding: 0.85rem 1.1rem;
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          color: rgba(255,255,255,0.88);
          list-style: none;
        }
        .metrics-details summary::-webkit-details-marker {
          display: none;
        }
        .metrics-details[open] summary {
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .metrics-details-body {
          padding: 1rem 1.1rem 1.15rem;
        }
        .metrics-kpi-card {
          padding: 1rem 1rem 0.9rem;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.12);
          background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
          min-width: 0;
          text-align: left;
        }
        .metrics-kpi-card--accent {
          border-color: rgba(240,147,251,0.35);
          background: linear-gradient(145deg, rgba(240,147,251,0.12), rgba(33,212,253,0.06));
        }
        .metrics-kpi-label {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.72);
          margin-bottom: 0.35rem;
          line-height: 1.25;
        }
        .metrics-kpi-value {
          font-size: clamp(1.5rem, 5vw, 2.1rem);
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: #fff;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        .metrics-kpi-hint {
          margin-top: 0.45rem;
          font-size: 0.65rem;
          line-height: 1.35;
          color: rgba(255,255,255,0.52);
          font-weight: 500;
        }
        .metrics-segmented-bar {
          display: flex;
          height: 10px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255,255,255,0.08);
          margin-top: 0.75rem;
        }
        .metrics-segmented-bar span {
          min-width: 2px;
          transition: width 0.35s ease;
        }
        .metrics-zone-scroller {
          display: flex;
          gap: 0.65rem;
          overflow-x: auto;
          padding-bottom: 0.35rem;
          margin: 0 -0.25rem;
          padding-left: 0.25rem;
          padding-right: 0.25rem;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x proximity;
        }
        .metrics-zone-chip {
          flex: 0 0 auto;
          scroll-snap-align: start;
          min-width: min(200px, 78vw);
          padding: 0.85rem 1rem;
          border-radius: 14px;
          border: 1px solid rgba(30,136,229,0.28);
          background: rgba(30,136,229,0.08);
        }
        .metrics-zone-chip strong {
          display: block;
          font-size: 0.82rem;
          color: #fff;
          margin-bottom: 0.4rem;
          font-weight: 700;
        }
        .metrics-zone-meta {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.65);
          line-height: 1.4;
        }
        .metrics-stat-card {
          padding: 1.25rem;
          background: linear-gradient(135deg, rgba(240,147,251,0.15), rgba(245,87,108,0.15));
          border-radius: 16px;
          border: 1px solid rgba(240,147,251,0.3);
          position: relative;
          overflow: hidden;
        }
        .metrics-stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #f093fb, #f5576c);
        }
        .metrics-stat-label {
          font-size: 0.75rem;
          opacity: 0.9;
          margin-bottom: 0.5rem;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        .metrics-stat-value {
          font-size: 2.5rem;
          font-weight: 900;
          color: #f093fb;
          line-height: 1;
        }
        .metrics-role-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1rem;
        }
        .metrics-role-card {
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid;
          position: relative;
          overflow: hidden;
        }
        .metrics-role-card.leader {
          background: rgba(30,136,229,0.1);
          border-color: rgba(30,136,229,0.3);
        }
        .metrics-role-card.follower {
          background: rgba(255,209,102,0.1);
          border-color: rgba(255,209,102,0.3);
        }
        .metrics-role-card.ambos {
          background: rgba(76,175,80,0.1);
          border-color: rgba(76,175,80,0.3);
        }
        .metrics-role-card.otro {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.2);
        }
        .metrics-progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 0.5rem;
        }
        .metrics-progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        .metrics-class-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .acm-card {
          position: relative;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.09);
          background: linear-gradient(
            168deg,
            rgba(255,255,255,0.055) 0%,
            rgba(255,255,255,0.02) 48%,
            rgba(0,0,0,0.12) 100%
          );
          box-shadow: 0 0 0 1px rgba(0,0,0,0.25) inset;
          overflow: hidden;
        }
        .acm-card--open {
          border-color: rgba(255,255,255,0.14);
          box-shadow:
            0 0 0 1px rgba(240,147,251,0.12) inset,
            0 12px 40px -16px rgba(0,0,0,0.65);
        }
        .acm-toggle {
          display: block;
          width: 100%;
          margin: 0;
          padding: 1rem 1.05rem 0.85rem;
          border: none;
          background: transparent;
          font: inherit;
          color: inherit;
          text-align: left;
          cursor: pointer;
          outline: none;
        }
        .acm-toggle:focus-visible {
          box-shadow: inset 0 0 0 2px rgba(240,147,251,0.45);
        }
        .acm-toggle-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .acm-identity {
          min-width: 0;
          flex: 1;
        }
        .acm-title {
          margin: 0;
          font-size: clamp(1.05rem, 3.5vw, 1.22rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #fff;
          line-height: 1.28;
        }
        .acm-subtitle {
          margin: 0.35rem 0 0;
          font-size: 0.8rem;
          font-weight: 500;
          color: rgba(255,255,255,0.48);
          line-height: 1.45;
        }
        .acm-subtitle strong {
          color: rgba(255,255,255,0.72);
          font-weight: 600;
        }
        .acm-chevron {
          flex-shrink: 0;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.45);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          transition: transform 0.2s ease, color 0.2s ease, background 0.2s ease;
        }
        .acm-card--open .acm-chevron {
          transform: rotate(180deg);
          color: rgba(255,255,255,0.78);
          background: rgba(240,147,251,0.1);
          border-color: rgba(240,147,251,0.22);
        }
        .acm-kpi-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.5rem;
          margin-bottom: 0.65rem;
        }
        .acm-kpi {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.55rem 0.5rem 0.5rem;
          border-radius: 12px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.06);
          text-align: center;
        }
        .acm-kpi--primary {
          background: rgba(240,147,251,0.08);
          border-color: rgba(240,147,251,0.18);
        }
        .acm-kpi--purchases {
          background: rgba(76,175,80,0.07);
          border-color: rgba(76,175,80,0.16);
        }
        .acm-kpi--purchases .acm-kpi-value {
          color: #b8e0bc;
        }
        .acm-kpi-value {
          font-size: clamp(1.25rem, 4.5vw, 1.55rem);
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          color: #fff;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }
        .acm-kpi--primary .acm-kpi-value {
          color: #f0b8ff;
        }
        .acm-kpi-label {
          margin-top: 0.2rem;
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.42);
          line-height: 1.2;
        }
        .acm-roles {
          padding: 0 1.05rem 0.95rem;
        }
        .acm-role-bar {
          display: flex;
          height: 5px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255,255,255,0.06);
        }
        .acm-role-bar span {
          min-width: 2px;
        }
        .acm-role-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem 0.75rem;
          margin-top: 0.45rem;
          font-size: 0.68rem;
          font-weight: 500;
          color: rgba(255,255,255,0.38);
          line-height: 1.35;
        }
        .acm-role-legend i {
          font-style: normal;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
        }
        .acm-detail {
          padding: 0 1.05rem 1.05rem;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .acm-detail-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.75rem 0 0.55rem;
        }
        .acm-detail-title {
          margin: 0;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
        }
        .acm-detail-count {
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(255,255,255,0.35);
          font-variant-numeric: tabular-nums;
        }
        .acm-date-divider {
          margin: 0.65rem 0 0.4rem;
          padding-bottom: 0.35rem;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.38);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .acm-date-divider:first-child {
          margin-top: 0;
        }
        .acm-row {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          padding: 0.55rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .acm-row:last-child {
          border-bottom: none;
        }
        .acm-row-name {
          font-size: 0.88rem;
          font-weight: 600;
          color: rgba(255,255,255,0.95);
          line-height: 1.3;
        }
        .acm-row-meta {
          font-size: 0.72rem;
          font-weight: 500;
          color: rgba(255,255,255,0.38);
          line-height: 1.45;
        }
        .acm-row-meta .dot {
          opacity: 0.5;
          padding: 0 0.28rem;
        }
        .acm-row--std {
          flex-direction: row;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem 0.75rem;
          padding: 0.65rem 0;
        }
        .acm-row--updating {
          opacity: 0.7;
        }
        .acm-row-std__name {
          flex: 1 1 7rem;
          min-width: 0;
          font-size: 0.88rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          line-height: 1.3;
        }
        .acm-row-std__controls {
          flex: 1 1 15rem;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: 0.65rem 0.85rem;
        }
        .acm-std-ctl__premium-hint {
          flex: 1 1 100%;
          width: 100%;
          text-align: right;
          font-size: 0.68rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.38);
          line-height: 1.3;
          margin: 0;
        }
        .acm-std-ctl {
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          gap: 0.4rem;
        }
        .acm-std-ctl__lbl {
          font-size: 0.64rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
        }
        .acm-std-ctl__hint {
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          min-width: 1.25rem;
        }
        .acm-switch {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          min-height: 40px;
          min-width: 0;
          padding: 0;
          border: none;
          background: none;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .acm-switch:disabled,
        .acm-pay-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .acm-switch__track {
          display: block;
          width: 2.4rem;
          height: 1.35rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.2);
          position: relative;
          flex-shrink: 0;
        }
        .acm-switch[aria-checked="true"] .acm-switch__track {
          background: rgba(100, 200, 150, 0.55);
        }
        .acm-switch__thumb {
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
        .acm-switch[aria-checked="true"] .acm-switch__thumb {
          transform: translateX(1.02rem);
        }
        @media (prefers-reduced-motion: reduce) {
          .acm-switch__thumb {
            transition: none;
          }
        }
        .acm-std-ctl--pay {
          gap: 0.4rem;
        }
        .acm-pay-btn {
          min-height: 40px;
          padding: 0 0.65rem;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
        }
        .acm-pay-btn--on {
          background: rgba(200, 170, 90, 0.2);
          border-color: rgba(200, 170, 90, 0.45);
          color: #f5e5b8;
        }
        @media (max-width: 420px) {
          .acm-row-std__controls {
            justify-content: space-between;
          }
        }
        .acm-more-btn {
          display: block;
          width: 100%;
          margin-top: 0.35rem;
          padding: 0.55rem 0.75rem;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.75);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .acm-more-btn:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.14);
        }
        @media (prefers-reduced-motion: reduce) {
          .acm-chevron {
            transition: none;
          }
        }
        @media (max-width: 520px) {
          .acm-kpi-row {
            gap: 0.4rem;
          }
          .acm-kpi-row .acm-kpi {
            padding: 0.5rem 0.45rem;
          }
        }
        .acm-scan-metrics {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin: 0.15rem 0 0.65rem;
          padding: 0.65rem 0.75rem;
          border-radius: 14px;
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .acm-scan-line {
          font-size: 0.88rem;
          font-weight: 600;
          color: rgba(255,255,255,0.92);
          line-height: 1.45;
          display: flex;
          align-items: baseline;
          gap: 0.35rem;
        }
        .acm-scan-line strong {
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: #fff;
        }
        .acm-scan-line--sub {
          font-size: 0.72rem;
          font-weight: 500;
          color: rgba(255,255,255,0.45);
          margin: -0.15rem 0 0 1.6rem;
        }
        .acm-scan-line--muted {
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(165,214,167,0.92);
        }
        .metrics-badge {
          padding: 0.2rem 0.5rem;
          font-size: 0.7rem;
          border-radius: 6px;
          font-weight: 600;
        }
        .metrics-empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: rgba(255,255,255,0.6);
        }
        .metrics-empty-state-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }
        @media (max-width: 768px) {
          .metrics-container {
            gap: 0.95rem;
            padding: 1rem 0;
          }
          .metrics-section {
            padding: 1.15rem 1.1rem 1.25rem;
            border-radius: 18px;
          }
          .metrics-section::before {
            left: 0.85rem;
            right: 0.85rem;
          }
          .metrics-section__head {
            margin-bottom: 0.95rem;
            padding-bottom: 0.75rem;
          }
          .metrics-stats-grid {
            grid-template-columns: 1fr;
          }
          .metrics-role-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
      
      <div className="metrics-container">
        {/* Filtros de fecha */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="metrics-section"
        >
          <div className="metrics-section__head">
            <h3 className="metrics-section__title">📅 Filtros</h3>
          </div>
          <div className="metrics-filters">
            {(['today', 'this_week', 'this_month', 'all'] as DateFilter[]).map((filter) => (
              <button
                key={filter}
                className={`metrics-filter-button ${dateFilter === filter ? 'active' : ''}`}
                onClick={() => setDateFilter(filter)}
              >
                {filter === 'today' && '📅 Hoy'}
                {filter === 'this_week' && '📆 Esta semana'}
                {filter === 'this_month' && '📅 Este mes'}
                {filter === 'all' && '🌐 Todas'}
              </button>
            ))}
            <button
              className={`metrics-filter-button ${dateFilter === 'custom' ? 'active' : ''}`}
              onClick={() => setDateFilter('custom')}
            >
              🗓️ Personalizado
            </button>
          </div>
          
          {dateFilter === 'custom' && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.75rem' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', color: '#fff', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Desde:
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="metrics-search"
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', color: '#fff', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Hasta:
                </label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="metrics-search"
                  style={{ marginBottom: 0 }}
                />
              </div>
            </div>
          )}
        </motion.section>

        {/* Dashboard operativo — siempre visible con el periodo elegido */}
        {global && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="metrics-section"
            aria-label="Resumen global del periodo"
          >
            <div className="metrics-section__head">
              <h3 className="metrics-section__title">📊 Resumen de gestión</h3>
              <p className="metrics-section__lead">
                Indicadores del periodo. Las <strong>posibles asistencias</strong> cuentan cuando alguien marca la clase
                (RSVP, agenda o tentativo): es intención de ir, no garantiza que vaya.
              </p>
            </div>

            <div className="metrics-kpi-grid metrics-kpi-grid--mgmt">
              <div className="metrics-kpi-card metrics-kpi-card--accent">
                <div className="metrics-kpi-label">Clases activas</div>
                <div className="metrics-kpi-value">{global.totalClassesRegistered ?? 0}</div>
                <p className="metrics-kpi-hint">Clases en tu cronograma publicado (inventario; no depende del periodo).</p>
              </div>
              <div className="metrics-kpi-card">
                <div className="metrics-kpi-label">Alumnos únicos</div>
                <div className="metrics-kpi-value">{global.uniqueStudents ?? 0}</div>
                <p className="metrics-kpi-hint">Personas distintas con al menos una marca o RSVP en el periodo.</p>
              </div>
              <div className="metrics-kpi-card">
                <div className="metrics-kpi-label">Posibles asistencias</div>
                <div className="metrics-kpi-value">{global.totalAttendanceRecords ?? 0}</div>
                <p className="metrics-kpi-hint">
                  Registros por intención de asistir (p. ej. tentativo/RSVP). El alumno puede no presentarse.
                </p>
              </div>
            </div>

            {(global.totalPurchases ?? 0) > 0 ? (
              <div className="metrics-optional-row" aria-label="Métricas complementarias">
                <div>
                  <strong>Compras pagadas (histórico):</strong> {global.totalPurchases} — total acumulado en la academia,
                  sin filtrar por fechas arriba.
                </div>
              </div>
            ) : null}

            {recordsMismatch ? (
              <p className="metrics-reconcile-hint">
                Nota: la suma de posibles asistencias por sesión en el listado ({sumClassRecords}) no coincide con el
                total global ({global.totalAttendanceRecords}). Suele deberse al agrupado de sesiones o a datos fuera de
                clase; revisa el detalle por clase.
              </p>
            ) : null}

            <details className="metrics-details">
              <summary>Distribución por rol y por zona</summary>
              <div className="metrics-details-body">
                {roleBase === 0 ? (
                  <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>
                    Sin posibles asistencias en este periodo para desglosar por rol.
                  </p>
                ) : (
                  <>
                    {rolePercentages && (
                      <div className="metrics-segmented-bar" aria-hidden>
                        <span style={{ width: `${rolePercentages.leader}%`, background: "#1E88E5" }} />
                        <span style={{ width: `${rolePercentages.follower}%`, background: "#FFD166" }} />
                        <span style={{ width: `${rolePercentages.ambos}%`, background: "#4CAF50" }} />
                        <span style={{ width: `${rolePercentages.otro}%`, background: "rgba(255,255,255,0.35)" }} />
                      </div>
                    )}
                    <div className="metrics-role-grid" style={{ marginTop: "1rem" }}>
                      {[
                        { key: "leader" as const, label: "Lead", emoji: "🎯", count: global.byRole.leader || 0, color: "#1E88E5" },
                        { key: "follower" as const, label: "Follow", emoji: "✨", count: global.byRole.follower || 0, color: "#FFD166" },
                        { key: "ambos" as const, label: "Ambos", emoji: "👥", count: global.byRole.ambos || 0, color: "#4CAF50" },
                        { key: "otro" as const, label: "Otros", emoji: "❓", count: global.byRole.otro || 0, color: "rgba(255,255,255,0.85)" },
                      ].map(({ key, label, emoji, count, color }) => {
                        const percentage = rolePercentages ? rolePercentages[key] : 0;
                        return (
                          <div key={key} className={`metrics-role-card ${key}`}>
                            <div style={{ fontSize: "0.75rem", opacity: 0.85, marginBottom: "0.35rem", color: "#fff" }}>
                              {emoji} {label}
                            </div>
                            <div style={{ fontSize: "1.35rem", fontWeight: 800, color, marginBottom: "0.2rem" }}>
                              {count}
                            </div>
                            {rolePercentages && (
                              <>
                                <div style={{ fontSize: "0.68rem", opacity: 0.72, color: "#fff" }}>{percentage.toFixed(1)}%</div>
                                <div className="metrics-progress-bar">
                                  <div className="metrics-progress-fill" style={{ width: `${percentage}%`, background: color }} />
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {(global.zoneRows && global.zoneRows.length > 0) || Object.keys(global.byZone).length > 0 ? (
                  <div style={{ marginTop: "1.25rem" }}>
                    <div style={{ fontSize: "0.875rem", marginBottom: "0.5rem", color: "#fff", fontWeight: 700 }}>
                      Por zona (tag en la reserva)
                    </div>
                    <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", margin: "0 0 0.65rem", lineHeight: 1.4 }}>
                      Zona guardada en cada registro, no la del perfil del alumno.
                    </p>
                    <div className="metrics-zone-scroller" role="list">
                      {(global.zoneRows && global.zoneRows.length > 0
                        ? global.zoneRows
                        : Object.entries(global.byZone)
                            .sort(([, a], [, b]) => b - a)
                            .map(([name, count], i) => ({
                              zoneId: i,
                              zoneName: name,
                              attendanceCount: count,
                              uniqueStudents: 0,
                            }))
                      ).map((z) => (
                        <div key={`${z.zoneId}-${z.zoneName}`} className="metrics-zone-chip" role="listitem">
                          <strong>📍 {z.zoneName}</strong>
                          <div className="metrics-zone-meta">
                            <div>
                              Registros: <strong style={{ color: "#7FCCFF" }}>{z.attendanceCount}</strong>
                            </div>
                            {z.uniqueStudents > 0 ? (
                              <div>
                                Alumnos únicos: <strong style={{ color: "#B39DFF" }}>{z.uniqueStudents}</strong>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </details>
          </motion.section>
        )}

        {/* Métricas por clase */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="metrics-section"
        >
          <div
            className={
              byClass.length > 0
                ? "metrics-section__head metrics-section__head--row"
                : "metrics-section__head"
            }
          >
            <h3 className="metrics-section__title">📚 Clases ({byClass.length})</h3>
            {byClass.length > 0 && (
              <input
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="Buscar por clase o nombre de alumno…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="metrics-classes-search"
                aria-label="Buscar en clases y asistentes"
              />
            )}
          </div>
          
          {filteredClasses.length === 0 ? (
            <div className="metrics-empty-state">
              <div className="metrics-empty-state-icon">
                {searchQuery ? '🔍' : '📭'}
              </div>
              <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {searchQuery ? 'No se encontraron resultados' : 'No hay clases con reservas tentativas'}
              </p>
              <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                {searchQuery
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Cuando haya registros o asistencias en el periodo, verás aquí el detalle por sesión.'}
              </p>
            </div>
          ) : (
            <div className="metrics-class-list">
              {filteredClasses.map((classSummary) => (
                <ClassMetricCard
                  key={classSummary.sessionKey}
                  classSummary={classSummary}
                  isExpanded={expandedClasses.has(classSummary.sessionKey)}
                  onToggle={() => toggleClassExpanded(classSummary.sessionKey)}
                  academyId={academyId}
                  canEditAttendanceAndPayment={canEditAttendanceAndPayment}
                />
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </>
  );
}
