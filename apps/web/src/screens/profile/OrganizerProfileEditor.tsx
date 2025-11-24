import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMyOrganizer, useUpsertMyOrganizer, useSubmitOrganizerForReview } from "../../hooks/useOrganizer";
import { useParentsByOrganizer, useDeleteParent, useDatesByParent, useDeleteDate } from "../../hooks/useEvents";
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
import { FaInstagram, FaFacebookF, FaWhatsapp } from 'react-icons/fa';

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

  const availableDates = (dates || []).filter((d: any) => {
    try {
      const dateObj = parseLocalYmd(d.fecha);
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
        const dateObj = parseLocalYmd(d.fecha);
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

  const handleSocialClick = () => {
    navigate(`/social/${parent.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="org-event-card"
    >
      {/* FILA 1: Información del Social */}
      <div className="org-event-card-header">
        {/* Contenido principal */}
        <div className="org-event-card-content">
          {/* Nombre del social */}
          <h3 className="org-event-card-title">
            {parent.nombre}
          </h3>

          {/* Descripción */}
          {parent.descripcion && (
            <p className="org-event-card-description">
              {parent.descripcion.length > 200 ? `${parent.descripcion.substring(0, 200)}...` : parent.descripcion}
            </p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="org-event-card-actions">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSocialClick}
            className="org-event-card-button org-event-card-button--view"
          >
            <span>👁️</span>
            <span>Ver</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/social/${parent.id}/edit`);
            }}
            className="org-event-card-button org-event-card-button--edit"
          >
            <span>✏️</span>
            <span>Editar</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(parent.id);
            }}
            disabled={isDeleting}
            className="org-event-card-button org-event-card-button--delete"
          >
            <span>{isDeleting ? '⏳' : '🗑️'}</span>
            <span>{isDeleting ? 'Eliminando...' : 'Eliminar'}</span>
          </motion.button>
        </div>
      </div>

      {/* FILA 2: Fechas del social */}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {/* Contenedor 1: Fechas disponibles (hoy en adelante) */}
                {availableDates.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      padding: isMobile ? '1rem' : '1.5rem',
                      borderRadius: '16px',
                      border: '2px solid rgba(30, 136, 229, 0.35)',
                      background: 'rgba(10, 20, 40, 0.7)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
                      Fechas disponibles
                    </div>
                    {availableDates.map((date: any, index: number) => (
                      <motion.div
                        key={date.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.3 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/social/fecha/${date.id}`);
                        }}
                        style={{
                          padding: isMobile ? '1.25rem' : '1.5rem',
                          borderRadius: '16px',
                          border: '2px solid rgba(255, 255, 255, 0.15)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                          background: 'rgba(20, 20, 20, 0.5)',
                          marginBottom: '0.75rem'
                        }}
                        whileHover={{
                          y: -4,
                          borderColor: 'rgba(30, 136, 229, 0.5)',
                          background: 'rgba(30, 30, 30, 0.6)'
                        }}
                      >
                        {/* Efecto de brillo en hover */}
                        <motion.div
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 0.6, ease: 'easeInOut' }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)',
                            zIndex: 1,
                            pointerEvents: 'none'
                          }}
                        />

                        {/* FILA 1: Nombre y fecha principal */}
                        <div style={{
                          display: 'flex',
                          alignItems: isMobile ? 'stretch' : 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          position: 'relative',
                          zIndex: 2,
                          paddingBottom: '1rem',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          flexDirection: isMobile ? 'column' : 'row'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, flexDirection: isMobile ? 'column' : 'row', textAlign: isMobile ? 'center' : 'left', width: '100%' }}>
                            <motion.div
                              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                              transition={{ duration: 0.4 }}
                              style={{
                                width: isMobile ? '44px' : '48px',
                                height: isMobile ? '44px' : '48px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: isMobile ? '1.2rem' : '1.4rem',
                                background: 'rgba(30, 136, 229, 0.15)',
                                border: '2px solid rgba(30, 136, 229, 0.3)',
                                boxShadow: '0 4px 12px rgba(30, 136, 229, 0.2)',
                                flexShrink: 0
                              }}
                            >
                              📅
                            </motion.div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: isMobile ? '1.1rem' : '1.2rem',
                                fontWeight: '800',
                                color: colors.light,
                                lineHeight: 1.3,
                                letterSpacing: '-0.01em',
                                marginBottom: '0.25rem'
                              }}>
                                {date.nombre || 'Fecha sin nombre'}
                              </div>
                              {/* Fecha en chip compacto */}
                              <div style={{
                                fontSize: '0.875rem',
                                color: colors.blue,
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '0.4rem 0.75rem',
                                background: 'rgba(30, 136, 229, 0.15)',
                                borderRadius: '8px',
                                border: '1px solid rgba(30, 136, 229, 0.25)',
                                width: 'fit-content',
                                margin: isMobile ? '0 auto' : undefined
                              }}>
                                <span>📅</span>
                                <span>{formatEsDate(date.fecha)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Botones de acción en la primera fila */}
                          <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            flexShrink: 0,
                            flexDirection: isMobile ? 'column' : 'row',
                            width: isMobile ? '100%' : 'auto'
                          }}>
                            <motion.button
                              whileHover={{ scale: 1.08, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/social/fecha/${date.id}/edit`);
                              }}
                              style={{
                                padding: '0.6rem 1rem',
                                background: `linear-gradient(135deg, ${colors.blue}, #00BCD4)`,
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(30, 136, 229, 0.3)',
                                whiteSpace: 'nowrap',
                                width: isMobile ? '100%' : 'auto',
                                justifyContent: 'center'
                              }}
                            >
                              <span>✏️</span>
                              <span>Editar</span>
                            </motion.button>
                            {onDuplicateDate && (
                              <motion.button
                                whileHover={{ scale: 1.08, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDuplicateDate(date);
                                }}
                                style={{
                                  padding: '0.6rem 1rem',
                                  background: `linear-gradient(135deg, ${colors.yellow}, ${colors.blue})`,
                                  color: '#0B0B0B',
                                  border: 'none',
                                  borderRadius: '10px',
                                  fontSize: '0.8rem',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.3s ease',
                                  boxShadow: '0 4px 12px rgba(255, 209, 102, 0.35)',
                                  whiteSpace: 'nowrap',
                                  width: isMobile ? '100%' : 'auto',
                                  justifyContent: 'center'
                                }}
                              >
                                <span>📄</span>
                                <span>Duplicar</span>
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.08, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteDate?.(date);
                              }}
                              disabled={Boolean(deletingDateId && deletingDateId === date.id)}
                              style={{
                                padding: '0.6rem 1rem',
                                background: `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`,
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                cursor: deletingDateId === date.id ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(255, 61, 87, 0.3)',
                                whiteSpace: 'nowrap',
                                width: isMobile ? '100%' : 'auto',
                                justifyContent: 'center'
                              }}
                            >
                              <span>{deletingDateId === date.id ? '⏳' : '🗑️'}</span>
                              <span>{deletingDateId === date.id ? 'Eliminando...' : 'Eliminar'}</span>
                            </motion.button>
                          </div>
                        </div>

                        {/* FILA 2: Detalles de la fecha */}
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          alignItems: 'center',
                          position: 'relative',
                          zIndex: 2,
                          justifyContent: isMobile ? 'center' : 'flex-start'
                        }}>
                          {date.hora_inicio && date.hora_fin && (
                            <div style={{
                              fontSize: '0.875rem',
                              color: colors.light,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '0.5rem 0.875rem',
                              background: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '10px',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              width: 'fit-content'
                            }}>
                              <span>🕐</span>
                              <span>{date.hora_inicio} - {date.hora_fin}</span>
                            </div>
                          )}

                          {date.lugar && (
                            <div style={{
                              fontSize: '0.875rem',
                              color: colors.light,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '0.5rem 0.875rem',
                              background: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '10px',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              width: 'fit-content'
                            }}>
                              <span>📍</span>
                              <span>{date.lugar}</span>
                            </div>
                          )}

                          {date.ciudad && (
                            <div style={{
                              fontSize: '0.8rem',
                              color: 'rgba(255, 255, 255, 0.8)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '0.4rem 0.75rem',
                              background: 'rgba(255, 255, 255, 0.06)',
                              borderRadius: '8px',
                              width: 'fit-content'
                            }}>
                              <span>🏙️</span>
                              <span>{date.ciudad}</span>
                            </div>
                          )}

                          {/* Contador de RSVP */}
                          <div style={{
                            marginLeft: isMobile ? 0 : 'auto',
                            padding: '0.5rem 0.875rem',
                            background: 'rgba(255, 140, 66, 0.15)',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 140, 66, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            width: isMobile ? '100%' : 'auto',
                            justifyContent: isMobile ? 'center' : 'flex-start'
                          }}>
                            <RSVPCounter
                              eventDateId={date.id}
                              variant="minimal"
                              showIcons={true}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Contenedor 2: Fechas pasadas (historial) */}
                {pastDates.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                    style={{
                      padding: isMobile ? '1rem' : '1.5rem',
                      borderRadius: '16px',
                      border: '2px solid rgba(120, 120, 120, 0.4)',
                      background: 'rgba(20, 20, 20, 0.75)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                      Fechas pasadas
                    </div>
                    {pastDates.map((date: any, index: number) => (
                    <motion.div
                      key={date.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.3 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/social/fecha/${date.id}`);
                      }}
                      style={{
                        padding: isMobile ? '1.25rem' : '1.5rem',
                        borderRadius: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        background: 'rgba(20, 20, 20, 0.5)'
                      }}
                      whileHover={{
                        y: -4,
                        borderColor: 'rgba(30, 136, 229, 0.5)',
                        background: 'rgba(30, 30, 30, 0.6)'
                      }}
                    >
                      {/* Efecto de brillo en hover */}
                      <motion.div
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)',
                          zIndex: 1,
                          pointerEvents: 'none'
                        }}
                      />

                      {/* FILA 1: Nombre y fecha principal */}
                      <div style={{
                        display: 'flex',
                        alignItems: isMobile ? 'stretch' : 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        position: 'relative',
                        zIndex: 2,
                        paddingBottom: '1rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        flexDirection: isMobile ? 'column' : 'row'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, flexDirection: isMobile ? 'column' : 'row', textAlign: isMobile ? 'center' : 'left', width: '100%' }}>
                          <motion.div
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.4 }}
                            style={{
                              width: isMobile ? '44px' : '48px',
                              height: isMobile ? '44px' : '48px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: isMobile ? '1.2rem' : '1.4rem',
                              background: 'rgba(30, 136, 229, 0.15)',
                              border: '2px solid rgba(30, 136, 229, 0.3)',
                              boxShadow: '0 4px 12px rgba(30, 136, 229, 0.2)',
                              flexShrink: 0
                            }}
                          >
                            📅
                          </motion.div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: isMobile ? '1.1rem' : '1.2rem',
                              fontWeight: '800',
                              color: colors.light,
                              lineHeight: 1.3,
                              letterSpacing: '-0.01em',
                              marginBottom: '0.25rem'
                            }}>
                              {date.nombre || 'Fecha sin nombre'}
                            </div>
                            {/* Fecha en chip compacto */}
                            <div style={{
                              fontSize: '0.875rem',
                              color: colors.blue,
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '0.4rem 0.75rem',
                              background: 'rgba(30, 136, 229, 0.15)',
                              borderRadius: '8px',
                              border: '1px solid rgba(30, 136, 229, 0.25)',
                              width: 'fit-content',
                              margin: isMobile ? '0 auto' : undefined
                            }}>
                              <span>📅</span>
                              <span>{formatEsDate(date.fecha)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Botones de acción en la primera fila */}
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          flexShrink: 0,
                          flexDirection: isMobile ? 'column' : 'row',
                          width: isMobile ? '100%' : 'auto'
                        }}>
                          <motion.button
                            whileHover={{ scale: 1.08, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/social/fecha/${date.id}/edit`);
                            }}
                            style={{
                              padding: '0.6rem 1rem',
                              background: `linear-gradient(135deg, ${colors.blue}, #00BCD4)`,
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 4px 12px rgba(30, 136, 229, 0.3)',
                              whiteSpace: 'nowrap',
                              width: isMobile ? '100%' : 'auto',
                              justifyContent: 'center'
                            }}
                          >
                            <span>✏️</span>
                            <span>Editar</span>
                          </motion.button>
                          {onDuplicateDate && (
                            <motion.button
                              whileHover={{ scale: 1.08, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateDate(date);
                              }}
                              style={{
                                padding: '0.6rem 1rem',
                                background: `linear-gradient(135deg, ${colors.yellow}, ${colors.blue})`,
                                color: '#0B0B0B',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(255, 209, 102, 0.35)',
                              whiteSpace: 'nowrap',
                              width: isMobile ? '100%' : 'auto',
                              justifyContent: 'center'
                              }}
                            >
                              <span>📄</span>
                              <span>Duplicar</span>
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.08, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteDate?.(date);
                            }}
                            disabled={Boolean(deletingDateId && deletingDateId === date.id)}
                            style={{
                              padding: '0.6rem 1rem',
                              background: `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`,
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              cursor: deletingDateId === date.id ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 4px 12px rgba(255, 61, 87, 0.3)',
                              whiteSpace: 'nowrap',
                              width: isMobile ? '100%' : 'auto',
                              justifyContent: 'center'
                            }}
                          >
                            <span>{deletingDateId === date.id ? '⏳' : '🗑️'}</span>
                            <span>{deletingDateId === date.id ? 'Eliminando...' : 'Eliminar'}</span>
                          </motion.button>
                        </div>
                      </div>

                      {/* FILA 2: Detalles de la fecha */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        alignItems: 'center',
                        position: 'relative',
                        zIndex: 2,
                        justifyContent: isMobile ? 'center' : 'flex-start'
                      }}>
                        {date.hora_inicio && date.hora_fin && (
                          <div style={{
                            fontSize: '0.875rem',
                            color: colors.light,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '0.5rem 0.875rem',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            width: 'fit-content'
                          }}>
                            <span>🕐</span>
                            <span>{date.hora_inicio} - {date.hora_fin}</span>
                          </div>
                        )}

                        {date.lugar && (
                          <div style={{
                            fontSize: '0.875rem',
                            color: colors.light,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '0.5rem 0.875rem',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            width: 'fit-content'
                          }}>
                            <span>📍</span>
                            <span>{date.lugar}</span>
                          </div>
                        )}

                        {date.ciudad && (
                          <div style={{
                            fontSize: '0.8rem',
                            color: 'rgba(255, 255, 255, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '0.4rem 0.75rem',
                            background: 'rgba(255, 255, 255, 0.06)',
                            borderRadius: '8px',
                            width: 'fit-content'
                          }}>
                            <span>🏙️</span>
                            <span>{date.ciudad}</span>
                          </div>
                        )}

                        {/* Contador de RSVP */}
                        <div style={{
                          marginLeft: isMobile ? 0 : 'auto',
                          padding: '0.5rem 0.875rem',
                          background: 'rgba(255, 140, 66, 0.15)',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 140, 66, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          width: isMobile ? '100%' : 'auto',
                          justifyContent: isMobile ? 'center' : 'flex-start'
                        }}>
                          <RSVPCounter
                            eventDateId={date.id}
                            variant="minimal"
                            showIcons={true}
                          />
                        </div>
                      </div>
                    </motion.div>
                    ))}
                  </motion.div>
                )}
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
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });
  const { data: org, isLoading } = useMyOrganizer();
  const upsert = useUpsertMyOrganizer();
  const submit = useSubmitOrganizerForReview();
  const { data: parents } = useParentsByOrganizer((org as any)?.id);
  const { data: orgLocations = [] } = useOrganizerLocations((org as any)?.id);
  const createOrgLoc = useCreateOrganizerLocation();
  const updateOrgLoc = useUpdateOrganizerLocation();
  const deleteOrgLoc = useDeleteOrganizerLocation();
  const deleteParent = useDeleteParent();
  const deleteDate = useDeleteDate();
  const { media, add, remove } = useOrganizerMedia();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"perfil" | "metricas">("perfil");

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

  // Estados para carga de media
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  // Estado local para edición de ubicaciones por social (no se guarda en profiles_organizer)
  const [locationsDraftByParent, setLocationsDraftByParent] = useState<Record<number, any[]>>({});

  // Estado para formulario de crear fecha
  const [showDateForm, setShowDateForm] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const createEventDate = useCreateEventDate();
  const [deletingDateId, setDeletingDateId] = useState<number | null>(null);
  const [selectedDateLocationId, setSelectedDateLocationId] = useState<string>('');
  const [dateForm, setDateForm] = useState({
    nombre: '',
    biografia: '',
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
  const { user } = useAuth();

  // Cargar tags
  const { data: allTags } = useTags();
  const ritmoTags = allTags?.filter(tag => tag.tipo === 'ritmo') || [];
  const zonaTags = allTags?.filter(tag => tag.tipo === 'zona') || [];

  // Usar formulario hidratado con borrador persistente (namespace por usuario y rol)
  const { form, setField, setNested, hydrated } = useHydratedForm({
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
        whatsapp: ""
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

      const profileId = await upsert.mutateAsync({ 
        ...(form as any), 
        ritmos_seleccionados: outSelected,
        zonas: validatedZonas,
        cuenta_bancaria: (form as any).cuenta_bancaria || {}
      } as any);

      // Si es un perfil nuevo, crear evento y fecha por defecto
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
        showToast('✅ Perfil de organizador creado con evento de ejemplo', 'success');
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
      // Si no existe un evento padre seleccionado, crear uno automáticamente
      let parentIdToUse = selectedParentId;
      if (!parentIdToUse) {
        const parentPayload: any = {
          organizer_id: (org as any)?.id,
          nombre: dateForm.nombre ? `🎉 ${dateForm.nombre}` : '🎉 Nuevo Social',
          descripcion: dateForm.biografia || 'Evento creado automáticamente al crear una fecha.',
          ritmos_seleccionados: dateForm.ritmos_seleccionados || [],
          zonas: dateForm.zonas || []
        };

        const { data: newParent, error: parentErr } = await supabase
          .from('events_parent')
          .insert(parentPayload)
          .select('id')
          .single();

        if (parentErr) {
          console.error('Error creando evento padre automáticamente:', parentErr);
          showToast('No se pudo crear el evento automáticamente', 'error');
          return;
        }
        parentIdToUse = newParent?.id;
      }

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
        parent_id: Number(parentIdToUse),
        nombre: dateForm.nombre || null,
        biografia: dateForm.biografia || null,
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

      // Calcular la fecha a guardar: si tiene repetición semanal, usar la próxima fecha y dia_semana
      let fechaAGuardar = dateForm.fecha;
      let diaSemanaAGuardar: number | null = null;
      
      if (dateForm.repetir_semanal && dateForm.fecha) {
        // Calcular el día de la semana de la fecha inicial
        const [year, month, day] = dateForm.fecha.split('-').map(Number);
        const fechaInicio = new Date(year, month - 1, day);
        const diaSemanaInicial = fechaInicio.getDay(); // 0 = domingo, 1 = lunes, etc.
        diaSemanaAGuardar = diaSemanaInicial;
        
        // Calcular la próxima fecha basada en el día de la semana
        try {
          const horaInicioStr = dateForm.hora_inicio || '20:00';
          const proximaFecha = calculateNextDateWithTime(diaSemanaInicial, horaInicioStr);
          const yearStr = proximaFecha.getFullYear();
          const monthStr = String(proximaFecha.getMonth() + 1).padStart(2, '0');
          const dayStr = String(proximaFecha.getDate()).padStart(2, '0');
          fechaAGuardar = `${yearStr}-${monthStr}-${dayStr}`;
          console.log('[OrganizerProfileEditor] Fecha recurrente - próxima fecha:', fechaAGuardar, 'dia_semana:', diaSemanaAGuardar);
        } catch (e) {
          console.error('Error calculando próxima fecha:', e);
          // Si falla el cálculo, usar la fecha original
        }
      }
      
      // Crear una sola fecha (con dia_semana si es recurrente)
      await createEventDate.mutateAsync({
        ...basePayload,
        fecha: fechaAGuardar,
        dia_semana: diaSemanaAGuardar,
      });
      
      showToast('Fecha creada ✅', 'success');
      setShowDateForm(false);
      setDateForm({
        nombre: '',
        biografia: '',
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
      showToast('Error al crear fecha', 'error');
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
        parent_id: Number(date.parent_id),
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

  const handleDeleteDate = async (date: any) => {
    if (!date?.id) return;
    const confirmDelete = window.confirm(`¿Eliminar la fecha "${date.nombre || 'sin nombre'}"? Esta acción no se puede deshacer.`);
    if (!confirmDelete) return;
    try {
      setDeletingDateId(date.id);
      // Intentar limpiar dependencias conocidas (FK) en public.event_rsvp
      try {
        await supabase.from('event_rsvp').delete().eq('event_date_id', date.id);
      } catch (e) {
        // continuar; si no hay RLS o la tabla no existe/no hay filas, no bloquear
        console.warn('[OrganizerProfileEditor] Limpieza de RSVPs omitida/ya vacía:', e);
      }
      await deleteDate.mutateAsync(date.id);
      showToast('Fecha eliminada ✅', 'success');
    } catch (error: any) {
      console.error('[OrganizerProfileEditor] Error deleting date:', error);
      const msg = error?.message || 'No se pudo eliminar la fecha. Intenta nuevamente.';
      showToast(msg, 'error');
    } finally {
      setDeletingDateId(null);
    }
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

  if (isLoading) {
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
          <div>Cargando perfil del organizador...</div>
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
        
        .org-events-empty-button {
          padding: 1rem 2rem;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #FF3D57, #FF8C42);
          color: #FFFFFF;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(255, 61, 87, 0.4);
          transition: all 0.3s ease;
        }
        
        .org-events-empty-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(255, 61, 87, 0.5);
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
              {/* Banner de Bienvenida (solo para perfiles nuevos) */}
              {isNewProfile && (
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
                    Completa tu información básica y haz clic en{" "}
                    <strong>💾 Guardar</strong> arriba para crear tu perfil
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
                    👆 Mínimo requerido: <strong>Nombre Público</strong>
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
                        value={form.bio}
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

                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/social/new')}
                    className="org-events-action-button org-events-action-button--secondary"
                  >
                    <span>🎉</span>
                    <span>Crear Social</span>
                  </motion.button>
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
                  {/* Info/Selector de evento padre */}
                  {(!parents || parents.length === 0) && (
                    <div className="org-editor-card" style={{ borderStyle: 'dashed' }}>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)' }}>
                        No tienes eventos sociales aún. Al crear esta fecha, se creará automáticamente un evento
                        social base con la información proporcionada.
                      </p>
                    </div>
                  )}

                  {parents && parents.length > 1 && (
                    <div className="org-editor-card">
                      <label className="org-editor-field">
                        Evento Social *
                      </label>
                      <select
                        className="org-date-form-select"
                        value={selectedParentId || ''}
                        onChange={(e) => setSelectedParentId(Number(e.target.value))}
                      >
                        <option value="" style={{ background: '#2b2b2b', color: '#FFFFFF' }}>
                          Selecciona un evento
                        </option>
                        {parents.map((parent: any) => (
                          <option
                            key={parent.id}
                            value={parent.id}
                            style={{ background: '#2b2b2b', color: '#FFFFFF' }}
                          >
                            {parent.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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
                          value={dateForm.biografia}
                          onChange={(e) => setDateForm({ ...dateForm, biografia: e.target.value })}
                          placeholder="Describe el evento, su propósito, qué esperar..."
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

                  {/* Fecha y Hora */}
                  <div className="org-editor-card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                      📅 Fecha y Hora
                    </h3>
                    <div className="org-date-form-grid">
                      <div>
                        <label className="org-editor-field">
                          Fecha *
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

                    {/* Repetición Semanal */}
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

                 

                  {/* Flyer */}
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

                  {/* Estado de Publicación */}
                  <div className="org-editor-card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
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

                  {/* Botones */}
                  <div className="org-editor-card org-date-form-buttons">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowDateForm(false);
                        setDateForm({
                          nombre: '',
                          biografia: '',
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
                      disabled={createEventDate.isPending || !dateForm.fecha || (((parents?.length) || 0) > 1 && !selectedParentId)}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        /* background: createEventDate.isPending || !dateForm.fecha || (parents.length > 1 && !selectedParentId)
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'linear-gradient(135deg, rgba(30, 136, 229, 0.9), rgba(255, 61, 87, 0.9))', */
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        cursor: createEventDate.isPending || !dateForm.fecha || (parents.length > 1 && !selectedParentId) ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 16px rgba(30, 136, 229, 0.3)',
                        opacity: createEventDate.isPending || !dateForm.fecha || (parents.length > 1 && !selectedParentId) ? 0.6 : 1
                      }}
                    >
                      {createEventDate.isPending ? '⏳ Creando...' : '✨ Crear'}
                    </motion.button>
                  </div>
                </motion.div>
              )}

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
              ) : (
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
                    No tienes sociales creados
                  </h3>
                  <p>
                    Crea tu primer social para comenzar a organizar eventos
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/social/new')}
                    className="org-events-empty-button"
                  >
                    🎉 Crear mi Primer Social
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
          {/* Botón Crear Evento (movido a cabecera, se elimina el flotante) */}
          {/* Información para Asistentes */}
          <div className="org-editor-card">
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
          </div>

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
    </>
  );
}