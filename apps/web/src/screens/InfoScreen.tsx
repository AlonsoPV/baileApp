import React from "react";
import { Link } from "react-router-dom";

export default function InfoScreen() {
  return (
    <div style={{ 
      background: "linear-gradient(135deg, #1C1F26 0%, #2A2F3A 100%)",
      minHeight: "100vh",
      color: "#FFFFFF",
      padding: "2rem"
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ 
            fontSize: "2.5rem", 
            fontWeight: "700", 
            marginBottom: "1rem",
            background: "linear-gradient(135deg, #E53935 0%, #FB8C00 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            BaileApp
          </h1>
          <p style={{ fontSize: "1.125rem", color: "#A0AEC0", marginBottom: "2rem" }}>
            Tu plataforma para conectar con la comunidad de baile
          </p>
        </div>

        {/* Contact Info */}
        <div style={{ 
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "1rem",
          padding: "2rem",
          marginBottom: "2rem",
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
          <h2 style={{ 
            fontSize: "1.5rem", 
            fontWeight: "600", 
            marginBottom: "1.5rem",
            color: "#FFFFFF"
          }}>
            📞 Contactanos
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "1.5rem" }}>📧</span>
              <div>
                <div style={{ fontWeight: "600", color: "#FFFFFF" }}>Email</div>
                <div style={{ color: "#A0AEC0" }}>contacto@baileapp.com</div>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "1.5rem" }}>📱</span>
              <div>
                <div style={{ fontWeight: "600", color: "#FFFFFF" }}>WhatsApp</div>
                <div style={{ color: "#A0AEC0" }}>+1 (555) 123-4567</div>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🌐</span>
              <div>
                <div style={{ fontWeight: "600", color: "#FFFFFF" }}>Sitio Web</div>
                <div style={{ color: "#A0AEC0" }}>www.baileapp.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div style={{ 
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "1rem",
          padding: "2rem",
          marginBottom: "2rem",
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
          <h2 style={{ 
            fontSize: "1.5rem", 
            fontWeight: "600", 
            marginBottom: "1.5rem",
            color: "#FFFFFF"
          }}>
            ✨ Funcionalidades
          </h2>
          
          <div style={{ display: "grid", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "1.25rem" }}>🔍</span>
              <span style={{ color: "#A0AEC0" }}>Explora eventos y perfiles de baile</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "1.25rem" }}>🏷️</span>
              <span style={{ color: "#A0AEC0" }}>Descubre marcas y organizadores</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "1.25rem" }}>💃</span>
              <span style={{ color: "#A0AEC0" }}>Aprende nuevos pasos (Próximamente)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "1.25rem" }}>📢</span>
              <span style={{ color: "#A0AEC0" }}>Mantente al día con novedades (Próximamente)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "1.25rem" }}>🎵</span>
              <span style={{ color: "#A0AEC0" }}>Descubre bandas y DJs (Próximamente)</span>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div style={{ textAlign: "center" }}>
          <Link 
            to="/app/profile"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(135deg, #E53935 0%, #FB8C00 100%)",
              color: "#FFFFFF",
              textDecoration: "none",
              borderRadius: "0.5rem",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
          >
            ← Volver al Perfil
          </Link>
        </div>
      </div>
    </div>
  );
}
