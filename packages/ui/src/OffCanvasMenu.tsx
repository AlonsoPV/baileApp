import React, { useEffect } from "react";

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
}

interface OffCanvasMenuProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  displayName?: string;
}

export const OffCanvasMenu: React.FC<OffCanvasMenuProps> = ({
  isOpen,
  onClose,
  menuItems,
  userName = "Usuario",
  userEmail,
  userAvatar,
  displayName,
}) => {
  const normalizeAvatar = (src?: string) => {
    if (!src) return undefined;
    const v = String(src).trim();
    if (/^https?:\/\//i.test(v) || v.startsWith('/')) return v;
    return undefined; // evita usar valores tipo 'FFFFFF?text=ABM'
  };
  const safeUserAvatar = normalizeAvatar(userAvatar);
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#00000080",
          animation: "fadeIn 0.25s ease-out",
        }}
      />

      {/* Menu Panel */}
      <div
        className="offcanvas-menu-panel"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "280px",
          maxWidth: "80vw",
          backgroundColor: "#1C1F26",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          display: "flex",
          flexDirection: "column",
          animation: "slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Header with gradient */}
        <div
          className="offcanvas-menu-header"
          style={{
            // Barra superior (brand color)
            background: "#297F96",
            padding: "1.5rem",
            color: "#FFFFFF",
            position: "relative"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", rowGap: 10 }}>
            <div
              className="offcanvas-menu-avatar"
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: safeUserAvatar 
                  ? `url(${safeUserAvatar})` 
                  : "linear-gradient(135deg, #1E88E5 0%, #FDD835 100%)",
                backgroundSize: safeUserAvatar ? "cover" : "auto",
                backgroundPosition: safeUserAvatar ? "center" : "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#FFF",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                border: safeUserAvatar ? "3px solid rgba(255, 255, 255, 0.4)" : "none",
                flexShrink: 0
              }}
            >
              {!safeUserAvatar && (displayName || userName).charAt(0).toUpperCase()}
            </div>
            
            <div style={{ flex: "1 1 160px", minWidth: 0 }}>
              <div style={{ 
                fontSize: "1.125rem", 
                fontWeight: "600", 
                marginBottom: "0.25rem",
                // Evitar overflow: permitir 2 líneas si es necesario
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as any,
                overflow: "hidden",
                textOverflow: "ellipsis",
                wordBreak: "break-word",
              }}>
                {displayName || userName}
              </div>
              {userEmail && (
                <div style={{ 
                  fontSize: "0.8rem", 
                  opacity: 0.9,
                  // Evitar overflow: permitir 2 líneas si es necesario
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical" as any,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  wordBreak: "break-word",
                }}>
                  {userEmail}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="offcanvas-menu-items" style={{ flex: 1, padding: "1rem 0", overflowY: "auto" }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              className="offcanvas-menu-item"
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  onClose();
                }
              }}
              disabled={item.disabled}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem 1.5rem",
                border: "none",
                background: "transparent",
                cursor: item.disabled ? "not-allowed" : "pointer",
                fontSize: "1rem",
                fontWeight: "500",
                color: item.disabled ? "#6B7280" : "#D6D8DE",
                transition: "all 0.2s ease",
                textAlign: "left",
                opacity: item.disabled ? 0.6 : 1,
                minHeight: "48px"
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) {
                  e.currentTarget.style.backgroundColor = "#2A2F3A";
                  e.currentTarget.style.color = "#FFFFFF";
                }
              }}
              onMouseLeave={(e) => {
                if (!item.disabled) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#D6D8DE";
                }
              }}
            >
              {item.icon && <span style={{ fontSize: "1.25rem" }}>{item.icon}</span>}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.disabled && (
                <span style={{ 
                  fontSize: "0.75rem", 
                  color: "#9CA3AF",
                  fontStyle: "italic",
                  marginLeft: "0.5rem"
                }}>
                  Próximamente
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div
          className="offcanvas-menu-footer"
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid #2A2F3A",
            background: "#15181F"
          }}
        >
          {/* Fila 1: Info y Legal */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "1.5rem",
            marginBottom: "0.75rem"
          }}>
            <button
              onClick={() => {
                const infoItem = menuItems.find(item => item.id === 'info');
                if (infoItem) {
                  infoItem.onClick();
                  onClose();
                }
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#9CA3AF",
                fontSize: "0.8rem",
                fontWeight: "500",
                cursor: "pointer",
                padding: "0.25rem",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#E5E7EB"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#9CA3AF"}
            >
              ℹ️ Info
            </button>
            
            <button
              onClick={() => {
                const legalItem = menuItems.find(item => item.id === 'legal');
                if (legalItem) {
                  legalItem.onClick();
                  onClose();
                }
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#9CA3AF",
                fontSize: "0.8rem",
                fontWeight: "500",
                cursor: "pointer",
                padding: "0.25rem",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#E5E7EB"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#9CA3AF"}
            >
              📄 Legal
            </button>
          </div>

          {/* Fila 2: Versión */}
          <div style={{
            textAlign: "center",
            fontSize: "0.7rem",
            color: "#6B7280",
            fontWeight: "500"
          }}>
            BaileApp v1.0.0
          </div>
        </div>
      </div>

      {/* CSS Animations and Responsive Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }

        /* Responsive Styles */
        @media (max-width: 768px) {
          .offcanvas-menu-panel {
            width: 85vw !important;
            max-width: 320px !important;
          }
          
          .offcanvas-menu-header {
            padding: 1.25rem 1rem !important;
          }
          
          .offcanvas-menu-avatar {
            width: 56px !important;
            height: 56px !important;
            font-size: 1.25rem !important;
          }
          
          .offcanvas-menu-items {
            padding: 0.75rem 0 !important;
          }
          
          .offcanvas-menu-item {
            padding: 0.875rem 1.25rem !important;
            font-size: 0.95rem !important;
            min-height: 52px !important;
            gap: 0.875rem !important;
          }
          
          .offcanvas-menu-item span:first-child {
            font-size: 1.15rem !important;
          }
          
          .offcanvas-menu-footer {
            padding: 0.875rem 1.25rem !important;
          }
          
          .offcanvas-menu-footer button {
            font-size: 0.75rem !important;
            padding: 0.35rem 0.5rem !important;
            min-height: 40px !important;
          }
          
          .offcanvas-menu-footer > div:last-child {
            font-size: 0.65rem !important;
            margin-top: 0.5rem !important;
          }
        }

        @media (max-width: 480px) {
          .offcanvas-menu-panel {
            width: 90vw !important;
            max-width: 300px !important;
          }
          
          .offcanvas-menu-header {
            padding: 1rem 0.875rem !important;
          }
          
          .offcanvas-menu-header > div {
            gap: 0.875rem !important;
          }
          
          .offcanvas-menu-avatar {
            width: 52px !important;
            height: 52px !important;
            font-size: 1.15rem !important;
          }
          
          .offcanvas-menu-header > div > div:last-child > div:first-child {
            font-size: 1rem !important;
          }
          
          .offcanvas-menu-header > div > div:last-child > div:last-child {
            font-size: 0.75rem !important;
          }
          
          .offcanvas-menu-item {
            padding: 1rem 1rem !important;
            font-size: 0.9rem !important;
            min-height: 56px !important;
            gap: 0.75rem !important;
          }
          
          .offcanvas-menu-item span:first-child {
            font-size: 1.1rem !important;
          }
          
          .offcanvas-menu-footer {
            padding: 0.75rem 1rem !important;
          }
          
          .offcanvas-menu-footer > div:first-child {
            gap: 1rem !important;
            margin-bottom: 0.625rem !important;
          }
          
          .offcanvas-menu-footer button {
            font-size: 0.7rem !important;
            padding: 0.4rem 0.5rem !important;
            min-height: 44px !important;
          }
          
          .offcanvas-menu-footer > div:last-child {
            font-size: 0.625rem !important;
          }
        }

        @media (max-width: 360px) {
          .offcanvas-menu-panel {
            width: 95vw !important;
            max-width: 280px !important;
          }
          
          .offcanvas-menu-header {
            padding: 0.875rem 0.75rem !important;
          }
          
          .offcanvas-menu-avatar {
            width: 48px !important;
            height: 48px !important;
            font-size: 1rem !important;
          }
          
          .offcanvas-menu-item {
            padding: 0.875rem 0.875rem !important;
            font-size: 0.875rem !important;
          }
          
          .offcanvas-menu-footer {
            padding: 0.625rem 0.875rem !important;
          }
        }

        /* Touch-friendly improvements */
        @media (hover: none) and (pointer: coarse) {
          .offcanvas-menu-item {
            min-height: 56px !important;
          }
          .offcanvas-menu-footer button {
            min-height: 48px !important;
            padding: 0.5rem 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
};

