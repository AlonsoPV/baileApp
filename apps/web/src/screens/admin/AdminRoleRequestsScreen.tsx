import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAdminRoleRequests, useApproveRoleRequest } from "../../hooks/useRoleRequests";
import { Breadcrumbs } from "../../components/Breadcrumbs";
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

export default function AdminRoleRequestsScreen() {
  const [filter, setFilter] = useState<'pendiente' | 'aprobado' | 'rechazado'>('pendiente');
  const { data, isLoading } = useAdminRoleRequests(filter);
  const approve = useApproveRoleRequest();
  const { showToast } = useToast();

  const handleApprove = async (id: number, shouldApprove: boolean, role: string) => {
    try {
      await approve.mutateAsync({ id, approve: shouldApprove });
      showToast(
        shouldApprove 
          ? `Solicitud de ${role} aprobada ✅` 
          : `Solicitud de ${role} rechazada ❌`,
        shouldApprove ? 'success' : 'error'
      );
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #0b1020 100%)',
      color: colors.light,
      padding: '1.5rem'
    }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/', icon: '🏠' },
            { label: 'Admin', href: '/admin', icon: '⚙️' },
            { label: 'Solicitudes de Rol', icon: '📋' },
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '2rem' }}
        >
          <div style={{
            padding: '18px 16px',
            borderRadius: 16,
            background: 'linear-gradient(90deg,#1E88E5, #FF8C42, #FFD166)',
            color: '#0b1020'
          }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>⚙️ Solicitudes de Rol</h1>
            <div style={{ opacity: .9, marginTop: 4, fontWeight: 600 }}>Aprueba o rechaza solicitudes para organizador, maestro, academia o marca.</div>
          </div>
        </motion.div>

        {/* Filtro de estado */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          {(['pendiente', 'aprobado', 'rechazado'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: filter === status ? `2px solid #93c5fd` : '1px solid rgba(255, 255, 255, 0.2)',
                background: filter === status ? 'rgba(147,197,253,0.18)' : 'rgba(38, 38, 38, 0.6)',
                color: colors.light,
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {status === 'pendiente' ? '⏳ Pendientes' 
                : status === 'aprobado' ? '✅ Aprobados' 
                : '❌ Rechazados'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255, 255, 255, 0.2)',
              borderTop: '3px solid #FF3D57',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <div>Cargando solicitudes...</div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(!data || data.length === 0) ? (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                background: 'rgba(38, 38, 38, 0.6)',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                opacity: 0.7
              }}>
                No hay solicitudes {filter}.
              </div>
            ) : (
              data.map((r, index) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(23, 23, 23, 0.6)',
                    padding: '1rem'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      {(((r as any).role || (r as any).role_slug) || '').toString().toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                      <b>{(r as any).full_name || '—'}</b>
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                      {(r as any).email || '—'} · {(r as any).phone || '—'}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                      Usuario: {r.user_id?.slice(0, 8)}...
                    </div>
                    {(r as any).socials && (
                      <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                        IG: {(r as any).socials?.instagram || '—'} · TT: {(r as any).socials?.tiktok || '—'} · YT: {(r as any).socials?.youtube || '—'} · FB: {(r as any).socials?.facebook || '—'} · WA: {(r as any).socials?.whatsapp || '—'}
                      </div>
                    )}
                    {((r as any).note || (r as any).admin_note) && (
                      <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
                        Nota: {(r as any).note || (r as any).admin_note}
                      </div>
                    )}
                    <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.25rem' }}>
                      Solicitado: {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {filter === 'pendiente' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleApprove(r.id, true, (r as any).role_slug || (r as any).role)}
                        disabled={approve.isPending}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          border: 'none',
                          background: approve.isPending ? 'rgba(115, 115, 115, 1)' : colors.green,
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: approve.isPending ? 'not-allowed' : 'pointer'
                        }}
                      >
                        ✅ Aprobar
                      </button>
                      <button
                        onClick={() => handleApprove(r.id, false, (r as any).role_slug || (r as any).role)}
                        disabled={approve.isPending}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          border: 'none',
                          background: approve.isPending ? 'rgba(115, 115, 115, 1)' : colors.coral,
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: approve.isPending ? 'not-allowed' : 'pointer'
                        }}
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

