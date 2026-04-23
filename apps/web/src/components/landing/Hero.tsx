import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarRange, Check, MapPin, Music, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { landingContent } from "@/config/content";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config/links";
import { track, LANDING_EVENTS } from "@/lib/track";
import { Modal } from "@/components/ui/Modal";
import EventCard from "@/components/explore/cards/EventCard";
import { useHeroEvents } from "@/hooks/useHeroEvents";
import "@/components/explore/cards/Card.css";

const { hero } = landingContent;

const BADGE_ICONS = [Check, Music] as const;

/** Fallback si aún no hay datos o la query falla — misma forma que EventCard + __ui */
const HERO_SLIDER_FALLBACK: any[] = [
  {
    id: -1,
    nombre: "Salsa Night",
    hora_inicio: "21:00",
    updated_at: "2025-01-01T00:00:00Z",
    __ui: {
      fechaYmd: "2025-03-14",
      horaHm: "21:00",
      lugarNombre: "Roma Norte",
      costoMonto: 0,
      hasDiscount: false,
      ritmosNombres: [],
      flyerUrl: undefined,
      sortKey: "",
    },
  },
  {
    id: -2,
    nombre: "Bachata Night",
    hora_inicio: "20:30",
    updated_at: "2025-01-01T00:00:00Z",
    __ui: {
      fechaYmd: "2025-03-15",
      horaHm: "20:30",
      lugarNombre: "Condesa",
      costoMonto: 0,
      hasDiscount: false,
      ritmosNombres: [],
      flyerUrl: undefined,
      sortKey: "",
    },
  },
  {
    id: -3,
    nombre: "Kizomba Night",
    hora_inicio: "19:00",
    updated_at: "2025-01-01T00:00:00Z",
    __ui: {
      fechaYmd: "2025-03-16",
      horaHm: "19:00",
      lugarNombre: "Polanco",
      costoMonto: 0,
      hasDiscount: false,
      ritmosNombres: [],
      flyerUrl: undefined,
      sortKey: "",
    },
  },
];

