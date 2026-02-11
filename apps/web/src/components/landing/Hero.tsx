import React from "react";
import { Smartphone, Building2, Check, Zap, Shield, Download } from "lucide-react";
import { landingContent } from "@/config/content";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config/links";
import { track, LANDING_EVENTS } from "@/lib/track";
import { Modal } from "@/components/ui/Modal";

const { hero } = landingContent;

interface HeroProps {
  onOpenDownload: () => void;
  onOpenB2B: () => void;
}

export function Hero({ onOpenDownload, onOpenB2B }: HeroProps) {
  const handleDownloadClick = () => {
    track(LANDING_EVENTS.CTA_DOWNLOAD, { location: "hero" });
    onOpenDownload();
  };

  const handleB2BClick = () => {
    track(LANDING_EVENTS.CTA_B2B, { location: "hero" });
    onOpenB2B();
  };

  return (
    <main className="landing-hero bg-grid landing-body-bg min-h-[100dvh] min-h-[100vh] flex flex-col justify-center" id="descargar" aria-label="Presentación principal">
      <div className="landing-container relative z-10">
        <div className="landing-hero__kicker">
          <div className="pill">
            <span className="pill-dot" aria-hidden />
            <span>CDMX + EXPANSIÓN NACIONAL</span>
          </div>
        </div>

        <h1 className="landing-hero__title">
          <span className="white">ENCUENTRA </span>
          <span className="grad">DÓNDE BAILAR</span>
          <br />
          <span className="white">HOY MISMO</span>
        </h1>

        <p className="landing-hero__sub">
          La guía definitiva de eventos, clases y academias. Filtra por ritmo, zona y fecha
          para que nunca te quedes sin pista.
        </p>

        <div className="landing-hero__ctas">
          <button type="button" className="btn btn-primary" onClick={handleDownloadClick}>
            <Smartphone size={18} strokeWidth={2} aria-hidden />
            Descargar la App
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleB2BClick}>
            Soy academia / maestro
          </button>
        </div>

        <ul className="hero-microcopy" aria-label="Beneficios de la app">
          <li>
            <Zap size={14} strokeWidth={2.5} aria-hidden />
            <span>Gratis</span>
          </li>
          <li>
            <Shield size={14} strokeWidth={2.5} aria-hidden />
            <span>Sin spam</span>
          </li>
          <li>
            <Download size={14} strokeWidth={2.5} aria-hidden />
            <span>Descarga en segundos</span>
          </li>
        </ul>

        <ul className="hero-benefits" id="funciones" aria-label="Qué ofrece la app">
          {hero.badges.map((badge, index) => {
            const parts = badge.split(", ");
            const isFirst = index === 0 && parts.length === 2;
            return (
              <li key={badge} className="hero-benefit">
                <span className="hero-benefit__dot" aria-hidden />
                {isFirst ? (
                  <>
                    <strong>{parts[0]}</strong>
                    <span>, {parts[1]}</span>
                  </>
                ) : (
                  <span>{badge}</span>
                )}
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
    <Modal open={open} onClose={onClose} title="Descargar la app">
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
            <span className="download-modal-btn__sublabel">iPhone / iPad</span>
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
            <span className="download-modal-btn__sublabel">Android</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
