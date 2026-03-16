import React, { useRef, useCallback } from "react";
import { Smartphone, Check, MapPin, Music, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { landingContent } from "@/config/content";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config/links";
import { track, LANDING_EVENTS } from "@/lib/track";
import { Modal } from "@/components/ui/Modal";
import EventCard from "@/components/explore/cards/EventCard";
import { SEO_LOGO_URL } from "@/lib/seoConfig";
import "@/components/explore/cards/Card.css";

const { hero } = landingContent;

const BADGE_ICONS = [Check, MapPin, Music, Zap] as const;

/** Mock para el slider del hero: misma forma que EventCard (item.__ui) — diseño idéntico a EventCard */
const HERO_MOCK_SLIDER_EVENTS = [
  { id: 0, nombre: "Salsa Night", hora_inicio: "21:00", __ui: { flyerUrl: undefined, fechaYmd: "2025-03-14", costoMonto: 0, hasDiscount: false, lugarNombre: "Roma Norte" } },
  { id: 0, nombre: "Bachata Night", hora_inicio: "20:30", __ui: { flyerUrl: undefined, fechaYmd: "2025-03-15", costoMonto: 0, hasDiscount: false, lugarNombre: "Condesa" } },
  { id: 0, nombre: "Kizomba Night", hora_inicio: "19:00", __ui: { flyerUrl: undefined, fechaYmd: "2025-03-16", costoMonto: 0, hasDiscount: false, lugarNombre: "Polanco" } },
];

interface HeroProps {
  onOpenDownload: () => void;
  onOpenB2B: () => void;
}

export function Hero({ onOpenDownload }: HeroProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleDownloadClick = () => {
    track(LANDING_EVENTS.CTA_DOWNLOAD, { location: "hero" });
    onOpenDownload();
  };

  const scrollSlider = useCallback((dir: "prev" | "next") => {
    const el = sliderRef.current;
    if (!el) return;
    const firstSlide = el.firstElementChild as HTMLElement | null;
    const slideWidth = firstSlide?.offsetWidth ?? el.clientWidth;
    const gap = 10;
    el.scrollBy({ left: dir === "next" ? slideWidth + gap : -(slideWidth + gap), behavior: "smooth" });
  }, []);

  return (
    <main className="landing-hero bg-grid landing-body-bg min-h-[100dvh] min-h-[100vh] flex flex-col justify-center" id="descargar" aria-label="Presentación principal">
      <div className="landing-container landing-hero__inner relative z-10">
        <div className="landing-hero__row1">
          <div className="landing-hero__col1">
            <div className="landing-hero__kicker">
              <div className="pill">
                <span className="pill-dot" aria-hidden />
                <span>{hero.kicker}</span>
              </div>
            </div>
            <h1 className="landing-hero__title">
              <span className="white">{hero.headlineBefore}</span>
              <span className="landing-hero__title-grad">{hero.headlineGrad}</span>
              <span className="white">{hero.headlineAfter}</span>
            </h1>
            <p className="landing-hero__sub">
              {hero.subheadline}
            </p>
            <div className="landing-hero__ctas">
              <button type="button" className="btn btn-primary" onClick={handleDownloadClick}>
                <Smartphone size={20} strokeWidth={2} aria-hidden />
                {hero.ctaPrimary}
              </button>
            </div>
          </div>
          <div className="landing-hero__col2">
            <div className="hero-mockup" aria-hidden>
              <div className="hero-mockup__device">
                <div className="hero-mockup__screen" style={{ ["--hero-screen-bg" as string]: `url(${SEO_LOGO_URL})` }}>
                  <div className="hero-mockup__slider-wrap">
                    <div className="hero-mockup__slider" ref={sliderRef} role="list" style={{ pointerEvents: "none" }}>
                      {HERO_MOCK_SLIDER_EVENTS.map((item, idx) => (
                        <div key={idx} className="hero-mockup__slide">
                          <EventCard item={item} priority />
                        </div>
                      ))}
                    </div>
                    <nav className="hero-mockup__nav" aria-label="Navegar eventos">
                      <button type="button" className="hero-mockup__nav-btn" onClick={() => scrollSlider("prev")} aria-label="Anterior">
                        <ChevronLeft size={18} strokeWidth={2.5} />
                      </button>
                      <button type="button" className="hero-mockup__nav-btn" onClick={() => scrollSlider("next")} aria-label="Siguiente">
                        <ChevronRight size={18} strokeWidth={2.5} />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ul className="hero-benefits" id="funciones" aria-label="Beneficios de la app">
          {hero.badges.map((badge, i) => {
            const Icon = BADGE_ICONS[i] ?? Check;
            return (
              <li key={badge} className="hero-benefit">
                <span className="hero-benefit__icon" aria-hidden>
                  <Icon size={16} strokeWidth={2.5} />
                </span>
                <span>{badge}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}

function AppleLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L13.792 12l3.906-3.491zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.635z"
        fill="currentColor"
      />
    </svg>
  );
}

export function DownloadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const handleStoreClick = (store: "ios" | "android") => {
    if (store === "android") return; // Android: próximamente
    track(LANDING_EVENTS.CTA_DOWNLOAD, { store });
    window.open(store === "ios" ? APP_STORE_URL : PLAY_STORE_URL, "_blank");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="download-modal-content">
        <p className="download-modal-subtitle">Elige tu plataforma</p>
        <div className="download-modal-buttons">
          <button
            type="button"
            onClick={() => handleStoreClick("ios")}
            className="download-modal-btn download-modal-btn--apple"
            aria-label="Descargar en App Store para iPhone e iPad"
          >
            <span className="download-modal-btn__icon download-modal-btn__icon--apple">
              <AppleLogoIcon />
            </span>
            <span className="download-modal-btn__label">App Store</span>
          </button>
          <button
            type="button"
            disabled
            className="download-modal-btn download-modal-btn--play download-modal-btn--soon"
            aria-label="Google Play próximamente"
          >
            <span className="download-modal-btn__icon download-modal-btn__icon--play">
              <GooglePlayIcon />
            </span>
            <span className="download-modal-btn__label">Google Play</span>
            <span className="download-modal-btn__note">Próximamente</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
