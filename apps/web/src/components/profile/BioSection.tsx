import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FaInstagram, 
  FaFacebookF, 
  FaTiktok, 
  FaYoutube, 
  FaTwitter,
  FaLinkedinIn,
  FaSpotify,
  FaWhatsapp,
  FaGlobe,
  FaEnvelope,
  FaTelegram
} from 'react-icons/fa';

interface BioSectionProps {
  bio?: string;
  redes?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    email?: string;
    twitter?: string;
    linkedin?: string;
    spotify?: string;
    whatsapp?: string;
    website?: string;
    web?: string;
    telegram?: string;
  } | null;
}

export const BioSection: React.FC<BioSectionProps> = ({ bio, redes }) => {
  const { t } = useTranslation();
  // Debug logs solo en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[BioSection] Bio:', bio);
      console.log('[BioSection] Redes raw:', redes);
      console.log('[BioSection] Redes type:', typeof redes);
      console.log('[BioSection] Redes keys:', redes ? Object.keys(redes) : 'null');
    }
  }, [bio, redes]);

  // Normalizar redes sociales (pueden venir en diferentes formatos)
  // Asegurar que redes sea un objeto válido
  const rawLinks = (redes && typeof redes === 'object' && !Array.isArray(redes)) ? redes : {};
  
  // Normalizar 'web' a 'website' para compatibilidad y evitar duplicados
  // Si existe website, usar solo website (excluir web)
  // Si solo existe web, normalizar a website (excluir web del resultado)
  const { web, website, ...otherLinks } = rawLinks;
  const websiteNormalized = website || web; // Usar website si existe, si no usar web
  
  const socialLinks = {
    ...otherLinks,
    ...(websiteNormalized ? { website: websiteNormalized } : {}),
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <FaInstagram size={20} />;
      case 'facebook':
        return <FaFacebookF size={20} />;
      case 'tiktok':
        return <FaTiktok size={20} />;
      case 'youtube':
        return <FaYoutube size={20} />;
      case 'twitter':
        return <FaTwitter size={20} />;
      case 'linkedin':
        return <FaLinkedinIn size={20} />;
      case 'spotify':
        return <FaSpotify size={20} />;
      case 'whatsapp':
        return <FaWhatsapp size={20} />;
      case 'email':
        return <FaEnvelope size={20} />;
      case 'website':
      case 'web':
        return <FaGlobe size={20} />;
      case 'telegram':
        return <FaTelegram size={20} />;
      default:
        return null;
    }
  };

  const getSocialColor = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)';
      case 'facebook':
        return '#1877F2';
      case 'tiktok':
        return '#000000';
      case 'youtube':
        return '#FF0000';
      case 'twitter':
        return '#1DA1F2';
      case 'linkedin':
        return '#0A66C2';
      case 'spotify':
        return '#1DB954';
      case 'whatsapp':
        return '#25D366';
      case 'email':
        return '#EA4335';
      case 'website':
      case 'web':
        return '#6C757D';
      case 'telegram':
        return '#0088cc';
      default:
        return '#999';
    }
  };

  const getSocialUrl = (platform: string, username: string) => {
    // Si ya es una URL completa, retornarla
    if (username.startsWith('http://') || username.startsWith('https://')) {
      return username;
    }

    // Limpiar @ si existe
    const cleanUsername = username.replace('@', '');

    switch (platform) {
      case 'instagram':
        return `https://instagram.com/${cleanUsername}`;
      case 'facebook':
        return `https://facebook.com/${cleanUsername}`;
      case 'tiktok':
        return `https://tiktok.com/@${cleanUsername}`;
      case 'youtube':
        return `https://youtube.com/@${cleanUsername}`;
      case 'twitter':
        return `https://twitter.com/${cleanUsername}`;
      case 'linkedin':
        return `https://linkedin.com/in/${cleanUsername}`;
      case 'spotify':
        return `https://open.spotify.com/user/${cleanUsername}`;
      case 'whatsapp': {
        const digits = username.replace(/\D+/g, '');
        return digits ? `https://wa.me/${digits}` : username;
      }
      case 'email': {
        // Validar que sea un email válido
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(username)) {
          return `mailto:${username}`;
        }
        return '#';
      }
      case 'website':
      case 'web': {
        // Si no empieza con http/https, agregarlo
        if (!username.startsWith('http://') && !username.startsWith('https://')) {
          return `https://${username}`;
        }
        return username;
      }
      case 'telegram': {
        const cleanUsername = username.replace('@', '').replace(/^t\.me\//, '');
        return `https://t.me/${cleanUsername}`;
      }
      default:
        return '#';
    }
  };

  const availableSocials = Object.entries(socialLinks).filter(
    ([_, value]) => value && value.trim() !== ''
  );

  // Siempre mostrar la sección, incluso sin datos
  return (
    <>
      <style>{`
        .bio-section-root {
          width: 100%;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 1.5rem;
        }

        .bio-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .bio-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .bio-title span {
          color: #fff;
          text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px;
        }

        .bio-socials {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .bio-social-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          transition: all 0.3s ease;
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .bio-social-icon:hover {
          transform: translateY(-3px) scale(1.15);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }

        .bio-text {
          margin: 0;
          font-size: 1.05rem;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.95);
          white-space: pre-wrap;
          word-wrap: break-word;
          font-weight: 400;
          text-align: center;
        }

        /* Tablet */
        @media (max-width: 768px) {
          .bio-section-root {
            padding: 1.25rem;
            margin-bottom: 1.25rem;
          }

          .bio-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .bio-title {
            font-size: 1.35rem;
            width: 100%;
          }

          .bio-socials {
            width: 100%;
            justify-content: center;
            gap: 0.6rem;
          }

          .bio-social-icon {
            width: 42px;
            height: 42px;
          }

          .bio-text {
            font-size: 1rem;
            line-height: 1.65;
          }
        }

        /* Mobile */
        @media (max-width: 480px) {
          .bio-section-root {
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 12px;
          }

          .bio-header {
            gap: 0.75rem;
          }

          .bio-title {
            font-size: 1.2rem;
            gap: 0.35rem;
          }

          .bio-socials {
            gap: 0.5rem;
          }

          .bio-social-icon {
            width: 38px;
            height: 38px;
          }

          .bio-text {
            font-size: 0.95rem;
            line-height: 1.6;
          }
        }
      `}</style>
      
      <div className="bio-section-root">
        {/* Header: Sobre mi + Redes Sociales */}
        <div className="bio-header">
          <h3 className="bio-title">
            <span>📝</span>
            <span>{t('about_me')}</span>
          </h3>

          {/* Iconos de Redes Sociales */}
          {availableSocials.length > 0 && (
            <div className="bio-socials">
              {availableSocials.map(([platform, username]) => (
                <a
                  key={platform}
                  href={getSocialUrl(platform, username as string)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bio-social-icon"
                  style={{
                    background: getSocialColor(platform),
                    color: '#fff',
                    border: platform === 'tiktok' ? '2px solid #fff' : 'none'
                  }}
                  title={`${platform}: ${username}`}
                >
                  {getSocialIcon(platform)}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Biografía */}
        {bio ? (
          <p className="bio-text">
            {bio}
          </p>
        ) : (
          <p style={{
            margin: 0,
            fontSize: '0.95rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '1rem'
          }}>
            {availableSocials.length > 0 
              ? '¡Sígueme en mis redes sociales!' 
              : 'Aún no hay biografía disponible'}
          </p>
        )}
      </div>
    </>
  );
};

