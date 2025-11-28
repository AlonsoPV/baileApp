import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useCompetitionGroup, useDeleteCompetitionGroup } from '@/hooks/useCompetitionGroups';
import { useCompetitionGroupMembers } from '@/hooks/useCompetitionGroupMembers';
import { urls } from '@/lib/urls';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';

const allowedVideoHosts = ['youtube.com', 'youtu.be', 'vimeo.com'];

const sanitizePromoUrl = (value?: string) => {
  if (!value) return '';
  try {
    const parsed = new URL(value);
    if (allowedVideoHosts.some(host => parsed.hostname.includes(host))) {
      return value;
    }
  } catch {
    return '';
  }
  return '';
};

const formatCostAmount = (value?: number | null) => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return '$0.00 MXN';
  return `$${numeric.toFixed(2)} MXN`;
};

export default function CompetitionGroupDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { data: group, isLoading: loadingGroup, error: groupError } = useCompetitionGroup(id ?? null);
  const { data: members, isLoading: loadingMembers, error: membersError } = useCompetitionGroupMembers(id ?? null);
  const deleteGroup = useDeleteCompetitionGroup();
  
  // Detectar si estamos en una vista pública
  // Verificar si el referrer viene de una vista pública o si no hay usuario autenticado
  const [isPublicView, setIsPublicView] = useState(false);
  
  useEffect(() => {
    // Verificar referrer para ver si venimos de una vista pública
    const referrer = document.referrer;
    const isFromPublicView = referrer.includes('/academia/') || referrer.includes('/maestro/');
    // También considerar vista pública si no hay usuario autenticado
    setIsPublicView(isFromPublicView || !user);
  }, [user, location]);
  
  // Estado para almacenar información del owner (academia o maestro)
  const [ownerData, setOwnerData] = useState<{
    name?: string;
    type?: 'academy' | 'teacher';
    id?: number | string;
  } | null>(null);

  const isOwner = group?.owner_id === user?.id;
  const isMember = members?.some(m => m.user_id === user?.id && m.is_active) || false;

  // Cargar información del owner
  useEffect(() => {
    if (!group) return;

    const loadOwnerData = async () => {
      try {
        // Si tiene academy_id, cargar datos de la academia
        if (group.academy_id) {
          const { data: academy } = await supabase
            .from('profiles_academy')
            .select('id, nombre_publico')
            .eq('id', group.academy_id)
            .single();

          if (academy) {
            setOwnerData({
              name: academy.nombre_publico,
              type: 'academy',
              id: academy.id,
            });
            return;
          }
        }

        // Si no tiene academia, buscar maestro por owner_id
        const { data: teacher } = await supabase
          .from('profiles_teacher')
          .select('id, nombre_publico')
          .eq('user_id', group.owner_id)
          .maybeSingle();

        if (teacher) {
          setOwnerData({
            name: teacher.nombre_publico,
            type: 'teacher',
            id: teacher.id,
          });
          return;
        }

        // Si no hay maestro, intentar buscar academia por owner_id
        const { data: academy } = await supabase
          .from('profiles_academy')
          .select('id, nombre_publico')
          .eq('user_id', group.owner_id)
          .maybeSingle();

        if (academy) {
          setOwnerData({
            name: academy.nombre_publico,
            type: 'academy',
            id: academy.id,
          });
        }
      } catch (error) {
        console.error('[CompetitionGroupDetail] Error loading owner data:', error);
      }
    };

    loadOwnerData();
  }, [group]);

  if (loadingGroup) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Cargando...</div>;
  }

  if (groupError) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2>Error al cargar el grupo</h2>
        <p>{groupError.message || 'Intenta recargar más tarde.'}</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2>Grupo no encontrado</h2>
        <button onClick={() => navigate('/competition-groups')} className="cc-btn">
          Volver a Grupos
        </button>
      </div>
    );
  }

  const costTypeLabels: Record<string, string> = {
    monthly: 'Mensual',
    per_session: 'Por Sesión',
    package: 'Paquete',
  };

  return (
    <>
      <style>{`
        .group-detail-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        .group-hero-section {
          position: relative;
          width: 100%;
          border-radius: 24px;
          overflow: hidden;
          margin-bottom: 2rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        .group-cover-image {
          width: 100%;
          height: 500px;
          object-fit: contain;
          object-position: center;
          background: linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.6));
        }
        .group-cover-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%);
          padding: 3rem 2rem 2rem;
          pointer-events: auto;
        }
        .group-header-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 2.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
        }
        .info-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 1.75rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .info-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #f093fb, #f5576c, #FFD166);
          opacity: 0.8;
        }
        .info-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(240, 147, 251, 0.3);
          border-color: rgba(240, 147, 251, 0.4);
        }
        .info-card-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, rgba(240, 147, 251, 0.3), rgba(245, 87, 108, 0.3));
          box-shadow: 0 8px 24px rgba(240, 147, 251, 0.2);
        }
        .member-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 1.25rem;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .member-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(240, 147, 251, 0.2);
          border-color: rgba(240, 147, 251, 0.3);
        }
        .member-avatar {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          object-fit: cover;
          border: 2px solid rgba(240, 147, 251, 0.3);
          box-shadow: 0 4px 16px rgba(240, 147, 251, 0.2);
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .section-icon {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: linear-gradient(135deg, #f093fb, #f5576c);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          box-shadow: 0 8px 24px rgba(240, 147, 251, 0.4);
        }
        .section-title {
          font-size: 2rem;
          font-weight: 900;
          background: linear-gradient(135deg, #f093fb, #f5576c, #FFD166);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          word-break: break-word;
        }
        .owner-badge-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 999px;
          flex-wrap: wrap;
        }
        .action-buttons-container {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .badges-container {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          width: 100%;
        }
        @media (max-width: 768px) {
          .action-buttons-container {
            width: 100%;
            flex-direction: column;
          }
          .action-buttons-container button {
            width: 100% !important;
            justify-content: center;
          }
          .badges-container {
            gap: 8px;
          }
          .owner-badge-container {
            font-size: 0.8rem;
            padding: 0.4rem 0.875rem;
          }
        }
        @media (max-width: 480px) {
          .action-buttons-container {
            width: 100%;
            flex-direction: column;
            gap: 0.75rem;
          }
          .action-buttons-container button {
            width: 100% !important;
            justify-content: center;
            padding: 0.875rem 1.5rem !important;
            font-size: 0.875rem !important;
          }
          .badges-container {
            gap: 0.5rem;
          }
          .badges-container > span,
          .badges-container > div {
            font-size: 0.75rem !important;
            padding: 0.375rem 0.75rem !important;
            white-space: nowrap;
          }
          .owner-badge-container {
            font-size: 0.75rem;
            padding: 0.375rem 0.75rem;
            width: 100%;
          }
          .owner-badge-container a {
            font-size: 0.75rem !important;
          }
        }
        @media (max-width: 1024px) {
          .group-detail-container {
            padding: 1.5rem;
          }
          .group-cover-image {
            height: 400px;
          }
          .group-header-card {
            padding: 2rem;
          }
          .section-title {
            font-size: 1.75rem;
          }
        }
        @media (max-width: 768px) {
          .group-detail-container {
            padding: 1rem;
          }
          .group-hero-section {
            border-radius: 16px;
            margin-bottom: 1.5rem;
          }
          .group-cover-image {
            height: 300px;
          }
          .group-cover-overlay {
            padding: 2rem 1.5rem 1.5rem;
          }
          .group-cover-overlay h1 {
            font-size: 2rem !important;
            margin-bottom: 0.5rem;
          }
          .group-cover-overlay p {
            font-size: 1rem !important;
          }
          .group-header-card {
            padding: 1.5rem;
            border-radius: 16px;
            margin-bottom: 1.5rem;
          }
          .group-header-card > div {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .group-header-card h1 {
            font-size: 2rem !important;
            margin-bottom: 0.75rem;
          }
          .group-header-card p {
            font-size: 1rem !important;
            margin-bottom: 1rem;
          }
          .group-header-card > div > div:last-child {
            width: 100% !important;
            margin-top: 1rem;
          }
          .group-header-card > div > div:last-child button {
            width: 100% !important;
            justify-content: center;
          }
          .section-title {
            font-size: 1.5rem;
          }
          .section-icon {
            width: 56px;
            height: 56px;
            font-size: 1.75rem;
          }
          .info-card {
            padding: 1.25rem;
            border-radius: 16px;
          }
          .info-card-icon {
            width: 48px;
            height: 48px;
            font-size: 1.5rem;
            margin-bottom: 0.75rem;
          }
          .info-card h3 {
            font-size: 1.1rem !important;
            margin-bottom: 0.5rem !important;
          }
          .info-card p {
            font-size: 0.9rem !important;
          }
          .member-card {
            padding: 1rem;
            border-radius: 12px;
          }
          .member-avatar {
            width: 48px;
            height: 48px;
            border-radius: 10px;
          }
          .member-card > div > div:first-child {
            font-size: 0.9rem !important;
          }
          /* Badges y botones en tablet */
          .group-header-card > div > div:last-of-type,
          .group-detail-container > div > div[style*="flex"][style*="gap"] {
            flex-wrap: wrap !important;
            width: 100% !important;
          }
          .group-detail-container > div > div[style*="flex"][style*="gap"] > span,
          .group-detail-container > div > div[style*="flex"][style*="gap"] > div {
            font-size: 0.8rem !important;
            padding: 0.4rem 0.875rem !important;
          }
        }
        @media (max-width: 480px) {
          .group-detail-container {
            padding: 0.75rem;
          }
          .group-hero-section {
            border-radius: 12px;
            margin-bottom: 1rem;
          }
          .group-cover-image {
            height: 250px;
          }
          .group-cover-overlay {
            padding: 1.5rem 1rem 1rem;
          }
          .group-cover-overlay h1 {
            font-size: 1.5rem !important;
            margin-bottom: 0.375rem;
          }
          .group-cover-overlay p {
            font-size: 0.875rem !important;
            line-height: 1.5;
          }
          .group-header-card {
            padding: 1.25rem;
            border-radius: 12px;
            margin-bottom: 1rem;
          }
          .group-header-card h1 {
            font-size: 1.75rem !important;
            margin-bottom: 0.5rem;
          }
          .group-header-card p {
            font-size: 0.9rem !important;
            margin-bottom: 0.75rem;
          }
          .section-title {
            font-size: 1.25rem;
          }
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
            margin-bottom: 1rem;
          }
          .section-icon {
            width: 48px;
            height: 48px;
            font-size: 1.5rem;
            border-radius: 16px;
          }
          .info-card {
            padding: 1rem;
            border-radius: 12px;
          }
          .info-card-icon {
            width: 40px;
            height: 40px;
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
            border-radius: 12px;
          }
          .info-card h3 {
            font-size: 1rem !important;
            margin-bottom: 0.5rem !important;
          }
          .info-card p {
            font-size: 0.875rem !important;
            line-height: 1.6;
          }
          .member-card {
            padding: 0.875rem;
            border-radius: 10px;
            gap: 0.75rem;
          }
          .member-avatar {
            width: 40px;
            height: 40px;
            border-radius: 8px;
          }
          .member-card > div > div:first-child {
            font-size: 0.875rem !important;
          }
          .member-card > div > div:last-child {
            font-size: 0.75rem !important;
          }
          .member-card > div > div:last-child span {
            padding: 0.2rem 0.5rem !important;
            font-size: 0.7rem !important;
          }
          /* Grid de información en móvil */
          .group-detail-container > div > div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          /* Grid de miembros en móvil */
          .group-detail-container > div > div[style*="gridTemplateColumns"]:last-of-type {
            grid-template-columns: 1fr !important;
            gap: 0.875rem !important;
          }
          /* Botones de acción en móvil */
          .group-header-card > div > div:last-child,
          .group-detail-container > div > div[style*="flex"][style*="marginLeft"] {
            width: 100% !important;
            margin-left: 0 !important;
            margin-top: 1rem;
            flex-direction: column;
          }
          .group-header-card > div > div:last-child button,
          .group-detail-container > div > div[style*="flex"][style*="marginLeft"] button {
            width: 100% !important;
            justify-content: center;
            padding: 0.875rem 1.5rem !important;
            font-size: 0.875rem !important;
          }
          /* Badges en móvil */
          .group-header-card > div > div:last-of-type,
          .group-detail-container > div > div[style*="flex"][style*="gap"]:not([style*="marginLeft"]) {
            flex-wrap: wrap !important;
            width: 100% !important;
            gap: 0.5rem !important;
          }
          .group-detail-container > div > div[style*="flex"][style*="gap"] > span,
          .group-detail-container > div > div[style*="flex"][style*="gap"] > div {
            font-size: 0.75rem !important;
            padding: 0.375rem 0.75rem !important;
            white-space: nowrap;
          }
          /* Video responsivo en móvil */
          .group-detail-container > div > div[style*="borderRadius"][style*="overflow"] {
            border-radius: 12px !important;
            margin-top: 1rem;
          }
          .group-detail-container > div > div[style*="paddingBottom"][style*="56.25%"] {
            padding-bottom: 56.25% !important;
            border-radius: 12px !important;
          }
          /* Sección de miembros en móvil */
          .group-detail-container > div > div[style*="marginBottom"][style*="3rem"] {
            padding: 1.5rem !important;
            border-radius: 16px !important;
            margin-bottom: 2rem !important;
          }
        }
        @media (max-width: 768px) {
          /* Grid de información en tablet */
          .group-detail-container > div > div[style*="gridTemplateColumns"]:not(:last-of-type) {
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important;
            gap: 1.25rem !important;
          }
          /* Grid de miembros en tablet */
          .group-detail-container > div > div[style*="gridTemplateColumns"]:last-of-type {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important;
            gap: 1rem !important;
          }
          /* Video en tablet */
          .group-detail-container > div > div[style*="paddingBottom"][style*="56.25%"] {
            padding-bottom: 56.25% !important;
            border-radius: 16px !important;
          }
        }
      `}</style>
      <div className="group-detail-container">
        {/* Botón Volver */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '1.5rem' }}
        >
          <button 
            onClick={() => navigate('/competition-groups')} 
            className="cc-btn cc-btn--ghost"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '100%',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
          >
            ← Volver a Grupos
          </button>
        </motion.div>

        {/* Hero Section con Imagen de Portada */}
        {group.cover_image_url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="group-hero-section"
          >
            <img
              src={group.cover_image_url}
              alt={group.name}
              className="group-cover-image"
            />
            <div className="group-cover-overlay">
              <h1 style={{
                fontSize: '3.5rem',
                fontWeight: 900,
                color: '#fff',
                margin: 0,
                marginBottom: '0.5rem',
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
                wordBreak: 'break-word'
              }}>
                {group.name}
              </h1>
              {group.description && (
                <p style={{
                  fontSize: '1.25rem',
                  color: 'rgba(255,255,255,0.95)',
                  margin: 0,
                  lineHeight: 1.6,
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.6)',
                  wordBreak: 'break-word'
                }}>
                  {group.description}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Header Card (si no hay imagen de portada) */}
        {!group.cover_image_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group-header-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', width: '100%' }}>
              <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                <h1 style={{
                  fontSize: '3rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #f093fb, #f5576c, #FFD166)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '1rem',
                  lineHeight: 1.2,
                  wordBreak: 'break-word'
                }}>
                  {group.name}
                </h1>
                {group.description && (
                  <p style={{ 
                    fontSize: '1.2rem', 
                    color: 'rgba(255,255,255,0.9)', 
                    lineHeight: 1.7, 
                    marginBottom: '1.5rem',
                    wordBreak: 'break-word'
                  }}>
                    {group.description}
                  </p>
                )}
              </div>
              {isOwner && (
                <div className="action-buttons-container">
                  <button
                    onClick={() => navigate(`/competition-groups/${id}/edit`)}
                    style={{
                      padding: '0.875rem 1.75rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)';
                    }}
                  >
                    ✏️ Editar Grupo
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm('¿Estás seguro de que quieres eliminar este grupo? Esta acción no se puede deshacer.')) {
                        return;
                      }
                      try {
                        if (!id) return;
                        await deleteGroup.mutateAsync(id);
                        showToast('✅ Grupo eliminado exitosamente', 'success');
                        navigate('/competition-groups');
                      } catch (error: any) {
                        showToast(`❌ Error: ${error.message}`, 'error');
                      }
                    }}
                    disabled={deleteGroup.isPending}
                    style={{
                      padding: '0.875rem 1.75rem',
                      background: 'rgba(239,68,68,0.2)',
                      border: '1px solid #EF4444',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: deleteGroup.isPending ? 'not-allowed' : 'pointer',
                      opacity: deleteGroup.isPending ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!deleteGroup.isPending) {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.3)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              )}
            </div>

            {/* Badges de estado */}
            <div className="badges-container" style={{ marginTop: '1.5rem' }}>
              <span style={{
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                background: group.is_active 
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2))'
                  : 'rgba(107,114,128,0.2)',
                border: `1px solid ${group.is_active ? '#22C55E' : '#6B7280'}`,
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {group.is_active ? '✓' : '○'} {group.is_active ? 'Activo' : 'Inactivo'}
              </span>
              {/* Botón "Asociado a Academia" solo en vistas privadas */}
              {!isPublicView && group.academy_id && (
                <span style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.2))',
                  border: '1px solid #3B82F6',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}>
                  🏛️ Asociado a Academia
                </span>
              )}
              {/* Campo "Por: academia o maestro" */}
              {ownerData && (
                <div className="owner-badge-container" style={{
                  background: ownerData.type === 'academy' 
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(124,58,237,0.2))'
                    : 'linear-gradient(135deg, rgba(251,146,60,0.2), rgba(249,115,22,0.2))',
                  border: `1px solid ${ownerData.type === 'academy' ? '#8B5CF6' : '#FB923C'}`,
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    Por:
                  </span>
                  <a
                    href={ownerData.type === 'academy' 
                      ? `/academia/${ownerData.id}` 
                      : `/maestro/${ownerData.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(ownerData.type === 'academy' 
                        ? `/academia/${ownerData.id}` 
                        : `/maestro/${ownerData.id}`);
                    }}
                    style={{
                      fontSize: '0.875rem',
                      color: '#fff',
                      fontWeight: 700,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    {ownerData.type === 'academy' ? '🏛️' : '👨‍🏫'} {ownerData.name}
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Badges de estado (si hay imagen de portada) */}
        {group.cover_image_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="badges-container" style={{ marginBottom: '2rem' }}
          >
            <span style={{
              padding: '0.5rem 1rem',
              borderRadius: '999px',
              background: group.is_active 
                ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2))'
                : 'rgba(107,114,128,0.2)',
              border: `1px solid ${group.is_active ? '#22C55E' : '#6B7280'}`,
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {group.is_active ? '✓' : '○'} {group.is_active ? 'Activo' : 'Inactivo'}
            </span>
            {/* Botón "Asociado a Academia" solo en vistas privadas */}
            {!isPublicView && group.academy_id && (
              <span style={{
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.2))',
                border: '1px solid #3B82F6',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                🏛️ Asociado a Academia
              </span>
            )}
            {/* Campo "Por: academia o maestro" */}
            {ownerData && (
              <div className="owner-badge-container" style={{
                background: ownerData.type === 'academy' 
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(124,58,237,0.2))'
                  : 'linear-gradient(135deg, rgba(251,146,60,0.2), rgba(249,115,22,0.2))',
                border: `1px solid ${ownerData.type === 'academy' ? '#8B5CF6' : '#FB923C'}`,
              }}>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                  Por:
                </span>
                <a
                  href={ownerData.type === 'academy' 
                    ? `/academia/${ownerData.id}` 
                    : `/maestro/${ownerData.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(ownerData.type === 'academy' 
                      ? `/academia/${ownerData.id}` 
                      : `/maestro/${ownerData.id}`);
                  }}
                  style={{
                    fontSize: '0.875rem',
                    color: '#fff',
                    fontWeight: 700,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {ownerData.type === 'academy' ? '🏛️' : '👨‍🏫'} {ownerData.name}
                </a>
              </div>
            )}
            {isOwner && (
              <div className="action-buttons-container" style={{ marginTop: '1rem' }}>
                <button
                  onClick={() => navigate(`/competition-groups/${id}/edit`)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm('¿Estás seguro de que quieres eliminar este grupo? Esta acción no se puede deshacer.')) {
                      return;
                    }
                    try {
                      if (!id) return;
                      await deleteGroup.mutateAsync(id);
                      showToast('✅ Grupo eliminado exitosamente', 'success');
                      navigate('/competition-groups');
                    } catch (error: any) {
                      showToast(`❌ Error: ${error.message}`, 'error');
                    }
                  }}
                  disabled={deleteGroup.isPending}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(239,68,68,0.2)',
                    border: '1px solid #EF4444',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: deleteGroup.isPending ? 'not-allowed' : 'pointer',
                    opacity: deleteGroup.isPending ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!deleteGroup.isPending) {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  🗑️ Eliminar
                </button>
              </div>
            )}
          </motion.div>
        )}

      {/* Video de Promo */}
      {group.promo_video_url && sanitizePromoUrl(group.promo_video_url) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            marginBottom: '3rem',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '2rem',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div className="section-header">
            <div className="section-icon" style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)' }}>
              🎥
            </div>
            <h2 className="section-title" style={{ fontSize: '1.75rem' }}>Video de Promoción</h2>
          </div>
          <div style={{
            borderRadius: '20px',
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            background: '#000',
            position: 'relative',
            width: '100%',
            paddingBottom: '56.25%',
            height: 0,
            marginTop: '1rem'
          }}>
            {group.promo_video_url.includes('youtube.com') || group.promo_video_url.includes('youtu.be') ? (
              <iframe
                src={group.promo_video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%', 
                  height: '100%', 
                  border: 'none' 
                }}
                allowFullScreen
                title={`${group.name} - video`}
              />
            ) : group.promo_video_url.includes('vimeo.com') ? (
              <iframe
                src={group.promo_video_url.replace('vimeo.com/', 'player.vimeo.com/video/')}
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%', 
                  height: '100%', 
                  border: 'none' 
                }}
                allowFullScreen
                title={`${group.name} - video`}
              />
            ) : (
              <video
                src={group.promo_video_url}
                controls
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain' 
                }}
              />
            )}
          </div>
        </motion.div>
      )}

      {/* Información del Grupo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}
      >
        {/* Horarios */}
        {group.training_schedule && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="info-card"
          >
            <div className="info-card-icon" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(37,99,235,0.3))' }}>
              ⏰
            </div>
            <h3 style={{
              margin: '0 0 0.75rem 0',
              fontWeight: 800,
              fontSize: '1.25rem',
              color: '#fff'
            }}>
              Horarios de Entrenamiento
            </h3>
            <p style={{
              margin: 0,
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.7,
              fontSize: '1rem'
            }}>
              {group.training_schedule}
            </p>
          </motion.div>
        )}

        {/* Ubicación */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="info-card"
        >
          <div className="info-card-icon" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(16,185,129,0.3))' }}>
            📍
          </div>
          <h3 style={{
            margin: '0 0 0.75rem 0',
            fontWeight: 800,
            fontSize: '1.25rem',
            color: '#fff'
          }}>
            Ubicación
          </h3>
          <p style={{
            margin: 0,
            color: 'rgba(255,255,255,0.9)',
            lineHeight: 1.7,
            fontSize: '1rem'
          }}>
            {group.training_location}
          </p>
        </motion.div>

        {/* Costos */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="info-card"
        >
          <div className="info-card-icon" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(245,158,11,0.3))' }}>
            💰
          </div>
          <h3 style={{
            margin: '0 0 0.75rem 0',
            fontWeight: 800,
            fontSize: '1.25rem',
            color: '#fff'
          }}>
            Costos
          </h3>
          <p style={{
            margin: 0,
            color: 'rgba(255,255,255,0.9)',
            lineHeight: 1.7,
            fontSize: '1.1rem',
            fontWeight: 700
          }}>
            <span style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.2))',
              border: '1px solid rgba(251,191,36,0.4)',
              marginRight: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600
            }}>
              {costTypeLabels[group.cost_type]}
            </span>
            {formatCostAmount(group.cost_amount)}
          </p>
        </motion.div>
      </motion.div>

      {/* Miembros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          marginBottom: '3rem',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '2.5rem',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div className="section-header">
          <div className="section-icon" style={{ background: 'linear-gradient(135deg, #A78BFA, #C084FC)' }}>
            👥
          </div>
          <div>
            <h2 className="section-title" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              Miembros del Grupo
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: 'rgba(255,255,255,0.7)',
              margin: 0,
              fontWeight: 500
            }}>
              {members?.length || 0} {members?.length === 1 ? 'miembro' : 'miembros'}
            </p>
          </div>
        </div>

        {loadingMembers ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '1.1rem'
          }}>
            ⏳ Cargando miembros...
          </div>
        ) : membersError ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#f97316',
            background: 'rgba(249,115,22,0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(249,115,22,0.3)'
          }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              ⚠️ Error al cargar miembros
            </p>
            <p style={{ fontSize: '0.95rem', opacity: 0.8 }}>
              {membersError.message || 'Intenta de nuevo más tarde.'}
            </p>
          </div>
        ) : members && members.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1.25rem',
            marginTop: '1.5rem'
          }}>
            {members.map((member, index) => (
              <motion.a
                key={member.id}
                href={urls.userLive(member.user_id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="member-card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <img
                  src={member.user_avatar_url || 'https://placehold.co/56x56?text=User'}
                  alt={member.user_display_name || 'Usuario'}
                  className="member-avatar"
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    marginBottom: '0.25rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {member.user_display_name || 'Sin nombre'}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {member.role === 'teacher' ? (
                      <>
                        <span style={{
                          padding: '0.25rem 0.625rem',
                          borderRadius: '6px',
                          background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.2))',
                          border: '1px solid rgba(59,130,246,0.4)',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          👨‍🏫 Maestro
                        </span>
                      </>
                    ) : member.role === 'assistant' ? (
                      <span style={{
                        padding: '0.25rem 0.625rem',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(124,58,237,0.2))',
                        border: '1px solid rgba(139,92,246,0.4)',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        👨‍💼 Asistente
                      </span>
                    ) : (
                      <span style={{
                        padding: '0.25rem 0.625rem',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2))',
                        border: '1px solid rgba(34,197,94,0.4)',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        👤 Alumno
                      </span>
                    )}
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.7)',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '16px',
            border: '1px dashed rgba(255,255,255,0.2)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              No hay miembros aún
            </p>
            <p style={{ fontSize: '0.95rem', opacity: 0.8 }}>
              Este grupo aún no tiene miembros registrados.
            </p>
          </div>
        )}
      </motion.div>

    </div>
    </>
  );
}

