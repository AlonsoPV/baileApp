import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

export interface ClassItem {
  id: string | number;
  titulo: string;
  inicio?: string;
  fin?: string;
  fecha?: string;
  diaSemana?: number | null;
  diasSemana?: string[] | number[];
  fechaModo?: 'especifica' | 'semanal' | 'por_agendar';
  nivel?: string | null;
  descripcion?: string;
  ubicacion?: string;
  costo?: {
    precio?: number | null;
    tipo?: string;
    regla?: string;
  };
  ritmoIds?: number[];
  [key: string]: any;
}

interface ClassDatesSectionProps {
  classes: ClassItem[];
  isLoading?: boolean;
  onEdit: (index: number) => void;
  onDelete: (index: number) => Promise<void>;
  deletingIndex?: number | null;
  formatDateOrDay: (fecha?: string, diaSemana?: number | null, diasSemana?: string[] | number[]) => string | null;
  formatCurrency: (precio?: number | null) => string | null;
  emptyStateMessage?: string;
  emptyStateAction?: React.ReactNode;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ClassDatesSection({
  classes,
  isLoading = false,
  onEdit,
  onDelete,
  deletingIndex = null,
  formatDateOrDay,
  formatCurrency,
  emptyStateMessage = 'No hay clases configuradas',
  emptyStateAction,
  showToast,
}: ClassDatesSectionProps) {
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  // Agrupar clases por estado (disponibles/pasadas)
  const groupedClasses = useMemo(() => {
    const now = new Date();
    const available: ClassItem[] = [];
    const past: ClassItem[] = [];
    const toAgendar: ClassItem[] = [];

    classes.forEach((cls) => {
      if (cls.fechaModo === 'por_agendar') {
        toAgendar.push(cls);
      } else if (cls.fecha) {
        const classDate = new Date(cls.fecha);
        if (classDate >= now) {
          available.push(cls);
        } else {
          past.push(cls);
        }
      } else if (cls.diaSemana !== null && cls.diaSemana !== undefined) {
        // Clases semanales siempre disponibles
        available.push(cls);
      } else {
        available.push(cls);
      }
    });

    return { available, past, toAgendar };
  }, [classes]);

  const handleDeleteClick = (index: number) => {
    setDeleteConfirmIndex(index);
  };

  const handleDeleteConfirm = async (index: number) => {
    try {
      await onDelete(index);
      showToast?.('Clase eliminada ✅', 'success');
      setDeleteConfirmIndex(null);
    } catch (error) {
      showToast?.('No se pudo eliminar la clase. Intenta de nuevo.', 'error');
      setDeleteConfirmIndex(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmIndex(null);
  };

  if (isLoading) {
    return (
      <div className="dates-section" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Cargando clases...</p>
      </div>
    );
  }

  const hasClasses = classes.length > 0;

  return (
    <>
      <style>{`
        .dates-section {
          background: #121623;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 10px;
          overflow: hidden;
        }

        .dates-section:last-child {
          margin-bottom: 0;
        }

        .dates-section summary {
          list-style: none;
          cursor: pointer;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-weight: 500;
          background: rgba(255, 255, 255, 0.02);
        }

        .dates-section summary::-webkit-details-marker {
          display: none;
        }

        .dates-section-title {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .dates-section-icon {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .dates-section-icon.available {
          background: rgba(39, 195, 255, 0.16);
          color: #27c3ff;
        }

        .dates-section-icon.past {
          background: rgba(255, 134, 94, 0.12);
          color: #ff866e;
        }

        .dates-section-icon.to-agendar {
          background: rgba(251, 191, 36, 0.16);
          color: #fbbf24;
        }

        .dates-section-count {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
        }

        .dates-chevron {
          font-size: 11px;
          color: rgba(255,255,255,0.6);
        }

        .dates-strip {
          padding: 10px 10px 8px;
          display: flex;
          gap: 10px;
          overflow: auto;
          -webkit-overflow-scrolling: touch;
          max-height: 70vh;
          /* Don't trap scroll on desktop; allow scroll to bubble to the page when needed */
          overscroll-behavior: auto;
          scrollbar-gutter: stable;
          scroll-snap-type: x mandatory;
        }

        .dates-strip::-webkit-scrollbar {
          height: 6px;
        }

        .dates-strip::-webkit-scrollbar-track {
          background: #0b0d18;
          border-radius: 999px;
        }

        .dates-strip::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, #7c4dff, #27c3ff);
          border-radius: 999px;
        }

        .date-card {
          min-width: 280px;
          max-width: 300px;
          background: linear-gradient(135deg, rgba(32, 38, 58, 0.95) 0%, rgba(21, 25, 39, 0.98) 50%, rgba(11, 13, 24, 1) 100%);
          border-radius: 18px;
          border: 1.5px solid rgba(39, 195, 255, 0.4);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scroll-snap-align: start;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(39, 195, 255, 0.1) inset;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .date-card:hover {
          transform: translateY(-4px) scale(1.02);
          border-color: rgba(39, 195, 255, 0.7);
          box-shadow: 0 12px 32px rgba(39, 195, 255, 0.25), 0 0 0 1px rgba(39, 195, 255, 0.2) inset;
        }
        
        .date-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #27c3ff, #7c4dff, #27c3ff);
          opacity: 1;
        }

        .date-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }

        .date-card-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .date-card-actions {
          display: flex;
          gap: 6px;
        }

        .date-card-action-btn {
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          color: #fff;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s ease;
        }

        .date-card-action-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.25);
        }

        .date-card-action-btn.delete {
          border-color: rgba(229,57,53,0.35);
          background: rgba(229,57,53,0.12);
        }

        .date-card-action-btn.delete:hover {
          background: rgba(229,57,53,0.2);
          border-color: rgba(229,57,53,0.5);
        }

        .date-card-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .date-card-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.875rem;
          color: rgba(255,255,255,0.8);
        }

        .date-card-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .date-card-badge {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 8px;
          background: rgba(240,147,251,0.15);
          border: 1px solid rgba(240,147,251,0.28);
          color: #fff;
        }

        .delete-confirm-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(4px);
        }

        .delete-confirm-content {
          background: #121623;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }

        .delete-confirm-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 12px 0;
        }

        .delete-confirm-message {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.7);
          margin: 0 0 20px 0;
        }

        .delete-confirm-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .delete-confirm-btn {
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .delete-confirm-btn.cancel {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }

        .delete-confirm-btn.cancel:hover {
          background: rgba(255,255,255,0.15);
        }

        .delete-confirm-btn.confirm {
          background: rgba(229,57,53,0.2);
          color: #ef4444;
          border: 1px solid rgba(229,57,53,0.4);
        }

        .delete-confirm-btn.confirm:hover {
          background: rgba(229,57,53,0.3);
        }
      `}</style>

      {!hasClasses ? (
        <div className="dates-section" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
          <h4 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 0.5rem 0', color: '#fff' }}>
            {emptyStateMessage}
          </h4>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
            Agrega clases para que los estudiantes puedan encontrarlas
          </p>
          {emptyStateAction}
        </div>
      ) : (
        <>
          {groupedClasses.available.length > 0 && (
            <details className="dates-section" open>
              <summary>
                <span className="dates-section-title">
                  <span className="dates-section-icon available">✓</span>
                  Clases disponibles
                  <span className="dates-section-count">({groupedClasses.available.length})</span>
                </span>
                <span className="dates-chevron">▼</span>
              </summary>
              <div className="dates-strip">
                {groupedClasses.available.map((cls, idx) => {
                  const originalIndex = classes.findIndex(c => c.id === cls.id);
                  const fechaLabel = formatDateOrDay(cls.fecha, cls.diaSemana, cls.diasSemana);
                  const costoLabel = formatCurrency(cls.costo?.precio);
                  const isDeleting = deletingIndex === originalIndex;
                  
                  return (
                    <motion.div
                      key={cls.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="date-card"
                    >
                      <div className="date-card-header">
                        <h4 className="date-card-title">{cls.titulo || 'Clase'}</h4>
                        <div className="date-card-actions">
                          <button
                            className="date-card-action-btn"
                            onClick={() => onEdit(originalIndex)}
                            disabled={isDeleting}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="date-card-action-btn delete"
                            onClick={() => handleDeleteClick(originalIndex)}
                            disabled={isDeleting}
                            title="Eliminar"
                          >
                            {isDeleting ? '⏳' : '🗑️'}
                          </button>
                        </div>
                      </div>
                      <div className="date-card-meta">
                        {cls.inicio && cls.fin && (
                          <div>🕒 {cls.inicio} – {cls.fin}</div>
                        )}
                        {(fechaLabel || costoLabel) && (
                          <div className="date-card-badges">
                            {fechaLabel && (
                              <span className="date-card-badge">📅 {fechaLabel}</span>
                            )}
                            {costoLabel && (
                              <span className="date-card-badge" style={{ background: 'rgba(30,136,229,0.15)', borderColor: 'rgba(30,136,229,0.28)' }}>
                                💰 {costoLabel === 'Gratis' ? 'Gratis' : costoLabel}
                              </span>
                            )}
                          </div>
                        )}
                        {cls.ubicacion && (
                          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>📍 {cls.ubicacion}</div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </details>
          )}

          {groupedClasses.toAgendar.length > 0 && (
            <details className="dates-section">
              <summary>
                <span className="dates-section-title">
                  <span className="dates-section-icon to-agendar">📅</span>
                  Por agendar
                  <span className="dates-section-count">({groupedClasses.toAgendar.length})</span>
                </span>
                <span className="dates-chevron">▼</span>
              </summary>
              <div className="dates-strip">
                {groupedClasses.toAgendar.map((cls, idx) => {
                  const originalIndex = classes.findIndex(c => c.id === cls.id);
                  const costoLabel = formatCurrency(cls.costo?.precio);
                  const isDeleting = deletingIndex === originalIndex;
                  
                  return (
                    <motion.div
                      key={cls.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="date-card"
                    >
                      <div className="date-card-header">
                        <h4 className="date-card-title">{cls.titulo || 'Clase'}</h4>
                        <div className="date-card-actions">
                          <button
                            className="date-card-action-btn"
                            onClick={() => onEdit(originalIndex)}
                            disabled={isDeleting}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="date-card-action-btn delete"
                            onClick={() => handleDeleteClick(originalIndex)}
                            disabled={isDeleting}
                            title="Eliminar"
                          >
                            {isDeleting ? '⏳' : '🗑️'}
                          </button>
                        </div>
                      </div>
                      <div className="date-card-meta">
                        {cls.duracionHoras && (
                          <div>⏱️ Duración: {cls.duracionHoras}h</div>
                        )}
                        {costoLabel && (
                          <div className="date-card-badges">
                            <span className="date-card-badge" style={{ background: 'rgba(30,136,229,0.15)', borderColor: 'rgba(30,136,229,0.28)' }}>
                              💰 {costoLabel === 'Gratis' ? 'Gratis' : costoLabel}
                            </span>
                          </div>
                        )}
                        {cls.ubicacion && (
                          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>📍 {cls.ubicacion}</div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </details>
          )}

          {groupedClasses.past.length > 0 && (
            <details className="dates-section">
              <summary>
                <span className="dates-section-title">
                  <span className="dates-section-icon past">⏱</span>
                  Clases pasadas
                  <span className="dates-section-count">({groupedClasses.past.length})</span>
                </span>
                <span className="dates-chevron">▼</span>
              </summary>
              <div className="dates-strip">
                {groupedClasses.past.map((cls, idx) => {
                  const originalIndex = classes.findIndex(c => c.id === cls.id);
                  const fechaLabel = formatDateOrDay(cls.fecha, cls.diaSemana, cls.diasSemana);
                  const costoLabel = formatCurrency(cls.costo?.precio);
                  const isDeleting = deletingIndex === originalIndex;
                  
                  return (
                    <motion.div
                      key={cls.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="date-card past"
                      style={{ opacity: 0.85 }}
                    >
                      <div className="date-card-header">
                        <h4 className="date-card-title">{cls.titulo || 'Clase'}</h4>
                        <div className="date-card-actions">
                          <button
                            className="date-card-action-btn"
                            onClick={() => onEdit(originalIndex)}
                            disabled={isDeleting}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="date-card-action-btn delete"
                            onClick={() => handleDeleteClick(originalIndex)}
                            disabled={isDeleting}
                            title="Eliminar"
                          >
                            {isDeleting ? '⏳' : '🗑️'}
                          </button>
                        </div>
                      </div>
                      <div className="date-card-meta">
                        {cls.inicio && cls.fin && (
                          <div>🕒 {cls.inicio} – {cls.fin}</div>
                        )}
                        {(fechaLabel || costoLabel) && (
                          <div className="date-card-badges">
                            {fechaLabel && (
                              <span className="date-card-badge">📅 {fechaLabel}</span>
                            )}
                            {costoLabel && (
                              <span className="date-card-badge" style={{ background: 'rgba(30,136,229,0.15)', borderColor: 'rgba(30,136,229,0.28)' }}>
                                💰 {costoLabel === 'Gratis' ? 'Gratis' : costoLabel}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </details>
          )}
        </>
      )}

      {/* Modal de confirmación de borrado */}
      {deleteConfirmIndex !== null && (
        <div className="delete-confirm-modal" onClick={handleDeleteCancel}>
          <div className="delete-confirm-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="delete-confirm-title">¿Eliminar esta clase?</h3>
            <p className="delete-confirm-message">
              Esta acción no se puede deshacer. La clase será eliminada permanentemente.
            </p>
            <div className="delete-confirm-actions">
              <button
                className="delete-confirm-btn cancel"
                onClick={handleDeleteCancel}
              >
                Cancelar
              </button>
              <button
                className="delete-confirm-btn confirm"
                onClick={() => handleDeleteConfirm(deleteConfirmIndex)}
                disabled={deletingIndex === deleteConfirmIndex}
              >
                {deletingIndex === deleteConfirmIndex ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
