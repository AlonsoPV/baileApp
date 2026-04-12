import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTags } from "../../hooks/useTags";
import ExploreResponsiveImage from "@/components/explore/ExploreResponsiveImage";
import { EXPLORE_SIZES_LIST_THUMB } from "@/utils/supabaseResponsiveImage";
import { toDirectPublicStorageUrl } from "../../utils/imageOptimization";
import { UserProfilePhotoCarousel } from "../../components/profile/UserProfilePhotoCarousel";
import { PHOTO_SLOTS, getMediaBySlot, normalizeMediaArray, type MediaItem } from "../../utils/mediaSlots";
import EventCard from "../../components/explore/cards/EventCard";
import { supabase } from "../../lib/supabase";
import { colors } from "../../theme/colors";
import { normalizeRitmosToSlugs } from "../../utils/normalizeRitmos";
import { UserProfileHero } from "../../components/profile/UserProfileHero";
import { useFollowStatus } from "../../hooks/useFollowStatus";
import { useFollowerCounts } from "../../hooks/useFollowerCounts";
import { useFollowLists } from "../../hooks/useFollowLists";
import HorizontalSlider from "../../components/explore/HorizontalSlider";
import { useTranslation } from "react-i18next";
import { VideoPlayerWithPiP } from "../../components/video/VideoPlayerWithPiP";
import { isEventUpcomingOrToday, getEventPrimaryDate } from "../../utils/eventDateExpiration";
import { Modal } from "../../components/ui/Modal";
import {
  resolveSupabaseStoragePublicUrl,
  resolveVersionedSupabaseStorageDirectUrl,
  resolveVersionedSupabaseStoragePublicUrl,
} from "../../utils/supabaseStoragePublicUrl";
import { buildShareUrl } from "@/utils/shareUrls";
import "./UserProfile.css";

