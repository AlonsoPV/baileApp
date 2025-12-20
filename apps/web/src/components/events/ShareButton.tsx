import React from "react";
import * as ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

interface ShareButtonProps {
  url: string;
  title?: string;
  text?: string;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

export default function ShareButton({
  url,
  title,
  text,
  style,
  className,
  children
}: ShareButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const safeUrl = React.useMemo(() => {
    try {
      const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : undefined);
      return u.toString();
    } catch {
      return url;
    }
  }, [url]);

  const onShare = async () => {
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({
          url: safeUrl,
          title: title || t('share_event'),
          text: text || t('check_out_event')
        });
        return;
      } catch (error: any) {
        // Si usuario cancela, no abrir fallback; si es error de soporte, abrimos fallback
        if (error?.name === 'AbortError' || error?.message?.includes('cancel')) return;
      }
    }
    setOpen(true);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(safeUrl);
      alert(t('link_copied'));
      setOpen(false);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = safeUrl;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert(t('link_copied'));
        setOpen(false);
      } catch {}
    }
  };

  const openWin = (href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onShare}
      style={{
        padding: '12px 24px',
        borderRadius: '25px',
        border: 'none',
        background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
        color: colors.light,
        fontSize: '1rem',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(30, 136, 229, 0.3)',
        transition: 'all 0.2s ease',
        ...style
      }}
      className={className}
    >
      {children || (
        <>
          <span>📤</span>
          <span>{t('share')}</span>
        </>
      )}
      {open && typeof document !== 'undefined' && ReactDOM.createPortal(
        (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
              display: 'grid', placeItems: 'center', zIndex: 9999
            }}
            onClick={() => setOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 320, maxWidth: '92vw', padding: 16,
                borderRadius: 14, background: '#101418',
                border: '1px solid rgba(255,255,255,0.12)', color: '#e5e7eb',
                boxShadow: '0 12px 40px rgba(0,0,0,0.45)'
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 12 }}>{t('share')}</div>
              <div style={{ display: 'grid', gap: 8 }}>
                <button onClick={copyLink} style={{ padding: 10, borderRadius: 10, border: '1px solid #2a2f36', background: 'transparent', color: '#93c5fd', cursor: 'pointer' }}>{t('copy_link')}</button>
                <button onClick={() => openWin(`https://api.whatsapp.com/send?text=${encodeURIComponent((title || '') + ' ' + safeUrl)}`)} style={{ padding: 10, borderRadius: 10, border: '1px solid #2a2f36', background: 'transparent', color: '#93c5fd', cursor: 'pointer' }}>WhatsApp</button>
                <button onClick={() => openWin(`https://twitter.com/intent/tweet?url=${encodeURIComponent(safeUrl)}&text=${encodeURIComponent(title || '')}`)} style={{ padding: 10, borderRadius: 10, border: '1px solid #2a2f36', background: 'transparent', color: '#93c5fd', cursor: 'pointer' }}>Twitter / X</button>
                <button onClick={() => openWin(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(safeUrl)}`)} style={{ padding: 10, borderRadius: 10, border: '1px solid #2a2f36', background: 'transparent', color: '#93c5fd', cursor: 'pointer' }}>Facebook</button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}
    </motion.button>
  );
}
