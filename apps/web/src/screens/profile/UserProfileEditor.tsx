import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useTags } from "../../hooks/useTags";
import { useUserMedia } from "../../hooks/useUserMedia";
import { useIsAdmin } from "../../hooks/useRoleRequests";
import { MediaUploader } from "../../components/MediaUploader";
import { MediaGrid } from "../../components/MediaGrid";
import { useToast } from "../../components/Toast";
import { supabase, getBucketPublicUrl } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import ProfileToolbar from "../../components/profile/ProfileToolbar";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export const UserProfileEditor: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, updateProfileFields } = useUserProfile();
  const { data: allTags } = useTags();
  const { media, addMedia, removeMedia } = useUserMedia();
  const { showToast } = useToast();
  const { data: isAdmin } = useIsAdmin();

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
  const [isSaving, setIsSaving] = useState(false);
  const [formTouched, setFormTouched] = useState(false);

  // 🛡️ Prevenir rehidratación: solo cargar datos iniciales si el form no ha sido tocado
  useEffect(() => {
    if (profile && !formTouched) {
      console.log('[UserProfileEditor] Hydrating form from profile');
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setSelectedRitmos(profile.ritmos || []);
      setSelectedZonas(profile.zonas || []);
      setAvatarPreview(profile.avatar_url || '');
      setRedesSociales(profile.redes_sociales || {
        instagram: '',
        facebook: '',
        whatsapp: ''
      });
    }
  }, [profile, formTouched]);

  const ritmos = allTags?.filter(t => t.tipo === 'ritmo') || [];
  const zonas = allTags?.filter(t => t.tipo === 'zona') || [];

  const toggleRitmo = (id: number) => {
    setFormTouched(true);
    if (selectedRitmos.includes(id)) {
      setSelectedRitmos(selectedRitmos.filter(r => r !== id));
    } else {
      setSelectedRitmos([...selectedRitmos, id]);
    }
  };

  const toggleZona = (id: number) => {
    setFormTouched(true);
    if (selectedZonas.includes(id)) {
      setSelectedZonas(selectedZonas.filter(z => z !== id));
    } else {
      setSelectedZonas([...selectedZonas, id]);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      let avatarUrl = profile?.avatar_url;

      // Handle avatar upload separately
      if (avatarFile) {
        const fileName = `${user.id}.png`;
        const { error: uploadError } = await supabase.storage
          .from('AVATARS')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) {
          throw new Error(`Error uploading avatar: ${uploadError.message}`);
        }

        avatarUrl = `${getBucketPublicUrl('AVATARS', fileName)}?t=${Date.now()}`;
      }

      // Update profile fields (NO media)
      await updateProfileFields({
        display_name: displayName,
        bio: bio || undefined,
        avatar_url: avatarUrl,
        ritmos: selectedRitmos,
        zonas: selectedZonas,
        redes_sociales: redesSociales,
      });

      // ✅ Resetear flag después de guardado exitoso
      setFormTouched(false);
      showToast('Perfil actualizado exitosamente ✅', 'success');
    } catch (err: any) {
      showToast('Error al guardar el perfil', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '800px',
        margin: '0 auto',
        color: colors.light,
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '24px' }}>
        ✏️ Editar Perfil de Usuario
      </h1>

      {/* Profile Toolbar */}
      <ProfileToolbar />

      {/* Avatar Upload */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          Foto de Perfil
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {avatarPreview && (
            <img
              src={avatarPreview}
              alt="Preview"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: `3px solid ${colors.coral}`,
              }}
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: `${colors.dark}cc`,
              border: `1px solid ${colors.light}33`,
              color: colors.light,
            }}
          />
        </div>
      </div>

      {/* Display Name */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          Nombre
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => {
            setFormTouched(true);
            setDisplayName(e.target.value);
          }}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            background: `${colors.dark}cc`,
            border: `1px solid ${colors.light}33`,
            color: colors.light,
            fontSize: '1rem',
          }}
        />
      </div>

      {/* Bio */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => {
            setFormTouched(true);
            setBio(e.target.value);
          }}
          rows={4}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            background: `${colors.dark}cc`,
            border: `1px solid ${colors.light}33`,
            color: colors.light,
            fontSize: '1rem',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Ritmos */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          🎵 Ritmos que bailo
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {ritmos.map((r) => (
            <motion.button
              key={r.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleRitmo(r.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: `2px solid ${colors.coral}`,
                background: selectedRitmos.includes(r.id) ? colors.coral : 'transparent',
                color: colors.light,
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {r.nombre}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Zonas */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          📍 Zonas donde bailo
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {zonas.map((z) => (
            <motion.button
              key={z.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleZona(z.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: `2px solid ${colors.yellow}`,
                background: selectedZonas.includes(z.id) ? colors.yellow : 'transparent',
                color: selectedZonas.includes(z.id) ? colors.dark : colors.light,
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {z.nombre}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Redes Sociales */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          📱 Redes Sociales
        </label>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px', opacity: 0.7 }}>
            Instagram
          </label>
          <input
            type="text"
            value={redesSociales.instagram}
            onChange={(e) => {
              setFormTouched(true);
              setRedesSociales({ ...redesSociales, instagram: e.target.value });
            }}
            placeholder="@usuario o URL"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              background: `${colors.dark}cc`,
              border: `1px solid ${colors.light}33`,
              color: colors.light,
              fontSize: '0.95rem',
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px', opacity: 0.7 }}>
            Facebook
          </label>
          <input
            type="text"
            value={redesSociales.facebook}
            onChange={(e) => {
              setFormTouched(true);
              setRedesSociales({ ...redesSociales, facebook: e.target.value });
            }}
            placeholder="usuario o URL"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              background: `${colors.dark}cc`,
              border: `1px solid ${colors.light}33`,
              color: colors.light,
              fontSize: '0.95rem',
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px', opacity: 0.7 }}>
            WhatsApp
          </label>
          <input
            type="text"
            value={redesSociales.whatsapp}
            onChange={(e) => {
              setFormTouched(true);
              setRedesSociales({ ...redesSociales, whatsapp: e.target.value });
            }}
            placeholder="+52 1234567890"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              background: `${colors.dark}cc`,
              border: `1px solid ${colors.light}33`,
              color: colors.light,
              fontSize: '0.95rem',
            }}
          />
        </div>
      </div>

      {/* Galería de Fotos y Videos */}
      <div style={{ marginTop: '32px', marginBottom: '24px' }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '700', 
          marginBottom: '16px',
          color: colors.light,
        }}>
          📸 Fotos y Videos
        </h2>
        
        <MediaUploader 
          onPick={async (files) => {
            for (const f of Array.from(files)) {
              try {
                await addMedia.mutateAsync(f);
                showToast('Media agregada ✅', 'success');
              } catch (err: any) {
                showToast('Error al subir archivo', 'error');
              }
            }
          }}
        />
        
        <div style={{ marginTop: '16px' }}>
          <MediaGrid 
            items={media} 
            onRemove={async (id) => {
              try {
                await removeMedia.mutateAsync(id);
                showToast('Media eliminada', 'success');
              } catch (err: any) {
                showToast('Error al eliminar', 'error');
              }
            }}
          />
        </div>
      </div>

      {/* Admin Access Card */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: '24px',
            padding: '20px',
            borderRadius: '16px',
            border: `2px solid ${colors.yellow}`,
            background: `linear-gradient(135deg, rgba(255, 214, 102, 0.1), rgba(255, 140, 66, 0.1))`,
            boxShadow: `0 4px 16px ${colors.yellow}33`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '2rem' }}>⚙️</span>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '4px' }}>
                Panel de Administrador
              </h3>
              <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                Tienes acceso al panel de administración
              </p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/admin/roles')}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '25px',
              border: 'none',
              background: `linear-gradient(135deg, ${colors.yellow}, ${colors.orange})`,
              color: colors.dark,
              fontSize: '0.9rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: `0 4px 12px ${colors.yellow}66`,
            }}
          >
            ⚙️ Ver Solicitudes de Roles
          </motion.button>
        </motion.div>
      )}

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={isSaving}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '50px',
          border: 'none',
          background: isSaving 
            ? `${colors.light}33` 
            : `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`,
          color: colors.light,
          fontSize: '1rem',
          fontWeight: '700',
          cursor: isSaving ? 'not-allowed' : 'pointer',
          boxShadow: `0 8px 24px ${colors.coral}66`,
        }}
      >
        {isSaving ? 'Guardando...' : '💾 Guardar Cambios'}
      </motion.button>

      {/* Role Selection Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/profile/roles')}
        style={{
          width: '100%',
          marginTop: '12px',
          padding: '14px',
          borderRadius: '50px',
          border: `2px solid ${colors.blue}`,
          background: 'transparent',
          color: colors.light,
          fontSize: '0.9rem',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        🎭 Tipos de Perfil (Organizador, Maestro, Academia)
      </motion.button>
    </div>
  );
};
