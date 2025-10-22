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
  const { mode, setMode } = useProfileMode(); // mode ahora es el rol
  const { organizerId, loading } = useOrganizerStore();
  const { user } = useAuth();
  const { data: roleRequests } = useMyRoleRequests();
  const { showToast } = useToast();

  const hasOrganizer = !!organizerId;
  
  // Verificar si el rol de organizador está aprobado
  const organizadorApproved = roleRequests?.some(
    r => r.role === 'organizador' && r.status === 'aprobado'
  );

  // Determinar si estamos en modo edición basado en la ruta
  const isEditMode = pathname.includes('/edit');

  const handleToggleRole = () => {
    if (mode === "usuario") {
      // Intentando cambiar a organizador
      if (!organizadorApproved && !hasOrganizer) {
        showToast('Necesitas solicitar acceso como organizador primero', 'error');
        nav('/profile/roles');
        return;
      }
      
      setMode("organizador");
      nav(isEditMode ? "/profile/organizer/edit" : "/profile/organizer");
    } else {
      // Volver a usuario
      setMode("usuario");
      nav(isEditMode ? "/app/profile" : "/app/profile");
    }
  };

  const handleToggleEditLive = () => {
    if (mode === "organizador") {
      nav(isEditMode ? "/profile/organizer" : "/profile/organizer/edit");
    } else {
      // Usuario: alternar entre vista y edición
      nav(isEditMode ? "/app/profile" : "/app/profile/edit");
    }
  };

  // Si entran manualmente a /profile/organizer y no tienen organizer, redirige a crear
  React.useEffect(() => {
    if (!loading && !hasOrganizer && pathname.startsWith("/profile/organizer")) {
      setMode("organizador");
      nav("/profile/organizer/edit", { replace: true });
    }
  }, [loading, hasOrganizer, pathname, setMode, nav]);

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
        {/* Botón Toggle Usuario ↔ Organizador */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleRole}
          className="fab-button"
          style={{
            padding: '12px 20px',
            borderRadius: '50px',
            border: 'none',
            background: 'linear-gradient(135deg, #FF3D57, #FF8C42)',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(255, 61, 87, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {mode === "usuario" ? "🎤 Organizador" : "👤 Usuario"}
        </motion.button>

        {/* Botón Toggle Edit ↔ Live */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleEditLive}
          className="fab-button"
          style={{
            padding: '12px 20px',
            borderRadius: '50px',
            border: 'none',
            background: 'linear-gradient(135deg, #1E88E5, #667eea)',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(30, 136, 229, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {isEditMode ? "👁️ Ver" : "✏️ Editar"}
        </motion.button>
      </div>
    </div>
  );
}

export default function ProfileSwitchFab() {
  return ReactDOM.createPortal(<FabInner />, document.body);
}
