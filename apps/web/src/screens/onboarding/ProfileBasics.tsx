import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@ui/index';
import { colors, typography, spacing, borderRadius, transitions } from '../../theme/colors';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useToast } from '../../components/Toast';
import { supabase, getBucketPublicUrl } from '../../lib/supabase';
import { isValidDisplayName } from '../../utils/validation';
import { mergeProfile } from '../../utils/mergeProfile';

export function ProfileBasics() {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const { profile, updateProfileFields } = useUserProfile();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setError('');

    // Validate display name
    if (!isValidDisplayName(displayName)) {
      const errorMsg = 'El nombre debe tener entre 2 y 50 caracteres y contener solo letras, números, espacios y caracteres permitidos';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      return;
    }

    // Require avatar: debe existir uno subido en esta pantalla o ya existente en el perfil
    const hasExistingAvatar = !!profile?.avatar_url;
    if (!avatarFile && !hasExistingAvatar) {
      const errorMsg = 'La foto de perfil es requerida. Sube una imagen para continuar.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      return;
    }

    setIsLoading(true);

    try {
      let avatarUrl: string | undefined;

      // Upload avatar if selected
      if (avatarFile) {
        const fileName = `avatars/${user.id}.png`;
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) {
          throw new Error(`Error uploading avatar: ${uploadError.message}`);
        }

        avatarUrl = supabase.storage.from('media').getPublicUrl(fileName).data.publicUrl;
      }

      // Merge with existing profile
      const updates = mergeProfile(profile as any, {
        display_name: displayName,
        bio: bio || undefined,
        avatar_url: avatarUrl ?? profile?.avatar_url,
      });

      // Upsert profile
      await updateProfileFields(updates);

      showToast('Perfil guardado exitosamente ✅', 'success');
      navigate('/onboarding/ritmos');
    } catch (err: any) {
      setError(err.message);
      showToast('Error al guardar el perfil', 'error');
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        padding: spacing[2],
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: colors.glass.light,
          borderRadius: borderRadius['2xl'],
          padding: spacing[4],
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: spacing[4] }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: spacing[1] }}>
            Paso 1: Datos Básicos 📝
          </h1>
          <p style={{ color: colors.gray[400] }}>
            Cuéntanos sobre ti
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Avatar Upload */}
          <div style={{ marginBottom: spacing[3], textAlign: 'center' }}>
            {avatarPreview && (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginBottom: spacing[2],
                  border: `3px solid ${colors.gradients.primary}`,
                }}
              />
            )}
            <label
              style={{
                display: 'block',
                marginBottom: spacing[1],
                fontSize: '0.875rem',
                fontWeight: '600',
                color: colors.gray[400],
              }}
            >
              Foto de Perfil *
            </label>
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
                fontSize: '0.875rem',
              }}
            />
            {!avatarPreview && !profile?.avatar_url && (
              <div style={{ marginTop: spacing[1], color: colors.gray[400], fontSize: '.8rem' }}>
                Sube una imagen clara de tu rostro. Este paso es obligatorio.
              </div>
            )}
          </div>

          {/* Display Name */}
          <div style={{ marginBottom: spacing[3] }}>
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

          {/* Bio */}
          <div style={{ marginBottom: spacing[3] }}>
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

          {error && (
            <div
              style={{
                marginBottom: spacing[3],
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
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {isLoading ? 'Guardando...' : 'Continuar →'}
          </Button>
        </form>
      </div>
    </div>
  );
}

