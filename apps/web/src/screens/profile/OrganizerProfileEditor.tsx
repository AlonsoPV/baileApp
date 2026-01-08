import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMyOrganizer, useUpsertMyOrganizer, useSubmitOrganizerForReview } from "../../hooks/useOrganizer";
import { useParentsByOrganizer, useDeleteParent, useDatesByParent, useDeleteDate, useCreateParent, useUpdateDate } from "../../hooks/useEvents";
import { useEventDatesByOrganizer } from "../../hooks/useEventParentsByOrganizer";
import { useOrganizerMedia } from "../../hooks/useOrganizerMedia";
import { useCreateEventDate } from "../../hooks/useEventDate";
import { MediaUploader } from "../../components/MediaUploader";
import { MediaGrid } from "../../components/MediaGrid";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { useToast } from "../../components/Toast";
import ProfileToolbar from "../../components/profile/ProfileToolbar";
import { Chip } from "../../components/profile/Chip";
import { useTags } from "../../hooks/useTags";
import { useHydratedForm } from "../../hooks/useHydratedForm";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import { supabase } from "../../lib/supabase";
import { PhotoManagementSection } from "../../components/profile/PhotoManagementSection";
import { VideoManagementSection } from "../../components/profile/VideoManagementSection";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";
import { getDraftKey } from "../../utils/draftKeys";
import { useDrafts } from "../../state/drafts";
import { useRoleChange } from "../../hooks/useRoleChange";
import { useAuth } from "@/contexts/AuthProvider";
import RitmosChips from "@/components/RitmosChips";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import ScheduleEditor from "../../components/events/ScheduleEditor";
import CostsEditor from "../../components/events/CostsEditor";
import DateFlyerUploader from "../../components/events/DateFlyerUploader";
import { calculateNextDateWithTime } from "../../utils/calculateRecurringDates";
import RitmosSelectorEditor from "@/components/profile/RitmosSelectorEditor";
import RSVPCounter from "../../components/RSVPCounter";
import OrganizerLocationPicker from "../../components/locations/OrganizerLocationPicker";
import { useOrganizerLocations, useCreateOrganizerLocation, useUpdateOrganizerLocation, useDeleteOrganizerLocation, type OrganizerLocation } from "../../hooks/useOrganizerLocations";
import OrganizerUbicacionesEditor from "../../components/organizer/UbicacionesEditor";
import UbicacionesEditor from "../../components/locations/UbicacionesEditor";
import type { AcademyLocation } from "../../types/academy";
import { ensureMaxVideoDuration } from "../../utils/videoValidation";
import ZonaGroupedChips from "../../components/profile/ZonaGroupedChips";
import { OrganizerEventMetricsPanel } from "../../components/profile/OrganizerEventMetricsPanel";
import BankAccountEditor, { type BankAccountData } from "../../components/profile/BankAccountEditor";
import { validateZonasAgainstCatalog } from "../../utils/validateZonas";
import { FaInstagram, FaFacebookF, FaWhatsapp, FaGlobe, FaTelegram } from 'react-icons/fa';
import { StripePayoutSettings } from "../../components/payments/StripePayoutSettings";
import { useMyApprovedRoles } from "../../hooks/useMyApprovedRoles";
import { useQueryClient } from "@tanstack/react-query";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

const toAcademyLocation = (loc?: OrganizerLocation | null): AcademyLocation | null => {
  if (!loc) return null;
  return {
    sede: loc.nombre || '',
    direccion: loc.direccion || '',
    ciudad: loc.ciudad || '',
    referencias: loc.referencias || '',
    zona_id: typeof loc.zona_id === 'number'
      ? loc.zona_id
      : Array.isArray(loc.zona_ids) && loc.zona_ids.length
        ? loc.zona_ids[0] ?? null
        : null,
  };
};

type BulkPubEstado = 'borrador' | 'publicado';
type BulkFlyerStatus = 'PENDING' | 'UPLOADING' | 'DONE' | 'ERROR';

type BulkRow = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado_publicacion: BulkPubEstado;
  notas: string;
  selected: boolean;
  flyer_status: BulkFlyerStatus;
  flyer_url?: string | null;
};

const makeRowId = () => {
  try {
    // @ts-ignore - crypto puede no existir en algunos entornos antiguos
    return typeof crypto !== 'undefined' && crypto?.randomUUID ? crypto.randomUUID() : `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  } catch {
    return `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
};

const BulkRowItem = React.memo(function BulkRowItem({
  row,
  errors,
  onChange,
  onRemove,
}: {
  row: BulkRow;
  errors?: Record<string, string>;
  onChange: (rowId: string, patch: Partial<BulkRow>) => void;
  onRemove: (rowId: string) => void;
}) {
  const rowErr = errors || {};
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 140px 120px 120px 140px 1fr 44px',
        gap: 10,
        alignItems: 'center',
        padding: '10px 10px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.04)',
      }}
    >
      <input
        type="checkbox"
        checked={row.selected}
        onChange={(e) => onChange(row.id, { selected: e.target.checked })}
        style={{ width: 18, height: 18 }}
      />

      <div>
        <input
          type="date"
          value={row.fecha}
          onChange={(e) => onChange(row.id, { fecha: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 10,
            border: rowErr.fecha ? '1px solid rgba(255,61,87,0.9)' : '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(0,0,0,0.25)',
            color: '#fff',
          }}
        />
        {rowErr.fecha && (
          <div style={{ color: '#ff3d57', fontSize: 11, marginTop: 4 }}>{rowErr.fecha}</div>
        )}
      </div>

      <input
        type="time"
        value={row.hora_inicio}
        onChange={(e) => onChange(row.id, { hora_inicio: e.target.value })}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(0,0,0,0.25)',
          color: '#fff',
        }}
      />

      <div>
        <input
          type="time"
          value={row.hora_fin}
          onChange={(e) => onChange(row.id, { hora_fin: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 10,
            border: rowErr.hora_fin ? '1px solid rgba(255,61,87,0.9)' : '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(0,0,0,0.25)',
            color: '#fff',
          }}
        />
        {rowErr.hora_fin && (
          <div style={{ color: '#ff3d57', fontSize: 11, marginTop: 4 }}>{rowErr.hora_fin}</div>
        )}
      </div>

      <select
        value={row.estado_publicacion}
        onChange={(e) => onChange(row.id, { estado_publicacion: e.target.value as BulkPubEstado })}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.18)',
          background: '#2b2b2b',
          color: '#fff',
        }}
      >
        <option value="borrador">📝 borrador</option>
        <option value="publicado">🌐 publicado</option>
      </select>

      <input
        type="text"
        value={row.notas}
        onChange={(e) => onChange(row.id, { notas: e.target.value })}
        placeholder="Notas (opcional)"
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(0,0,0,0.25)',
          color: '#fff',
        }}
      />

      <button
        type="button"
        onClick={() => onRemove(row.id)}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(255,255,255,0.05)',
          color: '#fff',
          cursor: 'pointer',
        }}
        title="Eliminar fila"
      >
        🗑️
      </button>
    </div>
  );
});

