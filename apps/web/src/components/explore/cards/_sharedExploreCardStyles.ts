// Shared modern card frame styles (based on EventCard visual system)
export const EXPLORE_CARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
  
  .explore-card-mobile {
    width: 100%;
  }

  /* Responsive: Mobile */
  @media (max-width: 768px) {
    .explore-card-mobile {
      /* Prevent giant cards (vh) and prevent too-narrow cards */
      max-width: min(420px, calc((9 / 16) * 100vh));
      margin: 0 auto;
    }
    .explore-card { --card-ar: 9 / 16; }
    img, [style*="objectFit"] {
      max-width: 100% !important;
      /* height: auto !important; */
      object-fit: cover !important;
    }
  }

  /* Responsive: Small mobile */
  @media (max-width: 480px) {
    .explore-card-mobile {
      max-width: 100%;
    }
    .explore-card-content {
      padding: 10px 10px max(8px, env(safe-area-inset-bottom));
    }
  }

  .explore-card {
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.10);
    background: rgba(255, 255, 255, 0.03);
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
    position: relative;
    cursor: pointer;
    /* Default aspect ratio (desktop/tablet). Mobile overrides via --card-ar */
    --card-ar: 4 / 5;
  }

  /* Media area (image + blurred background) */
  .explore-card-media {
    position: relative;
    aspect-ratio: var(--card-ar);
    background: rgba(255, 255, 255, 0.04);
  }
  .explore-card-media::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: var(--img, none);
    background-size: cover;
    background-position: center;
    filter: blur(18px) saturate(1.1);
    transform: scale(1.08);
    opacity: 0.55;
  }
  .explore-card-media::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.82) 100%);
  }
  .explore-card-media img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
    filter: drop-shadow(0 18px 30px rgba(0, 0, 0, 0.45));
    z-index: 1;
  }

  .explore-card-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 14px 14px max(12px, env(safe-area-inset-bottom));
    z-index: 2;
  }

  .explore-card-title {
    margin: 0 0 clamp(5px, 1vw, 8px);
    font-size: clamp(14px, 2.2vw, 18px);
    font-weight: 900;
    color: #fff;
    text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px;
    word-break: break-word;
    line-height: 1.3;
    font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .explore-card-subtitle {
    font-size: 12px;
    color: rgba(255,255,255,0.78);
    margin: 0 0 10px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
    font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .explore-card-meta {
    display: flex;
    gap: clamp(6px, 1vw, 8px);
    flex-wrap: wrap;
    margin-bottom: clamp(8px, 1vw, 10px);
  }

  .explore-card-tag {
    font-size: clamp(10px, 1.6vw, 13px);
    color: rgba(234, 240, 255, 0.85);
    background: rgba(17, 21, 32, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.14);
    padding: clamp(5px, 1vw, 9px) clamp(7px, 1.2vw, 12px);
    border-radius: 999px;
    display: inline-flex;
    gap: 8px;
    align-items: center;
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    backdrop-filter: blur(8px);
    font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .explore-card-actions {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* CTA is visual only (whole card is a link) - botón minimalista en esquina superior derecha del media */
  .explore-card-cta {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    border: 1.5px solid rgba(255, 255, 255, 0.3);
    position: relative;
    user-select: none;
    pointer-events: none;
    transition: all 0.2s ease;
  }

  .explore-card-cta svg {
    width: 18px;
    height: 18px;
    stroke: rgba(255, 255, 255, 0.9);
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: stroke 0.2s ease;
  }

  .explore-card:hover .explore-card-cta {
    background: rgba(0, 0, 0, 0.5);
    border-color: rgba(255, 255, 255, 0.5);
    transform: scale(1.1);
  }

  .explore-card:hover .explore-card-cta svg {
    stroke: rgba(255, 255, 255, 1);
  }
`;


