import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useDatesByParent, useCreateDate, useUpdateDate } from "../../hooks/useEvents";
import { useTags } from "../../hooks/useTags";
import { useToast } from "../../components/Toast";
import { fmtDate } from "../../utils/format";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export const EventDateEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id, parentId } = useParams<{ id: string; parentId: string }>();
  const isEditing = !!id;
  
  const { data: organizer } = useMyOrganizer();
  const { data: dates } = useDatesByParent(parentId ? parseInt(parentId) : undefined);
  const createMutation = useCreateDate();
  const updateMutation = useUpdateDate();
  const { zonas, ritmos } = useTags('zona');
  const { showToast } = useToast();

  const currentDate = isEditing ? dates?.find(d => d.id === parseInt(id!)) : null;

  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [lugar, setLugar] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [zonaSeleccionada, setZonaSeleccionada] = useState<number | null>(null);
  const [estilosSeleccionados, setEstilosSeleccionados] = useState<number[]>([]);
  const [requisitos, setRequisitos] = useState('');
  const [estadoPublicacion, setEstadoPublicacion] = useState<'borrador' | 'publicado'>('borrador');

  useEffect(() => {
    if (currentDate) {
      setFecha(currentDate.fecha);
      setHoraInicio(currentDate.hora_inicio || '');
      setHoraFin(currentDate.hora_fin || '');
      setLugar(currentDate.lugar || '');
      setDireccion(currentDate.direccion || '');
      setCiudad(currentDate.ciudad || '');
      setZonaSeleccionada(currentDate.zona || null);
      setEstilosSeleccionados(currentDate.estilos || []);
      setRequisitos(currentDate.requisitos || '');
      setEstadoPublicacion(currentDate.estado_publicacion);
    }
  }, [currentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fecha) {
      showToast('La fecha es obligatoria', 'error');
      return;
    }

    if (!parentId) {
      showToast('ID de evento padre requerido', 'error');
      return;
    }

    try {
      const payload = {
        fecha,
        hora_inicio: horaInicio || null,
        hora_fin: horaFin || null,
        lugar: lugar.trim() || null,
        direccion: direccion.trim() || null,
        ciudad: ciudad.trim() || null,
        zona: zonaSeleccionada,
        estilos: estilosSeleccionados,
        requisitos: requisitos.trim() || null,
        estado_publicacion: estadoPublicacion,
        parent_id: parseInt(parentId),
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: parseInt(id!), patch: payload });
        showToast('Fecha actualizada ✅', 'success');
      } else {
        await createMutation.mutateAsync(payload);
        showToast('Fecha creada ✅', 'success');
      }

      navigate('/profile/organizer/edit');
    } catch (err: any) {
      showToast('Error al guardar fecha', 'error');
    }
  };

  const toggleEstilo = (estiloId: number) => {
    setEstilosSeleccionados(prev => 
      prev.includes(estiloId)
        ? prev.filter(id => id !== estiloId)
        : [...prev, estiloId]
    );
  };

  const getEstadoBadge = () => {
    if (!currentDate) return null;
    
    const badges: Record<string, { bg: string; text: string; icon: string }> = {
      borrador: { bg: '#94A3B8', text: 'Borrador', icon: '📝' },
      publicado: { bg: '#10B981', text: 'Publicado', icon: '✅' },
    };

    const badge = badges[currentDate.estado_publicacion] || badges.borrador;

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
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

  return (
    <div style={{
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto',
      color: colors.light,
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>
          {isEditing ? '📅 Editar Fecha' : '📅 Nueva Fecha'}
        </h1>
        {getEstadoBadge()}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Fecha y Horarios */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Fecha *
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: colors.light,
                fontSize: '1rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Hora Inicio
            </label>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: colors.light,
                fontSize: '1rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Hora Fin
            </label>
            <input
              type="time"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: colors.light,
                fontSize: '1rem',
              }}
            />
          </div>
        </div>

        {/* Ubicación */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Lugar
            </label>
            <input
              type="text"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              placeholder="Ej: Salón Principal"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: colors.light,
                fontSize: '1rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Ciudad
            </label>
            <input
              type="text"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Ej: Ciudad de México"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: colors.light,
                fontSize: '1rem',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Dirección
          </label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Dirección completa"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: `${colors.dark}cc`,
              border: `1px solid ${colors.light}33`,
              color: colors.light,
              fontSize: '1rem',
            }}
          />
        </div>

        {/* Zona */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>
            Zona
          </label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            {zonas?.map((zona) => (
              <motion.button
                key={zona.id}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setZonaSeleccionada(zona.id === zonaSeleccionada ? null : zona.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: zonaSeleccionada === zona.id
                    ? `linear-gradient(135deg, ${colors.yellow}, ${colors.orange})`
                    : `${colors.dark}cc`,
                  border: `2px solid ${zonaSeleccionada === zona.id ? colors.yellow : `${colors.light}33`}`,
                  color: zonaSeleccionada === zona.id ? colors.dark : colors.light,
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                📍 {zona.nombre}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Estilos */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>
            Estilos de Baile
          </label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            {ritmos?.map((ritmo) => (
              <motion.button
                key={ritmo.id}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleEstilo(ritmo.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: estilosSeleccionados.includes(ritmo.id)
                    ? `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`
                    : `${colors.dark}cc`,
                  border: `2px solid ${estilosSeleccionados.includes(ritmo.id) ? colors.coral : `${colors.light}33`}`,
                  color: colors.light,
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                🎵 {ritmo.nombre}
              </motion.button>
            ))}
          </div>
          <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: '8px' }}>
            Seleccionados: {estilosSeleccionados.length}
          </p>
        </div>

        {/* Requisitos */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Requisitos
          </label>
          <textarea
            value={requisitos}
            onChange={(e) => setRequisitos(e.target.value)}
            rows={3}
            placeholder="Requisitos para participar..."
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: `${colors.dark}cc`,
              border: `1px solid ${colors.light}33`,
              color: colors.light,
              fontSize: '1rem',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Estado de Publicación */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>
            Estado de Publicación
          </label>
          <div style={{
            display: 'flex',
            gap: '12px',
          }}>
            {(['borrador', 'publicado'] as const).map((estado) => (
              <motion.button
                key={estado}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setEstadoPublicacion(estado)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '50px',
                  background: estadoPublicacion === estado
                    ? `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`
                    : `${colors.dark}cc`,
                  border: `2px solid ${estadoPublicacion === estado ? colors.blue : `${colors.light}33`}`,
                  color: colors.light,
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {estado === 'borrador' ? '📝' : '✅'} {estado.charAt(0).toUpperCase() + estado.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={createMutation.isPending || updateMutation.isPending}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '16px',
              borderRadius: '50px',
              border: 'none',
              background: (createMutation.isPending || updateMutation.isPending)
                ? `${colors.light}33` 
                : `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light,
              fontSize: '1rem',
              fontWeight: '700',
              cursor: (createMutation.isPending || updateMutation.isPending) ? 'not-allowed' : 'pointer',
              boxShadow: `0 8px 24px ${colors.blue}66`,
            }}
          >
            {(createMutation.isPending || updateMutation.isPending) 
              ? 'Guardando...' 
              : (isEditing ? '💾 Actualizar Fecha' : '✨ Crear Fecha')
            }
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/profile/organizer/edit')}
            style={{
              padding: '16px 24px',
              borderRadius: '50px',
              border: `2px solid ${colors.light}33`,
              background: 'transparent',
              color: colors.light,
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            ← Volver
          </motion.button>
        </div>
      </form>
    </div>
  );
};