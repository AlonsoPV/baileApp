// src/pages/ProfileBasics.tsx
import { useState, FormEvent, ChangeEvent, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@ui/index';
import { colors, typography, spacing, borderRadius, transitions } from '../../theme/colors';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useToast } from '../../components/Toast';
import { supabase, getBucketPublicUrl } from '../../lib/supabase';
import { isValidDisplayName } from '../../utils/validation';
import { mergeProfile } from '../../utils/mergeProfile';

// Hoisted: evita recrear en cada render
const JOURNEY_HIGHLIGHTS = [
  {
    title: 'Personaliza tu presencia',
    detail: 'Este nombre será visible en tu perfil y tarjetas dentro de Dónde Bailar.',
    icon: '🎯'
  },
  {
    title: 'Foto clara y auténtica',
    detail: 'Ayuda a que la comunidad te reconozca rápidamente durante eventos y clases.',
    icon: '📸'
  },
  {
    title: 'Comparte tu estilo',
    detail: 'Describe qué te mueve al bailar y cómo participas en la comunidad.',
    icon: '💬'
  }
] as const;

const ROLE_BADGES: Record<'lead' | 'follow' | 'ambos', { label: string; desc: string; emoji: string }> = {
  lead: { label: 'Lead (Guía)', desc: 'Llevas la iniciativa y marcas el ritmo.', emoji: '🧭' },
  follow: { label: 'Follow (Seguidor/a)', desc: 'Interpretas y fluís con la guía.', emoji: '🎧' },
  ambos: { label: 'Ambos', desc: 'Te adaptas a ambos roles según el momento.', emoji: '♻️' },
};

