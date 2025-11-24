import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useEventDate, useUpdateEventDate } from "../../hooks/useEventDate";
import { useTags } from "../../hooks/useTags";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import RitmosChips from "../../components/RitmosChips";
import ZonaGroupedChips from "../../components/profile/ZonaGroupedChips";
import ScheduleEditor from "../../components/events/ScheduleEditor";
import DateFlyerUploader from "../../components/events/DateFlyerUploader";
import OrganizerLocationPicker from "../../components/locations/OrganizerLocationPicker";
import { useOrganizerLocations, type OrganizerLocation } from "../../hooks/useOrganizerLocations";
import { RITMOS_CATALOG } from "../../lib/ritmosCatalog";
import { useToast } from "../../components/Toast";
import { calculateNextDateWithTime } from "../../utils/calculateRecurringDates";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

const toFormLocation = (loc?: OrganizerLocation | null) => {
  if (!loc) return null;
  return {
    id: loc.id ?? null,
    sede: loc.nombre || '',
    direccion: loc.direccion || '',
    ciudad: loc.ciudad || '',
    referencias: loc.referencias || '',
    zona_id: typeof loc.zona_id === 'number'
      ? loc.zona_id
      : Array.isArray(loc.zona_ids) && loc.zona_ids.length
        ? loc.zona_ids[0] ?? null
        : null,
    zona_ids: Array.isArray(loc.zona_ids) ? loc.zona_ids : [],
  };
};

