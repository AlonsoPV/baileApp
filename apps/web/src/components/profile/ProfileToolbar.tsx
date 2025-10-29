import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useProfileMode } from "../../state/profileMode";
import { useMyApprovedRoles } from "../../hooks/useMyApprovedRoles";

type RoleKey = "usuario" | "organizador" | "maestro" | "academia" | "marca";
type RoleMeta = { key: RoleKey; label: string; icon: string; requireApproval?: true };

const ROLES: RoleMeta[] = [
  { key: "usuario",      label: "Usuario",     icon: "👤" },
  { key: "organizador",  label: "Organizador", icon: "🎤", requireApproval: true },
  { key: "maestro",      label: "Maestro",     icon: "🎓", requireApproval: true },
  { key: "academia",     label: "Academia",    icon: "🏫", requireApproval: true },
  { key: "marca",        label: "Marca",       icon: "🏷️", requireApproval: true },
];

export default function ProfileToolbar() {
  const nav = useNavigate();
  const loc = useLocation();
  const { mode, setMode } = useProfileMode();
  const { data } = useMyApprovedRoles();
  const [open, setOpen] = React.useState(false);

  const approved = new Set((data?.approved || []) as RoleKey[]);
  const exists = data?.exists || { organizador: false, maestro: false, academia: false, marca: false };

  // ¿Estoy en edición?
  const isEditRoute = /\/edit($|\/)/.test(loc.pathname);

  function goView(kind: RoleKey, toEdit: boolean) {
    // Si requiere aprobación y no la tiene → manda a solicitar
    const meta = ROLES.find(r => r.key === kind)!;
    if (meta.requireApproval && !approved.has(kind as any)) {
      nav("/profile/roles");
      return;
    }

    setMode(kind);

    if (kind === "usuario") {
      nav(toEdit ? "/profile/edit" : "/profile");
      return;
    }

    const map: Record<Exclude<RoleKey, "usuario">, { live: string; edit: string }> = {
      organizador: { live: "/profile/organizer", edit: "/profile/organizer/edit" },
      maestro: { live: "/profile/teacher", edit: "/profile/teacher/edit" },
      academia: { live: "/profile/school", edit: "/profile/school/edit" },
      marca: { live: "/profile/brand", edit: "/profile/brand/edit" },
    };

    const target = toEdit 
      ? map[kind as Exclude<RoleKey, "usuario">].edit 
      : map[kind as Exclude<RoleKey, "usuario">].live;
    nav(target);
  }

  function onToggleEditLive() {
    // Cambia entre Edit y Live manteniendo el rol actual
    goView(mode, !isEditRoute);
  }

  const currentRole = ROLES.find(r => r.key === mode);
  const currentLabel = currentRole?.label ?? "Usuario";
  const currentIcon = currentRole?.icon ?? "👤";

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem',
      borderRadius: '1rem',
      background: 'rgba(23, 23, 23, 0.6)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '1.5rem'
    }}>
      {/* Botón Editar / Ver live */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleEditLive}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '9999px',
          background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(236, 72, 153))',
          color: 'white',
          fontWeight: '600',
          fontSize: '0.9rem',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}
      >
        {isEditRoute ? "👁️ Live" : "✏️ Editar"}
      </motion.button>

      {/* Dropdown de Roles */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            background: 'rgb(38, 38, 38)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgb(64, 64, 64)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgb(38, 38, 38)';
          }}
        >
          <span>Roles:</span>
          <span style={{ fontWeight: '700' }}>{currentIcon} {currentLabel}</span>
          <span style={{ fontSize: '0.7rem' }}>▾</span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                position: 'absolute',
                zIndex: 40,
                marginTop: '0.5rem',
                width: '14rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgb(17, 19, 24)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                padding: '0.5rem'
              }}
              onMouseLeave={() => setOpen(false)}
            >
              {ROLES.map((r) => {
                const isActive = r.key === mode;
                const needPermit = !!r.requireApproval && !approved.has(r.key as any);
                
                return (
                  <button
                    key={r.key}
                    onClick={() => {
                      setOpen(false);
                      goView(r.key, isEditRoute);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      transition: 'background 0.2s',
                      background: isActive ? 'rgba(236, 72, 153, 0.3)' : 'transparent',
                      opacity: needPermit ? 0.6 : 1,
                      cursor: 'pointer',
                      border: 'none',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(38, 38, 38, 1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                    title={needPermit ? "Requiere aprobación" : ""}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>
                        {r.icon} {r.label}
                      </span>
                      {needPermit && <span style={{ fontSize: '0.75rem' }}>⛔</span>}
                    </div>
                    {needPermit && (
                      <div style={{
                        fontSize: '0.688rem',
                        opacity: 0.7,
                        marginTop: '0.125rem'
                      }}>
                        Ir a solicitar → /profile/roles
                      </div>
                    )}
                  </button>
                );
              })}
              
              <div style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                margin: '0.25rem 0'
              }} />
              
              <button
                onClick={() => {
                  setOpen(false);
                  nav("/profile/roles");
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  transition: 'background 0.2s',
                  background: 'transparent',
                  cursor: 'pointer',
                  border: 'none',
                  color: 'rgb(240, 147, 251)',
                  fontSize: '0.875rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(38, 38, 38, 1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                🎭 Gestionar roles
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

