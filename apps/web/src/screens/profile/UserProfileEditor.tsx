import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useUserMediaSlots } from '../../hooks/useUserMediaSlots';
import { useHydratedForm } from '../../hooks/useHydratedForm';
import { supabase } from '../../lib/supabase';
import { getMediaBySlot, type MediaItem } from '../../utils/mediaSlots';
import { useToast } from '../../components/Toast';
import RitmosSelectorEditor from '@/components/profile/RitmosSelectorEditor';
import { RITMOS_CATALOG } from '@/lib/ritmosCatalog';
import { useTags } from '../../hooks/useTags';
import { PhotoManagementSection } from '../../components/profile/PhotoManagementSection';
import { VideoManagementSection } from '../../components/profile/VideoManagementSection';
import { ProfileNavigationToggle } from '../../components/profile/ProfileNavigationToggle';
import { normalizeSocialInput } from '../../utils/social';
import { buildSafePatch } from '../../utils/safePatch';
import { useQueryClient } from '@tanstack/react-query';
import { getDraftKey } from '../../utils/draftKeys';
import { useRoleChange } from '../../hooks/useRoleChange';
import { ensureMaxVideoDuration } from '../../utils/videoValidation';
import { FilterPreferencesModal } from '../../components/profile/FilterPreferencesModal';
import { FaInstagram, FaFacebookF, FaTiktok, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import ZonaGroupedChips from '../../components/profile/ZonaGroupedChips';
import { validateZonasAgainstCatalog } from '../../utils/validateZonas';
import { useTranslation } from 'react-i18next';

const colors = {
  dark: '#121212',
  light: '#F5F5F5',
  grad: 'linear-gradient(135deg, #FF4D4D, #FFB200 35%, #2D9CDB 70%, #FFE056)',
};

const STYLES = `
  .editor-container {
    min-height: 100vh;
    background: ${colors.dark};
    color: ${colors.light};
    padding: 2rem;
  }
  .editor-content {
    max-width: 1200px;
    margin: 0 auto;
  }
  .editor-content h2,
  .editor-content h3 {
    color: ${colors.light};
    text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px;
  }
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  .editor-title {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
    flex: 1 1 0%;
    text-align: center;
  }
  .editor-back-btn {
    padding: 0.75rem 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    color: ${colors.light};
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s;
  }
  .editor-section {
    margin-bottom: 3rem;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .editor-section-title {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: ${colors.light};
  }
  .editor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
  .editor-grid-small {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }
  .editor-field {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }
  .editor-input {
    width: 100%;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: ${colors.light};
    font-size: 1rem;
  }
  .editor-textarea {
    width: 100%;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: ${colors.light};
    font-size: 1rem;
    resize: vertical;
  }
  .editor-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .editor-subsection-title {
    font-size: 1.2rem;
    margin-bottom: 1rem;
    color: ${colors.light};
  }
  
  .glass-card-container {
    opacity: 1;
    margin-bottom: 2rem;
    padding: 2rem;
    text-align: center;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: rgba(0, 0, 0, 0.3) 0px 8px 32px;
    backdrop-filter: blur(10px);
    transform: none;
  }
  
  .profile-section-compact {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .row-top {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .row-top .title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: ${colors.light};
  }
  .identity-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
    align-items: center;
  }
  .pill {
    position: relative;
    border-radius: 12px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    color: ${colors.light};
    background: rgba(255, 255, 255, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 90px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  .pill input {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
  }
  .pill-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .pill-icon {
    font-size: 1rem;
    line-height: 1;
  }
  .pill-text {
    font-weight: inherit;
  }
  .pill:hover {
    transform: translateY(-3px) scale(1.02);
    border-color: rgba(76, 173, 255, 0.4);
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 6px 20px rgba(76, 173, 255, 0.2);
  }
  .pill-checked,
  .pill:has(input:checked) {
    background: linear-gradient(135deg, rgba(76, 173, 255, 0.3), rgba(76, 173, 255, 0.2));
    border-color: rgba(76, 173, 255, 0.8);
    color: ${colors.light};
    box-shadow: 0 6px 24px rgba(76, 173, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    font-weight: 600;
    transform: translateY(-2px);
  }
  .pill-checked .pill-text,
  .pill:has(input:checked) .pill-text {
    font-weight: 600;
  }
  .pill-checked .pill-icon,
  .pill:has(input:checked) .pill-icon {
    transform: scale(1.1);
  }
  
  .row-bottom {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .row-bottom-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .subtitle {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: ${colors.light};
  }
  .tag {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  
  .social-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .field {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1rem;
  }
  .field-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.9;
    color: ${colors.light};
  }
  
  .input-group {
    flex: 1;
    display: flex;
    align-items: center;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;
    transition: all 0.2s ease;
  }
  .input-group:focus-within {
    border-color: rgba(76, 173, 255, 0.6);
    background: rgba(255, 255, 255, 0.12);
    box-shadow: 0 0 0 2px rgba(76, 173, 255, 0.2);
  }
  .prefix {
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    border-right: 1px solid rgba(255, 255, 255, 0.15);
    white-space: nowrap;
    background: rgba(255, 255, 255, 0.05);
  }
  .input-group input {
    border: none;
    outline: none;
    background: transparent;
    color: ${colors.light};
    font-size: 1rem;
    padding: 0.75rem;
    flex: 1;
    min-width: 0;
  }
  .input-group input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  .photos-two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    align-items: stretch;
  }
  .photos-two-columns > * {
    height: 100%;
  }
  .rhythms-zones-two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  
  @media (max-width: 768px) {
    .photos-two-columns {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
    }
    .rhythms-zones-two-columns {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
    }
    .editor-container {
      padding: 0.75rem !important;
    }
    .editor-content {
      max-width: 100% !important;
    }
    .editor-header {
      flex-direction: column !important;
      gap: 0.75rem !important;
      text-align: center !important;
      margin-bottom: 1rem !important;
    }
    .editor-title {
      font-size: 1.4rem !important;
      order: 2 !important;
    }
    .editor-back-btn {
      order: 1 !important;
      align-self: flex-start !important;
      padding: 0.5rem 1rem !important;
      font-size: 0.85rem !important;
    }
    .editor-section {
      padding: 1rem !important;
      margin-bottom: 1.5rem !important;
      border-radius: 12px !important;
    }
    .editor-section-title {
      font-size: 1.2rem !important;
      margin-bottom: 0.75rem !important;
    }
    .editor-grid {
      grid-template-columns: 1fr !important;
      gap: 0.75rem !important;
    }
    .editor-grid-small {
      grid-template-columns: 1fr !important;
      gap: 0.75rem !important;
    }
    .info-redes-grid {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
    }
    .editor-subsection-title {
      font-size: 1.05rem !important;
      margin-bottom: 0.5rem !important;
    }
    .editor-chips {
      justify-content: center !important;
      gap: 0.4rem !important;
    }
    .glass-card-container {
      padding: 0.75rem !important;
      margin-bottom: 1rem !important;
      border-radius: 12px !important;
    }
    .profile-section-compact {
      padding: 1rem !important;
      gap: 1rem !important;
    }
    .row-top .title {
      font-size: 0.95rem !important;
    }
    .subtitle {
      font-size: 0.95rem !important;
    }
    .identity-pills {
      justify-content: center !important;
    }
    .pill {
      font-size: 0.8rem !important;
      padding: 0.6rem 0.9rem !important;
      min-width: 85px !important;
    }
    .pill-icon {
      font-size: 0.95rem !important;
    }
    .pill-content {
      gap: 0.35rem !important;
    }
    .field-icon {
      width: 24px !important;
      height: 24px !important;
    }
    .field {
      font-size: 0.9rem !important;
      gap: 0.5rem !important;
    }
    .field-icon {
      width: 24px !important;
      font-size: 1.1rem !important;
    }
    .input-group input {
      font-size: 0.9rem !important;
      padding: 0.6rem !important;
    }
    .prefix {
      font-size: 0.85rem !important;
      padding: 0.6rem 0.4rem !important;
    }
  }
  
  @media (max-width: 480px) {
    .editor-container {
      padding: 0.5rem !important;
    }
    .editor-header {
      gap: 0.5rem !important;
      margin-bottom: 0.75rem !important;
    }
    .editor-title {
      font-size: 1.2rem !important;
    }
    .editor-back-btn {
      padding: 0.4rem 0.8rem !important;
      font-size: 0.8rem !important;
    }
    .editor-section {
      padding: 0.75rem !important;
      margin-bottom: 1rem !important;
      border-radius: 10px !important;
    }
    .editor-section-title {
      font-size: 1.1rem !important;
      margin-bottom: 0.5rem !important;
    }
    .editor-subsection-title {
      font-size: 0.95rem !important;
      margin-bottom: 0.4rem !important;
    }
    .editor-input,
    .editor-textarea {
      padding: 0.6rem !important;
      font-size: 0.9rem !important;
    }
    .glass-card-container {
      padding: 0.5rem !important;
      margin-bottom: 0.75rem !important;
      border-radius: 10px !important;
    }
    .profile-section-compact {
      padding: 0.75rem !important;
      gap: 1rem !important;
    }
    .row-top {
      gap: 0.5rem !important;
    }
    .row-top .title {
      font-size: 0.9rem !important;
    }
    .subtitle {
      font-size: 0.9rem !important;
    }
    .tag {
      font-size: 0.7rem !important;
    }
    .identity-pills {
      gap: 0.5rem !important;
      justify-content: center !important;
    }
    .pill {
      font-size: 0.75rem !important;
      padding: 0.5rem 0.8rem !important;
      min-width: 75px !important;
    }
    .pill-icon {
      font-size: 0.9rem !important;
    }
    .pill-content {
      gap: 0.3rem !important;
    }
    .field-icon {
      width: 22px !important;
      height: 22px !important;
    }
    .social-list {
      gap: 0.5rem !important;
    }
    .field {
      font-size: 0.85rem !important;
      gap: 0.5rem !important;
    }
    .field-icon {
      width: 22px !important;
      font-size: 1rem !important;
    }
    .input-group input {
      font-size: 0.85rem !important;
      padding: 0.5rem !important;
    }
    .prefix {
      font-size: 0.8rem !important;
      padding: 0.5rem 0.4rem !important;
    }
  }
`;

export default function UserProfileEditor() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { profile, updateProfileFields, refetchProfile } = useUserProfile();

  const [authTimeoutReached, setAuthTimeoutReached] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading) {
      setAuthTimeoutReached(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setAuthTimeoutReached(true);
    }, 15000);
    return () => window.clearTimeout(timer);
  }, [authLoading]);

  const { media, uploadToSlot, removeFromSlot } = useUserMediaSlots();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  useRoleChange();

  const { data: allTags } = useTags();
  const ritmoTags = React.useMemo(() => (allTags?.filter(t => t.tipo === 'ritmo') ?? []), [allTags]);

  const { form, setField, setNested, setAll, setFromServer, hydrated, dirty } = useHydratedForm({
    draftKey: getDraftKey(user?.id, 'user'),
    serverData: profile as any,
    defaults: {
      display_name: "",
      bio: "",
      rol_baile: null as 'lead' | 'follow' | 'ambos' | null,
      ritmos_seleccionados: [] as string[],
      ritmos: [] as number[],
      zonas: [] as number[],
      respuestas: {
        redes: {
          instagram: "",
          tiktok: "",
          youtube: "",
          facebook: "",
          whatsapp: ""
        },
        dato_curioso: "",
        gusta_bailar: ""
      }
    },
    preferDraft: true
  });

  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [showFilterPreferences, setShowFilterPreferences] = useState(false);

  const toSupabasePublicUrl = (maybePath?: string): string | undefined => {
    if (!maybePath) return undefined;
    const v = String(maybePath).trim();
    if (/^https?:\/\//i.test(v) || v.startsWith('data:') || v.startsWith('/')) return v;
    const slash = v.indexOf('/');
    if (slash > 0) {
      const bucket = v.slice(0, slash);
      const path = v.slice(slash + 1);
      try {
        return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      } catch {
        return v;
      }
    }
    return v;
  };

  const mediaWithAvatarFallback: MediaItem[] = React.useMemo(() => {
    const base = Array.isArray(media) ? media.slice() : [];
    const hasP1 = !!getMediaBySlot(base as any, 'p1');
    if (!hasP1 && profile?.avatar_url) {
      const url = toSupabasePublicUrl(profile.avatar_url);
      if (url) {
        base.push({
          slot: 'p1',
          kind: 'photo',
          url,
          id: 'avatar-fallback'
        } as MediaItem);
      }
    }
    return base as MediaItem[];
  }, [media, profile?.avatar_url]);

  const uploadFile = async (file: File, slot: string, kind: "photo" | "video") => {
    if (!user) return;

    if (kind === 'video') {
      try {
        await ensureMaxVideoDuration(file, 25);
      } catch (error) {
        console.error('[UserProfileEditor] Video demasiado largo:', error);
        showToast(
          error instanceof Error ? error.message : 'El video debe durar máximo 25 segundos',
          'error'
        );
        return;
      }
    }

    setUploading(prev => ({ ...prev, [slot]: true }));

    try {
      await uploadToSlot.mutateAsync({ file, slot, kind });
      showToast(`${kind === 'photo' ? t('photo') : t('video')} ${t('uploaded_successfully')}`, 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Error al subir el archivo', 'error');
    } finally {
      setUploading(prev => ({ ...prev, [slot]: false }));
    }
  };

  const removeFile = async (slot: string) => {
    try {
      await removeFromSlot.mutateAsync(slot);
      showToast('Archivo eliminado', 'success');
    } catch (error) {
      console.error('Error removing file:', error);
      showToast('Error al eliminar el archivo', 'error');
    }
  };

  const toggleZona = (id: number) => {
    if (form.zonas.includes(id)) {
      setField('zonas', []);
    } else {
      setField('zonas', [id]);
    }
  };

  const handleSave = async () => {
    try {
      const redes = normalizeSocialInput(form.respuestas?.redes || {});

      let outRitmosSeleccionados = ((form as any).ritmos_seleccionados || []) as string[];
      if ((!outRitmosSeleccionados || outRitmosSeleccionados.length === 0) && Array.isArray(form.ritmos) && form.ritmos.length > 0) {
        const labelToItemId = new Map<string, string>();
        RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelToItemId.set(i.label, i.id)));
        const names = form.ritmos
          .map(id => ritmoTags.find(t => t.id === id)?.nombre)
          .filter(Boolean) as string[];
        const mapped = names
          .map(n => labelToItemId.get(n))
          .filter(Boolean) as string[];
        if (mapped.length > 0) outRitmosSeleccionados = mapped;
      }

      const validatedZonas = validateZonasAgainstCatalog(form.zonas, allTags);

      const candidate = {
        display_name: form.display_name,
        bio: form.bio,
        rol_baile: (form as any).rol_baile || null,
        ritmos_seleccionados: outRitmosSeleccionados || [],
        ritmos: form.ritmos,
        zonas: validatedZonas,
        respuestas: {
          redes,
          dato_curioso: form.respuestas?.dato_curioso || null,
          gusta_bailar: form.respuestas?.gusta_bailar || null
        },
      };

      // Nota: updateProfileFields construye su propio patch usando buildSafePatch,
      // así que pasamos el candidate directamente, no un patch pre-construido
      // Esto asegura que los cambios en objetos anidados (respuestas.redes, etc.) se detecten correctamente
      await updateProfileFields(candidate);

      const fresh = await refetchProfile();
      if (fresh) {
        setFromServer(fresh as any);
      }

      // Invalidar queries de media para asegurar que las fotos se recarguen
      queryClient.invalidateQueries({ queryKey: ["profile", "media-slots", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["profile", "me", user?.id] });

      showToast('Perfil actualizado ✅', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Error al guardar', 'error');
    }
  };

  if (authLoading && !authTimeoutReached) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: '#F5F5F5',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p style={{ marginBottom: '8px' }}>{t('loading_your_session')}</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            {t('refresh_page_for_faster_load')}
          </p>
        </div>
      </>
    );
  }

  if (authLoading && authTimeoutReached) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: '#F5F5F5',
        }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '16px' }}>⚠️</div>
          <p style={{ marginBottom: '12px' }}>
            No pudimos cargar tu sesión. Revisa tu conexión e inténtalo de nuevo.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '4px',
              padding: '0.5rem 1.25rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.35)',
              background: 'transparent',
              color: '#F5F5F5',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            Reintentar
          </button>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: '#F5F5F5',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🔒</div>
          <p>No has iniciado sesión</p>
        </div>
      </>
    );
  }

  if (!hydrated && !authLoading) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: '#F5F5F5',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p>{t('loading_your_info')}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="editor-container">
        <div className="editor-content">
          <div className="editor-header">
            <button
              onClick={() => navigate(-1)}
              className="editor-back-btn"
            >
              ← {t('back')}
            </button>
            <h1 className="editor-title">
              ✏️ {t('edit_profile')}
            </h1>
            <div style={{ width: '100px' }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <ProfileNavigationToggle
              currentView="edit"
              profileType="user"
              onSave={handleSave}
              isSaving={false}
              saveDisabled={!form.display_name?.trim()}
            />
            <button
              onClick={() => navigate('/profile/settings')}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: colors.light,
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              ⚙️ {t('settings')}
            </button>
          </div>

          <div className="editor-section glass-card-container">
            <h2 className="editor-section-title">
              👤 {t('personal_information')}
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                alignItems: 'start',
              }}
              className="info-redes-grid"
            >
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="editor-field">
                    {t('username')}
                  </label>
                  <input
                    type="text"
                    value={form.display_name}
                    onChange={(e) => setField('display_name', e.target.value)}
                    placeholder={t('username')}
                    className="editor-input"
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="editor-field">
                    {t('biography')}
                  </label>
                  <textarea
                    value={form.bio || ''}
                    onChange={(e) => setField('bio', e.target.value)}
                    placeholder={t('tell_us_about_you')}
                    rows={3}
                    className="editor-textarea"
                  />
                </div>
              </div>

              <div className="profile-section-compact">
                <div className="row-top">
                  <h3 className="title">{t('how_do_you_identify')}</h3>
                  <div className="identity-pills">
                    {(['lead', 'follow', 'ambos'] as const).map((rol) => (
                      <label
                        key={rol}
                        className={`pill ${(form as any).rol_baile === rol ? 'pill-checked' : ''}`}
                      >
                        <input
                          type="radio"
                          name="identidad"
                          value={rol}
                          checked={(form as any).rol_baile === rol}
                          onChange={(e) => setField('rol_baile', e.target.value as 'lead' | 'follow' | 'ambos')}
                        />
                        <span className="pill-content">
                          <span className="pill-icon">
                            {rol === 'lead' && '🕺'}
                            {rol === 'follow' && '💃'}
                            {rol === 'ambos' && '💃🕺'}
                          </span>
                          <span className="pill-text">
                            {rol === 'lead' && 'Lead'}
                            {rol === 'follow' && 'Follow'}
                            {rol === 'ambos' && 'Ambos'}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="row-bottom">
                  <div className="row-bottom-header">
                    <h4 className="subtitle">{t('social_networks')}</h4>
                    <span className="tag">{t('optional')}</span>
                  </div>

                  <div className="social-list">
                    <label className="field">
                      <span className="field-icon">
                        <FaInstagram size={18} />
                      </span>
                      <div className="input-group">
                        <span className="prefix">ig/</span>
                        <input
                          type="text"
                          name="instagram"
                          value={form.respuestas?.redes?.instagram || ''}
                          onChange={(e) => setNested('respuestas.redes.instagram', e.target.value)}
                          placeholder="usuario"
                        />
                      </div>
                    </label>

                    <label className="field">
                      <span className="field-icon">
                        <FaTiktok size={18} />
                      </span>
                      <div className="input-group">
                        <span className="prefix">@</span>
                        <input
                          type="text"
                          name="tiktok"
                          value={form.respuestas?.redes?.tiktok || ''}
                          onChange={(e) => setNested('respuestas.redes.tiktok', e.target.value)}
                          placeholder="usuario"
                        />
                      </div>
                    </label>

                    <label className="field">
                      <span className="field-icon">
                        <FaYoutube size={18} />
                      </span>
                      <div className="input-group">
                        <span className="prefix">yt/</span>
                        <input
                          type="text"
                          name="youtube"
                          value={form.respuestas?.redes?.youtube || ''}
                          onChange={(e) => setNested('respuestas.redes.youtube', e.target.value)}
                          placeholder="canal o handle"
                        />
                      </div>
                    </label>

                    <label className="field">
                      <span className="field-icon">
                        <FaFacebookF size={18} />
                      </span>
                      <div className="input-group">
                        <span className="prefix">fb/</span>
                        <input
                          type="text"
                          name="facebook"
                          value={form.respuestas?.redes?.facebook || ''}
                          onChange={(e) => setNested('respuestas.redes.facebook', e.target.value)}
                          placeholder="usuario o página"
                        />
                      </div>
                    </label>

                    <label className="field">
                      <span className="field-icon">
                        <FaWhatsapp size={18} />
                      </span>
                      <div className="input-group">
                        <span className="prefix">+52</span>
                        <input
                          type="tel"
                          name="whatsapp"
                          value={form.respuestas?.redes?.whatsapp || ''}
                          onChange={(e) => setNested('respuestas.redes.whatsapp', e.target.value)}
                          placeholder="55 1234 5678"
                        />
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="editor-section glass-card-container">
            <h2 className="editor-section-title">
              📅 {t('events_and_purchases')}
            </h2>
            <p
              style={{
                marginBottom: '1.5rem',
                color: 'rgba(255,255,255,0.75)',
                fontSize: '0.95rem',
              }}
            >
              {t('events_and_purchases_description')}
            </p>

            <div
              style={{
                display: 'grid',
                gap: '0.75rem',
              }}
            >
              {/* Mis RSVPs */}
              <button
                type="button"
                onClick={() => navigate('/me/rsvps')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.25rem',
                  background:
                    'linear-gradient(135deg, rgba(240,147,251,0.35), rgba(245,87,108,0.35))',
                  border: '1px solid rgba(240,147,251,0.6)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  color: colors.light,
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(240,147,251,0.45)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      marginBottom: '0.15rem',
                    }}
                  >
                    🎫 {t('my_rsvps')}
                  </div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {t('view_rsvps_description')}
                  </div>
                </div>
                <div style={{ fontSize: '1.4rem' }}>→</div>
              </button>

              {/* Mis compras */}
              <button
                type="button"
                onClick={() => navigate('/me/compras')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.25rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  color: colors.light,
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(96,165,250,0.8)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(96,165,250,0.45)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      marginBottom: '0.15rem',
                    }}
                  >
                    🧾 {t('my_purchases')}
                  </div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {t('view_purchases_description')}
                  </div>
                </div>
                <div style={{ fontSize: '1.4rem' }}>→</div>
              </button>
            </div>
          </div>

          <div className="editor-section glass-card-container academy-editor-card" style={{ marginBottom: '3rem', position: 'relative', overflow: 'hidden', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(19,21,27,0.85), rgba(16,18,24,0.85))' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)' }} />

            <div className="rhythms-zones-two-columns" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1E88E5,#7C4DFF)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px rgba(30,136,229,0.35)' }}>🎵</div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#fff', textShadow: 'rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px' }}>Ritmos que Bailas</h2>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Selecciona los ritmos que bailas</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Catálogo agrupado</div>
                  <RitmosSelectorEditor
                    selected={(((form as any)?.ritmos_seleccionados) || []) as string[]}
                    ritmoTags={ritmoTags}
                    setField={setField as any}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1976D2,#00BCD4)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px rgba(25,118,210,0.35)' }}>🗺️</div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#fff', textShadow: 'rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px' }}>¿De donde eres?</h2>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Indica tu zona de origen (solo una)</div>
                  </div>
                </div>

                <div className="academy-chips-container">
                  <ZonaGroupedChips
                    selectedIds={form.zonas}
                    allTags={allTags}
                    mode="edit"
                    onToggle={toggleZona}
                    icon="📍"
                    singleSelect={true}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="editor-section glass-card-container">
            <h2 className="editor-section-title">
              💬 {t('custom_questions')}
            </h2>

            <div className="editor-grid">
              <div>
                <label className="editor-field">
                  🎭 ¿Cuál es tu dato curioso favorito?
                </label>
                <textarea
                  value={form.respuestas?.dato_curioso || ''}
                  onChange={(e) => {
                    setNested('respuestas.dato_curioso', e.target.value);
                  }}
                  placeholder="Comparte algo interesante sobre ti..."
                  rows={2}
                  className="editor-textarea"
                />
              </div>

              <div>
                <label className="editor-field">
                  ¿Qué te gusta más del baile?
                </label>
                <textarea
                  value={form.respuestas?.gusta_bailar || ''}
                  onChange={(e) => {
                    setNested('respuestas.gusta_bailar', e.target.value);
                  }}
                  placeholder={t('tell_us_what_passionates_you')}
                  rows={2}
                  className="editor-textarea"
                />
              </div>
            </div>
          </div>

          <div className="editor-section glass-card-container">
            <h2 className="editor-section-title">
              ⭐ {t('filter_preferences')}
            </h2>
            <p style={{ marginBottom: '1.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
              {t('filter_preferences_description')}
            </p>
            <button
              onClick={() => setShowFilterPreferences(true)}
              style={{
                padding: '1rem 2rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, rgba(240,147,251,0.8), rgba(245,87,108,0.8))',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(240,147,251,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(240,147,251,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(240,147,251,0.3)';
              }}
            >
              ⚙️ {t('configure_filter_preferences')}
            </button>
          </div>

          <div className="photos-two-columns" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem', alignItems: 'stretch' }}>
            <PhotoManagementSection
              media={mediaWithAvatarFallback}
              uploading={uploading}
              uploadFile={uploadFile}
              removeFile={removeFile}
              title={`📷 ${t('photo_management')}`}
              description={`👤 ${t('avatar_main_photo')}`}
              slots={['p1']}
              isMainPhoto={true}
            />

            <PhotoManagementSection
              media={mediaWithAvatarFallback}
              uploading={uploading}
              uploadFile={uploadFile}
              removeFile={removeFile}
              title={`📷 ${t('featured_photos')}`}
              description={t('featured_photos_description')}
              slots={['p2', 'p3']}
              isMainPhoto={false}
              verticalLayout={true}
            />
          </div>

          <PhotoManagementSection
            media={mediaWithAvatarFallback}
            uploading={uploading}
            uploadFile={uploadFile}
            removeFile={removeFile}
            title={`📷 ${t('additional_photos')}`}
            description={t('photos_gallery_description')}
            slots={['p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']}
            isMainPhoto={false}
          />

          <VideoManagementSection
            media={mediaWithAvatarFallback}
            uploading={uploading}
            uploadFile={uploadFile}
            removeFile={removeFile}
            title={`🎥 ${t('video_management')}`}
            description={t('videos_section_description')}
            slots={['v1', 'v2', 'v3']}
          />
        </div>
      </div>

      <FilterPreferencesModal
        isOpen={showFilterPreferences}
        onClose={() => setShowFilterPreferences(false)}
      />
    </>
  );
}
