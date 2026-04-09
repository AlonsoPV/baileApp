import React from 'react';
import { useSearchParams, useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ClasesLive from '@/components/events/ClasesLive';
import TeacherCard from '@/components/explore/cards/TeacherCard';
import AcademyCard from '@/components/explore/cards/AcademyCard';
import AddToCalendarWithStats from '@/components/AddToCalendarWithStats';
import { useTeacherPublic } from '@/hooks/useTeacher';
import { useAcademyPublic } from '@/hooks/useAcademy';
import { useUserProfile } from '@/hooks/useUserProfile';
import { urls } from '@/lib/urls';
import SeoHead from '@/components/SeoHead';
import { SEO_BASE_URL, SEO_LOGO_URL } from '@/lib/seoConfig';
import { buildShareUrl } from '@/utils/shareUrls';
import { toDirectPublicStorageUrl } from '@/utils/imageOptimization';
import { getMediaBySlot, normalizeMediaArray } from '@/utils/mediaSlots';
import { calculateNextDateWithTime } from '@/utils/calculateRecurringDates';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { useCreateCheckoutSession } from '@/hooks/useStripeCheckout';
import { getLocaleFromI18n } from '@/utils/locale';
import { resolveSupabaseStoragePublicUrl } from '@/utils/supabaseStoragePublicUrl';
import { useUserFavorites } from '@/hooks/useUserFavorites';
import { useGuestFavorites } from '@/hooks/useGuestFavorites';
import { RITMOS_CATALOG } from '@/lib/ritmosCatalog';
import { normalizeRitmosToSlugs, TAG_NAME_TO_SLUG } from '@/utils/normalizeRitmos';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  Heart,
  Music2,
  Share2,
} from 'lucide-react';
import { routes } from '@/routes/registry';

type SourceType = 'teacher' | 'academy';

