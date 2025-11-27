import React from 'react';
import { motion } from 'framer-motion';
import LiveLink from '../../LiveLink';
import { supabase } from '../../../lib/supabase';
import type { CompetitionGroup } from '../../../types/competitionGroup';
import { normalizeAndOptimizeUrl } from '../../../utils/imageOptimization';

interface Props {
  group: CompetitionGroup & {
    owner_name?: string;
    owner_type?: 'academy' | 'teacher';
    owner_ritmos?: number[];
    owner_ritmos_seleccionados?: string[];
    owner_cover_url?: string;
  };
}

const card: React.CSSProperties = {
  position: 'relative',
  borderRadius: '1.25rem',
  background: 'linear-gradient(135deg, rgba(40, 30, 45, 0.95), rgba(30, 20, 40, 0.95))',
  padding: '1.5rem',
  cursor: 'pointer',
  overflow: 'hidden',
  border: '1px solid rgba(240, 147, 251, 0.2)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(240, 147, 251, 0.1)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  minHeight: '280px',
  height: '350px',
  justifyContent: 'flex-end',
  display: 'flex',
  flexDirection: 'column',
  color: '#fff'
};

const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
  color: 'rgba(255,255,255,0.92)',
  border: '1px solid rgb(255 255 255 / 48%)',
  background: 'rgb(25 25 25 / 89%)',
  padding: 8,
  borderRadius: 999
};

export default function CompetitionGroupCard({ group }: Props) {
  const [ownerData, setOwnerData] = React.useState<{
    name?: string;
    type?: 'academy' | 'teacher';
    ritmos?: number[];
    ritmos_seleccionados?: string[];
    cover_url?: string;
  } | null>(null);

  // Cargar datos del dueño si no vienen en el grupo
  React.useEffect(() => {
    if (group.owner_name && group.owner_type) {
      // Ya tenemos los datos enriquecidos
      setOwnerData({
        name: group.owner_name,
        type: group.owner_type,
        ritmos: group.owner_ritmos,
        ritmos_seleccionados: group.owner_ritmos_seleccionados,
        cover_url: group.owner_cover_url,
      });
      return;
    }

    // Si no, cargar desde la base de datos
    const loadOwnerData = async () => {
      try {
        // Primero intentar obtener academia si existe academy_id
        if (group.academy_id) {
          const { data: academy } = await supabase
            .from('profiles_academy')
            .select('id, nombre_publico, portada_url, ritmos, ritmos_seleccionados')
            .eq('id', group.academy_id)
            .single();

          if (academy) {
            setOwnerData({
              name: academy.nombre_publico,
              type: 'academy',
              ritmos: academy.ritmos || [],
              ritmos_seleccionados: academy.ritmos_seleccionados || [],
              cover_url: academy.portada_url || undefined,
            });
            return;
          }
        }

        // Si no hay academia, buscar maestro por owner_id
        const { data: teacher } = await supabase
          .from('profiles_teacher')
          .select('id, nombre_publico, portada_url, ritmos, ritmos_seleccionados')
          .eq('user_id', group.owner_id)
          .single();

        if (teacher) {
          setOwnerData({
            name: teacher.nombre_publico,
            type: 'teacher',
            ritmos: teacher.ritmos || [],
            ritmos_seleccionados: teacher.ritmos_seleccionados || [],
            cover_url: teacher.portada_url || undefined,
          });
          return;
        }

        // Si no hay maestro, buscar academia por owner_id
        const { data: academy } = await supabase
          .from('profiles_academy')
          .select('id, nombre_publico, portada_url, ritmos, ritmos_seleccionados')
          .eq('user_id', group.owner_id)
          .single();

        if (academy) {
          setOwnerData({
            name: academy.nombre_publico,
            type: 'academy',
            ritmos: academy.ritmos || [],
            ritmos_seleccionados: academy.ritmos_seleccionados || [],
            cover_url: academy.portada_url || undefined,
          });
        }
      } catch (error) {
        console.error('Error loading owner data:', error);
      }
    };

    loadOwnerData();
  }, [group.owner_id, group.academy_id, group.owner_name, group.owner_type]);

  // Priorizar cover_image_url del grupo, luego cover_url del dueño
  const bg = normalizeAndOptimizeUrl(group.cover_image_url || ownerData?.cover_url);

  const href = `/competition-groups/${group.id}`;
  const ownerLabel = ownerData?.type === 'academy' ? 'Academia' : 'Maestro';

  return (
    <LiveLink to={href} asCard={false}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        style={{
          ...card,
          backgroundImage: bg ? `url(${bg})` : undefined,
          backgroundSize: bg ? 'cover' : undefined,
          backgroundPosition: bg ? 'center' : undefined,
          backgroundRepeat: bg ? 'no-repeat' : undefined
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)', opacity: 0.9 }} />
        
        {/* Overlay como en ClassCard: solo si no hay background */}
        {!bg && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.80) 100%)', zIndex: 0, pointerEvents: 'none' }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.375rem',
            fontWeight: 700,
            lineHeight: 1.2
          }}>
            <span style={{
              display: 'inline-block',
              maxWidth: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: '#fff',
              textShadow: 'rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px'
            }}>
              {group.name}
            </span>
          </h3>
        </div>

        {/* Badge de estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem', position: 'relative', zIndex: 1 }}>
          <span style={{
            padding: '4px 10px',
            borderRadius: '999px',
            background: group.is_active 
              ? 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(16,185,129,0.3))'
              : 'rgba(107,114,128,0.3)',
            border: `1px solid ${group.is_active ? '#22C55E' : '#6B7280'}`,
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {group.is_active ? '✓' : '○'} {group.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {ownerData?.name && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', position: 'relative', zIndex: 1, marginBottom: 4 }}>
            Por: <strong style={{ color: '#fff' }}>{ownerData.name}</strong>
            {ownerData.type && (
              <span style={{ 
                marginLeft: 8, 
                padding: '2px 8px', 
                borderRadius: 999, 
                background: 'rgba(240, 147, 251, 0.2)', 
                border: '1px solid rgba(240, 147, 251, 0.4)',
                fontSize: 10,
                fontWeight: 600
              }}>
                {ownerLabel}
              </span>
            )}
          </div>
        )}

        {/* Solo ubicación */}
        {group.training_location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6, position: 'relative', zIndex: 1 }}>
            <span style={{ 
              border: '1px solid rgb(255 255 255 / 48%)', 
              background: 'rgb(25 25 25 / 89%)', 
              padding: 8, 
              borderRadius: 999, 
              fontSize: 13, 
              color: 'rgba(255,255,255,0.9)', 
              maxWidth: '100%', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis' 
            }}>
              📍 {group.training_location}
            </span>
          </div>
        )}

        <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: -2, borderRadius: 18, boxShadow: '0 0 0 0px rgba(255,255,255,0)', transition: 'box-shadow .2s ease' }} className="card-focus-ring" />
      </motion.div>
    </LiveLink>
  );
}