export const UserProfileLive: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data: allTags } = useTags();
  const { t } = useTranslation();
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
  const [copied, setCopied] = useState(false);

  // Fix media rendering + scroll reset
  useEffect(() => {
    try {
      const el = document.querySelector('.app-shell-content') as HTMLElement | null;
      if (el) el.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      else window.scrollTo(0, 0);
    } catch {}
  }, [userId]);

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

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-public', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_user_public')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setLoadingTimedOut(false);
      const timeoutId = setTimeout(() => {
        setLoadingTimedOut(true);
      }, 15000);
      return () => clearTimeout(timeoutId);
    }
    setLoadingTimedOut(false);
  }, [isLoading, userId]);

  const {
    data: rsvpEvents,
    isLoading: rsvpsLoading,
    error: rsvpsError,
  } = useQuery({
    queryKey: ['user-rsvps', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('event_rsvp')
        .select('id, user_id, event_date_id, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!rows?.length) return [];
      const ids = [...new Set((rows as any[]).map((r: any) => r.event_date_id).filter(Boolean))];
      if (ids.length === 0) return rows as any[];
      const { data: events, error: eventsError } = await supabase
        .from('events_date')
        .select('*')
        .in('id', ids);
      if (eventsError) throw eventsError;
      const byId = new Map((events || []).map((e: any) => [e.id, e]));
      return (rows as any[]).map((r: any) => ({
        ...r,
        events_date: byId.get(r.event_date_id) ?? null,
      }));
    }
  });

  // Logs temporales (solo dev): validar RSVPs -> EventDate
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    try {
      const rows = (rsvpEvents as any[]) || [];
      const first = rows[0];
      const resolved = rows.filter(r => !!(r as any)?.events_date);
      console.log('[UserPublicScreen] RSVP debug', {
        profileUserId: userId,
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
        console.error('[UserPublicScreen] RSVP query error:', rsvpsError);
      }
    } catch {}
  }, [rsvpEvents, userId, rsvpsError]);

  // Eventos con RSVP del usuario (>= hoy) para #user-profile-interested-events
  const availableRsvpEvents = React.useMemo(() => {
    const rows = (rsvpEvents || []) as any[];
    const normalizeEvent = (r: any) => {
      const raw =
        r.events_date ??
        r.event_date ??
        (r as any).eventsDate ??
        (r as any).eventDate;
      const single = Array.isArray(raw) ? raw[0] : raw;
      return single && typeof single === 'object' ? single : null;
    };
    const withEvent = rows.map((r) => ({ ...r, _event: normalizeEvent(r) }));
    const filtered = withEvent.filter((r) => {
      if (!r._event) return false;
      const primary = getEventPrimaryDate(r._event);
      if (primary) return isEventUpcomingOrToday(r._event);
      return true;
    });
    return filtered.sort((a, b) => {
      const fa = getEventPrimaryDate(a._event) || '';
      const fb = getEventPrimaryDate(b._event) || '';
      return fa.localeCompare(fb);
    });
  }, [rsvpEvents]);

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const resolveSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data.session);
      }
    };

    resolveSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const safeMedia = React.useMemo(() => {
    const viewMedia = (profile as any)?.media;
    const arr = normalizeMediaArray(viewMedia);

    // Debug: verificar datos del perfil (vista pública)
    if (import.meta.env.DEV && profile) {
      const slot = (s: string) => (arr as MediaItem[]).find((m) => m?.slot === s);
      console.log('[UserPublicScreen] Profile data (from view):', {
        avatar_url: (profile as any)?.avatar_url,
        mediaRawType: Array.isArray(viewMedia) ? 'array' : typeof viewMedia,
        hasMedia: !!viewMedia,
        mediaLength: arr.length,
        slots: {
          avatar: slot('avatar')?.url,
          p1: slot('p1')?.url,
          p2: slot('p2')?.url,
          p3: slot('p3')?.url,
          cover: slot('cover')?.url,
          v1: slot('v1')?.url,
        },
        hasRespuestas: !!(profile as any).respuestas,
      });
    }

    return arr;
  }, [profile]);

  const profileUserId = profile?.user_id || profile?.id;

  // Cargar media y respuestas desde la tabla base para asegurar que el perfil público tenga
  // la misma galería y secciones de preguntas que el perfil privado.
  const { data: profileFromTable } = useQuery({
    queryKey: ['user-public-profile-fields', profileUserId],
    enabled: !!profileUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles_user')
        .select('media,respuestas')
        .eq('user_id', profileUserId)
        .maybeSingle();
      if (error) {
        console.error('[UserPublicScreen] Error fetching profile fields from profiles_user:', error);
        throw error;
      }
      return data || {};
    },
  });

  const mediaFromTable = React.useMemo(() => {
    const raw = (profileFromTable as any)?.media;
    return normalizeMediaArray(raw);
  }, [profileFromTable]);

  const respuestasFromTable = React.useMemo(() => {
    return (profileFromTable as any)?.respuestas || null;
  }, [profileFromTable]);

  const effectiveMedia = React.useMemo(() => {
    if (Array.isArray(mediaFromTable) && mediaFromTable.length > 0) {
      return mediaFromTable;
    }
    return safeMedia;
  }, [mediaFromTable, safeMedia]);

  const effectiveRespuestas = React.useMemo(() => {
    const fromView = (profile as any)?.respuestas;
    if (fromView && typeof fromView === 'object') {
      return fromView;
    }
    return respuestasFromTable;
  }, [profile, respuestasFromTable]);

  const toSupabasePublicUrl = React.useCallback(
    (maybePath?: string): string | undefined => resolveSupabaseStoragePublicUrl(maybePath),
    []
  );
  const profileImageVersion = (profile as { updated_at?: string; created_at?: string; user_id?: string })?.updated_at
    ?? (profile as { updated_at?: string; created_at?: string; user_id?: string })?.created_at
    ?? profileUserId
    ?? null;

  const avatarUrl = React.useMemo(() => {
    const resolve = (u?: string) => {
      if (!u) return undefined;
      return resolveVersionedSupabaseStorageDirectUrl(u, profileImageVersion, { defaultBucket: 'media' }) ?? undefined;
    };

    // Prioridad requerida:
    // 1) profile.avatar_url  2) media slot "avatar"  3) media slot "p1"  4) iniciales (en Hero)
    const fromProfile = profile?.avatar_url ? resolve(profile.avatar_url) : undefined;
    const fromAvatarSlot = resolve(getMediaBySlot(effectiveMedia as any, 'avatar')?.url);
    const fromP1 = resolve(getMediaBySlot(effectiveMedia as any, 'p1')?.url);
    const raw = fromProfile || fromAvatarSlot || fromP1;
    if (!raw || typeof raw !== 'string' || !raw.trim() || raw.includes('undefined') || raw === '/default-media.png') return undefined;
    return raw;
  }, [effectiveMedia, profile?.avatar_url, profileImageVersion]);
  const navAvatarUrl = React.useMemo(
    () =>
      resolveVersionedSupabaseStoragePublicUrl(profile?.avatar_url ?? null, profileImageVersion, {
        defaultBucket: 'media',
      }) ?? profile?.avatar_url ?? null,
    [profile?.avatar_url, profileImageVersion]
  );

  const [avatarError, setAvatarError] = React.useState(false);
  React.useEffect(() => { setAvatarError(false); }, [avatarUrl]);

  const carouselPhotos = React.useMemo(() => {
    if (!effectiveMedia || !Array.isArray(effectiveMedia) || effectiveMedia.length === 0) {
      return [];
    }
    return PHOTO_SLOTS
      .map(slot => getMediaBySlot(effectiveMedia as any, slot))
      .filter(item => item && item.kind === 'photo' && item.url && typeof item.url === 'string' && item.url.trim() !== '' && !item.url.includes('undefined') && item.url !== '/default-media.png')
      .map(item => toDirectPublicStorageUrl(toSupabasePublicUrl(item!.url) ?? item!.url) || item!.url);
  }, [effectiveMedia, toSupabasePublicUrl]);

  const { counts, setCounts, refetch: refetchCounts } = useFollowerCounts(profileUserId);
  const { isFollowing, toggleFollow, loading: followLoading } = useFollowStatus(profileUserId);
  const isOwnProfile = session?.user?.id && profileUserId === session.user.id;
  const showFollowButton = !!session && !isOwnProfile && !!profileUserId;
  const { following, followers, refetch: refetchLists } = useFollowLists(profileUserId);
  const [networkTab, setNetworkTab] = useState<"following" | "followers">("followers");
  const networkList = networkTab === "following" ? following : followers;
  const networkIsEmpty = networkList.length === 0;
  const [showAllNetworkModal, setShowAllNetworkModal] = useState(false);
  const [verMasModal, setVerMasModal] = useState<{ title: string; text: string } | null>(null);
  const [communityAvatarErrors, setCommunityAvatarErrors] = useState<Set<string>>(new Set());

  const getCommunityAvatarUrl = React.useCallback((p: { avatar_url?: string | null; updated_at?: string | null }) => {
    return resolveVersionedSupabaseStorageDirectUrl(
      p?.avatar_url ?? undefined,
      p?.updated_at ?? null,
      { defaultBucket: 'media' }
    ) ?? null;
  }, []);
  const showCommunityAvatarImg = React.useCallback((person: { id: string; avatar_url?: string | null }, url: string | null) => {
    const valid = url && (url.startsWith('http') || url.startsWith('data:'));
    return valid && !communityAvatarErrors.has(person.id);
  }, [communityAvatarErrors]);
  const handleCommunityAvatarError = React.useCallback((personId: string) => {
    setCommunityAvatarErrors(prev => new Set(prev).add(personId));
  }, []);
  React.useEffect(() => setCommunityAvatarErrors(new Set()), [networkList]);

  const goToProfile = useCallback((id?: string) => {
    if (id) navigate(`/u/${id}`);
  }, [navigate]);

  if (isLoading && !loadingTimedOut) {
    return (
      <>
        
        <div style={{ padding: 24, textAlign: 'center', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏳</div>
            <div style={{ textAlign: 'center', maxWidth: '400px', padding: '0 16px' }}>
              <p style={{ marginBottom: '8px' }}>{t('loading_profile')}</p>
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                {t('refresh_page_for_faster_load')}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isLoading && loadingTimedOut) {
    return (
      <>
     
        <div style={{ padding: 24, textAlign: 'center', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: 360 }}>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>⚠️</div>
            <p style={{ marginBottom: 8 }}>{t('could_not_load_profile')}</p>
            <p style={{ marginBottom: 16, opacity: 0.75, fontSize: '0.9rem' }}>
              {t('check_connection')}
            </p>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                border: 'none',
                background: 'linear-gradient(135deg, #E53935, #FB8C00)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        
        <div style={{ padding: 24, textAlign: 'center', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>❌</div>
            <p>{t('profile_not_found')}</p>
          </div>
        </div>
      </>
    );
  }

  const handleShareProfile = async () => {
    try {
      const url = profileUserId ? buildShareUrl('user', String(profileUserId)) : (typeof window !== 'undefined' ? window.location.href : '');
      const title = profile?.display_name || t('profile');
      const text = t('check_teacher_profile', { name: profile?.display_name || t('user') });
      const navAny = (navigator as any);
      
      if (navAny && typeof navAny.share === 'function') {
        try {
          await navAny.share({ title, text, url });
        } catch (shareError: any) {
          if (shareError.name === 'AbortError') return;
          throw shareError;
        }
      } else {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = url;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      alert(t('could_not_copy_link'));
    }
  };

  const handleToggleFollow = async () => {
    const result = await toggleFollow();
    if (result?.requiresAuth) {
      navigate('/auth/login');
      return;
    }

    if (typeof result?.following === 'boolean') {
      setCounts((prev) => ({
        following: prev.following,
        followers: Math.max(
          0,
          prev.followers + (result.following ? 1 : -1)
        ),
      }));
      
      setTimeout(() => {
        refetchCounts();
        refetchLists();
      }, 500);
    }
  };

  return (
    <>
     
      <div className={`page-shell${isAndroid ? " page-shell--android-tight" : ""}`} style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: colors.darkBase,
        color: colors.light,
        paddingTop: '0',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div style={{ margin: '0.5rem auto 0 auto', maxWidth: 900 }}>
          <UserProfileHero
            user={profile}
            avatarUrl={avatarUrl}
            avatarUrlSameAsNav={navAvatarUrl}
            avatarCacheKey={(profile as { updated_at?: string })?.updated_at ?? null}
            allTags={allTags}
            ritmosSlugs={normalizeRitmosToSlugs(profile, allTags)}
            isOwnProfile={isOwnProfile}
            showFollowButton={showFollowButton}
            followState={{
              followers: counts.followers ?? 0,
              following: counts.following ?? 0,
              isFollowing,
              loading: followLoading,
            }}
            onFollowToggle={handleToggleFollow}
            onShare={handleShareProfile}
            copied={copied}
            onBack={() => navigate('/explore')}
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
                <span className="community-counter-chip">Seguidores {(counts.followers ?? 0).toLocaleString('es-MX')}</span>
                <span className="community-counter-chip">Siguiendo {(counts.following ?? 0).toLocaleString('es-MX')}</span>
              </div>
            </div>

            <div className="community-segmented-tabs">
              <button
                type="button"
                className={`community-segmented-tab ${networkTab === 'followers' ? 'active' : ''}`}
                onClick={() => setNetworkTab('followers')}
              >
                {t('followers')} ({(counts.followers ?? 0).toLocaleString('es-MX')})
              </button>
              <button
                type="button"
                className={`community-segmented-tab ${networkTab === 'following' ? 'active' : ''}`}
                onClick={() => setNetworkTab('following')}
              >
                {t('following')} ({(counts.following ?? 0).toLocaleString('es-MX')})
              </button>
            </div>

            {networkIsEmpty ? (
              <div className="community-empty">
                <p>{networkTab === 'following'
                  ? t('no_following_yet', { name: profile?.display_name || t('this_user') })
                  : t('no_followers_yet', { name: profile?.display_name || t('this_user') })}</p>
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
                        {networkTab === 'followers' && (
                          <span className="relation-badge te-sigue">{t('follows_you')}</span>
                        )}
                        {networkTab === 'following' && (
                          <span className="relation-badge sigues">{t('you_follow')}</span>
                        )}
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

          <Modal
            open={showAllNetworkModal}
            onClose={() => setShowAllNetworkModal(false)}
            title={networkTab === 'followers' ? t('followers') : t('following')}
          >
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
                        cacheVersion={person.updated_at ?? null}
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
                    {networkTab === 'followers' && (
                      <span className="relation-badge te-sigue">{t('follows_you')}</span>
                    )}
                    {networkTab === 'following' && (
                      <span className="relation-badge sigues">{t('you_follow')}</span>
                    )}
                  </div>
                </button>
              );})}
            </div>
          </Modal>
{/* Preguntas curiosas y gusta bailar */}
         {/*  {(() => {
            const fotoP2 = getMediaBySlot(effectiveMedia as any, 'p2');
            const fotoP3 = getMediaBySlot(effectiveMedia as any, 'p3');
            const datoCurioso = (effectiveRespuestas as any)?.dato_curioso;
            const gustaBailar = (effectiveRespuestas as any)?.gusta_bailar;
            const datoCuriosoTrimmed = typeof datoCurioso === 'string' ? datoCurioso.trim() : '';
            const gustaBailarTrimmed = typeof gustaBailar === 'string' ? gustaBailar.trim() : '';
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
                      <button
                        type="button"
                        className="media-info-card-more"
                        onClick={() => setVerMasModal({ title: t('curious_fact_title'), text: datoCuriosoTrimmed || t('no_curious_fact') })}
                      >
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
                      <button
                        type="button"
                        className="media-info-card-more"
                        onClick={() => setVerMasModal({ title: t('what_you_like_to_dance_title'), text: gustaBailarTrimmed || t('no_dance_style') })}
                      >
                        {t('see_more')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
            );
          })()} */}

          <Modal
            open={!!verMasModal}
            onClose={() => setVerMasModal(null)}
            title={verMasModal?.title}
          >
            {verMasModal && (
              <p style={{ margin: 0, lineHeight: 1.6, color: 'rgba(255,255,255,0.95)' }}>
                {verMasModal.text}
              </p>
            )}
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
                  whiteSpace: 'nowrap'
                }}>
                  {availableRsvpEvents.length === 1 
                    ? t('event_count', { count: availableRsvpEvents.length })
                    : t('event_count_plural', { count: availableRsvpEvents.length })}
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
                items={availableRsvpEvents.map((r: any) => r._event ?? r.events_date).filter(Boolean)}
                renderItem={(evento: any, index: number) => (
                  <motion.div
                    key={evento.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                  >
                    <EventCard item={evento} />
                  </motion.div>
                )}
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
                  color: colors.light
                }}>
                  {t('no_interested_events_yet')}
                </h4>
                <p style={{
                  fontSize: '0.875rem',
                  opacity: 0.7,
                  marginBottom: '1.5rem',
                  color: colors.light
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
                    transition: 'all 0.2s'
                  }}
                >
                  🔍 {t('explore_events')}
                </motion.button>
              </motion.div>
            )}
          </motion.section>
{/* video seccion */}
          {/* (() => {
            if (!effectiveMedia || !Array.isArray(effectiveMedia) || effectiveMedia.length === 0) {
              return null;
            }
            
            const videoV1 = getMediaBySlot(effectiveMedia as any, 'v1');
            
       
            if (import.meta.env.DEV) {
              console.log('[UserPublicScreen] Video - videoV1:', videoV1, 'effectiveMedia length:', effectiveMedia.length);
            }
            
            if (!videoV1 || videoV1.kind !== 'video' || !videoV1.url || typeof videoV1.url !== 'string' || videoV1.url.trim() === '') {
              return null;
            }
            
            const videoSrc = toDirectPublicStorageUrl(toSupabasePublicUrl(videoV1.url) || videoV1.url) || (toSupabasePublicUrl(videoV1.url) || videoV1.url);
            if (!videoSrc || typeof videoSrc !== 'string' || !videoSrc.trim() || videoSrc.includes('undefined')) return null;

            return (
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
                    <VideoPlayerWithPiP
                    src={videoSrc}
                    controls
                    preload="metadata"
                    controlsList="nodownload noplaybackrate"
                    aspectRatio="4 / 5"
                    style={{
                      display: 'block',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      minHeight: '350px'
                    }}
                    aria-label={t('main_video')}
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
            );
          })() */}

        {/*   {carouselPhotos && Array.isArray(carouselPhotos) && carouselPhotos.length > 0 && (
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
                  {t('photo_gallery')}
                </h3>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.light
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
