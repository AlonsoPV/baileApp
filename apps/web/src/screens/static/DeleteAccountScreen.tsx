import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/components/Toast';
import SeoHead from '@/components/SeoHead';
import { supabase } from '@/lib/supabase';

export default function DeleteAccountScreen() {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: user?.email || '',
    fullName: '',
    reason: '',
    confirmDelete: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      showToast('Por favor ingresa tu correo electrónico', 'error');
      return;
    }

    if (!formData.confirmDelete) {
      showToast('Debes confirmar que deseas eliminar tu cuenta', 'error');
      return;
    }

    if (deleteConfirmationText !== 'ELIMINAR') {
      showToast('Por favor escribe "ELIMINAR" para confirmar', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Intentar usar función de Supabase si existe
      const { error: functionError } = await supabase.functions.invoke('request-account-deletion', {
        body: {
          email: formData.email,
          fullName: formData.fullName,
          reason: formData.reason || 'Solicitud desde página pública de eliminación',
          userId: user?.id || null,
        }
      });

      if (functionError) {
        // Fallback a email
        const subject = encodeURIComponent('URGENTE: Solicitud de Eliminación de Cuenta - Donde Bailar MX');
        const body = encodeURIComponent(
          `Solicitud URGENTE de Eliminación de Cuenta y Datos Personales\n\n` +
          `Nombre completo: ${formData.fullName || 'No proporcionado'}\n` +
          `Correo asociado a la cuenta: ${formData.email}\n` +
          `ID de usuario: ${user?.id || 'No disponible (solicitud sin sesión)'}\n` +
          `Razón: ${formData.reason || 'No especificada'}\n` +
          `Fecha de solicitud: ${new Date().toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}\n\n` +
          `El usuario ha confirmado la eliminación completa de su cuenta y todos sus datos personales.\n\n` +
          `Por favor, proceda con la eliminación de:\n` +
          `- Cuenta de autenticación (auth.users)\n` +
          `- Perfil de usuario (profiles_user)\n` +
          `- Perfiles relacionados (academia, maestro, organizador, marca)\n` +
          `- Eventos y clases creados\n` +
          `- Interacciones (RSVPs, seguimientos)\n` +
          `- Notificaciones\n` +
          `- Imágenes y archivos en Supabase Storage\n\n` +
          `Adjunto identificación oficial para verificación (si aplica).`
        );
        
        window.location.href = `mailto:info@dondebailar.com.mx?subject=${subject}&body=${body}`;
      }

      showToast('✅ Tu solicitud ha sido enviada. Te contactaremos en un plazo máximo de 30 días.', 'success');
      
      // Si el usuario está logueado, cerrar sesión
      if (user) {
        setTimeout(async () => {
          await signOut();
          navigate('/');
        }, 2000);
      } else {
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error: any) {
      console.error('[DeleteAccountScreen] Error:', error);
      showToast('Error al procesar la solicitud. Por favor contacta a info@dondebailar.com.mx', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead
        title="Eliminar Cuenta | Donde Bailar MX"
        description="Solicita la eliminación de tu cuenta y datos personales de Donde Bailar MX"
        keywords={['eliminar cuenta', 'borrar datos', 'privacidad', 'donde bailar']}
      />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #0b1020 100%)',
        color: '#e5e7eb',
        padding: '32px 16px'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h1 style={{
                margin: 0,
                fontSize: '2rem',
                fontWeight: 800,
                color: '#fff',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                marginBottom: 8
              }}>
                🗑️ Eliminar Cuenta y Datos Personales
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem',
                margin: 0
              }}>
                Donde Bailar MX
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16,
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
              padding: '32px 24px',
              marginBottom: 24
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 0
              }}>
                Información Importante
              </h2>
              
              <div style={{ lineHeight: 1.8, fontSize: '0.95rem', marginBottom: 24 }}>
                <p style={{ marginBottom: 12 }}>
                  Al solicitar la eliminación de tu cuenta, se eliminarán <strong>permanentemente</strong>:
                </p>
                <ul style={{ marginLeft: 20, marginBottom: 12 }}>
                  <li>Tu cuenta de autenticación</li>
                  <li>Tu perfil de usuario y todos los perfiles relacionados (academia, maestro, organizador, marca)</li>
                  <li>Todos los eventos y clases que hayas creado</li>
                  <li>Tus interacciones (RSVPs, seguimientos, notificaciones)</li>
                  <li>Tus imágenes y archivos subidos</li>
                  <li>Todos los datos personales asociados a tu cuenta</li>
                </ul>
                <p style={{ 
                  color: '#fbbf24', 
                  fontWeight: 600,
                  marginTop: 16,
                  padding: 12,
                  background: 'rgba(251, 191, 36, 0.1)',
                  borderRadius: 8,
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}>
                  ⚠️ Esta acción es <strong>irreversible</strong>. No podrás recuperar tus datos después de la eliminación.
                </p>
                <p style={{ marginTop: 16 }}>
                  <strong>Plazo de procesamiento:</strong> Procesaremos tu solicitud en un plazo máximo de <strong>30 días</strong> desde la recepción de tu solicitud.
                </p>
                <p style={{ marginTop: 12 }}>
                  <strong>Datos que se conservan:</strong> Podemos conservar ciertos datos por períodos adicionales según lo requiera la ley (por ejemplo, registros de transacciones por razones fiscales). Estos datos se eliminarán automáticamente al cumplirse los períodos legales aplicables.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16,
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
              padding: '32px 24px'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 24,
                marginTop: 0
              }}>
                Formulario de Solicitud
              </h2>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#fff'
                }}>
                  Correo Electrónico de la Cuenta *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@email.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
                {!user && (
                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: 'rgba(255,255,255,0.6)', 
                    marginTop: 8,
                    marginBottom: 0
                  }}>
                    Si no tienes sesión iniciada, ingresa el correo asociado a tu cuenta.
                  </p>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#fff'
                }}>
                  Nombre Completo (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Tu nombre completo"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#fff'
                }}>
                  Razón (Opcional)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="¿Por qué deseas eliminar tu cuenta? (Opcional)"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.confirmDelete}
                    onChange={(e) => setFormData({ ...formData, confirmDelete: e.target.checked })}
                    style={{
                      marginTop: 4,
                      width: 20,
                      height: 20,
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                    Confirmo que he leído y entiendo que la eliminación de mi cuenta es <strong>permanente e irreversible</strong>, 
                    y que todos mis datos personales serán eliminados según se describe arriba. *
                  </span>
                </label>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 12,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#fff'
                }}>
                  Para confirmar, escribe "ELIMINAR" en el siguiente campo: *
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="ELIMINAR"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: '1rem',
                    textTransform: 'uppercase'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formData.confirmDelete || deleteConfirmationText !== 'ELIMINAR'}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: isSubmitting || !formData.confirmDelete || deleteConfirmationText !== 'ELIMINAR'
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: isSubmitting || !formData.confirmDelete || deleteConfirmationText !== 'ELIMINAR'
                    ? 'not-allowed'
                    : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: isSubmitting || !formData.confirmDelete || deleteConfirmationText !== 'ELIMINAR'
                    ? 'none'
                    : '0 4px 12px rgba(239, 68, 68, 0.4)'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting && formData.confirmDelete && deleteConfirmationText === 'ELIMINAR') {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isSubmitting ? 'Enviando solicitud...' : 'Enviar Solicitud de Eliminación'}
              </button>

              <p style={{
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.6)',
                marginTop: 16,
                textAlign: 'center',
                marginBottom: 0
              }}>
                O contacta directamente a{' '}
                <a 
                  href="mailto:info@dondebailar.com.mx" 
                  style={{ color: '#60a5fa', textDecoration: 'underline' }}
                >
                  info@dondebailar.com.mx
                </a>
              </p>
            </form>

            <div style={{
              marginTop: 24,
              padding: 16,
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 8
            }}>
              <p style={{
                fontSize: '0.9rem',
                color: '#93c5fd',
                margin: 0,
                lineHeight: 1.6
              }}>
                <strong>¿Necesitas ayuda?</strong> Si tienes preguntas sobre la eliminación de tu cuenta o 
                deseas solicitar la eliminación de solo una parte de tus datos, puedes contactarnos en{' '}
                <a 
                  href="mailto:info@dondebailar.com.mx" 
                  style={{ color: '#93c5fd', textDecoration: 'underline' }}
                >
                  info@dondebailar.com.mx
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