// Componente para mostrar un social con sus fechas
function EventParentCard({ parent, onDelete, isDeleting, onDuplicateDate, onDeleteDate, deletingDateId, isMobile }: any) {
  const navigate = useNavigate();
  const { data: dates } = useDatesByParent(parent.id);
  const [expanded, setExpanded] = useState(false);

  const formatEsDate = (input?: string) => {
    try {
      if (!input) return '';
      const base = input.includes('T') ? input.split('T')[0] : input;
      const [yyyy, mm, dd] = base.split('-').map(n => parseInt(n, 10));
      if (!yyyy || !mm || !dd) return base;
      const dt = new Date(yyyy, (mm - 1), dd);
      return dt.toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return input || '';
    }
  };

  // Dividir fechas en disponibles (desde hoy en adelante) y pasadas (días anteriores)
  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const parseLocalYmd = (value?: string | null) => {
    if (!value) return null as Date | null;
    try {
      const plain = String(value).split('T')[0];
      const [y, m, d] = plain.split('-').map((n) => parseInt(n, 10));
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
        const fallback = new Date(value);
        return Number.isNaN(fallback.getTime()) ? null : fallback;
      }
      return new Date(y, m - 1, d);
    } catch {
      return null;
    }
  };

  // Obtener la fecha "efectiva" a usar para clasificación y display (maneja eventos recurrentes)
  const getDisplayFechaYmd = (d: any): string | null => {
    try {
      // Si es recurrente semanal, calcular la próxima ocurrencia desde hoy
      if (d.dia_semana !== null && d.dia_semana !== undefined && typeof d.dia_semana === 'number') {
        const horaInicioStr = d.hora_inicio || '20:00';
        const next = calculateNextDateWithTime(d.dia_semana, horaInicioStr);
        const year = next.getFullYear();
        const month = String(next.getMonth() + 1).padStart(2, '0');
        const day = String(next.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      if (!d.fecha) return null;
      return String(d.fecha).split('T')[0];
    } catch {
      return d?.fecha ? String(d.fecha).split('T')[0] : null;
    }
  };

  const availableDates = (dates || []).filter((d: any) => {
    try {
      const displayYmd = getDisplayFechaYmd(d);
      if (!displayYmd) return false;
      const dateObj = parseLocalYmd(displayYmd);
      if (!dateObj) return false;
      dateObj.setHours(0, 0, 0, 0);
      return dateObj >= today;
    } catch {
      return false;
    }
  });

  const pastDates = (dates || [])
    .filter((d: any) => {
      try {
        // Los eventos recurrentes semanales no se consideran "pasados":
        // siempre tendrán una próxima ocurrencia futura.
        if (d.dia_semana !== null && d.dia_semana !== undefined && typeof d.dia_semana === 'number') {
          return false;
        }
        const displayYmd = getDisplayFechaYmd(d);
        if (!displayYmd) return false;
        const dateObj = parseLocalYmd(displayYmd);
        if (!dateObj) return false;
        dateObj.setHours(0, 0, 0, 0);
        return dateObj < today;
      } catch {
        return false;
      }
    })
    .sort((a: any, b: any) => {
      const da = parseLocalYmd(a.fecha);
      const db = parseLocalYmd(b.fecha);
      if (!da || !db) return 0;
      // Más recientes primero
      return db.getTime() - da.getTime();
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="org-event-dates-wrapper"
    >
      {/* Fechas del social (tarjeta de social desactivada) */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {dates && dates.length > 0 ? (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                background: 'rgba(30, 136, 229, 0.1)',
                border: '2px solid rgba(30, 136, 229, 0.2)',
                color: colors.light,
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '700',
                marginBottom: expanded ? '1rem' : '0',
                padding: '1rem 1.25rem',
                borderRadius: '14px',
                width: '100%',
                textAlign: 'left',
                transition: 'all 0.3s ease',
                boxShadow: expanded ? '0 4px 16px rgba(30, 136, 229, 0.2)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>📅</span>
                <span>
                  {availableDates.length} fecha
                  {availableDates.length !== 1 ? 's' : ''} disponible
                  {availableDates.length !== 1 ? 's' : ''} · {pastDates.length} pasada
                  {pastDates.length !== 1 ? 's' : ''}
                </span>
              </div>
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                style={{ fontSize: '0.875rem', opacity: 0.8 }}
              >
                ▼
              </motion.span>
            </motion.button>

            {expanded && (
              <div style={{ marginTop: '1rem' }}>
                <div className="dates-block">
                  {/* Fechas disponibles */}
                  {availableDates.length > 0 && (
                    <details className="dates-section" open>
                      <summary>
                        <span className="dates-section-title">
                          <span className="dates-section-icon available">✓</span>
                          Fechas disponibles
                          <span className="dates-section-count">
                            ({availableDates.length})
                          </span>
                        </span>
                        <span className="dates-chevron">▼</span>
                      </summary>

                      <div className="dates-strip">
                        {availableDates.map((date: any) => (
                          <article
                            key={date.id}
                            className="date-card"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/social/fecha/${date.id}`);
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <header className="date-card-header">
                              <div>
                                <h3 className="date-card-title">
                                  {date.nombre || 'Fecha sin nombre'}
                                </h3>
                                <div className="date-pill">
                                  <span className="date-pill-icon">📅</span>
                                  {formatEsDate(getDisplayFechaYmd(date) || date.fecha)}
                                </div>
                              </div>
                              <span className="date-status date-status-available">
                                Disponible
                              </span>
                            </header>

                            <div className="date-card-body">
                              {date.hora_inicio && date.hora_fin && (
                                <div className="date-row">
                                  <span className="chip">
                                    🕒 {date.hora_inicio} – {date.hora_fin}
                                  </span>
                                </div>
                              )}
                              {(date.lugar || date.ciudad) && (
                                <div className="date-row">
                                  {date.lugar && (
                                    <span className="chip">📍 {date.lugar}</span>
                                  )}
                                  {date.ciudad && (
                                    <span className="chip chip-muted">
                                      {date.ciudad}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <footer className="date-card-footer">
                              <span className="chip chip-people">
                                <RSVPCounter
                                  eventDateId={date.id}
                                  variant="minimal"
                                  showIcons={true}
                                />
                              </span>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="date-card-button date-card-button--view"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/social/fecha/${date.id}`);
                                  }}
                                >
                                  👁 Ver
                                </button>
                                <button
                                  type="button"
                                  className="date-card-button date-card-button--edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/social/fecha/${date.id}/edit`);
                                  }}
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  type="button"
                                  className="date-card-button date-card-button--delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteDate(date);
                                  }}
                                  disabled={deletingDateId === date.id}
                                >
                                  {deletingDateId === date.id ? '⏳' : '🗑️'} Eliminar
                                </button>
                              </div>
                            </footer>
                          </article>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Fechas pasadas */}
                  {pastDates.length > 0 && (
                    <details className="dates-section">
                      <summary>
                        <span className="dates-section-title">
                          <span className="dates-section-icon past">⏱</span>
                          Fechas pasadas
                          <span className="dates-section-count">
                            ({pastDates.length})
                          </span>
                        </span>
                        <span className="dates-chevron">▼</span>
                      </summary>

                      <div className="dates-strip">
                        {pastDates.map((date: any) => (
                          <article
                            key={date.id}
                            className="date-card past"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/social/fecha/${date.id}`);
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <header className="date-card-header">
                              <div>
                                <h3 className="date-card-title">
                                  {date.nombre || 'Fecha sin nombre'}
                                </h3>
                                <div className="date-pill">
                                  <span className="date-pill-icon">📅</span>
                                  {formatEsDate(getDisplayFechaYmd(date) || date.fecha)}
                                </div>
                              </div>
                              <span className="date-status date-status-past">
                                Pasada
                              </span>
                            </header>

                            <div className="date-card-body">
                              {(date.lugar || date.ciudad) && (
                                <div className="date-row">
                                  {date.lugar && (
                                    <span className="chip">{date.lugar}</span>
                                  )}
                                  {date.ciudad && (
                                    <span className="chip chip-muted">
                                      {date.ciudad}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <footer className="date-card-footer">
                              <span className="chip chip-people">
                                <RSVPCounter
                                  eventDateId={date.id}
                                  variant="minimal"
                                  showIcons={true}
                                />
                              </span>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="date-card-button date-card-button--view"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/social/fecha/${date.id}`);
                                  }}
                                >
                                  👁 Ver
                                </button>
                                <button
                                  type="button"
                                  className="date-card-button date-card-button--edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/social/fecha/${date.id}/edit`);
                                  }}
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  type="button"
                                  className="date-card-button date-card-button--delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteDate(date);
                                  }}
                                  disabled={deletingDateId === date.id}
                                >
                                  {deletingDateId === date.id ? '⏳' : '🗑️'} Eliminar
                                </button>
                              </div>
                            </footer>
                          </article>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, margin: 0 }}>
              No hay fechas para este social
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function OrganizerProfileEditor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });
  const { data: org, isLoading, refetch: refetchOrganizer } = useMyOrganizer();
  const upsert = useUpsertMyOrganizer();
  const submit = useSubmitOrganizerForReview();
  const { data: parents } = useParentsByOrganizer((org as any)?.id);
  const { data: allOrganizerDates = [] } = useEventDatesByOrganizer((org as any)?.id);
  const { data: orgLocations = [] } = useOrganizerLocations((org as any)?.id);
  const createOrgLoc = useCreateOrganizerLocation();
  const updateOrgLoc = useUpdateOrganizerLocation();
  const deleteOrgLoc = useDeleteOrganizerLocation();
  const deleteParent = useDeleteParent();
  const deleteDate = useDeleteDate();
  const createParent = useCreateParent();
  const updateDate = useUpdateDate();
  const { media, add, remove } = useOrganizerMedia();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"perfil" | "metricas">("perfil");
  const [previousApprovalStatus, setPreviousApprovalStatus] = React.useState<string | null>(null);
  const [showWelcomeBanner, setShowWelcomeBanner] = React.useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setIsMobile(window.innerWidth <= 768);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Scroll al top cuando cambia la pestaña
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Detectar cuando el perfil es aprobado y mostrar mensaje de bienvenida
  useEffect(() => {
    if (!org) {
      // Inicializar el estado cuando no hay perfil
      if (previousApprovalStatus === null) {
        setPreviousApprovalStatus(null);
      }
      return;
    }

    const currentStatus = (org as any)?.estado_aprobacion;
    
    // Inicializar el estado anterior si es la primera vez que tenemos datos
    if (previousApprovalStatus === null && currentStatus) {
      setPreviousApprovalStatus(currentStatus);
      return;
    }
    
    // Si el estado anterior era "en_revision" o "borrador" y ahora es "aprobado"
    if (
      previousApprovalStatus && 
      (previousApprovalStatus === 'en_revision' || previousApprovalStatus === 'borrador') &&
      currentStatus === 'aprobado' &&
      previousApprovalStatus !== currentStatus
    ) {
      showToast('🎉 ¡Bienvenido, Organizador! Tu perfil ha sido aprobado. Ya puedes empezar a crear tus eventos.', 'success');
      setShowWelcomeBanner(true); // Mostrar banner de bienvenida
      // Ocultar el banner después de 10 segundos
      setTimeout(() => setShowWelcomeBanner(false), 10000);
    }

    // Actualizar el estado anterior
    if (currentStatus && currentStatus !== previousApprovalStatus) {
      setPreviousApprovalStatus(currentStatus);
    }
  }, [org, previousApprovalStatus, showToast]);

  // Estados para carga de media
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  // Estado local para edición de ubicaciones por social (no se guarda en profiles_organizer)
  const [locationsDraftByParent, setLocationsDraftByParent] = useState<Record<number, any[]>>({});

  // Estado para formulario de crear fecha
  const [showDateForm, setShowDateForm] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const createEventDate = useCreateEventDate();
  const [deletingDateId, setDeletingDateId] = useState<number | null>(null);
  const [dateToDelete, setDateToDelete] = useState<{ id: number; nombre: string } | null>(null);
  const [selectedDateLocationId, setSelectedDateLocationId] = useState<string>('');
  const [dateForm, setDateForm] = useState({
    nombre: '',
    biografia: '',
    djs: '',
    telefono_contacto: '',
    mensaje_contacto: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    lugar: '',
    ciudad: '',
    direccion: '',
    referencias: '',
    requisitos: '',
    ubicaciones: [] as AcademyLocation[],
    zona: null as number | null,
    estilos: [] as number[],
    ritmos_seleccionados: [] as string[],
    zonas: [] as number[],
    cronograma: [] as any[],
    costos: [] as any[],
    flyer_url: null as string | null,
    estado_publicacion: 'borrador' as 'borrador' | 'publicado',
    repetir_semanal: false,
    semanas_repetir: 4
  });

  // Bulk planner (v1)
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkPaste, setBulkPaste] = useState<string>('');
  const [bulkErrors, setBulkErrors] = useState<Record<string, Record<string, string>>>({});
  const [createdBatchDates, setCreatedBatchDates] = useState<any[]>([]);
  const [showPendingFlyers, setShowPendingFlyers] = useState(false);
  const [createdDateIdByRow, setCreatedDateIdByRow] = useState<Record<string, number>>({});
  const [bulkGeneralFlyerUrl, setBulkGeneralFlyerUrl] = useState<string | null>(null);
  const [bulkShowAllFlyers, setBulkShowAllFlyers] = useState(false);

  const updateBulkRow = useCallback((rowId: string, patch: Partial<BulkRow>) => {
    setBulkRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));
  }, []);

  const addBulkRow = useCallback((partial?: Partial<BulkRow>) => {
    const base: BulkRow = {
      id: makeRowId(),
      fecha: '',
      hora_inicio: dateForm.hora_inicio || '',
      hora_fin: dateForm.hora_fin || '',
      estado_publicacion: (dateForm.estado_publicacion || 'borrador') as BulkPubEstado,
      notas: '',
      selected: true,
      flyer_status: 'PENDING',
      flyer_url: null,
    };
    setBulkRows((prev) => [...prev, { ...base, ...(partial || {}) }]);
  }, [dateForm.estado_publicacion, dateForm.hora_fin, dateForm.hora_inicio]);

  const removeBulkRow = useCallback((rowId: string) => {
    setBulkRows((prev) => prev.filter((r) => r.id !== rowId));
    setBulkErrors((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
    setCreatedDateIdByRow((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  }, []);

  const setAllBulkSelected = useCallback((selected: boolean) => {
    setBulkRows((prev) => prev.map((r) => ({ ...r, selected })));
  }, []);

  const bulkSelectedCount = useMemo(() => bulkRows.filter((r) => r.selected).length, [bulkRows]);

  const parseBulkPasteToRows = useCallback(() => {
    const lines = (bulkPaste || '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const nextRows: BulkRow[] = [];

    for (const line of lines) {
      // Acepta:
      // - YYYY-MM-DD
      // - YYYY-MM-DD HH:MM
      // - YYYY-MM-DD HH:MM-HH:MM
      // - YYYY-MM-DD,HH:MM,HH:MM
      const parts = line.split(/[,\t ]+/).filter(Boolean);
      const datePart = parts[0] || '';

      let start = '';
      let end = '';

      const timePart = parts[1] || '';
      if (timePart && timePart.includes('-')) {
        const [a, b] = timePart.split('-', 2);
        start = (a || '').trim();
        end = (b || '').trim();
      } else {
        start = (parts[1] || '').trim();
        end = (parts[2] || '').trim();
      }

      nextRows.push({
        id: makeRowId(),
        fecha: datePart,
        hora_inicio: start || (dateForm.hora_inicio || ''),
        hora_fin: end || (dateForm.hora_fin || ''),
        estado_publicacion: (dateForm.estado_publicacion || 'borrador') as BulkPubEstado,
        notas: '',
        selected: true,
        flyer_status: 'PENDING',
        flyer_url: null,
      });
    }

    setBulkRows((prev) => [...prev, ...nextRows]);
  }, [bulkPaste, dateForm.estado_publicacion, dateForm.hora_fin, dateForm.hora_inicio]);

  const generateWeeklyRowsFromTemplate = useCallback(() => {
    if (!dateForm.fecha) {
      showToast('Selecciona una fecha base para generar ocurrencias', 'info');
      return;
    }
    const semanas = Math.max(1, Math.min(52, dateForm.semanas_repetir || 1));
    const [year, month, day] = dateForm.fecha.split('-').map(Number);
    const primeraFecha = new Date(year, (month - 1), day);

    const nextRows: BulkRow[] = Array.from({ length: semanas }, (_, i) => {
      const f = new Date(primeraFecha);
      f.setDate(f.getDate() + 7 * i);
      const y = f.getFullYear();
      const m = String(f.getMonth() + 1).padStart(2, '0');
      const d = String(f.getDate()).padStart(2, '0');
      const fechaStr = `${y}-${m}-${d}`;

      return {
        id: makeRowId(),
        fecha: fechaStr,
        hora_inicio: dateForm.hora_inicio || '',
        hora_fin: dateForm.hora_fin || '',
        estado_publicacion: (dateForm.estado_publicacion || 'borrador') as BulkPubEstado,
        notas: '',
        selected: true,
        flyer_status: 'PENDING',
        flyer_url: null,
      };
    });

    setBulkRows((prev) => [...prev, ...nextRows]);
  }, [dateForm.estado_publicacion, dateForm.fecha, dateForm.hora_fin, dateForm.hora_inicio, dateForm.semanas_repetir, showToast]);

  const validateBulkRows = useCallback((rows: BulkRow[]) => {
    const errors: Record<string, Record<string, string>> = {};

    for (const r of rows) {
      const rowErr: Record<string, string> = {};
      if (!r.fecha) rowErr.fecha = 'Fecha requerida';
      if (r.hora_inicio && r.hora_fin) {
        if (r.hora_inicio === r.hora_fin) {
          rowErr.hora_fin = 'Hora fin no puede ser igual a hora inicio';
        }
      }
      if (Object.keys(rowErr).length) errors[r.id] = rowErr;
    }

    setBulkErrors(errors);
    return errors;
  }, []);

  const bulkPreview = useMemo(() => {
    const selected = bulkRows.filter((r) => r.selected).map((r) => r.fecha).filter(Boolean);
    const sorted = [...selected].sort();
    return {
      count: selected.length,
      first: sorted[0] || null,
      last: sorted[sorted.length - 1] || null,
    };
  }, [bulkRows]);

  const clearBulk = useCallback(() => {
    setBulkRows([]);
    setBulkPaste('');
    setBulkErrors({});
    setCreatedBatchDates([]);
    setShowPendingFlyers(false);
    setBulkGeneralFlyerUrl(null);
    setBulkShowAllFlyers(false);
  }, []);

  const handleDateUbicacionesChange = (list: AcademyLocation[]) => {
    const zonasSet = new Set<number>();
    list.forEach((loc) => {
      if (typeof loc?.zona_id === 'number') zonasSet.add(loc.zona_id);
    });
    const primary = list[0];
    setDateForm((prev) => ({
      ...prev,
      ubicaciones: list,
      lugar: primary?.sede || '',
      direccion: primary?.direccion || '',
      ciudad: primary?.ciudad || '',
      referencias: primary?.referencias || '',
      zona: typeof primary?.zona_id === 'number' ? primary.zona_id : null,
      zonas: zonasSet.size ? Array.from(zonasSet) : prev.zonas,
    }));
  };

  const applyOrganizerLocationToDateForm = (loc?: OrganizerLocation | null) => {
    const converted = toAcademyLocation(loc);
    if (!converted) return;
    setSelectedDateLocationId(loc?.id ? String(loc.id) : '');
    handleDateUbicacionesChange([converted]);
  };

  const updateManualDateLocationField = (
    key: 'lugar' | 'direccion' | 'ciudad' | 'referencias',
    value: string
  ) => {
    setSelectedDateLocationId('');
    setDateForm((prev) => ({
      ...prev,
      [key]: value,
      ubicaciones: [],
    }));
  };

  const toggleDateZona = (id: number) => {
    setDateForm((prev) => {
      const current = prev.zonas || [];
      const exists = current.includes(id);
      return {
        ...prev,
        zonas: exists ? current.filter((z) => z !== id) : [...current, id],
      };
    });
  };

  // Nota: No auto-seleccionar la primera ubicación guardada para permitir entrada manual por defecto

  useEffect(() => {
    if (!selectedDateLocationId) return;
    const exists = orgLocations.some((loc) => String(loc.id ?? '') === selectedDateLocationId);
    if (!exists) {
      setSelectedDateLocationId('');
    }
  }, [orgLocations, selectedDateLocationId]);

  // Función para subir archivo
  const uploadFile = async (file: File, slot: string, kind: "photo" | "video") => {
    if (kind === 'video') {
      try {
        await ensureMaxVideoDuration(file, 25);
      } catch (error) {
        console.error('[OrganizerProfileEditor] Video demasiado largo:', error);
        showToast(
          error instanceof Error ? error.message : 'El video debe durar máximo 25 segundos',
          'error'
        );
        return;
      }
    }

    setUploading(prev => ({ ...prev, [slot]: true }));

    try {
      await add.mutateAsync({ file, slot });
      showToast(`${kind === 'photo' ? 'Foto' : 'Video'} subido correctamente`, 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Error al subir el archivo', 'error');
    } finally {
      setUploading(prev => ({ ...prev, [slot]: false }));
    }
  };

  // Función para eliminar archivo
  const removeFile = async (slot: string) => {
    try {
      // Buscar el media item por slot
      const mediaItem = media.find(m => (m as any).slot === slot);
      if (mediaItem) {
        await remove.mutateAsync(mediaItem.id);
        showToast('Archivo eliminado', 'success');
      } else {
        showToast('No se encontró el archivo', 'error');
      }
    } catch (error) {
      console.error('Error removing file:', error);
      showToast('Error al eliminar el archivo', 'error');
    }
  };

  // Manejar cambio de roles
  useRoleChange();

  // Obtener usuario autenticado
  const { user, loading: authLoading } = useAuth();
  const { data: approvedRoles } = useMyApprovedRoles();

  // ⏳ Timeouts de seguridad para evitar loops eternos de carga (especialmente en WebView)
  const [authTimeoutReached, setAuthTimeoutReached] = useState(false);
  const [profileTimeoutReached, setProfileTimeoutReached] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      setAuthTimeoutReached(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setAuthTimeoutReached(true);
    }, 15000); // 15s
    return () => window.clearTimeout(timer);
  }, [authLoading]);

  useEffect(() => {
    if (!isLoading) {
      setProfileTimeoutReached(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setProfileTimeoutReached(true);
    }, 15000); // 15s
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  // Cargar tags
  const { data: allTags } = useTags();
  const ritmoTags = allTags?.filter(tag => tag.tipo === 'ritmo') || [];
  const zonaTags = allTags?.filter(tag => tag.tipo === 'zona') || [];

  // Usar formulario hidratado con borrador persistente (namespace por usuario y rol)
  const { clearDraft } = useDrafts();
  const { form, setField, setNested, hydrated, setFromServer } = useHydratedForm({
    draftKey: getDraftKey(user?.id, 'organizer'),
    serverData: org as any,
    defaults: {
      nombre_publico: "",
      bio: "",
      ritmos_seleccionados: [] as string[],
      ritmos: [] as number[],
      zonas: [] as number[],
      redes_sociales: {
        instagram: "",
        facebook: "",
        whatsapp: "",
        web: "",
        telegram: ""
      },
      respuestas: {
        musica_tocaran: "",
        hay_estacionamiento: ""
      },
      cuenta_bancaria: {} as BankAccountData
    },
    preferDraft: true
  });

  // Funciones para toggle de chips
  const toggleRitmo = (id: number) => {
    const newRitmos = form.ritmos.includes(id)
      ? form.ritmos.filter(r => r !== id)
      : [...form.ritmos, id];
    setField('ritmos', newRitmos);
  };

  const toggleZona = (id: number) => {
    const newZonas = form.zonas.includes(id)
      ? form.zonas.filter(z => z !== id)
      : [...form.zonas, id];
    setField('zonas', newZonas);
  };

  // Función para guardar
  const handleSave = async () => {
    try {
      // Asegurar que ritmos_seleccionados se guarde; si está vacío pero hay ritmos (numéricos), mapear por etiqueta
      let outSelected = ((((form as any)?.ritmos_seleccionados) || []) as string[]);
      if ((!outSelected || outSelected.length === 0) && Array.isArray(form.ritmos) && form.ritmos.length > 0) {
        const labelToItemId = new Map<string, string>();
        RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelToItemId.set(i.label, i.id)));
        const names = form.ritmos
          .map(id => ritmoTags.find(t => t.id === id)?.nombre)
          .filter(Boolean) as string[];
        const mapped = names
          .map(n => labelToItemId.get(n))
          .filter(Boolean) as string[];
        if (mapped.length > 0) outSelected = mapped;
      }

      const wasNewProfile = !org; // Detectar si es un perfil nuevo

      // Validar zonas contra el catálogo
      const validatedZonas = validateZonasAgainstCatalog(form.zonas || [], allTags);

      const savedProfile = await upsert.mutateAsync({ 
        ...(form as any), 
        ritmos_seleccionados: outSelected,
        zonas: validatedZonas,
        cuenta_bancaria: (form as any).cuenta_bancaria || {}
      } as any);

      // Refetch explícito para actualizar el estado inmediatamente
      const refetched = await refetchOrganizer();
      
      // Sincronizar el formulario con los datos actualizados del servidor
      if (refetched.data) {
        const updatedData = refetched.data as any;
        
        // Limpiar el borrador después de guardar exitosamente para evitar conflictos
        const draftKey = getDraftKey(user?.id, 'organizer');
        clearDraft(draftKey);
        
        // Usar setFromServer para sincronizar el form con los datos del servidor
        // Esto también resetea el estado "dirty"
        setFromServer(updatedData);
        
        // Invalidar también la query de media para asegurar que las fotos se recarguen
        queryClient.invalidateQueries({ queryKey: ["organizer", "media", updatedData.id] });
        queryClient.invalidateQueries({ queryKey: ["organizer", "me", user?.id] });
      }

      // Si es un perfil nuevo, crear evento y fecha por defecto
      const profileId = (savedProfile as any)?.id;
      if (wasNewProfile && profileId) {
        try {
          // Crear evento padre por defecto
          const parentPayload: any = {
            organizer_id: profileId,
            nombre: '🎉 Mi Primer Social',
            descripcion: 'Crea tus eventos. Edita el nombre, descripción y agrega fechas desde el editor.',
            ritmos_seleccionados: outSelected || [],
            zonas: validatedZonas
          };

          const { data: newParent, error: parentErr } = await supabase
            .from('events_parent')
            .insert(parentPayload)
            .select('*')
            .single();

          if (parentErr) {
            console.error('❌ [OrganizerProfileEditor] Error creando social por defecto:', parentErr);
            showToast('⚠️ Perfil creado, pero no se pudo crear el social por defecto', 'info');
          } else if (newParent) {
            // Crear fecha por defecto (para 7 días adelante)
            const fechaBase = new Date();
            fechaBase.setDate(fechaBase.getDate() + 7);
            const fechaStr = fechaBase.toISOString().slice(0, 10);

            const datePayload = {
              parent_id: newParent.id,
              nombre: '📅 Primera Fecha',
              biografia: 'Configura la información de tu primera fecha: hora, lugar, precios y más.',
              fecha: fechaStr,
              hora_inicio: '20:00',
              hora_fin: '02:00',
              lugar: null,
              ciudad: null,
              estado_publicacion: 'borrador',
              ritmos_seleccionados: outSelected || [],
              zonas: validatedZonas,
              cronograma: [],
              costos: []
            };

            const { error: dateErr } = await supabase
              .from('events_date')
              .insert(datePayload);

            if (dateErr) {
              console.error('❌ [OrganizerProfileEditor] Error creando fecha por defecto:', dateErr);
            }
          }
        } catch (seedErr) {
          console.error('❌ [OrganizerProfileEditor] Error en semilla automática:', seedErr);
        }
      }

      // Toast final basado en si es nuevo o actualización
      if (wasNewProfile) {
        showToast('🎉 ¡Bienvenido, Organizador! Tu perfil ha sido creado exitosamente. Ya puedes empezar a crear tus eventos.', 'success');
      } else {
        showToast('✅ Organizador actualizado', 'success');
      }
    } catch (err: any) {
      console.error("❌ [OrganizerProfileEditor] Error al guardar:", err);
      showToast('Error al guardar', 'error');
    }
  };

  // Función para enviar para revisión
  const handleSubmitForReview = async () => {
    try {
      await submit.mutateAsync();
      showToast('Enviado para revisión ✅', 'success');
    } catch (err: any) {
      console.error('Error submitting for review:', err);
      showToast('Error al enviar para revisión', 'error');
    }
  };

  // Función para eliminar evento
  const handleDeleteEvent = async (parentId: string) => {
    try {
      const confirmDelete = window.confirm('¿Seguro que deseas eliminar este social? Esta acción no se puede deshacer.');
      if (!confirmDelete) return;
      await deleteParent.mutateAsync(Number(parentId));
      showToast('Evento eliminado ✅', 'success');
    } catch (err: any) {
      console.error('Error deleting event:', err);
      showToast('Error al eliminar evento', 'error');
    }
  };

  // Función para crear fecha
  const handleCreateDate = async () => {
    if (!dateForm.fecha) {
      showToast('La fecha es obligatoria', 'error');
      return;
    }

    try {
      // Las fechas pueden ser independientes (parent_id puede ser null)
      // Solo usar el parent_id si el usuario lo seleccionó explícitamente
      const parentIdToUse: number | null = selectedParentId ? Number(selectedParentId) : null;

      const selectedOrganizerLocation = selectedDateLocationId
        ? orgLocations.find((loc) => String(loc.id ?? '') === selectedDateLocationId)
        : undefined;

      const primaryLocation = (dateForm.ubicaciones && dateForm.ubicaciones[0]) || undefined;
      const resolvedLugar = primaryLocation?.sede || dateForm.lugar || selectedOrganizerLocation?.nombre || null;
      const resolvedDireccion = primaryLocation?.direccion || dateForm.direccion || selectedOrganizerLocation?.direccion || null;
      const resolvedCiudad = primaryLocation?.ciudad || dateForm.ciudad || selectedOrganizerLocation?.ciudad || null;
      const resolvedReferencias = primaryLocation?.referencias || dateForm.referencias || selectedOrganizerLocation?.referencias || null;

      const resolvedZonaFromLocation = () => {
        if (typeof dateForm.zona === 'number') return dateForm.zona;
        if (typeof primaryLocation?.zona_id === 'number') return primaryLocation.zona_id;
        if (typeof selectedOrganizerLocation?.zona_id === 'number') return selectedOrganizerLocation.zona_id;
        if (Array.isArray(selectedOrganizerLocation?.zona_ids) && selectedOrganizerLocation.zona_ids.length) {
          return selectedOrganizerLocation.zona_ids[0] ?? null;
        }
        return null;
      };

      const resolvedZonasFromLocations = () => {
        if (dateForm.zonas && dateForm.zonas.length) return dateForm.zonas;
        const set = new Set<number>();
        (dateForm.ubicaciones || []).forEach((loc) => {
          if (typeof loc?.zona_id === 'number') set.add(loc.zona_id);
        });
        if (Array.isArray(selectedOrganizerLocation?.zona_ids) && selectedOrganizerLocation.zona_ids.length) {
          selectedOrganizerLocation.zona_ids.forEach((z) => {
            if (typeof z === 'number') set.add(z);
          });
        }
        return set.size ? Array.from(set) : [];
      };

      const resolvedZona = resolvedZonaFromLocation();
      const resolvedZonasRaw = resolvedZonasFromLocations();
      // Validar zonas contra el catálogo
      const resolvedZonas = validateZonasAgainstCatalog(resolvedZonasRaw, allTags);

      const basePayload = {
        parent_id: parentIdToUse ? Number(parentIdToUse) : null,
        organizer_id: (org as any)?.id ?? null,
        nombre: dateForm.nombre || null,
        biografia: dateForm.biografia || null,
        djs: dateForm.djs || null,
        telefono_contacto: dateForm.telefono_contacto || null,
        mensaje_contacto: dateForm.mensaje_contacto || null,
        hora_inicio: dateForm.hora_inicio || null,
        hora_fin: dateForm.hora_fin || null,
        lugar: resolvedLugar,
        direccion: resolvedDireccion,
        ciudad: resolvedCiudad,
        zona: resolvedZona,
        referencias: resolvedReferencias,
        requisitos: dateForm.requisitos || null,
        estilos: dateForm.estilos || [],
        ritmos_seleccionados: dateForm.ritmos_seleccionados || [],
        zonas: resolvedZonas,
        cronograma: dateForm.cronograma || [],
        costos: dateForm.costos || [],
        flyer_url: dateForm.flyer_url || null,
        estado_publicacion: dateForm.estado_publicacion || 'borrador'
      };

      // Crear fechas de forma optimizada:
      // - Si NO es semanal: una sola fila en events_date con la fecha indicada
      // - Si es semanal: N filas (semanas_repetir) cada 7 días a partir de la fecha seleccionada
      // OPTIMIZACIÓN: Crear todas las fechas en una sola operación batch
      let datesToCreate: any[] = [];
      
      if (!dateForm.repetir_semanal) {
        datesToCreate = [{
          ...basePayload,
          fecha: dateForm.fecha,
          dia_semana: null,
        }];
      } else {
        const semanas = Math.max(1, Math.min(52, dateForm.semanas_repetir || 1));
        const [year, month, day] = dateForm.fecha.split('-').map(Number);
        const primeraFecha = new Date(year, (month - 1), day);

        datesToCreate = Array.from({ length: semanas }, (_, i) => {
          const f = new Date(primeraFecha);
          f.setDate(f.getDate() + 7 * i);
          const y = f.getFullYear();
          const m = String(f.getMonth() + 1).padStart(2, '0');
          const d = String(f.getDate()).padStart(2, '0');
          const fechaStr = `${y}-${m}-${d}`;

          return {
            ...basePayload,
            fecha: fechaStr,
            dia_semana: null, // cada fila es una fecha concreta; RSVP será por fecha
          };
        });
      }
      
      // Crear todas las fechas en una sola operación batch (mucho más rápido)
      try {
        const createdDates = await createEventDate.mutateAsync(datesToCreate);
        const count = Array.isArray(createdDates) ? createdDates.length : 1;
        
        showToast(
          count === 1 
            ? 'Fecha creada ✅' 
            : `${count} fechas creadas exitosamente ✅`,
          'success'
        );
      } catch (createError: any) {
        // El error ya se maneja en el catch general, pero podemos mejorar el mensaje
        throw createError;
      }
      
      setShowDateForm(false);
      setDateForm({
        nombre: '',
        biografia: '',
        djs: '',
        telefono_contacto: '',
        mensaje_contacto: '',
        fecha: '',
        hora_inicio: '',
        hora_fin: '',
        lugar: '',
        ciudad: '',
        direccion: '',
        referencias: '',
        requisitos: '',
        ubicaciones: [],
        zona: null,
        estilos: [],
        ritmos_seleccionados: [],
        zonas: [],
        cronograma: [],
        costos: [],
        flyer_url: null,
        estado_publicacion: 'borrador',
        repetir_semanal: false,
        semanas_repetir: 4
      });
      setSelectedDateLocationId('');
      setSelectedParentId(null);
    } catch (err: any) {
      console.error('Error creating date:', err);
      const errorMessage = err?.message || 'Error desconocido';
      const isMultiple = dateForm.repetir_semanal && (dateForm.semanas_repetir || 1) > 1;
      
      showToast(
        isMultiple 
          ? `Error al crear fechas: ${errorMessage}` 
          : `Error al crear fecha: ${errorMessage}`,
        'error'
      );
    }
  };

  const handleBulkCreateDates = async () => {
    const selectedRows = bulkRows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      showToast('Selecciona al menos una fila', 'info');
      return;
    }

    const errs = validateBulkRows(selectedRows);
    if (Object.keys(errs).length > 0) {
      showToast('Revisa los errores en la tabla antes de guardar', 'error');
      return;
    }

    try {
      const parentIdToUse: number | null = selectedParentId ? Number(selectedParentId) : null;

      const selectedOrganizerLocation = selectedDateLocationId
        ? orgLocations.find((loc) => String(loc.id ?? '') === selectedDateLocationId)
        : undefined;

      const primaryLocation = (dateForm.ubicaciones && dateForm.ubicaciones[0]) || undefined;
      const resolvedLugar = primaryLocation?.sede || dateForm.lugar || selectedOrganizerLocation?.nombre || null;
      const resolvedDireccion = primaryLocation?.direccion || dateForm.direccion || selectedOrganizerLocation?.direccion || null;
      const resolvedCiudad = primaryLocation?.ciudad || dateForm.ciudad || selectedOrganizerLocation?.ciudad || null;
      const resolvedReferencias = primaryLocation?.referencias || dateForm.referencias || selectedOrganizerLocation?.referencias || null;

      const resolvedZonaFromLocation = () => {
        if (typeof dateForm.zona === 'number') return dateForm.zona;
        if (typeof primaryLocation?.zona_id === 'number') return primaryLocation.zona_id;
        if (typeof selectedOrganizerLocation?.zona_id === 'number') return selectedOrganizerLocation.zona_id;
        if (Array.isArray(selectedOrganizerLocation?.zona_ids) && selectedOrganizerLocation.zona_ids.length) {
          return selectedOrganizerLocation.zona_ids[0] ?? null;
        }
        return null;
      };

      const resolvedZonasFromLocations = () => {
        if (dateForm.zonas && dateForm.zonas.length) return dateForm.zonas;
        const set = new Set<number>();
        (dateForm.ubicaciones || []).forEach((loc) => {
          if (typeof loc?.zona_id === 'number') set.add(loc.zona_id);
        });
        if (Array.isArray(selectedOrganizerLocation?.zona_ids) && selectedOrganizerLocation.zona_ids.length) {
          selectedOrganizerLocation.zona_ids.forEach((z) => {
            if (typeof z === 'number') set.add(z);
          });
        }
        return set.size ? Array.from(set) : [];
      };

      const resolvedZona = resolvedZonaFromLocation();
      const resolvedZonasRaw = resolvedZonasFromLocations();
      const resolvedZonas = validateZonasAgainstCatalog(resolvedZonasRaw, allTags);

      const basePayload = {
        parent_id: parentIdToUse ? Number(parentIdToUse) : null,
        organizer_id: (org as any)?.id ?? null,
        nombre: dateForm.nombre || null,
        biografia: dateForm.biografia || null,
        djs: dateForm.djs || null,
        telefono_contacto: dateForm.telefono_contacto || null,
        mensaje_contacto: dateForm.mensaje_contacto || null,
        lugar: resolvedLugar,
        direccion: resolvedDireccion,
        ciudad: resolvedCiudad,
        zona: resolvedZona,
        referencias: resolvedReferencias,
        requisitos: dateForm.requisitos || null,
        estilos: dateForm.estilos || [],
        ritmos_seleccionados: dateForm.ritmos_seleccionados || [],
        zonas: resolvedZonas,
        cronograma: dateForm.cronograma || [],
        costos: dateForm.costos || [],
      };

      // Importante: Bulk no se bloquea por flyers. Todo nace en borrador.
      const payloads = selectedRows.map((r) => ({
        ...basePayload,
        fecha: r.fecha,
        hora_inicio: r.hora_inicio || null,
        hora_fin: r.hora_fin || null,
        // Si hay flyer general, se aplica a todas las fechas del batch.
        flyer_url: bulkGeneralFlyerUrl || null,
        estado_publicacion: 'borrador' as const,
        dia_semana: null,
      }));

      const created = await createEventDate.mutateAsync(payloads);
      const createdDates = Array.isArray(created) ? created : [created];

      // Mapear rowId -> dateId de forma robusta (sin depender del orden).
      // Key: fecha|hora_inicio|hora_fin|lugar|ciudad|parent_id
      const makeKey = (o: {
        fecha?: string | null;
        hora_inicio?: string | null;
        hora_fin?: string | null;
        lugar?: string | null;
        ciudad?: string | null;
        parent_id?: number | null;
      }) => `${o.fecha || ''}|${o.hora_inicio || ''}|${o.hora_fin || ''}|${o.lugar || ''}|${o.ciudad || ''}|${o.parent_id ?? ''}`;

      const buckets = new Map<string, number[]>();
      for (const d of createdDates as any[]) {
        const key = makeKey({
          fecha: d?.fecha ? String(d.fecha).split('T')[0] : null,
          hora_inicio: d?.hora_inicio ?? null,
          hora_fin: d?.hora_fin ?? null,
          lugar: d?.lugar ?? null,
          ciudad: d?.ciudad ?? null,
          parent_id: d?.parent_id ?? null,
        });
        const arr = buckets.get(key) || [];
        if (d?.id) arr.push(Number(d.id));
        buckets.set(key, arr);
      }

      const mapping: Record<string, number> = {};
      for (let i = 0; i < selectedRows.length; i++) {
        const row = selectedRows[i];
        const key = makeKey({
          fecha: row.fecha,
          hora_inicio: row.hora_inicio || null,
          hora_fin: row.hora_fin || null,
          lugar: resolvedLugar,
          ciudad: resolvedCiudad,
          parent_id: parentIdToUse,
        });
        const arr = buckets.get(key) || [];
        const id = arr.shift();
        if (id) {
          mapping[row.id] = id;
          buckets.set(key, arr);
        }
      }

      // Fallback: si por alguna razón faltan algunos, completar por orden
      const stillMissing = selectedRows.filter((r) => !mapping[r.id]);
      if (stillMissing.length) {
        stillMissing.forEach((row, idx) => {
          const d = createdDates[idx] as any;
          if (d?.id) mapping[row.id] = Number(d.id);
        });
      }

      setCreatedBatchDates(createdDates);
      setCreatedDateIdByRow((prev) => ({ ...prev, ...mapping }));
      // Si ya hay flyer general, por default no es necesario abrir el panel de flyers.
      setShowPendingFlyers(!bulkGeneralFlyerUrl);

      // Sincronizar estado local de filas: si usamos flyer general, marcarlas como DONE.
      if (bulkGeneralFlyerUrl) {
        selectedRows.forEach((row) => {
          updateBulkRow(row.id, { flyer_url: bulkGeneralFlyerUrl, flyer_status: 'DONE' });
        });
      }

      showToast(`${createdDates.length} fechas creadas ✅ (en borrador)`, 'success');
    } catch (e: any) {
      console.error('[OrganizerProfileEditor] bulk create error:', e);
      showToast(e?.message || 'Error al crear fechas en batch', 'error');
    }
  };

  const applyBulkGeneralFlyerToCreated = async (onlySelected: boolean) => {
    if (!bulkGeneralFlyerUrl) {
      showToast('Primero sube/selecciona un flyer general', 'info');
      return;
    }
    const rows = onlySelected ? bulkRows.filter((r) => r.selected) : bulkRows;
    const withIds = rows
      .map((r) => ({ row: r, id: createdDateIdByRow[r.id] }))
      .filter((x) => !!x.id);

    if (withIds.length === 0) {
      showToast('No hay fechas creadas a las que aplicar el flyer (guarda el batch primero)', 'info');
      return;
    }

    try {
      const ids = withIds.map((x) => Number(x.id));
      const { error } = await supabase
        .from('events_date')
        .update({ flyer_url: bulkGeneralFlyerUrl as any })
        .in('id', ids);
      if (error) throw error;

      // Estado local (para que el panel muestre DONE sin recargar)
      withIds.forEach(({ row }) => {
        updateBulkRow(row.id, { flyer_url: bulkGeneralFlyerUrl, flyer_status: 'DONE' });
      });

      queryClient.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
      showToast(`Flyer aplicado a ${ids.length} fecha${ids.length !== 1 ? 's' : ''} ✅`, 'success');
    } catch (e: any) {
      console.error('[OrganizerProfileEditor] apply bulk general flyer error:', e);
      showToast(e?.message || 'Error aplicando flyer general', 'error');
    }
  };

  const handleBulkPublish = async (onlySelected: boolean) => {
    const rows = onlySelected ? bulkRows.filter((r) => r.selected) : bulkRows;
    const withIds = rows
      .map((r) => ({ row: r, id: createdDateIdByRow[r.id] }))
      .filter((x) => !!x.id);

    if (withIds.length === 0) {
      showToast('No hay fechas creadas para publicar (primero guarda el batch)', 'info');
      return;
    }

    try {
      const ids = withIds.map((x) => Number(x.id));
      const { error } = await supabase
        .from('events_date')
        .update({ estado_publicacion: 'publicado' as any })
        .in('id', ids);
      if (error) throw error;

      // refrescar listas (evita stale)
      queryClient.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
      queryClient.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });
      if (selectedParentId) {
        queryClient.invalidateQueries({ queryKey: ["event", "dates", selectedParentId] });
        queryClient.invalidateQueries({ queryKey: ["dates", selectedParentId] });
      }

      showToast('Fechas publicadas ✅', 'success');
    } catch (e: any) {
      console.error('[OrganizerProfileEditor] bulk publish error:', e);
      showToast(e?.message || 'Error al publicar', 'error');
    }
  };

  const handleDuplicateDate = async (date: any) => {
    if (!date) return;
    if (createEventDate.isPending) {
      showToast('Espera a que termine la operación en curso antes de duplicar.', 'info');
      return;
    }

    const computeNextDate = (src?: string) => {
      try {
        if (!src) return src;
        const base = src.includes('T') ? src.split('T')[0] : src;
        const [yyyy, mm, dd] = base.split('-').map((n: string) => parseInt(n, 10));
        if (!yyyy || !mm || !dd) return src;
        const dt = new Date(yyyy, mm - 1, dd);
        dt.setDate(dt.getDate() + 7); // siguiente semana por defecto
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      } catch {
        return src;
      }
    };

    try {
      const payload = {
        parent_id: typeof date.parent_id === 'number' ? date.parent_id : null,
        organizer_id: (date as any)?.organizer_id ?? (org as any)?.id ?? null,
        nombre: date.nombre ? `${date.nombre} (copia)` : null,
        biografia: date.biografia || null,
        fecha: computeNextDate(date.fecha),
        hora_inicio: date.hora_inicio || null,
        hora_fin: date.hora_fin || null,
        lugar: date.lugar || null,
        direccion: date.direccion || null,
        ciudad: date.ciudad || null,
        zona: typeof date.zona === 'number' ? date.zona : null,
        referencias: date.referencias || null,
        requisitos: date.requisitos || null,
        estilos: Array.isArray(date.estilos) ? [...date.estilos] : [],
        ritmos_seleccionados: Array.isArray(date.ritmos_seleccionados) ? [...date.ritmos_seleccionados] : [],
        zonas: Array.isArray(date.zonas) ? [...date.zonas] : [],
        cronograma: Array.isArray(date.cronograma) ? date.cronograma.map((item: any) => ({ ...item })) : [],
        costos: Array.isArray(date.costos) ? date.costos.map((item: any) => ({ ...item })) : [],
        flyer_url: date.flyer_url || null,
        estado_publicacion: 'borrador' as 'borrador' | 'publicado',
      };

      await createEventDate.mutateAsync(payload);
      showToast('Fecha duplicada como borrador ✅', 'success');
    } catch (error: any) {
      console.error('[OrganizerProfileEditor] Error duplicating date:', error);
      showToast('No se pudo duplicar la fecha. Intenta de nuevo.', 'error');
    }
  };

  const handleDeleteDate = (date: any) => {
    if (!date?.id) return;
    // Mostrar modal de confirmación en lugar de window.confirm
    setDateToDelete({ id: date.id, nombre: date.nombre || 'sin nombre' });
  };

  const confirmDeleteDate = async () => {
    if (!dateToDelete) return;
    
    const dateId = dateToDelete.id;
    const dateName = dateToDelete.nombre;
    
    try {
      setDeletingDateId(dateId);
      setDateToDelete(null); // Cerrar modal inmediatamente
      
      // Optimización: Limpiar RSVPs en paralelo con la eliminación (no bloqueante)
      // Nota TS: el builder de Supabase no es Promise hasta que se `await` (no existe `.catch()` en el tipo).
      const rsvpCleanup = (async () => {
        try {
          await supabase.from('event_rsvp').delete().eq('event_date_id', dateId);
        } catch (e) {
          // No bloquear si falla la limpieza de RSVPs
          console.warn('[OrganizerProfileEditor] Limpieza de RSVPs omitida:', e);
        }
      })();
      
      // Eliminar la fecha (esto es lo importante)
      await deleteDate.mutateAsync(dateId);
      
      // Esperar limpieza de RSVPs en background (no bloquea)
      await rsvpCleanup;
      
      showToast(`Fecha "${dateName}" eliminada ✅`, 'success');
    } catch (error: any) {
      console.error('[OrganizerProfileEditor] Error deleting date:', error);
      const msg = error?.message || 'No se pudo eliminar la fecha. Intenta nuevamente.';
      showToast(msg, 'error');
    } finally {
      setDeletingDateId(null);
    }
  };

  const cancelDeleteDate = () => {
    setDateToDelete(null);
  };

  // Función para obtener badge de estado
  const getEstadoBadge = () => {
    if (!org) return null; // Si no hay perfil, no mostrar badge

    const badges: Record<string, { bg: string; text: string; icon: string }> = {
      borrador: { bg: '#94A3B8', text: 'Borrador', icon: '📝' },
      en_revision: { bg: colors.orange, text: 'En Revisión', icon: '⏳' },
      aprobado: { bg: '#10B981', text: 'Verificado', icon: '✅' },
      rechazado: { bg: colors.coral, text: 'Rechazado', icon: '❌' },
    };

    const estado = (org as any)?.estado_aprobacion;
    if (!estado || estado === 'borrador') return null;

    const badge = badges[estado] || badges.en_revision;

    return (
      <span
        style={{
          padding: '8px 16px',
          borderRadius: '20px',
          background: `${badge.bg}cc`,
          border: `2px solid ${badge.bg}`,
          color: colors.light,
          fontSize: '0.875rem',
          fontWeight: '700',
          boxShadow: `0 2px 8px ${badge.bg}66`,
        }}
      >
        {badge.icon} {badge.text}
      </span>
    );
  };

  // ✅ Esperar a que auth termine de cargar antes de renderizar
  if (authLoading && !authTimeoutReached) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: colors.light,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div style={{ marginBottom: '8px' }}>Estamos cargando tu sesión...</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            Si tarda mucho, intenta refrescar la página para una carga más rápida.
          </div>
        </div>
      </div>
    );
  }

  // ⛔ Si la sesión nunca termina de cargar
  if (authLoading && authTimeoutReached) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: colors.light,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>⚠️</div>
          <div style={{ marginBottom: '0.75rem' }}>
            No pudimos cargar tu sesión. Revisa tu conexión e inténtalo de nuevo.
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '4px',
              padding: '0.55rem 1.4rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.35)',
              background: 'transparent',
              color: colors.light,
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ✅ Si no hay usuario después de que auth termine, mostrar mensaje
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: colors.light,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
          <div>No has iniciado sesión</div>
        </div>
      </div>
    );
  }

  // ✅ Esperar a que el perfil cargue
  if (isLoading && !profileTimeoutReached) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: colors.light,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div style={{ marginBottom: '8px' }}>Estamos cargando tu perfil del organizador...</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            Si tarda mucho, intenta refrescar la página para una carga más rápida.
          </div>
        </div>
      </div>
    );
  }

  // ⛔ Si el perfil nunca termina de cargar
  if (isLoading && profileTimeoutReached) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: colors.light,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>⚠️</div>
          <div style={{ marginBottom: '0.75rem' }}>
            No pudimos cargar el perfil del organizador. Revisa tu conexión e inténtalo de nuevo.
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '4px',
              padding: '0.55rem 1.4rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.35)',
              background: 'transparent',
              color: colors.light,
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Si no hay perfil, mostrar el formulario vacío (no bloquear)
  const isNewProfile = !org;

  const estadoBadge = getEstadoBadge();

  return (
    <>
      <style>{`
        .org-editor-wrapper {
          padding: 2rem;
        }
        
        .org-editor-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .org-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .org-editor-back {
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }
        
        .org-editor-back:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.4);
        }
        
        .org-editor-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          flex: 1 1 0%;
          text-align: center;
          color: #FFFFFF;
        }
        
        .org-editor-container h2,
        .org-editor-container h3,
        .org-editor-card h2,
        .org-events-section h2 {
          color: #fff;
          text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px;
        }
        
        .org-editor-card {
          margin-bottom: 2rem;
          padding: 1.2rem;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
        }
        
        .org-editor-card p {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .org-editor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        
        .org-editor-grid-small {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        
        .org-editor-field {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #FFFFFF;
          font-size: 0.95rem;
        }
        
        .org-editor-input {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: #FFFFFF;
          font-size: 1rem;
        }
        
        .org-editor-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
          opacity: 1;
        }
        
        .org-editor-input:focus {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          outline: none;
          color: #FFFFFF;
        }
        
        .org-editor-textarea {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: #FFFFFF;
          font-size: 1rem;
          resize: vertical;
        }
        
        .org-editor-textarea::placeholder {
          color: rgba(255, 255, 255, 0.5);
          opacity: 1;
        }
        
        .org-editor-textarea:focus {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          outline: none;
          color: #FFFFFF;
        }
        
        .org-editor-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .org-events-section {
          margin-bottom: 3rem;
          padding: clamp(1.5rem, 3vw, 2.5rem);
          border-radius: clamp(20px, 3vw, 32px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05) inset;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          color: #FFFFFF;
        }

        .org-events-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #1E88E5, #00BCD4, #FF3D57, #FF8C42);
          opacity: 0.95;
          border-radius: clamp(20px, 3vw, 32px) clamp(20px, 3vw, 32px) 0 0;
        }
        
        .org-events-section h2,
        .org-events-section h3,
        .org-events-section h4 {
          color: #FFFFFF;
          text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px;
        }
        
        .org-events-section p {
          color: rgba(255, 255, 255, 0.85);
        }

        .org-events-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          position: relative;
          z-index: 2;
        }
        
        .org-events-header-left {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex: 1 1 auto;
          min-width: 0;
        }
        
        .org-events-header-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          background: linear-gradient(135deg, rgba(30, 136, 229, 0.2), rgba(0, 188, 212, 0.2));
          border: 2px solid rgba(30, 136, 229, 0.3);
          box-shadow: 0 6px 20px rgba(30, 136, 229, 0.25);
          flex-shrink: 0;
        }
        
        .org-events-header-text {
          flex: 1;
          min-width: 0;
        }
        
        .org-events-header-text h2 {
          font-size: clamp(1.5rem, 2.5vw, 2rem);
          font-weight: 800;
          margin: 0 0 0.5rem 0;
          line-height: 1.2;
        }
        
        .org-events-header-text p {
          font-size: clamp(0.9rem, 1.2vw, 1rem);
          margin: 0;
          opacity: 0.85;
        }
        
        .org-events-header-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          align-items: center;
        }
        
        .org-events-action-button {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.9rem 1.6rem;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        
        .org-events-action-button--primary {
          background: linear-gradient(135deg, #1E88E5, #00BCD4);
          color: #FFFFFF;
          box-shadow: 0 8px 24px rgba(30, 136, 229, 0.4);
        }
        
        .org-events-action-button--primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(30, 136, 229, 0.5);
        }
        
        .org-events-action-button--active {
          background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.12));
          color: #FFFFFF;
          box-shadow: 0 8px 24px rgba(255,255,255,0.08);
        }
        
        .org-events-action-button--secondary {
          background: linear-gradient(135deg, #FF3D57, #FF8C42);
          color: #FFFFFF;
          box-shadow: 0 8px 24px rgba(255, 61, 87, 0.4);
        }
        
        .org-events-action-button--secondary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(255, 61, 87, 0.5);
        }
        
        .org-events-header-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          box-shadow: 0 4px 16px rgba(30, 136, 229, 0.3);
          flex-shrink: 0;
        }
        
        .org-events-header-text h2 {
          font-size: 1.75rem;
          fontWeight: 800;
          margin: 0;
          color: #FFFFFF;
        }
        
        .org-events-header-text p {
          font-size: 0.9rem;
          opacity: 0.8;
          margin: 0;
          fontWeight: 500;
        }
        
        .org-events-header-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          flex-shrink: 0;
        }
        
        .org-events-action-button {
          padding: 0.9rem 1.6rem;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          color: #FFFFFF;
          font-size: 0.95rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          position: relative;
          overflow: hidden;
          letter-spacing: 0.2px;
          transition: all 0.3s ease;
        }
        
        .org-events-action-button--primary {
          background: linear-gradient(135deg, #1E88E5, #00BCD4);
          box-shadow: 0 8px 24px rgba(30,136,229,0.45);
        }
        
        .org-events-action-button--primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(30,136,229,0.55);
        }
        
        .org-events-action-button--secondary {
          background: linear-gradient(135deg, #FF3D57, #FF8C42);
          box-shadow: 0 8px 24px rgba(255,61,87,0.4);
        }
        
        .org-events-action-button--secondary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(255,61,87,0.5);
        }
        
        .org-events-action-button--active {
          background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.12));
          box-shadow: 0 8px 24px rgba(255,255,255,0.08);
        }

        .org-events-grid {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          position: relative;
          z-index: 2;
        }
        
        .org-event-card {
          padding: clamp(1.5rem, 2.5vw, 2.5rem);
          border-radius: clamp(18px, 2.5vw, 28px);
          border: 2px solid rgba(255, 255, 255, 0.15);
          background: rgba(30, 30, 30, 0.6);
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Bloque de fechas (disponibles y pasadas) dentro de cada social */
        :root {
          --bg-section: #11141f;
          --bg-card: #181c2a;
          --border-soft: rgba(255, 255, 255, 0.06);
          --text-main: #f8fbff;
          --text-muted: #8f96b3;
          --accent-blue: #27c3ff;
          --accent-orange: #ff865e;
          --accent-purple: #8b6cff;
        }

        .dates-block {
          background: var(--bg-section);
          border-radius: 18px;
          border: 1px solid var(--border-soft);
          padding: 14px 14px 10px;
          color: var(--text-main);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 14px;
        }

        .dates-section {
          background: #121623;
          border-radius: 14px;
          border: 1px solid var(--border-soft);
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
          color: var(--accent-blue);
        }

        .dates-section-icon.past {
          background: rgba(255, 134, 94, 0.12);
          color: var(--accent-orange);
        }

        .dates-section-count {
          font-size: 12px;
          color: var(--text-muted);
        }

        .dates-chevron {
          font-size: 11px;
          color: var(--text-muted);
        }

        .dates-strip {
          padding: 10px 10px 8px;
          display: flex;
          gap: 10px;
          overflow-x: auto;
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
          background: linear-gradient(90deg, var(--accent-purple), var(--accent-blue));
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
          cursor: pointer;
        }
        
        .date-card:hover {
          transform: translateY(-4px) scale(1.02);
          border-color: rgba(39, 195, 255, 0.7);
          box-shadow: 0 12px 32px rgba(39, 195, 255, 0.25), 0 0 0 1px rgba(39, 195, 255, 0.2) inset;
          background: linear-gradient(135deg, rgba(40, 46, 66, 0.98) 0%, rgba(25, 29, 45, 1) 50%, rgba(15, 17, 28, 1) 100%);
        }
        
        .date-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple), var(--accent-blue));
          opacity: 1;
          transition: height 0.3s ease;
        }
        
        .date-card:hover::before {
          height: 5px;
          opacity: 1;
        }
        
        .date-card.past {
          opacity: 0.85;
          border-color: rgba(255, 134, 94, 0.5);
          background: linear-gradient(135deg, rgba(42, 27, 36, 0.95) 0%, rgba(23, 19, 32, 0.98) 50%, rgba(11, 13, 24, 1) 100%);
        }
        
        .date-card.past:hover {
          opacity: 0.95;
          border-color: rgba(255, 134, 94, 0.7);
          transform: translateY(-2px) scale(1.01);
        }
        
        .date-card.past::before {
          background: linear-gradient(90deg, var(--accent-orange), #ff3d57, var(--accent-orange));
        }
        
        .date-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 4px;
        }
        
        .date-card-title {
          font-size: 15px;
          font-weight: 800;
          margin: 0 0 8px 0;
          color: var(--text-main);
          line-height: 1.3;
          letter-spacing: -0.01em;
          flex: 1;
          min-width: 0;
          word-wrap: break-word;
        }
        
        .date-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 12px;
          background: rgba(15, 21, 36, 0.8);
          font-size: 12px;
          font-weight: 600;
          color: var(--accent-blue);
          border: 1px solid rgba(39, 195, 255, 0.5);
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
        }
        
        .date-card:hover .date-pill {
          background: rgba(15, 21, 36, 1);
          border-color: rgba(39, 195, 255, 0.7);
          transform: scale(1.05);
        }

        .date-pill-icon {
          font-size: 13px;
          filter: drop-shadow(0 1px 2px rgba(39, 195, 255, 0.3));
        }
        
        .date-card-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }
        
        .date-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }
        
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
          background: rgba(13, 18, 34, 0.6);
          color: var(--text-main);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s ease;
          backdrop-filter: blur(4px);
        }
        
        .chip:hover {
          background: rgba(13, 18, 34, 0.9);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }
        
        .chip-muted {
          color: var(--text-muted);
          background: rgba(16, 20, 37, 0.6);
        }
        
        .chip-people {
          background: rgba(139, 108, 255, 0.2);
          border-color: rgba(139, 108, 255, 0.5);
          font-weight: 600;
        }
        
        .chip-people:hover {
          background: rgba(139, 108, 255, 0.3);
          border-color: rgba(139, 108, 255, 0.7);
        }
        
        .date-status {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 4px 10px;
          border-radius: 12px;
          white-space: nowrap;
          font-weight: 800;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        
        .date-status-available {
          background: linear-gradient(135deg, rgba(39, 195, 255, 0.25), rgba(39, 195, 255, 0.15));
          color: var(--accent-blue);
          border: 1.5px solid rgba(39, 195, 255, 0.6);
          box-shadow: 0 0 8px rgba(39, 195, 255, 0.2);
        }
        
        .date-status-past {
          background: linear-gradient(135deg, rgba(255, 134, 94, 0.25), rgba(255, 134, 94, 0.15));
          color: var(--accent-orange);
          border: 1.5px solid rgba(255, 134, 94, 0.6);
          box-shadow: 0 0 8px rgba(255, 134, 94, 0.2);
        }
        
        .date-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .date-card-footer button {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 600;
        }
        
        .date-card-footer button:hover:not(:disabled) {
          transform: translateY(-1px) scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .date-card-footer button:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }
        
        .date-card-button {
          padding: 6px 12px;
          border-radius: 10px;
          border: 1.5px solid;
          background: transparent;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        
        .date-card-button--view {
          border-color: rgba(255, 255, 255, 0.25);
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.05);
        }
        
        .date-card-button--view:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.4);
          color: var(--text-main);
        }
        
        .date-card-button--edit {
          border-color: rgba(39, 195, 255, 0.6);
          color: var(--accent-blue);
          background: rgba(39, 195, 255, 0.15);
        }
        
        .date-card-button--edit:hover:not(:disabled) {
          background: rgba(39, 195, 255, 0.25);
          border-color: rgba(39, 195, 255, 0.8);
          color: var(--accent-blue);
          box-shadow: 0 0 12px rgba(39, 195, 255, 0.3);
        }
        
        .date-card-button--delete {
          border-color: rgba(255, 61, 87, 0.6);
          color: #ff3d57;
          background: rgba(255, 61, 87, 0.15);
        }
        
        .date-card-button--delete:hover:not(:disabled) {
          background: rgba(255, 61, 87, 0.25);
          border-color: rgba(255, 61, 87, 0.8);
          color: #ff3d57;
          box-shadow: 0 0 12px rgba(255, 61, 87, 0.3);
        }
        
        .date-card-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        @media (max-width: 600px) {
          .dates-block {
            padding: 12px;
          }

          .date-card {
            min-width: 260px;
            max-width: 100%;
            padding: 14px;
            gap: 10px;
          }
          
          .date-card-title {
            font-size: 14px;
          }
          
          .date-pill {
            font-size: 11px;
            padding: 4px 8px;
          }
          
          .date-card-footer {
            flex-wrap: wrap;
            gap: 6px;
          }
          
          .date-card-footer button {
            font-size: 10px;
            padding: 4px 10px;
            flex: 1;
            min-width: 0;
          }
        }
        
        .org-event-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #1E88E5, #00BCD4, #FF3D57);
          border-radius: clamp(18px, 2.5vw, 28px) clamp(18px, 2.5vw, 28px) 0 0;
        }
        
        .org-event-card:hover {
          transform: translateY(-4px);
          border-color: rgba(30, 136, 229, 0.4);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        }
        
        .org-event-card-header {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
          position: relative;
          z-index: 2;
        }
        
        .org-event-card-content {
          flex: 1;
          min-width: 0;
        }
        
        .org-event-card-title {
          font-size: clamp(1.5rem, 2vw, 2rem);
          font-weight: 800;
          margin: 0 0 0.75rem 0;
          background: linear-gradient(135deg, #1E88E5, #FF3D57);
          -webkit-background-clip: text;
          background-clip: text;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }
        
        .org-event-card-description {
          font-size: 1rem;
          opacity: 0.9;
          margin: 0;
          font-weight: 400;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .org-event-card-actions {
          display: flex;
          gap: 0.75rem;
          flex-shrink: 0;
          align-items: flex-start;
        }
        
        .org-event-card-button {
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          border: none;
        }
        
        .org-event-card-button--view {
          background: rgba(30, 136, 229, 0.15);
          color: #1E88E5;
          border: 2px solid rgba(30, 136, 229, 0.3);
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.2);
        }
        
        .org-event-card-button--view:hover {
          background: rgba(30, 136, 229, 0.25);
          border-color: rgba(30, 136, 229, 0.5);
        }
        
        .org-event-card-button--edit {
          background: linear-gradient(135deg, #1E88E5, #00BCD4);
          color: #FFFFFF;
          box-shadow: 0 4px 16px rgba(30, 136, 229, 0.4);
        }
        
        .org-event-card-button--edit:hover {
          box-shadow: 0 6px 20px rgba(30, 136, 229, 0.5);
        }
        
        .org-event-card-button--delete {
          background: linear-gradient(135deg, #FF3D57, #FF8C42);
          color: #FFFFFF;
          box-shadow: 0 4px 16px rgba(255, 61, 87, 0.4);
        }
        
        .org-event-card-button--delete:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(255, 61, 87, 0.5);
        }
        
        .org-event-card-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .org-events-empty {
          text-align: center;
          padding: 4rem 2rem;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
          border: 2px solid rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        
        .org-events-empty-icon {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255, 61, 87, 0.2), rgba(255, 140, 66, 0.2));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          margin: 0 auto 1.5rem;
          box-shadow: 0 8px 32px rgba(255, 61, 87, 0.4);
          border: 2px solid rgba(255, 61, 87, 0.3);
        }
        
        .org-events-empty h3 {
          font-size: 1.6rem;
          font-weight: 800;
          margin-bottom: 0.75rem;
          background: linear-gradient(135deg, #1E88E5, #FF3D57);
          -webkit-background-clip: text;
          background-clip: text;
        }
        
        .org-events-empty p {
          opacity: 0.9;
          font-size: 1.1rem;
          font-weight: 500;
          margin: 0 0 2rem 0;
          color: rgba(255, 255, 255, 0.9);
        }
        
        
        .org-event-card {
          padding: clamp(1.5rem, 2.5vw, 2.5rem);
          border-radius: clamp(16px, 2.5vw, 28px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          background: rgba(30, 30, 30, 0.6);
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .org-event-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #FF3D57, #FF8C42, #FFD166);
          border-radius: 24px 24px 0 0;
        }
        
        .org-event-card-header {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }
        
        .org-event-card-content {
          flex: 1;
          min-width: 0;
        }
        
        .org-event-card-title {
          font-size: clamp(1.5rem, 2vw, 2rem);
          font-weight: 800;
          margin: 0;
          margin-bottom: 0.75rem;
          background: linear-gradient(135deg, #1E88E5, #FF3D57);
          -webkit-background-clip: text;
          background-clip: text;
          color: #FFFFFF;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        
        .org-event-card-description {
          font-size: 1rem;
          opacity: 0.9;
          margin: 0;
          font-weight: 400;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .org-event-card-actions {
          display: flex;
          gap: 0.75rem;
          flex-shrink: 0;
          align-items: flex-start;
        }
        
        .org-event-card-button {
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          justify-content: center;
        }
        
        .org-event-card-button--view {
          background: rgba(30, 136, 229, 0.15);
          color: #1E88E5;
          border: 2px solid rgba(30, 136, 229, 0.3);
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.2);
        }
        
        .org-event-card-button--edit {
          background: linear-gradient(135deg, #1E88E5, #00BCD4);
          color: #FFFFFF;
          border: none;
          box-shadow: 0 4px 16px rgba(30, 136, 229, 0.4);
        }
        
        .org-event-card-button--delete {
          background: linear-gradient(135deg, #FF3D57, #FF8C42);
          color: #FFFFFF;
          border: none;
          box-shadow: 0 4px 16px rgba(255, 61, 87, 0.4);
        }
        
        .org-event-card-button--delete:disabled {
          background: rgba(255, 255, 255, 0.1);
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }
        
        .org-event-empty-state {
          text-align: center;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .org-event-empty-state-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        
        .org-event-empty-state-text {
          font-size: 0.9rem;
          opacity: 0.7;
          margin: 0;
        }
        
        .org-create-button {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          pointer-events: auto;
        }
        
        .org-editor-tabs {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        
        .org-editor-tabs button {
          white-space: nowrap;
          flex-shrink: 0;
        }
        
        .org-date-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        
        .org-date-form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .org-date-form-buttons {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .org-date-form-buttons button {
          flex: 1 1 auto;
          min-width: 120px;
        }
        
        .org-date-form-checkbox {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          margin-bottom: 16px;
        }
        
        .org-date-form-radio-group {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        
        .org-date-form-radio-group .org-date-form-checkbox {
          margin-bottom: 0;
        }
        
        .org-date-form-select-wrapper {
          position: relative;
        }
        
        .org-date-form-select {
          width: 100%;
          padding: 12px 14px;
          padding-right: 40px;
          background: #2b2b2b;
          border: 1px solid rgba(255,255,255,0.25);
          color: #FFFFFF;
          outline: none;
          font-size: 14px;
          border-radius: 12px;
          appearance: none;
          -webkit-appearance: none;
        }
        
        .org-date-form-select-arrow {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: rgba(255,255,255,0.6);
        }
        
        .org-date-form-repetition {
          margin-top: 20px;
          padding: 16px;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .org-date-form-repetition input[type="number"] {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: #FFFFFF;
          font-size: 1rem;
        }
        
        .org-date-form-repetition input[type="number"]:focus {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          outline: none;
        }
        
        .photos-two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .rhythms-zones-two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        
        @media (max-width: 768px) {
          .photos-two-columns {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .rhythms-zones-two-columns {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          
          .org-editor-wrapper {
            padding: 1rem !important;
          }
          
          .org-editor-container {
            max-width: 100% !important;
            padding: 0 !important;
          }
          
          .org-editor-header {
            flex-direction: column !important;
            gap: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
          
          .org-editor-back {
            padding: 0.5rem 1rem !important;
            font-size: 0.8rem !important;
            align-self: flex-start !important;
          }
          
          .org-editor-title {
            font-size: 1.5rem !important;
            margin-bottom: 0.5rem !important;
            order: 2 !important;
          }
          
          .org-editor-tabs {
            gap: 0.4rem !important;
            margin-bottom: 1.5rem !important;
            padding-bottom: 0.4rem !important;
          }
          
          .org-editor-tabs button {
            padding: 0.6rem 1rem !important;
            font-size: 0.85rem !important;
          }
          
          .org-editor-card {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 12px !important;
          }
          
          .org-editor-card h3 {
            font-size: 1.1rem !important;
            margin-bottom: 1rem !important;
          }
          
          .org-editor-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          
          .org-editor-grid-small {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          
          .org-date-form-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          
          .org-date-form-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          
          .org-date-form-buttons {
            flex-direction: column !important;
          }
          
          .org-date-form-buttons button {
            width: 100% !important;
            min-width: 100% !important;
          }
          
          .org-date-form-checkbox {
            gap: 8px !important;
            margin-bottom: 12px !important;
          }
          
          .org-date-form-radio-group {
            flex-direction: column !important;
            gap: 12px !important;
          }
          
          .org-date-form-radio-group .org-date-form-checkbox {
            margin-bottom: 0 !important;
          }
          
          .org-date-form-radio-group span {
            font-size: 0.9rem !important;
          }
          
          .org-date-form-select {
            padding: 10px 12px !important;
            padding-right: 36px !important;
            font-size: 13px !important;
          }
          
          .org-date-form-select-arrow {
            right: 12px !important;
            font-size: 0.8rem !important;
          }
          
          .org-date-form-repetition {
            padding: 12px !important;
            margin-top: 16px !important;
          }
          
          .org-date-form-repetition input[type="number"] {
            padding: 0.6rem !important;
            font-size: 0.9rem !important;
          }
          
          .org-editor-field {
            font-size: 0.9rem !important;
            margin-bottom: 0.5rem !important;
          }
          
          .org-editor-input {
            padding: 0.6rem !important;
            font-size: 0.9rem !important;
          }
          
          .org-editor-textarea {
            padding: 0.6rem !important;
            font-size: 0.9rem !important;
          }
          
          .org-editor-chips {
            justify-content: center !important;
            gap: 0.4rem !important;
          }
          
          .org-events-section {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 16px !important;
          }
          
          .org-events-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
          
          .org-events-header-left {
            flex-direction: column !important;
            text-align: center !important;
            width: 100% !important;
          }
          
          .org-events-header-icon {
            width: 52px !important;
            height: 52px !important;
            font-size: 1.25rem !important;
            margin: 0 auto !important;
          }
          
          .org-events-header-text h2 {
            font-size: 1.5rem !important;
            text-align: center !important;
          }
          
          .org-events-header-text p {
            text-align: center !important;
          }
          
          .org-events-header-actions {
            width: 100% !important;
            justify-content: stretch !important;
          }
          
          .org-events-action-button {
            width: 100% !important;
            justify-content: center !important;
            padding: 0.75rem 1.25rem !important;
            font-size: 0.9rem !important;
          }
          
          .org-events-section h2 {
            font-size: 1.4rem !important;
          }
          
          .org-events-grid {
            gap: 1rem !important;
          }
          
          .org-event-card {
            padding: 1.5rem !important;
            border-radius: 18px !important;
            gap: 1.25rem !important;
          }
          
          .org-event-card-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem !important;
            padding-bottom: 1rem !important;
          }
          
          .org-event-card-actions {
            flex-direction: column !important;
            width: 100% !important;
          }
          
          .org-event-card-button {
            width: 100% !important;
            padding: 0.7rem 1rem !important;
            font-size: 0.85rem !important;
          }
          
          .org-event-card-title {
            font-size: 1.4rem !important;
          }
          
          .org-event-card-description {
            font-size: 0.9rem !important;
          }
          
          .org-event-empty-state {
            padding: 1.5rem !important;
          }
          
          .org-event-empty-state-icon {
            font-size: 1.75rem !important;
          }
          
          .org-event-empty-state-text {
            font-size: 0.85rem !important;
          }
          
          .org-create-button {
            bottom: 20px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
          }
        }
        
        @media (max-width: 480px) {
          .org-editor-wrapper {
            padding: 0.75rem !important;
          }
          
          .org-editor-container {
            padding: 0 !important;
          }
          
          .org-editor-header {
            margin-bottom: 1rem !important;
            gap: 0.75rem !important;
          }
          
          .org-editor-back {
            padding: 0.4rem 0.8rem !important;
            font-size: 0.75rem !important;
          }
          
          .org-editor-title {
            font-size: 1.25rem !important;
          }
          
          .org-editor-tabs {
            gap: 0.3rem !important;
            margin-bottom: 1rem !important;
          }
          
          .org-editor-tabs button {
            padding: 0.5rem 0.8rem !important;
            font-size: 0.8rem !important;
          }
          
          .org-editor-card {
            padding: 0.75rem !important;
            margin-bottom: 1rem !important;
            border-radius: 10px !important;
          }
          
          .org-editor-card h2 {
            font-size: 1.2rem !important;
            margin-bottom: 0.75rem !important;
          }
          
          .org-editor-card h3 {
            font-size: 1rem !important;
            margin-bottom: 0.75rem !important;
          }
          
          .org-editor-grid {
            gap: 0.75rem !important;
          }
          
          .org-editor-grid-small {
            gap: 0.75rem !important;
          }
          
          .org-date-form-grid {
            gap: 0.75rem !important;
          }
          
          .org-date-form-grid-2 {
            gap: 0.75rem !important;
          }
          
          .org-date-form-buttons {
            gap: 0.75rem !important;
          }
          
          .org-date-form-buttons button {
            padding: 10px 16px !important;
            font-size: 0.8rem !important;
          }
          
          .org-date-form-checkbox {
            gap: 6px !important;
            margin-bottom: 10px !important;
          }
          
          .org-date-form-checkbox span {
            font-size: 0.85rem !important;
          }
          
          .org-date-form-radio-group {
            gap: 10px !important;
          }
          
          .org-date-form-radio-group span {
            font-size: 0.85rem !important;
          }
          
          .org-date-form-select {
            padding: 8px 10px !important;
            padding-right: 32px !important;
            font-size: 12px !important;
          }
          
          .org-date-form-select-arrow {
            right: 10px !important;
            font-size: 0.75rem !important;
          }
          
          .org-date-form-repetition {
            padding: 10px !important;
            margin-top: 12px !important;
          }
          
          .org-date-form-repetition input[type="number"] {
            padding: 0.5rem !important;
            font-size: 0.85rem !important;
          }
          
          .org-date-form-repetition p {
            font-size: 0.8rem !important;
          }
          
          .org-editor-field {
            font-size: 0.8rem !important;
            margin-bottom: 0.4rem !important;
          }
          
          .org-editor-input {
            padding: 0.5rem !important;
            font-size: 0.85rem !important;
          }
          
          .org-editor-textarea {
            padding: 0.5rem !important;
            font-size: 0.85rem !important;
          }
          
          .org-editor-chips {
            gap: 0.3rem !important;
          }
          
          .org-events-section {
            padding: 1rem !important;
            border-radius: 16px !important;
            margin-bottom: 1rem !important;
          }
          
          .org-events-header {
            gap: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
          
          .org-events-header-icon {
            width: 52px !important;
            height: 52px !important;
            font-size: 1.3rem !important;
          }
          
          .org-events-header-text h2 {
            font-size: 1.3rem !important;
            margin-bottom: 0.4rem !important;
          }
          
          .org-events-header-text p {
            font-size: 0.9rem !important;
          }
          
          .org-events-action-button {
            padding: 0.75rem 1.25rem !important;
            font-size: 0.85rem !important;
            gap: 0.5rem !important;
          }
          
          .org-events-section h2 {
            font-size: 1.2rem !important;
          }
          
          .org-events-grid {
            gap: 1.25rem !important;
          }
          
          .org-event-card {
            padding: 1.25rem !important;
            border-radius: 16px !important;
            gap: 1rem !important;
          }
          
          .org-event-card-header {
            gap: 0.75rem !important;
            padding-bottom: 1rem !important;
          }
          
          .org-event-card-title {
            font-size: 1.3rem !important;
            margin-bottom: 0.6rem !important;
          }
          
          .org-event-card-description {
            font-size: 0.9rem !important;
            margin-bottom: 0.75rem !important;
          }
          
          .org-event-card-button {
            padding: 0.65rem 1rem !important;
            font-size: 0.8rem !important;
            gap: 4px !important;
          }
          
          .org-event-card-title {
            font-size: 1.25rem !important;
            margin-bottom: 0.5rem !important;
          }
          
          .org-event-card-description {
            font-size: 0.85rem !important;
          }
          
          .org-event-empty-state {
            padding: 1.25rem !important;
          }
          
          .org-event-empty-state-icon {
            font-size: 1.5rem !important;
          }
          
          .org-event-empty-state-text {
            font-size: 0.8rem !important;
          }
          
          .org-create-button {
            bottom: 16px !important;
            padding: 0.75rem 1.25rem !important;
            font-size: 0.85rem !important;
          }
        }
        
        /* Estilos para editor-section y glass-card-container */
        .editor-section {
          margin-bottom: 3rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .editor-section-title {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          color: ${colors.light};
          text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px;
        }
        .editor-field {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: ${colors.light};
        }
        .editor-input {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: ${colors.light};
          font-size: 1rem;
        }
        .editor-textarea {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: ${colors.light};
          font-size: 1rem;
          resize: vertical;
          font-family: inherit;
        }
        .glass-card-container {
          opacity: 1;
          margin-bottom: 2rem;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: rgba(0, 0, 0, 0.3) 0px 8px 32px;
          backdrop-filter: blur(10px);
          transform: none;
        }
        .info-redes-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
        }
        
        /* PROFILE SECTION COMPACT */
        .profile-section-compact {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 1.5rem;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        /* ABAJO: REDES */
        .row-bottom {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .row-bottom-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .subtitle {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
          color: ${colors.light};
        }
        .tag {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        
        /* LISTA DE REDES */
        .social-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .field {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1rem;
        }
        .field-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.9;
          color: ${colors.light};
        }
        
        /* INPUTS COMPACTOS */
        .input-group {
          flex: 1;
          display: flex;
          align-items: center;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .input-group:focus-within {
          border-color: rgba(76, 173, 255, 0.6);
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 0 0 2px rgba(76, 173, 255, 0.2);
        }
        .prefix {
          padding: 0.75rem 0.5rem;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          border-right: 1px solid rgba(255, 255, 255, 0.15);
          white-space: nowrap;
          background: rgba(255, 255, 255, 0.05);
        }
        .input-group input {
          border: none;
          outline: none;
          background: transparent;
          color: ${colors.light};
          font-size: 1rem;
          padding: 0.75rem;
          flex: 1;
          min-width: 0;
        }
        .input-group input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        
        @media (max-width: 768px) {
          .info-redes-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .editor-section {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 12px !important;
          }
          .editor-section-title {
            font-size: 1.2rem !important;
            margin-bottom: 0.75rem !important;
          }
          .glass-card-container {
            padding: 0.75rem !important;
            margin-bottom: 1rem !important;
            border-radius: 12px !important;
          }
          .profile-section-compact {
            padding: 1rem !important;
            gap: 1rem !important;
          }
          .subtitle {
            font-size: 0.95rem !important;
          }
          .field-icon {
            width: 24px !important;
            height: 24px !important;
          }
          .field {
            font-size: 0.9rem !important;
            gap: 0.5rem !important;
          }
          .input-group input {
            font-size: 0.9rem !important;
            padding: 0.6rem !important;
          }
          .prefix {
            font-size: 0.85rem !important;
            padding: 0.6rem 0.4rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .editor-section {
            padding: 0.75rem !important;
            margin-bottom: 1rem !important;
            border-radius: 10px !important;
          }
          .editor-section-title {
            font-size: 1.1rem !important;
            margin-bottom: 0.5rem !important;
          }
          .editor-input,
          .editor-textarea {
            padding: 0.6rem !important;
            font-size: 0.9rem !important;
          }
          .glass-card-container {
            padding: 0.5rem !important;
            margin-bottom: 0.75rem !important;
            border-radius: 10px !important;
          }
          .profile-section-compact {
            padding: 0.75rem !important;
            gap: 1rem !important;
          }
          .subtitle {
            font-size: 0.9rem !important;
          }
          .tag {
            font-size: 0.7rem !important;
          }
          .field-icon {
            width: 22px !important;
            height: 22px !important;
          }
          .social-list {
            gap: 0.5rem !important;
          }
          .field {
            font-size: 0.85rem !important;
            gap: 0.5rem !important;
          }
          .input-group input {
            font-size: 0.85rem !important;
            padding: 0.5rem !important;
          }
          .prefix {
            font-size: 0.8rem !important;
            padding: 0.5rem 0.4rem !important;
          }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: colors.light,
        padding: '2rem',
      }} className="org-editor-wrapper">
        <div className="org-editor-container">
          {/* Header con botón Volver */}
          <div className="org-editor-header">
            <button
              onClick={() => navigate(-1)}
              className="org-editor-back"
            >
              ← Volver
            </button>
            <h1 className="org-editor-title">
              ✏️ Editar Organizador
            </h1>
            <div style={{ width: '100px' }}></div>
          </div>

          {/* Componente de navegación flotante */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
            <ProfileNavigationToggle
              currentView="edit"
              profileType="organizer"
              onSave={handleSave}
              isSaving={upsert.isPending}
              saveDisabled={!form.nombre_publico?.trim()}
            />
          </div>

          {/* Tabs Perfil / Métricas eventos */}
          <div
            className="org-editor-tabs"
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "2rem",
              borderBottom: "2px solid rgba(255,255,255,0.1)",
              paddingBottom: "0.5rem",
            }}
          >
            <button
              onClick={() => setActiveTab("perfil")}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px 12px 0 0",
                border: "none",
                background:
                  activeTab === "perfil"
                    ? "linear-gradient(135deg, rgba(240,147,251,0.2), rgba(245,87,108,0.2))"
                    : "transparent",
                color: "#fff",
                fontWeight: activeTab === "perfil" ? 800 : 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                borderBottom:
                  activeTab === "perfil"
                    ? "2px solid rgba(240,147,251,0.5)"
                    : "2px solid transparent",
              }}
            >
              📝 Perfil
            </button>
            <button
              onClick={() => setActiveTab("metricas")}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px 12px 0 0",
                border: "none",
                background:
                  activeTab === "metricas"
                    ? "linear-gradient(135deg, rgba(240,147,251,0.2), rgba(245,87,108,0.2))"
                    : "transparent",
                color: "#fff",
                fontWeight: activeTab === "metricas" ? 800 : 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                borderBottom:
                  activeTab === "metricas"
                    ? "2px solid rgba(240,147,251,0.5)"
                    : "2px solid transparent",
              }}
            >
              📊 Métricas eventos
            </button>
          </div>

          {/* Vista de métricas de eventos */}
          {activeTab === "metricas" && (org as any)?.id && (
            <div className="org-editor-card" style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  marginBottom: "1rem",
                  color: colors.light,
                }}
              >
                📊 Métricas de eventos
              </h2>
              <OrganizerEventMetricsPanel organizerId={(org as any).id} />
            </div>
          )}

          {/* Vista de edición de perfil */}
          {activeTab === "perfil" && (
            <>
              {/* Banner de Bienvenida (para perfiles nuevos o recién aprobados) */}
              {(isNewProfile || showWelcomeBanner) && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: "1.5rem",
                    marginBottom: "2rem",
                    background:
                      "linear-gradient(135deg, rgba(229, 57, 53, 0.2) 0%, rgba(251, 140, 0, 0.2) 100%)",
                    border: "2px solid rgba(229, 57, 53, 0.4)",
                    borderRadius: "16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}
                  >
                    🎤
                  </div>
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      marginBottom: "0.5rem",
                      background:
                        "linear-gradient(135deg, #E53935 0%, #FB8C00 100%)",
                      WebkitBackgroundClip: "text",
                      color: "#FFFFFF",
                    }}
                  >
                    ¡Bienvenido, Organizador!
                  </h3>
                  <p
                    style={{
                      fontSize: "1rem",
                      opacity: 0.9,
                      marginBottom: "1rem",
                    }}
                  >
                    {showWelcomeBanner 
                      ? <>Tu perfil ha sido aprobado. Completa tu información básica y haz clic en <strong>💾 Guardar</strong> arriba para actualizar tu perfil.</>
                      : <>Completa tu información básica y haz clic en <strong>💾 Guardar</strong> arriba para crear tu perfil</>
                    }
                  </p>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "0.5rem 1rem",
                      background: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "20px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                    }}
                  >
                    👆 Mínimo requerido: <strong>Nombre Público</strong> y <strong>Ritmos</strong>
                  </div>
                </motion.div>
              )}

              {/* Información Personal */}
              <div
                id="organizer-basic-info"
                data-test-id="organizer-basic-info"
                className="editor-section glass-card-container"
                style={{ marginBottom: '3rem' }}
              >
                <h2 className="editor-section-title">
                  👤 Información Personal
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '2rem',
                  alignItems: 'start'
                }}
                  className="info-redes-grid">
                  {/* Columna 1: Información Básica */}
                  <div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label className="editor-field">
                        🏢 Nombre Público *
                      </label>
                      <input
                        id="organizer-name-input"
                        data-test-id="organizer-name-input"
                        type="text"
                        value={form.nombre_publico}
                        onChange={(e) =>
                          setField("nombre_publico", e.target.value)
                        }
                        placeholder="Nombre de tu organización"
                        className="editor-input"
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label className="editor-field">
                        📝 Biografía
                      </label>
                      <textarea
                        id="organizer-bio-input"
                        data-test-id="organizer-bio-input"
                        value={form.bio || ''}
                        onChange={(e) => setField("bio", e.target.value)}
                        placeholder="Cuéntanos sobre tu organización..."
                        rows={3}
                        className="editor-textarea"
                      />
                    </div>
                  </div>

                  {/* Columna 2: Redes Sociales Compactas */}
                  <div className="profile-section-compact">
                    {/* REDES SOCIALES */}
                    <div className="row-bottom">
                      <div className="row-bottom-header">
                        <h4 className="subtitle">Redes Sociales</h4>
                        <span className="tag">Opcional</span>
                      </div>

                      <div className="social-list">
                        {/* Instagram */}
                        <label className="field">
                          <span className="field-icon">
                            <FaInstagram size={18} />
                          </span>
                          <div className="input-group">
                            <span className="prefix">ig/</span>
                            <input
                              type="text"
                              name="instagram"
                              value={form.redes_sociales.instagram || ''}
                              onChange={(e) => setNested('redes_sociales.instagram', e.target.value)}
                              placeholder="usuario"
                            />
                          </div>
                        </label>

                        {/* Facebook */}
                        <label className="field">
                          <span className="field-icon">
                            <FaFacebookF size={18} />
                          </span>
                          <div className="input-group">
                            <span className="prefix">fb/</span>
                            <input
                              type="text"
                              name="facebook"
                              value={form.redes_sociales.facebook || ''}
                              onChange={(e) => setNested('redes_sociales.facebook', e.target.value)}
                              placeholder="usuario o página"
                            />
                          </div>
                        </label>

                        {/* WhatsApp */}
                        <label className="field">
                          <span className="field-icon">
                            <FaWhatsapp size={18} />
                          </span>
                          <div className="input-group">
                            <span className="prefix">+52</span>
                            <input
                              type="tel"
                              name="whatsapp"
                              value={form.redes_sociales.whatsapp || ''}
                              onChange={(e) => setNested('redes_sociales.whatsapp', e.target.value)}
                              placeholder="55 1234 5678"
                            />
                          </div>
                        </label>

                        {/* Sitio Web */}
                        <label className="field">
                          <span className="field-icon">
                            <FaGlobe size={18} />
                          </span>
                          <div className="input-group">
                            <span className="prefix">https://</span>
                            <input
                              type="text"
                              name="web"
                              value={form.redes_sociales.web || ''}
                              onChange={(e) => setNested('redes_sociales.web', e.target.value)}
                              placeholder="tusitio.com"
                            />
                          </div>
                        </label>

                        {/* Telegram */}
                        <label className="field">
                          <span className="field-icon">
                            <FaTelegram size={18} />
                          </span>
                          <div className="input-group">
                            <span className="prefix">@</span>
                            <input
                              type="text"
                              name="telegram"
                              value={form.redes_sociales.telegram || ''}
                              onChange={(e) => setNested('redes_sociales.telegram', e.target.value)}
                              placeholder="usuario o canal"
                            />
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ritmos y Zonas */}
              <div
                id="organizer-rhythms-zones"
                data-test-id="organizer-rhythms-zones"
                className="org-editor-card academy-editor-card"
                style={{ marginBottom: '3rem', position: 'relative', overflow: 'hidden', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(19,21,27,0.85), rgba(16,18,24,0.85))' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)' }} />

                {/* Contenedor de dos columnas: Ritmos y Zonas */}
                <div className="rhythms-zones-two-columns" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.25rem' }}>
                  {/* Columna 1: Ritmos */}
                  <div>
                    {/* Header Ritmos */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1E88E5,#7C4DFF)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px rgba(30,136,229,0.35)' }}>🎵</div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#fff', textShadow: 'rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px' }}>Ritmos que Organizas</h2>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Selecciona los ritmos que organizas</div>
                      </div>
                    </div>

                    {/* Catálogo agrupado */}
                    <div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Catálogo agrupado</div>
                      <RitmosSelectorEditor
                        selected={
                          (((form as any)?.ritmos_seleccionados) ||
                            []) as string[]
                        }
                        ritmoTags={ritmoTags as any}
                        setField={setField as any}
                      />
                    </div>
                  </div>

                  {/* Columna 2: Zonas */}
                  <div>
                    {/* Header Zonas */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1976D2,#00BCD4)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px rgba(25,118,210,0.35)' }}>🗺️</div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#fff', textShadow: 'rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px' }}>Zonas</h2>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Indica las zonas donde operas</div>
                      </div>
                    </div>

                    {/* Chips Zonas */}
                    <div className="academy-chips-container">
                      <ZonaGroupedChips
                        selectedIds={form.zonas}
                        allTags={allTags}
                        mode="edit"
                        onToggle={toggleZona}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "perfil" && (
            <>
          {/* Pagos / Stripe Payouts */}
          {approvedRoles?.approved?.includes('organizador') && user?.id && org && (
            <div className="org-editor-card" style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
                💸 Pagos y Cobros
              </h2>
              <StripePayoutSettings
                userId={user.id}
                roleType="organizador"
                stripeAccountId={(org as any).stripe_account_id}
                stripeOnboardingStatus={(org as any).stripe_onboarding_status}
                stripeChargesEnabled={(org as any).stripe_charges_enabled}
                stripePayoutsEnabled={(org as any).stripe_payouts_enabled}
              />
            </div>
          )}

          {/* Mis ubicaciones reutilizables (editor independiente para organizador con misma UX que academia) */}
          <div className="org-editor-card">
            <OrganizerUbicacionesEditor organizerId={(org as any)?.id} />
          </div>

          {/* Mis Eventos */}
          <div
            id="organizer-events-list"
            data-test-id="organizer-events-list"
            className="org-events-section"
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="org-events-header">
                <div className="org-events-header-left">
                  <div className="org-events-header-icon">
                    🎭
                  </div>
                  <div className="org-events-header-text">
                    <h2>Mis Sociales</h2>
                    <p>Gestiona tus eventos sociales</p>
                  </div>
                </div>
                <div className="org-events-header-actions">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowDateForm(!showDateForm);
                      if (!showDateForm && parents && parents.length === 1) {
                        setSelectedParentId(parents[0].id);
                      }
                    }}
                    className={`org-events-action-button ${showDateForm ? 'org-events-action-button--active' : 'org-events-action-button--primary'}`}
                  >
                    <span>{showDateForm ? '✖️' : '📅'}</span>
                    <span>{showDateForm ? 'Cerrar' : 'Crear Fecha'}</span>
                  </motion.button>

                  {/* Botón de crear social desactivado temporalmente */}
                  {false && (
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/social/new')}
                      className="org-events-action-button org-events-action-button--secondary"
                    >
                      <span>🎉</span>
                      <span>Crear Social</span>
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Formulario de crear fecha */}
              {showDateForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    marginBottom: '2rem',
                    padding: '0',
                    borderRadius: '16px',
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                  }}
                >
                  {/* Información Básica */}
                  <div className="org-editor-card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                      📝 Información Básica
                    </h3>
                    <div className="org-editor-grid">
                      <div>
                        <label className="org-editor-field">
                          Nombre del Evento *
                        </label>
                        <input
                          type="text"
                          value={dateForm.nombre}
                          onChange={(e) => setDateForm({ ...dateForm, nombre: e.target.value })}
                          placeholder="Nombre del evento"
                          className="org-editor-input"
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="org-editor-field">
                          Biografía
                        </label>
                        <textarea
                          value={dateForm.biografia || ''}
                          onChange={(e) => setDateForm({ ...dateForm, biografia: e.target.value })}
                          placeholder="Describe el evento, su propósito, qué esperar..."
                          rows={2}
                          className="org-editor-textarea"
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="org-editor-field">
                          DJs presentes
                        </label>
                        <textarea
                          value={dateForm.djs || ''}
                          onChange={(e) => setDateForm({ ...dateForm, djs: e.target.value })}
                          placeholder="Ejemplo: DJ Juan | DJ María | DJ Invitado Especial"
                          rows={2}
                          className="org-editor-textarea"
                        />
                      </div>
                      <div>
                        <label className="org-editor-field">
                          Teléfono / WhatsApp para más información
                        </label>
                        <input
                          type="tel"
                          value={dateForm.telefono_contacto}
                          onChange={(e) => setDateForm({ ...dateForm, telefono_contacto: e.target.value })}
                          placeholder="Ejemplo: 55 1234 5678"
                          className="org-editor-input"
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="org-editor-field">
                          Mensaje de saludo para WhatsApp
                        </label>
                        <textarea
                          value={dateForm.mensaje_contacto}
                          onChange={(e) => setDateForm({ ...dateForm, mensaje_contacto: e.target.value })}
                          onFocus={() => {
                            if (!dateForm.mensaje_contacto) {
                              const nombre = dateForm.nombre || 'este evento';
                              const template = `Hola! Vengo de Donde Bailar MX, me interesa el evento "${nombre}".`;
                              setDateForm(prev => ({ ...prev, mensaje_contacto: template }));
                            }
                          }}
                          placeholder='Ejemplo: "Hola! Vengo de Donde Bailar MX, me interesa el evento de esta fecha..."'
                          rows={2}
                          className="org-editor-textarea"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ritmos */}
                  <div className="org-editor-card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                      🎵 Ritmos de Baile
                    </h3>
                    <div style={{ marginTop: 8 }}>
                      <RitmosChips
                        selected={dateForm.ritmos_seleccionados || []}
                        allowedIds={((form as any)?.ritmos_seleccionados || []) as string[]}
                        onChange={(ids) => {
                          setDateForm({ ...dateForm, ritmos_seleccionados: ids });
                          // Mapear también a estilos (tag IDs) si es posible
                          try {
                            const labelByCatalogId = new Map<string, string>();
                            RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));
                            const nameToTagId = new Map<string, number>(
                              ritmoTags.map((t: any) => [t.nombre, t.id])
                            );
                            const mappedTagIds = ids
                              .map(cid => labelByCatalogId.get(cid))
                              .filter(Boolean)
                              .map((label: any) => nameToTagId.get(label as string))
                              .filter((n): n is number => typeof n === 'number');
                            setDateForm(prev => ({ ...prev, estilos: mappedTagIds }));
                          } catch { }
                        }}
                      />
                    </div>
                  </div>

                  {/* Ubicaciones */}
                  <div className="org-editor-card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                      📍 Ubicación del Evento
                    </h3>
                    {orgLocations.length > 0 && (
                      <>

                        <div style={{ marginBottom: 16 }}>
                          <label className="org-editor-field">Elegir ubicación existente o ingresa una nueva</label>
                          <div className="org-date-form-select-wrapper" style={{ position: 'relative' }}>
                            <select
                              className="org-date-form-select"
                              value={selectedDateLocationId}
                              onChange={(e) => {
                                const nextId = e.target.value;
                                if (!nextId) {
                                  setSelectedDateLocationId('');
                                  handleDateUbicacionesChange([]);
                                  return;
                                }
                                const found = orgLocations.find((loc) => String(loc.id ?? '') === nextId);
                                applyOrganizerLocationToDateForm(found);
                              }}
                            >
                              <option value="" style={{ background: '#2b2b2b', color: '#FFFFFF' }}>
                                — Escribir manualmente —
                              </option>
                              {orgLocations.map((loc) => (
                                <option
                                  key={loc.id}
                                  value={String(loc.id)}
                                  style={{ color: '#FFFFFF', background: '#2b2b2b' }}
                                >
                                  {loc.nombre || loc.direccion || 'Ubicación'}
                                </option>
                              ))}
                            </select>
                            <span className="org-date-form-select-arrow">
                              ▼
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    {/* Formulario de ubicación manual (como en CrearClase) */}
                    <div className="org-date-form-grid-2">
                      <div>
                        <label className="org-editor-field">Nombre de la ubicación</label>
                        <input
                          type="text"
                          value={dateForm.lugar || ''}
                          onChange={(e) => updateManualDateLocationField('lugar', e.target.value)}
                          placeholder="Ej: Sede Central / Salón Principal"
                          className="org-editor-input"
                        />
                      </div>
                      <div>
                        <label className="org-editor-field">Dirección</label>
                        <input
                          type="text"
                          value={dateForm.direccion || ''}
                          onChange={(e) => updateManualDateLocationField('direccion', e.target.value)}
                          placeholder="Calle, número, colonia"
                          className="org-editor-input"
                        />
                      </div>
                    </div>
                    <div className="org-date-form-grid-2" style={{ marginTop: '16px' }}>
                      <div>
                        <label className="org-editor-field">Ciudad</label>
                        <input
                          type="text"
                          value={dateForm.ciudad || ''}
                          onChange={(e) => updateManualDateLocationField('ciudad', e.target.value)}
                          placeholder="Ciudad"
                          className="org-editor-input"
                        />
                      </div>
                      <div>
                        <label className="org-editor-field">Notas o referencias</label>
                        <input
                          type="text"
                          value={dateForm.referencias || ''}
                          onChange={(e) => updateManualDateLocationField('referencias', e.target.value)}
                          placeholder="Ej. Entrada lateral, 2do piso"
                          className="org-editor-input"
                        />
                      </div>
                    </div>

                    {/* Zonas - visualización cuando hay ubicación seleccionada */}
                    {selectedDateLocationId && (dateForm.zonas || []).length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <label className="org-editor-field" style={{ marginBottom: '8px', display: 'block' }}>
                          Zonas de la ubicación seleccionada
                        </label>
                        <ZonaGroupedChips
                          selectedIds={dateForm.zonas || []}
                          allTags={zonaTags}
                          mode="display"
                          autoExpandSelectedParents={true}
                          size="compact"
                          style={{
                            gap: '4px',
                            fontSize: 12,
                          }}
                        />
                      </div>
                    )}

                    {/* Zonas - selección cuando se ingresa la ubicación manualmente */}
                    {!selectedDateLocationId && (
                      <div style={{ marginTop: '16px' }}>
                        <label className="org-editor-field" style={{ marginBottom: '8px', display: 'block' }}>
                          Zonas de la Ciudad
                        </label>
                        <ZonaGroupedChips
                          selectedIds={dateForm.zonas || []}
                          allTags={zonaTags}
                          mode="edit"
                          onToggle={toggleDateZona}
                          size="compact"
                          style={{
                            gap: '4px',
                            fontSize: 12,
                          }}
                        />
                      </div>
                    )}
                  </div>

               
                  {/* Cronograma */}
                  <div className="org-editor-card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                      📅 Cronograma del Evento
                    </h3>
                    <ScheduleEditor
                      schedule={dateForm.cronograma || []}
                      onChangeSchedule={(cronograma) => setDateForm({ ...dateForm, cronograma })}
                      costos={dateForm.costos || []}
                      onChangeCostos={(costos) => setDateForm({ ...dateForm, costos })}
                      ritmos={ritmoTags}
                      zonas={zonaTags}
                      eventFecha={dateForm.fecha}
                      onSaveCosto={() => {
                        showToast('💰 Costo guardado en el formulario. Recuerda hacer click en "✨ Crear" para guardar la fecha completa.', 'info');
                      }}
                    />
                  </div>

                 

                  {/* Flyer (solo simple; bulk se maneja en cola de pendientes) */}
                  {!bulkMode && (
                    <div className="org-editor-card">
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                        🖼️ Flyer del Evento
                      </h3>
                      <DateFlyerUploader
                        value={dateForm.flyer_url || null}
                        onChange={(url) => setDateForm({ ...dateForm, flyer_url: url })}
                        dateId={null}
                        parentId={selectedParentId || undefined}
                      />
                    </div>
                  )}

                  {/* Fecha y Hora (último paso) */}
                  <div className="org-editor-card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                      📅 Fecha y Hora
                    </h3>

                    {/* Toggle Simple / Bulk */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setBulkMode(false);
                          setShowPendingFlyers(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 999,
                          border: '1px solid rgba(255,255,255,0.22)',
                          background: !bulkMode ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        🧍 Simple
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBulkMode(true);
                          if (bulkRows.length === 0) addBulkRow();
                        }}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 999,
                          border: '1px solid rgba(39,195,255,0.40)',
                          background: bulkMode ? 'rgba(39,195,255,0.14)' : 'rgba(39,195,255,0.06)',
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        📋 Bulk (10+)
                      </button>
                      <div style={{ fontSize: 12, opacity: 0.85 }}>
                        Tip: si <b>Hora fin</b> es menor que <b>Hora inicio</b>, se interpreta como <b>termina al día siguiente</b> (madrugada).
                      </div>
                    </div>

                    <div className="org-date-form-grid">
                      <div>
                        <label className="org-editor-field">
                          {bulkMode ? 'Fecha base (para generar)' : 'Fecha *'}
                        </label>
                        <input
                          type="date"
                          value={dateForm.fecha}
                          onChange={(e) => setDateForm({ ...dateForm, fecha: e.target.value })}
                          required
                          className="org-editor-input"
                          style={{ color: '#FFFFFF' }}
                        />
                      </div>
                      <div>
                        <label className="org-editor-field">
                          Hora Inicio
                        </label>
                        <input
                          type="time"
                          value={dateForm.hora_inicio}
                          onChange={(e) => setDateForm({ ...dateForm, hora_inicio: e.target.value })}
                          className="org-editor-input"
                          style={{ color: '#FFFFFF' }}
                        />
                      </div>
                      <div>
                        <label className="org-editor-field">
                          Hora Fin
                        </label>
                        <input
                          type="time"
                          value={dateForm.hora_fin}
                          onChange={(e) => setDateForm({ ...dateForm, hora_fin: e.target.value })}
                          className="org-editor-input"
                          style={{ color: '#FFFFFF' }}
                        />
                      </div>
                    </div>

                    {/* Repetición Semanal (solo simple) */}
                    {!bulkMode && (
                      <div className="org-date-form-repetition" style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <label className="org-date-form-checkbox" style={{ marginBottom: dateForm.repetir_semanal ? '16px' : '0' }}>
                          <input
                            type="checkbox"
                            checked={dateForm.repetir_semanal || false}
                            onChange={(e) => setDateForm({ ...dateForm, repetir_semanal: e.target.checked })}
                            style={{
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                            }}
                          />
                          <span style={{ fontSize: '1rem', fontWeight: '600', color: '#FFFFFF' }}>
                            🔁 Repetir semanalmente
                          </span>
                        </label>

                        {dateForm.repetir_semanal && (
                          <div style={{ marginTop: '16px' }}>
                            <label style={{
                              display: 'block',
                              marginBottom: '8px',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              color: '#FFFFFF',
                            }}>
                              Número de semanas
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="52"
                              value={dateForm.semanas_repetir || 4}
                              onChange={(e) => setDateForm({ ...dateForm, semanas_repetir: parseInt(e.target.value) || 4 })}
                              className="org-editor-input"
                              style={{ color: '#FFFFFF' }}
                            />
                            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '4px', color: '#FFFFFF' }}>
                              Se crearán fechas cada semana durante {dateForm.semanas_repetir || 4} semana{(dateForm.semanas_repetir || 4) !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Acciones bulk rápidas */}
                    {bulkMode && (
                      <div style={{ marginTop: 14, padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)' }}>
                        <div style={{ fontWeight: 800, marginBottom: 8 }}>⚡ Acciones rápidas</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => addBulkRow()}
                            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                          >
                            ➕ Agregar fila
                          </button>
                          <button
                            type="button"
                            onClick={generateWeeklyRowsFromTemplate}
                            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(39,195,255,0.40)', background: 'rgba(39,195,255,0.10)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                          >
                            🔁 Generar semanal ({Math.max(1, Math.min(52, dateForm.semanas_repetir || 1))})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAllBulkSelected(true)}
                            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                          >
                            ✅ Seleccionar todo
                          </button>
                          <button
                            type="button"
                            onClick={() => setAllBulkSelected(false)}
                            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                          >
                            ⛔ Deseleccionar
                          </button>
                          <button
                            type="button"
                            onClick={clearBulk}
                            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,61,87,0.35)', background: 'rgba(255,61,87,0.10)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                          >
                            🧹 Limpiar bulk
                          </button>
                        </div>

                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                          <div style={{ fontWeight: 800, marginBottom: 8 }}>🖼️ Flyer general (opcional)</div>
                          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>
                            Si lo cargas aquí, se usará como flyer para <b>todas</b> las fechas del batch. Después puedes reemplazarlo por fecha en “Flyers pendientes”.
                          </div>
                          <DateFlyerUploader
                            value={bulkGeneralFlyerUrl || null}
                            onChange={(url) => {
                              setBulkGeneralFlyerUrl(url || null);
                              if (url) {
                                // Si ya hay fechas creadas, permitir aplicar con un click.
                                // No aplicamos automáticamente para evitar sorpresas.
                              }
                            }}
                            dateId={null}
                            parentId={selectedParentId || undefined}
                          />
                          <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => applyBulkGeneralFlyerToCreated(true)}
                              disabled={!bulkGeneralFlyerUrl || Object.keys(createdDateIdByRow).length === 0}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.18)',
                                background: 'rgba(255,255,255,0.06)',
                                color: '#fff',
                                cursor: (!bulkGeneralFlyerUrl || Object.keys(createdDateIdByRow).length === 0) ? 'not-allowed' : 'pointer',
                                fontWeight: 700,
                                opacity: (!bulkGeneralFlyerUrl || Object.keys(createdDateIdByRow).length === 0) ? 0.55 : 1,
                              }}
                            >
                              🧩 Aplicar a seleccionadas (creadas)
                            </button>
                            <button
                              type="button"
                              onClick={() => applyBulkGeneralFlyerToCreated(false)}
                              disabled={!bulkGeneralFlyerUrl || Object.keys(createdDateIdByRow).length === 0}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.18)',
                                background: 'rgba(255,255,255,0.06)',
                                color: '#fff',
                                cursor: (!bulkGeneralFlyerUrl || Object.keys(createdDateIdByRow).length === 0) ? 'not-allowed' : 'pointer',
                                fontWeight: 700,
                                opacity: (!bulkGeneralFlyerUrl || Object.keys(createdDateIdByRow).length === 0) ? 0.55 : 1,
                              }}
                            >
                              🧩 Aplicar a todas (creadas)
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowPendingFlyers((v) => !v)}
                              disabled={Object.keys(createdDateIdByRow).length === 0}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1px solid rgba(39,195,255,0.40)',
                                background: 'rgba(39,195,255,0.10)',
                                color: '#fff',
                                cursor: Object.keys(createdDateIdByRow).length === 0 ? 'not-allowed' : 'pointer',
                                fontWeight: 700,
                                opacity: Object.keys(createdDateIdByRow).length === 0 ? 0.55 : 1,
                              }}
                            >
                              🧾 {showPendingFlyers ? 'Ocultar flyers individuales' : 'Abrir flyers individuales'}
                            </button>
                          </div>
                        </div>

                        {/*
                          Pegar lista (una línea por fecha):
                          - YYYY-MM-DD
                          - YYYY-MM-DD HH:MM
                          - YYYY-MM-DD HH:MM-HH:MM
                          Nota: si HH:MM-HH:MM cruza medianoche (ej. 21:00-02:00), se interpreta como termina al día siguiente.
                        */}
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>
                            Pegar lista (una línea por fecha): <code style={{ color: '#fff' }}>YYYY-MM-DD</code> o <code style={{ color: '#fff' }}>YYYY-MM-DD HH:MM</code> o <code style={{ color: '#fff' }}>YYYY-MM-DD HH:MM-HH:MM</code> (ej. <code style={{ color: '#fff' }}>21:00-02:00</code>)
                          </div>
                          <textarea
                            value={bulkPaste}
                            onChange={(e) => setBulkPaste(e.target.value)}
                            placeholder={`2026-02-01 21:00-02:00\n2026-02-08 21:00-02:00\n2026-02-15 21:00`}
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: 12,
                              border: '1px solid rgba(255,255,255,0.18)',
                              background: 'rgba(0,0,0,0.25)',
                              color: '#fff',
                              resize: 'vertical',
                            }}
                          />
                          <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={parseBulkPasteToRows}
                              style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                            >
                              📥 Agregar filas desde lista
                            </button>
                            <button
                              type="button"
                              onClick={() => setBulkPaste('')}
                              style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                            >
                              🧽 Limpiar texto
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Estado de Publicación (solo simple; bulk publica por lote) */}
                    {!bulkMode && (
                      <div style={{ marginTop: 20 }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '0.75rem', color: '#FFFFFF' }}>
                          🌐 Estado de Publicación
                        </h3>
                        <div className="org-date-form-radio-group">
                          <label className="org-date-form-checkbox">
                            <input
                              type="radio"
                              name="estado_publicacion"
                              value="borrador"
                              checked={dateForm.estado_publicacion === 'borrador'}
                              onChange={(e) => setDateForm({ ...dateForm, estado_publicacion: e.target.value as 'borrador' | 'publicado' })}
                              style={{ transform: 'scale(1.2)' }}
                            />
                            <span style={{ color: '#FFFFFF', fontSize: '1rem' }}>
                              📝 Borrador (solo tú puedes verlo)
                            </span>
                          </label>
                          <label className="org-date-form-checkbox">
                            <input
                              type="radio"
                              name="estado_publicacion"
                              value="publicado"
                              checked={dateForm.estado_publicacion === 'publicado'}
                              onChange={(e) => setDateForm({ ...dateForm, estado_publicacion: e.target.value as 'borrador' | 'publicado' })}
                              style={{ transform: 'scale(1.2)' }}
                            />
                            <span style={{ color: '#FFFFFF', fontSize: '1rem' }}>
                              🌐 Público (visible para todos)
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Botones (solo simple; bulk tiene sus botones en el planificador) */}
                    {!bulkMode && (
                      <div className="org-editor-card org-date-form-buttons" style={{ marginTop: 16 }}>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setShowDateForm(false);
                            setDateForm({
                              nombre: '',
                              biografia: '',
                              djs: '',
                              telefono_contacto: '',
                              mensaje_contacto: '',
                              fecha: '',
                              hora_inicio: '',
                              hora_fin: '',
                              lugar: '',
                              ciudad: '',
                              direccion: '',
                              referencias: '',
                              requisitos: '',
                              ubicaciones: [],
                              zona: null,
                              estilos: [],
                              ritmos_seleccionados: [],
                              zonas: [],
                              cronograma: [],
                              costos: [],
                              flyer_url: null,
                              estado_publicacion: 'borrador',
                              repetir_semanal: false,
                              semanas_repetir: 4
                            });
                            setSelectedDateLocationId('');
                            setSelectedParentId(null);
                          }}
                          style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            background: 'transparent',
                            color: '#FFFFFF',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          ❌ Cancelar
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCreateDate}
                          disabled={createEventDate.isPending || !dateForm.fecha}
                          style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            color: '#FFFFFF',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            cursor: createEventDate.isPending || !dateForm.fecha ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 16px rgba(30, 136, 229, 0.3)',
                            opacity: createEventDate.isPending || !dateForm.fecha ? 0.6 : 1
                          }}
                        >
                          {createEventDate.isPending 
                            ? (dateForm.repetir_semanal && dateForm.semanas_repetir 
                                ? `⏳ Creando ${dateForm.semanas_repetir} fechas...` 
                                : '⏳ Creando...')
                            : (dateForm.repetir_semanal && dateForm.semanas_repetir 
                                ? `✨ Crear ${dateForm.semanas_repetir} fechas` 
                                : '✨ Crear')}
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* Planificador bulk (sheet) */}
                  {bulkMode && (
                    <div className="org-editor-card">
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.75rem', color: '#FFFFFF' }}>
                        📋 Planificador (bulk)
                      </h3>
                      <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 10 }}>
                        Seleccionadas: <b>{bulkSelectedCount}</b>
                        {bulkPreview.count > 0 && (
                          <>
                            {' '}· Preview: <b>{bulkPreview.first}</b> → <b>{bulkPreview.last}</b>
                          </>
                        )}
                      </div>

                      {/* Header */}
                      <div style={{ display: 'grid', gridTemplateColumns: '44px 140px 120px 120px 140px 1fr 44px', gap: 10, opacity: 0.85, fontSize: 12, marginBottom: 8 }}>
                        <div></div>
                        <div>Fecha</div>
                        <div>Hora inicio</div>
                        <div>Hora fin</div>
                        <div>Estado</div>
                        <div>Notas</div>
                        <div></div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {bulkRows.map((r) => (
                          <BulkRowItem
                            key={r.id}
                            row={r}
                            errors={bulkErrors[r.id]}
                            onChange={updateBulkRow}
                            onRemove={removeBulkRow}
                          />
                        ))}
                      </div>

                      <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={handleBulkCreateDates}
                          disabled={createEventDate.isPending || bulkSelectedCount === 0}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: '1px solid rgba(39,195,255,0.40)',
                            background: 'rgba(39,195,255,0.14)',
                            color: '#fff',
                            cursor: createEventDate.isPending || bulkSelectedCount === 0 ? 'not-allowed' : 'pointer',
                            fontWeight: 800,
                            opacity: createEventDate.isPending || bulkSelectedCount === 0 ? 0.55 : 1,
                          }}
                        >
                          {createEventDate.isPending ? '⏳ Guardando batch...' : '✅ Guardar fechas (batch)'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBulkPublish(true)}
                          disabled={Object.keys(createdDateIdByRow).length === 0}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.18)',
                            background: 'rgba(255,255,255,0.06)',
                            color: '#fff',
                            cursor: Object.keys(createdDateIdByRow).length === 0 ? 'not-allowed' : 'pointer',
                            fontWeight: 800,
                            opacity: Object.keys(createdDateIdByRow).length === 0 ? 0.55 : 1,
                          }}
                        >
                          🌐 Publicar seleccionadas
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBulkPublish(false)}
                          disabled={Object.keys(createdDateIdByRow).length === 0}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.18)',
                            background: 'rgba(255,255,255,0.06)',
                            color: '#fff',
                            cursor: Object.keys(createdDateIdByRow).length === 0 ? 'not-allowed' : 'pointer',
                            fontWeight: 800,
                            opacity: Object.keys(createdDateIdByRow).length === 0 ? 0.55 : 1,
                          }}
                        >
                          🚀 Publicar todas
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Flyers pendientes (bulk) */}
                  {bulkMode && showPendingFlyers && (
                    <div className="org-editor-card">
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.75rem', color: '#FFFFFF' }}>
                        🧾 Flyers pendientes
                      </h3>
                      <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 12 }}>
                        Sube flyers después del batch. No bloquea la creación. Puedes usar flyer general o reemplazar individualmente.
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {(() => {
                          const all = bulkRows
                            .map((r) => ({ r, dateId: createdDateIdByRow[r.id] }))
                            .filter((x) => !!x.dateId);
                          const filtered = bulkShowAllFlyers
                            ? all
                            : all.filter(({ r }) => !r.flyer_url || r.flyer_status === 'ERROR' || r.flyer_status === 'PENDING');
                          const showing = filtered;

                          return (
                            <>
                              {all.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                                    Mostrando <b>{showing.length}</b> de <b>{all.length}</b>.
                                    {!bulkShowAllFlyers && all.length !== showing.length && (
                                      <> (las que ya tienen flyer no se muestran)</>
                                    )}
                                  </div>
                                  {all.length !== showing.length && (
                                    <button
                                      type="button"
                                      onClick={() => setBulkShowAllFlyers((v) => !v)}
                                      style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                                    >
                                      {bulkShowAllFlyers ? '🙈 Ocultar las que ya tienen flyer' : '👀 Mostrar todas (para reemplazar)'}
                                    </button>
                                  )}
                                </div>
                              )}

                              {showing.length === 0 && (
                                <div style={{ fontSize: 13, opacity: 0.9 }}>
                                  ✅ Todas las fechas ya tienen flyer. Si quieres reemplazar alguno, usa “Mostrar todas”.
                                </div>
                              )}

                              {showing.map(({ r, dateId }) => (
                                <div
                                  key={r.id}
                                  style={{
                                    border: '1px solid rgba(255,255,255,0.10)',
                                    borderRadius: 14,
                                    padding: 12,
                                    background: 'rgba(255,255,255,0.04)',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                                    <div style={{ fontWeight: 800 }}>
                                      📅 {r.fecha} {r.hora_inicio ? `· ${r.hora_inicio}` : ''}
                                    </div>
                                    <div style={{ fontSize: 12, opacity: 0.85 }}>
                                      {r.flyer_status === 'UPLOADING' ? '⏳ UPLOADING' : (r.flyer_url ? '✅ DONE' : (r.flyer_status === 'ERROR' ? '❌ ERROR' : '⏳ PENDING'))}
                                    </div>
                                  </div>

                                  <DateFlyerUploader
                                    value={r.flyer_url || null}
                                    dateId={Number(dateId)}
                                    parentId={selectedParentId || undefined}
                                    onStatusChange={(status) => {
                                      if (status === 'UPLOADING') updateBulkRow(r.id, { flyer_status: 'UPLOADING' });
                                      if (status === 'DONE') updateBulkRow(r.id, { flyer_status: 'DONE' });
                                      if (status === 'ERROR') updateBulkRow(r.id, { flyer_status: 'ERROR' });
                                      if (status === 'PENDING') updateBulkRow(r.id, { flyer_status: 'PENDING', flyer_url: null });
                                    }}
                                    onChange={async (url) => {
                                      try {
                                        await updateDate.mutateAsync({ id: Number(dateId), flyer_url: url || null });
                                        updateBulkRow(r.id, { flyer_url: url || null, flyer_status: url ? 'DONE' : 'PENDING' });
                                        showToast('Flyer guardado ✅', 'success');
                                      } catch (e: any) {
                                        console.error('[OrganizerProfileEditor] error updating flyer_url:', e);
                                        updateBulkRow(r.id, { flyer_status: 'ERROR' });
                                        showToast(e?.message || 'Error guardando flyer', 'error');
                                      }
                                    }}
                                  />
                                </div>
                              ))}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {(() => {
                // Filtrar fechas independientes (sin parent_id)
                const independentDates = (allOrganizerDates || []).filter((d: any) => !d.parent_id);
                
                // Clasificar fechas independientes en disponibles y pasadas
                // NOTA: No usar useMemo aquí porque estamos dentro de una IIFE (viola reglas de hooks)
                const today = (() => {
                  const d = new Date();
                  d.setHours(0, 0, 0, 0);
                  return d;
                })();
                
                const parseLocalYmd = (value?: string | null) => {
                  if (!value) return null as Date | null;
                  try {
                    const plain = String(value).split('T')[0];
                    const [y, m, d] = plain.split('-').map((n) => parseInt(n, 10));
                    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
                      const fallback = new Date(value);
                      return Number.isNaN(fallback.getTime()) ? null : fallback;
                    }
                    return new Date(y, m - 1, d);
                  } catch {
                    return null;
                  }
                };
                
                const getDisplayFechaYmd = (d: any): string | null => {
                  try {
                    if (d.dia_semana !== null && d.dia_semana !== undefined && typeof d.dia_semana === 'number') {
                      const horaInicioStr = d.hora_inicio || '20:00';
                      const next = calculateNextDateWithTime(d.dia_semana, horaInicioStr);
                      const year = next.getFullYear();
                      const month = String(next.getMonth() + 1).padStart(2, '0');
                      const day = String(next.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    }
                    if (!d.fecha) return null;
                    return String(d.fecha).split('T')[0];
                  } catch {
                    return d?.fecha ? String(d.fecha).split('T')[0] : null;
                  }
                };
                
                const formatEsDate = (input?: string) => {
                  try {
                    if (!input) return '';
                    const base = input.includes('T') ? input.split('T')[0] : input;
                    const [yyyy, mm, dd] = base.split('-').map(n => parseInt(n, 10));
                    if (!yyyy || !mm || !dd) return base;
                    const dt = new Date(yyyy, (mm - 1), dd);
                    return dt.toLocaleDateString('es-ES', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });
                  } catch {
                    return input || '';
                  }
                };
                
                const independentAvailable = independentDates.filter((d: any) => {
                  try {
                    const displayYmd = getDisplayFechaYmd(d);
                    if (!displayYmd) return false;
                    const dateObj = parseLocalYmd(displayYmd);
                    if (!dateObj) return false;
                    dateObj.setHours(0, 0, 0, 0);
                    return dateObj >= today;
                  } catch {
                    return false;
                  }
                });
                
                const independentPast = independentDates
                  .filter((d: any) => {
                    try {
                      if (d.dia_semana !== null && d.dia_semana !== undefined && typeof d.dia_semana === 'number') {
                        return false;
                      }
                      const displayYmd = getDisplayFechaYmd(d);
                      if (!displayYmd) return false;
                      const dateObj = parseLocalYmd(displayYmd);
                      if (!dateObj) return false;
                      dateObj.setHours(0, 0, 0, 0);
                      return dateObj < today;
                    } catch {
                      return false;
                    }
                  })
                  .sort((a: any, b: any) => {
                    const da = parseLocalYmd(a.fecha);
                    const db = parseLocalYmd(b.fecha);
                    if (!da || !db) return 0;
                    return db.getTime() - da.getTime();
                  });
                
                return (
                  <>
                    {parents && parents.length > 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="org-events-grid"
                      >
                        {parents.map((parent: any, index: number) => (
                          <motion.div
                            key={parent.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                          >
                            <EventParentCard
                              parent={parent}
                              onDelete={handleDeleteEvent}
                              isDeleting={deleteParent.isPending}
                              onDuplicateDate={handleDuplicateDate}
                              onDeleteDate={handleDeleteDate}
                              deletingDateId={deletingDateId}
                              isMobile={isMobile}
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : null}
                    
                    {/* Fechas independientes (sin parent_id) */}
                    {independentDates.length > 0 && (
                      <div style={{ marginTop: parents && parents.length > 0 ? '2rem' : 0 }}>
                        <div className="dates-block">
                          {/* Fechas disponibles */}
                          {independentAvailable.length > 0 && (
                            <details className="dates-section" open>
                              <summary>
                                <span className="dates-section-title">
                                  <span className="dates-section-icon available">✓</span>
                                  Fechas disponibles
                                  <span className="dates-section-count">
                                    ({independentAvailable.length})
                                  </span>
                                </span>
                                <span className="dates-chevron">▼</span>
                              </summary>
                              <div className="dates-strip">
                                {independentAvailable.map((date: any) => (
                                  <article
                                    key={date.id}
                                    className="date-card"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/social/fecha/${date.id}`);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <header className="date-card-header">
                                      <div>
                                        <h3 className="date-card-title">
                                          {date.nombre || 'Fecha sin nombre'}
                                        </h3>
                                        <div className="date-pill">
                                          <span className="date-pill-icon">📅</span>
                                          {formatEsDate(getDisplayFechaYmd(date) || date.fecha)}
                                        </div>
                                      </div>
                                      <span className="date-status date-status-available">
                                        Disponible
                                      </span>
                                    </header>
                                    <div className="date-card-body">
                                      {date.hora_inicio && date.hora_fin && (
                                        <div className="date-row">
                                          <span className="chip">
                                            🕒 {date.hora_inicio} – {date.hora_fin}
                                          </span>
                                        </div>
                                      )}
                                      {(date.lugar || date.ciudad) && (
                                        <div className="date-row">
                                          {date.lugar && (
                                            <span className="chip">📍 {date.lugar}</span>
                                          )}
                                          {date.ciudad && (
                                            <span className="chip chip-muted">
                                              {date.ciudad}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <footer className="date-card-footer">
                                      <span className="chip chip-people">
                                        <RSVPCounter
                                          eventDateId={date.id}
                                          variant="minimal"
                                          showIcons={true}
                                        />
                                      </span>
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/social/fecha/${date.id}`);
                                          }}
                                          style={{
                                            padding: '3px 8px',
                                            borderRadius: 999,
                                            border: '1px solid rgba(255,255,255,0.18)',
                                            background: 'transparent',
                                            color: 'var(--text-main)',
                                            fontSize: 11,
                                            cursor: 'pointer'
                                          }}
                                        >
                                          👁 Ver
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/social/fecha/${date.id}/edit`);
                                          }}
                                          style={{
                                            padding: '3px 8px',
                                            borderRadius: 999,
                                            border: '1px solid rgba(39,195,255,0.6)',
                                            background: 'rgba(39,195,255,0.12)',
                                            color: 'var(--accent-blue)',
                                            fontSize: 11,
                                            cursor: 'pointer'
                                          }}
                                        >
                                          ✏️ Editar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteDate(date);
                                          }}
                                          disabled={deletingDateId === date.id}
                                          style={{
                                            padding: '3px 8px',
                                            borderRadius: 999,
                                            border: '1px solid rgba(255,61,87,0.6)',
                                            background: 'rgba(255,61,87,0.12)',
                                            color: '#ff3d57',
                                            fontSize: 11,
                                            cursor: deletingDateId === date.id ? 'not-allowed' : 'pointer',
                                            opacity: deletingDateId === date.id ? 0.5 : 1
                                          }}
                                        >
                                          {deletingDateId === date.id ? '⏳' : '🗑️'} Eliminar
                                        </button>
                                      </div>
                                    </footer>
                                  </article>
                                ))}
                              </div>
                            </details>
                          )}
                          
                          {/* Fechas pasadas */}
                          {independentPast.length > 0 && (
                            <details className="dates-section">
                              <summary>
                                <span className="dates-section-title">
                                  <span className="dates-section-icon past">⏱</span>
                                  Fechas pasadas
                                  <span className="dates-section-count">
                                    ({independentPast.length})
                                  </span>
                                </span>
                                <span className="dates-chevron">▼</span>
                              </summary>
                              <div className="dates-strip">
                                {independentPast.map((date: any) => (
                                  <article
                                    key={date.id}
                                    className="date-card past"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/social/fecha/${date.id}`);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <header className="date-card-header">
                                      <div>
                                        <h3 className="date-card-title">
                                          {date.nombre || 'Fecha sin nombre'}
                                        </h3>
                                        <div className="date-pill">
                                          <span className="date-pill-icon">📅</span>
                                          {formatEsDate(getDisplayFechaYmd(date) || date.fecha)}
                                        </div>
                                      </div>
                                      <span className="date-status date-status-past">
                                        Pasada
                                      </span>
                                    </header>
                                    <div className="date-card-body">
                                      {(date.lugar || date.ciudad) && (
                                        <div className="date-row">
                                          {date.lugar && (
                                            <span className="chip">{date.lugar}</span>
                                          )}
                                          {date.ciudad && (
                                            <span className="chip chip-muted">
                                              {date.ciudad}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <footer className="date-card-footer">
                                      <span className="chip chip-people">
                                        <RSVPCounter
                                          eventDateId={date.id}
                                          variant="minimal"
                                          showIcons={true}
                                        />
                                      </span>
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/social/fecha/${date.id}`);
                                          }}
                                          style={{
                                            padding: '3px 8px',
                                            borderRadius: 999,
                                            border: '1px solid rgba(255,255,255,0.18)',
                                            background: 'transparent',
                                            color: 'var(--text-main)',
                                            fontSize: 11,
                                            cursor: 'pointer'
                                          }}
                                        >
                                          👁 Ver
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/social/fecha/${date.id}/edit`);
                                          }}
                                          style={{
                                            padding: '3px 8px',
                                            borderRadius: 999,
                                            border: '1px solid rgba(39,195,255,0.6)',
                                            background: 'rgba(39,195,255,0.12)',
                                            color: 'var(--accent-blue)',
                                            fontSize: 11,
                                            cursor: 'pointer'
                                          }}
                                        >
                                          ✏️ Editar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteDate(date);
                                          }}
                                          disabled={deletingDateId === date.id}
                                          style={{
                                            padding: '3px 8px',
                                            borderRadius: 999,
                                            border: '1px solid rgba(255,61,87,0.6)',
                                            background: 'rgba(255,61,87,0.12)',
                                            color: '#ff3d57',
                                            fontSize: 11,
                                            cursor: deletingDateId === date.id ? 'not-allowed' : 'pointer',
                                            opacity: deletingDateId === date.id ? 0.5 : 1
                                          }}
                                        >
                                          {deletingDateId === date.id ? '⏳' : '🗑️'} Eliminar
                                        </button>
                                      </div>
                                    </footer>
                                  </article>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {!parents?.length && independentDates.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="org-events-empty"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="org-events-empty-icon"
                  >
                    🎭
                  </motion.div>
                  <h3>
                    Aún no tienes fechas creadas
                  </h3>
                  <p>
                    Usa el botón &quot;Crear Fecha&quot; para publicar tu primer evento.
                  </p>
                </motion.div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
          {/* Botón Crear Evento (movido a cabecera, se elimina el flotante) */}
          {/* Información para Asistentes */}
        {/*   <div className="org-editor-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
              💬 Información para Asistentes
            </h2>

            <div className="org-editor-grid">
              <div>
                <label className="org-editor-field">
                  🎵 ¿Qué música tocarán?
                </label>
                <textarea
                  value={form.respuestas.musica_tocaran}
                  onChange={(e) => setNested('respuestas.musica_tocaran', e.target.value)}
                  placeholder="Describe el tipo de música que tocarán..."
                  rows={2}
                  className="org-editor-textarea"
                />
              </div>

              <div>
                <label className="org-editor-field">
                  🅿️ ¿Hay estacionamiento?
                </label>
                <textarea
                  value={form.respuestas.hay_estacionamiento}
                  onChange={(e) => setNested('respuestas.hay_estacionamiento', e.target.value)}
                  placeholder="Información sobre estacionamiento..."
                  rows={2}
                  className="org-editor-textarea"
                />
              </div>
            </div>
          </div> */}

          {/* Cuenta Bancaria */}
          <div className="org-editor-card" style={{ marginBottom: '3rem' }}>
            <BankAccountEditor
              value={(form as any).cuenta_bancaria || {}}
              onChange={(v) => setField('cuenta_bancaria' as any, v as any)}
            />
          </div>

          {/* Sección de Fotos - Dos Columnas */}
          <div className="photos-two-columns" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem', alignItems: 'stretch' }}>
            {/* Columna 1: Avatar / Foto Principal */}
            <PhotoManagementSection
              media={media}
              uploading={uploading}
              uploadFile={uploadFile}
              removeFile={removeFile}
              title="📷 Gestión de Fotos"
              description="👤 Avatar / Foto Principal (p1)"
              slots={['p1']}
              isMainPhoto={true}
            />

            {/* Columna 2: Fotos Destacadas */}
            <PhotoManagementSection
              media={media}
              uploading={uploading}
              uploadFile={uploadFile}
              removeFile={removeFile}
              title="📷 Fotos Destacadas (p2 - p3)"
              description="Estas fotos se usan en las secciones destacadas de tu perfil"
              slots={['p2', 'p3']}
              isMainPhoto={false}
              verticalLayout={true}
            />
          </div>

          {/* Sección de Fotos Adicionales */}
          <PhotoManagementSection
            media={media}
            uploading={uploading}
            uploadFile={uploadFile}
            removeFile={removeFile}
            title="📷 Fotos Adicionales (p4-p10)"
            description="Estas fotos aparecerán en la galería de tu perfil"
            slots={['p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']}
            isMainPhoto={false}
          />

          {/* Sección de Videos */}
          <VideoManagementSection
            media={media}
            uploading={uploading}
            uploadFile={uploadFile}
            removeFile={removeFile}
            title="🎥 Gestión de Videos"
            description="Los videos aparecerán en la sección de videos de tu perfil"
            slots={['v1', 'v2', 'v3']}
          />

          {/* Estado y Acciones - Solo mostrar si el perfil ya existe */}
          {!isNewProfile && (
            <div className="org-editor-card">
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
                ⚙️ Estado y Acciones
              </h2>

              {estadoBadge && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', opacity: 0.75 }}>Estado:</span>
                  {estadoBadge}
                </div>
              )}

              {(org as any)?.estado_aprobacion === "borrador" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitForReview}
                  disabled={submit.isPending}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: submit.isPending ? `${colors.light}33` : colors.blue,
                    color: colors.light,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: submit.isPending ? 'not-allowed' : 'pointer',
                    boxShadow: `0 4px 16px ${colors.blue}66`,
                  }}
                >
                  {submit.isPending ? '⏳ Enviando...' : '📤 Enviar para Revisión'}
                </motion.button>
              )}
            </div>
          )}

            </>
          )}

        </div>
      </div>

      {/* Modal de confirmación para eliminar fecha */}
      {dateToDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
          }}
          onClick={cancelDeleteDate}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(32, 38, 58, 0.98) 0%, rgba(21, 25, 39, 1) 100%)',
              borderRadius: '20px',
              border: '1.5px solid rgba(39, 195, 255, 0.4)',
              padding: '2rem',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              marginBottom: '0.75rem',
            }}>
              🗑️ Eliminar Fecha
            </h3>
            <p style={{
              fontSize: '0.95rem',
              color: 'var(--text-muted)',
              marginBottom: '1.5rem',
              lineHeight: 1.6,
            }}>
              ¿Estás seguro de que deseas eliminar la fecha <strong style={{ color: 'var(--text-main)' }}>"{dateToDelete.nombre}"</strong>?
              <br />
              <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Esta acción no se puede deshacer.</span>
            </p>
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
            }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={cancelDeleteDate}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-main)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={confirmDeleteDate}
                disabled={deletingDateId === dateToDelete.id}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(255, 61, 87, 0.6)',
                  background: deletingDateId === dateToDelete.id 
                    ? 'rgba(255, 61, 87, 0.3)' 
                    : 'rgba(255, 61, 87, 0.2)',
                  color: '#ff3d57',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: deletingDateId === dateToDelete.id ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: deletingDateId === dateToDelete.id ? 0.6 : 1,
                }}
              >
                {deletingDateId === dateToDelete.id ? '⏳ Eliminando...' : '🗑️ Eliminar'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}