import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OffCanvasMenu } from "@ui/index";
import { theme } from "@theme/colors";
import { Navbar } from "./components/Navbar";
import { ToastProvider } from "./components/Toast";
import { useAuth } from "./hooks/useAuth";
import { useUserProfile } from "./hooks/useUserProfile";
import { AppRouter } from "./router";
import AppBootstrap from "./providers/AppBootstrap";
import "./App.css";

function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();

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
      label: "Perfil",
      icon: "👤",
      onClick: () => navigate('/app/profile'),
    },
    {
      id: "info",
      label: "Info",
      icon: "ℹ️",
      onClick: () => navigate('/info'),
    },
  ];

  return (
    <div style={{ background: theme.bg.app, minHeight: "100vh", color: theme.text.primary }}>
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
    <ToastProvider>
      <AppBootstrap>
        <AppContent />
      </AppBootstrap>
    </ToastProvider>
  );
}

export default App;
