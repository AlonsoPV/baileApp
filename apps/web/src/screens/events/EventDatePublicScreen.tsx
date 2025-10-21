import React from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useMyRSVP } from "../../hooks/useEvents";
import { fmtDate, fmtTime } from "../../utils/format";
import { useToast } from "../../components/Toast";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  green: '#10B981',
  dark: '#121212',
  light: '#F5F5F5',
};

export function EventDatePublicScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rsvp = useMyRSVP();
  const { showToast } = useToast();

  const q = useQuery({
    queryKey: ["date", "public", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events_date")
        .select("*")
        .eq("id", Number(id))
        .maybeSingle();
      if (error) throw error; 
      return data;
    }
  });

  const d = q.data;
  const isLoading = q.isLoading;

  const handleRSVP = async (status: 'voy' | 'interesado' | 'no_voy') => {
    if (!d) return;
    
    try {
      await rsvp.set(d.id, status);
      showToast(`RSVP actualizado: ${status}`, 'success');
    } catch (err: any) {
      showToast('Error al actualizar RSVP', 'error');
    }
  };

  if (isLoading) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
        <p>Cargando evento...</p>
      </div>
    );
  }

  if (!d) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>❌</div>
        <p>Evento no encontrado</p>
      </div>
    );
  }

  const isPast = new Date(d.fecha) < new Date();
  const canRSVP = d.estado_publicacion === 'publicado' && !isPast;

  return (
    <div style={{
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto',
      color: colors.light,
      minHeight: '100vh',
      background: colors.dark,
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: `2px solid ${colors.light}33`,
            background: 'transparent',
            color: colors.light,
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          ← Volver
        </motion.button>

        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '800', 
          marginBottom: '8px',
          lineHeight: 1.2,
        }}>
          {fmtDate(d.fecha)}
        </h1>

        <div style={{ 
          fontSize: '1.25rem', 
          opacity: 0.8, 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>🕐</span>
          {fmtTime(d.hora_inicio)} - {fmtTime(d.hora_fin)}
        </div>

        {/* Ubicación */}
        {(d.lugar || d.ciudad) && (
          <div style={{
            fontSize: '1.125rem',
            opacity: 0.7,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>📍</span>
            {d.lugar && d.ciudad 
              ? `${d.lugar}, ${d.ciudad}`
              : d.lugar || d.ciudad
            }
          </div>
        )}

        {/* Dirección */}
        {d.direccion && (
          <div style={{
            fontSize: '1rem',
            opacity: 0.6,
            marginBottom: '16px',
          }}>
            📍 {d.direccion}
          </div>
        )}

        {/* Estado */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          {isPast && (
            <span style={{
              padding: '6px 12px',
              borderRadius: '16px',
              background: `${colors.dark}cc`,
              border: `1px solid ${colors.light}33`,
              color: `${colors.light}88`,
              fontSize: '0.875rem',
              fontWeight: '600',
            }}>
              📅 Evento pasado
            </span>
          )}

          {d.estado_publicacion === 'borrador' && (
            <span style={{
              padding: '6px 12px',
              borderRadius: '16px',
              background: `${colors.orange}cc`,
              border: `2px solid ${colors.orange}`,
              color: colors.light,
              fontSize: '0.875rem',
              fontWeight: '600',
            }}>
              📝 Borrador
            </span>
          )}

          {d.estado_publicacion === 'publicado' && !isPast && (
            <span style={{
              padding: '6px 12px',
              borderRadius: '16px',
              background: `${colors.green}cc`,
              border: `2px solid ${colors.green}`,
              color: colors.light,
              fontSize: '0.875rem',
              fontWeight: '600',
            }}>
              ✅ Publicado
            </span>
          )}
        </div>
      </div>

      {/* RSVP Section */}
      {canRSVP && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '24px',
            background: `${colors.dark}ee`,
            borderRadius: '16px',
            border: `1px solid ${colors.light}22`,
            marginBottom: '32px',
          }}
        >
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            marginBottom: '16px',
          }}>
            ¿Vas a asistir?
          </h2>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleRSVP('voy')}
              style={{
                padding: '12px 24px',
                borderRadius: '50px',
                border: 'none',
                background: `linear-gradient(135deg, ${colors.green}, ${colors.blue})`,
                color: colors.light,
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${colors.green}66`,
              }}
            >
              ✅ Voy
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleRSVP('interesado')}
              style={{
                padding: '12px 24px',
                borderRadius: '50px',
                border: 'none',
                background: `linear-gradient(135deg, ${colors.orange}, ${colors.yellow})`,
                color: colors.dark,
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${colors.orange}66`,
              }}
            >
              🤔 Interesado
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleRSVP('no_voy')}
              style={{
                padding: '12px 24px',
                borderRadius: '50px',
                border: 'none',
                background: `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`,
                color: colors.light,
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${colors.coral}66`,
              }}
            >
              ❌ No voy
            </motion.button>
          </div>
        </motion.section>
      )}

      {/* Requisitos */}
      {d.requisitos && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            padding: '24px',
            background: `${colors.dark}ee`,
            borderRadius: '16px',
            border: `1px solid ${colors.light}22`,
            marginBottom: '32px',
          }}
        >
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            marginBottom: '16px',
          }}>
            📋 Requisitos
          </h2>
          <p style={{ 
            opacity: 0.9, 
            lineHeight: 1.6,
            whiteSpace: 'pre-line',
            fontSize: '1rem',
          }}>
            {d.requisitos}
          </p>
        </motion.section>
      )}

      {/* Info adicional */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          padding: '24px',
          background: `${colors.dark}aa`,
          borderRadius: '16px',
          border: `1px solid ${colors.light}22`,
        }}
      >
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          marginBottom: '12px',
        }}>
          ℹ️ Información adicional
        </h3>
        <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
          <p style={{ marginBottom: '8px' }}>
            📅 Fecha: {fmtDate(d.fecha)}
          </p>
          {d.hora_inicio && (
            <p style={{ marginBottom: '8px' }}>
              🕐 Horario: {fmtTime(d.hora_inicio)} - {fmtTime(d.hora_fin)}
            </p>
          )}
          <p style={{ marginBottom: '8px' }}>
            📊 Estado: {d.estado_publicacion}
          </p>
          <p>
            📝 Creado: {new Date(d.created_at).toLocaleDateString('es-MX')}
          </p>
        </div>
      </motion.section>
    </div>
  );
}