export default function OrganizerEventDateEditScreen() {
  const navigate = useNavigate();
  const { dateId } = useParams<{ dateId: string }>();
  const dateIdNum = dateId ? parseInt(dateId) : undefined;

  const { data: date, isLoading } = useEventDate(dateIdNum);
  const updateDate = useUpdateEventDate();
  const { data: allTags } = useTags();
  const ritmoTags = allTags?.filter((t: any) => t.tipo === 'ritmo') || [];
  const zonaTags = allTags?.filter((t: any) => t.tipo === 'zona') || [];

  const { data: myOrg } = useMyOrganizer();
  const allowedCatalogIds = ((myOrg as any)?.ritmos_seleccionados || []) as string[];
  const { data: orgLocations = [] } = useOrganizerLocations((myOrg as any)?.id);
  const { showToast } = useToast();

  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  
  const [form, setForm] = useState({
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
    zona: null as number | null,
    estilos: [] as number[],
    ritmos_seleccionados: [] as string[],
    zonas: [] as number[],
    cronograma: [] as any[],
    costos: [] as any[],
    flyer_url: null as string | null,
    estado_publicacion: 'borrador' as 'borrador' | 'publicado',
    ubicaciones: [] as any[],
    repetir_semanal: false,
    dia_semana: null as number | null // 0=Domingo, 1=Lunes, ..., 6=Sábado
  });
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  const toggleZona = (zonaId: number) => {
    const currentZonas = form.zonas || [];
    const newZonas = currentZonas.includes(zonaId)
      ? currentZonas.filter((id: number) => id !== zonaId)
      : [...currentZonas, zonaId];
    setForm({ ...form, zonas: newZonas });
  };

  const applyOrganizerLocation = (loc?: OrganizerLocation | null) => {
    if (!loc) {
      setSelectedLocationId('');
      setForm((prev) => ({
        ...prev,
        ubicaciones: [],
        zonas: [], // Limpiar zonas cuando se limpia la ubicación
        zona: null,
      }));
      return;
    }
    setSelectedLocationId(loc.id ? String(loc.id) : '');
    const mapped = toFormLocation(loc);
    
    // Extraer zonas de la ubicación del organizador
    const zonasFromOrgLoc: number[] = [];
    if (typeof loc.zona_id === 'number') {
      zonasFromOrgLoc.push(loc.zona_id);
    }
    if (Array.isArray(loc.zona_ids)) {
      loc.zona_ids.forEach((z) => {
        if (typeof z === 'number' && !zonasFromOrgLoc.includes(z)) {
          zonasFromOrgLoc.push(z);
        }
      });
    }
    
    setForm((prev) => ({
      ...prev,
      lugar: loc.nombre || '',
      direccion: loc.direccion || '',
      ciudad: loc.ciudad || '',
      referencias: loc.referencias || '',
      zona: typeof loc.zona_id === 'number' ? loc.zona_id : (Array.isArray(loc.zona_ids) && loc.zona_ids.length ? loc.zona_ids[0] ?? null : null),
      zonas: zonasFromOrgLoc, // Siempre usar las zonas de la ubicación seleccionada
      ubicaciones: mapped ? [mapped] : prev.ubicaciones,
    }));
  };

  const clearLocationSelection = () => {
    setSelectedLocationId('');
    setForm((prev) => ({
      ...prev,
      ubicaciones: [],
      lugar: '',
      direccion: '',
      ciudad: '',
      referencias: '',
      zonas: [], // Limpiar zonas cuando se limpia la ubicación
      zona: null,
    }));
  };

  const updateManualLocationField = (field: 'lugar' | 'direccion' | 'ciudad' | 'referencias', value: string) => {
    setSelectedLocationId('');
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      const base = {
        sede: field === 'lugar' ? value : updated.lugar || '',
        direccion: field === 'direccion' ? value : updated.direccion || '',
        ciudad: field === 'ciudad' ? value : updated.ciudad || '',
        referencias: field === 'referencias' ? value : updated.referencias || '',
        zona_id: updated.zona ?? null,
      };
      return {
        ...updated,
        ubicaciones: updated.ubicaciones && updated.ubicaciones.length
          ? [{ ...updated.ubicaciones[0], ...base }]
          : [base],
      };
    });
  };

  useEffect(() => {
    if (!orgLocations.length) {
      if (selectedLocationId) setSelectedLocationId('');
      return;
    }
    const match = orgLocations.find(
      (loc) =>
        (loc.nombre || '') === (form.lugar || '') &&
        (loc.direccion || '') === (form.direccion || '') &&
        (loc.ciudad || '') === (form.ciudad || '') &&
        (loc.referencias || '') === (form.referencias || '')
    );
    if (match) {
      if (selectedLocationId !== String(match.id)) {
        setSelectedLocationId(String(match.id));
      }
    } else if (selectedLocationId) {
      setSelectedLocationId('');
    }
  }, [orgLocations, form.lugar, form.direccion, form.ciudad, form.referencias, selectedLocationId]);

  // Actualizar día de la semana cuando cambia la fecha y está en modo repetición
  useEffect(() => {
    if (form.repetir_semanal && form.fecha) {
      try {
        const [year, month, day] = form.fecha.split('-').map(Number);
        const fechaObj = new Date(year, month - 1, day);
        const diaSemana = fechaObj.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
        if (form.dia_semana !== diaSemana) {
          setForm(prev => ({ ...prev, dia_semana: diaSemana }));
        }
      } catch (e) {
        console.error('Error calculando día de la semana:', e);
      }
    } else if (!form.repetir_semanal) {
      // Si se desactiva la repetición, limpiar el día de la semana
      if (form.dia_semana !== null) {
        setForm(prev => ({ ...prev, dia_semana: null }));
      }
    }
  }, [form.fecha, form.repetir_semanal]);

  useEffect(() => {
    if (date) {
      console.log('📥 [OrganizerEventDateEditScreen] Cargando fecha:', date);
      const fechaStr = date.fecha || '';
      let diaSemanaCalculado: number | null = null;
      if (fechaStr) {
        try {
          const [year, month, day] = fechaStr.split('-').map(Number);
          const fechaObj = new Date(year, month - 1, day);
          diaSemanaCalculado = fechaObj.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
        } catch (e) {
          console.error('Error calculando día de la semana:', e);
        }
      }
      
      setForm({
        nombre: date.nombre || '',
        biografia: (date as any).biografia || '',
        fecha: fechaStr,
        hora_inicio: date.hora_inicio || '',
        hora_fin: date.hora_fin || '',
        lugar: (date as any).lugar || '',
        ciudad: (date as any).ciudad || '',
        direccion: (date as any).direccion || '',
        referencias: (date as any).referencias || '',
        requisitos: (date as any).requisitos || '',
        zona: (date as any).zona || null,
        estilos: (date as any).estilos || [],
        ritmos_seleccionados: ((date as any).ritmos_seleccionados || []) as string[],
        zonas: (date as any).zonas || [],
        cronograma: (date as any).cronograma || [],
        costos: (date as any).costos || [],
        flyer_url: (date as any).flyer_url || null,
        estado_publicacion: (date as any).estado_publicacion || 'borrador',
        ubicaciones: (date as any).ubicaciones || [],
        repetir_semanal: (date as any).repetir_semanal || (date as any).dia_semana !== null && (date as any).dia_semana !== undefined,
        dia_semana: (date as any).dia_semana !== null && (date as any).dia_semana !== undefined ? (date as any).dia_semana : diaSemanaCalculado
      });
    }
  }, [date]);

  const handleSave = async () => {
    if (!dateIdNum) return;
    
    try {
      console.log('💾 [OrganizerEventDateEditScreen] Guardando fecha...');
      
      // Calcular la fecha a guardar: si tiene dia_semana y repetir_semanal está activado, usar la próxima fecha
      let fechaAGuardar = form.fecha;
      let diaSemanaAGuardar: number | null = null;
      
      if (form.repetir_semanal && form.dia_semana !== null && form.dia_semana !== undefined) {
        diaSemanaAGuardar = form.dia_semana;
        try {
          const horaInicioStr = form.hora_inicio || '20:00';
          const proximaFecha = calculateNextDateWithTime(form.dia_semana, horaInicioStr);
          const year = proximaFecha.getFullYear();
          const month = String(proximaFecha.getMonth() + 1).padStart(2, '0');
          const day = String(proximaFecha.getDate()).padStart(2, '0');
          fechaAGuardar = `${year}-${month}-${day}`;
          console.log('📅 [OrganizerEventDateEditScreen] Fecha actualizada a próxima ocurrencia:', fechaAGuardar);
        } catch (e) {
          console.error('❌ [OrganizerEventDateEditScreen] Error calculando próxima fecha:', e);
          // Si falla el cálculo, usar la fecha original
        }
      }
      
      // Payload con TODAS las columnas (ahora existen en events_date)
      const patch = {
        nombre: form.nombre || null,
        biografia: form.biografia || null,
        fecha: fechaAGuardar,
        hora_inicio: form.hora_inicio || null,
        hora_fin: form.hora_fin || null,
        lugar: form.lugar || null,
        direccion: form.direccion || null,
        ciudad: form.ciudad || null,
        zona: form.zona || null,
        referencias: form.referencias || null,
        requisitos: form.requisitos || null,
        ritmos_seleccionados: form.ritmos_seleccionados || [],
        estilos: form.estilos || [],
        zonas: form.zonas || [],
        cronograma: form.cronograma || [],
        costos: form.costos || [],
        flyer_url: form.flyer_url || null,
        estado_publicacion: form.estado_publicacion || 'borrador',
        ubicaciones: form.ubicaciones || [],
        dia_semana: diaSemanaAGuardar
      } as any;

      console.log('📦 [OrganizerEventDateEditScreen] Patch:', patch);
      
      const updated = await updateDate.mutateAsync({ id: dateIdNum, patch });
      
      console.log('✅ [OrganizerEventDateEditScreen] Fecha actualizada:', updated);
      setStatusMsg({ type: 'ok', text: '✅ Fecha actualizada exitosamente' });
      
      // Navegar después de un breve delay para mostrar el mensaje
      setTimeout(() => {
        navigate(`/social/fecha/${updated.id}`);
      }, 1500);
    } catch (error: any) {
      console.error('❌ [OrganizerEventDateEditScreen] Error guardando:', error);
      setStatusMsg({ 
        type: 'err', 
        text: `❌ Error al guardar: ${error.message || 'Intenta nuevamente'}` 
      });
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p>Cargando fecha...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (!date) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Fecha no encontrada</h2>
          <button
            onClick={() => navigate('/profile/organizer/edit')}
            style={{
              padding: '14px 28px',
              borderRadius: '50px',
              border: 'none',
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light,
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(30,136,229,0.5)',
            }}
          >
            ← Volver al Organizador
          </button>
        </div>
      </div>
    );
  }

  // ====== UI con la estructura/diseño solicitados ======
  return (
    <>
      <style>{`
        .org-editor-card {
          margin-bottom: 2rem;
          padding: 1.2rem;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
        }
        
        .org-editor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
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
        
        input[type="date"].org-editor-input,
        input[type="time"].org-editor-input {
          cursor: pointer;
        }
        
        input[type="date"].org-editor-input::-webkit-calendar-picker-indicator,
        input[type="time"].org-editor-input::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.7;
          cursor: pointer;
        }
        
        input[type="date"].org-editor-input::-webkit-calendar-picker-indicator:hover,
        input[type="time"].org-editor-input::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
        
        @media (max-width: 768px) {
          .org-editor-card {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 12px !important;
          }
          
          .org-editor-grid {
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
        }
        
        @media (max-width: 480px) {
          .org-editor-card {
            padding: 0.75rem !important;
            margin-bottom: 1rem !important;
            border-radius: 10px !important;
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
          
          .org-date-form-select {
            padding: 8px 10px !important;
            padding-right: 32px !important;
            font-size: 12px !important;
          }
          
          .org-date-form-select-arrow {
            right: 10px !important;
            font-size: 0.75rem !important;
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
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark} 0%, #1a1a1a 50%, ${colors.dark} 100%)`,
        padding: '24px 0',
        color: colors.light,
        position: 'relative',
      }}>
        {/* Efecto de fondo decorativo */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 50%, rgba(30, 136, 229, 0.05) 0%, transparent 50%),
                       radial-gradient(circle at 80% 80%, rgba(255, 61, 87, 0.05) 0%, transparent 50%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* Header con título */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <motion.button
              whileHover={{ scale: 1.05, x: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              ← Volver
            </motion.button>
          </div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '800',
            background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em',
          }}>
            📅 Editar Fecha de Evento
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
          }}>
            Modifica la información de esta fecha del evento
          </p>
        </motion.div>

        {/* Mensaje de estado */}
        {statusMsg && (
          <motion.div
          
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginBottom: '1.5rem',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              border: statusMsg.type === 'ok' 
                ? '2px solid rgba(16,185,129,0.4)' 
                : '2px solid rgba(239,68,68,0.4)',
              background: statusMsg.type === 'ok' 
                ? 'rgba(16,185,129,0.15)' 
                : 'rgba(239,68,68,0.15)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              textAlign: 'center',
              boxShadow: statusMsg.type === 'ok' 
                ? '0 4px 12px rgba(16,185,129,0.2)' 
                : '0 4px 12px rgba(239,68,68,0.2)'
            }}
          >
            {statusMsg.text}
          </motion.div>
        )}

        <div style={{
          marginBottom: '2rem',
          padding: 0,
          borderRadius: '16px',
          background: 'transparent',
          border: 'none',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>

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
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre del evento"
                  className="org-editor-input"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="org-editor-field">
                  Biografía
                </label>
                <textarea
                  value={form.biografia}
                  onChange={(e) => setForm({ ...form, biografia: e.target.value })}
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
                selected={form.ritmos_seleccionados || []}
                allowedIds={allowedCatalogIds}
                onChange={(ids) => {
                  setForm({ ...form, ritmos_seleccionados: ids });
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
                    setForm(prev => ({ ...prev, estilos: mappedTagIds }));
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
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
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
                  value={form.hora_inicio}
                  onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
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
                  value={form.hora_fin}
                  onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                  className="org-editor-input"
                  style={{ color: '#FFFFFF' }}
                />
              </div>
            </div>

            {/* Repetición Semanal */}
            <div className="org-date-form-repetition" style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <label className="org-date-form-checkbox" style={{ marginBottom: form.repetir_semanal ? '16px' : '0' }}>
                <input
                  type="checkbox"
                  checked={form.repetir_semanal || false}
                  onChange={(e) => {
                    const nuevoEstado = e.target.checked;
                    if (nuevoEstado && form.fecha) {
                      // Calcular el día de la semana basado en la fecha seleccionada
                      try {
                        const [year, month, day] = form.fecha.split('-').map(Number);
                        const fechaObj = new Date(year, month - 1, day);
                        const diaSemana = fechaObj.getDay();
                        setForm({ ...form, repetir_semanal: nuevoEstado, dia_semana: diaSemana });
                      } catch (err) {
                        setForm({ ...form, repetir_semanal: nuevoEstado });
                      }
                    } else {
                      setForm({ ...form, repetir_semanal: nuevoEstado, dia_semana: null });
                    }
                  }}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '1rem', fontWeight: '600', color: '#FFFFFF' }}>
                  🔁 Repetir semanalmente (fecha fija)
                </span>
              </label>

              {form.repetir_semanal && form.dia_semana !== null && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#FFFFFF', marginBottom: '8px' }}>
                    Día de la semana: <strong>{['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][form.dia_semana]}</strong>
                  </p>
                  <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '4px', color: '#FFFFFF' }}>
                    Esta fecha se repetirá cada {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][form.dia_semana]} a las {form.hora_inicio || 'la hora especificada'}. 
                    El calendario calculará automáticamente la próxima ocurrencia.
                  </p>
                  {!form.fecha && (
                    <p style={{ fontSize: '0.85rem', color: '#FFD166', marginTop: '8px', fontWeight: '600' }}>
                      ⚠️ Selecciona una fecha para establecer el día de la semana
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Ubicación */}
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
                      value={selectedLocationId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        if (!nextId) {
                          clearLocationSelection();
                          return;
                        }
                        const found = orgLocations.find((loc) => String(loc.id ?? '') === nextId);
                        applyOrganizerLocation(found);
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
            {/* Formulario de ubicación manual */}
            <div className="org-date-form-grid-2">
              <div>
                <label className="org-editor-field">Nombre de la ubicación</label>
                <input
                  type="text"
                  value={form.lugar || ''}
                  onChange={(e) => updateManualLocationField('lugar', e.target.value)}
                  placeholder="Ej: Sede Central / Salón Principal"
                  className="org-editor-input"
                />
              </div>
              <div>
                <label className="org-editor-field">Dirección</label>
                <input
                  type="text"
                  value={form.direccion || ''}
                  onChange={(e) => updateManualLocationField('direccion', e.target.value)}
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
                  value={form.ciudad || ''}
                  onChange={(e) => updateManualLocationField('ciudad', e.target.value)}
                  placeholder="Ciudad"
                  className="org-editor-input"
                />
              </div>
              <div>
                <label className="org-editor-field">Notas o referencias</label>
                <input
                  type="text"
                  value={form.referencias || ''}
                  onChange={(e) => updateManualLocationField('referencias', e.target.value)}
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
              schedule={form.cronograma || []}
              onChangeSchedule={(cronograma) => setForm({ ...form, cronograma })}
              costos={form.costos || []}
              onChangeCostos={(costos) => setForm({ ...form, costos })}
              ritmos={ritmoTags}
              zonas={zonaTags}
              eventFecha={form.fecha || ''}
              onSaveCosto={() => {
                showToast('💰 Costo guardado en el formulario. Recuerda hacer click en "💾 Guardar Cambios" para guardar la fecha completa.', 'info');
              }}
            />
          </div>

          {/* Flyer */}
          <div className="org-editor-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
              🖼️ Flyer del Evento
            </h3>
            <DateFlyerUploader
              value={form.flyer_url || null}
              onChange={(url) => setForm({ ...form, flyer_url: url })}
              dateId={dateIdNum}
              parentId={(date as any).parent_id}
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
                  checked={form.estado_publicacion === 'borrador'}
                  onChange={(e) => setForm({ ...form, estado_publicacion: e.target.value as 'borrador' | 'publicado' })}
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
                  checked={form.estado_publicacion === 'publicado'}
                  onChange={(e) => setForm({ ...form, estado_publicacion: e.target.value as 'borrador' | 'publicado' })}
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
              onClick={() => navigate(-1)}
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
              onClick={handleSave}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(30, 136, 229, 0.3)',
                opacity: 1
              }}
            >
              💾 Guardar Cambios
            </motion.button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
