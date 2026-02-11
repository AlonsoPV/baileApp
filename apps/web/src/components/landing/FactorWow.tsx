import React from "react";
import { motion } from "framer-motion";
import { Layers, Target, Cpu, LucideIcon } from "lucide-react";
import { landingContent } from "@/config/content";

const PILLAR_ICONS: LucideIcon[] = [Layers, Target, Cpu];
const PILLAR_ACCENTS = ["landing-factor-wow__pillar--1", "landing-factor-wow__pillar--2", "landing-factor-wow__pillar--3"];

export function FactorWow() {
  const { overline, tagline, pillars } = landingContent.factorWow;

  return (
    <motion.section
      className="landing-section landing-factor-wow"
      aria-labelledby="factor-wow-heading"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
    >
      <div className="landing-factor-wow__bar" aria-hidden />
      <div className="landing-container">
        <p className="landing-factor-wow__overline">{overline}</p>
        <h2 id="factor-wow-heading" className="landing-factor-wow__title">
          {tagline}
        </h2>
        <ul className="landing-factor-wow__list">
          {pillars.map((text, i) => {
            const Icon = PILLAR_ICONS[i] ?? Cpu;
            const accentClass = PILLAR_ACCENTS[i] ?? PILLAR_ACCENTS[0];
            return (
              <li key={i} className={`landing-factor-wow__pillar ${accentClass}`}>
                <span className="landing-factor-wow__pillar-num" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                <span className="landing-factor-wow__pillar-icon" aria-hidden>
                  <Icon size={24} strokeWidth={2} />
                </span>
                <p className="landing-factor-wow__pillar-text">{text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.section>
  );
}
