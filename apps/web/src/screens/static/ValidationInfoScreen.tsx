import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function ValidationInfoScreen() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #2a1a2a)',
      padding: '2rem 0',
      color: '#fff'
    }}>
      <style>{`
        .validation-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .validation-hero {
          text-align: center;
          margin-bottom: 3rem;
        }
        .validation-hero h1 {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 900;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #f093fb, #f5576c, #FFD166, #1E88E5);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .validation-hero p {
          font-size: 1.2rem;
          color: rgba(255,255,255,0.8);
          max-width: 600px;
          margin: 0 auto;
        }
        .validation-section {
          margin-bottom: 2.5rem;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.15);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .validation-section h2 {
          font-size: 1.75rem;
          font-weight: 800;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .validation-section p {
          font-size: 1rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.85);
          margin-bottom: 1rem;
        }
        .validation-list {
          list-style: none;
          padding: 0;
          margin: 1.5rem 0;
        }
        .validation-list li {
          padding: 1rem;
          margin-bottom: 0.75rem;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          border-left: 3px solid rgba(240,147,251,0.5);
          display: flex;
          align-items: start;
          gap: 0.75rem;
        }
        .validation-list li::before {
          content: '✓';
          color: #10B981;
          font-weight: 900;
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .validation-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 999px;
          background: rgba(16,185,129,0.15);
          border: 1px solid rgba(16,185,129,0.35);
          color: #9be7a1;
          font-weight: 700;
          font-size: 0.9rem;
          margin: 0.5rem 0;
        }
        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 999px;
          border: 2px solid rgba(240,147,251,0.3);
          background: rgba(240,147,251,0.15);
          color: #f093fb;
          font-weight: 800;
          cursor: pointer;
          font-size: 0.95rem;
          margin-bottom: 2rem;
          transition: all 0.2s ease;
        }
        .back-button:hover {
          background: rgba(240,147,251,0.25);
          border-color: rgba(240,147,251,0.5);
          transform: translateY(-2px);
        }
        @media (max-width: 768px) {
          .validation-container {
            padding: 0 16px;
          }
          .validation-section {
            padding: 1.5rem;
          }
        }
      `}</style>
      
      <div className="validation-container">
        <motion.button
          className="back-button"
          onClick={() => navigate(-1)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Volver
        </motion.button>

        <motion.div
          className="validation-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>¿Qué significa el ✅ en los perfiles?</h1>
          <p>
            El símbolo ✅ indica que un perfil ha sido verificado y validado por nuestro equipo, 
            garantizando la autenticidad y seguridad de la información.
          </p>
        </motion.div>

        <motion.section
          className="validation-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h2>🔒 Proceso de Validación</h2>
          <p>
            Nuestro proceso de validación es riguroso y está diseñado para proteger tanto a los 
            usuarios como a la comunidad. Cuando un perfil solicita la verificación, nuestro equipo 
            revisa cuidadosamente la información proporcionada.
          </p>
          
          <ul className="validation-list">
            <li>
              <strong>Verificación de identidad:</strong> Confirmamos que la persona o entidad 
              detrás del perfil es quien dice ser, verificando documentos oficiales y credenciales.
            </li>
            <li>
              <strong>Validación de información:</strong> Revisamos que los datos del perfil 
              (ubicación, contacto, servicios) sean precisos y verificables.
            </li>
            <li>
              <strong>Revisión de contenido:</strong> Aseguramos que el contenido publicado cumple 
              con nuestras políticas de comunidad y estándares de calidad.
            </li>
            <li>
              <strong>Verificación de actividad:</strong> Confirmamos que el perfil representa una 
              actividad real y activa en la comunidad de baile.
            </li>
          </ul>
        </motion.section>

        <motion.section
          className="validation-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2>🛡️ Seguridad que Garantizamos</h2>
          <p>
            La verificación con ✅ garantiza varios aspectos importantes de seguridad:
          </p>
          
          <ul className="validation-list">
            <li>
              <strong>Autenticidad:</strong> El perfil pertenece a una persona o entidad real y 
              verificada, reduciendo el riesgo de perfiles falsos o fraudulentos.
            </li>
            <li>
              <strong>Confianza:</strong> Puedes confiar en que la información del perfil ha sido 
              verificada y es precisa.
            </li>
            <li>
              <strong>Protección:</strong> Los perfiles verificados están sujetos a estándares más 
              estrictos, lo que ayuda a proteger a la comunidad de actividades maliciosas.
            </li>
            <li>
              <strong>Calidad:</strong> Garantizamos que los perfiles verificados cumplen con 
              nuestros estándares de calidad y profesionalismo.
            </li>
          </ul>
        </motion.section>

        <motion.section
          className="validation-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2>📋 Estados del Perfil</h2>
          <p>
            Los perfiles pueden tener diferentes estados durante el proceso de validación:
          </p>
          
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <span className="validation-badge">✅ Verificado</span>
              <p style={{ marginTop: '0.5rem', marginLeft: '0' }}>
                El perfil ha completado exitosamente el proceso de validación y ha sido verificado 
                por nuestro equipo. Puedes confiar en la autenticidad de este perfil.
              </p>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                background: 'rgba(255,209,102,0.15)',
                border: '1px solid rgba(255,209,102,0.35)',
                color: '#ffd98c',
                fontWeight: 700,
                fontSize: '0.9rem',
                margin: '0.5rem 0'
              }}>
                ⏳ En revisión
              </span>
              <p style={{ marginTop: '0.5rem', marginLeft: '0' }}>
                El perfil ha solicitado la verificación y está siendo revisado por nuestro equipo. 
                Este proceso puede tomar algunos días.
              </p>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 700,
                fontSize: '0.9rem',
                margin: '0.5rem 0'
              }}>
                📝 Borrador
              </span>
              <p style={{ marginTop: '0.5rem', marginLeft: '0' }}>
                El perfil está en modo borrador y aún no ha sido publicado o enviado para revisión.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="validation-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2>💡 ¿Cómo obtener la verificación?</h2>
          <p>
            Si eres dueño de un perfil y deseas obtener la verificación:
          </p>
          
          <ul className="validation-list">
            <li>
              Completa toda la información de tu perfil de manera precisa y detallada.
            </li>
            <li>
              Asegúrate de que toda la información sea verificable (ubicaciones reales, 
              contactos válidos, etc.).
            </li>
            <li>
              Mantén tu perfil activo y actualizado con contenido relevante.
            </li>
            <li>
              Cumple con nuestras políticas de comunidad y estándares de calidad.
            </li>
            <li>
              Una vez que tu perfil esté completo, nuestro equipo lo revisará automáticamente 
              o puedes contactarnos para acelerar el proceso.
            </li>
          </ul>
        </motion.section>

        <motion.div
          style={{ 
            textAlign: 'center', 
            marginTop: '3rem',
            padding: '2rem',
            background: 'rgba(30,136,229,0.1)',
            borderRadius: '20px',
            border: '1px solid rgba(30,136,229,0.3)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)', marginBottom: '1rem' }}>
            ¿Tienes más preguntas sobre el proceso de validación?
          </p>
          <button
            onClick={() => navigate('/explore')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              border: '1px solid rgba(30,136,229,0.5)',
              background: 'linear-gradient(135deg, rgba(30,136,229,0.25), rgba(0,188,212,0.2))',
              color: '#90caf9',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(30,136,229,0.35), rgba(0,188,212,0.3))';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(30,136,229,0.25), rgba(0,188,212,0.2))';
            }}
          >
            Explorar perfiles verificados
          </button>
        </motion.div>
      </div>
    </div>
  );
}

