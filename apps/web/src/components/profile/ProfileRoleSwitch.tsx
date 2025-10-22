import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useProfileMode } from "../../state/profileMode";
import { useMyApprovedRoles } from "../../hooks/useMyApprovedRoles";

const colors = {
  coral: '#FF3D57',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

type Tab = {
  key: "usuario" | "organizador" | "maestro" | "academia" | "marca";
  label: string;
  icon: string;
  requireApproval?: true; // todos menos usuario
};

const TABS: Tab[] = [
  { key: "usuario",      label: "Usuario",     icon: "👤" },
  { key: "organizador",  label: "Organizador", icon: "🎤", requireApproval: true },
  { key: "maestro",      label: "Maestro",     icon: "🎓", requireApproval: true },
  { key: "academia",     label: "Academia",    icon: "🏫", requireApproval: true },
  { key: "marca",        label: "Marca",       icon: "🏷️", requireApproval: true },
];

export default function ProfileRoleSwitch() {
  const nav = useNavigate();
  const loc = useLocation();
  const { mode, setMode } = useProfileMode();
  const { data, isLoading } = useMyApprovedRoles();

  const approved = new Set(data?.approved || []);
  const exists = data?.exists || { organizador: false, maestro: false, academia: false, marca: false };

  function canUse(tab: Tab) {
    if (!tab.requireApproval) return true;
    return approved.has(tab.key);
  }

  function onPick(tab: Tab) {
    if (!canUse(tab)) {
      nav("/profile/roles"); // pedir aprobación
      return;
    }
    
    setMode(tab.key);
    
    // Navega a su editor o live según ruta actual
    const isEditMode = loc.pathname.includes("/edit");
    
    if (tab.key === "usuario") {
      nav(isEditMode ? "/app/profile" : "/app/profile");
    } else {
      const routes: Record<string, { live: string; edit: string }> = {
        organizador: { live: "/profile/organizer", edit: "/profile/organizer/edit" },
        maestro:     { live: "/profile/teacher",   edit: "/profile/teacher/edit" },
        academia:    { live: "/profile/school",    edit: "/profile/school/edit" },
        marca:       { live: "/profile/brand",     edit: "/profile/brand/edit" },
      };
      
      const target = isEditMode ? routes[tab.key].edit : routes[tab.key].live;
      nav(target);
    }
  }

  if (isLoading) {
    return (
      <div style={{
        padding: '0.5rem',
        borderRadius: '0.75rem',
        background: 'rgba(23, 23, 23, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        fontSize: '0.875rem',
        opacity: 0.7
      }}>
        Cargando roles...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem',
        borderRadius: '0.75rem',
        background: 'rgba(23, 23, 23, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '1.5rem'
      }}
    >
      {TABS.map((t) => {
        const active = mode === t.key;
        const available = canUse(t);
        
        return (
          <motion.button
            key={t.key}
            whileHover={available ? { scale: 1.05 } : {}}
            whileTap={available ? { scale: 0.95 } : {}}
            onClick={() => onPick(t)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              border: active 
                ? '2px solid rgba(236, 72, 153, 1)' 
                : '1px solid rgba(115, 115, 115, 1)',
              background: active 
                ? 'rgba(219, 39, 119, 0.8)' 
                : 'rgba(38, 38, 38, 1)',
              color: colors.light,
              fontWeight: '600',
              cursor: available ? 'pointer' : 'not-allowed',
              opacity: available ? 1 : 0.5,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            title={!available ? "Requiere aprobación - Click para solicitar" : ""}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {!available && <span style={{ fontSize: '0.7rem' }}>🔒</span>}
          </motion.button>
        );
      })}

      {/* Acceso rápido cuando faltan permisos */}
      <div style={{ marginLeft: 'auto' }}>
        <Link
          to="/profile/roles"
          style={{
            fontSize: '0.75rem',
            color: '#f093fb',
            textDecoration: 'none',
            fontWeight: '600',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(240, 147, 251, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Gestionar roles →
        </Link>
      </div>
    </motion.div>
  );
}