export function ProfileBasics() {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [rolBaile, setRolBaile] = useState<'lead' | 'follow' | 'ambos' | ''>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Ref en vez de state: evita un render extra
  const profileInitializedRef = useRef(false);
  const submitTimeoutRef = useRef<number | null>(null);
  const previousObjectUrlRef = useRef<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, updateProfileFields } = useUserProfile();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Inicializar desde perfil (solo una vez)
  useEffect(() => {
    if (profile && !profileInitializedRef.current) {
      if (profile.display_name) setDisplayName(profile.display_name);
      if (profile.bio) setBio(profile.bio);
      if ((profile as any).rol_baile) {
        setRolBaile((profile as any).rol_baile as 'lead' | 'follow' | 'ambos');
      }
      if (profile.avatar_url) {
        setAvatarPreview(profile.avatar_url);
      }
      profileInitializedRef.current = true;
    }
  }, [profile]);

  // Redirección fuera del render
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        window.clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }
      if (previousObjectUrlRef.current) {
        URL.revokeObjectURL(previousObjectUrlRef.current);
        previousObjectUrlRef.current = null;
      }
    };
  }, []);

  const handleAvatarChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      
      // Si no hay archivo (usuario canceló), limpiar y salir
      if (!file) {
        // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
        e.target.value = '';
        return;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        const errorMsg = 'Por favor selecciona un archivo de imagen válido.';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        e.target.value = '';
        return;
      }

      // Validar tamaño máximo (10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        const errorMsg = 'La imagen es demasiado grande. Por favor selecciona una imagen menor a 10MB.';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        e.target.value = '';
        return;
      }

      // Validar tamaño mínimo (1KB)
      const minSize = 1024; // 1KB
      if (file.size < minSize) {
        const errorMsg = 'La imagen es demasiado pequeña. Por favor selecciona una imagen válida.';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        e.target.value = '';
        return;
      }

      setAvatarFile(file);
      setError(''); // Limpiar errores previos

      // Revoca el URL anterior para no filtrar memoria
      if (previousObjectUrlRef.current) {
        try {
          URL.revokeObjectURL(previousObjectUrlRef.current);
        } catch (revokeError) {
          console.warn('[ProfileBasics] Error al revocar URL anterior:', revokeError);
        }
        previousObjectUrlRef.current = null;
      }

      // Crear URL del objeto de forma segura
      try {
        const objectUrl = URL.createObjectURL(file);
        previousObjectUrlRef.current = objectUrl;
        setAvatarPreview(objectUrl);
      } catch (urlError) {
        console.error('[ProfileBasics] Error al crear ObjectURL:', urlError);
        const errorMsg = 'Error al procesar la imagen. Por favor intenta con otra imagen.';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        setAvatarFile(null);
        setAvatarPreview('');
        e.target.value = '';
      }
    } catch (error) {
      console.error('[ProfileBasics] Error inesperado en handleAvatarChange:', error);
      const errorMsg = 'Error inesperado al seleccionar la imagen. Por favor intenta de nuevo.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setAvatarFile(null);
      setAvatarPreview('');
      if (e.target) {
        e.target.value = '';
      }
    }
  }, [showToast]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');

    const nameValidation = isValidDisplayName(displayName);
    if (!nameValidation.valid) {
      const errorMsg =
        nameValidation.error ||
        'El nombre debe tener entre 2 y 50 caracteres y puede incluir letras con acentos, números, espacios y símbolos comunes.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      return;
    }

    const hasExistingAvatar = !!profile?.avatar_url;
    if (!avatarFile && !hasExistingAvatar) {
      const errorMsg = 'La foto de perfil es requerida. Sube una imagen para continuar.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      return;
    }

    setIsLoading(true);

    // Timeout de seguridad
    if (submitTimeoutRef.current) {
      window.clearTimeout(submitTimeoutRef.current);
    }
    submitTimeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
      submitTimeoutRef.current = null;
      showToast('La conexión está tardando demasiado. Intenta de nuevo en un momento.', 'error');
    }, 15000);

    try {
      let avatarUrl: string | undefined;

      if (avatarFile) {
        // Validar archivo antes de subir
        if (!avatarFile.type.startsWith('image/')) {
          throw new Error('El archivo seleccionado no es una imagen válida.');
        }

        // Procesar imagen de forma segura con manejo de errores
        let fileToUpload: File;
        try {
          // Intentar redimensionar si es necesario (máximo 800px)
          const { resizeImageIfNeeded } = await import('../../lib/imageResize');
          fileToUpload = await resizeImageIfNeeded(avatarFile, 800);
        } catch (resizeError) {
          console.warn('[ProfileBasics] Error al redimensionar imagen, usando original:', resizeError);
          // Si falla el redimensionamiento, usar el archivo original
          fileToUpload = avatarFile;
        }

        // Determinar extensión basada en el tipo de archivo
        const getExtension = (file: File): string => {
          const type = file.type.toLowerCase();
          if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
          if (type.includes('png')) return 'png';
          if (type.includes('webp')) return 'webp';
          if (type.includes('gif')) return 'gif';
          // Fallback: extraer del nombre del archivo
          const nameExt = file.name.split('.').pop()?.toLowerCase();
          return nameExt && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(nameExt) 
            ? nameExt 
            : 'jpg'; // Default a jpg si no se puede determinar
        };

        const ext = getExtension(fileToUpload);
        const fileName = `avatars/${user.id}.${ext}`;
        const contentType = fileToUpload.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        
        if (import.meta.env.MODE === 'development') {
          console.log('[ProfileBasics] Subiendo avatar:', { fileName, contentType, size: fileToUpload.size });
        }

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, fileToUpload, { 
            upsert: true,
            contentType: contentType
          });

        if (uploadError) {
          console.error('[ProfileBasics] Error de upload:', uploadError);
          throw new Error(`Error al subir la imagen: ${uploadError.message}`);
        }

        // Usa helper centralizado (cache-control consistente)
        avatarUrl = getBucketPublicUrl('media', fileName);
        
        // Validar que la URL se generó correctamente
        if (!avatarUrl || !avatarUrl.startsWith('http')) {
          console.error('[ProfileBasics] URL de avatar inválida:', avatarUrl);
          throw new Error('Error al generar la URL de la imagen. Por favor intenta de nuevo.');
        }
        
        if (import.meta.env.MODE === 'development') {
          console.log('[ProfileBasics] Avatar subido exitosamente:', avatarUrl);
        }
      }

      // Normalizar valores antes de crear el update
      // Convertir undefined a null para evitar problemas con la base de datos
      const normalizedUpdates = {
        display_name: displayName.trim() || null,
        bio: bio?.trim() || null,
        avatar_url: avatarUrl || profile?.avatar_url || null,
        rol_baile: rolBaile || null,
      };

      // Validar que tenemos al menos display_name y avatar_url
      if (!normalizedUpdates.display_name) {
        throw new Error('El nombre es requerido');
      }

      if (!normalizedUpdates.avatar_url) {
        throw new Error('La foto de perfil es requerida');
      }

      const updates = mergeProfile(profile as any, normalizedUpdates as any);

      // Logging detallado en desarrollo
      if (import.meta.env.MODE === 'development') {
        console.log('[ProfileBasics] Updates a enviar:', updates);
        console.log('[ProfileBasics] Avatar URL:', normalizedUpdates.avatar_url);
      }

      try {
        await updateProfileFields(updates);
        
        // Esperar un momento para asegurar que la actualización se complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        showToast('Perfil guardado exitosamente ✅', 'success');
        navigate('/onboarding/ritmos');
      } catch (updateError: any) {
        console.error('[ProfileBasics] Error en updateProfileFields:', updateError);
        
        // Mensajes de error más específicos
        let errorMessage = 'Error al guardar el perfil';
        if (updateError?.message) {
          errorMessage = updateError.message;
        } else if (updateError?.code) {
          errorMessage = `Error de base de datos (${updateError.code})`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error('[ProfileBasics] Error completo en handleSubmit:', err);
      
      // Mensaje de error más amigable para el usuario
      let userFriendlyMessage = 'Error al guardar el perfil. Por favor intenta de nuevo.';
      
      if (err?.message) {
        // Si el error ya tiene un mensaje claro, usarlo
        if (err.message.includes('subir') || err.message.includes('upload')) {
          userFriendlyMessage = 'Error al subir la imagen. Verifica tu conexión e intenta de nuevo.';
        } else if (err.message.includes('nombre') || err.message.includes('name')) {
          userFriendlyMessage = err.message;
        } else if (err.message.includes('foto') || err.message.includes('avatar')) {
          userFriendlyMessage = err.message;
        } else if (err.message.includes('base de datos') || err.message.includes('database')) {
          userFriendlyMessage = 'Error de conexión. Por favor intenta de nuevo en un momento.';
        } else {
          userFriendlyMessage = err.message;
        }
      }
      
      setError(userFriendlyMessage);
      showToast(userFriendlyMessage, 'error');
    } finally {
      if (submitTimeoutRef.current) {
        window.clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }
      setIsLoading(false);
    }
  }, [user, displayName, showToast, profile, avatarFile, bio, rolBaile, updateProfileFields, navigate]);

  // Loading auth (igual CSS)
  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(236, 72, 153, 0.25), transparent 45%),
            radial-gradient(circle at 80% 0%, rgba(59, 130, 246, 0.25), transparent 50%),
            linear-gradient(135deg, ${colors.dark[600]} 0%, ${colors.dark[300]} 100%)
          `,
          padding: 'clamp(1.5rem, 4vw, 4rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{
          textAlign: 'center',
          color: '#fff',
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.2)',
            borderTop: '4px solid #f472b6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>
            Estamos cargando tu sesión...
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '0.85rem', opacity: 0.7 }}>
            Si tarda mucho, intenta refrescar la página para una carga más rápida.
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Evita renderizar mientras navegamos por no-usuario
  if (!user) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(236, 72, 153, 0.25), transparent 45%),
          radial-gradient(circle at 80% 0%, rgba(59, 130, 246, 0.25), transparent 50%),
          linear-gradient(135deg, ${colors.dark[600]} 0%, ${colors.dark[300]} 100%)
        `,
        padding: 'clamp(1.5rem, 4vw, 4rem)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'clamp(1.5rem, 3vw, 3rem)',
          alignItems: 'stretch',
        }}
      >
        <section
          style={{
            background: 'linear-gradient(160deg, rgba(236, 72, 153, 0.35), rgba(124, 58, 237, 0.25))',
            borderRadius: borderRadius['2xl'],
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: 'clamp(1.5rem, 3vw, 2.75rem)',
            backdropFilter: 'blur(18px)',
            color: '#fff',
            boxShadow: '0 25px 40px rgba(0,0,0,0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[3],
          }}
        >
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.9rem',
              borderRadius: 999,
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#a7f3d0'
            }}>
              <span>1 / 3</span>
              <span>Datos básicos</span>
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 3vw, 2.5rem)', margin: `${spacing[2]} 0`, fontWeight: 800 }}>
              ¡Bienvenido a Dónde Bailar!
            </h1>
            <p style={{ color: colors.gray[300], fontSize: '1rem', lineHeight: 1.7 }}>
              Esta primera parada es para asegurarnos de que la comunidad pueda reconocerte y conectar contigo.
              Completando estos datos, desbloqueas el resto del onboarding para descubrir ritmos, zonas y clases.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing[2],
              padding: spacing[3],
              borderRadius: borderRadius.xl,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            {JOURNEY_HIGHLIGHTS.map((item) => (
              <div key={item.title} style={{ display: 'flex', gap: spacing[2] }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem'
                }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>{item.title}</p>
                  <p style={{ margin: '4px 0 0', color: colors.gray[300], fontSize: '0.95rem' }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            background: 'linear-gradient(165deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.9))',
            borderRadius: borderRadius['2xl'],
            padding: 'clamp(1.5rem, 3vw, 2.75rem)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <header style={{ marginBottom: spacing[3], textAlign: 'left' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 2vw, 2rem)', fontWeight: 800, color: '#fff', marginBottom: spacing[1] }}>
              Cuéntanos sobre ti 📝
            </h2>
            <p style={{ color: colors.gray[400], fontSize: '0.95rem' }}>
              Estos datos se muestran en tu perfil público y ayudarán a otros bailarines a reconocerte.
            </p>
          </header>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: colors.gray[300],
                  marginBottom: spacing[1],
                }}
              >
                <span>Foto de Perfil *</span>
                <span style={{ fontSize: '0.8rem', color: colors.gray[500] }}>Formato cuadrado recomendado</span>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '28px',
                    border: `2px dashed rgba(236, 72, 153, 0.7)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    background: 'rgba(236, 72, 153, 0.08)',
                  }}>
                    {avatarPreview || profile?.avatar_url ? (
                      <img
                        src={avatarPreview || profile?.avatar_url || ''}
                        alt="Avatar preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '2rem' }}>🙂</span>
                    )}
                  </div>
                  <p style={{ marginTop: spacing[1], fontSize: '0.8rem', color: colors.gray[400] }}>
                    Tu foto visible en la app
                  </p>
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: spacing[2],
                      background: colors.glass.medium,
                      border: `1px solid ${colors.glass.medium}`,
                      borderRadius: borderRadius.md,
                      color: colors.gray[200],
                      fontSize: '0.9rem',
                    }}
                  />
                  {!avatarPreview && !profile?.avatar_url && (
                    <div style={{ marginTop: spacing[1], color: colors.gray[400], fontSize: '.8rem' }}>
                      Sube una imagen clara de tu rostro. Este paso es obligatorio.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="displayName"
                style={{
                  display: 'block',
                  marginBottom: spacing[1],
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.gray[400],
                }}
              >
                Nombre para mostrar *
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: spacing[2],
                  background: colors.glass.medium,
                  border: `1px solid ${colors.glass.medium}`,
                  borderRadius: borderRadius.md,
                  color: colors.gray[200],
                  fontSize: '1rem',
                }}
                placeholder="Ej: Juan el Salsero"
              />
            </div>

            <div>
              <label
                htmlFor="bio"
                style={{
                  display: 'block',
                  marginBottom: spacing[1],
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.gray[400],
                }}
              >
                Bio (opcional)
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={isLoading}
                rows={4}
                style={{
                  width: '100%',
                  padding: spacing[2],
                  background: colors.glass.medium,
                  border: `1px solid ${colors.glass.medium}`,
                  borderRadius: borderRadius.md,
                  color: colors.gray[200],
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                placeholder="Cuéntanos sobre tu pasión por el baile..."
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: spacing[1],
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.gray[400],
                }}
              >
                ¿Cómo te identificas? (opcional)
              </label>
              <div style={{ display: 'grid', gap: spacing[2] }}>
                {(['lead', 'follow', 'ambos'] as const).map((rol) => (
                  <label
                    key={rol}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: spacing[2],
                      padding: spacing[2],
                      background: rolBaile === rol ? colors.glass.strong : colors.glass.medium,
                      border: `2px solid ${rolBaile === rol ? colors.gradients.primary : 'transparent'}`,
                      borderRadius: borderRadius.lg,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="radio"
                      name="rolBaile"
                      value={rol}
                      checked={rolBaile === rol}
                      onChange={(e) => setRolBaile(e.target.value as 'lead' | 'follow' | 'ambos')}
                      disabled={isLoading}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        marginTop: '4px'
                      }}
                    />
                    <div>
                      <p style={{ margin: 0, color: '#fff', fontWeight: 600 }}>
                        {ROLE_BADGES[rol].emoji} {ROLE_BADGES[rol].label}
                      </p>
                      <p style={{ margin: '4px 0 0', color: colors.gray[400], fontSize: '0.9rem' }}>
                        {ROLE_BADGES[rol].desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: spacing[2],
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: borderRadius.md,
                  color: '#ef4444',
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                opacity: isLoading ? 0.7 : 1,
                background: 'linear-gradient(120deg, #f472b6, #c084fc)',
              }}
            >
              {isLoading ? 'Guardando...' : 'Continuar →'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
