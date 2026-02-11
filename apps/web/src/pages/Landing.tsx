import React, { useState, useCallback } from "react";
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

export default function Landing() {
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  const openDownload = useCallback(() => setDownloadModalOpen(true), []);
  const closeDownload = useCallback(() => setDownloadModalOpen(false), []);

  const scrollToB2B = useCallback(() => {
    document.getElementById("negocios")?.scrollIntoView({ behavior: "smooth" });
  }, []);

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

      <div
        className="sticky-cta safe-bottom"
        role="complementary"
        aria-label="Acciones rápidas"
      >
        <div className="landing-container py-2.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openDownload}
              className="btn btn-primary flex-1 !py-3"
            >
              Descargar
            </button>
            <button
              type="button"
              onClick={scrollToB2B}
              className="btn btn-ghost flex-1 !py-3"
            >
              Soy academia
            </button>
          </div>
        </div>
      </div>

      <div className="h-16 md:hidden" aria-hidden />

      <DownloadModal open={downloadModalOpen} onClose={closeDownload} />
    </div>
  );
}
