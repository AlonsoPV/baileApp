import React from "react";
import ReactDOM from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useProfileMode } from "../state/profileMode";
import { useOrganizerStore } from "../state/organizerStore";
import { useAuth } from "../hooks/useAuth";
import { useMyRoleRequests } from "../hooks/useRoleRequests";
import { useToast } from "./Toast";
import "./ProfileSwitchFab.css";

function FabInner() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { role, mode, toggleRole, toggleMode, setRole, setMode } = useProfileMode();
  const { organizerId, loading } = useOrganizerStore();
  const { user } = useAuth();
  const { data: roleRequests } = useMyRoleRequests();
  const { showToast } = useToast();

  const hasOrganizer = !!organizerId;
  
  // Verificar si el rol de organizador está aprobado
  const organizadorApproved = roleRequests?.some(
    r => r.role === 'organizador' && r.status === 'aprobado'
  );

  const go = (nextMode = mode, nextRole = role) => {
    if (nextRole === "organizador") {
      nav(nextMode === "edit" ? "/profile/organizer/edit" : "/profile/organizer", { replace: false });
    } else {
      nav(nextMode === "edit" ? "/app/profile" : "/app/profile", { replace: false });
    }
  };

  const onToggleRole = () => {
    if (role === "usuario") {
      // Intentando cambiar a organizador
      // Verificar si tiene el rol aprobado
      if (!organizadorApproved && !hasOrganizer) {
        showToast('Necesitas solicitar acceso como organizador primero', 'error');
        nav('/profile/roles');
        return;
      }
      
      if (hasOrganizer) {
        toggleRole();
        go(mode, "organizador");
      } else {
        // crea/edita organizador
        setRole("organizador");
        setMode("edit");
        nav("/profile/organizer/edit");
      }
    } else {
      // Volver a usuario (siempre permitido)
      toggleRole();
      go(mode, "usuario");
    }
  };

  const onToggleMode = () => {
    toggleMode();
    const next = mode === "live" ? "edit" : "live";
    go(next, role);
  };

  // Si entran manualmente a /profile/organizer y no tienen organizer, redirige a crear
  React.useEffect(() => {
    if (!loading && !hasOrganizer && pathname.startsWith("/profile/organizer")) {
      setRole("organizador");
      setMode("edit");
      nav("/profile/organizer/edit", { replace: true });
    }
  }, [loading, hasOrganizer, pathname, setRole, setMode, nav]);

  // Ocultar si no hay sesión
  if (!user) return null;

  return (
    <div
      style={{ 
        position: "fixed", 
        right: 16, 
        bottom: 16, 
        zIndex: 2147483647, 
        pointerEvents: "none" 
      }}
      aria-live="polite"
    >
      <div 
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'flex-end',
          pointerEvents: "auto",
        }}
      >
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onToggleMode}
          className="profile-switch-mode-btn"
          style={{
            padding: '12px 20px',
            borderRadius: '50px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(23, 23, 23, 0.8)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
          title={mode === "live" ? "Cambiar a Edición" : "Ver Live"}
        >
          {mode === "live" ? "✏️ Editar perfil" : "👁️ Ver live"}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onToggleRole}
          disabled={role === "usuario" && !hasOrganizer}
          className={`profile-switch-role-btn ${
            role === "usuario" 
              ? (hasOrganizer ? "role-usuario-has-org" : "role-usuario-no-org")
              : "role-organizador"
          }`}
          style={{
            padding: '12px 20px',
            borderRadius: '50px',
            border: role === "usuario" && !hasOrganizer ? '1px solid rgba(255,255,255,0.15)' : 'none',
            background: role === "usuario"
              ? (hasOrganizer 
                  ? 'linear-gradient(135deg, rgb(59, 130, 246), rgb(236, 72, 153))' 
                  : 'rgba(64, 64, 64, 0.8)')
              : 'linear-gradient(135deg, rgb(236, 72, 153), rgb(250, 204, 21))',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '700',
            cursor: (role === "usuario" && !hasOrganizer) ? 'not-allowed' : 'pointer',
            opacity: (role === "usuario" && !hasOrganizer) ? 0.6 : 1,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
          title={
            role === "usuario"
              ? (hasOrganizer ? "Ir a Organizador" : "Crear Organizador")
              : "Ir a Usuario"
          }
        >
          {role === "usuario" 
            ? (hasOrganizer ? "🎤 Switch a Organizador" : "✨ Crear Organizador") 
            : "👤 Switch a Usuario"}
        </motion.button>
      </div>
    </div>
  );
}

export default function ProfileSwitchFab() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const container = document.body;
  return ReactDOM.createPortal(<FabInner />, container);
}