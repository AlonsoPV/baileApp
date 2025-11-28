import React from 'react';
import SeoHead from '../../components/SeoHead';

export default function LegalScreen() {
  const lastUpdateDate = 'Noviembre 2025'; // Actualizar cuando sea necesario
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
            <p style={{ marginBottom: 24, color: 'rgba(255,255,255,0.9)', fontSize: '1.05rem', fontWeight: 500 }}>
              <strong>AVISO DE PRIVACIDAD INTEGRAL</strong>
            </p>
            <p style={{ marginBottom: 24, color: 'rgba(255,255,255,0.9)' }}>
              Donde Bailar MX, en su calidad de responsable del tratamiento de datos personales (en adelante, el "Responsable"), pone a disposición de las personas usuarias (en adelante, el "Titular" o los "Titulares") el presente Aviso de Privacidad, de conformidad con la legislación aplicable en materia de protección de datos personales en México.
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
                1. Identidad y domicilio del responsable
              </h2>
              <div style={{ paddingLeft: 16, borderLeft: '3px solid rgba(96,165,250,0.5)' }}>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                  <strong>Donde Bailar MX</strong>, en su calidad de responsable del tratamiento de datos personales (en adelante, el "Responsable"), con domicilio en <strong>Ciudad de México, CDMX, México</strong>, pone a disposición de las personas usuarias (en adelante, el "Titular" o los "Titulares") el presente Aviso de Privacidad, de conformidad con la legislación aplicable en materia de protección de datos personales en México.
                </p>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                  Para cualquier asunto relacionado con este Aviso de Privacidad, puedes contactarnos en:
                </p>
                <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                  Correo electrónico de contacto: <a href={`mailto:${supportEmail}`} style={{ color: '#60a5fa', textDecoration: 'underline' }}>{supportEmail}</a>
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
                Los datos personales que recabamos pueden incluir, de manera enunciativa mas no limitativa, los siguientes:
              </p>
              
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  2.1 Datos de registro y autenticación
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Nombre y/o nombre público</li>
                  <li>Correo electrónico</li>
                  <li>Contraseña (almacenada de forma cifrada a través de Supabase Auth)</li>
                  <li>Fotografía o avatar de perfil</li>
                </ul>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  2.2 Datos de perfil de usuario bailarín
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Nombre público o display name</li>
                  <li>Biografía o descripción</li>
                  <li>Fotografía de perfil (avatar)</li>
                  <li>Rol de baile (lead, follow, ambos u otro)</li>
                  <li>Ritmos de baile de interés</li>
                  <li>Zonas de baile de interés</li>
                  <li>Redes sociales y medios de contacto (por ejemplo: Instagram, Facebook, TikTok, YouTube, WhatsApp, sitio web)</li>
                  <li>Datos opcionales que el Titular decida compartir en su perfil (dato curioso, por qué le gusta bailar, premios, logros, fotografías y videos relacionados con el baile)</li>
                </ul>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  2.3 Datos de perfiles de maestro, academia, organizador y marca
                </h3>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.85)' }}>
                  En caso de que el Titular cree un perfil como maestro, academia, organizador o marca, se recaban además:
                </p>
                <ul style={{ paddingLeft: 24, marginBottom: 8, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Nombre público del perfil</li>
                  <li>Biografía o descripción</li>
                  <li>Ritmos que enseña o promueve</li>
                  <li>Zonas en las que opera</li>
                  <li>Ubicaciones de clases o eventos</li>
                  <li>Horarios, cronogramas y costos de clases, servicios o eventos</li>
                  <li>Promociones y paquetes</li>
                  <li>Redes sociales, medios de contacto y sitio web</li>
                  <li>Galería de imágenes y videos relacionados con el servicio</li>
                  <li>Reseñas recibidas de otros usuarios</li>
                </ul>
                <p style={{ marginTop: 8, marginBottom: 0, color: 'rgba(255,255,255,0.85)', padding: '12px 16px', background: 'rgba(255,193,7,0.1)', borderRadius: 8, border: '1px solid rgba(255,193,7,0.2)' }}>
                  En el caso de perfiles que reciban pagos: datos bancarios necesarios para procesar pagos (por ejemplo, cuenta bancaria, CLABE, nombre del titular), los cuales se tratarán como información de carácter financiero y estrictamente confidencial.
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  2.4 Formularios de contacto "Quiero formar parte"
                </h3>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.85)' }}>
                  Cuando el Titular utiliza el formulario "Quiero formar parte", se pueden recabar:
                </p>
                <ul style={{ paddingLeft: 24, marginBottom: 8, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Nombre completo</li>
                  <li>Correo electrónico</li>
                  <li>Teléfono</li>
                  <li>Roles de interés</li>
                  <li>Tipo de perfil deseado</li>
                  <li>Redes sociales y otros datos de interés que el Titular decida proporcionar</li>
                </ul>
                <p style={{ marginTop: 8, marginBottom: 0, color: 'rgba(255,255,255,0.85)', padding: '12px 16px', background: 'rgba(96,165,250,0.1)', borderRadius: 8, border: '1px solid rgba(96,165,250,0.2)' }}>
                  Este formulario se envía por correo electrónico a nuestro buzón interno y no se almacena en la base de datos de la plataforma.
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  2.5 Actividad dentro de la plataforma
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Clases y eventos vistos o consultados</li>
                  <li>Clases y eventos marcados como "interesado" o agregados al calendario</li>
                  <li>RSVPs o asistencias tentativas a clases y eventos (incluyendo fecha, evento o clase, rol de baile y zona)</li>
                  <li>Interacciones dentro de la app (búsquedas, filtros, clics relevantes)</li>
                  <li>Notificaciones generadas y su estado de lectura</li>
                </ul>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  2.6 Datos técnicos y de navegación
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Dirección IP</li>
                  <li>Tipo de dispositivo, sistema operativo y navegador</li>
                  <li>Identificadores técnicos de sesión</li>
                  <li>URLs visitadas dentro de la app</li>
                  <li>Duración y fecha de las sesiones</li>
                </ul>
              </div>

              <div style={{ marginBottom: 0 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  2.7 Datos obtenidos de terceros (OAuth)
                </h3>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.85)' }}>
                  En caso de que el Titular inicie sesión mediante proveedores externos (por ejemplo, Google o Facebook), podremos recibir:
                </p>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Correo electrónico asociado a la cuenta</li>
                  <li>Nombre</li>
                  <li>Fotografía de perfil</li>
                  <li>Identificador del proveedor de autenticación</li>
                </ul>
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
                  3.1 Finalidades primarias (necesarias para el servicio)
                </h3>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                  Los datos personales serán tratados para las siguientes finalidades necesarias:
                </p>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Crear, administrar y autenticar la cuenta de usuario.</li>
                  <li>Permitir el acceso a las funcionalidades de la plataforma Donde Bailar MX, incluyendo:
                    <ul style={{ paddingLeft: 24, marginTop: 8 }}>
                      <li>Búsqueda y exploración de clases, academias, maestros, eventos y marcas.</li>
                      <li>Creación, edición y publicación de perfiles públicos (usuario, maestro, academia, organizador, marca).</li>
                      <li>Registro de interés y asistencia tentativa a clases y eventos.</li>
                      <li>Gestión de cronogramas, clases y eventos por parte de maestros, academias y organizadores.</li>
                      <li>Mostrar información de perfiles públicos (nombre, biografía, foto, ritmos, zonas, redes sociales y media) a otros usuarios dentro de la comunidad.</li>
                    </ul>
                  </li>
                  <li>En su caso, gestionar pagos y cobros vinculados a maestros, academias, organizadores o marcas (incluyendo el uso de datos bancarios).</li>
                  <li>Enviar notificaciones relacionadas con:
                    <ul style={{ paddingLeft: 24, marginTop: 8 }}>
                      <li>Seguridad de la cuenta.</li>
                      <li>Cambios relevantes en los términos, políticas o funcionamiento de la plataforma.</li>
                      <li>Actualizaciones relacionadas con clases, eventos o actividad del perfil del Titular.</li>
                    </ul>
                  </li>
                  <li>Cumplir con obligaciones legales y regulatorias aplicables.</li>
                  <li>Atender dudas, quejas, aclaraciones o solicitudes relacionadas con el servicio.</li>
                </ul>
              </div>

              <div style={{ marginBottom: 0 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  3.2 Finalidades secundarias (opcionales)
                </h3>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                  Adicionalmente, podremos utilizar tus datos para las siguientes finalidades opcionales:
                </p>
                <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Enviar recomendaciones personalizadas de clases, academias, eventos, maestros o marcas de acuerdo con tus ritmos, zonas y actividad en la app.</li>
                  <li>Enviar información sobre promociones, noticias, beneficios, encuestas o actualizaciones comerciales de Donde Bailar MX o de aliados comerciales del ecosistema del baile.</li>
                  <li>Analizar estadísticas y métricas de uso de la plataforma con fines de mejora continua, experiencia de usuario y desarrollo de nuevas funcionalidades.</li>
                </ul>
                <p style={{ marginTop: 12, marginBottom: 0, color: 'rgba(255,255,255,0.85)', padding: '12px 16px', background: 'rgba(96,165,250,0.1)', borderRadius: 8, border: '1px solid rgba(96,165,250,0.2)' }}>
                  En caso de que no desees que tus datos sean tratados para estas finalidades secundarias, puedes en cualquier momento manifestar tu negativa enviando un correo a: <a href={`mailto:${supportEmail}`} style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 600 }}>{supportEmail}</a>. La negativa para el uso de tus datos con estas finalidades no será motivo para negar el acceso a las funcionalidades principales de la plataforma.
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
                4. Base jurídica del tratamiento
              </h2>
              <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                Tratamos tus datos personales con fundamento en:
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                <li>El consentimiento que otorgas al registrarte o utilizar la plataforma.</li>
                <li>La relación jurídica que se genera al aceptar los Términos y Condiciones de Donde Bailar MX.</li>
                <li>El interés legítimo del Responsable para operar, mantener y mejorar la plataforma, siempre respetando tus derechos y expectativas razonables de privacidad.</li>
                <li>Las obligaciones legales aplicables en materia de protección de datos personales en México.</li>
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
                5. Datos personales sensibles
              </h2>
              <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                Donde Bailar MX no solicita ni requiere datos personales sensibles (por ejemplo, estado de salud, datos biométricos, origen étnico, creencias religiosas, opiniones políticas u otros de naturaleza análoga).
              </p>
              <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                En caso de que el Titular voluntariamente incluya información de este tipo en su biografía, descripciones, multimedia o campos de texto libre, será bajo su exclusiva responsabilidad. El Responsable se reserva el derecho de moderar y eliminar información que considere inadecuada o que pueda implicar riesgos para el Titular u otros usuarios.
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
                6. Transferencias y encargados
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                Tus datos personales podrán ser compartidos en los siguientes supuestos:
              </p>
              
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  6.1 Encargados (proveedores de servicios)
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Supabase u otros proveedores de infraestructura tecnológica (hosting, base de datos, almacenamiento de archivos, autenticación, notificaciones) que actúan como encargados del tratamiento de datos personales, ubicados dentro y fuera de México.</li>
                  <li>Proveedores de servicios de correo electrónico, log y monitoreo, herramientas de soporte o comunicación interna, que solo acceden a los datos en la medida necesaria para prestar sus servicios a Donde Bailar MX.</li>
                </ul>
                <p style={{ marginTop: 8, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  En estos casos, dichos terceros tratan los datos personales siguiendo nuestras instrucciones y bajo medidas contractuales y técnicas de confidencialidad y seguridad.
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  6.2 Proveedores de autenticación (OAuth)
                </h3>
                <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  Google, Facebook u otros proveedores de inicio de sesión que intervienen únicamente durante el proceso de autenticación, conforme a sus propias políticas de privacidad.
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  6.3 Autoridades
                </h3>
                <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  Podremos comunicar tus datos personales a autoridades competentes cuando así lo exija una ley, reglamento, mandato judicial o administrativo debidamente fundado y motivado.
                </p>
              </div>

              <div style={{ marginBottom: 0 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  6.4 Transferencias con fines de marketing
                </h3>
                <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  En caso de que, en el futuro, se prevean transferencias de datos personales con fines comerciales o de marketing a terceros distintos de los mencionados, te será informado y, cuando sea necesario, se recabará tu consentimiento expreso.
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
                7. Uso de cookies y tecnologías similares
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                La plataforma Donde Bailar MX utiliza:
              </p>
              
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  7.1 Cookies técnicas y de sesión
                </h3>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                  Cookies emitidas por Supabase Auth y por la propia plataforma, necesarias para:
                </p>
                <ul style={{ paddingLeft: 24, marginBottom: 8, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Mantener la sesión iniciada.</li>
                  <li>Garantizar la seguridad de autenticación.</li>
                  <li>Recordar ciertas preferencias de navegación.</li>
                </ul>
                <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.85)', padding: '12px 16px', background: 'rgba(96,165,250,0.1)', borderRadius: 8, border: '1px solid rgba(96,165,250,0.2)' }}>
                  Estas cookies son estrictamente necesarias para el funcionamiento de la plataforma y no pueden desactivarse desde nuestros sistemas.
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  7.2 Almacenamiento local (localStorage y sessionStorage)
                </h3>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                  Utilizamos localStorage y sessionStorage del navegador para guardar, por ejemplo:
                </p>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Borradores de formularios y filtros de búsqueda.</li>
                  <li>Preferencias de perfil y selección de rol.</li>
                  <li>Flags de verificación de seguridad (por ejemplo, verificación de PIN).</li>
                </ul>
              </div>

              <div style={{ marginBottom: 0 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  7.3 Herramientas de análisis y terceros
                </h3>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                  Al momento de la última actualización de este aviso, no utilizamos servicios de analítica de terceros (como Google Analytics o Facebook Pixel).
                </p>
                <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                  En caso de implementarse en el futuro, se actualizará este Aviso de Privacidad y, de ser necesario, se recabará el consentimiento del Titular.
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
                8. Medidas de seguridad
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                Donde Bailar MX implementa medidas de seguridad administrativas, técnicas y físicas para proteger tus datos personales, entre las que destacan:
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                <li>Uso de HTTPS/TLS para cifrar la comunicación entre tu dispositivo y nuestros servidores.</li>
                <li>Almacenamiento de contraseñas mediante algoritmos de hash seguro (por ejemplo, bcrypt) a través de Supabase Auth.</li>
                <li>Políticas de seguridad a nivel de fila (Row Level Security) en la base de datos, para que cada usuario solo pueda acceder a sus propios datos, salvo la información expresamente declarada como pública.</li>
                <li>Control de acceso restringido a la base de datos y a las herramientas administrativas.</li>
                <li>Respaldos de información bajo medidas de seguridad.</li>
              </ul>
              <p style={{ marginTop: 12, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                Si bien ninguna transmisión ni sistema de almacenamiento es 100% infalible, nos esforzamos por proteger tus datos personales y mejorar continuamente nuestras prácticas de seguridad.
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
                9. Conservación de los datos personales
              </h2>
              <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                Conservamos tus datos personales:
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                <li>Durante el tiempo que mantengas una cuenta activa en Donde Bailar MX.</li>
                <li>El tiempo adicional que resulte necesario para:
                  <ul style={{ paddingLeft: 24, marginTop: 8 }}>
                    <li>Cumplir con obligaciones legales o contractuales.</li>
                    <li>Atender requerimientos de autoridades.</li>
                    <li>Resguardar información en caso de posibles responsabilidades legales.</li>
                  </ul>
                </li>
              </ul>
              <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                En caso de solicitar la eliminación de tu cuenta, se procederá a:
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                <li>Eliminar o anonimizar los datos personales identificables, en la medida en que la ley y la operación del servicio lo permitan.</li>
                <li>Mantener únicamente aquella información que sea estrictamente necesaria para cumplir obligaciones legales o de seguridad.</li>
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
                10. Derechos ARCO y otros derechos del Titular
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                Como Titular de los datos personales, puedes ejercer en cualquier momento los derechos de:
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                <li><strong>Acceso</strong>: Saber qué datos tuyos tenemos y cómo los utilizamos.</li>
                <li><strong>Rectificación</strong>: Solicitar la corrección de datos inexactos o incompletos.</li>
                <li><strong>Cancelación</strong>: Solicitar la eliminación de tus datos cuando sea legalmente procedente.</li>
                <li><strong>Oposición</strong>: Oponerte al tratamiento de tus datos para finalidades específicas.</li>
              </ul>
              <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                Asimismo, puedes solicitar la limitación del uso o divulgación de tus datos y la revocación del consentimiento previamente otorgado, cuando proceda.
              </p>
              
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  10.1 Medios para ejercer tus derechos
                </h3>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                  Para ejercer tus derechos ARCO, revocar tu consentimiento o limitar el uso o divulgación de tus datos personales, puedes enviar una solicitud al correo:
                </p>
                <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                  <a href={`mailto:${supportEmail}`} style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 600 }}>{supportEmail}</a>
                </p>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                  La solicitud deberá contener, al menos:
                </p>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>Nombre completo del Titular y correo electrónico de contacto.</li>
                  <li>Acreditación de tu identidad (por ejemplo, desde el mismo correo con el que te registraste o adjuntando identificación oficial).</li>
                  <li>Descripción clara y precisa del derecho que deseas ejercer (acceso, rectificación, cancelación, oposición, revocación, limitación).</li>
                  <li>En su caso, datos o documentación que facilite la localización de la información (por ejemplo, tipo de perfil, correo de registro, etc.).</li>
                </ul>
                <p style={{ marginTop: 12, marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                  Te responderemos en los plazos establecidos por la legislación aplicable, indicando si tu solicitud resulta procedente y los pasos a seguir.
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
                11. Limitación del uso o divulgación de datos personales
              </h2>
              <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                Además de lo anterior, puedes solicitar que dejemos de enviarte comunicaciones con fines promocionales o comerciales mediante:
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                <li>El enlace de "cancelar suscripción" (cuando aplique), o</li>
                <li>El envío de un correo a <a href={`mailto:${supportEmail}`} style={{ color: '#60a5fa', textDecoration: 'underline' }}>{supportEmail}</a>, indicando que no deseas recibir este tipo de comunicaciones.</li>
              </ul>
              <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                Esto no afectará el envío de mensajes estrictamente necesarios para la seguridad de tu cuenta o el funcionamiento del servicio.
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
                12. Cambios al presente Aviso de Privacidad
              </h2>
              <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                Donde Bailar MX podrá modificar o actualizar en cualquier momento este Aviso de Privacidad, para adaptarlo a cambios normativos, prácticas internas o nuevos servicios ofrecidos.
              </p>
              <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                Cualquier modificación se publicará en:
              </p>
              <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                <a href={`${websiteUrl}/aviso-de-privacidad`} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>{websiteUrl}/aviso-de-privacidad</a>
              </p>
              <p style={{ marginTop: 12, marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                Se considerará que aceptas dichos cambios si continúas utilizando la plataforma después de la fecha de publicación del Aviso de Privacidad actualizado.
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
                13. Aceptación
              </h2>
              <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                Al crear una cuenta, utilizar la plataforma o proporcionarnos datos personales por cualquiera de los medios habilitados, declaras que:
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                <li>Has leído y comprendido este Aviso de Privacidad.</li>
                <li>Aceptas el tratamiento de tus datos personales conforme a las finalidades y condiciones aquí descritas.</li>
              </ul>
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
