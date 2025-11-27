import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAcademyMetrics, type DateFilter, type MetricsFilters } from "@/hooks/useAcademyMetrics";

type PanelProps = { academyId: number };

export function AcademyMetricsPanel({ academyId }: PanelProps) {
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("all");
  const [customFrom, setCustomFrom] = React.useState<string>("");
  const [customTo, setCustomTo] = React.useState<string>("");
  const [expandedClasses, setExpandedClasses] = React.useState<Set<number>>(new Set());
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
  
  const toggleClassExpanded = (classId: number) => {
    setExpandedClasses(prev => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
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
  
  // Calcular porcentajes para gráficos
  const rolePercentages = React.useMemo(() => {
    if (!global || global.totalTentative === 0) return null;
    return {
      leader: ((global.byRole.leader || 0) / global.totalTentative) * 100,
      follower: ((global.byRole.follower || 0) / global.totalTentative) * 100,
      ambos: ((global.byRole.ambos || 0) / global.totalTentative) * 100,
      otro: ((global.byRole.otro || 0) / global.totalTentative) * 100,
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
          gap: 1.5rem;
          padding: 1.5rem 0;
        }
        .metrics-section {
          background: linear-gradient(135deg, rgba(255,255,255,.09), rgba(255,255,255,.03));
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 8px 32px rgba(0,0,0,.3);
        }
        .metrics-section h3 {
          margin: 0 0 1.25rem 0;
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 0.5rem;
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
        .metrics-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
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
        .metrics-class-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 1.25rem;
          margin-bottom: 1rem;
          transition: all 0.2s ease;
        }
        .metrics-class-card:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }
        .metrics-class-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          cursor: pointer;
        }
        .metrics-class-title {
          font-weight: 800;
          font-size: 1.25rem;
          color: #fff;
          margin-bottom: 0.5rem;
        }
        .metrics-class-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: 0.75rem;
        }
        .metrics-class-total {
          text-align: right;
          min-width: 80px;
        }
        .metrics-class-total-value {
          font-size: 2rem;
          font-weight: 900;
          color: #f093fb;
          line-height: 1;
        }
        .metrics-reservations-list {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .metrics-reservation-item {
          padding: 0.875rem;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 0.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .metrics-reservation-item:last-child {
          margin-bottom: 0;
        }
        .metrics-reservation-info {
          flex: 1;
          min-width: 0;
        }
        .metrics-reservation-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 0.25rem;
        }
        .metrics-reservation-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
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
            gap: 1rem;
            padding: 1rem 0;
          }
          .metrics-section {
            padding: 1.25rem;
            border-radius: 16px;
          }
          .metrics-section h3 {
            font-size: 1.25rem;
          }
          .metrics-stats-grid {
            grid-template-columns: 1fr;
          }
          .metrics-role-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .metrics-class-header {
            flex-direction: column;
          }
          .metrics-class-total {
            text-align: left;
            width: 100%;
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

        {/* Resumen global */}
        {global && global.totalTentative > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="metrics-section"
          >
            <h3>📊 Resumen Global</h3>
            <div className="metrics-stats-grid">
              <div className="metrics-stat-card">
                <div className="metrics-stat-label">Total Reservas</div>
                <div className="metrics-stat-value">{global.totalTentative}</div>
              </div>
              
              <div className="metrics-stat-card">
                <div className="metrics-stat-label">Clases con Reservas</div>
                <div className="metrics-stat-value">{byClass.length}</div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '1rem', color: '#fff', fontWeight: 600 }}>
                Distribución por Rol
              </div>
              <div className="metrics-role-grid">
                {[
                  { key: 'leader', label: '👨‍💼 Leader', count: global.byRole.leader || 0, color: '#1E88E5' },
                  { key: 'follower', label: '👩‍💼 Follower', count: global.byRole.follower || 0, color: '#FFD166' },
                  { key: 'ambos', label: '👥 Ambos', count: global.byRole.ambos || 0, color: '#4CAF50' },
                  { key: 'otro', label: '❓ Otros', count: global.byRole.otro || 0, color: '#fff' },
                ].map(({ key, label, count, color }) => {
                  const percentage = rolePercentages ? rolePercentages[key as keyof typeof rolePercentages] : 0;
                  return (
                    <div key={key} className={`metrics-role-card ${key}`}>
                      <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.5rem', color: '#fff' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color, marginBottom: '0.25rem' }}>
                        {count}
                      </div>
                      {rolePercentages && (
                        <>
                          <div style={{ fontSize: '0.7rem', opacity: 0.7, color: '#fff', marginBottom: '0.25rem' }}>
                            {percentage.toFixed(1)}%
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

            {/* Métricas por zona */}
            {Object.keys(global.byZone).length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '1rem', color: '#fff', fontWeight: 600 }}>
                  Por Zona
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                  {Object.entries(global.byZone)
                    .sort(([, a], [, b]) => b - a)
                    .map(([zona, count]) => (
                      <div
                        key={zona}
                        style={{
                          padding: '0.75rem',
                          background: 'rgba(30,136,229,0.1)',
                          borderRadius: 10,
                          border: '1px solid rgba(30,136,229,0.2)',
                        }}
                      >
                        <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.25rem', color: '#fff' }}>
                          📍 {zona}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E88E5' }}>
                          {count}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* Métricas por clase */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="metrics-section"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>📚 Clases ({byClass.length})</h3>
            {byClass.length > 0 && (
              <input
                type="text"
                placeholder="🔍 Buscar clase o usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="metrics-search"
                style={{ maxWidth: '300px', marginBottom: 0 }}
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
                {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Las reservas aparecerán aquí cuando los usuarios agreguen clases a su calendario'}
              </p>
            </div>
          ) : (
            <div>
              {filteredClasses.map((classSummary) => {
                const isExpanded = expandedClasses.has(classSummary.classId);
                const roleColors: Record<string, { bg: string; border: string; text: string }> = {
                  leader: { bg: "rgba(30,136,229,0.15)", border: "rgba(30,136,229,0.3)", text: "#1E88E5" },
                  follower: { bg: "rgba(255,209,102,0.15)", border: "rgba(255,209,102,0.3)", text: "#FFD166" },
                  ambos: { bg: "rgba(76,175,80,0.15)", border: "rgba(76,175,80,0.3)", text: "#4CAF50" },
                  otro: { bg: "rgba(255,255,255,0.1)", border: "rgba(255,255,255,0.2)", text: "#fff" },
                };
                
                return (
                  <motion.div
                    key={classSummary.classId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="metrics-class-card"
                  >
                    <div className="metrics-class-header" onClick={() => toggleClassExpanded(classSummary.classId)}>
                      <div style={{ flex: 1 }}>
                        <div className="metrics-class-title" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span>{classSummary.className}</span>
                          {classSummary.classDate && (() => {
                            try {
                              const fecha = new Date(classSummary.classDate);
                              // Verificar que la fecha es válida (no es 1969 ni 1970)
                              if (!isNaN(fecha.getTime()) && fecha.getFullYear() > 1970) {
                                return (
                                  <span className="metrics-badge" style={{ 
                                    background: 'rgba(240,147,251,0.15)',
                                    border: '1px solid rgba(240,147,251,0.3)',
                                    color: '#f093fb',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.2rem 0.5rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                  }}>
                                    <span>📅</span>
                                    <span>{fecha.toLocaleDateString("es-MX", {
                                      weekday: "short",
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}</span>
                                  </span>
                                );
                              }
                            } catch (e) {
                              console.error("[AcademyMetricsPanel] Error formateando fecha:", e);
                            }
                            return null;
                          })()}
                        </div>
                        <div className="metrics-class-badges">
                          {Object.entries(classSummary.byRole).map(([role, count]) => {
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
                                {role === 'leader' ? '👨‍💼' : role === 'follower' ? '👩‍💼' : role === 'ambos' ? '👥' : '❓'} {count}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="metrics-class-total">
                        <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.25rem', color: '#fff' }}>
                          Total
                        </div>
                        <div className="metrics-class-total-value">{classSummary.totalAsistentes}</div>
                        <div style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                          {isExpanded ? '▲' : '▼'}
                        </div>
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
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#fff' }}>
                            👥 Asistentes ({classSummary.reservations.length}):
                          </div>
                          
                          {/* Agrupar por fecha específica */}
                          {(() => {
                            const datesMap = classSummary.reservationsByDate || new Map();
                            const sortedDates = Array.from(datesMap.keys())
                              .filter(key => key !== 'sin-fecha')
                              .sort((a, b) => {
                                try {
                                  return new Date(a).getTime() - new Date(b).getTime();
                                } catch {
                                  return 0;
                                }
                              });
                            
                            // Agregar 'sin-fecha' al final si existe
                            if (datesMap.has('sin-fecha')) {
                              sortedDates.push('sin-fecha');
                            }
                            
                            return sortedDates.map((fechaKey) => {
                              const reservationsForDate = datesMap.get(fechaKey) || [];
                              if (reservationsForDate.length === 0) return null;
                              
                              // Formatear fecha para mostrar
                              let fechaDisplay = 'Sin fecha específica';
                              if (fechaKey !== 'sin-fecha') {
                                try {
                                  const fecha = new Date(fechaKey);
                                  if (!isNaN(fecha.getTime()) && fecha.getFullYear() > 1970) {
                                    fechaDisplay = fecha.toLocaleDateString("es-MX", {
                                      weekday: "long",
                                      day: "2-digit",
                                      month: "long",
                                      year: "numeric",
                                    });
                                  }
                                } catch (e) {
                                  fechaDisplay = fechaKey;
                                }
                              }
                              
                              return (
                                <div key={fechaKey} style={{ marginBottom: '1.5rem' }}>
                                  <div style={{ 
                                    fontSize: '0.8rem', 
                                    fontWeight: 700, 
                                    color: '#f093fb', 
                                    marginBottom: '0.75rem',
                                    padding: '0.5rem',
                                    background: 'rgba(240,147,251,0.1)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(240,147,251,0.2)',
                                  }}>
                                    📅 {fechaDisplay} ({reservationsForDate.length} {reservationsForDate.length === 1 ? 'asistente' : 'asistentes'})
                                  </div>
                                  <div style={{ display: 'grid', gap: '0.5rem', paddingLeft: '0.5rem' }}>
                                    {reservationsForDate.map((reservation) => {
                                      const roleColor = roleColors[reservation.roleType || 'otro'] || roleColors.otro;
                                      return (
                                        <div key={reservation.id} className="metrics-reservation-item">
                                          <div className="metrics-reservation-info">
                                            <div className="metrics-reservation-name">👤 {reservation.userName}</div>
                                            <div className="metrics-reservation-badges">
                                              <span
                                                className="metrics-badge"
                                                style={{
                                                  background: roleColor.bg,
                                                  border: `1px solid ${roleColor.border}`,
                                                  color: roleColor.text,
                                                }}
                                              >
                                                {reservation.roleType === 'leader' ? '👨‍💼 Leader' :
                                                 reservation.roleType === 'follower' ? '👩‍💼 Follower' :
                                                 reservation.roleType === 'ambos' ? '👥 Ambos' : '❓ Otro'}
                                              </span>
                                              {reservation.zone && (
                                                <span
                                                  className="metrics-badge"
                                                  style={{
                                                    background: 'rgba(30,136,229,0.15)',
                                                    border: '1px solid rgba(30,136,229,0.3)',
                                                    color: '#1E88E5',
                                                  }}
                                                >
                                                  📍 {reservation.zone}
                                                </span>
                                              )}
                                              {reservation.classDate && (() => {
                                                try {
                                                  const fechaAsistencia = new Date(reservation.classDate);
                                                  if (!isNaN(fechaAsistencia.getTime()) && fechaAsistencia.getFullYear() > 1970) {
                                                    return (
                                                      <span
                                                        className="metrics-badge"
                                                        style={{
                                                          background: 'rgba(76,175,80,0.15)',
                                                          border: '1px solid rgba(76,175,80,0.3)',
                                                          color: '#4CAF50',
                                                        }}
                                                      >
                                                        📅 Asistirá: {fechaAsistencia.toLocaleDateString("es-MX", {
                                                          day: "2-digit",
                                                          month: "short",
                                                          year: "numeric",
                                                        })}
                                                      </span>
                                                    );
                                                  }
                                                } catch (e) {
                                                  // Ignorar errores
                                                }
                                                return null;
                                              })()}
                                              <span
                                                className="metrics-badge"
                                                style={{
                                                  background: 'rgba(255,255,255,0.08)',
                                                  border: '1px solid rgba(255,255,255,0.15)',
                                                  color: 'rgba(255,255,255,0.7)',
                                                }}
                                              >
                                                🕐 Registrado: {new Date(reservation.createdAt).toLocaleDateString("es-MX", {
                                                  day: "2-digit",
                                                  month: "short",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            });
                          })()}
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
