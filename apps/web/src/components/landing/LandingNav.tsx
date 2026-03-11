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
          <nav className="landing-brand__name" aria-label="Buscar">
            <a href="https://dondebailar.com.mx/explore" target="_blank" rel="noopener noreferrer" aria-label="Explorar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </a>
          </nav>
          <a className="landing-brand" href="#descargar" aria-label="Donde Bailar MX inicio">
            <div className="landing-brand__icon" aria-hidden>
              <img src={BRAND_ICON_URL} alt="" width={45} height={45} />
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
