import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useExploreFilters } from "../../state/exploreFilters";
import { useExploreQuery } from "../../hooks/useExploreQuery";
import EventCard from "../../components/explore/cards/EventCard";
import OrganizerCard from "../../components/explore/cards/OrganizerCard";
import TeacherCard from "../../components/explore/cards/TeacherCard";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

function Section({ title, toAll, children }: { title: string; toAll: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{title}</h2>
        <Link
          to={toAll}
          style={{
            fontSize: '0.875rem',
            color: '#f093fb',
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          Ver todo →
        </Link>
      </div>
      {children}
    </section>
  );
}

export default function ExploreHomeScreen() {
  const navigate = useNavigate();
  const { set } = useExploreFilters();

  // Próximos eventos (next 30d)
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 30);
  
  const eventsQuery = useExploreQuery({
    type: "eventos",
    q: "",
    ritmos: [],
    zonas: [],
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
    pageSize: 6
  });

  // Organizadores destacados
  const orgQuery = useExploreQuery({
    type: "organizadores",
    q: "",
    ritmos: [],
    zonas: [],
    pageSize: 6
  });

  // Maestros recientes (placeholder)
  const teachQuery = useExploreQuery({
    type: "maestros",
    q: "",
    ritmos: [],
    zonas: [],
    pageSize: 6
  });

  const handleNavigateToAll = (type: string) => {
    set({ type: type as any });
    navigate('/explore/list');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.dark,
      color: colors.light,
      padding: '1.5rem'
    }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🔍 Explora BaileApp
          </h1>
          <p style={{
            fontSize: '1.125rem',
            opacity: 0.8,
            maxWidth: '42rem',
            margin: '0 auto'
          }}>
            Descubre eventos, organizadores, bailarines y más en tu comunidad
          </p>
        </motion.div>

        {/* Sección: Próximos Eventos */}
        <Section title="📅 Próximos Eventos" toAll="/explore/list">
          {eventsQuery.isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
              Cargando eventos...
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {(eventsQuery.data?.pages?.[0]?.data || []).map((e: any, i: number) => (
                <div
                  key={e.id ?? i}
                  onClick={() => navigate(`/events/date/${e.id}`)}
                >
                  <EventCard item={e} />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Sección: Organizadores Destacados */}
        <Section title="🎤 Organizadores Destacados" toAll="/explore/list">
          {orgQuery.isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
              Cargando organizadores...
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {(orgQuery.data?.pages?.[0]?.data || []).map((o: any, i: number) => (
                <div
                  key={o.id ?? i}
                  onClick={() => navigate(`/organizer/${o.id}`)}
                >
                  <OrganizerCard item={o} />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Sección: Nuevos Maestros */}
        <Section title="🎓 Nuevos Maestros" toAll="/explore/list">
          {teachQuery.isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
              Cargando maestros...
            </div>
          ) : teachQuery.data?.pages?.[0]?.data?.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              opacity: 0.6,
              background: 'rgba(38, 38, 38, 0.6)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              Próximamente: Perfiles de maestros
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {(teachQuery.data?.pages?.[0]?.data || []).map((t: any, i: number) => (
                <div key={t.id ?? i}>
                  <TeacherCard item={t} />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* CTA: ir a lista con filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ marginTop: '2rem', textAlign: 'center' }}
        >
          <button
            onClick={() => handleNavigateToAll("eventos")}
            style={{
              padding: '1rem 2rem',
              borderRadius: '9999px',
              border: 'none',
              background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(236, 72, 153))',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(236, 72, 153, 0.4)'
            }}
          >
            🔍 Ver todos los eventos
          </button>
        </motion.div>
      </div>
    </div>
  );
}
