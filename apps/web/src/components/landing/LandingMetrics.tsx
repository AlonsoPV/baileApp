import React from "react";

const METRICS = [
  { value: "+300", label: "Eventos publicados", accent: 1 },
  { value: "+120", label: "Academias activas", accent: 2 },
  { value: "+10k", label: "Búsquedas mensuales", accent: 3 },
];

export function LandingMetrics() {
  return (
    <section className="landing-metrics" aria-label="Métricas">
      <div className="landing-container">
        <p className="landing-metrics__overline">La comunidad en números</p>
        <div className="landing-metrics__grid">
          {METRICS.map((m, i) => (
            <article
              key={i}
              className={`metric metric--accent-${m.accent}`}
              aria-label={`${m.value} ${m.label}`}
            >
              <p className="metric__num">{m.value}</p>
              <p className="metric__label">{m.label}</p>
            </article>
          ))}
        </div>
        <p className="landing-metrics__note">
          Los números anteriores son placeholders con fines ilustrativos.
        </p>
      </div>
    </section>
  );
}
