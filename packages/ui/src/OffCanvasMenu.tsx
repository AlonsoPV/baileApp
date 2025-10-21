import React, { useEffect } from "react";

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
}

interface OffCanvasMenuProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  userName?: string;
  userEmail?: string;
}

export const OffCanvasMenu: React.FC<OffCanvasMenuProps> = ({
  isOpen,
  onClose,
  menuItems,
  userName = "Usuario",
  userEmail,
}) => {
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
          style={{
            background: "linear-gradient(135deg, #E53935 0%, #FB8C00 100%)",
            padding: "2rem 1.5rem",
            color: "#FFFFFF",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1E88E5 0%, #FDD835 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#FFF",
              marginBottom: "1rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.25rem" }}>
            {userName}
          </div>
          {userEmail && (
            <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>
              {userEmail}
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div style={{ flex: 1, padding: "1rem 0", overflowY: "auto" }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem 1.5rem",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "500",
                color: "#D6D8DE",
                transition: "all 0.2s ease",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2A2F3A";
                e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#D6D8DE";
              }}
            >
              {item.icon && <span style={{ fontSize: "1.25rem" }}>{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1.5rem",
            borderTop: "1px solid #2A2F3A",
            textAlign: "center",
            fontSize: "0.75rem",
            color: "#A0AEC0",
          }}
        >
          BaileApp v0.0.1
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

