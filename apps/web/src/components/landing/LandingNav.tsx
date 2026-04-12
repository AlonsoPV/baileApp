import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { track, LANDING_EVENTS } from "@/lib/track";

const BRAND_ICON_URL = "https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/icon.png";

interface LandingNavProps {
  onOpenDownload: () => void;
}

export function LandingNav({ onOpenDownload }: LandingNavProps) {
  const navigate = useNavigate();

  const handleDownload = () => {
    track(LANDING_EVENTS.CTA_DOWNLOAD, { location: "nav" });
    onOpenDownload();
  };

  return (
    <nav className="landing-nav" role="navigation" aria-label="Navegación principal">
      <div className="landing-container">
        <div className="landing-nav__inner">
          <div className="lnav__left">
            <Link to="/" className="lnav__brand" aria-label="Donde Bailar — inicio">
              <div className="lnav__logo" aria-hidden>
                <img src={BRAND_ICON_URL} alt="" width={18} height={18} />
              </div>
              <span className="lnav__name">
                <em>Donde</em> Bailar
              </span>
            </Link>

            <div className="lnav__sep" aria-hidden />

            <button
              type="button"
              className="lnav__weblink"
              onClick={() => navigate("/explore")}
              aria-label="Explorar en versión web"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Explorar en web</span>
            </button>
          </div>

          <div className="lnav__right">
            <button type="button" className="lnav__cta" onClick={handleDownload}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3v10M7 10l5 5 5-5" />
                <path d="M5 19h14" />
              </svg>
              <span className="lnav__cta-text-short">Descargar</span>
              <span className="lnav__cta-text-full">Descargar gratis</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
