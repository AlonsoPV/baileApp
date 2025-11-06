import React from 'react';
import { 
  FaInstagram, 
  FaFacebookF, 
  FaTiktok, 
  FaYoutube, 
  FaTwitter,
  FaLinkedinIn,
  FaSpotify,
  FaGlobe
} from 'react-icons/fa';

interface BioSectionProps {
  bio?: string;
  redes?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
    linkedin?: string;
    spotify?: string;
    website?: string;
  } | null;
}

export const BioSection: React.FC<BioSectionProps> = ({ bio, redes }) => {
  // Normalizar redes sociales (pueden venir en diferentes formatos)
  const socialLinks = redes || {};

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
      case 'website':
        return <FaGlobe size={20} />;
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
      case 'website':
        return '#6C757D';
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
      case 'website':
        return username;
      default:
        return '#';
    }
  };

  const availableSocials = Object.entries(socialLinks).filter(
    ([_, value]) => value && value.trim() !== ''
  );

  if (!bio && availableSocials.length === 0) {
    return null;
  }

  return (
    <div style={{
      width: '100%',
      padding: '1.5rem',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '1.5rem'
    }}>
      {/* Header: Sobre mi + Redes Sociales */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: bio ? '1rem' : '0',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '1.2rem',
          fontWeight: '600',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>📝</span>
          <span>Sobre mí</span>
        </h3>

        {/* Iconos de Redes Sociales */}
        {availableSocials.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {availableSocials.map(([platform, username]) => (
              <a
                key={platform}
                href={getSocialUrl(platform, username as string)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: getSocialColor(platform),
                  color: platform === 'tiktok' ? '#fff' : '#fff',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  border: platform === 'tiktok' ? '2px solid #fff' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
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
      {bio && (
        <p style={{
          margin: 0,
          fontSize: '0.95rem',
          lineHeight: '1.6',
          color: 'rgba(255, 255, 255, 0.9)',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}>
          {bio}
        </p>
      )}

      {/* Mensaje si no hay biografía pero sí redes */}
      {!bio && availableSocials.length > 0 && (
        <p style={{
          margin: 0,
          fontSize: '0.9rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          No hay biografía disponible
        </p>
      )}
    </div>
  );
};

