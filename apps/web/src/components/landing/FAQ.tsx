import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { landingContent } from "@/config/content";

export function FAQ() {
  const [openId, setOpenId] = useState<number | null>(null);
  const { title, items } = landingContent.faq;

  return (
    <motion.section
      className="landing-section"
      style={{ background: "var(--lb-bg)" }}
      aria-labelledby="faq-heading"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
    >
      <div className="landing-container max-w-2xl mx-auto">
        <h2 id="faq-heading" className="landing-h2 text-center mb-8">
          {title}
        </h2>
        <div className="space-y-2" role="list">
          {items.map((item, i) => {
            const isOpen = openId === i;
            const id = `faq-${i}`;
            const answerId = `faq-answer-${i}`;
            return (
              <div
                key={i}
                className="faq-item"
                role="listitem"
              >
                <h3>
                  <button
                    type="button"
                    id={id}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenId(isOpen ? null : i)}
                  >
                    {item.q}
                    <ChevronDown
                      className={`w-5 h-5 flex-shrink-0 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                  </button>
                </h3>
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={id}
                  hidden={!isOpen}
                  className="px-4 pb-3 sm:px-5 sm:pb-4"
                >
                  <p className="landing-p landing-muted text-sm">
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
