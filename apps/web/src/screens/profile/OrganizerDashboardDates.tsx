import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDatesByParent, useRSVPCounts } from "../../hooks/useEvents";
import { RSVPCountsRow } from "../../components/events/RSVPCountsRow";
import { fmtDate, fmtTime } from "../../utils/format";
import { auditEventParentDates } from "../../utils/eventDateConsistency";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  green: '#10B981',
  dark: '#121212',
  light: '#F5F5F5',
};

export function OrganizerDashboardDates() {
  const { id } = useParams();
  const navigate = useNavigate();
  const parentId = Number(id);
  const { data: dates } = useDatesByParent(parentId, false); // false = incluir borradores
  const { data: counts } = useRSVPCounts(parentId);
  const audit = useMemo(() => auditEventParentDates(Number.isFinite(parentId) ? parentId : null, (dates as any) || []), [parentId, dates]);

  const mapCounts = useMemo(() => {
    const m = new Map<number, any>();
    (counts || []).forEach(c => m.set(c.event_date_id, c));
    return m;
  }, [counts]);

  const getEstadoBadge = (estado: string, fecha: string) => {
    const isPast = new Date(fecha) < new Date();
    
    if (isPast) {
      return (
        <span style={{
          padding: '4px 8px',
          borderRadius: '12px',
          background: `${colors.dark}cc`,
          border: `1px solid ${colors.light}33`,
          color: `${colors.light}88`,
          fontSize: '0.75rem',
          fontWeight: '600',
        }}>
          📅 Pasado
        </span>
      );
    }

    if (estado === 'publicado') {
      return (
        <span style={{
          padding: '4px 8px',
          borderRadius: '12px',
          background: `${colors.green}cc`,
          border: `2px solid ${colors.green}`,
          color: colors.light,
          fontSize: '0.75rem',
          fontWeight: '600',
        }}>
          ✅ Publicado
        </span>
      );
    }

    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '12px',
        background: `${colors.orange}cc`,
        border: `2px solid ${colors.orange}`,
        color: colors.light,
        fontSize: '0.75rem',
        fontWeight: '600',
      }}>
        📝 Borrador
      </span>
    );
  };

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1000px',
      margin: '0 auto',
      color: colors.light,
      minHeight: '100vh',
      background: colors.dark,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
            📅 Fechas del evento
          </h1>
          <p style={{ opacity: 0.7, margin: 0 }}>
            Gestiona las fechas y ve las métricas de RSVP
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/profile/organizer/date/new/${parentId}`)}
          style={{
            padding: '12px 24px',
            borderRadius: '50px',
            border: 'none',
            background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            color: colors.light,
            fontSize: '0.875rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: `0 4px 16px ${colors.blue}66`,
          }}
        >
          + Nueva Fecha
        </motion.button>
      </div>

      {import.meta.env.DEV && audit.needsBackfill && (
        <div style={{
          padding: 16,
          borderRadius: 14,
          border: `1px solid ${colors.orange}55`,
          background: `${colors.orange}14`,
          marginBottom: 16,
        }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Auditoría (DEV): posibles inconsistencias</div>
          <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.35 }}>
            <div><b>tipo</b>: {audit.inferredType} · <b>fechas</b>: {audit.totalDates} · <b>únicas</b>: {audit.uniqueFechas}</div>
            {audit.missingFechaIds.length > 0 && (
              <div><b>sin fecha</b>: {audit.missingFechaIds.slice(0, 20).join(", ")}{audit.missingFechaIds.length > 20 ? "…" : ""}</div>
            )}
            {audit.duplicateFechas.length > 0 && (
              <div><b>fechas duplicadas</b>: {audit.duplicateFechas.slice(0, 5).map((d) => `${d.fecha} (${d.ids.length})`).join(" · ")}{audit.duplicateFechas.length > 5 ? "…" : ""}</div>
            )}
            {audit.weekdayMismatches.length > 0 && (
              <div><b>weekday mismatch</b>: {audit.weekdayMismatches.slice(0, 5).map((m) => `${m.id}@${m.fecha} (dia_semana=${m.dia_semana}, weekday=${m.weekday})`).join(" · ")}{audit.weekdayMismatches.length > 5 ? "…" : ""}</div>
            )}
          </div>
        </div>
      )}

      {/* Fechas List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {(dates || []).map((d, index) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ 
              scale: 1.01, 
              boxShadow: `0 8px 24px ${colors.coral}44`,
              borderColor: colors.coral,
            }}
            style={{
              padding: '24px',
              background: `${colors.dark}ee`,
              borderRadius: '16px',
              border: `1px solid ${colors.light}22`,
              transition: 'all 0.2s ease',
            }}
          >
            {/* Header de la fecha */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '4px',
                  color: colors.light,
                }}>
                  {fmtDate(d.fecha)}
                </h3>
                <div style={{
                  fontSize: '1rem',
                  opacity: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>🕐</span>
                  {fmtTime(d.hora_inicio)} - {fmtTime(d.hora_fin)}
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}>
                {getEstadoBadge(d.estado_publicacion, d.fecha)}
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/social/fecha/${d.id}`)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: `2px solid ${colors.blue}`,
                      background: 'transparent',
                      color: colors.blue,
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.blue;
                      e.currentTarget.style.color = colors.light;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = colors.blue;
                    }}
                  >
                    👁️ Ver
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/profile/organizer/date/${d.id}`)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: `2px solid ${colors.coral}`,
                      background: 'transparent',
                      color: colors.coral,
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.coral;
                      e.currentTarget.style.color = colors.light;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = colors.coral;
                    }}
                  >
                    ✏️ Editar
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div style={{
              marginBottom: '16px',
              fontSize: '0.875rem',
              opacity: 0.8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span>📍</span>
                <span>{d.lugar || d.ciudad || "Lugar por confirmar"}</span>
              </div>
              {d.direccion && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏠</span>
                  <span>{d.direccion}</span>
                </div>
              )}
            </div>

            {/* RSVP Counts */}
            <div style={{ marginBottom: '12px' }}>
              <RSVPCountsRow counts={mapCounts.get(d.id)} variant="detailed" />
            </div>

            {/* Requisitos */}
            {d.requisitos && (
              <div style={{
                padding: '12px',
                background: `${colors.dark}aa`,
                borderRadius: '8px',
                marginBottom: '12px',
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  margin: 0,
                  opacity: 0.8,
                  lineHeight: 1.4,
                }}>
                  <strong>Requisitos:</strong> {d.requisitos}
                </p>
              </div>
            )}

            {/* Info adicional */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              opacity: 0.6,
              borderTop: `1px solid ${colors.light}22`,
              paddingTop: '12px',
            }}>
              <span>📅 Creado: {new Date(d.created_at).toLocaleDateString('es-MX')}</span>
              <span>ID: {d.id}</span>
            </div>
          </motion.div>
        ))}

        {(dates || []).length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              background: `${colors.dark}aa`,
              borderRadius: '16px',
              border: `1px solid ${colors.light}22`,
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📅</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
              Aún no has creado fechas
            </h3>
            <p style={{ opacity: 0.7, marginBottom: '24px' }}>
              Crea la primera fecha para este evento
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/profile/organizer/date/new/${parentId}`)}
              style={{
                padding: '12px 24px',
                borderRadius: '50px',
                border: 'none',
                background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                color: colors.light,
                fontSize: '0.875rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${colors.blue}66`,
              }}
            >
              + Crear Primera Fecha
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