interface HeroProps {
  onOpenDownload: () => void;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function Hero({ onOpenDownload }: HeroProps) {
  const { items: fetchedItems } = useHeroEvents();
  const events = fetchedItems.length > 0 ? fetchedItems : HERO_SLIDER_FALLBACK;
  const n = events.length;

  const sliderRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [interactionPause, setInteractionPause] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (fetchedItems.length > 0) setCurrentIndex(0);
  }, [fetchedItems]);

  const bumpInteractionPause = useCallback(() => {
    setInteractionPause(true);
  }, []);

  useEffect(() => {
    if (!interactionPause) return;
    const t = window.setTimeout(() => setInteractionPause(false), 8000);
    return () => window.clearTimeout(t);
  }, [interactionPause]);

  /** Solo desplaza el scroll interno del carrusel — nunca `scrollIntoView` (puede mover el scroll de la página). */
  const scrollSlideIntoView = useCallback(
    (index: number) => {
      const container = sliderRef.current;
      if (!container) return;
      const slide = container.children[index] as HTMLElement | undefined;
      if (!slide) return;
      const cRect = container.getBoundingClientRect();
      const sRect = slide.getBoundingClientRect();
      const nextLeft = container.scrollLeft + (sRect.left - cRect.left);
      container.scrollTo({
        left: Math.max(0, nextLeft),
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    },
    [prefersReducedMotion]
  );

  useEffect(() => {
    if (n === 0) return;
    setCurrentIndex((i) => Math.min(i, n - 1));
  }, [n]);

  useEffect(() => {
    if (n === 0) return;
    scrollSlideIntoView(currentIndex);
  }, [currentIndex, n, scrollSlideIntoView]);

  const nextSlide = useCallback(() => {
    if (n < 2) return;
    setCurrentIndex((i) => (i + 1) % n);
  }, [n]);

  const prevSlide = useCallback(() => {
    if (n < 2) return;
    setCurrentIndex((i) => (i - 1 + n) % n);
  }, [n]);

  const goToSlide = useCallback(
    (i: number) => {
      if (i < 0 || i >= n) return;
      setCurrentIndex(i);
      bumpInteractionPause();
    },
    [n, bumpInteractionPause]
  );

  useEffect(() => {
    if (prefersReducedMotion || hovered || interactionPause || n < 2) return;
    const id = window.setInterval(() => {
      setCurrentIndex((i) => (i + 1) % n);
    }, 3500);
    return () => window.clearInterval(id);
  }, [prefersReducedMotion, hovered, interactionPause, n]);

  const handleNavPrev = () => {
    bumpInteractionPause();
    prevSlide();
  };
  const handleNavNext = () => {
    bumpInteractionPause();
    nextSlide();
  };

  const handleExplorePrimary = () => {
    track(LANDING_EVENTS.CTA_EXPLORE, { location: "hero", target: "fechas" });
  };

  const handleExploreSecondary = () => {
    track(LANDING_EVENTS.CTA_EXPLORE, { location: "hero", target: "explore_home" });
  };

  const handleMobileMockupCta = () => {
    track(LANDING_EVENTS.CTA_DOWNLOAD, { location: "hero_mockup_mobile" });
    onOpenDownload();
  };

  return (
    <main className="landing-hero bg-grid landing-body-bg min-h-[100dvh] min-h-[100vh] flex flex-col justify-center" id="eventos" aria-label="Presentación principal">
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
            <div className="landing-hero__ctas" id="descargar">
              <Link
                to="/explore/list?type=sociales"
                className="btn btn-primary landing-hero__cta-link"
                onClick={handleExplorePrimary}
              >
                <CalendarRange size={20} strokeWidth={2} aria-hidden />
                {hero.ctaPrimary}
              </Link>
              <Link
                to="/explore"
                className="btn btn-ghost landing-hero__web-btn landing-hero__cta-link"
                onClick={handleExploreSecondary}
                aria-label={hero.ctaSecondary}
              >
                <Globe size={20} strokeWidth={2} aria-hidden />
                {hero.ctaSecondary}
              </Link>
            </div>
            <p className="landing-hero__microcopy">{hero.ctaMicrocopy}</p>
          </div>
          <div className="landing-hero__col2">
            <div className="hero-mockup">
              <div
                className="hero-mockup__device"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
              >
                <div className="hero-mockup__screen">
                  <div className="hero-mockup__slider-wrap">
                    <div className="hero-mockup__slider" ref={sliderRef} role="list">
                      {events.map((item, idx) => (
                        <div key={`${item.id ?? "e"}-${idx}`} className="hero-mockup__slide" role="listitem">
                          <EventCard item={item} priority={idx === 0} />
                        </div>
                      ))}
                    </div>
                    <nav className="hero-mockup__nav" aria-label="Eventos en el mockup">
                      <button type="button" className="hero-mockup__nav-btn" onClick={handleNavPrev} aria-label="Evento anterior">
                        <ChevronLeft size={18} strokeWidth={2.5} />
                      </button>
                      <button type="button" className="hero-mockup__nav-btn" onClick={handleNavNext} aria-label="Siguiente evento">
                        <ChevronRight size={18} strokeWidth={2.5} />
                      </button>
                    </nav>
                    <div className="hero-mockup__dots" role="tablist" aria-label="Posición en el carrusel">
                      {events.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          role="tab"
                          aria-selected={i === currentIndex}
                          aria-label={`Evento ${i + 1} de ${n}`}
                          className={`hero-mockup__dot ${i === currentIndex ? "hero-mockup__dot--active" : ""}`}
                          onClick={() => goToSlide(i)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="hero-mockup__mobile-cta">
                <button type="button" className="hero-mockup__mobile-cta-btn" onClick={handleMobileMockupCta}>
                  Ver la app
                </button>
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
    track(LANDING_EVENTS.CTA_DOWNLOAD, { store });
    window.open(store === "ios" ? APP_STORE_URL : PLAY_STORE_URL, "_blank");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      panelClassName="download-modal-panel w-full max-w-md border border-white/12 shadow-2xl"
      contentClassName="download-modal-body"
      ariaLabelledBy="download-modal-heading"
    >
      <div className="download-modal-content">
        <h2 id="download-modal-heading" className="download-modal-title">
          Elige tu plataforma
        </h2>
        <p className="download-modal-lead">Descarga gratis en iPhone o Android.</p>
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
            onClick={() => handleStoreClick("android")}
            className="download-modal-btn download-modal-btn--play"
            aria-label="Descargar en Google Play para Android"
          >
            <span className="download-modal-btn__icon download-modal-btn__icon--play">
              <GooglePlayIcon />
            </span>
            <span className="download-modal-btn__label">Google Play</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
