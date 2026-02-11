import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { landingContent } from "@/config/content";

export function PainSolution() {
  const { painHeadline, painSubline, solutionHeadline, solutionPoints } =
    landingContent.painSolution;

  return (
    <motion.section
      className="landing-section landing-pain-solution border-y border-[color:var(--lb-glass-border)]"
      style={{ background: "var(--lb-bg)" }}
      aria-label="Problema y solución"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.35 }}
    >
      <div className="landing-container">
        <div className="landing-pain-solution__grid">
          <div className="landing-pain-solution__block">
            <p className="landing-pain-solution__overline">El problema</p>
            <h2 className="landing-pain-solution__title">{painHeadline}</h2>
            <p className="landing-pain-solution__text">{painSubline}</p>
          </div>
          <div className="landing-pain-solution__block landing-pain-solution__block--solution">
            <p className="landing-pain-solution__overline">La solución</p>
            <h3 className="landing-pain-solution__subtitle">{solutionHeadline}</h3>
            <ul className="landing-pain-solution__list">
              {solutionPoints.map((point, i) => (
                <li key={i} className="landing-pain-solution__item">
                  <CheckCircle2
                    className="landing-pain-solution__icon"
                    style={{ color: "var(--lb-accent)" }}
                    aria-hidden
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