export default function ClassPublicScreen() {
  const [sp] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isClassFavorite, toggleClassFavorite, togglingClass } = useUserFavorites();
  const guestFavorites = useGuestFavorites();
  const createCheckout = useCreateCheckoutSession();
  const { t } = useTranslation();
  const locale = getLocaleFromI18n();

  // Función para construir URL de WhatsApp para clases
  const buildClassWhatsAppUrl = React.useCallback((
    phone?: string | null,
    messageTemplate?: string | null,
    className?: string,
    helloFromDb?: string
  ): string | undefined => {
    if (!phone) return undefined;
    
    const cleanedPhone = phone.replace(/[^\d]/g, '');
    if (!cleanedPhone) return undefined;

    let message = '';
    if (messageTemplate && className) {
      // Reemplazar {nombre} o {clase} con el nombre de la clase
      message = messageTemplate
        .replace(/\{nombre\}/g, className)
        .replace(/\{clase\}/g, className);
    } else if (className) {
      // Mensaje por defecto si no hay template
      message = t('me_interested_class', { name: className });
    }

    // Prepend "Hola vengo de Donde Bailar MX, " al mensaje
    const defaultHello = helloFromDb || t('hello_from_db');
    const fullMessage = message.trim() 
      ? `${defaultHello}, ${message.trim()}`
      : defaultHello;

    const encoded = encodeURIComponent(fullMessage);
    return `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encoded}`;
  }, [t]);

  // Permitir /clase?type=teacher&id=123 o /clase/:type/:id
  const sourceType = (params as any)?.type || (sp.get('type') as SourceType) || 'teacher';
  const rawId = (params as any)?.id || sp.get('id') || '';
  const classIdParam = sp.get('classId') || sp.get('claseId') || '';
  const classIndexParam = sp.get('i') || sp.get('index') || '';
  const diaParam = sp.get('dia'); // Día específico para clases con múltiples días
  const fromParam = sp.get('from');
  const idNum = Number(rawId);

  const isTeacher = sourceType === 'teacher';
  const teacherQ = useTeacherPublic(isTeacher && !Number.isNaN(idNum) ? idNum : (undefined as any));
  const academyQ = useAcademyPublic(!isTeacher && !Number.isNaN(idNum) ? idNum : (undefined as any));
  const { profile: userProfile } = useUserProfile();

  const loading = isTeacher ? teacherQ.isLoading : academyQ.isLoading;
  const profile: any = isTeacher ? teacherQ.data : academyQ.data;

  // Hooks must run before any conditional return (Rules of Hooks)
  const mediaList = React.useMemo(
    () => normalizeMediaArray((profile as any)?.media),
    [(profile as any)?.media],
  );
  const [heroAvatarError, setHeroAvatarError] = React.useState(false);
  React.useEffect(() => {
    setHeroAvatarError(false);
  }, [(profile as any)?.avatar_url, (profile as any)?.media]);

  // Derive cronograma/selectedClass etc. BEFORE any early return so hooks below always run in the same order.
  const cronograma = profile?.cronograma || profile?.horarios || [];
  const costos = profile?.costos || [];
  const ubicacionBase = Array.isArray(profile?.ubicaciones) && profile.ubicaciones.length > 0
    ? {
        nombre: profile.ubicaciones[0]?.nombre,
        direccion: profile.ubicaciones[0]?.direccion,
        ciudad: profile.ubicaciones[0]?.ciudad,
        referencias: profile.ubicaciones[0]?.referencias,
      }
    : undefined;
  const classesArr = Array.isArray(cronograma) ? (cronograma as any[]) : [];
  const selectedClassIndex = (() => {
    if (classIdParam) {
      const foundIndex = classesArr.findIndex((c: any) => String(c?.id) === String(classIdParam));
      if (foundIndex >= 0) return foundIndex;
    }
    if (classIndexParam !== '') {
      const idx = Number(classIndexParam);
      if (!Number.isNaN(idx) && idx >= 0 && idx < classesArr.length) return idx;
    }
    return 0;
  })();
  const selectedClass = classesArr[selectedClassIndex] ?? classesArr[0];
  const classFavoriteActive = user
    ? isClassFavorite(sourceType as SourceType, idNum, selectedClassIndex)
    : guestFavorites.isClassFavorite(sourceType as SourceType, idNum, selectedClassIndex);
  const onToggleFavorite = React.useCallback(async () => {
    if (!Number.isFinite(idNum) || idNum < 0) {
      showToast(t('action_failed', 'No se pudo completar la acción'), 'error');
      return;
    }
    if (!user) {
      try {
        const next = guestFavorites.toggleClassFavorite({
          sourceType: sourceType as SourceType,
          sourceId: idNum,
          cronogramaIndex: selectedClassIndex,
        });
        showToast(next ? t('added_to_favorites', 'Agregado a favoritos') : t('removed_from_favorites', 'Eliminado de favoritos'), 'success');
      } catch {
        showToast(t('action_failed', 'No se pudo completar la acción'), 'error');
      }
      return;
    }
    try {
      const next = await toggleClassFavorite({
        sourceType: sourceType as SourceType,
        sourceId: idNum,
        cronogramaIndex: selectedClassIndex,
        classItemId: Number.isFinite(Number((selectedClass as any)?.id)) ? Number((selectedClass as any).id) : null,
      });
      showToast(next ? t('added_to_favorites', 'Agregado a favoritos') : t('removed_from_favorites', 'Eliminado de favoritos'), 'success');
    } catch (e: any) {
      const message = e?.message || e?.error_description || (e?.code ? String(e.code) : null);
      showToast(message || t('action_failed', 'No se pudo completar la acción'), 'error');
    }
  }, [user, guestFavorites, toggleClassFavorite, sourceType, idNum, selectedClassIndex, selectedClass, showToast, t]);
  const ritmoCatalogMaps = React.useMemo(() => {
    const idToLabel = new Map<string, string>();
    const labelToIdLower = new Map<string, string>();
    RITMOS_CATALOG.forEach((g) =>
      g.items.forEach((i) => {
        idToLabel.set(i.id, i.label);
        labelToIdLower.set(i.label.trim().toLowerCase(), i.id);
      }),
    );
    const tagNameToSlugLower = new Map<string, string>();
    Object.entries(TAG_NAME_TO_SLUG).forEach(([k, v]) => tagNameToSlugLower.set(k.trim().toLowerCase(), v));
    return { idToLabel, labelToIdLower, tagNameToSlugLower };
  }, []);

  const { ritmoLabels, ritmoPrincipalLabel } = React.useMemo(() => {
    const labels: string[] = [];
    const slugsCandidate = [
      ...(Array.isArray((selectedClass as any)?.ritmos_seleccionados) ? ((selectedClass as any).ritmos_seleccionados as any[]) : []),
      ...(Array.isArray((selectedClass as any)?.ritmosSeleccionados) ? ((selectedClass as any).ritmosSeleccionados as any[]) : []),
    ].filter((x) => typeof x === 'string') as string[];

    let slugs: string[] = [];
    if (slugsCandidate.length > 0) {
      slugs = normalizeRitmosToSlugs({ ritmos_seleccionados: slugsCandidate });
    } else {
      const ids: Array<number | string> = [];
      if (Array.isArray((selectedClass as any)?.ritmoIds)) ids.push(...(((selectedClass as any).ritmoIds as any[]) || []));
      if (Array.isArray((selectedClass as any)?.ritmos)) ids.push(...(((selectedClass as any).ritmos as any[]) || []));
      if ((selectedClass as any)?.ritmoId != null) ids.push((selectedClass as any).ritmoId);
      const legacyStrings: string[] = [];
      if (typeof (selectedClass as any)?.ritmo === 'string') legacyStrings.push(String((selectedClass as any).ritmo));
      if (typeof (selectedClass as any)?.estilo === 'string') legacyStrings.push(String((selectedClass as any).estilo));
      if (Array.isArray((selectedClass as any)?.ritmos)) {
        (((selectedClass as any).ritmos as any[]) || []).forEach((r) => {
          if (typeof r === 'string') legacyStrings.push(r);
        });
      }
      const legacySlugsFromStrings = legacyStrings
        .map((s) => String(s ?? '').trim())
        .filter(Boolean)
        .map((s) => {
          const lower = s.toLowerCase();
          if (ritmoCatalogMaps.idToLabel.has(s)) return s;
          const byLabel = ritmoCatalogMaps.labelToIdLower.get(lower);
          if (byLabel) return byLabel;
          const byTagName = ritmoCatalogMaps.tagNameToSlugLower.get(lower);
          if (byTagName) return byTagName;
          return null;
        })
        .filter(Boolean) as string[];
      if (legacySlugsFromStrings.length > 0) {
        slugs = normalizeRitmosToSlugs({ ritmos_seleccionados: legacySlugsFromStrings });
      } else if (ids.length > 0) {
        slugs = normalizeRitmosToSlugs({ ritmos: ids });
      }
    }
    if (slugs.length > 0) {
      slugs.forEach((slug) => {
        const label = ritmoCatalogMaps.idToLabel.get(slug) || slug;
        if (label) labels.push(label);
      });
    }
    const uniq = [...new Set(labels)].filter(Boolean);
    const primary = uniq[0] || '';
    return { ritmoLabels: uniq, ritmoPrincipalLabel: primary };
  }, [selectedClass, ritmoCatalogMaps]);

  const nivelLabel = React.useMemo(() => {
    const raw = (selectedClass as any)?.nivel;
    if (raw === null || raw === undefined) return undefined;
    const s = String(raw).trim();
    if (!s) return undefined;
    const levelByCode: Record<string, string> = {
      '0': 'Todos los niveles',
      '1': 'Principiante',
      '2': 'Intermedio',
      '3': 'Avanzado',
    };
    if (levelByCode[s]) return levelByCode[s];
    return s;
  }, [selectedClass]);

  const handleBack = React.useCallback(() => {
    if (fromParam === '/me/compras' || fromParam === '/me/rsvps') {
      navigate(fromParam);
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(routes.app.explore);
    }
  }, [navigate, fromParam]);

  if (!rawId || Number.isNaN(idNum)) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>{t('missing_id')}</div>;
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>{t('loading')}</div>;
  }

  if (!profile) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>{t('class_not_found')}</div>;
  }

  const creatorName = profile?.nombre_publico || profile?.display_name || '—';
  const creatorLink = isTeacher ? urls.teacherLive(profile?.id) : urls.academyLive(profile?.id);
  const creatorTypeLabel = isTeacher ? t('teacher') : t('academy');

  // Precio numérico de la clase (para Stripe)
  const classPrice: number | null = (() => {
    try {
      // 1) Modelo nuevo: c.costo es un número
      if (typeof (selectedClass as any)?.costo === 'number') {
        const val = (selectedClass as any).costo as number;
        if (val > 0) return val;
      }

      // 2) Modelo con objeto: c.costo.precio
      if ((selectedClass as any)?.costo && typeof (selectedClass as any).costo?.precio === 'number') {
        const val = (selectedClass as any).costo.precio as number;
        if (val > 0) return val;
      }

      // 3) Buscar en el array de costos (modelo viejo)
      if (Array.isArray(costos) && costos.length) {
        const byClassId = (costos as any[]).find((c: any) => {
          if ((selectedClass as any)?.id && c?.classId && String(c.classId) === String((selectedClass as any).id)) {
            return true;
          }
          if (typeof c?.cronogramaIndex === 'number' && c.cronogramaIndex === selectedClassIndex) {
            return true;
          }
          return false;
        });
        if (byClassId && typeof byClassId.precio === 'number' && byClassId.precio > 0) {
          return byClassId.precio as number;
        }
      }
    } catch (e) {
      console.warn('[ClassPublicScreen] Error calculando classPrice:', e);
    }
    return null;
  })();

  console.log('[ClassPublicScreen] 💳 Debug pago:', {
    classPrice,
    hasStripeAccount: !!profile?.stripe_account_id,
    stripeAccountId: profile?.stripe_account_id,
  });
  
  // ID estable de clase para asistencia/métricas:
  // 1) usar id real del item de cronograma cuando exista;
  // 2) fallback determinístico por parent+índice (evita desalineación entre flujos).
  const classStableId = (() => {
    const rawClassId = Number((selectedClass as any)?.id);
    if (Number.isFinite(rawClassId) && rawClassId > 0) return rawClassId;
    if (Number.isFinite(idNum) && idNum > 0) return idNum * 1000 + selectedClassIndex + 1;
    return null;
  })();

  // Fecha exacta de sesión (YYYY-MM-DD) para registrar asistencia por sesión concreta.
  const classSessionDateYmd = (() => {
    const explicit = (selectedClass as any)?.fecha;
    if (typeof explicit === 'string' && explicit.trim()) {
      return explicit.includes('T') ? explicit.split('T')[0] : explicit;
    }
    const resolveDay = () => {
      if (diaParam !== null) {
        const d = Number(diaParam);
        if (!Number.isNaN(d) && d >= 0 && d <= 6) return d;
      }
      if ((selectedClass as any)?.diaSemana != null && Number.isFinite(Number((selectedClass as any).diaSemana))) {
        return Number((selectedClass as any).diaSemana);
      }
      if ((selectedClass as any)?.dia_semana != null && Number.isFinite(Number((selectedClass as any).dia_semana))) {
        return Number((selectedClass as any).dia_semana);
      }
      if (Array.isArray((selectedClass as any)?.diasSemana) && (selectedClass as any).diasSemana.length > 0) {
        const first = (selectedClass as any).diasSemana[0];
        const dayMap: Record<string, number> = {
          domingo: 0, dom: 0,
          lunes: 1, lun: 1,
          martes: 2, mar: 2,
          miércoles: 3, miercoles: 3, mié: 3, mie: 3,
          jueves: 4, jue: 4,
          viernes: 5, vie: 5,
          sábado: 6, sabado: 6, sáb: 6, sab: 6,
        };
        if (typeof first === 'number' && first >= 0 && first <= 6) return first;
        if (typeof first === 'string') {
          const mapped = dayMap[first.toLowerCase().trim()];
          if (mapped !== undefined) return mapped;
        }
      }
      return null;
    };
    const sessionDay = resolveDay();
    if (sessionDay === null) return null;
    const rawTime = String((selectedClass as any)?.inicio || (selectedClass as any)?.hora_inicio || '20:00');
    const timeMatch = rawTime.match(/^(\d{1,2}):(\d{2})/);
    const normalizedTime = timeMatch
      ? `${String(Math.min(23, Math.max(0, Number(timeMatch[1])))).padStart(2, '0')}:${String(Math.min(59, Math.max(0, Number(timeMatch[2])))).padStart(2, '0')}`
      : '20:00';
    const nextDate = calculateNextDateWithTime(sessionDay, normalizedTime);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    const d = String(nextDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();
  
  const cronogramaSelected = selectedClass ? [selectedClass] : [];

  // Ubicación: priorizar la de la clase si existe, si no usar base
  const ubicacion = selectedClass?.ubicacion
    ? { nombre: selectedClass.ubicacion, direccion: undefined as any, ciudad: ubicacionBase?.ciudad, referencias: undefined as any }
    : ubicacionBase;

  // Título de la clase
  const classTitle = (selectedClass?.nombre)
    || (selectedClass?.titulo)
    || (selectedClass?.clase)
    || (selectedClass?.estilo)
    || t('class');

  // Configuración WhatsApp para clases (solo academias tienen WhatsApp configurado)
  const whatsappNumber = !isTeacher ? ((profile as any)?.whatsapp_number || null) : null;
  const whatsappMessageTemplate = !isTeacher ? ((profile as any)?.whatsapp_message_template || 'me interesa la clase: {nombre}') : null;
  
  // Debug: verificar datos de WhatsApp
  console.log('[ClassPublicScreen] 📱 WhatsApp config:', {
    isTeacher,
    whatsappNumber,
    whatsappMessageTemplate,
    profileId: profile?.id,
    profileType: isTeacher ? 'teacher' : 'academy',
    hasWhatsappNumber: !!(profile as any)?.whatsapp_number
  });

  // Horario, costo y ubicación (para chips del header)
  const scheduleLabel = (() => {
    const ini = (selectedClass as any)?.inicio || (selectedClass as any)?.hora_inicio;
    const fin = (selectedClass as any)?.fin || (selectedClass as any)?.hora_fin;
    if (ini && fin) return `${ini} - ${fin}`;
    if (ini) return `${ini}`;
    return undefined;
  })();

  const handlePayClick = async () => {
    if (!user) {
      showToast(t('must_login_to_pay'), 'error');
      navigate('/auth/login');
      return;
    }
    if (!profile?.stripe_account_id) {
      showToast(t('stripe_not_ready'), 'error');
      return;
    }
    if (!classPrice || classPrice <= 0) {
      showToast(t('no_valid_price'), 'error');
      return;
    }

    try {
      if (!classStableId) {
        showToast(t('no_valid_class_reference', 'No se pudo identificar la sesión de clase'), 'error');
        return;
      }

      const bookingPayload = {
        user_id: user.id,
        class_id: classStableId,
        academy_id: !isTeacher ? profile?.id : null,
        teacher_id: isTeacher ? profile?.id : null,
        role_baile: (userProfile as any)?.rol_baile || null,
        status: 'tentative',
        fecha_especifica: classSessionDateYmd || null,
      };

      const { data: booking, error: bookingError } = await supabase
        .from('clase_asistencias')
        .upsert(bookingPayload, { onConflict: 'user_id,class_id,fecha_especifica' })
        .select('id')
        .single();

      let bookingId: string | number;
      if (bookingError) {
        let existingQuery = supabase
          .from('clase_asistencias')
          .select('id')
          .eq('user_id', user.id)
          .eq('class_id', classStableId);
        if (classSessionDateYmd) existingQuery = existingQuery.eq('fecha_especifica', classSessionDateYmd);
        else existingQuery = existingQuery.is('fecha_especifica', null);
        const { data: existing } = await existingQuery.maybeSingle();

        if (!existing) {
          throw bookingError;
        }
        bookingId = existing.id;
      } else {
        bookingId = booking.id;
      }

      await createCheckout.mutateAsync({
        price: classPrice,
        description: t('class_with_creator', { title: classTitle, creator: creatorName }),
        connectedAccountId: profile.stripe_account_id,
        origin: 'clase',
        bookingId,
      });
    } catch (error: any) {
      console.error('[ClassPublicScreen] Error al procesar pago:', error);
      showToast(error?.message || t('error_starting_payment'), 'error');
    }
  };

  const costLabel = (() => {
    try {
      console.log('[ClassPublicScreen] 💰 Buscando costo:', {
        costosLength: costos?.length || 0,
        selectedClassIndex,
        classId: selectedClass?.id,
        referenciaCosto: selectedClass?.referenciaCosto,
        titulo: selectedClass?.titulo,
        nombre: selectedClass?.nombre,
        tieneCostoEnClase: !!(selectedClass as any)?.costo,
        costos: costos
      });
      
      // PRIORIDAD 1: Buscar costo directamente en el item del cronograma (más rápido y confiable)
      if ((selectedClass as any)?.costo) {
        const costoEnClase = (selectedClass as any).costo;
        const precio = costoEnClase?.precio;
        if (typeof precio === 'number') {
          console.log('[ClassPublicScreen] ✅ Costo encontrado directamente en el item del cronograma:', { costoEnClase });
          if (precio === 0) {
            return t('free');
          }
          return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(precio);
        }
        // Si precio es null/undefined, retornar undefined para no mostrar nada
        return undefined;
      }
      
      // PRIORIDAD 2: Buscar en el array de costos (fallback para datos antiguos)
      if (Array.isArray(costos) && costos.length) {
        // Buscar costo por múltiples criterios (más robusto)
        // PRIORIDAD: ID de clase > Índice cronograma > Nombre (para evitar problemas al cambiar nombre)
        let match: any = null;
        let matchMethod = '';
        
        // 1. Buscar por ID de clase (MÁS CONFIABLE - no cambia aunque cambie el nombre)
        if ((selectedClass as any)?.id) {
          const classId = String((selectedClass as any).id);
          // Buscar por classId exacto
          match = (costos as any[]).find((c: any) => {
            // Buscar por classId (campo dedicado)
            if (c?.classId && String(c.classId) === classId) return true;
            // Buscar por referenciaCosto que sea el ID (para compatibilidad)
            if (c?.referenciaCosto && String(c.referenciaCosto) === classId) return true;
            // También buscar si el nombre del costo es el ID (para compatibilidad con costos muy antiguos)
            return String(c?.nombre || '').trim() === classId;
          });
          if (match) {
            matchMethod = 'classId';
            console.log('[ClassPublicScreen] ✅ Costo encontrado por ID de clase:', { classId, match });
          }
        }
        
        // 2. Buscar por índice del cronograma (segunda opción más confiable)
        if (!match && selectedClassIndex !== null && selectedClassIndex !== undefined) {
          match = (costos as any[]).find((c: any) => c?.cronogramaIndex === selectedClassIndex);
          if (match) {
            matchMethod = 'cronogramaIndex';
            console.log('[ClassPublicScreen] ✅ Costo encontrado por índice:', { selectedClassIndex, match });
          }
        }
        
        // 3. Buscar por referenciaCosto (nombre de la clase) - case-insensitive
        // Si hay múltiples matches, priorizar el que tenga precio > 0 y que coincida exactamente
        if (!match && (selectedClass as any)?.referenciaCosto) {
          const ref = String((selectedClass as any).referenciaCosto).trim().toLowerCase();
          
          // Primero buscar match exacto por nombre (más confiable)
          const exactMatches = (costos as any[]).filter((c: any) => {
            const nombre = String(c?.nombre || '').trim().toLowerCase();
            return nombre === ref;
          });
          
          if (exactMatches.length > 0) {
            // Priorizar: 1) que tenga classId/cronogramaIndex, 2) precio > 0
            match = exactMatches.find((c: any) => 
              (c?.classId || c?.cronogramaIndex !== undefined) && 
              typeof c?.precio === 'number' && c.precio > 0
            ) || exactMatches.find((c: any) => 
              typeof c?.precio === 'number' && c.precio > 0
            ) || exactMatches[0]; // Último fallback: cualquier match exacto
            if (match) matchMethod = 'referenciaCosto (exacto)';
          }
          
          // Si no hay match exacto, buscar por título o tipo (menos confiable)
          if (!match) {
            const otherMatches = (costos as any[]).filter((c: any) => {
              const titulo = String(c?.titulo || '').trim().toLowerCase();
              const tipo = String(c?.tipo || '').trim().toLowerCase();
              return titulo === ref || tipo === ref;
            });
            
            if (otherMatches.length > 0) {
              match = otherMatches.find((c: any) => 
                (c?.classId || c?.cronogramaIndex !== undefined) && 
                typeof c?.precio === 'number' && c.precio > 0
              ) || otherMatches.find((c: any) => 
                typeof c?.precio === 'number' && c.precio > 0
              ) || otherMatches[0];
              if (match) matchMethod = 'referenciaCosto (título/tipo)';
            }
          }
        }
        
        // 4. Buscar por título de la clase (fallback)
        if (!match && (selectedClass as any)?.titulo) {
          const ref = String((selectedClass as any).titulo).trim().toLowerCase();
          const allMatches = (costos as any[]).filter((c: any) => {
            const nombre = String(c?.nombre || '').trim().toLowerCase();
            return nombre === ref;
          });
          
          if (allMatches.length > 0) {
            // Priorizar: 1) que tenga classId/cronogramaIndex, 2) precio > 0
            match = allMatches.find((c: any) => 
              (c?.classId || c?.cronogramaIndex !== undefined) && 
              typeof c?.precio === 'number' && c.precio > 0
            ) || allMatches.find((c: any) => 
              typeof c?.precio === 'number' && c.precio > 0
            ) || allMatches[0];
            if (match) matchMethod = 'titulo';
          }
        }
        
        // 5. Buscar por nombre de la clase (último fallback)
        if (!match && (selectedClass as any)?.nombre) {
          const ref = String((selectedClass as any).nombre).trim().toLowerCase();
          const allMatches = (costos as any[]).filter((c: any) => {
            const nombre = String(c?.nombre || '').trim().toLowerCase();
            return nombre === ref;
          });
          
          if (allMatches.length > 0) {
            // Priorizar: 1) que tenga classId/cronogramaIndex, 2) precio > 0
            match = allMatches.find((c: any) => 
              (c?.classId || c?.cronogramaIndex !== undefined) && 
              typeof c?.precio === 'number' && c.precio > 0
            ) || allMatches.find((c: any) => 
              typeof c?.precio === 'number' && c.precio > 0
            ) || allMatches[0];
            if (match) matchMethod = 'nombre';
          }
        }
        
        console.log('[ClassPublicScreen] 💰 Resultado de búsqueda de costo:', {
          matchFound: !!match,
          matchMethod,
          match: match ? { nombre: match.nombre, precio: match.precio, classId: match.classId, cronogramaIndex: match.cronogramaIndex } : null
        });
        
        const precio = match?.precio;
        if (typeof precio === 'number') {
          if (precio === 0) {
            return t('free');
          }
          return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(precio);
        }
        // Si no se encontró un costo específico, buscar el mínimo de todos los costos
        const nums = (costos as any[]).map((c: any) => (typeof c?.precio === 'number' ? c.precio : null)).filter((n: any) => n !== null);
        if (nums.length) {
          const min = Math.min(...(nums as number[]));
          console.log('[ClassPublicScreen] 💰 Usando precio mínimo:', min);
          if (min === 0) {
            return t('free');
          }
          return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(min);
        }
      }
      return undefined;
    } catch (error) {
      console.error('[ClassPublicScreen] ❌ Error buscando costo:', error);
      return undefined;
    }
  })();

  const locationLabel = (() => {
    if (!ubicacion) return undefined;
    // ✅ Requisito: en esta pantalla, la ubicación solo muestra el nombre (sin ciudad ni separadores)
    let name = '';
    if (typeof (ubicacion as any)?.nombre === 'string') {
      name = String((ubicacion as any).nombre).trim();
      // Si el nombre contiene "·" o " - ", extraer solo la primera parte (el nombre real)
      if (name.includes('·')) {
        name = name.split('·')[0].trim();
      } else if (name.includes(' - ')) {
        name = name.split(' - ')[0].trim();
      }
    }
    return name || undefined;
  })();

  const ritmosLabel = ritmoLabels.slice(0, 3).join(', ');
  const locationName = locationLabel || ubicacion?.ciudad || profile?.ciudad || t('mexico');
  const classTimes = scheduleLabel ? ` · Horario: ${scheduleLabel}` : '';
  const seoDescription = `${classTitle} con ${creatorName} en ${locationName}${classTimes}${ritmosLabel ? ` · Ritmos: ${ritmosLabel}` : ''}.`;
  const seoImageRaw =
    getMediaBySlot(mediaList, 'p1')?.url ||
    getMediaBySlot(mediaList, 'cover')?.url ||
    profile?.avatar_url ||
    profile?.banner_url ||
    SEO_LOGO_URL;
  const seoImage = seoImageRaw === SEO_LOGO_URL ? SEO_LOGO_URL : (toDirectPublicStorageUrl(seoImageRaw) || seoImageRaw);
  const classUrl = `${SEO_BASE_URL}/clase/${isTeacher ? 'teacher' : 'academy'}/${idNum}${classIndexParam ? `?i=${classIndexParam}` : classIdParam ? `?classId=${classIdParam}` : ''}`;
  const shareUrl = buildShareUrl('clase', String(idNum), {
    type: isTeacher ? 'teacher' : 'academy',
    index: classIndexParam != null && classIndexParam !== '' ? parseInt(classIndexParam, 10) : undefined,
  });

  // Avatar del hero (OBLIGATORIO: academia/maestro que imparte la clase)
  const avatarUri = (() => {
    const raw =
      profile?.avatar_url ||
      (getMediaBySlot(mediaList, 'avatar') as any)?.url ||
      (getMediaBySlot(mediaList, 'p1') as any)?.url ||
      null;
    if (!raw) return SEO_LOGO_URL;
    const pub = resolveSupabaseStoragePublicUrl(raw, { defaultBucket: 'media' }) || raw;
    return toDirectPublicStorageUrl(pub) || pub;
  })();

  const heroBgUri = (() => {
    const raw =
      profile?.banner_url ||
      (getMediaBySlot(mediaList, 'cover') as any)?.url ||
      null;
    if (!raw) return undefined;
    const pub = resolveSupabaseStoragePublicUrl(raw, { defaultBucket: 'media' }) || raw;
    return toDirectPublicStorageUrl(pub) || pub;
  })();

  const dayLabelLong = (() => {
    try {
      // Fecha específica: “Domingo, 1 de diciembre”
      if (selectedClass?.fecha) {
        const fechaValue = String(selectedClass.fecha);
        const fechaOnly = fechaValue.includes('T') ? fechaValue.split('T')[0] : fechaValue;
        const [year, month, day] = fechaOnly.split('-').map(Number);
        const fechaDate = new Date(year, (month || 1) - 1, day || 1);
        return fechaDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
      }

      const dayNames = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')];

      // Parámetro de día específico (clase con múltiples días)
      if (diaParam !== null) {
        const diaNum = Number(diaParam);
        if (!Number.isNaN(diaNum) && diaNum >= 0 && diaNum <= 6) return dayNames[diaNum] || t('day_not_specified');
      }

      // Día de la semana simple
      if (selectedClass?.diaSemana !== undefined && selectedClass?.diaSemana !== null) {
        return dayNames[selectedClass.diaSemana] || t('day_not_specified');
      }
      if (selectedClass?.dia_semana !== undefined && selectedClass?.dia_semana !== null) {
        const d = Number(selectedClass.dia_semana);
        if (!Number.isNaN(d) && d >= 0 && d <= 6) return dayNames[d] || t('day_not_specified');
      }

      // Múltiples días
      if (Array.isArray(selectedClass?.diasSemana) && selectedClass.diasSemana.length > 0) {
        const dayNameMap: Record<string, string> = {
          domingo: t('sunday'), dom: t('sunday'),
          lunes: t('monday'), lun: t('monday'),
          martes: t('tuesday'), mar: t('tuesday'),
          miércoles: t('wednesday'), miercoles: t('wednesday'), mié: t('wednesday'), mie: t('wednesday'),
          jueves: t('thursday'), jue: t('thursday'),
          viernes: t('friday'), vie: t('friday'),
          sábado: t('saturday'), sabado: t('saturday'), sáb: t('saturday'), sab: t('saturday'),
        };
        const diasLegibles = selectedClass.diasSemana
          .map((d: string | number) => {
            if (typeof d === 'number' && d >= 0 && d <= 6) return dayNames[d];
            if (typeof d === 'string') return dayNameMap[d.toLowerCase()] || d;
            return null;
          })
          .filter(Boolean) as string[];
        return diasLegibles.join(', ') || t('day_not_specified');
      }
    } catch {}
    return t('day_not_specified');
  })();

  const timeLabel = scheduleLabel || '';

  const locationCity = (ubicacion as any)?.ciudad || profile?.ciudad || '';
  const locationDisplay = [locationLabel, locationCity].filter(Boolean).join(locationLabel && locationCity ? ', ' : '');
  const mapsQuery = encodeURIComponent(`${(ubicacion as any)?.nombre ?? ''} ${(ubicacion as any)?.direccion ?? ''} ${(ubicacion as any)?.ciudad ?? ''}`.trim());
  const mapsHref = mapsQuery ? `https://www.google.com/maps/search/?api=1&query=${mapsQuery}` : undefined;

  const dayNotSpecifiedText = t('day_not_specified');
  const showClassInfoDateTime =
    Boolean(String(timeLabel).trim()) ||
    (Boolean(String(dayLabelLong).trim()) && dayLabelLong !== dayNotSpecifiedText);
  const showClassInfoLocation = Boolean(String(locationDisplay).trim()) || Boolean(mapsHref);
  const showClassInfoCost = costLabel != null && String(costLabel).trim() !== '';
  const showClassInfoLevel = Boolean(nivelLabel && String(nivelLabel).trim());

  const handleShare = async () => {
    const title = `${classTitle} | ${creatorName}`;
    const text = t('class_with_creator', { title: classTitle, creator: creatorName });
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        showToast(t('shared_successfully', 'Enlace compartido'), 'success');
      } catch (e) {
        if ((e as Error)?.name !== 'AbortError') showToast(t('share_failed', 'No se pudo compartir'), 'info');
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast(t('link_copied', 'Enlace copiado'), 'success');
    } catch {
      showToast(t('share_failed', 'No se pudo compartir'), 'info');
    }
  };

  function renderHeroMapsCalendar() {
    if (!mapsHref && !selectedClass) return null;
    return (
      <div className="class-actions-row">
        {/* Abrir Maps */}
        {mapsHref && (
          <motion.a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="class-hero__cta class-hero__cta--maps"
            aria-label={t('view_on_maps', 'Abrir en Google Maps')}
            title={t('view_on_maps', 'Abrir en Google Maps')}
          >
            <MapPin size={18} strokeWidth={2.25} aria-hidden />
            <span>Maps</span>
          </motion.a>
        )}

        {/* Add to calendar (existente) */}
        {selectedClass && (
          <motion.div
            className="class-hero__action-slot class-hero__action-slot--calendar class-hero__cta class-hero__cta--calendar"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
          >
            <AddToCalendarWithStats
              eventId={classStableId || idNum}
              classId={classStableId || undefined}
              academyId={!isTeacher ? profile?.id : undefined}
              teacherId={isTeacher ? profile?.id : undefined}
              roleBaile={userProfile?.rol_baile || null}
              zonaTagId={selectedClass?.ubicacionJson?.zona_tag_id || profile?.zonas?.[0] || (userProfile?.zonas?.[0] || null)}
              title={classTitle}
              description={`Clase de ${classTitle} con ${creatorName}`}
              location={locationLabel}
              fecha={classSessionDateYmd}
              diaSemana={(() => {
                if (diaParam !== null) {
                  const diaNum = Number(diaParam);
                  if (!Number.isNaN(diaNum) && diaNum >= 0 && diaNum <= 6) return diaNum;
                }
                return selectedClass?.diaSemana ?? selectedClass?.dia_semana ?? null;
              })()}
              diasSemana={null}
              start={(() => {
                try {
                  const normalizeTime = (timeStr: string | null | undefined, defaultTime: string): string => {
                    if (!timeStr || typeof timeStr !== 'string') return defaultTime;
                    const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})/);
                    if (timeMatch) {
                      const hours = parseInt(timeMatch[1], 10);
                      const minutes = parseInt(timeMatch[2], 10);
                      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                      }
                    }
                    return defaultTime;
                  };
                  if (selectedClass.fecha) {
                    const fechaStr = selectedClass.fecha.includes('T') ? selectedClass.fecha.split('T')[0] : selectedClass.fecha;
                    const hora = normalizeTime(selectedClass.inicio, '20:00');
                    const [year, month, day] = fechaStr.split('-').map(Number);
                    const [hour, minute] = hora.split(':').map(Number);
                    if (!isNaN(year) && !isNaN(month) && !isNaN(day) && !isNaN(hour) && !isNaN(minute)) {
                      return new Date(year, month - 1, day, hour, minute, 0, 0);
                    }
                    return new Date(`${fechaStr}T${hora}:00`);
                  }
                  const diaParaCalcular = (() => {
                    if (diaParam !== null) {
                      const diaNum = Number(diaParam);
                      if (!Number.isNaN(diaNum) && diaNum >= 0 && diaNum <= 6) return diaNum;
                    }
                    if (selectedClass?.diaSemana !== null && selectedClass?.diaSemana !== undefined && typeof selectedClass.diaSemana === 'number') return selectedClass.diaSemana;
                    if (selectedClass?.dia_semana !== null && selectedClass?.dia_semana !== undefined && typeof selectedClass.dia_semana === 'number') return selectedClass.dia_semana;
                    if (selectedClass?.diasSemana && Array.isArray(selectedClass.diasSemana) && selectedClass.diasSemana.length > 0) {
                      const dayMap: Record<string, number> = {
                        domingo: 0, dom: 0,
                        lunes: 1, lun: 1,
                        martes: 2, mar: 2,
                        miércoles: 3, miercoles: 3, mié: 3, mie: 3,
                        jueves: 4, jue: 4,
                        viernes: 5, vie: 5,
                        sábado: 6, sabado: 6, sáb: 6, sab: 6,
                      };
                      const firstDay = selectedClass.diasSemana[0];
                      if (typeof firstDay === 'number') return firstDay;
                      if (typeof firstDay === 'string') return dayMap[firstDay.toLowerCase().trim()] ?? null;
                    }
                    return null;
                  })();
                  if (diaParaCalcular !== null && typeof diaParaCalcular === 'number') {
                    const hora = normalizeTime(selectedClass.inicio, '20:00');
                    return calculateNextDateWithTime(diaParaCalcular, hora);
                  }
                  const now = new Date();
                  const hora = normalizeTime(selectedClass.inicio, '20:00');
                  const [hour, minute] = hora.split(':').map(Number);
                  now.setHours(hour, minute, 0, 0);
                  return now;
                } catch {
                  return new Date();
                }
              })()}
              end={(() => {
                try {
                  const normalizeTime = (timeStr: string | null | undefined, defaultTime: string): string => {
                    if (!timeStr || typeof timeStr !== 'string') return defaultTime;
                    const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})/);
                    if (timeMatch) {
                      const hours = parseInt(timeMatch[1], 10);
                      const minutes = parseInt(timeMatch[2], 10);
                      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                      }
                    }
                    return defaultTime;
                  };
                  if (selectedClass.fecha) {
                    const fechaStr = selectedClass.fecha.includes('T') ? selectedClass.fecha.split('T')[0] : selectedClass.fecha;
                    const hora = normalizeTime(selectedClass.fin || selectedClass.inicio, '22:00');
                    const [year, month, day] = fechaStr.split('-').map(Number);
                    const [hour, minute] = hora.split(':').map(Number);
                    if (!isNaN(year) && !isNaN(month) && !isNaN(day) && !isNaN(hour) && !isNaN(minute)) {
                      return new Date(year, month - 1, day, hour, minute, 0, 0);
                    }
                    return new Date(`${fechaStr}T${hora}:00`);
                  }
                  const diaParaCalcular = (() => {
                    if (diaParam !== null) {
                      const diaNum = Number(diaParam);
                      if (!Number.isNaN(diaNum) && diaNum >= 0 && diaNum <= 6) return diaNum;
                    }
                    if (selectedClass?.diaSemana !== null && selectedClass?.diaSemana !== undefined && typeof selectedClass.diaSemana === 'number') return selectedClass.diaSemana;
                    if (selectedClass?.dia_semana !== null && selectedClass?.dia_semana !== undefined && typeof selectedClass.dia_semana === 'number') return selectedClass.dia_semana;
                    if (selectedClass?.diasSemana && Array.isArray(selectedClass.diasSemana) && selectedClass.diasSemana.length > 0) {
                      const dayMap: Record<string, number> = {
                        domingo: 0, dom: 0,
                        lunes: 1, lun: 1,
                        martes: 2, mar: 2,
                        miércoles: 3, miercoles: 3, mié: 3, mie: 3,
                        jueves: 4, jue: 4,
                        viernes: 5, vie: 5,
                        sábado: 6, sabado: 6, sáb: 6, sab: 6,
                      };
                      const firstDay = selectedClass.diasSemana[0];
                      if (typeof firstDay === 'number') return firstDay;
                      if (typeof firstDay === 'string') return dayMap[firstDay.toLowerCase().trim()] ?? null;
                    }
                    return null;
                  })();
                  if (diaParaCalcular !== null && typeof diaParaCalcular === 'number') {
                    const hora = normalizeTime(selectedClass.fin || selectedClass.inicio, '22:00');
                    const startDate = calculateNextDateWithTime(diaParaCalcular, normalizeTime(selectedClass.inicio, '20:00'));
                    const endDate = new Date(startDate);
                    const [h, m] = hora.split(':').map(Number);
                    endDate.setHours(h || startDate.getHours() + 2, m || 0, 0, 0);
                    if (endDate.getTime() <= startDate.getTime()) endDate.setHours(startDate.getHours() + 2);
                    return endDate;
                  }
                  const end = new Date();
                  end.setHours(end.getHours() + 2);
                  return end;
                } catch {
                  const end = new Date();
                  end.setHours(end.getHours() + 2);
                  return end;
                }
              })()}
              showAsIcon={false}
              calendarGlyph="lucide-calendar-days"
            />
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <>
      <SeoHead
        section="class"
        title={`${classTitle} | ${creatorName}`}
        description={seoDescription}
        image={seoImage}
        url={classUrl}
        keywords={[
          classTitle,
          creatorName,
          locationName,
          ritmosLabel,
          'clases de baile',
          t('where_dance'),
        ].filter(Boolean) as string[]}
      />
      <div className="date-public-root" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #2a1a2a)', padding: '24px 0', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 'max(1rem, env(safe-area-inset-top))',
          left: 'max(1rem, env(safe-area-inset-left))',
          zIndex: 100,
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          aria-label={fromParam === '/me/compras' ? t('back_to_purchases') : fromParam === '/me/rsvps' ? t('back_to_rsvps') : t('back', 'Volver')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '0.65rem 0.9rem',
            minHeight: 44,
            minWidth: 44,
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 12,
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowLeft size={20} strokeWidth={2.25} aria-hidden />
          {(fromParam === '/me/compras' || fromParam === '/me/rsvps') ? (
            <span>{fromParam === '/me/compras' ? t('back_to_purchases') : t('back_to_rsvps')}</span>
          ) : null}
        </button>
      </div>
      <style>{`
        .date-public-root { padding: 24px 0; }
        .date-public-inner { max-width: 1400px; margin: 0 auto; padding: 0 24px; }
        
        /* Hero Banner */
        .class-hero-banner {
          position: relative;
          overflow: hidden;
          min-height: 100vh;
          background: linear-gradient(135deg, 
            rgba(11,13,16,.98) 0%, 
            rgba(18,22,27,.95) 50%, 
            rgba(30,20,40,.96) 100%);
          padding: 3rem 2.5rem;
          border-radius: 32px;
          margin-bottom: 2rem;
          border: 2px solid rgba(240,147,251,.15);
          box-shadow: 
            0 20px 60px rgba(0,0,0,.6),
            0 0 0 1px rgba(240,147,251,.1) inset,
            0 4px 20px rgba(240,147,251,.15);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .class-hero-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #f093fb, #f5576c, #FFD166, #1E88E5);
          opacity: 0.9;
        }
        
        .class-hero-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
          align-items: stretch;
          justify-content: center;
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          padding: 2rem 0;
        }
        
        .class-hero-content > div:first-child {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 1rem;
        }
        
        .class-hero-content > div:last-child {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          gap: 1rem;
        }
        
        @media (max-width: 768px) {
          .class-hero-content > div:first-child {
            gap: 0.875rem !important;
          }
          .class-hero-content > div:last-child {
            gap: 0.875rem !important;
            margin-top: 0.5rem !important;
          }
        }
        
        .class-title {
          font-size: clamp(3rem, 6vw, 5rem);
          font-weight: 900;
          margin-bottom: 1.25rem;
          letter-spacing: -0.04em;
          line-height: 1.05;
          color: #fff;
          font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        @media (max-width: 1024px) {
          .class-hero-content {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .class-hero-banner {
            min-height: auto !important;
          }
        }
        
        @media (max-width: 768px) {
          .date-public-root { 
            padding: 12px 0 !important; 
          }
          .date-public-inner { 
            padding: 0 12px !important; 
          }
          .class-hero-banner { 
            padding: 1.5rem 1rem !important;
            min-height: auto !important;
            border-radius: 20px !important;
            margin-bottom: 1.5rem !important;
          }
          .class-hero-content { 
            gap: 1.25rem !important;
            padding: 1rem 0 !important;
          }
          .class-title {
            font-size: 2.2rem !important;
            margin-bottom: 1rem !important;
          }
          .chip {
            padding: 0.5rem 0.8rem !important;
            font-size: 0.85rem !important;
          }
          .class-back-button {
            padding: 0.6rem 1rem !important;
            font-size: 0.85rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .date-public-root { 
            padding: 8px 0 !important; 
          }
          .date-public-inner { 
            padding: 0 8px !important; 
          }
          .class-hero-banner { 
            padding: 1.25rem 0.75rem !important;
            min-height: auto !important;
            border-radius: 16px !important;
            margin-bottom: 1rem !important;
          }
          .class-hero-content { 
            gap: 1rem !important;
            padding: 0.75rem 0 !important;
          }
          .class-title { 
            font-size: 1.9rem !important;
            margin-bottom: 0.875rem !important;
          }
          .chip {
            padding: 0.45rem 0.7rem !important;
            font-size: 0.8rem !important;
          }
        }
        
        @media (max-width: 430px) {
          .date-public-root { 
            padding: 4px 0 !important; 
          }
          .date-public-inner { 
            padding: 0 2px !important; 
          }
          .class-hero-banner { 
            padding: 0.875rem 0.5rem !important;
            border-radius: 12px !important;
            margin-bottom: 0.75rem !important;
            min-height: auto !important;
            border-width: 1px !important;
            box-shadow: 0 8px 24px rgba(0,0,0,.4) !important;
          }
          .class-hero-content { 
            gap: 0.875rem !important;
            padding: 0.5rem 0 !important;
          }
          .class-hero-content > div:first-child {
            gap: 0.625rem !important;
          }
          .class-title { 
            font-size: 1.5rem !important; 
            margin-bottom: 0.625rem !important;
            line-height: 1.3 !important;
            letter-spacing: -0.02em !important;
          }
          .chip {
            padding: 0.35rem 0.6rem !important;
            font-size: 0.7rem !important;
            border-radius: 8px !important;
            gap: 0.3rem !important;
            border-width: 1px !important;
            font-weight: 600 !important;
          }
          .glass-card-container {
            padding: 0.875rem !important;
            border-radius: 12px !important;
            margin-bottom: 0.75rem !important;
          }
          .card {
            padding: 0.65rem !important;
            border-radius: 10px !important;
          }
          .btn {
            padding: 0.5rem 0.85rem !important;
            font-size: 0.75rem !important;
            gap: 0.4rem !important;
            border-radius: 18px !important;
            font-weight: 700 !important;
          }
          .loc-item {
            padding: 0.65rem !important;
            border-radius: 12px !important;
            gap: 0.5rem !important;
          }
          .loc-item-icon {
            width: 32px !important;
            height: 32px !important;
            font-size: 1rem !important;
            border-radius: 8px !important;
          }
          .loc-item-content strong {
            font-size: 0.8rem !important;
          }
          .loc-item-content span {
            font-size: 0.75rem !important;
            line-height: 1.3 !important;
          }
          .loc-grid {
            gap: 0.6rem !important;
            margin-bottom: 0.75rem !important;
            grid-template-columns: 1fr !important;
          }
          .divider {
            margin: 0.4rem 0 !important;
          }
          .actions {
            gap: 0.5rem !important;
            flex-direction: column !important;
          }
          .actions .btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .ur-col {
            gap: 0.6rem !important;
          }
          /* Botón Volver optimizado para móvil */
          .class-back-button-container {
            margin-bottom: 0.625rem !important;
          }
          .class-back-button {
            padding: 0.45rem 0.85rem !important;
            font-size: 0.75rem !important;
            border-radius: 14px !important;
            border-width: 1.5px !important;
          }
          /* Botones de acción en columna en móvil */
          .class-action-buttons {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.5rem !important;
            margin-bottom: 0.625rem !important;
          }
          .class-action-buttons a,
          .class-action-buttons > div {
            width: 100% !important;
          }
          .btn-maps-inline {
            justify-content: center !important;
            padding: 0.5rem 0.85rem !important;
            font-size: 0.75rem !important;
            border-radius: 18px !important;
            border-width: 1px !important;
          }
          .class-action-buttons > div {
            width: 100% !important;
          }
          .class-action-buttons > div > div {
            width: 100% !important;
          }
          /* Chips en mejor distribución */
          .class-chips-container {
            gap: 0.5rem !important;
            margin-bottom: 0.875rem !important;
            flex-wrap: wrap !important;
          }
          /* Columna 2 (creador) optimizada */
          .class-creator-section {
            gap: 0.625rem !important;
            margin-top: 0.5rem !important;
            width: 100% !important;
          }
          .class-creator-info {
            padding: 0.625rem 0.75rem !important;
            border-radius: 12px !important;
            max-width: 100% !important;
          }
          .class-creator-info a {
            font-size: 0.85rem !important;
            line-height: 1.4 !important;
          }
          .class-creator-section > div:last-child {
            width: 100% !important;
            max-width: 100% !important;
          }
          /* Optimizar efectos decorativos en móvil */
          .class-hero-banner > div:first-child {
            opacity: 0.5 !important;
          }
          /* Asegurar que el contenido no se desborde */
          .class-hero-content {
            overflow: visible !important;
          }
          .class-hero-content > div:first-child,
          .class-hero-content > div:last-child {
            min-width: 0 !important;
            max-width: 100% !important;
          }
        }
        
        @media (max-width: 360px) {
          .class-title {
            font-size: 1.35rem !important;
          }
          .chip {
            padding: 0.3rem 0.5rem !important;
            font-size: 0.65rem !important;
          }
          .class-back-button {
            padding: 0.4rem 0.75rem !important;
            font-size: 0.7rem !important;
          }
          .btn-maps-inline {
            padding: 0.45rem 0.75rem !important;
            font-size: 0.7rem !important;
          }
        }
        
        .chip {
          display:inline-flex;
          align-items:center;
          gap:.45rem;
          padding:.55rem .95rem;
          border-radius:12px;
          font-weight:700;
          font-size:.92rem;
          background:rgba(255,255,255,0.05);
          border:1.5px solid rgba(255,255,255,0.12);
          color:#f4f4f5;
          box-shadow:0 6px 18px rgba(0,0,0,0.18);
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .chip-date { 
          background:linear-gradient(135deg, rgba(240,147,251,.18), rgba(152,71,255,0.16));
          border-color:rgba(240,147,251,.38);
          color:#f5d6ff;
        }
        .chip-time {
          background:linear-gradient(135deg, rgba(255,209,102,.18), rgba(255,159,67,0.14));
          border-color:rgba(255,209,102,.38);
          color:#FFE6A8;
        }
        .chip-cost {
          background:linear-gradient(135deg, rgba(30,136,229,0.14), rgba(0,188,212,0.1));
          border-color:rgba(30,136,229,0.32);
          color:#d4f0ff;
        }
        .chip-location {
          background:linear-gradient(135deg, rgba(30,136,229,0.14), rgba(0,188,212,0.1));
          border-color:rgba(30,136,229,0.32);
          color:#d4f0ff;
        }
        .chip-level {
          background:linear-gradient(135deg, rgba(30,136,229,0.18), rgba(240,147,251,0.16));
          border-color:rgba(30,136,229,0.35);
          color:#e5edff;
        }
        .glass-card-container {
          margin-bottom: 2rem; padding: 2rem;
          background: linear-gradient(135deg, rgba(255,255,255,.09), rgba(255,255,255,.03));
          border-radius: 22px; border: 1px solid rgba(255,255,255,.15);
          box-shadow: 0 10px 32px rgba(0,0,0,.4); backdrop-filter: blur(10px);
        }
        .ur-col { display:grid; grid-template-columns: 1fr; gap: 1rem; }
        .card{border-radius:14px;padding:1rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10)}
        .loc{border-color:rgba(240,147,251,0.22);background:linear-gradient(135deg,rgba(240,147,251,.08),rgba(240,147,251,.04))}
        .loc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:1.25rem}
        .loc-item{display:flex;align-items:flex-start;gap:.75rem;padding:1rem;border-radius:18px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);box-shadow:0 10px 24px rgba(0,0,0,0.18)}
        .loc-item-icon{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;font-size:1.35rem;background:linear-gradient(135deg,rgba(240,147,251,0.22),rgba(240,147,251,0.08));border:1px solid rgba(240,147,251,0.32);color:#f5d6ff}
        .loc-item-content{display:flex;flex-direction:column;gap:.25rem}
        .loc-item-content strong{font-size:.95rem;color:#fff;letter-spacing:.01em;font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif}
        .loc-item-content span{font-size:.9rem;color:rgba(255,255,255,.78);line-height:1.45;font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif}
        .muted{color:rgba(255,255,255,.72)}
        .divider{height:1px;background:rgba(255,255,255,.12);margin:.75rem 0}
        .actions{display:flex;gap:.75rem;flex-wrap:wrap}
        .btn{display:inline-flex;align-items:center;gap:.55rem;padding:.6rem .95rem;border-radius:999px;font-weight:800;letter-spacing:.01em;font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif}
        .btn-maps{border:1px solid rgba(240,147,251,.4);color:#f7d9ff; background:radial-gradient(120% 120% at 0% 0%,rgba(240,147,251,.18),rgba(240,147,251,.08)); box-shadow:0 6px 18px rgba(240,147,251,.20) }
        .btn-copy{border:1px solid rgba(255,255,255,.18);color:#fff;background:rgba(255,255,255,.06)}

        /* =====================================================
           ClassPublicScreen UI (hero + info grid per design)
           ===================================================== */
        .class-hero {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.07);
          background:
            radial-gradient(120% 80% at 50% -20%, rgba(122,108,255,0.14), transparent 52%),
            linear-gradient(165deg, #151c28 0%, #10151f 48%, #0c1018 100%);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.06) inset,
            0 24px 48px rgba(0,0,0,0.45),
            0 0 0 1px rgba(0,0,0,0.35);
          min-height: clamp(260px, 42vw, 340px);
          margin-bottom: 20px;
          --hero-avatar: clamp(96px, 26vw, 132px);
          display: flex;
          justify-content: center;
          align-items: stretch;
        }
        .class-hero__bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          filter: saturate(0.88) contrast(1.04);
          opacity: 0.12;
          transform: scale(1.03);
        }
        .class-hero__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(12,16,24,0.35) 0%, rgba(10,12,18,0.82) 100%);
          backdrop-filter: blur(14px);
        }
        .class-hero__accent {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 3px;
          background: linear-gradient(90deg, rgba(91,108,255,0.9) 0%, rgba(177,92,255,0.85) 100%);
          opacity: 0.85;
        }
        .class-hero__ambient {
          pointer-events: none;
          position: absolute;
          z-index: 0;
          inset: -40% -20% auto -20%;
          height: 70%;
          background: radial-gradient(ellipse at 50% 0%, rgba(122,108,255,0.16), transparent 62%);
          opacity: 0.9;
        }
        .class-hero__inner {
          position: relative;
          z-index: 1;
          width: 100%;
          min-height: 100%;
          padding: 20px 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-sizing: border-box;
        }
        .class-hero__topbar {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 40px;
        }
        .class-hero__eyebrow {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.38);
          font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .class-hero__quick-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .class-hero__icon-btn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.88);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition:
            background 0.2s cubic-bezier(0.4, 0, 0.2, 1),
            border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
            color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.15s ease;
          box-shadow: 0 8px 20px rgba(0,0,0,0.22);
        }
        .class-hero__icon-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.16);
          box-shadow: 0 10px 26px rgba(0,0,0,0.28);
        }
        .class-hero__icon-btn:active {
          transform: scale(0.96);
        }
        .class-hero__icon-btn:focus-visible {
          outline: 2px solid rgba(122,108,255,0.65);
          outline-offset: 2px;
        }
        .class-hero__icon-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .class-hero__icon-btn--active {
          color: #ff4d8d;
          border-color: rgba(255,77,141,0.35);
          background: rgba(255,77,141,0.08);
        }
        .class-hero__layout {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 16px 20px;
          align-items: start;
        }
        .class-hero__copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .class-hero__title {
          margin: 0;
          color: rgba(255,255,255,0.98);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.12;
          font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: clamp(1.35rem, 4.5vw, 1.85rem);
          max-width: 22ch;
          text-wrap: balance;
        }
        .class-hero__badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .class-hero__badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 11px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.88);
        }
        .class-hero__badge--ritmo {
          border-color: rgba(177,92,255,0.28);
          background: linear-gradient(135deg, rgba(177,92,255,0.12), rgba(0,0,0,0.08));
          color: rgba(245,240,255,0.95);
        }
        .class-hero__badge--nivel {
          border-color: rgba(41,127,150,0.35);
          background: linear-gradient(135deg, rgba(41,127,150,0.14), rgba(0,0,0,0.06));
          color: rgba(220,245,250,0.95);
        }
        .class-hero__organizer {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.45;
          font-weight: 500;
          color: rgba(255,255,255,0.45);
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .class-hero__organizer-prefix {
          margin-right: 6px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .class-hero__organizer-name {
          color: rgba(255,255,255,0.92);
          font-weight: 700;
          text-decoration: none;
          border-bottom: 1px solid rgba(255,255,255,0.14);
          transition: color 0.2s ease, border-color 0.2s ease;
        }
        .class-hero__organizer-name:hover {
          color: #fff;
          border-bottom-color: rgba(122,108,255,0.55);
        }
        .class-hero__visual {
          flex-shrink: 0;
        }
        .class-hero__avatar-frame {
          position: relative;
          width: var(--hero-avatar);
          height: var(--hero-avatar);
        }
        .class-hero__avatar-glow {
          position: absolute;
          inset: -8px;
          border-radius: 28px;
          background: radial-gradient(circle at 30% 25%, rgba(122,108,255,0.35), transparent 58%);
          opacity: 0.55;
          filter: blur(8px);
        }
        .class-hero__avatar {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          box-shadow:
            0 12px 32px rgba(0,0,0,0.4),
            0 0 0 1px rgba(0,0,0,0.35) inset;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.22s ease, transform 0.18s ease;
        }
        .class-hero__avatar:hover {
          border-color: rgba(255,255,255,0.2);
          box-shadow:
            0 14px 36px rgba(0,0,0,0.45),
            0 0 0 1px rgba(0,0,0,0.35) inset;
        }
        .class-hero__avatar:focus-visible {
          outline: 2px solid rgba(122,108,255,0.55);
          outline-offset: 2px;
        }
        .class-hero__avatar:active {
          transform: scale(0.985);
        }
        .class-hero__avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .class-hero__primary-actions {
          position: relative;
          z-index: 1;
          margin-top: 2px;
        }
        .class-hero .class-actions-row {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: stretch;
          gap: 10px;
          width: 100%;
        }
        .class-hero .class-actions-row > a.class-hero__cta--maps {
          flex: 1 1 0;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .class-hero .class-actions-row > .class-hero__action-slot {
          flex: 1 1 0;
          min-width: 0;
          display: flex;
          align-items: stretch;
          justify-content: center;
        }
        .class-hero__cta {
          border-radius: 16px;
          font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-weight: 700;
          font-size: 0.8125rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition:
            background 0.22s cubic-bezier(0.4, 0, 0.2, 1),
            border-color 0.22s ease,
            box-shadow 0.22s ease,
            color 0.2s ease,
            transform 0.18s ease;
        }
        a.class-hero__cta--maps {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 50px;
          padding: 0 14px;
          box-sizing: border-box;
          text-decoration: none;
          cursor: pointer;
          color: rgba(255,255,255,0.88);
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          box-shadow: 0 10px 28px rgba(0,0,0,0.25);
        }
        a.class-hero__cta--maps:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.18);
          box-shadow: 0 14px 34px rgba(0,0,0,0.32);
        }
        a.class-hero__cta--maps:active {
          transform: scale(0.98);
        }
        a.class-hero__cta--maps:focus-visible {
          outline: 2px solid rgba(122,108,255,0.55);
          outline-offset: 2px;
        }
        .class-hero .class-actions-row > .class-hero__action-slot--calendar > div {
          width: 100% !important;
          display: flex !important;
          justify-content: stretch !important;
          align-items: stretch !important;
          min-height: 50px;
        }
        .class-hero .class-actions-row > .class-hero__action-slot--calendar button {
          width: 100%;
          min-height: 50px !important;
          box-sizing: border-box;
          border-radius: 16px !important;
          font-weight: 800 !important;
          letter-spacing: 0.03em !important;
          text-transform: uppercase !important;
          font-size: 0.75rem !important;
          border: 1px solid rgba(122,108,255,0.45) !important;
          background: linear-gradient(145deg, rgba(122,108,255,0.22), rgba(33,212,253,0.08)) !important;
          box-shadow: 0 12px 32px rgba(122,108,255,0.18) !important;
          transition: transform 0.18s ease, box-shadow 0.22s ease !important;
        }
        .class-hero .class-actions-row > .class-hero__action-slot--calendar button:hover {
          box-shadow: 0 16px 36px rgba(122,108,255,0.28) !important;
        }
        @media (max-width: 560px) {
          .class-hero__inner {
            padding: 18px 16px 20px;
            gap: 18px;
          }
          .class-hero__layout {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .class-hero__visual {
            justify-self: center;
            order: -1;
          }
          .class-hero__title {
            max-width: none;
            text-align: center;
          }
          .class-hero__badges {
            justify-content: center;
          }
          .class-hero__organizer {
            text-align: center;
          }
          .class-hero__topbar {
            flex-wrap: wrap;
          }
          .class-hero__eyebrow {
            width: 100%;
            text-align: center;
          }
          .class-hero__quick-actions {
            width: 100%;
            justify-content: center;
          }
        }
        .class-chips-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .class-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.10);
          background: linear-gradient(135deg, rgba(122,108,255,0.14), rgba(0,0,0,0.16));
          color: rgba(255,255,255,0.92);
          font-size: 0.9rem;
          font-weight: 800;
          box-shadow: 0 14px 34px rgba(0,0,0,0.22);
          backdrop-filter: blur(14px);
          max-width: 100%;
          min-width: 0;
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          transition: transform .15s ease, border-color .15s ease, background .15s ease;
        }
        .class-chip:hover {
          transform: translateY(-1px);
          border-color: rgba(122,108,255,0.30);
          background: linear-gradient(135deg, rgba(122,108,255,0.20), rgba(0,0,0,0.16));
        }
        .class-chip span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .class-chip--ritmo { border-color: rgba(177,92,255,0.26); background: linear-gradient(135deg, rgba(177,92,255,0.18), rgba(0,0,0,0.16)); }
        .class-chip--nivel { border-color: rgba(30,136,229,0.26); background: linear-gradient(135deg, rgba(30,136,229,0.16), rgba(0,0,0,0.16)); }
        .class-chip--date { border-color: rgba(122,108,255,0.22); }
        .class-chip--time { border-color: rgba(255,209,102,0.26); background: linear-gradient(135deg, rgba(255,209,102,0.16), rgba(0,0,0,0.16)); }
        .class-chip--location { border-color: rgba(0,188,212,0.24); background: linear-gradient(135deg, rgba(0,188,212,0.14), rgba(0,0,0,0.16)); }
        .class-chip--cost { border-color: rgba(34,197,94,0.24); background: linear-gradient(135deg, rgba(34,197,94,0.14), rgba(0,0,0,0.16)); }
        .class-info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          margin-top: 14px;
          margin-bottom: 16px;
        }
        @media (min-width: 768px) {
          .class-info-grid { grid-template-columns: 1fr 1fr; }
        }
        .class-info-card {
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(14, 16, 20, 0.78);
          box-shadow: 0 18px 46px rgba(0,0,0,0.45);
          backdrop-filter: blur(12px);
          padding: 16px 16px;
          display: grid;
          grid-template-columns: 44px 1fr auto;
          gap: 12px;
          align-items: start;
          min-width: 0;
        }
        .class-info-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #297F96;
          border: 1px solid rgba(41, 127, 150, 0.4);
          color: #fff;
          box-shadow: 0 12px 26px rgba(0,0,0,0.22);
        }
        .class-info-meta {
          min-width: 0;
        }
        .class-info-label {
          margin: 0 0 6px 0;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .class-info-value {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 900;
          color: rgba(255,255,255,0.95);
          line-height: 1.25;
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          word-break: break-word;
        }
        .class-info-sub {
          margin: 6px 0 0 0;
          font-size: 0.92rem;
          font-weight: 700;
          color: rgba(255,255,255,0.70);
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .class-info-action {
          min-width: 44px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid rgba(122,108,255,0.22);
          background: rgba(122,108,255,0.10);
          color: rgba(122,108,255,0.98);
          text-decoration: none;
          cursor: pointer;
        }
        .class-section {
          margin-top: 16px;
        }
        .class-actions-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
        }

        /* Ocultar media del card (solo esta pantalla) */
        .date-public-root .explore-card-media {
          display: none !important;
        }
      `}</style>
      <div className="date-public-inner">
        {/* Hero (oscuro, compacto) */}
        <motion.section
          className="class-hero"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          aria-label={t('class', 'Clase')}
        >
          {heroBgUri && <div className="class-hero__bg" style={{ backgroundImage: `url(${heroBgUri})` }} />}
          <div className="class-hero__overlay" />
          <div className="class-hero__accent" aria-hidden />

          <div className="class-hero__inner">
            <div className="class-hero__ambient" aria-hidden />
            <header className="class-hero__topbar">
              <span className="class-hero__eyebrow">{creatorTypeLabel}</span>
              <div className="class-hero__quick-actions">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  onClick={handleShare}
                  className="class-hero__icon-btn"
                  aria-label={t('share', 'Compartir')}
                  title={t('share', 'Compartir')}
                >
                  <Share2 size={18} strokeWidth={2.25} aria-hidden />
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                  onClick={onToggleFavorite}
                  disabled={user ? togglingClass : false}
                  className={`class-hero__icon-btn${classFavoriteActive ? ' class-hero__icon-btn--active' : ''}`}
                  aria-label={classFavoriteActive ? t('remove_favorite', 'Quitar favorito') : t('add_favorite', 'Agregar favorito')}
                  title={classFavoriteActive ? t('remove_favorite', 'Quitar favorito') : t('add_favorite', 'Agregar favorito')}
                  style={{
                    opacity: user && togglingClass ? 0.6 : 1,
                    cursor: user && togglingClass ? 'not-allowed' : 'pointer',
                  }}
                >
                  {classFavoriteActive ? <Heart size={18} fill="currentColor" strokeWidth={2.25} aria-hidden /> : <Heart size={18} strokeWidth={2.25} aria-hidden />}
                </motion.button>
              </div>
            </header>

            <div className="class-hero__layout">
              <div className="class-hero__copy">
                <h1 className="class-hero__title">{classTitle}</h1>
                {(ritmoPrincipalLabel || nivelLabel) && (
                  <div className="class-hero__badges" role="list" aria-label={t('class_details', 'Detalle de la clase')}>
                    {ritmoPrincipalLabel ? (
                      <span className="class-hero__badge class-hero__badge--ritmo" role="listitem">
                        <Music2 size={13} strokeWidth={2.5} aria-hidden />
                        {ritmoPrincipalLabel}
                      </span>
                    ) : null}
                    {nivelLabel ? (
                      <span className="class-hero__badge class-hero__badge--nivel" role="listitem">
                        {nivelLabel}
                      </span>
                    ) : null}
                  </div>
                )}
                <p className="class-hero__organizer">
                  <span className="class-hero__organizer-prefix">{t('by', 'por')}</span>
                  <Link className="class-hero__organizer-name" to={creatorLink}>
                    {creatorName}
                  </Link>
                </p>
              </div>
              <div className="class-hero__visual">
                <div className="class-hero__avatar-frame">
                  <div className="class-hero__avatar-glow" aria-hidden />
                  <Link
                    to={creatorLink}
                    className="class-hero__avatar"
                    aria-label={
                      creatorName
                        ? `${t('view_profile', 'Ver perfil')}: ${creatorName}`
                        : t('view_profile', 'Ver perfil')
                    }
                  >
                    <img
                      src={heroAvatarError ? SEO_LOGO_URL : avatarUri}
                      alt=""
                      onError={() => setHeroAvatarError((prev) => (prev ? prev : true))}
                    />
                  </Link>
                </div>
              </div>
            </div>

            <div
              className="class-hero__primary-actions"
              role="group"
              aria-label={t('class_actions', 'Acciones de la clase')}
            >
              {renderHeroMapsCalendar()}
            </div>
          </div>
        </motion.section>

        {!user && (
          <div
            role="note"
            style={{
              margin: '0 0 1.25rem',
              padding: '14px 16px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(240,147,251,.08), rgba(41,127,150,.08))',
              border: '1px solid rgba(255,255,255,.12)',
              fontSize: '0.9rem',
              lineHeight: 1.45,
              color: 'rgba(255,255,255,.85)',
              textAlign: 'center',
            }}
          >
            <Link
              to="/auth/login"
              state={{ from: `${location.pathname}${location.search || ''}` }}
              style={{
                color: '#f093fb',
                fontWeight: 700,
                textDecoration: 'none',
                borderBottom: '1px solid rgba(240,147,251,.45)',
              }}
            >
              {t('login', 'Iniciar sesión')}
            </Link>
            <span style={{ opacity: 0.92 }}>{' '}{t('guest_sync_favorites_only', 'para guardar tus favoritos en tu cuenta.')}</span>
          </div>
        )}

        {/* Grid de cards (info): solo las que tienen dato */}
        {(showClassInfoDateTime ||
          showClassInfoLocation ||
          showClassInfoCost ||
          showClassInfoLevel) && (
        <section className="class-info-grid" aria-label={t('info', 'Información')}>
          {showClassInfoDateTime && (
          <div className="class-info-card">
            <div className="class-info-icon" aria-hidden><CalendarDays size={20} /></div>
            <div className="class-info-meta">
              <p className="class-info-label">{t('date_and_time', 'Fecha y hora')}</p>
              <p className="class-info-value">{dayLabelLong}</p>
              {timeLabel ? <p className="class-info-sub">{timeLabel}</p> : null}
            </div>
            <span />
          </div>
          )}

          {showClassInfoLocation && (
          <div className="class-info-card">
            <div className="class-info-icon" aria-hidden><MapPin size={20} /></div>
            <div className="class-info-meta">
              <p className="class-info-label">{t('location', 'Ubicación')}</p>
              <p className="class-info-value">
                {locationDisplay.trim()
                  ? locationDisplay
                  : mapsHref
                    ? t('view_on_maps', 'Abrir en mapa')
                    : ''}
              </p>
            </div>
            {mapsHref ? (
              <a
                className="class-info-action"
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('view_on_maps', 'Abrir en Google Maps')}
                title={t('view_on_maps', 'Abrir en Google Maps')}
              >
                <ExternalLink size={18} aria-hidden />
              </a>
            ) : (
              <span />
            )}
          </div>
          )}

          {showClassInfoCost && (
          <div className="class-info-card">
            <div className="class-info-icon" aria-hidden><DollarSign size={20} /></div>
            <div className="class-info-meta">
              <p className="class-info-label">{t('costs', 'Costo')}</p>
              <p className="class-info-value">{costLabel}</p>
            </div>
            <span />
          </div>
          )}

          {showClassInfoLevel && (
          <div className="class-info-card">
            <div className="class-info-icon" aria-hidden><Activity size={20} /></div>
            <div className="class-info-meta">
              <p className="class-info-label">{t('level', 'Nivel')}</p>
              <p className="class-info-value">{nivelLabel}</p>
            </div>
            <span />
          </div>
          )}
        </section>
        )}

        {/* Descripción (si existe) */}
        {selectedClass?.descripcion && (
          <section className="class-section" aria-label={t('description', 'Descripción')}>
            <div
              className="class-info-card"
              style={{ gridTemplateColumns: '44px 1fr', alignItems: 'start' }}
            >
              <div className="class-info-icon" aria-hidden>📝</div>
              <div className="class-info-meta">
                <p className="class-info-label">{t('description', 'Descripción')}</p>
                <p className="class-info-value" style={{ fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,0.88)' }}>
                  {String(selectedClass.descripcion)}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Acciones existentes (reubicadas, misma lógica) */}
        <section className="class-section" aria-label={t('actions', 'Acciones')}>
          <div className="class-actions-row">
            {/* WhatsApp (existente) */}
            {user && whatsappNumber && (
              <motion.a
                href={buildClassWhatsAppUrl(whatsappNumber, whatsappMessageTemplate, classTitle, t('hello_from_db')) || '#'}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '.55rem',
                  padding: '.6rem 1.1rem',
                  borderRadius: 999,
                  border: '1px solid rgba(37, 211, 102, 0.5)',
                  color: '#fff',
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  boxShadow: '0 6px 18px rgba(37, 211, 102, 0.3)',
                  fontWeight: 800,
                  fontSize: '.9rem',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                }}
              >
                <FaWhatsapp size={18} />
                <span>{t('consult_whatsapp')}</span>
              </motion.a>
            )}

            {/* Pago Stripe (existente) */}
            {typeof classPrice === 'number' && classPrice > 0 && !!profile?.stripe_account_id && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePayClick}
                disabled={createCheckout.isPending}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '.55rem',
                  padding: '.6rem 1.1rem',
                  borderRadius: 999,
                  border: '1px solid rgba(34, 197, 94, 0.5)',
                  color: '#fff',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  boxShadow: '0 6px 18px rgba(34, 197, 94, 0.3)',
                  fontWeight: 800,
                  fontSize: '.9rem',
                  cursor: createCheckout.isPending ? 'not-allowed' : 'pointer',
                  opacity: createCheckout.isPending ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                }}
              >
                <span>💳</span>
                <span>
                  {createCheckout.isPending
                    ? t('processing')
                    : `${t('pay')} ${new Intl.NumberFormat(locale, { style: 'currency', currency: 'MXN' }).format(
                        classPrice,
                      )}`}
                </span>
              </motion.button>
            )}
          </div>
        </section>

        {/* Card del creador (sin bloque extra) */}
        <section className="class-section" aria-label={t('profile', 'Perfil')}>
          <div style={{ width: '100%' }}>
            {isTeacher ? <TeacherCard item={profile} /> : <AcademyCard item={profile} />}
          </div>
        </section>

        {/* Clases, horarios, costos y agregar a calendario - COMENTADO */}
        {/* <motion.section 
          initial={{ opacity: 0, y: 16 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.25 }} 
          className="glass-card-container"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              display: 'grid', placeItems: 'center',
              background: 'linear-gradient(135deg, #1E88E5, #00BCD4)',
              boxShadow: '0 10px 28px rgba(30,136,229,.4)',
              fontSize: '1.25rem',
              border: '2px solid rgba(30,136,229,.3)'
            }}>📚</div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>Detalles de la Clase</h3>
          </div>
          
          <ClasesLive 
            title="" 
            cronograma={cronogramaSelected} 
            costos={costos} 
            ubicacion={ubicacion as any} 
            showCalendarButton={true}
            sourceType={sourceType}
            sourceId={idNum}
            isClickable={false}
          />
        </motion.section> */}
      </div>
      </div>
    </>
  );
}


