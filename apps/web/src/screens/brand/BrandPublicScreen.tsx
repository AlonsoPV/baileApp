import React from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ImageWithFallback from "../../components/ImageWithFallback";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import { BioSection } from "../../components/profile/BioSection";
import { colors, typography, spacing, borderRadius } from "../../theme/colors";
import { supabase } from "../../lib/supabase";
import { 
  FaInstagram, 
  FaFacebookF, 
  FaTiktok, 
  FaYoutube,
  FaWhatsapp,
  FaGlobe
} from 'react-icons/fa';

// Helper para formatear precios
function formatPrice(price: string | number | undefined): string {
  if (!price) return '';
  
  // Si ya viene formateado, retornarlo
  if (typeof price === 'string' && price.includes('MXN')) return price;
  
  // Extraer número del string
  const numStr = typeof price === 'string' ? price.replace(/[^0-9.]/g, '') : String(price);
  const num = parseFloat(numStr);
  
  if (isNaN(num)) return typeof price === 'string' ? price : '';
  
  // Formatear con comas y decimales
  return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
}

export default function BrandProfileLive() {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);

  const { data: brand, isLoading } = useQuery({
    queryKey: ['brand-public', brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles_brand')
        .select('*')
        .eq('id', brandId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        color: colors.gray[50]
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>⏳</div>
          <p style={{ fontSize: typography.fontSize.lg }}>Cargando marca…</p>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        color: colors.gray[50], padding: spacing[8]
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>❌</div>
          <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[4] }}>Marca no encontrada</h2>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/explore')}
            style={{
              padding: `${spacing[4]} ${spacing[7]}`,
              borderRadius: borderRadius.full,
              border: 'none',
              background: colors.gradients.primary,
              color: colors.gray[50],
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.bold,
              cursor: 'pointer'
            }}
          >
            🔍 Explorar
          </motion.button>
        </div>
      </div>
    );
  }

  // Prioriza el logo guardado; luego primer media normalizado
  const media: string[] = Array.isArray((brand as any).media)
    ? (brand as any).media.map((m: any) => (typeof m === 'string' ? m : m?.url)).filter(Boolean)
    : [];
  const avatarUrl = (brand as any).avatar_url || media[0] || undefined;
  const portadaUrl = (brand as any).portada_url as string | undefined;

  // Normalizaciones para catálogo
  const productos: any[] = Array.isArray((brand as any)?.productos) ? ((brand as any).productos as any[]) : [];
  const featured = productos.map((p: any) => ({
    id: p.id || Math.random().toString(36).slice(2),
    name: p.titulo || 'Producto',
    description: p.descripcion || '',
    price: formatPrice(p.price || p.precio),
    image: p.imagen_url,
    category: (p.categoria || p.category || 'ropa') as 'calzado'|'ropa'|'accesorios',
    gender: (p.gender || 'unisex') as 'caballero'|'dama'|'unisex',
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
  }));
  const policies = (brand as any)?.policies || { shipping: undefined as any, returns: undefined as any, warranty: undefined as any };
  const sizeGuideRows = Array.isArray((brand as any)?.size_guide) ? (brand as any).size_guide : [];
  const fitTipsRows = Array.isArray((brand as any)?.fit_tips) ? (brand as any).fit_tips : [];
  const conversion = (brand as any)?.conversion || {};
  const partners: any[] = [];

  return (
    <>
      <style>{`
        .profile-container h2,
        .profile-container h3 {
          color: #fff;
          text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px;
        }
        .section-title {
          font-size: 1.5rem; font-weight: 800; margin: 0 0 1rem 0;
          display: flex; align-items: center; gap: .5rem;
        }
        @media (max-width: 768px) { .brand-root { padding-top: 64px; } }
        .profile-container { width: 100%; max-width: 900px; margin: 0 auto; }
        .profile-banner { width: 100%; max-width: 900px; margin: 0 auto; }
        .banner-grid { display: grid; grid-template-columns: auto 1fr; gap: 3rem; align-items: center; }
        .glass-card-container {
          opacity: 1; margin-bottom: 2rem; padding: 2rem; text-align: center;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: rgba(0, 0, 0, 0.3) 0px 8px 32px; backdrop-filter: blur(10px);
        }
        /* Novedades - scroll-snap */
        .brand-novedades-wrap {
          overflow-x: auto;
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(260px, 350px);
          gap: 1rem;
          padding-bottom: .5rem;
          scroll-snap-type: x mandatory;
          justify-content: center;
        }
        .brand-novedad-card {
          scroll-snap-align: start;
          border-radius: 24px;
          border: 1px solid rgba(148,163,184,0.35);
          background: linear-gradient(135deg, rgba(15,23,42,0.96), rgba(17,24,39,0.98));
          box-shadow: 0 18px 40px rgba(0,0,0,0.55);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .brand-novedad-media {
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: visible;
          background: #020617;
          padding: 12px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .brand-novedad-body {
          flex: 1;
          text-align: left;
          padding: 0.9rem 1rem 1rem;
          background: linear-gradient(180deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96));
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .brand-novedad-price {
          font-size: 1.05rem;
          font-weight: 900;
          margin-top: .25rem;
          color: #e5e7eb;
          text-shadow: 0 2px 8px rgba(0,0,0,0.7);
        }
        @media (max-width: 768px) {
          .profile-container { max-width: 100% !important; padding: 1rem !important; }
          .profile-banner { border-radius: 0 !important; padding: 1.5rem 1rem !important; margin: 0 !important; }
          .banner-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; justify-items: center !important; text-align: center !important; }
          .banner-grid h1 { font-size: 2.6rem !important; }
          .banner-avatar { width: 220px !important; height: 220px !important; }
          .glass-card-container { padding: 1rem !important; margin-bottom: 1rem !important; border-radius: 16px !important; }
          .section-title { font-size: 1.25rem !important; margin-bottom: 1rem !important; }
          img, [style*="objectFit"] { max-width: 100% !important; height: auto !important; object-fit: contain !important; }
          .brand-novedades-wrap { grid-auto-columns: 86%; }
        }
        @media (max-width: 480px) {
          .banner-grid h1 { font-size: 2.2rem !important; }
          .banner-avatar { width: 180px !important; height: 180px !important; }
          .section-title { font-size: 1.1rem !important; }
          .glass-card-container { padding: 0.75rem !important; border-radius: 12px !important; }
        }
      `}</style>

      <div className="brand-root" style={{ position: 'relative', width: '100%', minHeight: '100vh', background: colors.darkBase, color: colors.light }}>
        {/* Banner */}
        <motion.section
          className="profile-banner glass-card-container"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{ position: 'relative', margin: '0 auto', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(11,13,16,.96), rgba(18,22,27,.9))' }}
        >
          {portadaUrl && (
            <div style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
              {/* Banner: slot flexible — ideal subir imagen horizontal (ej. 1920×600px o 1600×500px) para que se vea completa */}
              <ImageWithFallback
                src={portadaUrl}
                alt="portada"
                width={1200}
                height={500}
                sizes="(max-width: 768px) 100vw, 1200px"
                style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: 'rgba(0,0,0,0.35)' }}
              />
            </div>
          )}

          <div className="banner-grid" style={{ position: 'relative' }}>
            {/* Avatar (slot 250x250 — ideal subir imagen cuadrada, p.ej. 800x800px, con el logo centrado para que se vea completo) */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '10px' }}>
              <div className="banner-avatar" style={{ width: '250px', height: '250px', borderRadius: '24px', overflow: 'visible', border: '6px solid rgba(255,255,255,0.9)', boxShadow: '0 12px 40px rgba(0,0,0,0.8)', background: colors.gradients.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', boxSizing: 'border-box' }}>
                {avatarUrl ? (
                  <div style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                    <ImageWithFallback
                      src={avatarUrl}
                      alt="avatar marca"
                      priority={true}
                      width={250}
                      height={250}
                      sizes="(max-width: 768px) 50vw, 300px"
                      style={{
                        width: '100%',
                        height: '100%',
                        minWidth: 0,
                        minHeight: 0,
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        objectPosition: 'center',
                        display: 'block'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '3rem' }}>🏷️</div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                {(brand as any)?.estado_aprobacion === 'aprobado' && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.45rem 0.9rem',
                    borderRadius: 999,
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.45)',
                    color: '#9be7a1',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        display: 'grid',
                        placeItems: 'center',
                        background: '#16c784',
                        borderRadius: '50%',
                        color: '#062d1f',
                        fontSize: '0.75rem',
                        fontWeight: 900
                      }}
                    >
                      ✓
                    </div>
                    <span>Verificado</span>
                  </div>
                )}
                <button
                  aria-label="Compartir perfil"
                  title="Compartir"
                  onClick={() => {
                    try {
                      const url = typeof window !== 'undefined' ? window.location.href : '';
                      const title = (brand as any)?.nombre_publico || 'Marca';
                      const text = `Mira el perfil de ${title}`;
                      const navAny = (navigator as any);
                      if (navAny && typeof navAny.share === 'function') {
                        navAny.share({ title, text, url }).catch(() => {});
                      } else {
                        navigator.clipboard
                          ?.writeText(url)
                          .then(() => {
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                          })
                          .catch(() => {});
                      }
                    } catch {}
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: '#fff',
                    borderRadius: 999,
                    backdropFilter: 'blur(8px)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 700
                  }}
                >
                  📤 Compartir
                </button>
                {copied && (
                  <div
                    role="status"
                    aria-live="polite"
                    style={{
                      padding: '4px 8px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.25)',
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  >
                    Copiado
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '2.4rem',
                  fontWeight: 900,
                  letterSpacing: '0.02em',
                  lineHeight: 1.1,
                }}
              >
                {(brand as any).nombre_publico || (brand as any).nombre || 'Marca'}
              </h1>
              
              {/* Biografía integrada en el banner */}
              {(brand as any)?.bio && (
                <p style={{ 
                  opacity: 0.9, 
                  lineHeight: 1.6, 
                  margin: '0.5rem 0',
                  fontSize: '1rem',
                  color: 'rgba(255, 255, 255, 0.95)'
                }}>
                  {(brand as any).bio}
                </p>
              )}

              {/* Redes sociales integradas en el banner */}
              {((brand as any)?.redes_sociales) && (() => {
                const redes = (brand as any).redes_sociales;
                const hasAnyRed = redes.instagram || redes.tiktok || redes.youtube || redes.facebook || redes.whatsapp || redes.web;
                
                if (!hasAnyRed) return null;
                
                return (
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.75rem', 
                    flexWrap: 'wrap', 
                    marginTop: '0.5rem',
                    alignItems: 'center'
                  }}>
                    {redes.instagram && (
                      <a 
                        href={redes.instagram.startsWith('http') ? redes.instagram : `https://instagram.com/${redes.instagram.replace('@', '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        title={`Instagram: ${redes.instagram}`}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '44px',
                          height: '44px',
                          background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                          borderRadius: '50%',
                          color: '#fff',
                          textDecoration: 'none',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px) scale(1.15)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = '';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                        }}
                      >
                        <FaInstagram size={20} />
                      </a>
                    )}
                    {redes.tiktok && (
                      <a 
                        href={redes.tiktok.startsWith('http') ? redes.tiktok : `https://tiktok.com/@${redes.tiktok.replace('@', '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        title={`TikTok: ${redes.tiktok}`}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '44px',
                          height: '44px',
                          background: '#000000',
                          border: '2px solid #fff',
                          borderRadius: '50%',
                          color: '#fff',
                          textDecoration: 'none',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px) scale(1.15)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = '';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                        }}
                      >
                        <FaTiktok size={20} />
                      </a>
                    )}
                    {redes.youtube && (
                      <a 
                        href={redes.youtube} 
                        target="_blank" 
                        rel="noreferrer"
                        title={`YouTube: ${redes.youtube}`}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '44px',
                          height: '44px',
                          background: '#FF0000',
                          borderRadius: '50%',
                          color: '#fff',
                          textDecoration: 'none',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px) scale(1.15)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = '';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                        }}
                      >
                        <FaYoutube size={20} />
                      </a>
                    )}
                    {redes.facebook && (
                      <a 
                        href={redes.facebook.startsWith('http') ? redes.facebook : `https://facebook.com/${redes.facebook}`} 
                        target="_blank" 
                        rel="noreferrer"
                        title={`Facebook: ${redes.facebook}`}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '44px',
                          height: '44px',
                          background: '#1877F2',
                          borderRadius: '50%',
                          color: '#fff',
                          textDecoration: 'none',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px) scale(1.15)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = '';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                        }}
                      >
                        <FaFacebookF size={20} />
                      </a>
                    )}
                    {redes.whatsapp && (
                      <a 
                        href={`https://wa.me/${String(redes.whatsapp).replace(/\D+/g,'')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        title={`WhatsApp: ${redes.whatsapp}`}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '44px',
                          height: '44px',
                          background: '#25D366',
                          borderRadius: '50%',
                          color: '#fff',
                          textDecoration: 'none',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px) scale(1.15)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = '';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                        }}
                      >
                        <FaWhatsapp size={20} />
                      </a>
                    )}
                    {redes.web && (
                      <a 
                        href={redes.web} 
                        target="_blank" 
                        rel="noreferrer"
                        title={`Sitio Web: ${redes.web}`}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '44px',
                          height: '44px',
                          background: '#6C757D',
                          borderRadius: '50%',
                          color: '#fff',
                          textDecoration: 'none',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px) scale(1.15)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = '';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                        }}
                      >
                        <FaGlobe size={20} />
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </motion.section>

        {/* Contenido principal */}
        <div className="profile-container" style={{ padding: '2rem', margin: '0 auto' }}>

          {/* Novedades (scroll-snap) */}
          {featured.length > 0 && (
            <motion.section
              className="glass-card-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: 0.08 }}
              style={{ textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '1.3rem',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                }}>
                  ✨
                </div>
                <h3 className="section-title" style={{ margin: 0 }}>Novedades</h3>
              </div>
              <div className="brand-novedades-wrap" aria-label="Carrusel de novedades de productos">
                {featured.slice(0, 6).map((item) => (
                  <article key={item.id} className="brand-novedad-card" style={{ maxWidth: 350, width: '100%' }}>
                    <div className="brand-novedad-media">
                      {item.image ? (
                        <div style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                          <ImageWithFallback
                            src={item.image}
                            alt={item.name}
                            sizes="(max-width: 768px) 100vw, 400px"
                            style={{ 
                              width: '100%',
                              height: '100%',
                              minWidth: 0,
                              minHeight: 0,
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              objectPosition: 'center',
                              display: 'block'
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '2rem', opacity: 0.4 }}>
                          🛍️
                        </div>
                      )}
                    </div>
                    <div className="brand-novedad-body">
                      <h4 style={{ margin: '0.1rem 0' }}>{item.name}</h4>
                      {item.description && (
                        <p style={{ margin: '0.15rem 0', fontSize: '0.9rem', opacity: 0.8 }}>{item.description}</p>
                      )}
                      {item.price && (
                        <div className="brand-novedad-price">{item.price}</div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </motion.section>
          )}

          {/* Catálogo completo */}
          {featured.length > 0 && (
            <motion.section
              className="glass-card-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: 0.1 }}
              style={{ textAlign: 'left' }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                marginBottom: '1.5rem' 
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #9C27B0, #E91E63)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '1.5rem',
                  boxShadow: '0 8px 24px rgba(156, 39, 176, 0.4)'
                }}>
                  🛍️
                </div>
                <div>
                  <h3 className="section-title" style={{ margin: 0 }}>Catálogo de Productos</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: '0.25rem 0 0 0' }}>
                    Explora nuestra colección
                  </p>
                </div>
              </div>
              <CatalogTabs
                items={featured}
                labels={{
                  calzado: conversion?.calzadoLabel,
                  ropa: conversion?.ropaLabel,
                  accesorios: conversion?.accesoriosLabel,
                }}
              />
            </motion.section>
          )}

          {/* Guía de tallas y FIT */}
          {(sizeGuideRows.length > 0 || fitTipsRows.length > 0) && (
            <motion.section
              className="glass-card-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: 0.08 }}
              style={{ textAlign: 'left' }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                marginBottom: '1.5rem' 
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #4CAF50, #8BC34A)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '1.5rem',
                  boxShadow: '0 8px 24px rgba(76, 175, 80, 0.4)'
                }}>
                  📏
                </div>
                <div>
                  <h3 className="section-title" style={{ margin: 0 }}>Guía de Tallas y Ajuste</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: '0.25rem 0 0 0' }}>
                    Encuentra tu talla perfecta
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '1.25rem' }}>
                {sizeGuideRows.length > 0 && <SizeGuide rows={sizeGuideRows} />}
                {fitTipsRows.length > 0 && <FitTips tips={fitTipsRows} />}
              </div>
            </motion.section>
          )}

          {/* Reseñas / Comunidad */}
          <motion.section
            className="glass-card-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.1 }}
            style={{ textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.3rem',
                boxShadow: '0 8px 24px rgba(22,163,74,0.35)'
              }}>
                💬
              </div>
              <div>
                <h3 className="section-title" style={{ margin: 0 }}>Qué dice la comunidad</h3>
                <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: '0.25rem 0 0 0' }}>
                  Opiniones de personas que ya usan esta marca
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, background: 'rgba(255,255,255,.03)', padding: '1rem' }}>
                <div style={{ letterSpacing: '.15rem' }}>★★★★★</div>
                <p style={{ margin: '.4rem 0' }}>“La calidad se siente premium y el ajuste es perfecto para bailar toda la noche.”</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.75 }}>— Andrea, CDMX</p>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, background: 'rgba(255,255,255,.03)', padding: '1rem' }}>
                <div style={{ letterSpacing: '.15rem' }}>★★★★☆</div>
                <p style={{ margin: '.4rem 0' }}>“Entrega rápida y materiales muy cómodos para socials de varias horas.”</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.75 }}>— Luis, GDL</p>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, background: 'rgba(255,255,255,.03)', padding: '1rem' }}>
                <div style={{ letterSpacing: '.15rem' }}>★★★★★</div>
                <p style={{ margin: '.4rem 0' }}>“Me encantó el fit y la variedad de modelos pensados para bailarines.”</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.75 }}>— Sofía, MTY</p>
              </div>
            </div>
          </motion.section>

          {/* Compromiso de la marca (antes Sustentabilidad) */}
          <motion.section
            className="glass-card-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.12 }}
            style={{ textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0ea5e9, #22c55e)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.3rem',
                boxShadow: '0 8px 24px rgba(14,165,233,0.35)'
              }}>
                🌿
              </div>
              <div>
                <h3 className="section-title" style={{ margin: 0 }}>Compromiso con la calidad</h3>
                <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: '0.25rem 0 0 0' }}>
                  Cómo se fabrican las piezas y qué las hace especiales
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, background: 'rgba(255,255,255,.03)', padding: '1rem' }}>
                <h4 style={{ margin: '.2rem 0 .4rem 0' }}>Materiales pensados para bailar</h4>
                <p style={{ fontSize: '0.9rem', opacity: 0.78 }}>Tejidos con buena transpiración, suavidad al tacto y libertad de movimiento para socials y clases.</p>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, background: 'rgba(255,255,255,.03)', padding: '1rem' }}>
                <h4 style={{ margin: '.2rem 0 .4rem 0' }}>Producción responsable</h4>
                <p style={{ fontSize: '0.9rem', opacity: 0.78 }}>Trabajamos con talleres locales y lotes pequeños para reducir desperdicio y priorizar el detalle.</p>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, background: 'rgba(255,255,255,.03)', padding: '1rem' }}>
                <h4 style={{ margin: '.2rem 0 .4rem 0' }}>Envíos y empaques conscientes</h4>
                <p style={{ fontSize: '0.9rem', opacity: 0.78 }}>Empaques compactos y reutilizables, pensados para cuidar tus prendas y el planeta.</p>
              </div>
            </div>
          </motion.section>

          {/* FAQ */}
          <motion.section
            className="glass-card-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.14 }}
            style={{ textAlign: 'left' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.3rem',
                boxShadow: '0 8px 24px rgba(248,113,113,0.35)'
              }}>
                ❓
              </div>
              <div>
                <h3 className="section-title" style={{ margin: 0 }}>Preguntas frecuentes</h3>
                <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: '0.25rem 0 0 0' }}>
                  Respuestas rápidas sobre envíos, cambios y cuidado de tus prendas
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '.6rem' }}>
              <details style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, background: 'rgba(255,255,255,.03)', padding: '.6rem 1rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>¿Cuánto tardan los envíos?</summary>
                <div style={{ margin: '.5rem 0 .2rem', color: 'rgba(255,255,255,.75)', fontSize: '0.9rem' }}>
                  En promedio 2–5 días hábiles dentro de México. Algunos drops especiales pueden especificar tiempos distintos.
                </div>
              </details>
              <details style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, background: 'rgba(255,255,255,.03)', padding: '.6rem 1rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>¿Puedo cambiar una talla?</summary>
                <div style={{ margin: '.5rem 0 .2rem', color: 'rgba(255,255,255,.75)', fontSize: '0.9rem' }}>
                  Sí, contamos con ventana de cambios. Revisa las políticas de la marca más arriba para ver el detalle de días y condiciones.
                </div>
              </details>
              <details style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, background: 'rgba(255,255,255,.03)', padding: '.6rem 1rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>¿Cómo cuido mis prendas?</summary>
                <div style={{ margin: '.5rem 0 .2rem', color: 'rgba(255,255,255,.75)', fontSize: '0.9rem' }}>
                  Recomendamos lavar en frío, ciclo suave y secado a la sombra. Para prendas de baile, evita suavizantes fuertes para mantener la estructura.
                </div>
              </details>
            </div>
          </motion.section>

          {/* Beneficios / Políticas */}
          {(policies?.shipping || policies?.returns || policies?.warranty) && (
            <motion.section
              className="glass-card-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: 0.12 }}
              style={{ textAlign: 'left' }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                marginBottom: '1.5rem' 
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #1E88E5, #00BCD4)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '1.5rem',
                  boxShadow: '0 8px 24px rgba(30, 136, 229, 0.4)'
                }}>
                  🔒
                </div>
                <div>
                  <h3 className="section-title" style={{ margin: 0 }}>Políticas de la Marca</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: '0.25rem 0 0 0' }}>
                    Envíos, cambios y garantías
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {policies?.shipping && (
                  <div style={{ 
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ 
                      fontWeight: '700', 
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '1rem'
                    }}>
                      📦 Envíos
                    </div>
                    <div style={{ fontSize: '0.95rem', opacity: 0.9, lineHeight: '1.6' }}>
                      {policies.shipping}
                    </div>
                  </div>
                )}
                {policies?.returns && (
                  <div style={{ 
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ 
                      fontWeight: '700', 
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '1rem'
                    }}>
                      🔄 Cambios y Devoluciones
                    </div>
                    <div style={{ fontSize: '0.95rem', opacity: 0.9, lineHeight: '1.6' }}>
                      {policies.returns}
                    </div>
                  </div>
                )}
                {policies?.warranty && (
                  <div style={{ 
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ 
                      fontWeight: '700', 
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '1rem'
                    }}>
                      ✅ Garantía
                    </div>
                    <div style={{ fontSize: '0.95rem', opacity: 0.9, lineHeight: '1.6' }}>
                      {policies.warranty}
                    </div>
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* Partners / Colabs */}
          {partners.length > 0 && (
            <motion.section
              className="glass-card-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: 0.14 }}
            >
              <h3 className="section-title">🤝 Colaboraciones</h3>
              <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                {partners.map((p: any) => (
                  <a key={p.id} href={p.href} style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '.45rem .7rem', background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                    <img src={p.logo_url} alt={p.name} style={{ width: 22, height: 22, borderRadius: '50%' }} />
                    <span>{p.name}</span>
                  </a>
                ))}
              </div>
            </motion.section>
          )}

          {/* Conversión / CTA */}
          {(conversion?.headline || conversion?.subtitle || (Array.isArray(conversion?.coupons) && conversion.coupons.length > 0)) && (
            <motion.section
              className="glass-card-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: 0.16 }}
              style={{ textAlign: 'left' }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                marginBottom: '1.5rem' 
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #FB8C00, #FF7043)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '1.5rem',
                  boxShadow: '0 8px 24px rgba(251, 140, 0, 0.4)'
                }}>
                  🎁
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="section-title" style={{ margin: 0 }}>
                    {conversion?.headline || 'Promoción Especial'}
                  </h3>
                  {conversion?.subtitle && (
                    <p style={{ fontSize: '0.95rem', opacity: 0.85, margin: '0.25rem 0 0 0' }}>
                      {conversion.subtitle}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Cupones */}
              {Array.isArray(conversion?.coupons) && conversion.coupons.length > 0 && (
                <div style={{ 
                  padding: '1rem',
                  background: 'rgba(251, 140, 0, 0.08)',
                  border: '2px solid rgba(251, 140, 0, 0.2)',
                  borderRadius: '12px',
                  marginBottom: '1rem'
                }}>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: '600', 
                    opacity: 0.7, 
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    🎟️ Cupones Disponibles
                  </div>
                  <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
                    {conversion.coupons.map((c:string) => (
                      <span key={c} style={{ 
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 255, 255, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '20px',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        letterSpacing: '0.05em'
                      }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón de contacto */}
              {((brand as any)?.redes_sociales?.whatsapp) && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <a 
                    href={`https://wa.me/${String((brand as any).redes_sociales.whatsapp).replace(/\D+/g,'')}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ 
                      padding: '0.875rem 1.75rem', 
                      borderRadius: 999, 
                      border: 'none', 
                      background: 'linear-gradient(135deg, #25D366, #128C7E)', 
                      color: '#fff', 
                      fontWeight: 900,
                      fontSize: '1rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 16px rgba(37, 211, 102, 0.4)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    💬 Contactar por WhatsApp
                  </a>
                </div>
              )}
            </motion.section>
          )}

        </div>
      </div>
    </>
  );
}

