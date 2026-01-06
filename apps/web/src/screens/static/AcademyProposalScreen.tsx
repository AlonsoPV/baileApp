import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import SeoHead from '@/components/SeoHead';

export default function AcademyProposalScreen() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  
  // Auto-print si hay ?pdf=1 en la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pdf') === '1') {
      setTimeout(() => window.print(), 250);
    }
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <>
      <SeoHead
        section="default"
        title="Donde Bailar — Propuesta para Academias (PDF)"
        description="Propuesta comercial para academias: resuelve captación, ocupación y visibilidad con Donde Bailar. Integración sin costo."
      />
      <style>{`
        /* =========================
           PRINT SETUP (PDF)
        ========================== */
        @page {
          size: A4;
          margin: 14mm;
        }
        @media print {
          html, body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
        }

        .proposal-root {
          --bg: #0b0f1a;
          --paperA: rgba(255,255,255,0.08);
          --paperB: rgba(255,255,255,0.04);
          --stroke: rgba(255,255,255,0.12);
          --text: rgba(255,255,255,0.92);
          --muted: rgba(255,255,255,0.74);
          --muted2: rgba(255,255,255,0.58);
          --brand: #ff6a00;
          --brand2: #ffb000;
          --ok: #46e6a6;
          --shadow: 0 18px 60px rgba(0,0,0,.45);
          --radius: 24px;
          --radius2: 16px;
          --max: 980px;
        }

        .proposal-root * {
          box-sizing: border-box;
        }

        .proposal-root {
          min-height: 100vh;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans";
          color: var(--text);
          background:
            radial-gradient(1200px 900px at 18% 10%, rgba(255,106,0,.22), transparent 60%),
            radial-gradient(1000px 700px at 85% 0%, rgba(255,176,0,.16), transparent 55%),
            radial-gradient(1100px 800px at 70% 92%, rgba(120,90,255,.14), transparent 62%),
            var(--bg);
          line-height: 1.35;
          margin: 0;
          padding: 0;
        }

        .proposal-container {
          width: min(var(--max), calc(100% - 46px));
          margin: 0 auto;
          padding: 18px 0 26px;
        }

        .proposal-language-switcher {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 16px;
          gap: 8px;
        }

        .proposal-lang-btn {
          appearance: none;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.92);
          font-weight: 700;
          font-size: 13px;
          padding: 8px 14px;
          border-radius: 12px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .proposal-lang-btn:hover {
          background: rgba(255,255,255,0.10);
          border-color: rgba(255,255,255,0.24);
        }

        .proposal-lang-btn.active {
          background: linear-gradient(135deg, var(--brand), var(--brand2));
          border-color: rgba(255,106,0,0.55);
          color: #141414;
          font-weight: 900;
        }

        .proposal-go-to-site {
          appearance: none;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.92);
          font-weight: 700;
          font-size: 13px;
          padding: 8px 14px;
          border-radius: 12px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .proposal-go-to-site:hover {
          background: rgba(255,255,255,0.10);
          border-color: rgba(255,255,255,0.24);
        }

        .proposal-sheet {
          border-radius: 28px;
          background: linear-gradient(180deg, var(--paperA), var(--paperB));
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: var(--shadow);
          overflow: hidden;
          position: relative;
        }

        .proposal-sheet::before {
          content: "";
          position: absolute;
          inset: -2px;
          background:
            radial-gradient(900px 380px at 25% 0%, rgba(255,106,0,0.10), transparent 55%),
            radial-gradient(900px 380px at 75% 0%, rgba(255,176,0,0.08), transparent 55%);
          pointer-events: none;
          z-index: 0;
        }

        .proposal-sheet-inner {
          padding: 32px 28px;
          position: relative;
          z-index: 1;
        }

        .proposal-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          padding-bottom: 24px;
          margin-bottom: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.10);
        }

        .proposal-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 950;
          letter-spacing: 0.2px;
        }

        .proposal-logo {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background:
            radial-gradient(10px 10px at 30% 35%, rgba(255,255,255,.85), transparent 60%),
            linear-gradient(135deg, var(--brand), var(--brand2));
          box-shadow: 0 16px 34px rgba(255,106,0,.18);
          border: 1px solid rgba(255,255,255,0.18);
          flex: 0 0 auto;
        }

        .proposal-subtitle {
          display: block;
          margin-top: 4px;
          color: rgba(255,255,255,.72);
          font-weight: 900;
          font-size: 12px;
          letter-spacing: .25px;
          text-transform: uppercase;
        }

        .proposal-meta {
          text-align: right;
          color: var(--muted2);
          font-size: 12px;
          line-height: 1.45;
        }

        .proposal-meta strong {
          color: rgba(255,255,255,0.86);
          font-weight: 950;
        }

        .proposal-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(70,230,166,0.12);
          border: 1px solid rgba(70,230,166,0.22);
          color: rgba(205,255,235,0.92);
          font-weight: 950;
          font-size: 12px;
          width: fit-content;
          margin-top: 10px;
        }

        .proposal-hero {
          padding: 32px 0 24px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
          align-items: start;
          max-width: 800px;
          margin: 0 auto;
        }

        .proposal-hero h1 {
          margin: 0 0 20px 0;
          font-size: 42px;
          line-height: 1.1;
          letter-spacing: -0.8px;
          font-weight: 980;
        }

        .proposal-lead {
          margin: 0 0 24px;
          color: var(--muted);
          font-size: 16px;
          max-width: 75ch;
          line-height: 1.65;
        }

        .proposal-chips {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin: 0;
          padding-top: 8px;
        }

        .proposal-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.80);
          font-weight: 900;
          font-size: 13px;
          white-space: nowrap;
        }

        .proposal-panel {
          border-radius: var(--radius);
          background: rgba(10,12,20,0.55);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 14px;
          display: grid;
          gap: 10px;
          break-inside: avoid;
          box-shadow: 0 14px 44px rgba(0,0,0,.28);
        }

        .proposal-panel h3 {
          margin: 0;
          font-size: 14px;
          letter-spacing: -0.2px;
          font-weight: 950;
        }

        .proposal-panel p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.55;
        }

        .proposal-stat {
          border-radius: 18px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 12px;
        }

        .proposal-stat .k {
          color: var(--muted2);
          font-size: 12px;
          font-weight: 850;
        }

        .proposal-stat .n {
          color: var(--muted);
          font-size: 12px;
          margin-top: 8px;
          line-height: 1.5;
        }

        .proposal-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 12px;
          color: rgba(255,255,255,0.86);
          word-break: break-word;
        }

        .proposal-section {
          padding: 40px 0 32px;
          border-top: 1px solid rgba(255,255,255,0.10);
        }

        .proposal-section-title {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 24px;
        }

        .proposal-section-title h2 {
          margin: 0;
          font-size: 24px;
          letter-spacing: -0.4px;
          font-weight: 980;
          line-height: 1.2;
        }

        .proposal-section-title p {
          margin: 8px 0 0 0;
          color: var(--muted);
          font-size: 14px;
          max-width: 74ch;
          line-height: 1.6;
        }

        .proposal-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .proposal-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .proposal-pain {
          border-radius: var(--radius2);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 20px;
          break-inside: avoid;
        }

        .proposal-pain .head {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .proposal-pain .ico {
          width: 36px;
          height: 36px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          font-size: 15px;
          flex: 0 0 auto;
        }

        .proposal-pain strong {
          display: block;
          font-weight: 980;
          letter-spacing: -0.2px;
          font-size: 14px;
          margin: 0;
        }

        .proposal-pain .sub {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.5;
        }

        .proposal-solution {
          margin-top: 10px;
          padding: 12px;
          border-radius: 18px;
          background: rgba(70,230,166,0.10);
          border: 1px solid rgba(70,230,166,0.20);
          color: rgba(205,255,235,0.92);
          font-size: 13px;
          line-height: 1.5;
          font-weight: 850;
        }

        .proposal-solution span {
          color: rgba(205,255,235,0.82);
          font-weight: 900;
        }

        .proposal-card {
          border-radius: var(--radius2);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 20px;
          break-inside: avoid;
          position: relative;
          overflow: hidden;
        }

        .proposal-card::after {
          content: "";
          position: absolute;
          inset: auto -20px -30px auto;
          width: 140px;
          height: 140px;
          background: radial-gradient(circle at 30% 30%, rgba(255,106,0,0.14), transparent 62%);
          transform: rotate(12deg);
          pointer-events: none;
        }

        .proposal-card .icon {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(255,106,0,.22), rgba(255,176,0,.16));
          border: 1px solid rgba(255,255,255,0.14);
          display: grid;
          place-items: center;
          margin-bottom: 14px;
          box-shadow: 0 12px 30px rgba(0,0,0,.22);
          font-size: 18px;
        }

        .proposal-card strong {
          display: block;
          font-weight: 980;
          margin-bottom: 10px;
          letter-spacing: -0.2px;
          font-size: 15px;
          line-height: 1.3;
        }

        .proposal-card p {
          margin: 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.6;
        }

        .proposal-close {
          border-radius: var(--radius);
          background: rgba(10,12,20,0.55);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 24px;
          break-inside: avoid;
          display: grid;
          gap: 16px;
        }

        .proposal-close h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 980;
          letter-spacing: -0.2px;
        }

        .proposal-close p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.6;
        }

        .proposal-close .line {
          padding: 12px;
          border-radius: 18px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .proposal-tag {
          padding: 6px 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--brand), var(--brand2));
          color: #141414;
          font-weight: 980;
          font-size: 12px;
          border: 1px solid rgba(255,255,255,0.12);
        }

        .proposal-footer {
          margin-top: 12px;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.62);
          font-size: 12px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          break-inside: avoid;
        }

        .proposal-small-link {
          color: rgba(255,255,255,0.86);
          font-weight: 900;
          text-decoration: none;
        }

        .proposal-small-link .muted {
          color: rgba(255,255,255,0.58);
          font-weight: 850;
        }

        @media (max-width: 900px) {
          .proposal-container {
            padding: 16px 0 24px;
          }
          
          .proposal-sheet-inner {
            padding: 24px 20px;
          }
          
          .proposal-hero {
            padding: 24px 0 20px;
          }
          
          .proposal-hero h1 {
            font-size: 32px;
            margin-bottom: 16px;
          }
          
          .proposal-lead {
            font-size: 15px;
            margin-bottom: 20px;
          }
          
          .proposal-section {
            padding: 32px 0 24px;
          }
          
          .proposal-section-title h2 {
            font-size: 20px;
          }
          
          .proposal-grid-2 {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .proposal-grid-3 {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .proposal-meta {
            text-align: left;
            margin-top: 16px;
          }
          
          .proposal-top {
            flex-direction: column;
            gap: 16px;
            padding-bottom: 20px;
          }
          
          .proposal-chips {
            gap: 10px;
          }
        }
        
        @media (max-width: 600px) {
          .proposal-container {
            width: calc(100% - 24px);
            padding: 12px 0 20px;
          }
          
          .proposal-sheet-inner {
            padding: 20px 16px;
          }
          
          .proposal-hero h1 {
            font-size: 28px;
            line-height: 1.15;
          }
          
          .proposal-lead {
            font-size: 14px;
          }
          
          .proposal-section {
            padding: 28px 0 20px;
          }
          
          .proposal-section-title {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 20px;
          }
          
          .proposal-section-title h2 {
            font-size: 18px;
          }
          
          .proposal-card,
          .proposal-pain {
            padding: 16px;
          }
          
          .proposal-close {
            padding: 20px;
          }
        }

        @media print {
          .proposal-no-print {
            display: none !important;
          }

          .proposal-root {
            background: #ffffff !important;
            color: #0b0f1a !important;
          }

          .proposal-sheet {
            box-shadow: none !important;
            background: #fff !important;
            border: 1px solid rgba(0,0,0,0.12) !important;
          }

          .proposal-sheet::before {
            display: none !important;
          }

          .proposal-sheet-inner {
            padding: 18px;
          }

          .proposal-panel,
          .proposal-pain,
          .proposal-card,
          .proposal-close {
            box-shadow: none !important;
            background: #fff !important;
            border: 1px solid rgba(0,0,0,0.12) !important;
          }

          .proposal-solution {
            background: #fff !important;
            border: 1px solid rgba(0,0,0,0.12) !important;
            color: rgba(11,15,26,0.86) !important;
          }

          .proposal-top {
            border-bottom: 1px solid rgba(0,0,0,0.12) !important;
          }

          .proposal-section {
            border-top: 1px solid rgba(0,0,0,0.12) !important;
          }

          .proposal-lead,
          .proposal-section-title p,
          .proposal-panel p,
          .proposal-pain .sub,
          .proposal-card p,
          .proposal-close p,
          .proposal-footer {
            color: rgba(11,15,26,0.80) !important;
          }

          .proposal-chip,
          .proposal-stat,
          .proposal-close .line {
            background: #fff !important;
            border: 1px solid rgba(0,0,0,0.12) !important;
            color: rgba(11,15,26,0.86) !important;
          }

          .proposal-mono {
            color: rgba(11,15,26,0.82) !important;
          }

          .proposal-small-link {
            color: #0b0f1a !important;
            text-decoration: none !important;
          }

          .proposal-sheet,
          .proposal-hero,
          .proposal-panel,
          .proposal-pain,
          .proposal-card,
          .proposal-close,
          .proposal-footer {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
      <div className="proposal-root">
        <div className="proposal-container">
          {/* Language Switcher */}
          <div className="proposal-language-switcher proposal-no-print">
            <button
              className={`proposal-lang-btn ${language === 'es' ? 'active' : ''}`}
              onClick={() => setLanguage('es')}
              aria-label="Español"
            >
              <span>🇲🇽</span>
              <span>ES</span>
            </button>
            <button
              className={`proposal-lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
              aria-label="English"
            >
              <span>🇺🇸</span>
              <span>EN</span>
            </button>
          </div>

          <div className="proposal-sheet" id="pdf">
            <div className="proposal-sheet-inner">
              {/* Header */}
              <div className="proposal-top">
                <div>
                  <div className="proposal-brand">
                    <div className="proposal-logo" aria-hidden="true"></div>
                    <div>
                      Donde Bailar
                      <span className="proposal-subtitle">{t('proposal_subtitle')}</span>
                    </div>
                  </div>
                  <div className="proposal-badge">
                    {t('proposal_badge')}
                  </div>
                </div>

                <div className="proposal-meta">
                  <strong>{t('proposal_contact')}</strong>
                  <br />
                  info@dondebailar.com.mx
                  <br />
                  <br />
                  <strong>{t('proposal_privacy')}</strong>
                  <br />
                  <a
                    href="https://dondebailar.com.mx/aviso-de-privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--muted2)', textDecoration: 'underline' }}
                  >
                    dondebailar.com.mx/aviso-de-privacidad
                  </a>
                </div>
              </div>

              {/* Hero */}
              <div className="proposal-hero">
                <div>
                  <h1>
                    {t('proposal_hero_title').split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < t('proposal_hero_title').split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </h1>

                  <p className="proposal-lead">
                    {t('proposal_hero_lead_1')}
                    <br />
                    <br />
                    {t('proposal_hero_lead_2')}
                  </p>

                  <div className="proposal-chips">
                    <div className="proposal-chip">{t('proposal_chip_zone')}</div>
                    <div className="proposal-chip">{t('proposal_chip_rhythms')}</div>
                    <div className="proposal-chip">{t('proposal_chip_classes')}</div>
                    <div className="proposal-chip">{t('proposal_chip_reputation')}</div>
                    <div className="proposal-chip">{t('proposal_chip_data')}</div>
                  </div>
                </div>
              </div>

              {/* Pain points */}
              <div className="proposal-section" id="dolores">
                <div className="proposal-section-title">
                  <div>
                    <h2>{t('proposal_pain_title')}</h2>
                    <p>
                      {t('proposal_pain_intro')}
                    </p>
                  </div>
                </div>

                <div className="proposal-grid-2">
                  <div className="proposal-pain">
                    <div className="head">
                      <div className="ico">🕳️</div>
                      <div>
                        <strong>{t('proposal_pain_1_title')}</strong>
                        <p className="sub">{t('proposal_pain_1_sub')}</p>
                      </div>
                    </div>
                    <div className="proposal-solution">
                      <span>{t('proposal_solution_label')}</span> {t('proposal_pain_1_solution')}
                    </div>
                  </div>

                  <div className="proposal-pain">
                    <div className="head">
                      <div className="ico">📩</div>
                      <div>
                        <strong>{t('proposal_pain_2_title')}</strong>
                        <p className="sub">{t('proposal_pain_2_sub')}</p>
                      </div>
                    </div>
                    <div className="proposal-solution">
                      <span>{t('proposal_solution_label')}</span> {t('proposal_pain_2_solution')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="proposal-section" id="beneficios">
                <div className="proposal-section-title">
                  <div>
                    <h2>{t('proposal_benefits_title')}</h2>
                    <p>
                      {t('proposal_benefits_intro')}
                    </p>
                  </div>
                </div>

                <div className="proposal-grid-3">
                  <div className="proposal-card">
                    <div className="icon">🔥</div>
                    <strong>{t('proposal_benefit_1_title')}</strong>
                    <p>
                      {t('proposal_benefit_1_desc')}
                    </p>
                  </div>

                  <div className="proposal-card">
                    <div className="icon">📍</div>
                    <strong>{t('proposal_benefit_2_title')}</strong>
                    <p>
                      {t('proposal_benefit_2_desc')}
                    </p>
                  </div>

                  <div className="proposal-card">
                    <div className="icon">🗓️</div>
                    <strong>{t('proposal_benefit_3_title')}</strong>
                    <p>
                      {t('proposal_benefit_3_desc')}
                    </p>
                  </div>

                  <div className="proposal-card">
                    <div className="icon">⭐</div>
                    <strong>{t('proposal_benefit_4_title')}</strong>
                    <p>
                      {t('proposal_benefit_4_desc')}
                    </p>
                  </div>

                  <div className="proposal-card">
                    <div className="icon">📈</div>
                    <strong>{t('proposal_benefit_5_title')}</strong>
                    <p>
                      {t('proposal_benefit_5_desc')}
                    </p>
                  </div>

                  <div className="proposal-card">
                    <div className="icon">⚡</div>
                    <strong>{t('proposal_benefit_6_title')}</strong>
                    <p>
                      {t('proposal_benefit_6_desc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Teachers & Events Section */}
              <div className="proposal-section" id="maestros-eventos">
                <div className="proposal-section-title">
                  <div>
                    <h2>{t('proposal_teachers_title')}</h2>
                    <p>
                      {t('proposal_teachers_intro')}
                    </p>
                  </div>
                </div>

                <div className="proposal-grid-3">
                  <div className="proposal-card">
                    <div className="icon">👤</div>
                    <strong>{t('proposal_teacher_1_title')}</strong>
                    <p>
                      {t('proposal_teacher_1_desc')}
                    </p>
                  </div>

                  <div className="proposal-card">
                    <div className="icon">🎉</div>
                    <strong>{t('proposal_teacher_2_title')}</strong>
                    <p>
                      {t('proposal_teacher_2_desc')}
                    </p>
                  </div>

                  <div className="proposal-card">
                    <div className="icon">💳</div>
                    <strong>{t('proposal_teacher_3_title')}</strong>
                    <p>
                      {t('proposal_teacher_3_desc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Close */}
              <div className="proposal-section" id="cierre">
                <div className="proposal-section-title">
                  <div>
                    <h2>{t('proposal_close_title')}</h2>
                    <p>
                      {t('proposal_close_intro')}
                    </p>
                  </div>
                </div>

                <div className="proposal-close">
                  <h3>{t('proposal_close_contact')}</h3>
                  <p>
                    {t('proposal_close_email_text')} <span className="proposal-mono">info@dondebailar.com.mx</span> {t('proposal_close_subject_label')}
                    <br />
                    <span className="proposal-mono">{t('proposal_close_subject')}</span>
                  </p>
                  <div className="line">
                    <div style={{ fontWeight: 900, color: 'rgba(255,255,255,0.86)' }}>
                      info@dondebailar.com.mx
                    </div>
                    <div className="proposal-tag">{t('proposal_close_no_cost')}</div>
                  </div>
                  <p style={{ color: 'var(--muted2)', fontSize: '12px', marginTop: '10px' }}>
                    <a
                      href="https://dondebailar.com.mx/aviso-de-privacidad"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--muted2)', textDecoration: 'underline' }}
                    >
                      {t('proposal_privacy_link')}
                    </a>
                  </p>
                </div>
              </div>

              {/* Footer */}
              <footer className="proposal-footer">
                <div>
                  © {currentYear} Donde Bailar
                  <br />
                  <span style={{ opacity: 0.85 }}>{t('proposal_footer_contact')} info@dondebailar.com.mx</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <Link to="/explore" className="proposal-go-to-site">
                    <span>🏠</span>
                    <span>{t('proposal_go_to_site')}</span>
                  </Link>
                  <a
                    className="proposal-small-link"
                    href="https://dondebailar.com.mx/aviso-de-privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('proposal_privacy_link')} <span className="muted">dondebailar.com.mx/aviso-de-privacidad</span>
                  </a>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

