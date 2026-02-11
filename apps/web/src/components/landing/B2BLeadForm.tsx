import React, { useState } from "react";
import { Zap, Users, Share2 } from "lucide-react";
import { landingContent } from "@/config/content";
import { track, LANDING_EVENTS } from "@/lib/track";

const { b2b } = landingContent;
type Role = (typeof b2b.form.roleOptions)[number];

const BULLETS = [
  {
    icon: Zap,
    text: "Genera visibilidad inmediata para tus eventos y clases.",
  },
  {
    icon: Users,
    text: "Recibe leads directos a tu WhatsApp o sitio web.",
  },
  {
    icon: Share2,
    text: "Publica en segundos desde nuestra plataforma de gestión.",
  },
];

export function B2BLeadForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [touched, setTouched] = useState(false);
  const [success, setSuccess] = useState(false);

  const errors = {
    name: touched && !name.trim() ? "Requerido" : "",
    contact: touched && !contact.trim() ? "Requerido" : "",
    role: touched && !role ? "Elige un rol" : "",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!name.trim() || !contact.trim() || !role) return;

    track(LANDING_EVENTS.LEAD_SUBMIT, {
      role,
      hasName: !!name.trim(),
      hasContact: !!contact.trim(),
    });
    setSuccess(true);
    setName("");
    setContact("");
    setRole("");
    setTouched(false);
  };

  return (
    <section className="landing-b2b" id="negocios" aria-labelledby="b2b-heading">
      <div className="landing-container">
        <p className="landing-b2b__overline">Para academias y maestros</p>
        <div className="landing-b2b__grid">
          <div className="landing-b2b__content">
            <h2 id="b2b-heading" className="landing-b2b__title">
              Si enseñas u organizas,
              <span className="accent"> aquí está tu audiencia</span>
            </h2>
            <p className="landing-b2b__sub">
              Llega a bailarines que buscan clases y eventos reales. Sin algoritmos, con datos que tú publicas.
            </p>

            <div className="landing-b2b__bullets">
              {BULLETS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="landing-b2b__bullet">
                    <div className="ico" aria-hidden>
                      <Icon size={18} strokeWidth={2} />
                    </div>
                    <div>{item.text}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="landing-card">
            <h3 className="landing-card__title">Quiero aparecer en Donde Bailar</h3>

            {success ? (
              <p
                className="text-center font-semibold py-4 rounded-xl"
                style={{ color: "var(--lb-accent)", background: "rgba(255, 138, 0, 0.1)" }}
                role="status"
              >
                {b2b.form.successMessage}
              </p>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="landing-field">
                  <div className="label">Nombre completo</div>
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setTouched(true)}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "b2b-name-err" : undefined}
                  />
                  {errors.name && (
                    <p id="b2b-name-err" className="landing-error">{errors.name}</p>
                  )}
                </div>

                <div className="landing-field">
                  <div className="label">WhatsApp / Email</div>
                  <input
                    type="text"
                    inputMode="email"
                    placeholder="Ej. 55 1234 5678"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    onBlur={() => setTouched(true)}
                    aria-invalid={!!errors.contact}
                    aria-describedby={errors.contact ? "b2b-contact-err" : undefined}
                  />
                  {errors.contact && (
                    <p id="b2b-contact-err" className="landing-error">{errors.contact}</p>
                  )}
                </div>

                <div className="landing-field">
                  <div className="label">Soy…</div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role | "")}
                    onBlur={() => setTouched(true)}
                    aria-invalid={!!errors.role}
                    aria-describedby={errors.role ? "b2b-role-err" : undefined}
                  >
                    <option value="">Selecciona</option>
                    {b2b.form.roleOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {errors.role && (
                    <p id="b2b-role-err" className="landing-error">{errors.role}</p>
                  )}
                </div>

                <button type="submit" className="btn btn-primary btn-wide">
                  <span>QUIERO APARECER EN DONDE BAILAR</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
