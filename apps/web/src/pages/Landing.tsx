import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import "@/styles/landing.css";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero, DownloadModal } from "@/components/landing/Hero";
import { B2BLeadForm } from "@/components/landing/B2BLeadForm";
import { LandingMetrics } from "@/components/landing/LandingMetrics";
import { PainSolution } from "@/components/landing/PainSolution";
import { FactorWow } from "@/components/landing/FactorWow";
import { DecisionNotDiscovery } from "@/components/landing/DecisionNotDiscovery";
import { Retention } from "@/components/landing/Retention";
import { BusinessCase } from "@/components/landing/BusinessCase";
import { BenefitGrid } from "@/components/landing/BenefitGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MidCTA } from "@/components/landing/MidCTA";
import { SocialProof } from "@/components/landing/SocialProof";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { ResponsivePreview } from "@/components/landing/ResponsivePreview";
import { useLandingOverflowDebug } from "@/hooks/useLandingOverflowDebug";

export default function Landing() {
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  const openDownload = useCallback(() => setDownloadModalOpen(true), []);
  const closeDownload = useCallback(() => setDownloadModalOpen(false), []);

  const scrollToB2B = useCallback(() => {
    document.getElementById("negocios")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useLandingOverflowDebug();

  return (
    <div className="landing landing-body-bg min-h-screen">
      <LandingNav onOpenDownload={openDownload} onOpenB2B={scrollToB2B} />

      <Hero onOpenDownload={openDownload} onOpenB2B={scrollToB2B} />

      <B2BLeadForm />

      <LandingMetrics />

      <PainSolution />

      <FactorWow />

      <DecisionNotDiscovery />

      <Retention />

      <BusinessCase />

      <BenefitGrid />

      <HowItWorks />

      <MidCTA onOpenDownload={openDownload} onOpenB2B={scrollToB2B} />

      <SocialProof />

      <FAQ />

      <Footer onDownloadClick={openDownload} onB2BClick={scrollToB2B} />

      {/* Sticky action bar (solo móvil) */}
      <div
        className="landing-stickybar db-stickybar"
        role="navigation"
        aria-label="Acciones rápidas"
      >
        <button
          type="button"
          className="sbtn sbtn--primary"
          onClick={openDownload}
        >
          <span className="sbtn__icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v10" />
              <path d="m7 10 5 5 5-5" />
            </svg>
          </span>
          Descargar
        </button>
        <Link to="/soporte" className="sbtn sbtn--ghost">
          <span className="sbtn__icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
              <path d="M4 19V9a2 2 0 0 1 2-2h3l1-2h4l1 2h3a2 2 0 0 1 2 2v10" />
              <path d="M9 19v-5a3 3 0 0 1 6 0v5" />
            </svg>
          </span>
          Contáctanos
        </Link>
      </div>

      <DownloadModal open={downloadModalOpen} onClose={closeDownload} />

      <ResponsivePreview />
    </div>
  );
}
