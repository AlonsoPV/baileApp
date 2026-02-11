import React from "react";
import { motion } from "framer-motion";
import { Download, Filter, Music, ArrowRight } from "lucide-react";
import { landingContent } from "@/config/content";

const STEP_ICONS = [Download, Filter, Music];
const STEP_ACCENTS = [
  "landing-how-it-works__step--1",
  "landing-how-it-works__step--2",
  "landing-how-it-works__step--3",
];

export function HowItWorks() {
  const { title, steps } = landingContent.howItWorks;

  return (
    <motion.section
      className="landing-section landing-how-it-works"
      aria-labelledby="how-heading"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
    >
      <div className="landing-container">
        <div className="landing-how-it-works__header">
          <h2 id="how-heading" className="landing-how-it-works__title">
            {title}
          </h2>
        </div>
        <div className="landing-how-it-works__steps">
          {steps.map((step, i) => {
            const Icon = STEP_ICONS[i] ?? Download;
            const stepClass = STEP_ACCENTS[i] ?? STEP_ACCENTS[0];
            const isLast = i === steps.length - 1;
            return (
              <React.Fragment key={step.step}>
                <motion.div
                  className={`landing-how-it-works__step ${stepClass}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <div className="landing-how-it-works__step-number">
                    {String(step.step).padStart(2, "0")}
                  </div>
                  <div className="landing-how-it-works__step-icon-wrapper">
                    <Icon size={28} strokeWidth={2} className="landing-how-it-works__step-icon" />
                  </div>
                  <h3 className="landing-how-it-works__step-title">
                    {step.title}
                  </h3>
                  <p className="landing-how-it-works__step-description">
                    {step.description}
                  </p>
                </motion.div>
                {!isLast && (
                  <div className="landing-how-it-works__arrow" aria-hidden>
                    <ArrowRight size={24} strokeWidth={2} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
