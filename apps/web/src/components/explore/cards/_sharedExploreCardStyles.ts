// Shared modern card frame styles (based on EventCard visual system)
export const EXPLORE_CARD_STYLES = `
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
    object-position: center;
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
  }

  .explore-card-actions {
    display: flex;
    gap: clamp(8px, 1vw, 10px);
    align-items: center;
  }

  /* CTA is visual only (whole card is a link) */
  .explore-card-cta {
    flex: 1;
    padding: clamp(10px, 1.6vw, 16px) clamp(14px, 2vw, 24px);
    border-radius: 16px;
    font-weight: 900;
    font-size: clamp(12px, 1.9vw, 15px);
    color: #111;
    background: linear-gradient(135deg, #FFD1DD, #FFC38F);
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(255, 209, 221, 0.3), 0 2px 8px rgba(255, 195, 143, 0.2);
    letter-spacing: 0.3px;
    user-select: none;
    pointer-events: none;
  }

  .explore-card-cta::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
    opacity: 0;
    transition: opacity 0.3s;
  }

  .explore-card:hover .explore-card-cta::before {
    opacity: 1;
  }
`;


