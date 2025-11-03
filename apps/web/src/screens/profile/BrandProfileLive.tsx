import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import ImageWithFallback from "../../components/ImageWithFallback";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import { colors, typography, spacing, borderRadius } from "../../theme/colors";
import { useMyBrand } from "../../hooks/useBrand";

export default function BrandProfileLive() {
  const navigate = useNavigate();
  const { data: brand, isLoading } = useMyBrand();

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

  // Normalizaciones simples para catálogo / lookbook (opcional)
  const productos: any[] = Array.isArray((brand as any)?.productos) ? ((brand as any).productos as any[]) : [];
  const featured = productos.map((p: any) => ({
    id: p.id || Math.random().toString(36).slice(2),
    name: p.titulo || 'Producto',
    price: typeof p.precio === 'number' ? `$${p.precio.toLocaleString()}` : (p.precio || ''),
    image: p.imagen_url,
    category: (p.categoria || p.category || 'ropa') as 'calzado'|'ropa'|'accesorios',
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
  }));
  const lookbook = media.map((url, i) => ({ id: i, image: url, caption: '', style: '' }));
  const policies = (brand as any)?.policies || { shipping: undefined as any, returns: undefined as any, warranty: undefined as any };
  const sizeGuideRows = Array.isArray((brand as any)?.size_guide) ? (brand as any).size_guide : [];
  const fitTipsRows = Array.isArray((brand as any)?.fit_tips) ? (brand as any).fit_tips : [];
  const conversion = (brand as any)?.conversion || {};
  const partners: any[] = [];

  return (
    <>
      <style>{`
        .section-title {
          font-size: 1.5rem; font-weight: 800; margin: 0 0 1rem 0;
          background: linear-gradient(135deg, #E53935 0%, #FB8C00 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          display: flex; align-items: center; gap: .5rem;
        }
        .profile-container { width: 100%; max-width: 900px; margin: 0 auto; }
        .profile-banner { width: 100%; max-width: 900px; margin: 0 auto; }
        .banner-grid { display: grid; grid-template-columns: auto 1fr; gap: 3rem; align-items: center; }
        .glass-card-container {
          opacity: 1; margin-bottom: 2rem; padding: 2rem; text-align: center;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: rgba(0, 0, 0, 0.3) 0px 8px 32px; backdrop-filter: blur(10px);
        }
        @media (max-width: 768px) {
          .profile-container { max-width: 100% !important; padding: 1rem !important; }
          .profile-banner { border-radius: 0 !important; padding: 1.5rem 1rem !important; margin: 0 !important; }
          .banner-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; justify-items: center !important; text-align: center !important; }
          .banner-avatar { width: 150px !important; height: 150px !important; }
          .glass-card-container { padding: 1rem !important; margin-bottom: 1rem !important; border-radius: 16px !important; }
          .section-title { font-size: 1.25rem !important; margin-bottom: 1rem !important; }
        }
        @media (max-width: 480px) {
          .banner-avatar { width: 120px !important; height: 120px !important; }
          .section-title { font-size: 1.1rem !important; }
          .glass-card-container { padding: 0.75rem !important; border-radius: 12px !important; }
        }
      `}</style>

      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: colors.darkBase, color: colors.light }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <ProfileNavigationToggle currentView="live" profileType="brand" />
        </div>

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
              <ImageWithFallback src={portadaUrl} alt="portada" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          <div className="banner-grid" style={{ position: 'relative' }}>
            {/* Avatar */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="banner-avatar" style={{ width: '250px', height: '250px', borderRadius: '50%', overflow: 'hidden', border: '6px solid rgba(255,255,255,0.9)', boxShadow: '0 12px 40px rgba(0,0,0,0.8)', background: colors.gradients.primary }}>
                {avatarUrl ? (
                  <ImageWithFallback src={avatarUrl} alt="avatar marca" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '3rem' }}>🏷️</div>
                )}
              </div>
            </div>

            {/* Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center' }}>
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900 }}>{(brand as any).nombre_publico || (brand as any).nombre || 'Marca'}</h1>
              {(brand as any).slogan && (
                <p style={{ opacity: .9, margin: '4px 0' }}>{(brand as any).slogan}</p>
              )}
              {(brand as any).descripcion && (
                <p style={{ opacity: .95, lineHeight: 1.6, marginTop: '.25rem' }}>{(brand as any).descripcion}</p>
              )}
              {((brand as any)?.redes_sociales) && (
                <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
                  {((brand as any).redes_sociales.instagram) && <a href={(brand as any).redes_sociales.instagram} target="_blank" rel="noreferrer" style={{ color: '#fff' }}>📸 Instagram</a>}
                  {((brand as any).redes_sociales.tiktok) && <a href={(brand as any).redes_sociales.tiktok} target="_blank" rel="noreferrer" style={{ color: '#fff' }}>🎵 TikTok</a>}
                  {((brand as any).redes_sociales.web) && <a href={(brand as any).redes_sociales.web} target="_blank" rel="noreferrer" style={{ color: '#fff' }}>🌐 Sitio</a>}
                  {((brand as any).redes_sociales.whatsapp) && <a href={`https://wa.me/${String((brand as any).redes_sociales.whatsapp).replace(/\D+/g,'')}`} target="_blank" rel="noreferrer" style={{ color: '#fff' }}>💬 WhatsApp</a>}
                </div>
              )}
              {((brand as any)?.estado_aprobacion === 'aprobado') ? (
                <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(46, 204, 113, 0.18)', border: '1px solid rgba(46,204,113,0.35)', color: '#2ecc71', fontWeight: 800, fontSize: 12, alignSelf: 'center' }}>✅ Verificado</span>
              ) : (
                (brand as any)?.estado_aprobacion && (
                  <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(255, 215, 0, 0.14)', border: '1px solid rgba(255,215,0,0.35)', color: '#ffd700', fontWeight: 800, fontSize: 12, alignSelf: 'center' }}>{`⏳ ${(brand as any).estado_aprobacion}`}</span>
                )
              )}
            </div>
          </div>
        </motion.section>

        {/* Contenido principal */}
        <div className="profile-container" style={{ padding: '2rem', margin: '0 auto' }}>
          {/* Catálogo */}
          <motion.section
            className="glass-card-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.05 }}
          >
            <h3 className="section-title">🛍️ Catálogo</h3>
            <CatalogTabs items={featured} />
          </motion.section>

          {/* Guía de tallas y FIT */}
          <motion.section
            className="glass-card-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.08 }}
          >
            <h3 className="section-title">📏 Guía de tallas y ajuste</h3>
            <p style={{ color: 'rgba(255,255,255,.78)', margin: 0 }}>Consulta tus medidas y recomendaciones por estilo.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '.9rem', marginTop: '.9rem' }}>
              <SizeGuide rows={sizeGuideRows} />
              <FitTips tips={fitTipsRows} />
            </div>
          </motion.section>

          {/* Lookbook */}
          {lookbook.length > 0 && (
            <motion.section
              className="glass-card-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: 0.1 }}
            >
              <h3 className="section-title">🎥 Lookbook en vivo</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '.9rem' }}>
                {lookbook.map((ph: any) => (
                  <div key={ph.id} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '.75rem', background: 'rgba(255,255,255,0.05)' }}>
                    <ImageWithFallback src={ph.image} alt={ph.caption || ''} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 12 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.5rem' }}>
                      <span style={{ fontWeight: 700 }}>{ph.style || ''}</span>
                      {ph.video_url && <a href={ph.video_url} target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }}>▶ Ver reel</a>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Beneficios / Políticas */}
          <motion.section
            className="glass-card-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.12 }}
          >
            <h3 className="section-title">🔒 Envíos, cambios y garantías</h3>
            <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: 1.6 }}>
              <li><b>Envíos:</b> {policies?.shipping || 'Nacionales 2–5 días hábiles.'}</li>
              <li><b>Cambios/Devoluciones:</b> {policies?.returns || 'Dentro de 15 días (sin uso, en caja).'}</li>
              <li><b>Garantía:</b> {policies?.warranty || '30 días por defectos de fabricación.'}</li>
            </ul>
          </motion.section>

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
          <motion.section
            className="glass-card-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.16 }}
          >
            <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontWeight: 900 }}>🎁 {conversion?.headline || 'Promoción activa'}</span>
              {conversion?.subtitle && <span style={{ opacity: .85 }}>{conversion.subtitle}</span>}
              {Array.isArray(conversion?.coupons) && conversion.coupons.length > 0 && (
                <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
                  {conversion.coupons.map((c:string) => (
                    <span key={c} style={{ border:'1px solid rgba(255,255,255,0.2)', borderRadius:999, padding:'.25rem .6rem' }}>
                      <b>{c}</b>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                {((brand as any)?.redes_sociales?.whatsapp) && (
                  <a href={`https://wa.me/${String((brand as any).redes_sociales.whatsapp).replace(/\D+/g,'')}`} target="_blank" rel="noreferrer" style={{ padding: '.65rem 1rem', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)', background: 'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))', color: '#fff', fontWeight: 900 }}>💬 WhatsApp</a>
                )}
              </div>
            </div>
          </motion.section>

          {/* Redes Sociales */}
          {(brand as any)?.redes_sociales && (
            <motion.section
              className="glass-card-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
            >
              <h3 className="section-title">🌐 Redes Sociales</h3>
              <SocialMediaSection redes_sociales={(brand as any).redes_sociales} />
            </motion.section>
          )}

          {/* Galería */}
          {media.length > 0 && (
            <motion.section
              className="glass-card-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.18 }}
            >
              <h3 className="section-title">📷 Galería</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {media.map((url, i) => (
                  <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,.12)' }}>
                    <ImageWithFallback src={url} alt={`media-${i}`} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </>
  );
}

// Subcomponentes rápidos para catálogo y guía de tallas
function CatalogTabs({ items = [] as any[] }: { items?: any[] }){
  const [tab, setTab] = React.useState<'calzado'|'ropa'|'accesorios'>('calzado');
  const filtered = items.filter((i: any) => i.category === tab);
  const tabs = ['calzado','ropa','accesorios'] as const;
  const btnPrimary: React.CSSProperties = { padding: '.65rem 1rem', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)', background: 'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))', color: '#fff', fontWeight: 900, cursor: 'pointer' };
  const btnGhost: React.CSSProperties = { padding: '.65rem 1rem', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 800, cursor: 'pointer' };
  const prodCard: React.CSSProperties = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '.75rem', background: 'rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', alignItems:'center' };
  const sizePill: React.CSSProperties = { border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '.15rem .45rem', fontSize: '.82rem' };
  const muted: React.CSSProperties = { color: 'rgba(255,255,255,.78)', margin: 0 };
  return (
    <div>
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem', flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={t === tab ? btnPrimary : btnGhost}>{t[0].toUpperCase()+t.slice(1)}</button>
        ))}
      </div>
      {filtered.length === 0 ? <p style={muted}>Sin productos en esta categoría.</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '.9rem' }}>
          {filtered.map((p: any) => (
            <article key={p.id} style={prodCard}>
              <ImageWithFallback src={p.image} alt={p.name} style={{ width: 350, maxWidth:'100%', height: 'auto', borderRadius: 12 }} />
              <div style={{ marginTop: '.6rem' }}>
                <div style={{ fontWeight: 800 }}>{p.name}</div>
                <div style={{ opacity: .85, margin: '.15rem 0' }}>{p.price}</div>
                {Array.isArray(p.sizes) && p.sizes.length > 0 && (
                  <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', margin: '.35rem 0' }}>
                    {p.sizes.slice(0,6).map((s: string) => (<span key={s} style={sizePill}>{s}</span>))}
                    {p.sizes.length > 6 && <span style={sizePill}>+{p.sizes.length - 6}</span>}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <button style={btnPrimary}>Ver detalles</button>
                  <button style={btnGhost}>Guardar</button>
                </div>
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

