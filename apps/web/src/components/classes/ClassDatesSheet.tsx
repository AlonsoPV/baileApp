import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClassItem } from './ClassDatesSection';
import { calculateNextDateWithTime } from '../../utils/calculateRecurringDates';

type AttendanceCounts = { lead: number; follow: number; ambos: number };

function ymd(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMetricsDateKeyForClass(item: ClassItem): string | null {
  if (item?.fecha) return String(item.fecha).split('T')[0] || null;

  // Para clases semanales, usar la próxima ocurrencia para que la métrica sea "por fecha" (no acumulada).
  const hora = (item?.inicio ? String(item.inicio) : '20:00').split(':').slice(0, 2).join(':') || '20:00';

  // Preferir diaSemana numérico; si no, intentar desde diasSemana (string/número) y tomar el primero.
  let diaNum: number | null = typeof item?.diaSemana === 'number' ? item.diaSemana : null;
  if (diaNum === null && Array.isArray(item?.diasSemana) && item.diasSemana.length > 0) {
    const first = item.diasSemana[0] as any;
    if (typeof first === 'number') diaNum = first;
    else if (typeof first === 'string') {
      const normalized = first.toLowerCase().trim();
      const map: Record<string, number> = {
        'domingo': 0, 'dom': 0,
        'lunes': 1, 'lun': 1,
        'martes': 2, 'mar': 2,
        'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3,
        'jueves': 4, 'jue': 4,
        'viernes': 5, 'vie': 5,
        'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6,
      };
      diaNum = map[normalized] ?? null;
    }
  }

  if (diaNum === null) return null;
  try {
    const next = calculateNextDateWithTime(diaNum, hora);
    return ymd(next);
  } catch {
    return null;
  }
}

interface ClassDatesSheetProps {
  classes: ClassItem[];
  isLoading?: boolean;
  onEdit: (index: number) => void;
  onDelete: (index: number) => Promise<void>;
  deletingIndex?: number | null;
  formatDateOrDay: (fecha?: string, diaSemana?: number | null, diasSemana?: string[] | number[]) => string | null;
  formatCurrency: (precio?: number | null) => string | null;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  attendanceByClassDateKey?: Record<string, AttendanceCounts>;
}

const Badge = ({ children, tone }: { children: React.ReactNode; tone: "ok" | "warn" | "muted" }) => {
  const toneStyles = {
    ok: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", color: "#10b981" },
    warn: { bg: "rgba(251,191,36,0.15)", border: "rgba(251,191,36,0.4)", color: "#fbbf24" },
    muted: { bg: "rgba(156,163,175,0.15)", border: "rgba(156,163,175,0.4)", color: "#9ca3af" },
  };
  const style = toneStyles[tone];
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
      }}
    >
      {children}
    </div>
  );
};

const toHHmm = (t: string | null | undefined) => {
  if (!t) return "—";
  const [hh = "", mm = ""] = String(t).split(":");
  return `${hh.padStart(2, "0")}:${(mm || "00").padStart(2, "0")}`;
};