// Subcomponentes para catálogo y guía de tallas
function CatalogTabs({
  items = [] as any[],
  labels,
}: {
  items?: any[];
  labels?: { calzado?: string; ropa?: string; accesorios?: string };
}) {
  const [tab, setTab] = React.useState<'calzado' | 'ropa' | 'accesorios'>('calzado');
  const filtered = items.filter((i: any) => i.category === tab);
  const tabs = ['calzado', 'ropa', 'accesorios'] as const;

  const textMuted = '#b4b8cc';
  const accent = '#ff2fb3';
  const accentAlt = '#24d68a';
  const chipBg = '#1b1630';
  const chipDama = '#f97316';
  const chipCaballero = '#3b82f6';

  const tabBase: React.CSSProperties = {
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '8px 24px',
    background: '#0b0c16',
    color: textMuted,
    fontSize: '0.9rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    transition: 'all 0.18s ease-out',
  };

  const card: React.CSSProperties = {
    borderRadius: 24,
    overflow: 'hidden',
    background: 'radial-gradient(circle at top, #151520, #070711)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    boxShadow: '0 18px 45px rgba(0,0,0,0.55)',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 350,
    width: '100%',
    margin: '0 auto',
    transition: 'transform 0.18s ease-out, box-shadow 0.18s ease-out, border-color 0.18s ease-out',
  };

  const imageShell: React.CSSProperties = {
    background: '#03030a',
    padding: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 210,
    overflow: 'visible',
    boxSizing: 'border-box',
  };

  const bodyShell: React.CSSProperties = {
    padding: '16px 18px 14px',
    background: '#111321',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  const chipBase: React.CSSProperties = {
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: '0.8rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: chipBg,
    color: textMuted,
  };

  const sizePill: React.CSSProperties = {
    border: '1px solid rgba(148,163,184,0.7)',
    borderRadius: 999,
    padding: '.25rem .6rem',
    fontSize: '.8rem',
    fontWeight: '600',
    width: 'fit-content',
  };

  const muted: React.CSSProperties = {
    color: 'rgba(148,163,184,.9)',
    margin: 0,
    textAlign: 'center',
    padding: '2rem',
  };

  const getTabLabel = (t: (typeof tabs)[number]) => {
    if (t === 'calzado') return labels?.calzado || 'Calzado';
    if (t === 'ropa') return labels?.ropa || 'Ropa';
    return labels?.accesorios || 'Accesorios';
  };

  const getTabIcon = (t: (typeof tabs)[number]) =>
    t === 'calzado' ? '👠' : t === 'ropa' ? '👕' : '💍';

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {tabs.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...tabBase,
                ...(active
                  ? {
                      background:
                        'radial-gradient(circle at top left, #ff2fb3, #ff5b79)',
                      color: '#ffffff',
                      boxShadow: '0 10px 30px rgba(255,47,179,0.55)',
                      borderColor: 'transparent',
                    }
                  : {}),
              }}
            >
              <span style={{ fontSize: '1rem' }}>{getTabIcon(t)}</span>
              {getTabLabel(t)}
            </button>
          );
        })}
      </div>
      {filtered.length === 0 ? (
        <p style={muted}>Sin productos en esta categoría.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
            gap: 18,
          }}
        >
          {filtered.map((p: any) => (
            <article
              key={p.id}
              style={card}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow =
                  '0 26px 60px rgba(0,0,0,0.75)';
                (e.currentTarget as HTMLElement).style.borderColor =
                  'rgba(255,255,255,0.16)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow =
                  '0 18px 45px rgba(0,0,0,0.55)';
                (e.currentTarget as HTMLElement).style.borderColor =
                  'rgba(255,255,255,0.06)';
              }}
            >
              <div style={imageShell}>
                <div style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)', minHeight: 210 }}>
                  <ImageWithFallback
                    src={p.image}
                    alt={p.name}
                    sizes="(max-width: 768px) 100vw, 360px"
                    style={{
                      width: '100%',
                      height: '100%',
                      minWidth: 0,
                      minHeight: 0,
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      display: 'block'
                    }}
                  />
                </div>
              </div>
              <div style={bodyShell}>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {p.name || 'Producto sin nombre'}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginTop: 6,
                    gap: 10,
                  }}
                >
                  {p.price && (
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: accentAlt,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.price}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {p.gender && (
                    <span
                      style={{
                        ...chipBase,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background:
                            p.gender === 'caballero'
                              ? chipCaballero
                              : p.gender === 'dama'
                              ? chipDama
                              : accent,
                        }}
                      />
                      {p.gender === 'caballero'
                        ? 'Caballero'
                        : p.gender === 'dama'
                        ? 'Dama'
                        : 'Unisex'}
                    </span>
                  )}
                </div>

                {Array.isArray(p.sizes) && p.sizes.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '.4rem',
                      flexWrap: 'wrap',
                      marginTop: '.6rem',
                    }}
                  >
                    {p.sizes.slice(0, 6).map((s: string) => (
                      <span key={s} style={sizePill}>
                        {s}
                      </span>
                    ))}
                    {p.sizes.length > 6 && (
                      <span style={sizePill}>+{p.sizes.length - 6}</span>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function SizeGuide({ rows = [] as { mx:string; us:string; eu:string }[] }){
  const data = rows.length > 0 ? rows : [
    { mx:'22', us:'5', eu:'35' },
    { mx:'23', us:'6', eu:'36-37' },
    { mx:'24', us:'7', eu:'38' },
    { mx:'25', us:'8', eu:'39-40' },
    { mx:'26', us:'9', eu:'41-42' },
  ];
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '.75rem', background: 'rgba(255,255,255,0.05)' }}>
      <b>Equivalencias (Calzado)</b>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.35rem', marginTop: '.5rem', fontSize: '.92rem' }}>
        <div>MX</div><div>US</div><div>EU</div>
        {data.map((r, i) => (
          <React.Fragment key={i}>
            <div>{r.mx}</div><div>{r.us}</div><div>{r.eu}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function FitTips({ tips = [] as { style:string; tip:string }[] }){
  const data = tips.length > 0 ? tips : [
    { style: 'Bachata', tip: 'Tacón estable, suela flexible, punta reforzada.' },
    { style: 'Salsa', tip: 'Mayor soporte lateral, giro suave (suela gamuza).' },
    { style: 'Kizomba', tip: 'Confort prolongado, amortiguación talón.' },
  ];
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '.75rem', background: 'rgba(255,255,255,0.05)' }}>
      <b>Fit recomendado por estilo</b>
      <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1rem', lineHeight: 1.6 }}>
        {data.map((it, i) => (
          <li key={i}><b>{it.style}:</b> {it.tip}</li>
        ))}
      </ul>
    </div>
  );
}

