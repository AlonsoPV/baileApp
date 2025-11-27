import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormData {
  nombre: string;
  correo: string;
  celular: string;
  roles: string[];
  tipoPerfil: string;
  redesSociales: string;
  datosInteres: string;
}

const ROLES_OPTIONS = [
  { id: 'usuario', label: 'Usuario / Bailarín' },
  { id: 'teacher', label: 'Maestro' },
  { id: 'academy', label: 'Academia' },
  { id: 'organizer', label: 'Organizador' },
  { id: 'brand', label: 'Marca' },
];

const TIPO_PERFIL_OPTIONS = [
  { id: 'academia', label: 'Academia' },
  { id: 'organizador', label: 'Organizador' },
  { id: 'maestro', label: 'Maestro' },
  { id: 'marca', label: 'Marca' },
  { id: 'otro', label: 'Otro' },
];

export default function JoinCommunityForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    correo: '',
    celular: '',
    roles: [],
    tipoPerfil: '',
    redesSociales: '',
    datosInteres: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter(r => r !== roleId)
        : [...prev.roles, roleId]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      newErrors.correo = 'Correo inválido';
    }

    if (formData.celular && !/^[\d\s\-\+\(\)]+$/.test(formData.celular)) {
      newErrors.celular = 'Formato de celular inválido';
    }

    if (formData.roles.length === 0) {
      newErrors.roles = 'Selecciona al menos un rol de interés';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar el contenido del correo
      const emailSubject = encodeURIComponent('Nueva solicitud para formar parte de la comunidad');
      const emailBody = encodeURIComponent(`
Nueva solicitud para formar parte de la comunidad Donde Bailar MX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 INFORMACIÓN PERSONAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nombre: ${formData.nombre}
Correo: ${formData.correo}
${formData.celular ? `Celular: ${formData.celular}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎭 ROLES DE INTERÉS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formData.roles.map(roleId => {
  const role = ROLES_OPTIONS.find(r => r.id === roleId);
  return `• ${role?.label || roleId}`;
}).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏢 TIPO DE PERFIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formData.tipoPerfil ? TIPO_PERFIL_OPTIONS.find(t => t.id === formData.tipoPerfil)?.label || formData.tipoPerfil : 'No especificado'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 REDES SOCIALES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formData.redesSociales || 'No proporcionado'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 DATOS DE INTERÉS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formData.datosInteres || 'No proporcionado'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enviado desde: ${window.location.href}
Fecha: ${new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'long' })}
      `);

      // Usar mailto: para enviar el correo
      const mailtoLink = `mailto:alpeva96@gmail.com?subject=${emailSubject}&body=${emailBody}`;
      window.location.href = mailtoLink;

      // Mostrar mensaje de éxito
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitSuccess(false);
        setFormData({
          nombre: '',
          correo: '',
          celular: '',
          roles: [],
          tipoPerfil: '',
          redesSociales: '',
          datosInteres: '',
        });
      }, 3000);
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      alert('Error al enviar el formulario. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .join-cta-button {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.85);
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .join-cta-button:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
          color: rgba(255, 255, 255, 0.95);
        }
        .join-cta-button:active {
          transform: scale(0.98);
        }
        .form-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          z-index: 9998;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .form-container {
          background: linear-gradient(135deg, #1a1d29 0%, #0f1117 100%);
          border-radius: 24px;
          border: 2px solid rgba(240, 147, 251, 0.3);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          z-index: 9999;
        }
        .form-header {
          padding: 2rem 2rem 1rem;
          border-bottom: 1px solid rgba(240, 147, 251, 0.2);
          position: sticky;
          top: 0;
          background: linear-gradient(135deg, #1a1d29 0%, #0f1117 100%);
          z-index: 10;
        }
        .form-title {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #f093fb, #FFD166);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem 0;
        }
        .form-subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
          margin: 0;
        }
        .form-close {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          transition: all 0.2s ease;
        }
        .form-close:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: rotate(90deg);
        }
        .form-body {
          padding: 2rem;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-label {
          display: block;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .form-label .required {
          color: #f5576c;
        }
        .form-label .optional {
          color: rgba(255, 255, 255, 0.5);
          font-weight: 400;
          font-size: 0.75rem;
        }
        .form-input,
        .form-textarea,
        .form-select {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 12px;
          padding-right: 2.5rem;
        }
        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
          outline: none;
          border-color: rgba(240, 147, 251, 0.5);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
        }
        .form-select option {
          background: #1a1d29;
          color: white;
        }
        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }
        .form-error {
          color: #f5576c;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        .roles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        .role-checkbox {
          position: relative;
        }
        .role-checkbox input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }
        .role-checkbox-label {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        .role-checkbox input:checked + .role-checkbox-label {
          background: linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2));
          border-color: rgba(240, 147, 251, 0.5);
          color: white;
          box-shadow: 0 0 0 3px rgba(240, 147, 251, 0.1);
        }
        .form-submit {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #FFD166 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(240, 147, 251, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 1rem;
        }
        .form-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(240, 147, 251, 0.6);
        }
        .form-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .success-message {
          padding: 2rem;
          text-align: center;
        }
        .success-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        .success-text {
          color: white;
          font-size: 1.125rem;
          font-weight: 600;
        }
        @media (max-width: 768px) {
          .form-container {
            max-width: 100%;
            border-radius: 20px;
          }
          .form-header {
            padding: 1.5rem 1.5rem 1rem;
          }
          .form-body {
            padding: 1.5rem;
          }
          .form-title {
            font-size: 1.25rem;
          }
          .roles-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <button
        className="join-cta-button"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        ✨ Quiero formar parte
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <motion.div
              className="form-container"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
            >
              {submitSuccess ? (
                <div className="success-message">
                  <div className="success-icon">✅</div>
                  <div className="success-text">
                    ¡Gracias por tu interés!<br />
                    Se abrirá tu cliente de correo para enviar tu solicitud.
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-header">
                    <button
                      className="form-close"
                      onClick={() => setIsOpen(false)}
                      type="button"
                      aria-label="Cerrar"
                    >
                      ×
                    </button>
                    <h2 className="form-title">Únete a la comunidad</h2>
                    <p className="form-subtitle">
                      Completa el formulario y nos pondremos en contacto contigo
                    </p>
                  </div>

                  <form className="form-body" onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label className="form-label">
                        Nombre <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.nombre}
                        onChange={(e) => handleInputChange('nombre', e.target.value)}
                        placeholder="Tu nombre completo"
                        required
                      />
                      {errors.nombre && (
                        <div className="form-error">{errors.nombre}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Correo electrónico <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-input"
                        value={formData.correo}
                        onChange={(e) => handleInputChange('correo', e.target.value)}
                        placeholder="tu@correo.com"
                        required
                      />
                      {errors.correo && (
                        <div className="form-error">{errors.correo}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Celular <span className="optional">(opcional)</span>
                      </label>
                      <input
                        type="tel"
                        className="form-input"
                        value={formData.celular}
                        onChange={(e) => handleInputChange('celular', e.target.value)}
                        placeholder="55 1234 5678"
                      />
                      {errors.celular && (
                        <div className="form-error">{errors.celular}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        ¿Qué roles te interesan? <span className="required">*</span>
                      </label>
                      <div className="roles-grid">
                        {ROLES_OPTIONS.map((role) => (
                          <div key={role.id} className="role-checkbox">
                            <input
                              type="checkbox"
                              id={`role-${role.id}`}
                              checked={formData.roles.includes(role.id)}
                              onChange={() => handleRoleToggle(role.id)}
                            />
                            <label
                              htmlFor={`role-${role.id}`}
                              className="role-checkbox-label"
                            >
                              {role.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      {errors.roles && (
                        <div className="form-error">{errors.roles}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Tipo de perfil
                      </label>
                      <select
                        className="form-select"
                        value={formData.tipoPerfil}
                        onChange={(e) => handleInputChange('tipoPerfil', e.target.value)}
                      >
                        <option value="">Selecciona una opción</option>
                        {TIPO_PERFIL_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Redes sociales
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.redesSociales}
                        onChange={(e) => handleInputChange('redesSociales', e.target.value)}
                        placeholder="Instagram, Facebook, TikTok, etc."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Datos de interés
                      </label>
                      <textarea
                        className="form-textarea"
                        value={formData.datosInteres}
                        onChange={(e) => handleInputChange('datosInteres', e.target.value)}
                        placeholder="Cuéntanos más sobre ti, tu proyecto, experiencia, etc."
                      />
                    </div>

                    <button
                      type="submit"
                      className="form-submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

