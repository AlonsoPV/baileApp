import React from 'react';
import SeoHead from '../../components/SeoHead';

export default function LegalScreen() {
  const lastUpdateDate = '15 de enero de 2025'; // Actualizar cuando sea necesario
  const supportEmail = 'info@dondebailar.com.mx';
  const websiteUrl = 'https://dondebailar.com.mx';

  return (
    <>
      <SeoHead
        title="Aviso de Privacidad | Donde Bailar MX"
        description="Aviso de Privacidad de Donde Bailar MX. Conoce cómo protegemos y utilizamos tus datos personales conforme a la LFPDPPP."
        keywords={['aviso de privacidad', 'protección de datos', 'privacidad', 'donde bailar']}
      />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #0b1020 100%)',
        color: '#e5e7eb',
        padding: '32px 16px'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 800,
              color: '#fff',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              marginBottom: 8
            }}>
              🔒 Aviso de Privacidad
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.9rem',
              margin: 0
            }}>
              Donde Bailar MX
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.85rem',
              margin: '8px 0 0 0'
            }}>
              Fecha de última actualización: {lastUpdateDate}
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16,
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            padding: '32px 24px',
            lineHeight: 1.8,
            fontSize: '0.95rem'
          }}>
            <p style={{ marginBottom: 24, color: 'rgba(255,255,255,0.9)' }}>
              En <strong>Donde Bailar MX</strong>, con sitio web <a href={websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>{websiteUrl}</a>, respetamos su privacidad y la protección de sus datos personales. Este Aviso de Privacidad explica cómo recopilamos, usamos, almacenamos, protegemos y compartimos su información conforme a la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> y demás normatividad aplicable en México.
            </p>
            <p style={{ marginBottom: 24, color: 'rgba(255,255,255,0.9)' }}>
              Al utilizar nuestros servicios, usted acepta las prácticas descritas en este Aviso.
            </p>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                1. Responsable del tratamiento de datos personales
              </h2>
              <div style={{ paddingLeft: 16, borderLeft: '3px solid rgba(96,165,250,0.5)' }}>
                <p style={{ marginBottom: 8 }}>
                  <strong>Donde Bailar MX</strong>
                </p>
                <p style={{ marginBottom: 8 }}>
                  Sitio web: <a href={websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>{websiteUrl}</a>
                </p>
                <p style={{ marginBottom: 0 }}>
                  Correo de contacto: <a href={`mailto:${supportEmail}`} style={{ color: '#60a5fa', textDecoration: 'underline' }}>{supportEmail}</a>
                </p>
                <p style={{ marginTop: 12, marginBottom: 0, color: 'rgba(255,255,255,0.8)' }}>
                  Somos responsables de la recopilación y protección de los datos personales proporcionados por nuestros usuarios.
                </p>
              </div>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                2. Datos personales que recabamos
              </h2>
              <p style={{ marginBottom: 16, color: 'rgba(255,255,255,0.9)' }}>
                Para brindar una experiencia adecuada dentro de la plataforma, podemos recopilar los siguientes datos personales:
              </p>
              
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  a) Datos proporcionados directamente por el usuario
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Nombre completo</li>
                  <li>Correo electrónico</li>
                  <li>Teléfono (opcional)</li>
                  <li>Fotografía o avatar (opcional)</li>
                  <li>Información de perfil dentro de la app</li>
                  <li>Preferencias de clases, zonas o ritmos de baile</li>
                </ul>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  b) Datos recabados automáticamente
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Dirección IP</li>
                  <li>Tipo de dispositivo y navegador</li>
                  <li>Sistema operativo</li>
                  <li>Cookies y tecnologías similares</li>
                  <li>Identificadores únicos de dispositivo</li>
                  <li>Actividad dentro de la app (clases vistas, clases agregadas, interacciones)</li>
                </ul>
              </div>

              <div style={{ marginBottom: 0 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  c) Datos obtenidos mediante terceros o proveedores
                </h3>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.85)' }}>
                  Si el usuario inicia sesión con:
                </p>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Google u otros proveedores OAuth</li>
                </ul>
                <p style={{ marginTop: 8, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  podemos recibir información básica del perfil (correo, nombre y foto autorizada).
                </p>
              </div>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                3. Finalidades del tratamiento
              </h2>
              
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  Finalidades primarias (necesarias):
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Crear, administrar y mantener su cuenta de usuario.</li>
                  <li>Permitir el uso de las funciones principales de la aplicación:
                    <ul style={{ paddingLeft: 24, marginTop: 8 }}>
                      <li>Búsqueda de clases de baile</li>
                      <li>Registro de clases preferidas</li>
                      <li>Guardado de filtros o preferencias</li>
                      <li>Gestión de calendario tentativo</li>
                    </ul>
                  </li>
                  <li>Brindar acceso seguro mediante autenticación.</li>
                  <li>Mejorar la funcionalidad de la app y su rendimiento.</li>
                  <li>Contactarlo para temas relacionados con su cuenta o seguridad.</li>
                </ul>
              </div>

              <div style={{ marginBottom: 0 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  Finalidades secundarias (opcionales):
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Enviarle recomendaciones de clases, academias o ritmos.</li>
                  <li>Enviar notificaciones, promociones o newsletters.</li>
                  <li>Realizar análisis estadísticos y métricas de uso.</li>
                  <li>Mejorar la experiencia del usuario mediante personalización.</li>
                </ul>
                <p style={{ marginTop: 12, marginBottom: 0, color: 'rgba(255,255,255,0.85)', padding: '12px 16px', background: 'rgba(96,165,250,0.1)', borderRadius: 8, border: '1px solid rgba(96,165,250,0.2)' }}>
                  Si no desea que sus datos se utilicen para finalidades secundarias, puede solicitarlo en cualquier momento enviando un correo a: <a href={`mailto:${supportEmail}`} style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 600 }}>{supportEmail}</a>
                </p>
              </div>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                4. Transferencias de datos personales
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                Podemos compartir sus datos personales con los siguientes tipos de terceros:
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                <li>Proveedores tecnológicos necesarios para la operación de la plataforma (Supabase, Google Cloud, Vercel, servicios de autenticación, analítica, almacenamiento, etc.)</li>
                <li>Autoridades competentes, cuando lo soliciten conforme a la ley.</li>
              </ul>
              <p style={{ marginTop: 12, marginBottom: 0, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                No vendemos información personal a terceros bajo ninguna circunstancia.
              </p>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                5. Uso de cookies y tecnologías similares
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                Utilizamos cookies y tecnologías similares para:
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                <li>Mantener su sesión iniciada</li>
                <li>Recordar preferencias</li>
                <li>Medir rendimiento y uso</li>
                <li>Mejorar la experiencia del usuario</li>
              </ul>
              <p style={{ marginTop: 12, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                Puede desactivarlas en la configuración de su navegador, aunque algunas funciones podrían no funcionar correctamente.
              </p>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                6. Medidas de seguridad
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                Implementamos medidas administrativas, técnicas y físicas para proteger sus datos personales, tales como:
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                <li>Encriptación de datos</li>
                <li>Servidores seguros</li>
                <li>Controles de acceso</li>
                <li>Monitoreo de actividad</li>
                <li>Autenticación segura mediante OAuth (Google)</li>
              </ul>
              <p style={{ marginTop: 12, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                Aunque adoptamos las mejores prácticas, ningún sistema es 100% infalible.
              </p>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                7. Derechos ARCO
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                Usted tiene derecho a:
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 20, color: 'rgba(255,255,255,0.85)' }}>
                <li><strong>Acceder</strong> a sus datos personales.</li>
                <li><strong>Rectificarlos</strong> si son inexactos o incompletos.</li>
                <li><strong>Cancelar</strong> su uso cuando considere que no se requieren para las finalidades establecidas.</li>
                <li><strong>Oponerse</strong> al tratamiento para finalidades específicas.</li>
              </ul>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                Para ejercer cualquiera de estos derechos, envíe una solicitud al correo: <a href={`mailto:${supportEmail}`} style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 600 }}>{supportEmail}</a>
              </p>
              <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                Debe incluir:
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                <li>Nombre completo</li>
                <li>Correo asociado a la cuenta</li>
                <li>Descripción clara del derecho que desea ejercer</li>
                <li>Identificación oficial</li>
              </ul>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                8. Revocación del consentimiento
              </h2>
              <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                En cualquier momento puede solicitar la cancelación de su cuenta y la eliminación de sus datos escribiendo a: <a href={`mailto:${supportEmail}`} style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 600 }}>{supportEmail}</a>
              </p>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                9. Conservación de datos
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                Sus datos se conservarán mientras su cuenta esté activa.
              </p>
              <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                Si solicita la eliminación de su cuenta, sus datos serán eliminados conforme a los tiempos y procesos internos del sistema.
              </p>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                10. Cambios al Aviso de Privacidad
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                Nos reservamos el derecho de actualizar este Aviso de Privacidad cuando sea necesario.
              </p>
              <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                Cualquier cambio será publicado en: <a href={`${websiteUrl}/aviso-de-privacidad`} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>{websiteUrl}/aviso-de-privacidad</a>
              </p>
            </section>

            <section style={{ marginBottom: 0 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                11. Aceptación
              </h2>
              <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                Al usar Donde Bailar MX, usted acepta este Aviso de Privacidad y sus términos.
              </p>
            </section>

            <div style={{
              marginTop: 48,
              padding: '24px',
              background: 'rgba(96,165,250,0.1)',
              borderRadius: 12,
              border: '1px solid rgba(96,165,250,0.2)',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>
                ¿Tienes preguntas sobre tu privacidad?
              </p>
              <p style={{ margin: '8px 0 0 0' }}>
                <a href={`mailto:${supportEmail}`} style={{
                  color: '#60a5fa',
                  textDecoration: 'underline',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}>
                  Contáctanos en {supportEmail}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
