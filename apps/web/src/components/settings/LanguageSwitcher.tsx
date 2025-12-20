import React from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const portalRef = React.useRef<HTMLDivElement>(null);
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null);

  const handleLanguageChange = React.useCallback((lang: 'es' | 'en') => {
    if (import.meta.env.DEV) {
      console.log('[LanguageSwitcher] Cambiando idioma a:', lang);
    }
    setLanguage(lang);
    setIsOpen(false);
  }, [setLanguage]);

  const currentLang = React.useMemo(() => {
    const i18nLang = (i18n.language?.split('-')[0] || 'es') as 'es' | 'en';
    return i18nLang;
  }, [i18n.language]);

  const displayLanguage = currentLang || language;
  const isSpanish = displayLanguage === 'es';

  const updateAnchor = React.useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    setAnchorRect(el.getBoundingClientRect());
  }, []);

  // Recalcular posición del dropdown al abrir / resize / scroll
  React.useEffect(() => {
    if (!isOpen) return;
    updateAnchor();

    const onWinChange = () => updateAnchor();
    window.addEventListener('resize', onWinChange);
    // Capturing para que funcione incluso en contenedores con scroll
    window.addEventListener('scroll', onWinChange, true);
    return () => {
      window.removeEventListener('resize', onWinChange);
      window.removeEventListener('scroll', onWinChange, true);
    };
  }, [isOpen, updateAnchor]);

  // Cerrar dropdown al hacer click fuera (considerando portal)
  React.useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      const btn = buttonRef.current;
      const portal = portalRef.current;
      if (!target) return;
      if (btn && btn.contains(target)) return;
      if (portal && portal.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const languages = [
    { code: 'en' as const, label: 'ENGLISH', flag: '🇺🇸' },
    { code: 'es' as const, label: 'ESPAÑOL', flag: '🇲🇽' },
  ];

  const currentLanguage = languages.find(lang => lang.code === displayLanguage) || languages[0];

  const portalStyle = React.useMemo(() => {
    if (!anchorRect) return { display: 'none' as const };
    const minWidth = 180;
    const gap = 8;
    const estimatedMenuHeight = 110; // 2 opciones + padding

    const preferredTop = anchorRect.bottom + gap;
    const fitsBelow = preferredTop + estimatedMenuHeight <= window.innerHeight;
    const top = fitsBelow ? preferredTop : Math.max(8, anchorRect.top - gap - estimatedMenuHeight);

    const left = Math.min(
      Math.max(8, anchorRect.right - minWidth),
      Math.max(8, window.innerWidth - minWidth - 8)
    );

    return {
      position: 'fixed' as const,
      top,
      left,
      zIndex: 10000,
      minWidth,
    };
  }, [anchorRect]);

  return (
    <>
      <style>{`
        .lang-switcher {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .lang-switcher__button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          background: transparent;
          color: #ffffff;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          box-shadow: none;
        }

        .lang-switcher__button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.45);
          transform: translateY(-1px);
        }

        .lang-switcher__button:active {
          transform: translateY(0) scale(0.98);
        }

        .lang-switcher__button[aria-expanded="true"] {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .lang-switcher__button-icon {
          font-size: 8px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: #666;
          font-weight: 900;
        }

        .lang-switcher__button[aria-expanded="true"] .lang-switcher__button-icon {
          transform: rotate(180deg);
          color: #333;
        }

        .lang-switcher__flag {
          font-size: 16px;
          line-height: 1;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .lang-switcher__dropdown {
          position: relative;
          min-width: 200px;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.15),
            0 8px 16px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          opacity: 0;
          transform: translateY(-12px) scale(0.96);
          pointer-events: none;
          transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), 
                      transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .lang-switcher__dropdown[data-open="true"] {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .lang-switcher__dropdown::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(0, 0, 0, 0.05) 50%, 
            transparent 100%);
        }

        .lang-switcher__option {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border: none;
          background: transparent;
          color: #1a1a1a;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          text-align: left;
          position: relative;
        }

        .lang-switcher__option::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(135deg, #E53935 0%, #FB8C00 100%);
          transform: scaleY(0);
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .lang-switcher__option:hover {
          background: linear-gradient(90deg, 
            rgba(229, 57, 53, 0.06) 0%, 
            rgba(251, 140, 0, 0.04) 100%);
        }

        .lang-switcher__option:hover::before {
          transform: scaleY(1);
        }

        .lang-switcher__option:active {
          background: linear-gradient(90deg, 
            rgba(229, 57, 53, 0.1) 0%, 
            rgba(251, 140, 0, 0.08) 100%);
          transform: scale(0.98);
        }

        .lang-switcher__option[data-selected="true"] {
          background: linear-gradient(90deg, 
            rgba(229, 57, 53, 0.08) 0%, 
            rgba(251, 140, 0, 0.06) 100%);
          font-weight: 700;
        }

        .lang-switcher__option[data-selected="true"]::before {
          transform: scaleY(1);
        }

        .lang-switcher__option-flag {
          font-size: 24px;
          line-height: 1;
          flex-shrink: 0;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
          transition: transform 0.2s ease;
        }

        .lang-switcher__option:hover .lang-switcher__option-flag {
          transform: scale(1.1);
        }

        .lang-switcher__option-label {
          flex: 1;
          letter-spacing: 0.5px;
        }

        .lang-switcher__option-check {
          color: #10b981;
          font-size: 18px;
          flex-shrink: 0;
          font-weight: 900;
          filter: drop-shadow(0 1px 2px rgba(16, 185, 129, 0.3));
          animation: checkmarkPop 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes checkmarkPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .lang-switcher__button {
            padding: 4px 8px;
            font-size: 10px;
            gap: 4px;
            border-radius: 8px;
          }

          .lang-switcher__flag {
            font-size: 14px;
          }

          .lang-switcher__button-icon {
            font-size: 7px;
          }

          .lang-switcher__dropdown {
            min-width: 160px;
          }

          .lang-switcher__option {
            padding: 10px 14px;
            font-size: 11px;
            gap: 10px;
          }

          .lang-switcher__option-flag {
            font-size: 18px;
          }
        }

        @media (max-width: 480px) {
          .lang-switcher__button {
            padding: 3px 6px;
            font-size: 9px;
            gap: 3px;
            border-radius: 6px;
          }

          .lang-switcher__flag {
            font-size: 12px;
          }

          .lang-switcher__button-icon {
            font-size: 6px;
          }

          .lang-switcher__dropdown {
            min-width: 140px;
          }

          .lang-switcher__option {
            padding: 8px 12px;
            font-size: 10px;
            gap: 8px;
          }

          .lang-switcher__option-flag {
            font-size: 16px;
          }
        }
      `}</style>
      <div
        className="lang-switcher"
        ref={rootRef}
        role="group"
        aria-label={t('language')}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const next = !isOpen;
            setIsOpen(next);
            if (next) {
              // Asegura medir con layout ya pintado
              requestAnimationFrame(() => updateAnchor());
            }
          }}
          className="lang-switcher__button"
          ref={buttonRef}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label={t('language')}
        >
          <span className="lang-switcher__flag">{currentLanguage.flag}</span>
          <span className="lang-switcher__button-icon">▼</span>
        </button>
        {isOpen && typeof document !== 'undefined' && createPortal(
          <div
            ref={portalRef}
            style={portalStyle}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div
              className="lang-switcher__dropdown"
              data-open="true"
              role="menu"
            >
              {languages.map((lang) => {
                const isSelected = lang.code === displayLanguage;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLanguageChange(lang.code);
                    }}
                    className="lang-switcher__option"
                    role="menuitem"
                    data-selected={isSelected}
                    aria-label={lang.code === 'es' ? t('spanish') : t('english')}
                    aria-checked={isSelected}
                  >
                    <span className="lang-switcher__option-flag">{lang.flag}</span>
                    <span className="lang-switcher__option-label">{lang.label}</span>
                    {isSelected && (
                      <span className="lang-switcher__option-check">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
      </div>
    </>
  );
}

export { LanguageSwitcher };
export default LanguageSwitcher;
