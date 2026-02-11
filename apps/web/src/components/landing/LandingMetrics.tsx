import React from "react";

const METRICS = [
  { value: "+300", label: "Eventos publicados" },
  { value: "+120", label: "Academias activas" },
  { value: "+10k", label: "Búsquedas mensuales" },
];

export function LandingMetrics() {
  return (
    <section className="landing-metrics" aria-label="Métricas">
      <div className="landing-container">
        <div className="landing-metrics__grid">
          {METRICS.map((m, i) => (
            <div key={i} className="metric">
              <p className="metric__num">{m.value}</p>
              <div className="metric__label">{m.label}</div>
            </div>
          ))}
        </div>
        <p className="metrics-note">
          ※ LOS NÚMEROS ANTERIORES SON PLACEHOLDERS CON FINES ILUSTRATIVOS.
        </p>
      </div>
    </section>
  );
}
