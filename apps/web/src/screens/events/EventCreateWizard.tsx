import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMyOrganizer, useUpsertMyOrganizer } from "../../hooks/useOrganizer";
import { useCreateParent, useCreateDate } from "../../hooks/useEvents";
import { useTags } from "../../hooks/useTags";
import { useAuth } from "../../hooks/useAuth";
import EventScheduleEditor from "../../components/EventScheduleEditor";
import EventPriceEditor from "../../components/EventPriceEditor";
import AddToCalendarButton from "../../components/AddToCalendarButton";
import { useToast } from "../../components/Toast";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

type Step = 1 | 2 | 3 | 4;

export function EventCreateWizard() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { data: organizer } = useMyOrganizer();
  const upsertOrg = useUpsertMyOrganizer();
  const createParent = useCreateParent();
  const createDate = useCreateDate();
  const { data: allTags } = useTags();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Estado del evento padre
  const [parentId, setParentId] = useState<number | null>(null);
  const [parent, setParent] = useState({
    nombre: "",
    descripcion: "",
    sede_general: "",
    estilos: [] as number[],
  });

  // Estado de la fecha/edición
  const [eventDateId, setEventDateId] = useState<number | null>(null);
  const [dateForm, setDateForm] = useState({
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
    lugar: "",
    ciudad: "",
    direccion: "",
    requisitos: "",
    estado_publicacion: false,
  });

  const ritmos = allTags?.filter(t => t.tipo === 'ritmo') || [];

  // Asegura organizador mínimo si no existe - SOLO UNA VEZ
  useEffect(() => {
    let isMounted = true;
    
    const createOrganizer = async () => {
      // Solo crear si no hay organizador y no está en proceso
      if (user?.id && !organizer?.id && !upsertOrg.isPending && isMounted) {
        try {
          console.log('[EventCreateWizard] Creating minimal organizer');
          await upsertOrg.mutateAsync({ nombre_publico: "Mi Social" });
          if (isMounted) {
            showToast('Perfil de organizador creado', 'success');
          }
        } catch (err: any) {
          console.error('[EventCreateWizard] Error creating organizer:', err);
          if (isMounted) {
            showToast('Error al crear organizador', 'error');
          }
        }
      }
    };

    // Solo ejecutar si tenemos usuario pero no organizador
    if (user?.id && !organizer?.id) {
      createOrganizer();
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Solo depende del ID del usuario

  function toggleEstilo(id: number) {
    setParent(p => {
      const exists = p.estilos.includes(id);
      return { ...p, estilos: exists ? p.estilos.filter(i => i !== id) : [...p.estilos, id] };
    });
  }

  async function handleCreateParent() {
    if (!organizer?.id) {
      showToast('Esperando organizador...', 'error');
      return;
    }
    if (!parent.nombre.trim()) {
      showToast('El nombre del evento es obligatorio', 'error');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[EventCreateWizard] Creating parent:', parent);
      const p = await createParent.mutateAsync({
        organizer_id: organizer.id,
        nombre: parent.nombre.trim(),
        descripcion: parent.descripcion.trim() || null,
        sede_general: parent.sede_general.trim() || null,
        estilos: parent.estilos,
      });
      console.log('[EventCreateWizard] Parent created:', p);
      setParentId(p.id);
      showToast('Evento creado ✅', 'success');
      setStep(2);
    } catch (err: any) {
      console.error('[EventCreateWizard] Error creating parent:', err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateDate() {
    if (!parentId) {
      showToast('Falta evento padre', 'error');
      return;
    }
    if (!dateForm.fecha) {
      showToast('La fecha es obligatoria', 'error');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[EventCreateWizard] Creating date:', dateForm);
      const d = await createDate.mutateAsync({
        parent_id: parentId,
        fecha: dateForm.fecha,
        hora_inicio: dateForm.hora_inicio || null,
        hora_fin: dateForm.hora_fin || null,
        lugar: dateForm.lugar || null,
        ciudad: dateForm.ciudad || null,
        direccion: dateForm.direccion || null,
        requisitos: dateForm.requisitos || null,
        estado_publicacion: dateForm.estado_publicacion ? "publicado" : "borrador",
      });
      console.log('[EventCreateWizard] Date created:', d);
      setEventDateId(d.id);
      showToast('Fecha creada ✅', 'success');
      setStep(3);
    } catch (err: any) {
      console.error('[EventCreateWizard] Error creating date:', err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  function finish() {
    if (!parentId) return;
    showToast('¡Evento completado! 🎉', 'success');
    if (eventDateId) nav(`/events/date/${eventDateId}`);
    else nav(`/events/parent/${parentId}/dates`);
  }

  function handleCancel() {
    setShowCancelDialog(true);
  }

  function confirmCancel() {
    // Limpiar estados si es necesario
    setParent({ nombre: "", descripcion: "", sede_general: "", estilos: [] });
    setDateForm({
      fecha: "",
      hora_inicio: "",
      hora_fin: "",
      lugar: "",
      ciudad: "",
      direccion: "",
      requisitos: "",
      estado_publicacion: false,
    });
    setParentId(null);
    setEventDateId(null);
    setStep(1);
    
    // Volver al perfil de organizador
    nav('/profile/organizer/edit');
  }

  function dismissCancel() {
    setShowCancelDialog(false);
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '24px',
      color: colors.light,
      minHeight: '100vh',
    }}>
      {/* Header con botón de cancelar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
            Crear nuevo evento
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
            Completa los pasos para publicar tu edición.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCancel}
          style={{
            padding: '12px 24px',
            borderRadius: '25px',
            border: `1px solid ${colors.light}33`,
            background: 'transparent',
            color: colors.light,
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>❌</span>
          Cancelar
        </motion.button>
      </div>

      {/* Indicador de pasos */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} style={{
            height: '8px',
            width: '64px',
            borderRadius: '4px',
            background: step >= n ? colors.coral : 'rgba(255,255,255,0.1)',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>

      {/* PASO 1: Información del evento */}
      {step === 1 && (
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px' }}>
            Información del evento
          </h2>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: '600' }}>
              Nombre del evento *
            </label>
            <input
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: colors.light,
                fontSize: '1rem',
              }}
              placeholder="Ej: Social Copacabana"
              value={parent.nombre}
              onChange={e => setParent({ ...parent, nombre: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: '600' }}>
              Descripción
            </label>
            <textarea
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: colors.light,
                fontSize: '1rem',
                resize: 'vertical',
                minHeight: '100px',
              }}
              placeholder="Descripción del evento"
              value={parent.descripcion}
              onChange={e => setParent({ ...parent, descripcion: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: '600' }}>
              Sede general
            </label>
            <input
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: colors.light,
                fontSize: '1rem',
              }}
              placeholder="Ej: Salón Principal"
              value={parent.sede_general}
              onChange={e => setParent({ ...parent, sede_general: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '12px', fontWeight: '600' }}>
              Estilos de baile
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {ritmos.map(r => (
                <motion.button
                  key={r.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleEstilo(r.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: `2px solid ${parent.estilos.includes(r.id) ? colors.coral : 'rgba(255,255,255,0.3)'}`,
                    background: parent.estilos.includes(r.id) ? colors.coral : 'transparent',
                    color: colors.light,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  {r.nombre}
                </motion.button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCancel}
              style={{
                padding: '12px 20px',
                borderRadius: '50px',
                border: `2px solid ${colors.coral}66`,
                background: 'transparent',
                color: colors.coral,
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              ❌ Cancelar
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateParent}
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                borderRadius: '50px',
                border: 'none',
                background: isLoading ? 'rgba(255,255,255,0.2)' : `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                color: colors.light,
                fontSize: '1rem',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: `0 8px 24px ${colors.coral}66`,
              }}
            >
              {isLoading ? 'Guardando...' : 'Guardar y continuar →'}
            </motion.button>
          </div>
        </motion.section>
      )}

      {/* PASO 2: Fecha y ubicación */}
      {step === 2 && (
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px' }}>
            Fecha y ubicación
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: '600' }}>
                Fecha *
              </label>
              <input
                type="date"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: `${colors.dark}cc`,
                  border: `1px solid ${colors.light}33`,
                  color: colors.light,
                  fontSize: '1rem',
                }}
                value={dateForm.fecha}
                onChange={e => setDateForm({ ...dateForm, fecha: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: '600' }}>
                Hora inicio
              </label>
              <input
                type="time"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: `${colors.dark}cc`,
                  border: `1px solid ${colors.light}33`,
                  color: colors.light,
                  fontSize: '1rem',
                }}
                value={dateForm.hora_inicio}
                onChange={e => setDateForm({ ...dateForm, hora_inicio: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: '600' }}>
                Hora fin
              </label>
              <input
                type="time"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: `${colors.dark}cc`,
                  border: `1px solid ${colors.light}33`,
                  color: colors.light,
                  fontSize: '1rem',
                }}
                value={dateForm.hora_fin}
                onChange={e => setDateForm({ ...dateForm, hora_fin: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: '600' }}>
                Lugar
              </label>
              <input
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: `${colors.dark}cc`,
                  border: `1px solid ${colors.light}33`,
                  color: colors.light,
                  fontSize: '1rem',
                }}
                placeholder="Ej: Salón Principal"
                value={dateForm.lugar}
                onChange={e => setDateForm({ ...dateForm, lugar: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: '600' }}>
                Ciudad
              </label>
              <input
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: `${colors.dark}cc`,
                  border: `1px solid ${colors.light}33`,
                  color: colors.light,
                  fontSize: '1rem',
                }}
                placeholder="Ej: Ciudad de México"
                value={dateForm.ciudad}
                onChange={e => setDateForm({ ...dateForm, ciudad: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: '600' }}>
                Dirección
              </label>
              <input
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: `${colors.dark}cc`,
                  border: `1px solid ${colors.light}33`,
                  color: colors.light,
                  fontSize: '1rem',
                }}
                placeholder="Dirección completa"
                value={dateForm.direccion}
                onChange={e => setDateForm({ ...dateForm, direccion: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', fontWeight: '600' }}>
              Requisitos / Dresscode
            </label>
            <textarea
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: colors.light,
                fontSize: '1rem',
                resize: 'vertical',
                minHeight: '80px',
              }}
              placeholder="Requisitos para participar..."
              value={dateForm.requisitos}
              onChange={e => setDateForm({ ...dateForm, requisitos: e.target.value })}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={dateForm.estado_publicacion}
              onChange={e => setDateForm({ ...dateForm, estado_publicacion: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.9rem' }}>Publicado (visible para todos)</span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep(1)}
              style={{
                padding: '12px 24px',
                borderRadius: '50px',
                border: `2px solid ${colors.light}33`,
                background: 'transparent',
                color: colors.light,
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              ← Atrás
            </motion.button>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
                style={{
                  padding: '12px 20px',
                  borderRadius: '50px',
                  border: `2px solid ${colors.coral}66`,
                  background: 'transparent',
                  color: colors.coral,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ❌ Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateDate}
                disabled={isLoading}
                style={{
                  padding: '12px 24px',
                  borderRadius: '50px',
                  border: 'none',
                  background: isLoading ? 'rgba(255,255,255,0.2)' : `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                  color: colors.light,
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: `0 8px 24px ${colors.coral}66`,
                }}
              >
                {isLoading ? 'Guardando...' : 'Guardar y continuar →'}
              </motion.button>
            </div>
          </div>
        </motion.section>
      )}

      {/* PASO 3: Cronograma */}
      {step === 3 && eventDateId && (
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px' }}>
            📅 Cronograma del Evento
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
            Ej: clase bachata 20:00–21:00, clase salsa 21:00–22:00, inicio de social 22:00, shows 00:00, fin 02:00.
          </p>

          <EventScheduleEditor eventDateId={eventDateId} />

          {dateForm.fecha && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <AddToCalendarButton event={{
                titulo: parent.nombre,
                descripcion: parent.descripcion,
                fecha: dateForm.fecha,
                hora_inicio: dateForm.hora_inicio,
                hora_fin: dateForm.hora_fin,
                lugar: dateForm.lugar || dateForm.ciudad
              }} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep(2)}
              style={{
                padding: '12px 24px',
                borderRadius: '50px',
                border: `2px solid ${colors.light}33`,
                background: 'transparent',
                color: colors.light,
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              ← Atrás
            </motion.button>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
                style={{
                  padding: '12px 20px',
                  borderRadius: '50px',
                  border: `2px solid ${colors.coral}66`,
                  background: 'transparent',
                  color: colors.coral,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ❌ Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep(4)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '50px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                  color: colors.light,
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: `0 8px 24px ${colors.coral}66`,
                }}
              >
                Continuar a costos →
              </motion.button>
            </div>
          </div>
        </motion.section>
      )}

      {/* PASO 4: Precios */}
      {step === 4 && eventDateId && (
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px' }}>
            💰 Costos y Promociones
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
            Ej: Preventa General $150; Promo "llegando 8–10 pm" descuento $30.
          </p>

          <EventPriceEditor eventDateId={eventDateId} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep(3)}
              style={{
                padding: '12px 24px',
                borderRadius: '50px',
                border: `2px solid ${colors.light}33`,
                background: 'transparent',
                color: colors.light,
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              ← Atrás
            </motion.button>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
                style={{
                  padding: '12px 20px',
                  borderRadius: '50px',
                  border: `2px solid ${colors.coral}66`,
                  background: 'transparent',
                  color: colors.coral,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ❌ Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={finish}
                style={{
                  padding: '12px 24px',
                  borderRadius: '50px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10B981, #34D399)',
                  color: colors.light,
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                }}
              >
                ✅ Finalizar
              </motion.button>
            </div>
          </div>
        </motion.section>
      )}

      {/* Diálogo de confirmación de cancelación */}
      {showCancelDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: colors.dark,
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              border: `1px solid ${colors.light}33`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px', color: colors.light }}>
              ¿Cancelar creación de evento?
            </h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '24px', lineHeight: '1.5' }}>
              Se perderán todos los datos ingresados hasta ahora. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={dismissCancel}
                style={{
                  padding: '12px 24px',
                  borderRadius: '25px',
                  border: `1px solid ${colors.light}33`,
                  background: 'transparent',
                  color: colors.light,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Continuar editando
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={confirmCancel}
                style={{
                  padding: '12px 24px',
                  borderRadius: '25px',
                  border: 'none',
                  background: colors.coral,
                  color: colors.light,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Sí, cancelar
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
