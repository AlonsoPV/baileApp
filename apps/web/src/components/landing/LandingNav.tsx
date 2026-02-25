import React from "react";
import { track, LANDING_EVENTS } from "@/lib/track";

const BRAND_ICON_URL = "https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/icon.png";

interface LandingNavProps {
  onOpenDownload: () => void;
  onOpenB2B: () => void;
}

export function LandingNav({ onOpenDownload, onOpenB2B }: LandingNavProps) {
  const handleDownload = () => {
    track(LANDING_EVENTS.CTA_DOWNLOAD, { location: "nav" });
    onOpenDownload();
  };

  return (
    <header className="landing-nav" role="banner">
      <div className="landing-container">
        <div className="landing-nav__inner">
          

          <nav className="landing-brand__name" aria-label="Secciones">
            {/* <a href="#funciones">Funciones</a> */}
            <a href="https://dondebailar.com.mx/explore" target="_blank" rel="noopener noreferrer">Explorar el mundo del baile</a>
            {/* <a href="#negocios" onClick={(e) => { e.preventDefault(); onOpenB2B(); }}>Para Negocios</a> */}
          </nav>
          <a className="landing-brand" href="#descargar" aria-label="Donde Bailar MX inicio">
            <div className="landing-brand__icon" aria-hidden>
              <img src={BRAND_ICON_URL} alt="" width={45} height={45} />
            </div>
            <div className="landing-brand__name">
              <span>DONDE</span>
              <em>BAILAR</em>
              <span>MX</span>
            </div>
          </a>
          <div className="landing-nav__cta">
            <button type="button" className="btn btn-primary" onClick={handleDownload}>
              Descargar
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
