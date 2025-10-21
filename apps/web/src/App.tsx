import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OffCanvasMenu } from "@ui/index";
import { theme } from "@theme/colors";
import { Navbar } from "./components/Navbar";
import { ToastProvider } from "./components/Toast";
import { useAuth } from "./hooks/useAuth";
import { AppRouter } from "./router";
import AppBootstrap from "./providers/AppBootstrap";
import ProfileSwitchFab from "./components/ProfileSwitchFab";
import "./App.css";

function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    {
      id: "profile",
      label: "Mi Perfil",
      icon: "👤",
      onClick: () => navigate('/app/profile'),
    },
    {
      id: "explore",
      label: "Explorar",
      icon: "🔍",
      onClick: () => console.log("Explore"),
    },
    {
      id: "events",
      label: "Eventos",
      icon: "🎉",
      onClick: () => console.log("Events"),
    },
    {
      id: "teachers",
      label: "Maestros",
      icon: "👨‍🏫",
      onClick: () => console.log("Teachers"),
    },
    {
      id: "brands",
      label: "Marcas",
      icon: "🏷️",
      onClick: () => console.log("Brands"),
    },
    {
      id: "settings",
      label: "Configuración",
      icon: "⚙️",
      onClick: () => console.log("Settings"),
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
        <ProfileSwitchFab />
      </AppBootstrap>
    </ToastProvider>
  );
}

export default App;
