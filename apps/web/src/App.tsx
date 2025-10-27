import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { OffCanvasMenu } from "@ui/index";
import { colors } from "./theme/colors";
import { Navbar } from "./components/Navbar";
import { ToastProvider } from "./components/Toast";
import { AuthProvider, useAuth } from "./contexts/AuthProvider";
import { useUserProfile } from "./hooks/useUserProfile";
import { useDefaultProfile } from "./hooks/useDefaultProfile";
import AppRouter from "./AppRouter";
import AppBootstrap from "./providers/AppBootstrap";
import "./App.css";

function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const { profile } = useUserProfile();
  const { getDefaultRoute, getDefaultEditRoute, getDefaultProfileInfo } = useDefaultProfile();
  const navigate = useNavigate();

  // Debug auth state
  console.log('[Auth check]', { loading, uid: user?.id });

  // Obtener información del perfil por defecto
  const defaultProfileInfo = getDefaultProfileInfo();

  const menuItems = [
    {
      id: "explore",
      label: "Explorar",
      icon: "🔍",
      onClick: () => navigate('/explore'),
    },
    {
      id: "brands",
      label: "Marcas",
      icon: "🏷️",
      onClick: () => navigate('/profile/brand'),
    },
    {
      id: "pasos",
      label: "Pasos",
      icon: "💃",
      onClick: () => console.log("Pasos - Próximamente"),
      disabled: true,
    },
    {
      id: "novedades",
      label: "Novedades",
      icon: "📢",
      onClick: () => console.log("Novedades - Próximamente"),
      disabled: true,
    },
    {
      id: "bandas-dj",
      label: "Bandas/DJ",
      icon: "🎵",
      onClick: () => console.log("Bandas/DJ - Próximamente"),
      disabled: true,
    },
    {
      id: "profile",
      label: `Mi Perfil (${defaultProfileInfo?.name || 'Usuario'})`,
      icon: defaultProfileInfo?.icon || "👤",
      onClick: () => navigate(getDefaultRoute()),
    },
    {
      id: "edit-profile",
      label: `Editar Perfil (${defaultProfileInfo?.name || 'Usuario'})`,
      icon: "✏️",
      onClick: () => navigate(getDefaultEditRoute()),
    },
    {
      id: "profile-settings",
      label: "Configurar Perfil por Defecto",
      icon: "⚙️",
      onClick: () => navigate('/profile/settings'),
    },
    {
      id: "info",
      label: "Info",
      icon: "ℹ️",
      onClick: () => navigate('/info'),
    },
  ];

  return (
    <div style={{ background: colors.dark[400], minHeight: "100vh", color: colors.light }}>
      {/* Navbar */}
      <Navbar onMenuToggle={user ? () => setMenuOpen(true) : undefined} />

      {/* Route Outlet */}
      <main>
        <AppRouter />
      </main>

      {/* Off-Canvas Menu (only when logged in) */}
      {user && (
        <OffCanvasMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          menuItems={menuItems}
          userName={user.email?.split('@')[0] || "Usuario"}
          userEmail={user.email || ""}
          userAvatar={profile?.avatar_url || undefined}
          displayName={profile?.display_name || undefined}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppBootstrap>
            <AppContent />
          </AppBootstrap>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
