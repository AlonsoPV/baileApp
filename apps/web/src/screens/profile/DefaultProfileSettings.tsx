import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { routes } from '@/routes/registry';
import { useDefaultProfile } from "../../hooks/useDefaultProfile";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useAcademyMy } from "../../hooks/useAcademyMy";
import { useTeacherMy } from "../../hooks/useTeacher";
import { useMyApprovedRoles } from "../../hooks/useMyApprovedRoles";
import DefaultProfileSelector from "../../components/profile/DefaultProfileSelector";
import { Chip } from "../../components/profile/Chip";
import { useAuth } from "@/contexts/AuthProvider";
import { useToast } from "../../components/Toast";
import { supabase } from "../../lib/supabase";
import { updatePassword } from "../../utils/passwordReset";

const colors = {
  primary: '#E53935',
  secondary: '#FB8C00',
  blue: '#1E88E5',
  coral: '#FF7043',
  light: '#F5F5F5',
  dark: '#1A1A1A',
  orange: '#FF9800'
};

export default function DefaultProfileSettings() {
  const navigate = useNavigate();
  const { getProfileOptions, defaultProfile } = useDefaultProfile();
  const { data: organizerProfile, refetch: refetchOrganizer } = useMyOrganizer();
  const { data: academyProfile, refetch: refetchAcademy } = useAcademyMy();
  const { data: teacherProfile, refetch: refetchTeacher } = useTeacherMy();
  const { data: approvedRoles } = useMyApprovedRoles();
  const [refreshKey, setRefreshKey] = React.useState(0);
  
  // Forzar refetch al montar el componente para obtener datos actualizados
  React.useEffect(() => {
    refetchOrganizer();
    refetchAcademy();
    refetchTeacher();
  }, [refetchOrganizer, refetchAcademy, refetchTeacher]);
  
  // Escuchar cambios en el perfil por defecto desde localStorage
  React.useEffect(() => {
    const handleStorageChange = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Función helper para obtener el estado de aprobación considerando role_requests
  const getApprovalStatus = (profileType: 'organizer' | 'academy' | 'teacher', profile: any) => {
    const roleSlug = profileType === 'organizer' ? 'organizador' : profileType === 'academy' ? 'academia' : 'maestro';
    const isRoleApproved = approvedRoles?.approved?.includes(roleSlug as any) || false;
    const profileStatus = profile?.estado_aprobacion;
    
    console.log(`[getApprovalStatus] ${profileType}:`, { isRoleApproved, profileStatus, approvedRoles: approvedRoles?.approved });
    
    // Si el rol no está aprobado, no mostrar estado de perfil
    if (!isRoleApproved) {
      return null;
    }
    
    // Si el rol está aprobado, mostrar el estado del perfil
    if (profileStatus === 'aprobado') return '✅ Verificado';
    if (profileStatus === 'en_revision') return '⏳ En revisión';
    if (profileStatus === 'rechazado') return '❌ Rechazado';
    return '📝 Borrador';
  };
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMethod, setDeleteMethod] = useState<'email' | 'direct'>('email');
  
  // Estados para cambiar contraseña
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [hasPassword, setHasPassword] = useState(false);

  const profileOptions = getProfileOptions();
  
  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    
    // Validar campos
    if (hasPassword && !currentPassword) {
      setPasswordError('Por favor ingresa tu contraseña actual');
      return;
    }
    
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    if (hasPassword && currentPassword === newPassword) {
      setPasswordError('La nueva contraseña debe ser diferente a la actual');
      return;
    }
    
    setIsSettingPassword(true);
    try {
      const result = await updatePassword(newPassword, hasPassword ? currentPassword : undefined);
      if (result.success) {
        setPasswordSuccess(hasPassword 
          ? 'Contraseña actualizada correctamente' 
          : 'Contraseña establecida correctamente. Ahora puedes iniciar sesión con email y contraseña.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
        setHasPassword(true); // Ahora tiene contraseña
        showToast(hasPassword ? 'Contraseña actualizada correctamente' : 'Contraseña establecida correctamente', 'success');
      } else {
        setPasswordError(result.error?.message || (hasPassword ? 'Error al actualizar la contraseña' : 'Error al establecer la contraseña'));
        showToast(hasPassword ? 'Error al actualizar la contraseña' : 'Error al establecer la contraseña', 'error');
      }
    } catch (error: any) {
      setPasswordError(error?.message || 'Error inesperado');
      showToast(hasPassword ? 'Error al actualizar la contraseña' : 'Error al establecer la contraseña', 'error');
    } finally {
      setIsSettingPassword(false);
    }
  };
  
  const handleDeleteRequest = async () => {
    if (!user?.email) {
      showToast('No se pudo obtener tu información de usuario', 'error');
      return;
    }

    if (deleteMethod === 'email') {
      // Enviar solicitud por email
      const subject = encodeURIComponent('Solicitud de Eliminación de Datos - Donde Bailar MX');
      const body = encodeURIComponent(
        `Solicitud de Eliminación de Datos Personales\n\n` +
        `Nombre completo: [Por favor completa]\n` +
        `Correo asociado a la cuenta: ${user.email}\n` +
        `ID de usuario: ${user.id}\n\n` +
        `Descripción: Solicito la eliminación completa de mi cuenta y todos mis datos personales de acuerdo con el Aviso de Privacidad.\n\n` +
        `Fecha de solicitud: ${new Date().toLocaleDateString('es-MX')}\n\n` +
        `Adjunto identificación oficial para verificación.`
      );
      
      window.location.href = `mailto:info@dondebailar.com.mx?subject=${subject}&body=${body}`;
      showToast('Se abrió tu cliente de correo. Por favor envía la solicitud con tu identificación oficial.', 'success');
      return;
    }

    // Eliminación directa (requiere confirmación)
    if (deleteConfirmationText !== 'ELIMINAR') {
      showToast('Por favor escribe "ELIMINAR" para confirmar', 'error');
      return;
    }

    setIsDeleting(true);
    
    try {
      // Nota: En Supabase, eliminar el usuario de auth.users eliminará automáticamente
      // todos los datos relacionados debido a ON DELETE CASCADE
      // Sin embargo, esto requiere permisos especiales del servidor
      
      // Por ahora, enviaremos un email al administrador
      const { error: emailError } = await supabase.functions.invoke('request-account-deletion', {
        body: {
          userId: user.id,
          email: user.email,
          reason: 'Solicitud del usuario desde la aplicación'
        }
      });

      if (emailError) {
        // Si la función no existe, usar el método de email
        const subject = encodeURIComponent('URGENTE: Solicitud de Eliminación de Cuenta');
        const body = encodeURIComponent(
          `Solicitud URGENTE de Eliminación de Cuenta\n\n` +
          `Usuario ID: ${user.id}\n` +
          `Email: ${user.email}\n` +
          `Fecha: ${new Date().toISOString()}\n\n` +
          `El usuario ha confirmado la eliminación desde la aplicación.`
        );
        window.location.href = `mailto:info@dondebailar.com.mx?subject=${subject}&body=${body}`;
      }

      showToast('Tu solicitud ha sido enviada. Te contactaremos pronto.', 'success');
      
      // Cerrar sesión después de un momento
      setTimeout(async () => {
        await signOut();
        navigate('/');
      }, 2000);
      
    } catch (error: any) {
      console.error('[DeleteAccount] Error:', error);
      showToast('Error al procesar la solicitud. Por favor contacta a info@dondebailar.com.mx', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmationText('');
    }
  };

  return (
    <>
      <style>{`
        .settings-back-button {
          position: absolute;
          left: 0;
          top: 0;
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          color: ${colors.light};
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .settings-back-button:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }
        @media (max-width: 768px) {
          .settings-back-button {
            position: relative;
            top: 0;
            left: 0;
            margin-bottom: 1rem;
            width: 100%;
            justify-content: center;
          }
        }
        @media (max-width: 480px) {
          .settings-back-button {
            padding: 0.6rem 1rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark} 0%, #2C2C2C 100%)`,
        color: colors.light,
        padding: '2rem 1rem'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '3rem',
            padding: '2rem 0',
            borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
            position: 'relative'
          }}>
            {/* Botón de volver */}
            <button
              onClick={() => navigate('/profile/edit')}
              className="settings-back-button"
            >
              <span>←</span>
              <span>Volver al Editor</span>
            </button>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '4rem 0 1rem 0'
          }}>
            🎯 Configurar Perfil por Defecto
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0
          }}>
            Elige tu perfil principal para navegación rápida
          </p>
        </div>

        {/* Selector de Perfil por Defecto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            marginBottom: '3rem',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <DefaultProfileSelector 
            key={refreshKey}
            showTitle={true}
            onProfileChange={(profileType) => {
              console.log('Perfil por defecto cambiado a:', profileType);
              showToast(`Perfil por defecto cambiado a: ${profileType}`, 'success');
              // Forzar actualización del componente
              setRefreshKey(prev => prev + 1);
            }}
          />
        </motion.div>

        {/* Información de Perfiles Disponibles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            marginBottom: '3rem',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '1.5rem',
            color: colors.light,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📋 Tus Perfiles Disponibles
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {profileOptions.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                style={{
                  padding: '1.5rem',
                  background: option.id === defaultProfile 
                    ? 'rgba(229, 57, 53, 0.2)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: option.id === defaultProfile 
                    ? `2px solid ${colors.primary}` 
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {option.icon}
                  </span>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    margin: 0,
                    color: colors.light
                  }}>
                    {option.name}
                  </h3>
                  {option.id === defaultProfile && (
                    <Chip
                      label="Por Defecto"
                      active={true}
                    />
                  )}
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  {option.hasProfile ? (
                    <Chip
                      label="✓ Configurado"
                      active={true}
                    />
                  ) : (
                    <Chip
                      label="⚠️ No configurado"
                      active={false}
                    />
                  )}
                  
                  {/* Estado de aprobación para organizador, academia y maestro */}
                  {option.hasProfile && (option.id === 'organizer' || option.id === 'academy' || option.id === 'teacher') && (() => {
                    const status = option.id === 'organizer' 
                      ? getApprovalStatus('organizer', organizerProfile)
                      : option.id === 'academy'
                      ? getApprovalStatus('academy', academyProfile)
                      : getApprovalStatus('teacher', teacherProfile);
                    
                    return status ? (
                      <Chip
                        label={status}
                        active={false}
                      />
                    ) : null;
                  })()}
                  
                  {!option.available && (
                    <Chip
                      label="Próximamente"
                      active={false}
                    />
                  )}
                </div>
                
                <p style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: '0 0 1rem 0',
                  lineHeight: 1.4
                }}>
                  {option.id === 'user' && 'Tu perfil personal como usuario de la plataforma.'}
                  {option.id === 'organizer' && 'Perfil para organizadores de eventos y actividades.'}
                  {option.id === 'academy' && 'Perfil para academias y centros de enseñanza.'}
                  {option.id === 'teacher' && 'Perfil para maestros e instructores independientes.'}
                  {option.id === 'brand' && 'Perfil para marcas y empresas del sector.'}
                </p>
                
                {option.hasProfile && (
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(option.route)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: colors.light,
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      👁️ Ver
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(`${option.route}/edit`)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: colors.primary,
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ✏️ Editar
                    </motion.button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Sección de Cambio de Contraseña */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          style={{
            marginBottom: '3rem',
            padding: '2rem',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              color: colors.light,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🔐 {hasPassword ? 'Cambiar Contraseña' : 'Establecer Contraseña'}
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowPasswordSection(!showPasswordSection);
                setPasswordError('');
                setPasswordSuccess('');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              style={{
                padding: '0.5rem 1rem',
                background: showPasswordSection ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                border: `1px solid ${showPasswordSection ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                borderRadius: '8px',
                color: colors.light,
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {showPasswordSection ? '✕ Cancelar' : '✏️ ' + (hasPassword ? 'Cambiar' : 'Establecer')}
            </motion.button>
          </div>

          {showPasswordSection && (
            <div>
              {passwordSuccess && (
                <div style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  borderRadius: '8px',
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  color: '#4ade80'
                }}>
                  {passwordSuccess}
                </div>
              )}

              {passwordError && (
                <div style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ff6b6b'
                }}>
                  {passwordError}
                </div>
              )}

              <div style={{ display: 'grid', gap: '1rem' }}>
                {hasPassword && (
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: 600
                    }}>
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña actual"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 600
                  }}>
                    {hasPassword ? 'Nueva Contraseña' : 'Contraseña'}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 600
                  }}>
                    Confirmar {hasPassword ? 'Nueva ' : ''}Contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleChangePassword}
                  disabled={isSettingPassword}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isSettingPassword 
                      ? 'rgba(59, 130, 246, 0.5)' 
                      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(30, 136, 229, 0.95))',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: isSettingPassword ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isSettingPassword ? 0.6 : 1
                  }}
                >
                  {isSettingPassword ? '⏳ Actualizando...' : (hasPassword ? '✅ Actualizar Contraseña' : '✅ Establecer Contraseña')}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Sección de Eliminación de Datos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            marginBottom: '3rem',
            padding: '2rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '16px',
            border: '2px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '1rem',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🗑️ Eliminación de Datos de Usuario
          </h2>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '1.5rem',
            lineHeight: 1.6
          }}>
            De acuerdo con el <a href="/aviso-de-privacidad" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Aviso de Privacidad</a>, tienes derecho a solicitar la eliminación de tu cuenta y todos tus datos personales en cualquier momento.
          </p>

          {!showDeleteConfirm ? (
            <div>
              <div style={{
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.15)',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.95)',
                  margin: 0,
                  fontWeight: 600,
                  marginBottom: '0.5rem'
                }}>
                  ⚠️ Advertencia Importante
                </p>
                <ul style={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  margin: 0,
                  paddingLeft: '1.5rem',
                  lineHeight: 1.8
                }}>
                  <li>Esta acción es <strong>irreversible</strong></li>
                  <li>Se eliminarán todos tus perfiles (usuario, organizador, academia, maestro, marca)</li>
                  <li>Se eliminarán todos tus datos personales, fotos, videos y contenido</li>
                  <li>Se eliminarán tus RSVPs, clases guardadas y preferencias</li>
                  <li>No podrás recuperar tu cuenta después de la eliminación</li>
                </ul>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setDeleteMethod('email');
                    setShowDeleteConfirm(true);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '2px solid #ef4444',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📧 Solicitar por Email
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setDeleteMethod('direct');
                    setShowDeleteConfirm(true);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🗑️ Eliminar Cuenta Directamente
                </motion.button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '1rem',
                fontWeight: 600
              }}>
                {deleteMethod === 'email' 
                  ? 'Se abrirá tu cliente de correo con un mensaje prellenado. Por favor completa tu información y adjunta una identificación oficial.'
                  : 'Para confirmar, escribe "ELIMINAR" en el campo de abajo:'}
              </p>

              {deleteMethod === 'direct' && (
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="Escribe ELIMINAR para confirmar"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '2px solid #ef4444',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    marginBottom: '1rem'
                  }}
                />
              )}

              <div style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteRequest}
                  disabled={isDeleting || (deleteMethod === 'direct' && deleteConfirmationText !== 'ELIMINAR')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isDeleting || (deleteMethod === 'direct' && deleteConfirmationText !== 'ELIMINAR')
                      ? 'rgba(239, 68, 68, 0.5)'
                      : '#ef4444',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: isDeleting || (deleteMethod === 'direct' && deleteConfirmationText !== 'ELIMINAR')
                      ? 'not-allowed'
                      : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isDeleting || (deleteMethod === 'direct' && deleteConfirmationText !== 'ELIMINAR') ? 0.6 : 1
                  }}
                >
                  {isDeleting ? '⏳ Procesando...' : deleteMethod === 'email' ? '📧 Abrir Email' : '🗑️ Confirmar Eliminación'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmationText('');
                  }}
                  disabled={isDeleting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Cancelar
                </motion.button>
              </div>
            </div>
          )}

          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.85)',
              margin: 0,
              fontSize: '0.875rem',
              lineHeight: 1.6
            }}>
              <strong>💡 Información:</strong> Si tienes dudas o necesitas ayuda, puedes contactarnos en{' '}
              <a href="mailto:info@dondebailar.com.mx" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                info@dondebailar.com.mx
              </a>
              {' '}o revisar nuestro{' '}
              <a href="/aviso-de-privacidad" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                Aviso de Privacidad
              </a>.
            </p>
          </div>
        </motion.div>

        {/* Información Adicional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{
            padding: '2rem',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            textAlign: 'center'
          }}
        >
          <h3 style={{
            fontSize: '1.25rem',
            color: '#3b82f6',
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            💡 ¿Cómo funciona?
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            margin: '0 0 1rem 0',
            lineHeight: 1.6
          }}>
            El perfil por defecto determina a dónde te llevan los botones de navegación en el menú y la barra superior. 
            Puedes cambiarlo en cualquier momento desde esta pantalla.
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(routes.app.profile)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: colors.light,
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              ← Volver al Perfil
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/explore')}
              style={{
                padding: '0.75rem 1.5rem',
                background: colors.primary,
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🔍 Explorar
            </motion.button>
          </div>
        </motion.div>
        </div>
      </div>
    </>
  );
}