const ClassRow = React.memo(function ClassRow({
  classItem,
  index,
  onEdit,
  onDeleteClick,
  deletingIndex,
  formatDateOrDay,
  formatCurrency,
  attendanceByClassDateKey,
}: {
  classItem: ClassItem;
  index: number;
  onEdit: (index: number) => void;
  onDeleteClick: (index: number) => void;
  deletingIndex: number | null;
  formatDateOrDay: (fecha?: string, diaSemana?: number | null, diasSemana?: string[] | number[]) => string | null;
  formatCurrency: (precio?: number | null) => string | null;
  attendanceByClassDateKey?: Record<string, AttendanceCounts>;
}) {
  const isDeleting = deletingIndex === index;
  const fechaLabel = formatDateOrDay(classItem.fecha, classItem.diaSemana, classItem.diasSemana);
  const fechaDisplay = fechaLabel || (classItem.fecha ? String(classItem.fecha).split("T")[0] : "—");

  const classIdNum = Number((classItem as any)?.id);
  const dateKey = getMetricsDateKeyForClass(classItem) || 'sin-fecha';
  const attKey = Number.isFinite(classIdNum) ? `${classIdNum}|${dateKey}` : `invalid|${dateKey}`;
  const att = attendanceByClassDateKey?.[attKey] ?? { lead: 0, follow: 0, ambos: 0 };

  return (
    <div
      className="eds-grid eds-row"
      style={{
        display: "grid",
        gap: 10,
        alignItems: "center",
        padding: "10px 10px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <div
        className="eds-eventName"
        style={{
          color: "#fff",
          fontWeight: 900,
          fontSize: 13,
          minWidth: 0,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as any,
          lineHeight: 1.15,
        }}
        title={classItem.titulo || ""}
      >
        {classItem.titulo || "—"}
      </div>
      <div
        className="eds-dateCell"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            color: "#fff",
            fontSize: 13,
            opacity: 0.9,
            fontWeight: 500,
          }}
        >
          {fechaDisplay}
        </div>
      </div>
      <div style={{ color: "#fff", fontSize: 13, opacity: 0.9 }}>
        {toHHmm(classItem.inicio)}
      </div>
      <div style={{ color: "#fff", fontSize: 13, opacity: 0.9 }}>
        {toHHmm(classItem.fin)}
      </div>
      <div
        className="eds-place"
        style={{
          color: "#fff",
          fontSize: 12,
          opacity: 0.9,
          minWidth: 0,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as any,
          lineHeight: 1.2,
        }}
        title={classItem.ubicacion || ""}
      >
        {(() => {
          if (!classItem.ubicacion) return "—";
          // Extraer solo el nombre de la ubicación (primera parte antes de " · ")
          const parts = classItem.ubicacion.split(' · ');
          return parts[0] || classItem.ubicacion;
        })()}
      </div>
      <div 
        className="eds-cellAttendance"
        style={{ 
          display: "flex", 
          flexDirection: "column",
          gap: 4,
          fontSize: 12,
          color: "#fff",
          opacity: 0.9
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontWeight: 900 }}>👨‍💼 {att.lead}</span>
          <span style={{ fontWeight: 900 }}>👩‍💼 {att.follow}</span>
          <span style={{ fontWeight: 900 }}>👥 {att.ambos}</span>
        </div>
        <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>
          Total: {att.lead + att.follow + att.ambos}
        </div>
      </div>
      <div className="eds-cellActions" style={{ display: "flex" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "nowrap" }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => onEdit(index)}
            className="eds-iconBtn eds-iconBtnPrimary"
            title="Editar clase"
            disabled={isDeleting}
          >
            ✏️
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => onDeleteClick(index)}
            className="eds-iconBtn eds-iconBtnDanger"
            title="Eliminar clase"
            disabled={isDeleting}
          >
            {isDeleting ? "⏳" : "🗑️"}
          </motion.button>
        </div>
      </div>
    </div>
  );
});

