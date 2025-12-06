import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@ui/index';
import { colors, borderRadius, theme } from '../../theme/colors';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useTags } from '../../hooks/useTags';
import { useToast } from '../../components/Toast';
import { useAuth } from '@/contexts/AuthProvider';
import { useMyOrganizer } from '../../hooks/useOrganizer';
import { TagChip } from '../../components/TagChip';
import { isValidDisplayName } from '../../utils/validation';
import { supabase } from '../../lib/supabase';

const spacing = theme.spacing;

export function Profile() {
  const navigate = useNavigate();
  const { profile, isLoading, updateProfileFields, refetch } = useUserProfile();
  const { data: allTags } = useTags();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { data: organizer, isLoading: isLoadingOrganizer } = useMyOrganizer();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedRitmos, setSelectedRitmos] = useState<number[]>([]);
  const [selectedZonas, setSelectedZonas] = useState<number[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [redesSociales, setRedesSociales] = useState({
    instagram: '',
    facebook: '',
    whatsapp: ''
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when toggling edit mode
  const startEditing = () => {
    setDisplayName(profile?.display_name || '');
    setBio(profile?.bio || '');
    setSelectedRitmos(profile?.ritmos || []);
    setSelectedZonas(profile?.zonas || []);
    setAvatarFile(null);
    setAvatarPreview(profile?.avatar_url || ''); // Keep current avatar as preview
    const redes = (profile?.redes_sociales || {}) as {
      instagram?: string;
      facebook?: string;
      whatsapp?: string;
    };
    setRedesSociales({
      instagram: redes.instagram || '',
      facebook: redes.facebook || '',
      whatsapp: redes.whatsapp || '',
    });
    setIsEditing(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const toggleRitmo = (ritmoId: number) => {
    setSelectedRitmos(prev => 
      prev.includes(ritmoId) 
        ? prev.filter(id => id !== ritmoId)
        : [...prev, ritmoId]
    );
  };

  const toggleZona = (zonaId: number) => {
    setSelectedZonas(prev => 
      prev.includes(zonaId) 
        ? prev.filter(id => id !== zonaId)
        : [...prev, zonaId]
    );
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setError('');

    // Validate display name
    const nameValidation = isValidDisplayName(displayName);
    if (!nameValidation.valid) {
      setError(nameValidation.error || 'Nombre inválido');
      showToast(nameValidation.error || 'Nombre inválido', 'error');
      return;
    }

    setIsSaving(true);

    try {
      let avatarUrl: string | undefined = profile.avatar_url;

      // Upload avatar if selected
      if (avatarFile) {
        const fileName = `avatars/${profile.user_id}.png`;
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) {
          throw new Error(`Error uploading avatar: ${uploadError.message}`);
        }

        avatarUrl = supabase.storage.from('media').getPublicUrl(fileName).data.publicUrl;
        // Add timestamp to force cache refresh
        avatarUrl += `?t=${Date.now()}`;
      }

      // Preparar patch para guardar (el hook se encarga de merge y normalización)
      const respuestas = {
        ...(profile.respuestas || {}),
        redes: redesSociales,
      };

      await updateProfileFields({
        display_name: displayName,
        bio: bio || null,
        avatar_url: avatarUrl,
        ritmos: selectedRitmos,
        zonas: selectedZonas,
        redes_sociales: redesSociales,
        respuestas,
      });
      await refetch();
      showToast('Perfil actualizado exitosamente ✅', 'success');
      setIsEditing(false);
      setIsSaving(false);
    } catch (err: any) {
      setError(err.message);
      showToast('Error al actualizar el perfil', 'error');
      setIsSaving(false);
    }
  };

  // Get tag names from IDs
  const getRitmoNames = () => {
    if (!profile?.ritmos || !allTags) return [];
    return allTags
      .filter((tag) => tag.tipo === 'ritmo' && profile.ritmos.includes(tag.id))
      .map((tag) => tag.nombre);
  };

  const getZonaNames = () => {
    if (!profile?.zonas || !allTags) return [];
    return allTags
      .filter((tag) => tag.tipo === 'zona' && profile.zonas.includes(tag.id))
      .map((tag) => tag.nombre);
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.bg.app,
          color: colors.gray[400],
          fontSize: '1.5rem',
        }}
      >
        Cargando perfil...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.bg.app,
        padding: spacing(4),
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <div style={{ marginBottom: spacing(4) }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: spacing(2) }}>
            Mi Perfil 👤
          </h1>
        </div>

        {/* Profile Card */}
        <div
          style={{
            background: colors.glass.strong,
            borderRadius: borderRadius.xl,
            padding: spacing(4),
            marginBottom: spacing(4),
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Avatar and Basic Info */}
          <div style={{ display: 'flex', gap: spacing(3), marginBottom: spacing(4), alignItems: 'start' }}>
            {/* Avatar */}
            {isEditing ? (
              // In edit mode, show preview if new file selected, otherwise show current avatar
              avatarFile ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `3px solid ${colors.primary[500]}`,
                  }}
                />
              ) : profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `3px solid ${colors.primary[500]}`,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    color: '#FFF',
                    border: `3px solid ${colors.primary[500]}`,
                  }}
                >
                  {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )
            ) : (
              // In view mode, always show saved avatar
              profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `3px solid ${colors.primary[500]}`,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    color: '#FFF',
                    border: `3px solid ${colors.primary[500]}`,
                  }}
                >
                  {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )
            )}

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: spacing(1) }}>
                {profile?.display_name || 'Sin nombre'}
              </h2>
              <p style={{ color: colors.gray[500], fontSize: '0.875rem', marginBottom: spacing(1) }}>
                {user?.email}
              </p>
              {profile?.bio && (
                <p style={{ color: colors.gray[400], fontSize: '1rem', lineHeight: 1.6 }}>
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Edit Button */}
            {!isEditing && (
              <button
                onClick={startEditing}
                style={{
                  padding: `${spacing(1)} ${spacing(2)}`,
                  background: 'transparent',
                  border: `1px solid ${colors.gray[300]}`,
                  borderRadius: borderRadius.md,
                  color: colors.light,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                }}
              >
                Editar ✏️
              </button>
            )}
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div style={{ 
              marginBottom: spacing(4), 
              paddingTop: spacing(4), 
              borderTop: `2px solid ${colors.gray[300]}`,
              background: colors.glass.strong,
              borderRadius: borderRadius.lg,
              padding: spacing(4),
            }}>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                marginBottom: spacing(4),
                color: colors.light,
                textAlign: 'center'
              }}>
                ✏️ Editar Perfil
              </h3>
              
              <form onSubmit={handleUpdate}>
                {/* Avatar Upload Section */}
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: spacing(4),
                  padding: spacing(3),
                  background: theme.bg.app,
                  borderRadius: borderRadius.lg,
                  border: `2px dashed ${colors.gray[300]}`
                }}>
                  <label
                    htmlFor="editAvatar"
                    style={{
                      display: 'block',
                      marginBottom: spacing(2),
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: colors.gray[400],
                      cursor: 'pointer'
                    }}
                  >
                    📸 Cambiar Foto de Perfil
                  </label>
                  <input
                    id="editAvatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={isSaving}
                    style={{
                      marginBottom: spacing(2),
                      padding: spacing(2),
                      background: colors.glass.strong,
                      border: `1px solid ${colors.gray[300]}`,
                      borderRadius: borderRadius.md,
                      color: colors.light,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      opacity: isSaving ? 0.5 : 1,
                    }}
                  />
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: colors.gray[500],
                    margin: 0 
                  }}>
                    Formatos permitidos: JPG, PNG, GIF (máx. 5MB)
                  </p>
                  {avatarFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(profile?.avatar_url || '');
                      }}
                      style={{
                        marginTop: spacing(2),
                        padding: `${spacing(1)} ${spacing(2)}`,
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: borderRadius.md,
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                      }}
                    >
                      ✖️ Cancelar nueva foto
                    </button>
                  )}
                </div>

                {/* Basic Info Section */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: spacing(3),
                  marginBottom: spacing(4)
                }}>
                  <div>
                    <label
                      htmlFor="editDisplayName"
                      style={{
                        display: 'block',
                        marginBottom: spacing(1),
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: colors.gray[400],
                      }}
                    >
                      👤 Nombre *
                    </label>
                    <input
                      id="editDisplayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      disabled={isSaving}
                      placeholder="Tu nombre de usuario"
                      style={{
                        width: '100%',
                        padding: spacing(2),
                        background: theme.bg.app,
                        border: `2px solid ${colors.gray[300]}`,
                        borderRadius: borderRadius.md,
                        color: colors.light,
                        fontSize: '1rem',
                        fontWeight: '500',
                        transition: 'border-color 0.2s ease',
                      }}
                      onFocus={(e) => e.target.style.borderColor = colors.primary[500]}
                      onBlur={(e) => e.target.style.borderColor = colors.gray[300]}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: spacing(1),
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: colors.gray[400],
                      }}
                    >
                      📧 Correo
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      style={{
                        width: '100%',
                        padding: spacing(2),
                        background: colors.gray[100],
                        border: `2px solid ${colors.gray[300]}`,
                        borderRadius: borderRadius.md,
                        color: colors.gray[500],
                        fontSize: '1rem',
                        cursor: 'not-allowed',
                      }}
                    />
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: colors.gray[500],
                      margin: `${spacing(1)}px 0 0 0`
                    }}>
                      El correo no se puede cambiar
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: spacing(4) }}>
                  <label
                    htmlFor="editBio"
                    style={{
                      display: 'block',
                      marginBottom: spacing(1),
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: colors.gray[400],
                    }}
                  >
                    📝 Bio
                  </label>
                  <textarea
                    id="editBio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={isSaving}
                    rows={4}
                    placeholder="Cuéntanos algo sobre ti..."
                    style={{
                      width: '100%',
                      padding: spacing(2),
                      background: theme.bg.app,
                      border: `2px solid ${colors.gray[300]}`,
                      borderRadius: borderRadius.md,
                      color: colors.light,
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => e.target.style.borderColor = colors.primary[500]}
                    onBlur={(e) => e.target.style.borderColor = colors.gray[300]}
                  />
                </div>

                {/* Ritmos Selection */}
                <div style={{ 
                  marginBottom: spacing(4),
                  padding: spacing(3),
                  background: theme.bg.app,
                  borderRadius: borderRadius.lg,
                  border: `1px solid ${colors.gray[300]}`
                }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: spacing(3),
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: colors.light,
                    }}
                  >
                    🎵 Mis Ritmos Favoritos
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(2) }}>
                    {allTags
                      ?.filter(tag => tag.tipo === 'ritmo')
                      .map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleRitmo(tag.id)}
                          disabled={isSaving}
                          style={{
                            padding: `${spacing(1.5)} ${spacing(2.5)}`,
                            background: selectedRitmos.includes(tag.id) 
                              ? colors.primary[500] 
                              : colors.glass.strong,
                            color: selectedRitmos.includes(tag.id) 
                              ? '#FFF' 
                              : colors.light,
                            border: `2px solid ${selectedRitmos.includes(tag.id) 
                              ? colors.primary[500] 
                              : colors.gray[300]}`,
                            borderRadius: borderRadius.lg,
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            opacity: isSaving ? 0.5 : 1,
                            transition: 'all 0.2s ease',
                            boxShadow: selectedRitmos.includes(tag.id) 
                              ? `0 4px 12px ${colors.primary[500]}40` 
                              : 'none',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSaving) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = selectedRitmos.includes(tag.id) 
                                ? `0 6px 16px ${colors.primary[500]}50`
                                : '0 4px 8px rgba(0,0,0,0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSaving) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = selectedRitmos.includes(tag.id) 
                                ? `0 4px 12px ${colors.primary[500]}40`
                                : 'none';
                            }
                          }}
                        >
                          {tag.nombre}
                        </button>
                      ))}
                  </div>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: colors.gray[500],
                    margin: `${spacing(2)}px 0 0 0`,
                    textAlign: 'center'
                  }}>
                    Selecciona todos los ritmos que te gustan
                  </p>
                </div>

                {/* Zonas Selection */}
                <div style={{ 
                  marginBottom: spacing(4),
                  padding: spacing(3),
                  background: theme.bg.app,
                  borderRadius: borderRadius.lg,
                  border: `1px solid ${colors.gray[300]}`
                }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: spacing(3),
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: colors.light,
                    }}
                  >
                    📍 Mis Zonas Favoritas
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(2) }}>
                    {allTags
                      ?.filter(tag => tag.tipo === 'zona')
                      .map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleZona(tag.id)}
                          disabled={isSaving}
                          style={{
                            padding: `${spacing(1.5)} ${spacing(2.5)}`,
                            background: selectedZonas.includes(tag.id) 
                              ? '#FB8C00' 
                              : colors.glass.strong,
                            color: selectedZonas.includes(tag.id) 
                              ? '#FFF' 
                              : colors.light,
                            border: `2px solid ${selectedZonas.includes(tag.id) 
                              ? '#FB8C00' 
                              : colors.gray[300]}`,
                            borderRadius: borderRadius.lg,
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            opacity: isSaving ? 0.5 : 1,
                            transition: 'all 0.2s ease',
                            boxShadow: selectedZonas.includes(tag.id) 
                              ? '0 4px 12px #FB8C0040' 
                              : 'none',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSaving) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = selectedZonas.includes(tag.id) 
                                ? '0 6px 16px #FB8C0050'
                                : '0 4px 8px rgba(0,0,0,0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSaving) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = selectedZonas.includes(tag.id) 
                                ? '0 4px 12px #FB8C0040'
                                : 'none';
                            }
                          }}
                        >
                          {tag.nombre}
                        </button>
                      ))}
                  </div>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: colors.gray[500],
                    margin: `${spacing(2)}px 0 0 0`,
                    textAlign: 'center'
                  }}>
                    Selecciona todas las zonas donde bailas
                  </p>
                </div>

                {/* Redes Sociales Section */}
                <div style={{ 
                  marginBottom: spacing(4),
                  padding: spacing(3),
                  background: theme.bg.app,
                  borderRadius: borderRadius.lg,
                  border: `1px solid ${colors.gray[300]}`
                }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: spacing(3),
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: colors.light,
                    }}
                  >
                    📱 Redes Sociales
                  </label>
                  
                  <div style={{ display: 'grid', gap: spacing(3) }}>
                    {/* Instagram */}
                    <div>
                      <label
                        htmlFor="instagram"
                        style={{
                          display: 'block',
                          marginBottom: spacing(1),
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: colors.gray[400],
                        }}
                      >
                        📷 Instagram
                      </label>
                      <input
                        id="instagram"
                        type="text"
                        value={redesSociales.instagram}
                        onChange={(e) => setRedesSociales(prev => ({ ...prev, instagram: e.target.value }))}
                        disabled={isSaving}
                        placeholder="@tu_usuario o https://instagram.com/tu_usuario"
                        style={{
                          width: '100%',
                          padding: spacing(2),
                          background: colors.glass.strong,
                          border: `2px solid ${colors.gray[300]}`,
                          borderRadius: borderRadius.md,
                          color: colors.light,
                          fontSize: '1rem',
                          fontWeight: '500',
                          transition: 'border-color 0.2s ease',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#E4405F'}
                        onBlur={(e) => e.target.style.borderColor = colors.gray[300]}
                      />
                    </div>

                    {/* Facebook */}
                    <div>
                      <label
                        htmlFor="facebook"
                        style={{
                          display: 'block',
                          marginBottom: spacing(1),
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: colors.gray[400],
                        }}
                      >
                        📘 Facebook
                      </label>
                      <input
                        id="facebook"
                        type="text"
                        value={redesSociales.facebook}
                        onChange={(e) => setRedesSociales(prev => ({ ...prev, facebook: e.target.value }))}
                        disabled={isSaving}
                        placeholder="@tu_pagina o https://facebook.com/tu_pagina"
                        style={{
                          width: '100%',
                          padding: spacing(2),
                          background: colors.glass.strong,
                          border: `2px solid ${colors.gray[300]}`,
                          borderRadius: borderRadius.md,
                          color: colors.light,
                          fontSize: '1rem',
                          fontWeight: '500',
                          transition: 'border-color 0.2s ease',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#1877F2'}
                        onBlur={(e) => e.target.style.borderColor = colors.gray[300]}
                      />
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label
                        htmlFor="whatsapp"
                        style={{
                          display: 'block',
                          marginBottom: spacing(1),
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: colors.gray[400],
                        }}
                      >
                        💬 WhatsApp
                      </label>
                      <input
                        id="whatsapp"
                        type="text"
                        value={redesSociales.whatsapp}
                        onChange={(e) => setRedesSociales(prev => ({ ...prev, whatsapp: e.target.value }))}
                        disabled={isSaving}
                        placeholder="+52 55 1234 5678 o https://wa.me/525512345678"
                        style={{
                          width: '100%',
                          padding: spacing(2),
                          background: colors.glass.strong,
                          border: `2px solid ${colors.gray[300]}`,
                          borderRadius: borderRadius.md,
                          color: colors.light,
                          fontSize: '1rem',
                          fontWeight: '500',
                          transition: 'border-color 0.2s ease',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#25D366'}
                        onBlur={(e) => e.target.style.borderColor = colors.gray[300]}
                      />
                    </div>
                  </div>
                  
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: colors.gray[500],
                    margin: `${spacing(2)}px 0 0 0`,
                    textAlign: 'center'
                  }}>
                    Agrega tus redes sociales para conectar con otros bailarines
                  </p>
                </div>

                {error && (
                  <div
                    style={{
                      marginBottom: spacing(3),
                      padding: spacing(3),
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '2px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: borderRadius.lg,
                      color: '#ef4444',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}
                  >
                    ❌ {error}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: spacing(3),
                  paddingTop: spacing(3),
                  borderTop: `1px solid ${colors.gray[300]}`
                }}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    style={{
                      flex: 1,
                      padding: spacing(3),
                      background: 'transparent',
                      border: `2px solid ${colors.gray[300]}`,
                      borderRadius: borderRadius.lg,
                      color: colors.gray[400],
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSaving) {
                        e.currentTarget.style.borderColor = colors.gray[400];
                        e.currentTarget.style.color = colors.light;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSaving) {
                        e.currentTarget.style.borderColor = colors.gray[300];
                        e.currentTarget.style.color = colors.gray[400];
                      }
                    }}
                  >
                    ✖️ Cancelar
                  </button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    style={{
                      flex: 1,
                      opacity: isSaving ? 0.5 : 1,
                      fontSize: '1rem',
                      padding: spacing(3),
                      fontWeight: '600',
                    }}
                  >
                    {isSaving ? '⏳ Guardando...' : '✅ Guardar Cambios'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Ritmos Section */}
          <div style={{ marginBottom: spacing(4) }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: spacing(2) }}>
              Mis Ritmos 🎵
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(1) }}>
              {isEditing ? (
                // Show selected ritmos in edit mode
                selectedRitmos.length > 0 ? (
                  selectedRitmos.map((ritmoId) => {
                    const ritmo = allTags?.find(tag => tag.id === ritmoId && tag.tipo === 'ritmo');
                    return ritmo ? (
                      <TagChip key={ritmoId} label={ritmo.nombre} variant="ritmo" />
                    ) : null;
                  })
                ) : (
                  <p style={{ color: colors.gray[500], fontSize: '0.875rem' }}>
                    Selecciona tus ritmos favoritos
                  </p>
                )
              ) : (
                // Show saved ritmos in view mode
                getRitmoNames().length > 0 ? (
                  getRitmoNames().map((nombre) => (
                    <TagChip key={nombre} label={nombre} variant="ritmo" />
                  ))
                ) : (
                  <p style={{ color: colors.gray[500], fontSize: '0.875rem' }}>
                    No has seleccionado ritmos aún
                  </p>
                )
              )}
            </div>
          </div>

          {/* Zonas Section */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: spacing(2) }}>
              Mis Zonas 📍
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(1) }}>
              {isEditing ? (
                // Show selected zonas in edit mode
                selectedZonas.length > 0 ? (
                  selectedZonas.map((zonaId) => {
                    const zona = allTags?.find(tag => tag.id === zonaId && tag.tipo === 'zona');
                    return zona ? (
                      <TagChip key={zonaId} label={zona.nombre} variant="zona" />
                    ) : null;
                  })
                ) : (
                  <p style={{ color: colors.gray[500], fontSize: '0.875rem' }}>
                    Selecciona tus zonas favoritas
                  </p>
                )
              ) : (
                // Show saved zonas in view mode
                getZonaNames().length > 0 ? (
                  getZonaNames().map((nombre) => (
                    <TagChip key={nombre} label={nombre} variant="zona" />
                  ))
                ) : (
                  <p style={{ color: colors.gray[500], fontSize: '0.875rem' }}>
                    No has seleccionado zonas aún
                  </p>
                )
              )}
            </div>
          </div>

          {/* Redes Sociales - Solo mostrar si tienen contenido */}
          {profile?.redes_sociales && (
            (profile.redes_sociales.instagram || profile.redes_sociales.facebook || profile.redes_sociales.whatsapp) && (
              <div style={{ marginBottom: spacing(4) }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: spacing(2) }}>
                  📱 Redes Sociales
                </h3>
                <div style={{ display: 'flex', gap: spacing(2), flexWrap: 'wrap' }}>
                  {profile.redes_sociales.instagram && (
                    <a
                      href={profile.redes_sociales.instagram.startsWith('http') ? profile.redes_sociales.instagram : `https://instagram.com/${profile.redes_sociales.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        background: 'rgba(228, 64, 95, 0.2)',
                        border: '1px solid rgba(228, 64, 95, 0.4)',
                        color: '#E4405F',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(228, 64, 95, 0.3)';
                        e.currentTarget.style.borderColor = 'rgba(228, 64, 95, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(228, 64, 95, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(228, 64, 95, 0.4)';
                      }}
                    >
                      📷 Instagram
                    </a>
                  )}
                  {profile.redes_sociales.facebook && (
                    <a
                      href={profile.redes_sociales.facebook.startsWith('http') ? profile.redes_sociales.facebook : `https://facebook.com/${profile.redes_sociales.facebook.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        background: 'rgba(24, 119, 242, 0.2)',
                        border: '1px solid rgba(24, 119, 242, 0.4)',
                        color: '#1877F2',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(24, 119, 242, 0.3)';
                        e.currentTarget.style.borderColor = 'rgba(24, 119, 242, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(24, 119, 242, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(24, 119, 242, 0.4)';
                      }}
                    >
                      📘 Facebook
                    </a>
                  )}
                  {profile.redes_sociales.whatsapp && (
                    <a
                      href={profile.redes_sociales.whatsapp.startsWith('http') ? profile.redes_sociales.whatsapp : `https://wa.me/${profile.redes_sociales.whatsapp.replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        background: 'rgba(37, 211, 102, 0.2)',
                        border: '1px solid rgba(37, 211, 102, 0.4)',
                        color: '#25D366',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(37, 211, 102, 0.3)';
                        e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(37, 211, 102, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.4)';
                      }}
                    >
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Events Section - Sprint 2 */}
        {!isEditing && (
          <div style={{
            marginTop: spacing(6),
            padding: spacing(4),
            background: colors.glass.strong,
            borderRadius: borderRadius.lg,
            border: `1px solid ${theme.bg.card}`,
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: spacing(3),
              color: colors.light,
            }}>
              📅 Eventos y compras
            </h3>

            <div style={{ display: 'grid', gap: spacing(2) }}>
              {/* My RSVPs */}
              <button
                onClick={() => navigate('/me/rsvps')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing(3),
                  background: theme.bg.app,
                  border: `1px solid ${theme.bg.card}`,
                  borderRadius: borderRadius.md,
                  cursor: 'pointer',
                  color: colors.light,
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.primary[500];
                  e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.1)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.bg.card;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    🎫 Mis RSVPs
                  </div>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[400] }}>
                    Ver eventos a los que voy a asistir
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem' }}>→</div>
              </button>

              {/* My Purchases */}
              <button
                onClick={() => navigate('/me/compras')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing(3),
                  background: colors.glass.strong,
                  border: `1px solid ${theme.bg.card}`,
                  borderRadius: borderRadius.md,
                  cursor: 'pointer',
                  color: colors.light,
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.primary[500];
                  e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.1)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.bg.card;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    🧾 Mis compras
                  </div>
                  <div style={{ fontSize: '0.875rem', color: colors.gray[400] }}>
                    Ver clases, boletos y eventos que he pagado
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem' }}>→</div>
              </button>

              {/* Organizer Section */}
              {!isLoadingOrganizer && (
                <>
                  {organizer ? (
                    <button
                      onClick={() => navigate('/organizer/edit')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: spacing(3),
                        background: theme.bg.app,
                        border: `1px solid ${theme.bg.card}`,
                        borderRadius: borderRadius.md,
                        cursor: 'pointer',
                        color: colors.light,
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.secondary[500];
                        e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.1)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = theme.bg.card;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                          🎤 {organizer.nombre_publico}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: colors.gray[400] }}>
                          Estado: {organizer.estado_aprobacion}
                        </div>
                      </div>
                      <div style={{ fontSize: '1.5rem' }}>→</div>
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/organizer/edit')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: spacing(3),
                        background: `${colors.secondary[500]}20`,
                        border: `2px dashed ${colors.secondary[500]}`,
                        borderRadius: borderRadius.md,
                        cursor: 'pointer',
                        color: colors.light,
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${colors.secondary[500]}30`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `${colors.secondary[500]}20`;
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                          ✨ Crear Perfil de Organizador
                        </div>
                        <div style={{ fontSize: '0.875rem', color: colors.gray[400] }}>
                          Organiza tus propios eventos de baile
                        </div>
                      </div>
                      <div style={{ fontSize: '1.5rem' }}>+</div>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer con iconos de acción */}
        <div style={{ 
          textAlign: 'center',
          padding: spacing(4),
          background: colors.glass.strong,
          borderRadius: borderRadius.lg,
          marginTop: spacing(4),
          border: `1px solid ${colors.gray[300]}`
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: spacing(4),
            marginBottom: spacing(3)
          }}>
            {/* Compartir */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Perfil de ${profile?.display_name} en Dónde Bailar`,
                    text: `Conoce el perfil de ${profile?.display_name} en Dónde Bailar`,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  showToast('Enlace copiado al portapapeles 📋', 'success');
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: spacing(1),
                padding: spacing(2),
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: borderRadius.md,
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.gray[100]}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: '1.5rem' }}>📤</div>
              <span style={{ fontSize: '0.75rem', color: colors.gray[400] }}>Compartir</span>
            </button>

            {/* Información */}
            <button
              onClick={() => showToast('Dónde Bailar v1.0 - Conectando bailarines desde 2024 🎉', 'info')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: spacing(1),
                padding: spacing(2),
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: borderRadius.md,
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.gray[100]}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: '1.5rem' }}>ℹ️</div>
              <span style={{ fontSize: '0.75rem', color: colors.gray[400] }}>Info</span>
            </button>

            {/* Aviso de Privacidad */}
            <button
              onClick={() => showToast('Tu privacidad es importante. Solo compartimos la información que tú eliges hacer pública 🔒', 'info')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: spacing(1),
                padding: spacing(2),
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: borderRadius.md,
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.gray[100]}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: '1.5rem' }}>🔒</div>
              <span style={{ fontSize: '0.75rem', color: colors.gray[400] }}>Privacidad</span>
            </button>
          </div>
          
          <p style={{ color: colors.gray[500], fontSize: '0.875rem', margin: 0 }}>
            Miembro desde {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'hoy'}
          </p>
        </div>
      </div>
    </div>
  );
}

