import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useTags } from "../../hooks/useTags";
import { useUserMedia } from "../../hooks/useUserMedia";
import { useUserRSVPEvents } from "../../hooks/useRSVP";
import { useAuth } from '@/contexts/AuthProvider';
import ExploreResponsiveImage from "@/components/explore/ExploreResponsiveImage";
import { EXPLORE_SIZES_LIST_THUMB, EXPLORE_SIZES_PROFILE_FAVORITE_THUMB } from "@/utils/supabaseResponsiveImage";
import { toDirectPublicStorageUrl } from "../../utils/imageOptimization";
import { UserProfilePhotoCarousel } from "../../components/profile/UserProfilePhotoCarousel";
import { PHOTO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import EventCard from "../../components/explore/cards/EventCard";
import { supabase } from "../../lib/supabase";
import { resizeImageIfNeeded } from "../../lib/imageResize";
import { colors } from "../../theme/colors";
import { normalizeRitmosToSlugs } from "../../utils/normalizeRitmos";
import { UserProfileHero } from "../../components/profile/UserProfileHero";
import { useFollowerCounts } from "../../hooks/useFollowerCounts";
import { useFollowLists } from "../../hooks/useFollowLists";
import HorizontalSlider from "../../components/explore/HorizontalSlider";
import { useTranslation } from "react-i18next";
import { useProfileSwitchMetrics } from "../../hooks/useProfileSwitchMetrics";
import { isEventUpcomingOrToday, getEventPrimaryDate } from "../../utils/eventDateExpiration";
import { Modal } from "../../components/ui/Modal";
import { resolveSupabaseStoragePublicUrl } from "../../utils/supabaseStoragePublicUrl";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { buildShareUrl } from "@/utils/shareUrls";
import { routes } from "../../routes/registry";
import "./UserProfile.css";



export const UserProfileLive: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
  const { markUIReady } = useProfileSwitchMetrics();
  const { profile, isLoading: profileLoading, updateProfileFields } = useUserProfile();
  const { data: allTags } = useTags();
  const { media, addMedia } = useUserMedia();
  const [copied, setCopied] = useState(false);
  const { counts } = useFollowerCounts(user?.id);
  const { following, followers } = useFollowLists(user?.id);
  const [networkTab, setNetworkTab] = useState<"following" | "followers">("following");
  const networkList = networkTab === "following" ? following : followers;
  const networkIsEmpty = networkList.length === 0;
  const [showAllNetworkModal, setShowAllNetworkModal] = useState(false);
  const [verMasModal, setVerMasModal] = useState<{ title: string; text: string } | null>(null);
  const [communityAvatarErrors, setCommunityAvatarErrors] = useState<Set<string>>(new Set());
  const [favoritesTab, setFavoritesTab] = useState<'social' | 'class'>('social');

  // Mark UI as ready when profile is loaded and component has rendered
  useEffect(() => {
    if (!profileLoading && profile) {
      // Use requestAnimationFrame to ensure DOM is painted
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          markUIReady('UserProfileLive');
        });
      });
    }
  }, [profileLoading, profile, markUIReady]);

  useEffect(() => {
    if (!isAndroid) return;
    const el = document.querySelector(".app-shell-content") as HTMLElement | null;
    if (!el) return;
    const prevTop = el.style.paddingTop;
    const prevBottom = el.style.paddingBottom;
    el.style.paddingTop = "0px";
    el.style.paddingBottom = "0px";
    return () => {
      el.style.paddingTop = prevTop;
      el.style.paddingBottom = prevBottom;
    };
  }, [isAndroid]);
  const goToProfile = useCallback((id?: string) => {
    if (id) {
      navigate(`/u/${id}`);
    }
  }, [navigate]);

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(routes.app.explore);
    }
  }, [navigate]);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [avatarError, setAvatarError] = React.useState(false);

  const safeMedia = media || [];
  const {
    data: rsvpEvents,
    isLoading: rsvpsLoading,
    error: rsvpsError,
  } = useUserRSVPEvents();
  const {
    events: favoriteEvents,
    classes: favoriteClasses,
    isLoading: favoritesLoading,
  } = useUserFavorites();

  // Logs temporales (solo dev): validar RSVPs -> EventDate
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    try {
      const rows = (rsvpEvents as any[]) || [];
      const first = rows[0];
      const resolved = rows.filter(r => !!(r as any)?.events_date);
      console.log('[UserProfileLive] RSVP debug', {
        userId: user?.id,
        rsvpsCount: rows.length,
        firstRsvp: first ? {
          id: (first as any).id,
          event_date_id: (first as any).event_date_id,
          status: (first as any).status,
          created_at: (first as any).created_at,
          hasEventsDate: !!(first as any).events_date,
          primaryDate: getEventPrimaryDate((first as any).events_date),
        } : null,
        resolvedEventDatesCount: resolved.length,
      });
      if (rsvpsError) {
        console.error('[UserProfileLive] RSVP query error:', rsvpsError);
      }
    } catch {}
  }, [rsvpEvents, user?.id, rsvpsError]);

  // Eventos con RSVP del usuario (>= hoy) para #user-profile-interested-events
  const availableRsvpEvents = React.useMemo(() => {
    const rows = (rsvpEvents || []) as any[];
  
    const normalizeEvent = (r: any) => {
      const candidates = [
        r.events_date,
        r.event_date,
        r.eventsDate,
        r.eventDate,
        r.events,      // por si el join se llama distinto
        r.event,       // idem
      ];
  
      for (const raw of candidates) {
        const single = Array.isArray(raw) ? raw[0] : raw;
        if (single && typeof single === "object") return single;
      }
      return null;
    };
  
    const withEvent = rows.map((r) => {
      const ev = normalizeEvent(r);
      return { ...r, _event: ev };
    });
  
    const filtered = withEvent.filter((r) => {
      if (!r._event) return false;
  
      // Si no puedo resolver fecha, lo dejo pasar (mejor mostrar que ocultar)
      const primary = getEventPrimaryDate(r._event);
      if (!primary) return true;
  
      try {
        return isEventUpcomingOrToday(r._event);
      } catch {
        return true;
      }
    });
  
    return filtered;
  }, [rsvpEvents]);

  const toSupabasePublicUrl = React.useCallback(
    (maybePath?: string): string | undefined => resolveSupabaseStoragePublicUrl(maybePath),
    []
  );

  const getCommunityAvatarUrl = React.useCallback((p: { avatar_url?: string | null }) => {
    const raw = toSupabasePublicUrl(p?.avatar_url ?? undefined) ?? p?.avatar_url ?? undefined;
    return (raw && typeof raw === 'string') ? (toDirectPublicStorageUrl(raw) || raw) : null;
  }, [toSupabasePublicUrl]);
  const showCommunityAvatarImg = React.useCallback((person: { id: string; avatar_url?: string | null }, url: string | null) => {
    const valid = url && (url.startsWith('http') || url.startsWith('data:'));
    return valid && !communityAvatarErrors.has(person.id);
  }, [communityAvatarErrors]);
  const handleCommunityAvatarError = React.useCallback((personId: string) => {
    setCommunityAvatarErrors(prev => new Set(prev).add(personId));
  }, []);
  React.useEffect(() => setCommunityAvatarErrors(new Set()), [networkList]);

  const avatarUrl = React.useMemo(() => {
    const resolve = (raw?: string | null) => {
      if (!raw || typeof raw !== 'string') return undefined;
      const v = raw.trim();
      if (!v || v.includes('undefined') || v === '/default-media.png') return undefined;
      const pub = toSupabasePublicUrl(v) ?? v;
      return toDirectPublicStorageUrl(pub) ?? pub;
    };

    // Prioridad requerida:
    // 1) profile.avatar_url  2) media slot "avatar"  3) media slot "p1"  4) iniciales (en Hero)
    const fromProfile = resolve(profile?.avatar_url ?? null);
    const fromAvatarSlot = resolve(getMediaBySlot(safeMedia as any, 'avatar')?.url ?? null);
    const fromP1 = resolve(getMediaBySlot(safeMedia as any, 'p1')?.url ?? null);
    return fromProfile || fromAvatarSlot || fromP1;
  }, [safeMedia, profile?.avatar_url, toSupabasePublicUrl]);

  // Reset avatarError cuando cambia avatarUrl
  React.useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  const handleCoverUpload = React.useCallback(async (file: File) => {
    if (!user) return;
    setUploadingCover(true);
    try {
      const processedFile = await resizeImageIfNeeded(file, 800);
      const ext = processedFile.name.split('.').pop();
      const path = `user-covers/${user.id}/cover.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, processedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from('media').getPublicUrl(path);

      await updateProfileFields({
        respuestas: {
          ...profile?.respuestas,
          cover_url: publicUrl.publicUrl
        }
      });
    } catch (error) {
      console.error('Error uploading cover:', error);
    } finally {
      setUploadingCover(false);
    }
  }, [user, profile?.respuestas, updateProfileFields]);

  const handlePhotoUpload = React.useCallback(async (file: File, slot: string) => {
    if (!user) return;
    setUploadingPhoto(true);
    try {
      const processedFile = await resizeImageIfNeeded(file, 800);
      const ext = processedFile.name.split('.').pop();
      const path = `user-media/${user.id}/${slot}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, processedFile, { upsert: true });

      if (uploadError) throw uploadError;

      await addMedia.mutateAsync(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  }, [user, addMedia]);

  const handleVideoUpload = React.useCallback(async (file: File, slot: string) => {
    if (!user) return;
    setUploadingVideo(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `user-media/${user.id}/${slot}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      await addMedia.mutateAsync(file);
    } catch (error) {
      console.error('Error uploading video:', error);
    } finally {
      setUploadingVideo(false);
    }
  }, [user, addMedia]);

  const handleShareProfile = React.useCallback(async () => {
    try {
      if (!user?.id) {
        console.warn('[UserProfileLive] No se pudo compartir: user.id indefinido');
        return;
      }
      const publicUrl = buildShareUrl('user', String(user.id));
      const title = profile?.display_name || 'Perfil';
      const text = `Mira el perfil de ${title}`;
      const navAny = navigator as { share?: (opts: { title: string; text: string; url: string }) => Promise<void> };
      if (navAny?.share) {
        await navAny.share({ title, text, url: publicUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        console.error('[UserProfileLive] Error al compartir', err);
      }
    }
  }, [user?.id, profile?.display_name]);

  const carouselPhotos = React.useMemo(() => {
    return PHOTO_SLOTS
      .map(slot => getMediaBySlot(safeMedia as any, slot))
      .filter(item => item && item.kind === 'photo' && item.url && typeof item.url === 'string' && item.url.trim() !== '' && !item.url.includes('undefined') && item.url !== '/default-media.png')
      .map(item => toDirectPublicStorageUrl(toSupabasePublicUrl(item!.url) ?? item!.url) || item!.url);
  }, [safeMedia, toSupabasePublicUrl]);

  if (profileLoading) {
    return (
      <>
      
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: colors.darkBase,
            color: colors.light,
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '400px', padding: '0 16px' }}>
            <p style={{ marginBottom: '8px', fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{t('loading_your_profile')}</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
              {t('refresh_page_for_faster_load')}
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
       
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: colors.darkBase,
            color: colors.light,
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          No se encontró el perfil
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .page-shell--user-live-android .section-container {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }
        }
      `}</style>
      <div className={isAndroid ? "page-shell--user-live-android" : undefined} style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: colors.darkBase,
        color: colors.light,
        paddingTop: '0',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <ProfileNavigationToggle
            currentView="live"
            profileType="user"
          />
        </div>

        <div style={{ margin: '0 auto', maxWidth: 900 }}>
          <UserProfileHero
            user={profile}
            avatarUrl={avatarUrl}
            avatarUrlSameAsNav={profile?.avatar_url}
            avatarCacheKey={(profile as { updated_at?: string })?.updated_at ?? null}
            allTags={allTags}
            ritmosSlugs={normalizeRitmosToSlugs(profile, allTags)}
            isOwnProfile
            showFollowButton={false}
            followState={{
              followers: counts.followers ?? 0,
              following: counts.following ?? 0,
              isFollowing: false,
              loading: false,
            }}
            onFollowToggle={() => {}}
            onShare={handleShareProfile}
            copied={copied}
            onBack={handleBack}
            showBackButton
            avatarError={avatarError}
            onAvatarError={() => setAvatarError(true)}
          />
        </div>

        <div
          id="user-profile-main-content"
          data-baile-id="user-profile-main-content"
          data-test-id="user-profile-main-content"
          className="profile-container"
          style={{
            padding: '2rem',
            margin: '0 auto'
          }}
        >

          {/* Funcionalidad "seguir perfil" / comunidad deshabilitada temporalmente - class="community-card-container" */}
          {/* <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="community-card-container"
            style={{ marginTop: '1.25rem' }}
          >
            <div className="community-header">
              <div>
                <h3 className="community-header-title">Comunidad</h3>
                <p className="community-header-subtitle">Seguidores y seguidos</p>
              </div>
              <div className="community-counter">
                <span className="community-counter-chip">Seguidores {(counts?.followers ?? 0).toLocaleString('es-MX')}</span>
                <span className="community-counter-chip">Siguiendo {(counts?.following ?? 0).toLocaleString('es-MX')}</span>
              </div>
            </div>
            <div className="community-segmented-tabs">
              <button
                type="button"
                className={`community-segmented-tab ${networkTab === 'followers' ? 'active' : ''}`}
                onClick={() => setNetworkTab('followers')}
              >
                {t('followers')} ({(counts?.followers ?? 0).toLocaleString('es-MX')})
              </button>
              <button
                type="button"
                className={`community-segmented-tab ${networkTab === 'following' ? 'active' : ''}`}
                onClick={() => setNetworkTab('following')}
              >
                {t('following')} ({(counts?.following ?? 0).toLocaleString('es-MX')})
              </button>
            </div>
            {networkIsEmpty ? (
              <div className="community-empty">
                <p>{networkTab === 'following' ? t('no_following_yet_message') : t('no_followers_yet_message')}</p>
                <button
                  type="button"
                  onClick={handleShareProfile}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 8,
                    background: 'rgba(255,157,28,0.2)',
                    border: '1px solid rgba(255,157,28,0.4)',
                    color: '#FF9F1C',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  {t('share_profile')}
                </button>
              </div>
            ) : (
              <>
                <div className="community-avatar-row">
                  {(networkList.slice(0, 7) as Array<{ id: string; display_name: string | null; avatar_url: string | null }>).map((person, idx) => {
                    const isOverflow = idx === 6 && networkList.length > 7;
                    const avatarUrl = getCommunityAvatarUrl(person);
                    const showImg = showCommunityAvatarImg(person, avatarUrl);
                    return (
                      <button
                        key={person.id}
                        type="button"
                        className={`community-avatar-item ${isOverflow ? 'overflow' : ''}`}
                        onClick={() => isOverflow ? setShowAllNetworkModal(true) : goToProfile(person.id)}
                        title={person.display_name || undefined}
                      >
                        {isOverflow ? `+${networkList.length - 7}` : showImg ? (
                          <img
                            src={avatarUrl!}
                            alt={person.display_name || t('profile')}
                            loading="eager"
                            decoding="async"
                            onError={() => handleCommunityAvatarError(person.id)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <span className="community-avatar-initial" aria-hidden>
                            {person.display_name?.[0]?.toUpperCase() || '?'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {networkList.slice(0, 6).map((person) => {
                    const avatarUrl = getCommunityAvatarUrl(person);
                    const showImg = showCommunityAvatarImg(person, avatarUrl);
                    return (
                    <button
                      key={person.id}
                      type="button"
                      className="community-user-row"
                      onClick={() => goToProfile(person.id)}
                    >
                      <div className="avatar-wrap">
                        {showImg ? (
                          <img
                            src={avatarUrl!}
                            alt={person.display_name || t('profile')}
                            loading="eager"
                            decoding="async"
                            onError={() => handleCommunityAvatarError(person.id)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <span className="community-avatar-initial" aria-hidden>
                            {person.display_name?.[0]?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="user-info">
                        <div className="display-name">{person.display_name || t('dancer')}</div>
                      </div>
                      <div className="community-relation-badges">
                        {networkTab === 'followers' && <span className="relation-badge te-sigue">{t('follows_you')}</span>}
                        {networkTab === 'following' && <span className="relation-badge sigues">{t('you_follow')}</span>}
                      </div>
                    </button>
                  );})}
                </div>
                <div className="community-ver-todos">
                  <button
                    type="button"
                    className="community-ver-todos-btn"
                    onClick={() => setShowAllNetworkModal(true)}
                  >
                    Ver todos los {networkTab === 'followers' ? t('followers').toLowerCase() : t('following').toLowerCase()}
                    <span aria-hidden>→</span>
                  </button>
                </div>
              </>
            )}
          </motion.section> */}

          <motion.section
            id="user-profile-favorites"
            data-baile-id="user-profile-favorites"
            data-test-id="user-profile-favorites"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="events-section glass-card-container"
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <h3 className="section-title" style={{ margin: 0 }}>❤️ {t('favorites', 'Favoritos')}</h3>
              <div style={{
                padding: '0.45rem 0.9rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: colors.light,
              }}>
                {(favoriteEvents?.length || 0) + (favoriteClasses?.length || 0)} {t('items', 'items')}
              </div>
            </div>

            {/* Tabs Sociales | Clases */}
            <div style={{
              display: 'flex',
              gap: 4,
              marginBottom: '1.25rem',
              padding: 4,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 12,
              width: 'fit-content',
            }}>
              <button
                type="button"
                onClick={() => setFavoritesTab('social')}
                aria-selected={favoritesTab === 'social'}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 8,
                  border: 'none',
                  background: favoritesTab === 'social' ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: colors.light,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                🎉 {t('social', 'Sociales')} {(favoriteEvents?.length || 0) > 0 ? `(${favoriteEvents?.length})` : ''}
              </button>
              <button
                type="button"
                onClick={() => setFavoritesTab('class')}
                aria-selected={favoritesTab === 'class'}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 8,
                  border: 'none',
                  background: favoritesTab === 'class' ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: colors.light,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                🧑‍🏫 {t('classes', 'Clases')} {(favoriteClasses?.length || 0) > 0 ? `(${favoriteClasses?.length})` : ''}
              </button>
            </div>

            {favoritesLoading ? (
              <div style={{ opacity: 0.8 }}>{t('loading', 'Cargando...')}</div>
            ) : (() => {
              const eventItems = (favoriteEvents || []).map((ev: any) => ({
                key: `event_${ev.id}`,
                type: 'event' as const,
                title: String(ev?.nombre || t('event', 'Evento')),
                subtitle: [ev?.fecha, ev?.hora_inicio].filter(Boolean).join(' · '),
                meta: [ev?.lugar, ev?.ciudad].filter(Boolean).join(' · '),
                image: toDirectPublicStorageUrl(ev?.flyer_url) || ev?.flyer_url || null,
                route: `/social/fecha/${ev.id}`,
              }));
              const classItems = (favoriteClasses || []).map((cl: any) => {
                const basePath = cl?.sourceType === 'academy' ? '/clase/academy' : '/clase/teacher';
                const route = (cl?.href && String(cl.href).startsWith('/clase/')) ? cl.href : `${basePath}/${cl?.sourceId ?? ''}?i=${cl?.cronogramaIndex ?? 0}`;
                return {
                  key: `class_${cl?.favorite_id ?? ''}_${cl?.sourceType}_${cl?.sourceId}_${cl?.cronogramaIndex}`,
                  type: 'class' as const,
                  title: String(cl?.title || t('class', 'Clase')),
                  subtitle: String(cl?.ownerName || ''),
                  meta: [cl?.dayLabel, cl?.timeLabel, cl?.locationLabel].filter(Boolean).join(' · '),
                  image: toDirectPublicStorageUrl(cl?.coverUrl) || cl?.coverUrl || null,
                  route,
                };
              });
              const items = favoritesTab === 'social' ? eventItems : classItems;

              if (items.length === 0) {
                return (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem 1rem',
                    border: '2px dashed rgba(255,255,255,0.2)',
                    borderRadius: 14,
                    opacity: 0.9,
                    background: 'rgba(255,255,255,0.03)',
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{favoritesTab === 'social' ? '🎉' : '🧑‍🏫'}</div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      {favoritesTab === 'social'
                        ? t('no_event_favorites_yet', 'Aún no tienes eventos favoritos')
                        : t('no_class_favorites_yet', 'Aún no tienes clases favoritas')}
                    </div>
                    <div style={{ opacity: 0.72, fontSize: 13 }}>
                      {favoritesTab === 'social'
                        ? t('save_event_favorites_prompt', 'Guarda eventos para verlos aquí')
                        : t('save_class_favorites_prompt', 'Guarda clases para verlas aquí')}
                    </div>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {items.map((it, idx) => (
                    <motion.button
                      key={it.key}
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.995 }}
                      onClick={() => navigate(it.route)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        display: 'grid',
                        gridTemplateColumns: '56px 1fr auto',
                        gap: 12,
                        alignItems: 'center',
                        borderRadius: 14,
                        border: '1px solid rgba(255,255,255,0.16)',
                        background: 'linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                        padding: '0.7rem',
                        cursor: 'pointer',
                        color: colors.light,
                      }}
                    >
                      <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: 10,
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                      }}>
                        {it.image ? (
                          <ExploreResponsiveImage
                            rawUrl={it.image}
                            cacheVersion={(profile as { updated_at?: string })?.updated_at ?? null}
                            preset="listThumb"
                            sizes={EXPLORE_SIZES_PROFILE_FAVORITE_THUMB}
                            alt={it.title}
                            priority={idx === 0}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <span aria-hidden>{it.type === 'event' ? '🎉' : '🧑‍🏫'}</span>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'inline-flex', marginBottom: 4, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: it.type === 'event' ? 'rgba(251,140,0,0.18)' : 'rgba(39,195,255,0.18)' }}>
                          {it.type === 'event' ? t('event', 'Evento') : t('class', 'Clase')}
                        </div>
                        <div style={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
                        {it.subtitle ? (
                          <div style={{ fontSize: 12, opacity: 0.82, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.subtitle}</div>
                        ) : null}
                        {it.meta ? (
                          <div style={{ fontSize: 12, opacity: 0.72, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.meta}</div>
                        ) : null}
                      </div>
                      <div aria-hidden style={{ opacity: 0.6, fontSize: 20, paddingRight: 4 }}>›</div>
                    </motion.button>
                  ))}
                </div>
              );
            })()}
          </motion.section>

          <Modal open={showAllNetworkModal} onClose={() => setShowAllNetworkModal(false)} title={networkTab === 'followers' ? t('followers') : t('following')}>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {networkList.map((person) => {
                const avatarUrl = getCommunityAvatarUrl(person);
                const showImg = showCommunityAvatarImg(person, avatarUrl);
                return (
                <button
                  key={person.id}
                  type="button"
                  className="community-user-row"
                  onClick={() => { goToProfile(person.id); setShowAllNetworkModal(false); }}
                  style={{ width: '100%' }}
                >
                  <div className="avatar-wrap">
                    {showImg ? (
                      <ExploreResponsiveImage
                        rawUrl={avatarUrl!}
                        cacheVersion={null}
                        preset="listThumb"
                        sizes={EXPLORE_SIZES_LIST_THUMB}
                        alt={person.display_name || t('profile')}
                        onError={() => handleCommunityAvatarError(person.id)}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <span className="community-avatar-initial" aria-hidden>
                        {person.display_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div className="user-info">
                    <div className="display-name">{person.display_name || t('dancer')}</div>
                  </div>
                  <div className="community-relation-badges">
                    {networkTab === 'followers' && <span className="relation-badge te-sigue">{t('follows_you')}</span>}
                    {networkTab === 'following' && <span className="relation-badge sigues">{t('you_follow')}</span>}
                  </div>
                </button>
              );})}
            </div>
          </Modal>
{/* 
          {(() => {
            const fotoP2 = getMediaBySlot(safeMedia as any, 'p2');
            const fotoP3 = getMediaBySlot(safeMedia as any, 'p3');
            const datoCuriosoTrimmed = typeof profile?.respuestas?.dato_curioso === 'string' ? profile.respuestas.dato_curioso.trim() : '';
            const gustaBailarTrimmed = typeof profile?.respuestas?.gusta_bailar === 'string' ? profile.respuestas.gusta_bailar.trim() : '';
            const hasP2 = (fotoP2?.url) || (datoCuriosoTrimmed && datoCuriosoTrimmed.length > 0);
            const hasP3 = (fotoP3?.url) || (gustaBailarTrimmed && gustaBailarTrimmed.length > 0);
            if (!hasP2 && !hasP3) return null;
            const truncateForPreview = (text: string, maxLen: number = 140) => {
              if (!text || text.length <= maxLen) return { text, needsMore: false };
              return { text: text.slice(0, maxLen).trim() + '…', needsMore: true };
            };
            const dc = truncateForPreview(datoCuriosoTrimmed || t('no_curious_fact'));
            const gb = truncateForPreview(gustaBailarTrimmed || t('no_dance_style'));
            return (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="section-content glass-card-container"
                style={{ marginTop: '1.25rem' }}
              >
                <div className="media-info-cards-grid">
                  {hasP2 && (
                    <div className="media-info-card">
                      <div
                        className="media-info-card-bg"
                        style={{ backgroundImage: fotoP2?.url ? `url(${toDirectPublicStorageUrl(fotoP2.url) || fotoP2.url})` : undefined }}
                      />
                      <div className="media-info-card-overlay" />
                      <div className="media-info-card-content">
                        <h3 className="media-info-card-title">{t('curious_fact_title')}</h3>
                        <p className="media-info-card-text">{dc.text}</p>
                        {dc.needsMore && (
                          <button type="button" className="media-info-card-more" onClick={() => setVerMasModal({ title: t('curious_fact_title'), text: datoCuriosoTrimmed || t('no_curious_fact') })}>
                            {t('see_more')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {hasP3 && (
                    <div className="media-info-card">
                      <div
                        className="media-info-card-bg"
                        style={{ backgroundImage: fotoP3?.url ? `url(${toDirectPublicStorageUrl(fotoP3.url) || fotoP3.url})` : undefined }}
                      />
                      <div className="media-info-card-overlay" />
                      <div className="media-info-card-content">
                        <h3 className="media-info-card-title">{t('what_you_like_to_dance_title')}</h3>
                        <p className="media-info-card-text">{gb.text}</p>
                        {gb.needsMore && (
                          <button type="button" className="media-info-card-more" onClick={() => setVerMasModal({ title: t('what_you_like_to_dance_title'), text: gustaBailarTrimmed || t('no_dance_style') })}>
                            {t('see_more')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>
            );
          })()}
 */}
          <Modal open={!!verMasModal} onClose={() => setVerMasModal(null)} title={verMasModal?.title}>
            {verMasModal && <p style={{ margin: 0, lineHeight: 1.6, color: 'rgba(255,255,255,0.95)' }}>{verMasModal.text}</p>}
          </Modal>

          {/* Eventos con RSVP del usuario: única sección que muestra "Eventos de interés" (>= hoy) */}
          <motion.section
            id="user-profile-interested-events"
            data-baile-id="user-profile-interested-events"
            data-test-id="user-profile-interested-events"
            role="region"
            aria-labelledby="user-profile-interested-events-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="events-section glass-card-container"
          >
            <div className="events-header" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <h3 id="user-profile-interested-events-title" className="section-title" style={{ margin: 0 }}>
                 {t('interested_events_title')}
              </h3>
              {availableRsvpEvents.length > 0 && (
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.light,
                  whiteSpace: 'nowrap',
                  fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                }}>
                  {availableRsvpEvents.length} evento{availableRsvpEvents.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {rsvpsLoading ? (
              <HorizontalSlider
                items={[0, 1, 2]}
                renderItem={(_, index: number) => (
                  <div
                    key={index}
                    style={{
                      width: 360,
                      maxWidth: '84vw',
                      height: 460,
                      borderRadius: 22,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
                    }}
                  />
                )}
                gap={20}
                autoColumns="minmax(320px, 400px)"
                showNavButtons={false}
              />
            ) : rsvpsError ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '2rem 1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: colors.light,
                  opacity: 0.9,
                }}
              >
                {process.env.NODE_ENV === 'development'
                  ? `Error cargando RSVPs: ${(rsvpsError as any)?.message ?? String(rsvpsError)}`
                  : t('could_not_load', 'No se pudo cargar')}
              </motion.div>
            ) : availableRsvpEvents.length > 0 ? (
              <HorizontalSlider
                items={availableRsvpEvents.filter((r: any) => r._event || r.events_date)}
                renderItem={(rsvp: any, index: number) => {
                  const evento = rsvp._event ?? rsvp.events_date;
                  if (!evento) return null;
                  return (
                    <motion.div
                      key={rsvp.id || evento.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                    >
                      <EventCard item={evento} />
                    </motion.div>
                  );
                }}
                gap={20}
                autoColumns="minmax(320px, 400px)"
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '16px',
                  border: '2px dashed rgba(255, 255, 255, 0.2)'
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: colors.light,
                  fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                }}>
                  {t('no_interested_events_yet')}
                </h4>
                <p style={{
                  fontSize: '0.875rem',
                  opacity: 0.7,
                  marginBottom: '1.5rem',
                  color: colors.light,
                  fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                }}>
                  {t('explore_events_prompt')}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/explore')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                  }}
                >
                  🔍 {t('explore_events')}
                </motion.button>
              </motion.div>
            )}
          </motion.section>

          {/* {getMediaBySlot(safeMedia as any, 'v1') && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="section-content glass-card-container"
            >
              <div className="question-section">
                <div>
                  <h3 className="section-title">🎥 {t('main_video')}</h3>
                
                </div>

                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '480px',
                    margin: '0 auto',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2))',
                    border: '2px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                    padding: '3px'
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: '3px',
                      borderRadius: '13px',
                      background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.1), rgba(255, 209, 102, 0.1))',
                      pointerEvents: 'none',
                      zIndex: 1
                    }} />
                    
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      borderRadius: '13px',
                      overflow: 'hidden',
                      background: '#000',
                      zIndex: 2
                    }}>
                      <video
                        src={toDirectPublicStorageUrl(getMediaBySlot(safeMedia as any, 'v1')!.url) || getMediaBySlot(safeMedia as any, 'v1')!.url}
                        controls
                        style={{
                          width: '100%',
                          height: 'auto',
                          aspectRatio: '4 / 5',
                          display: 'block',
                          objectFit: 'contain',
                          objectPosition: 'center',
                          minHeight: '350px'
                        }}
                      />
                    </div>

                    <div style={{
                      position: 'absolute',
                      top: '5px',
                      left: '5px',
                      width: '40px',
                      height: '40px',
                      background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent 70%)',
                      borderRadius: '50%',
                      pointerEvents: 'none',
                      zIndex: 3
                    }} />
                    <div style={{
                      position: 'absolute',
                      bottom: '5px',
                      right: '5px',
                      width: '40px',
                      height: '40px',
                      background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent 70%)',
                      borderRadius: '50%',
                      pointerEvents: 'none',
                      zIndex: 3
                    }} />
                  </div>
                </div>
              </div>
            </motion.section>
          )} */}

        {/*   {carouselPhotos && carouselPhotos.length > 0 && carouselPhotos.some(url => url && url.trim() !== '') && (
            <motion.section
              id="user-profile-photo-gallery"
              data-baile-id="user-profile-photo-gallery"
              data-test-id="user-profile-photo-gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="gallery-section glass-card-container"
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <h3 className="section-title">
                  📷 {t('photo_gallery')}
                </h3>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.light,
                  fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                }}>
                  {carouselPhotos.length} foto{carouselPhotos.length !== 1 ? 's' : ''}
                </div>
              </div>

              <UserProfilePhotoCarousel
                photos={carouselPhotos}
                cacheVersion={(profile as { updated_at?: string })?.updated_at ?? null}
              />
            </motion.section>
          )} */}
        </div>
      </div>
    </>
  );
};