export default function ClassDatesSheet({
  classes,
  isLoading = false,
  onEdit,
  onDelete,
  deletingIndex = null,
  formatDateOrDay,
  formatCurrency,
  showToast,
  attendanceByClassDateKey,
}: ClassDatesSheetProps) {
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

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

  // Ordenar clases: disponibles primero, luego por agendar, luego pasadas
  const sortedClasses = useMemo(() => {
    const now = new Date();
    const available: ClassItem[] = [];
    const toAgendar: ClassItem[] = [];
    const past: ClassItem[] = [];

    classes.forEach((cls, idx) => {
      if (cls.fechaModo === 'por_agendar') {
        toAgendar.push({ ...cls, _originalIndex: idx });
      } else if (cls.fecha) {
        const classDate = new Date(cls.fecha);
        if (classDate >= now) {
          available.push({ ...cls, _originalIndex: idx });
        } else {
          past.push({ ...cls, _originalIndex: idx });
        }
      } else if (cls.diaSemana !== null && cls.diaSemana !== undefined) {
        available.push({ ...cls, _originalIndex: idx });
      } else {
        available.push({ ...cls, _originalIndex: idx });
      }
    });

    return [...available, ...toAgendar, ...past];
  }, [classes]);

  return (
    <div style={{ width: "100%" }}>
      <style>{`
        /* Allow both horizontal + vertical scrolling inside the sheet area */
        .eds-scroll {
          overflow: auto;
          -webkit-overflow-scrolling: touch;
          max-height: 70vh;
          /* Don't trap scroll on desktop; allow scroll to bubble to the page when needed */
          overscroll-behavior: auto;
          scrollbar-gutter: stable;
        }
        .eds-minWidth { min-width: 930px; }
        .eds-grid {
          /* Column widths for header + rows */
          --eds-actions-col: 140px;
          --eds-att-col: 120px;
          /* ↓ Reduce Evento/Lugar widths and let them wrap to 2 lines */
          --eds-event-col: 165px;
          --eds-date-col: 140px;
          --eds-time-col: 72px;
          --eds-place-col: minmax(120px, 1fr);
          --eds-att-col: 140px;
          --eds-cols: var(--eds-event-col) var(--eds-date-col) var(--eds-time-col) var(--eds-time-col) var(--eds-place-col) var(--eds-att-col) var(--eds-actions-col);
        }
        /* Explicit grid-template-columns per request */
        .eds-grid.eds-row { grid-template-columns: var(--eds-cols); }
        .eds-grid.eds-header { grid-template-columns: var(--eds-cols); }
        /* Ensure Acciones never collapse */
        .eds-cellActions { min-width: var(--eds-actions-col); }
        .eds-hActions { min-width: var(--eds-actions-col); }
        .eds-cellAttendance { min-width: var(--eds-att-col); }
        .eds-hAttendance { min-width: var(--eds-att-col); }
        .eds-header {
          position: sticky;
          top: 0;
          z-index: 2;
          background: rgba(18,18,18,0.92);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 8px 10px;
          border: 1px solid rgba(255,255,255,0.10);
        }
        .eds-iconBtn{
          width: 38px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.22);
          background: #1a1f2b;
          color: #fff;
          cursor: pointer;
          font-weight: 900;
          user-select: text;
          -webkit-user-select: text;
          box-shadow: 0 8px 18px rgba(0,0,0,0.25);
          transition: transform .12s ease, border-color .12s ease, background .12s ease, box-shadow .12s ease, opacity .12s ease;
        }
        .eds-iconBtn:hover{ transform: translateY(-1px); border-color: rgba(255,255,255,0.32); background: #23293a; }
        .eds-iconBtn:active{ transform: translateY(0px) scale(0.98); }
        .eds-iconBtn:disabled{ opacity: .55; cursor: not-allowed; box-shadow: none; }
        .eds-iconBtnPrimary{ border-color: rgba(39,195,255,0.75); background: #1E88E5; }
        .eds-iconBtnPrimary:hover{ background: #1976D2; border-color: rgba(39,195,255,0.9); }
        .eds-iconBtnDanger{ border-color: rgba(255,61,87,0.75); background: #FF3D57; }
        .eds-iconBtnDanger:hover{ background: #E53935; border-color: rgba(255,61,87,0.9); }

        .eds-editableDate{
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 12px;
          border: 1px dashed rgba(39,195,255,0.35);
          background: rgba(39,195,255,0.08);
          color: #fff;
          font-weight: 900;
          cursor: pointer;
          transition: border-color .12s ease, background .12s ease, transform .12s ease;
          max-width: 100%;
          min-width: 0;
          overflow: hidden;
        }
        .eds-editableDate:hover{ border-color: rgba(39,195,255,0.65); background: rgba(39,195,255,0.12); transform: translateY(-1px); }
        .eds-editableDate:active{ transform: translateY(0px) scale(0.99); }

        @media (max-width: 720px) {
          .eds-minWidth { min-width: 780px; }
          .eds-grid { --eds-actions-col: 132px; --eds-att-col: 130px; --eds-event-col: 160px; --eds-date-col: 132px; --eds-time-col: 64px; --eds-place-col: minmax(120px, 1fr); --eds-cols: var(--eds-event-col) var(--eds-date-col) var(--eds-time-col) var(--eds-time-col) var(--eds-place-col) var(--eds-att-col) var(--eds-actions-col); }
          .eds-iconBtn{ width: 36px; height: 36px; border-radius: 999px; }
        }
        @media (max-width: 520px) {
          .eds-minWidth { min-width: 620px; }
          .eds-place { display: none; }
          .eds-grid { --eds-actions-col: 132px; --eds-att-col: 130px; --eds-event-col: minmax(180px, 1fr); --eds-date-col: 110px; --eds-time-col: 64px; --eds-cols: var(--eds-event-col) var(--eds-date-col) var(--eds-time-col) var(--eds-time-col) var(--eds-att-col) var(--eds-actions-col); }
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

      {/* Table */}
      <div className="eds-scroll">
        <div className="eds-minWidth">
          <div className="eds-grid eds-header" style={{ display: "grid", gap: 10, opacity: 0.9, fontSize: 12, marginBottom: 8, color: "#fff" }}>
            <div>Evento</div>
            <div>Fecha</div>
            <div>Inicio</div>
            <div>Fin</div>
            <div className="eds-place">Ubicación</div>
            <div className="eds-hAttendance">Asistencia</div>
            <div className="eds-hActions">Acciones</div>
          </div>
          {isLoading && (
            <div style={{ color: "rgba(255,255,255,0.8)", padding: 12 }}>Cargando…</div>
          )}
          {!isLoading && sortedClasses.length === 0 && (
            <div style={{ color: "rgba(255,255,255,0.8)", padding: 12 }}>No hay clases.</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sortedClasses.map((cls) => {
              const originalIndex = (cls as any)._originalIndex ?? classes.findIndex(c => c.id === cls.id);
              return (
                <ClassRow
                  key={cls.id}
                  classItem={cls}
                  index={originalIndex}
                  onEdit={onEdit}
                  onDeleteClick={handleDeleteClick}
                  deletingIndex={deletingIndex}
                  formatDateOrDay={formatDateOrDay}
                  formatCurrency={formatCurrency}
                  attendanceByClassDateKey={attendanceByClassDateKey}
                />
              );
            })}
          </div>
        </div>
      </div>

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
    </div>
  );
}
