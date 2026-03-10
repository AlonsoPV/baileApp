import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganizerEventMetrics, type DateFilter, type MetricsFilters } from "@/hooks/useOrganizerEventMetrics";

type PanelProps = { organizerId: number };

export function OrganizerEventMetricsPanel({ organizerId }: PanelProps) {
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("all");
  const [customFrom, setCustomFrom] = React.useState<string>("");
  const [customTo, setCustomTo] = React.useState<string>("");
  const [expandedDates, setExpandedDates] = React.useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  
  const filters: MetricsFilters = {
    dateFilter,
    from: dateFilter === "custom" ? customFrom : undefined,
    to: dateFilter === "custom" ? customTo : undefined,
  };
  
  const { global, byDate, loading, error, refetch } = useOrganizerEventMetrics(organizerId, filters);
  
  // Refrescar métricas cuando cambian los filtros
  React.useEffect(() => {
    if (organizerId) {
      refetch();
    }
  }, [organizerId, refetch, filters]);
  
  const toggleDateExpanded = (dateId: number) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateId)) {
        next.delete(dateId);
      } else {
        next.add(dateId);
      }
      return next;
    });
  };
  
  // Filtrar fechas por búsqueda
  const filteredDates = React.useMemo(() => {
    if (!searchQuery.trim()) return byDate;
    const query = searchQuery.toLowerCase();
    return byDate.filter(date => 
      date.eventDateName.toLowerCase().includes(query) ||
      date.reservations.some(r => r.userName.toLowerCase().includes(query))
    );
  }, [byDate, searchQuery]);
  
  // Porcentajes por rol sobre total asistentes (personas únicas)
  const rolePercentages = React.useMemo(() => {
    const total = global?.totalAsistentes ?? 0;
    if (!global || total === 0) return null;
    return {
      leader: ((global.porRol.leader || 0) / total) * 100,
      follower: ((global.porRol.follower || 0) / total) * 100,
      ambos: ((global.porRol.ambos || 0) / total) * 100,
      otros: ((global.porRol.otros || 0) / total) * 100,
    };
  }, [global]);
  
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
          {error?.message || "Error desconocido"}
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
          gap: 1rem;
          padding: 1rem 0;
        }
        .metrics-section {
          background: linear-gradient(160deg, rgba(255,255,255,.06) 0%, rgba(255,255,255,.02) 100%);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 12px;
          padding: 1rem 1.15rem;
          box-shadow: 0 2px 16px rgba(0,0,0,.2), 0 0 0 1px rgba(255,255,255,.03) inset;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .metrics-section:hover {
          border-color: rgba(255,255,255,.14);
          box-shadow: 0 4px 20px rgba(0,0,0,.25), 0 0 0 1px rgba(255,255,255,.05) inset;
        }
        .metrics-section h3 {
          margin: 0 0 0.75rem 0;
          padding-bottom: 0.6rem;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          letter-spacing: -0.02em;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .metrics-filters {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          margin-bottom: 0;
        }
        .metrics-filter-button {
          padding: 0.4rem 0.85rem;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.9);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .metrics-filter-button:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.22);
        }
        .metrics-filter-button.active {
          background: linear-gradient(135deg, rgba(240,147,251,0.25), rgba(245,87,108,0.18));
          border-color: rgba(240,147,251,0.4);
          box-shadow: 0 1px 8px rgba(240,147,251,0.15);
          color: #fff;
        }
        .metrics-search {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: #fff;
          font-size: 0.8125rem;
          margin-bottom: 0;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .metrics-search:focus {
          outline: none;
          border-color: rgba(240,147,251,0.35);
          background: rgba(255,255,255,0.06);
        }
        .metrics-search::placeholder {
          color: rgba(255,255,255,0.4);
        }
        .metrics-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.6rem;
        }
        .metrics-stat-card {
          padding: 0.75rem 1rem;
          background: linear-gradient(145deg, rgba(240,147,251,0.1), rgba(245,87,108,0.06));
          border-radius: 10px;
          border: 1px solid rgba(240,147,251,0.18);
          position: relative;
          overflow: hidden;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .metrics-stat-card:hover {
          background: linear-gradient(145deg, rgba(240,147,251,0.14), rgba(245,87,108,0.08));
          border-color: rgba(240,147,251,0.25);
        }
        .metrics-stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #f093fb, #f5576c);
          opacity: 0.8;
        }
        .metrics-stat-label {
          font-size: 0.65rem;
          opacity: 0.9;
          margin-bottom: 0.25rem;
          color: rgba(255,255,255,0.85);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          font-weight: 600;
        }
        .metrics-stat-value {
          font-size: 1.75rem;
          font-weight: 800;
          color: #f093fb;
          line-height: 1;
        }
        .metrics-role-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
        }
        .metrics-role-card {
          padding: 0.6rem 0.75rem;
          border-radius: 10px;
          border: 1px solid;
          position: relative;
          overflow: hidden;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .metrics-role-card.leader {
          background: rgba(30,136,229,0.08);
          border-color: rgba(30,136,229,0.25);
        }
        .metrics-role-card.follower {
          background: rgba(255,209,102,0.08);
          border-color: rgba(255,209,102,0.25);
        }
        .metrics-role-card.ambos {
          background: rgba(76,175,80,0.08);
          border-color: rgba(76,175,80,0.25);
        }
        .metrics-role-card.otros {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.15);
        }
        .metrics-progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 0.35rem;
        }
        .metrics-progress-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        .metrics-class-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          margin-bottom: 0.625rem;
          transition: all 0.2s ease;
        }
        .metrics-class-card:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.16);
        }
        .metrics-class-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          min-height: 2.25rem;
        }
        .metrics-class-header-left {
          flex: 1;
          min-width: 0;
        }
        .metrics-class-title-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          font-weight: 700;
          font-size: 0.9375rem;
          color: #fff;
          line-height: 1.35;
        }
        .metrics-class-title-row .date-chip {
          font-weight: 600;
          font-size: 0.7rem;
          color: rgba(240,147,251,0.95);
          background: rgba(240,147,251,0.12);
          border: 1px solid rgba(240,147,251,0.25);
          padding: 0.15rem 0.45rem;
          border-radius: 6px;
        }
        .metrics-class-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: 0.35rem;
        }
        .metrics-class-badges {
          display: flex;
          gap: 0.35rem;
          flex-wrap: wrap;
        }
        .metrics-class-total {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        .metrics-class-total-value {
          font-size: 1.35rem;
          font-weight: 800;
          color: #f093fb;
          line-height: 1;
        }
        .metrics-class-chevron {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        .metrics-reservations-list {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .metrics-reservations-list .list-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
          margin-bottom: 0.5rem;
        }
        .metrics-reservation-item {
          padding: 0.4rem 0.6rem;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 0.35rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .metrics-reservation-item:last-child {
          margin-bottom: 0;
        }
        .metrics-reservation-item:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
        }
        .metrics-reservation-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #fff;
          min-width: 0;
        }
        .metrics-reservation-badges {
          display: flex;
          gap: 0.35rem;
          flex-wrap: wrap;
          align-items: center;
        }
        .metrics-badge {
          padding: 0.15rem 0.4rem;
          font-size: 0.65rem;
          border-radius: 5px;
          font-weight: 600;
        }
        .metrics-empty-state {
          text-align: center;
          padding: 1.5rem 1rem;
          color: rgba(255,255,255,0.6);
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 10px;
          background: rgba(255,255,255,0.02);
        }
        .metrics-empty-state-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          opacity: 0.5;
        }
        @media (max-width: 768px) {
          .metrics-container {
            gap: 0.875rem;
            padding: 0.75rem 0;
          }
          .metrics-section {
            padding: 0.875rem 1rem;
            border-radius: 12px;
          }
          .metrics-section h3 {
            font-size: 0.9375rem;
            padding-bottom: 0.5rem;
          }
          .metrics-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
          }
          .metrics-role-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .metrics-class-header {
            flex-wrap: wrap;
          }
          .metrics-class-total {
            width: 100%;
            justify-content: flex-start;
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
          <h3>📅 Filtros</h3>
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
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem' }}>
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

        {/* Resumen global */}
        {global && global.totalRsvps > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="metrics-section"
          >
            <h3>📊 Resumen Global</h3>
            <div className="metrics-stats-grid">
              <div className="metrics-stat-card">
                <div className="metrics-stat-label">Total asistentes</div>
                <div className="metrics-stat-value">{global.totalAsistentes ?? 0}</div>
              </div>
              <div className="metrics-stat-card">
                <div className="metrics-stat-label">Total RSVPs</div>
                <div className="metrics-stat-value">{global.totalRsvps}</div>
              </div>
              <div className="metrics-stat-card">
                <div className="metrics-stat-label">Fechas con RSVPs</div>
                <div className="metrics-stat-value">{byDate.length}</div>
              </div>
              <div className="metrics-stat-card">
                <div className="metrics-stat-label">Total Compras (pagado)</div>
                <div className="metrics-stat-value">{global.totalPurchases ?? 0}</div>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.5rem', color: '#fff', fontWeight: 600 }}>
                Distribución por rol (personas únicas)
              </div>
              <div className="metrics-role-grid">
                {[
                  { key: 'leader', label: '👨‍💼 Leader', count: global.porRol.leader || 0, color: '#1E88E5' },
                  { key: 'follower', label: '👩‍💼 Follower', count: global.porRol.follower || 0, color: '#FFD166' },
                  { key: 'ambos', label: '👥 Ambos', count: global.porRol.ambos || 0, color: '#4CAF50' },
                  { key: 'otros', label: '❓ Otros', count: global.porRol.otros || 0, color: '#fff' },
                ].map(({ key, label, count, color }) => {
                  const percentage = rolePercentages ? rolePercentages[key as keyof typeof rolePercentages] : 0;
                  return (
                    <div key={key} className={`metrics-role-card ${key}`}>
                      <div style={{ fontSize: '0.65rem', opacity: 0.85, marginBottom: '0.25rem', color: '#fff' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color, lineHeight: 1 }}>
                        {count}
                      </div>
                      {rolePercentages && (
                        <>
                          <div style={{ fontSize: '0.6rem', opacity: 0.7, color: '#fff', marginTop: '0.2rem' }}>
                            {percentage.toFixed(0)}%
                          </div>
                          <div className="metrics-progress-bar">
                            <div
                              className="metrics-progress-fill"
                              style={{
                                width: `${percentage}%`,
                                background: color,
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Asistentes por zona (1 zona por persona) */}
            {Object.keys(global.byZone).length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.5rem', color: '#fff', fontWeight: 600 }}>
                  Asistentes por zona
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                  {Object.entries(global.byZone)
                    .sort(([, a], [, b]) => b - a)
                    .map(([zona, count]) => (
                      <div
                        key={zona}
                        style={{
                          padding: '0.45rem 0.6rem',
                          background: 'rgba(30,136,229,0.08)',
                          borderRadius: 8,
                          border: '1px solid rgba(30,136,229,0.18)',
                        }}
                      >
                        <div style={{ fontSize: '0.65rem', opacity: 0.85, marginBottom: '0.15rem', color: '#fff' }}>
                          {zona}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E88E5' }}>
                          {count}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* Métricas por fecha */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="metrics-section"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0 }}>📅 Fechas ({byDate.length})</h3>
            {byDate.length > 0 && (
              <input
                type="text"
                placeholder="Buscar fecha o usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="metrics-search"
                style={{ maxWidth: '260px' }}
              />
            )}
          </div>
          
          {filteredDates.length === 0 ? (
            <div className="metrics-empty-state">
              <div className="metrics-empty-state-icon">
                {searchQuery ? '🔍' : '📭'}
              </div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                {searchQuery ? 'No se encontraron resultados' : 'No hay fechas con RSVPs'}
              </p>
              <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Los RSVPs aparecerán aquí cuando los usuarios muestren interés en tus eventos'}
              </p>
            </div>
          ) : (
            <div>
              {filteredDates.map((dateSummary) => {
                const isExpanded = expandedDates.has(dateSummary.eventDateId);
                const roleColors: Record<string, { bg: string; border: string; text: string }> = {
                  leader: { bg: "rgba(30,136,229,0.15)", border: "rgba(30,136,229,0.3)", text: "#1E88E5" },
                  follower: { bg: "rgba(255,209,102,0.15)", border: "rgba(255,209,102,0.3)", text: "#FFD166" },
                  ambos: { bg: "rgba(76,175,80,0.15)", border: "rgba(76,175,80,0.3)", text: "#4CAF50" },
                  otro: { bg: "rgba(255,255,255,0.1)", border: "rgba(255,255,255,0.2)", text: "#fff" },
                };
                
                return (
                  <motion.div
                    key={dateSummary.eventDateId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="metrics-class-card"
                  >
                    <div className="metrics-class-header" onClick={() => toggleDateExpanded(dateSummary.eventDateId)}>
                      <div className="metrics-class-header-left">
                        <div className="metrics-class-title-row">
                          <span>{dateSummary.eventDateName}</span>
                          {dateSummary.eventDate && (() => {
                            try {
                              const fecha = new Date(dateSummary.eventDate);
                              if (!isNaN(fecha.getTime()) && fecha.getFullYear() > 1970) {
                                return (
                                  <span className="date-chip">
                                    {fecha.toLocaleDateString("es-MX", {
                                      weekday: "short",
                                      day: "2-digit",
                                      month: "short",
                                    })}
                                  </span>
                                );
                              }
                            } catch (e) {
                              console.error("[OrganizerEventMetricsPanel] Error formateando fecha:", e);
                            }
                            return null;
                          })()}
                        </div>
                        <div className="metrics-class-meta">
                          <div className="metrics-class-badges">
                            {Object.entries(dateSummary.byRole).map(([role, count]) => {
                              if (count === 0) return null;
                              const roleColor = roleColors[role] || roleColors.otro;
                              return (
                                <span
                                  key={role}
                                  className="metrics-badge"
                                  style={{
                                    background: roleColor.bg,
                                    border: `1px solid ${roleColor.border}`,
                                    color: roleColor.text,
                                  }}
                                >
                                  {role === 'leader' ? 'L' : role === 'follower' ? 'F' : role === 'ambos' ? 'A' : 'O'} {count}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="metrics-class-total">
                        <span className="metrics-class-total-value">{dateSummary.totalRsvps}</span>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)' }}>RSVPs</span>
                        <span className="metrics-class-chevron">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="metrics-reservations-list"
                        >
                          <div className="list-title">
                            Interesados · {dateSummary.reservations.length}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {dateSummary.reservations.map((rsvp) => {
                              const roleColor = roleColors[rsvp.roleType || 'otro'] || roleColors.otro;
                              return (
                                <div key={rsvp.id} className="metrics-reservation-item">
                                  <span className="metrics-reservation-name">{rsvp.userName}</span>
                                  <div className="metrics-reservation-badges">
                                    <span
                                      className="metrics-badge"
                                      style={{
                                        background: roleColor.bg,
                                        border: `1px solid ${roleColor.border}`,
                                        color: roleColor.text,
                                      }}
                                    >
                                      {rsvp.roleType === 'leader' ? 'L' : rsvp.roleType === 'follower' ? 'F' : rsvp.roleType === 'ambos' ? 'A' : 'O'}
                                    </span>
                                    {rsvp.zone && (
                                      <span
                                        className="metrics-badge"
                                        style={{
                                          background: 'rgba(30,136,229,0.12)',
                                          border: '1px solid rgba(30,136,229,0.25)',
                                          color: '#1E88E5',
                                        }}
                                      >
                                        {rsvp.zone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>
      </div>
    </>
  );
}
