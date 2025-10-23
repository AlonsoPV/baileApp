import React from "react";

export interface SocialMediaSectionProps {
  respuestas?: { 
    redes?: {
      instagram?: string | null;
      tiktok?: string | null;
      youtube?: string | null;
      facebook?: string | null;
      whatsapp?: string | null;
    };
  };
  title?: string;
  showTitle?: boolean;
  style?: React.CSSProperties;
}

function isNonEmpty(v?: string | null) {
  return typeof v === "string" && v.trim().length > 0;
}

function sanitizeUrl(raw: string) {
  const v = raw.trim();
  if (/^https?:\/\//i.test(v)) return v;
  // permitir @handle -> convertir a plataformas conocidas
  if (v.startsWith("@")) return v.slice(1);
  return v;
}

function buildWhatsAppLink(v: string) {
  // v puede ser número plano; usa solo dígitos
  const digits = v.replace(/\D+/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export default function SocialMediaSection({
  respuestas,
  title = "🔗 Redes Sociales",
  showTitle = true,
  style,
}: SocialMediaSectionProps) {
  const redes = respuestas?.redes || {};

  const entries = ([
    ["instagram", redes.instagram],
    ["tiktok",    redes.tiktok],
    ["youtube",   redes.youtube],
    ["facebook",  redes.facebook],
    ["whatsapp",  redes.whatsapp],
  ] as const).flatMap(([k, v]) => {
    if (!isNonEmpty(v as string | null)) return [];
    if (k === "whatsapp") {
      const link = buildWhatsAppLink(v as string);
      return link ? [[k, link]] : [];
    }
    const clean = sanitizeUrl(v as string);
    // convierte @handle a URLs si quieres (opcional)
    const url =
      k === "instagram" && !/^https?:\/\//i.test(clean) ? `https://instagram.com/${clean}` :
      k === "tiktok"    && !/^https?:\/\//i.test(clean) ? `https://tiktok.com/@${clean}` :
      k === "youtube"   && !/^https?:\/\//i.test(clean) ? `https://youtube.com/@${clean}` :
      k === "facebook"  && !/^https?:\/\//i.test(clean) ? `https://facebook.com/${clean}` :
      clean;

    return [[k, url]];
  }) as [string, string][];

  if (entries.length === 0) return null;

  const defaultStyle: React.CSSProperties = {
    marginBottom: '2rem',
    padding: '2rem',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    ...style
  };

  // Estilos específicos para cada red social
  const getSocialStyle = (platform: string): React.CSSProperties => {
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1rem',
      textDecoration: 'none',
      borderRadius: '12px',
      fontSize: '0.9rem',
      fontWeight: '600',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      border: '1px solid',
      cursor: 'pointer',
      position: 'relative' as const,
      overflow: 'hidden',
    };

    const platformStyles = {
      instagram: {
        background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
        color: '#ffffff',
        borderColor: 'rgba(188, 24, 136, 0.3)',
        boxShadow: '0 4px 15px rgba(188, 24, 136, 0.2)',
      },
      tiktok: {
        background: 'linear-gradient(135deg, #000000 0%, #ff0050 50%, #00f2ea 100%)',
        color: '#ffffff',
        borderColor: 'rgba(255, 0, 80, 0.3)',
        boxShadow: '0 4px 15px rgba(255, 0, 80, 0.2)',
      },
      youtube: {
        background: 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
        color: '#ffffff',
        borderColor: 'rgba(255, 0, 0, 0.3)',
        boxShadow: '0 4px 15px rgba(255, 0, 0, 0.2)',
      },
      facebook: {
        background: 'linear-gradient(135deg, #1877f2 0%, #0d47a1 100%)',
        color: '#ffffff',
        borderColor: 'rgba(24, 119, 242, 0.3)',
        boxShadow: '0 4px 15px rgba(24, 119, 242, 0.2)',
      },
      whatsapp: {
        background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
        color: '#ffffff',
        borderColor: 'rgba(37, 211, 102, 0.3)',
        boxShadow: '0 4px 15px rgba(37, 211, 102, 0.2)',
      },
    };

    return { ...baseStyle, ...platformStyles[platform as keyof typeof platformStyles] };
  };

  const hoverStyle: React.CSSProperties = {
    transform: 'translateY(-3px) scale(1.02)',
    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.4)',
    filter: 'brightness(1.1)',
  };

  // Efecto de brillo sutil
  const glowEffect = (platform: string) => {
    const glowColors = {
      instagram: 'rgba(188, 24, 136, 0.3)',
      tiktok: 'rgba(255, 0, 80, 0.3)',
      youtube: 'rgba(255, 0, 0, 0.3)',
      facebook: 'rgba(24, 119, 242, 0.3)',
      whatsapp: 'rgba(37, 211, 102, 0.3)',
    };
    
    return {
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: '12px',
        background: `radial-gradient(circle at center, ${glowColors[platform as keyof typeof glowColors]} 0%, transparent 70%)`,
        opacity: 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
      }
    };
  };

  return (
    <section
      style={defaultStyle}
      data-test-id="social-media-section"
    >
      {showTitle && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🔗</span>
          <h3 style={{ 
            fontSize: '1.25rem', 
            margin: 0,
            fontWeight: '700',
            background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {title}
          </h3>
        </div>
      )}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '1rem',
        justifyContent: 'flex-start',
        alignItems: 'center'
      }}>
        {entries.map(([k, url]) => {
          const platformIcon = {
            instagram: '📸',
            tiktok: '🎵',
            youtube: '📺',
            facebook: '👥',
            whatsapp: '💬',
          }[k] || '🔗';

          return (
            <a
              key={k}
              href={url}
              target="_blank"
              rel="noreferrer"
              style={getSocialStyle(k)}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, hoverStyle);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = getSocialStyle(k).boxShadow as string;
              }}
              data-test-id={`social-link-${k}`}
            >
              <span style={{ fontSize: '1.1rem' }}>{platformIcon}</span>
              <span>{k[0].toUpperCase() + k.slice(1)}</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}