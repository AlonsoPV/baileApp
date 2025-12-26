import React from 'react';
import SeoHead from '@/components/SeoHead';

const SUPPORT_EMAIL = 'info@dondebailar.com.mx';
const WHATSAPP_E164 = '525511981149';
const WHATSAPP_DISPLAY = '55 11 98 11 49';

export default function SupportScreen() {
  const subject = encodeURIComponent('Soporte — Donde Bailar MX');
  const body = encodeURIComponent(
    [
      'Hola equipo de Donde Bailar MX,',
      '',
      'Necesito ayuda con:',
      '- (Describe tu problema aquí)',
      '',
      'Datos útiles (opcional):',
      '- Correo de tu cuenta:',
      '- Dispositivo / navegador:',
      '- Captura o link (si aplica):',
      '',
      'Gracias.',
    ].join('\n'),
  );

  return (
    <>
      <SeoHead
        title="Soporte | Donde Bailar MX"
        description="Centro de soporte de Donde Bailar MX. Contáctanos por correo o WhatsApp y encuentra respuestas rápidas sobre inicio de sesión, pagos, reportes y eliminación de cuenta."
        keywords={['soporte', 'ayuda', 'contacto', 'donde bailar', 'cuenta', 'pagos']}
        url="https://dondebailar.com.mx/soporte"
      />

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #0b1020 100%)',
          color: '#e5e7eb',
          padding: '32px 16px',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(1.75rem, 3vw, 2.1rem)',
                fontWeight: 800,
                color: '#fff',
                textShadow: '0 2px 10px rgba(0,0,0,0.35)',
              }}
            >
              🛟 Soporte
            </h1>
            <p
              style={{
                margin: '10px 0 0 0',
                color: 'rgba(255,255,255,0.72)',
                fontSize: '0.95rem',
                lineHeight: 1.5,
              }}
            >
              Si tienes dudas o algún problema con la app, aquí tienes los canales oficiales para contactarnos.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 16,
                boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                padding: 18,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'rgba(96,165,250,0.14)',
                    border: '1px solid rgba(96,165,250,0.25)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 18,
                  }}
                >
                  📧
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#fff' }}>Correo</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                    Respuesta típica: 24–72 hrs
                  </div>
                </div>
              </div>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#93c5fd',
                  textDecoration: 'none',
                  fontWeight: 700,
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                }}
              >
                Enviar correo <span style={{ opacity: 0.9 }}>{SUPPORT_EMAIL}</span>
              </a>
              <p style={{ margin: '10px 0 0 0', color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.5 }}>
                Incluye capturas o links si aplica. Esto ayuda a resolver más rápido.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 16,
                boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                padding: 18,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'rgba(34,197,94,0.14)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 18,
                  }}
                >
                  💬
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#fff' }}>WhatsApp</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                    Para dudas rápidas
                  </div>
                </div>
              </div>
              <a
                href={`https://wa.me/${WHATSAPP_E164}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#86efac',
                  textDecoration: 'none',
                  fontWeight: 800,
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.25)',
                }}
              >
                Abrir chat <span style={{ opacity: 0.9 }}>{WHATSAPP_DISPLAY}</span>
              </a>
              <p style={{ margin: '10px 0 0 0', color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.5 }}>
                Por favor evita compartir información sensible (contraseñas o códigos).
              </p>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16,
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
              padding: '18px 18px',
            }}
          >
            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.15rem' }}>Respuestas rápidas</h2>

            <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
              <details
                style={{
                  background: 'rgba(0,0,0,0.18)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 14,
                  padding: '12px 14px',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 800, color: '#fff' }}>
                  No puedo iniciar sesión
                </summary>
                <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontSize: 14 }}>
                  Revisa tu conexión. Si usas Google, intenta cerrar y volver a abrir el navegador. Si el problema continúa,
                  escríbenos con el correo de tu cuenta y una captura del error.
                </div>
              </details>

              <details
                style={{
                  background: 'rgba(0,0,0,0.18)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 14,
                  padding: '12px 14px',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 800, color: '#fff' }}>
                  Reportar contenido o perfil
                </summary>
                <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontSize: 14 }}>
                  Envíanos el link del perfil/publicación y una breve descripción del motivo. Revisamos y moderamos según
                  nuestras políticas de comunidad.
                </div>
              </details>

              <details
                style={{
                  background: 'rgba(0,0,0,0.18)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 14,
                  padding: '12px 14px',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 800, color: '#fff' }}>
                  Eliminación de cuenta y datos
                </summary>
                <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontSize: 14 }}>
                  Puedes solicitarlo desde{' '}
                  <a href="/eliminar-cuenta" style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 800 }}>
                    /eliminar-cuenta
                  </a>
                  . También puedes escribirnos a{' '}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}?subject=${subject}`}
                    style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 800 }}
                  >
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </div>
              </details>

              <details
                style={{
                  background: 'rgba(0,0,0,0.18)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 14,
                  padding: '12px 14px',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 800, color: '#fff' }}>
                  Privacidad y uso de datos
                </summary>
                <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontSize: 14 }}>
                  Consulta nuestro{' '}
                  <a
                    href="/aviso-de-privacidad"
                    style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 800 }}
                  >
                    Aviso de Privacidad
                  </a>
                  .
                </div>
              </details>
            </div>
          </div>

          <div style={{ marginTop: 18, textAlign: 'center' }}>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              Donde Bailar MX — Centro de soporte
            </p>
          </div>
        </div>
      </div>
    </>
  );
}


