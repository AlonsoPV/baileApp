import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useMyRoleRequests, useRequestRole, RoleType } from "../../hooks/useRoleRequests";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { useToast } from "../../components/Toast";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  green: '#43e97b',
  dark: '#121212',
  light: '#F5F5F5',
};

const ALL_ROLES: { k: RoleType; label: string; desc: string; icon: string; gradient: string }[] = [
  {
    k: "organizador",
    label: "Organizador",
    desc: "Crea y publica eventos (padre y fechas)",
    icon: "🎤",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
  },
  {
    k: "maestro",
    label: "Maestro",
    desc: "Ofrece clases, horarios y zonas",
    icon: "🎓",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
  },
  {
    k: "academia",
    label: "Academia",
    desc: "Administra tu escuela y maestros",
    icon: "🏫",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
  },
  {
    k: "marca",
    label: "Marca",
    desc: "Promociona tus productos",
    icon: "🏷️",
    gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)"
  },
];

export default function RoleSelectorScreen() {
  const { data: reqs, isLoading } = useMyRoleRequests();
  const requestRole = useRequestRole();
  const { showToast } = useToast();

  function statusFor(role: RoleType) {
    const r = reqs?.find(x => x.role === role);
    return r?.status;
  }

  const handleRequest = async (role: RoleType) => {
    try {
      await requestRole.mutateAsync({ role });
      showToast(`Solicitud de ${role} enviada ✅`, 'success');
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.dark,
      color: colors.light,
      padding: '1.5rem'
    }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/', icon: '🏠' },
            { label: 'Perfil', href: '/app/profile', icon: '👤' },
            { label: 'Tipos de Perfil', icon: '🎭' },
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '2rem' }}
        >
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            🎭 Tipos de Perfil
          </h1>
          <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            Elige roles adicionales para acceder a más funcionalidades. Requieren aprobación del administrador.
          </p>
        </motion.div>

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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {ALL_ROLES.map((r, index) => {
              const st = statusFor(r.k);
              const pending = st === "pendiente";
              const approved = st === "aprobado";
              const rejected = st === "rechazado";

              return (
                <motion.div
                  key={r.k}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    borderRadius: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(23, 23, 23, 0.6)',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Badge de estado */}
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: approved ? 'rgba(16, 185, 129, 0.2)'
                      : pending ? 'rgba(255, 140, 66, 0.2)'
                      : rejected ? 'rgba(255, 61, 87, 0.2)'
                      : 'rgba(255, 255, 255, 0.1)',
                    color: approved ? colors.green
                      : pending ? colors.orange
                      : rejected ? colors.coral
                      : colors.light
                  }}>
                    {approved ? "Aprobado ✅" 
                      : pending ? "Pendiente ⏳" 
                      : rejected ? "Rechazado ❌" 
                      : "Sin solicitar"}
                  </div>

                  {/* Icono */}
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    {r.icon}
                  </div>

                  {/* Título y descripción */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      {r.label}
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                      {r.desc}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{ marginTop: '1rem' }}>
                    {approved ? (
                      <Link
                        to={
                          r.k === "organizador" ? "/profile/organizer/edit"
                          : r.k === "maestro" ? "/profile/teacher/edit"
                          : r.k === "academia" ? "/profile/school/edit"
                          : "/profile/brand/edit"
                        }
                        style={{
                          display: 'inline-block',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '25px',
                          border: 'none',
                          background: r.gradient,
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          textDecoration: 'none',
                          textAlign: 'center'
                        }}
                      >
                        Ir a mi perfil →
                      </Link>
                    ) : (
                      <button
                        disabled={pending || requestRole.isPending}
                        onClick={() => handleRequest(r.k)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '25px',
                          border: 'none',
                          background: pending || requestRole.isPending
                            ? 'rgba(115, 115, 115, 1)'
                            : r.gradient,
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: (pending || requestRole.isPending) ? 'not-allowed' : 'pointer',
                          opacity: (pending || requestRole.isPending) ? 0.6 : 1
                        }}
                      >
                        {pending ? "En revisión ⏳" : requestRole.isPending ? "Enviando..." : "Solicitar acceso"}
                      </button>
                    )}
                  </div>

                  {rejected && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem',
                      background: 'rgba(255, 61, 87, 0.1)',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      color: colors.coral
                    }}>
                      ⚠️ Tu solicitud fue rechazada. Puedes intentar nuevamente.
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Link de vuelta */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link
            to="/app/profile"
            style={{
              fontSize: '0.875rem',
              color: colors.coral,
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            ← Volver a mi perfil
          </Link>
        </div>
      </div>
    </div>
  );
}

