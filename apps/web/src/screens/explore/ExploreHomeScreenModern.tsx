import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useExploreFilters } from "../../state/exploreFilters";
import { useExploreQuery } from "../../hooks/useExploreQuery";
import EventCard from "../../components/explore/cards/EventCard";
import OrganizerCard from "../../components/explore/cards/OrganizerCard";
import TeacherCard from "../../components/explore/cards/TeacherCard";
import AcademyCard from "../../components/explore/cards/AcademyCard";
import HorizontalSlider from "../../components/explore/HorizontalSlider";
import FilterBar from "../../components/FilterBar";
import BrandCard from "../../components/explore/cards/BrandCard";
import ClassCard from "../../components/explore/cards/ClassCard";
import SocialCard from "../../components/explore/cards/SocialCard";
import DancerCard from "../../components/explore/cards/DancerCard";
import { urls } from "../../lib/urls";
import { colors, typography, spacing, borderRadius, transitions } from "../../theme/colors";
import { useUserFilterPreferences } from "../../hooks/useUserFilterPreferences";
import { useAuth } from "@/contexts/AuthProvider";
import { useTags } from "@/hooks/useTags";
import SeoHead from "@/components/SeoHead";

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/**
 * Obtiene la fecha de hoy en zona horaria de CDMX (America/Mexico_City)
 * Retorna en formato YYYY-MM-DD
 */
function getTodayCDMX(): string {
  // Usar Intl.DateTimeFormat para obtener la fecha en zona horaria de CDMX
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // Formato retorna YYYY-MM-DD
  return formatter.format(new Date());
}

function Section({ title, toAll, children }: { title: string; toAll: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="section-container"
      style={{
        marginBottom: '4rem',
        position: 'relative'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        padding: '0 0.5rem',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          position: 'relative'
        }}>
          {/* Icono circular destacado */}
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2))',
            border: '2px solid rgba(240, 147, 251, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            boxShadow: '0 4px 16px rgba(240, 147, 251, 0.25)',
            backdropFilter: 'blur(10px)'
          }}>
            {title.includes('Sociales') ? '📆' :
              title.includes('Clases') ? '🎓' :
                title.includes('Academias') ? '🏫' :
                  title.includes('Organizadores') ? '👤' :
                    title.includes('Maestros') ? '🎓' :
                      title.includes('Marcas') ? '🏷️' : '✨'}
          </div>
          <div>
            <h2 style={{
              fontSize: '1.875rem',
              fontWeight: 800,
              margin: 0,
              marginBottom: '0.25rem',
              background: 'linear-gradient(135deg, #f093fb, #FFD166)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2
            }}>
              {title}
            </h2>
            <div style={{
              width: 60,
              height: 4,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)',
              opacity: 0.8
            }} />
          </div>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

export default function ExploreHomeScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { filters, set } = useExploreFilters();
  const selectedType = filters.type;
  const showAll = !selectedType || selectedType === 'all';
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });
  const [hasAppliedDefaults, setHasAppliedDefaults] = React.useState(false);
  const [usingFavoriteFilters, setUsingFavoriteFilters] = React.useState(false);

  const { data: allTags } = useTags();

  // Obtener preferencias de filtros del usuario
  const { preferences, applyDefaultFilters, loading: prefsLoading } = useUserFilterPreferences();

  const sliderProps = React.useMemo(
    () => ({
      className: isMobile ? 'explore-slider explore-slider--mobile' : 'explore-slider',
      autoColumns: isMobile ? 'minmax(0, calc(100vw - 2rem))' : undefined
    }),
    [isMobile]
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setIsMobile(window.innerWidth < 768);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const computePresetRange = React.useCallback((preset: 'todos' | 'hoy' | 'semana' | 'siguientes') => {
    // Usar fecha de hoy en zona horaria CDMX
    const todayCDMX = getTodayCDMX();
    const todayDate = new Date(todayCDMX + 'T12:00:00'); // Usar mediodía para evitar problemas de zona horaria

    if (preset === 'todos') {
      return { from: undefined, to: undefined };
    }
    if (preset === 'hoy') {
      return { from: todayCDMX, to: todayCDMX };
    }
    if (preset === 'semana') {
      const from = todayCDMX;
      const to = addDays(todayDate, 6).toISOString().slice(0, 10);
      return { from, to };
    }
    if (preset === 'siguientes') {
      const from = addDays(todayDate, 7).toISOString().slice(0, 10);
      return { from, to: undefined };
    }
    return { from: undefined, to: undefined };
  }, []);

  React.useEffect(() => {
    const preset = filters.datePreset || 'todos';
    const { from, to } = computePresetRange(preset);
    if (filters.dateFrom !== from || filters.dateTo !== to) {
      set({ dateFrom: from, dateTo: to });
    }
  }, [filters.datePreset, computePresetRange, set, filters.dateFrom, filters.dateTo]);

  // Aplicar filtros predeterminados si el usuario tiene preferencias y no hay filtros manuales
  React.useEffect(() => {
    if (!user || prefsLoading || hasAppliedDefaults) return;

    // Verificar si los filtros están en su estado inicial (sin filtros manuales)
    const isInitialState =
      filters.ritmos.length === 0 &&
      filters.zonas.length === 0 &&
      (filters.datePreset === 'todos' || !filters.datePreset) &&
      !filters.q;

    if (isInitialState && preferences) {
      const defaultFilters = applyDefaultFilters();

      // Solo aplicar si hay preferencias configuradas
      const hasPreferences =
        (defaultFilters.ritmos.length > 0) ||
        (defaultFilters.zonas.length > 0) ||
        (defaultFilters.fechaDesde !== null || defaultFilters.fechaHasta !== null);

      if (hasPreferences) {
        const updates: any = {};

        if (defaultFilters.ritmos.length > 0) {
          updates.ritmos = defaultFilters.ritmos;
        }
        if (defaultFilters.zonas.length > 0) {
          updates.zonas = defaultFilters.zonas;
        }
        if (defaultFilters.fechaDesde || defaultFilters.fechaHasta) {
          // Convertir fechas a formato YYYY-MM-DD
          if (defaultFilters.fechaDesde) {
            updates.dateFrom = defaultFilters.fechaDesde.toISOString().slice(0, 10);
          }
          if (defaultFilters.fechaHasta) {
            updates.dateTo = defaultFilters.fechaHasta.toISOString().slice(0, 10);
          }
          // Determinar el preset más cercano
          if (preferences.date_range === 'hoy') {
            updates.datePreset = 'hoy';
          } else if (preferences.date_range === 'semana') {
            updates.datePreset = 'semana';
          } else {
            updates.datePreset = undefined; // Custom o mes
          }
        }

        if (Object.keys(updates).length > 0) {
          set(updates);
          setUsingFavoriteFilters(true);
        }
      }

      setHasAppliedDefaults(true);
    }
  }, [user, prefsLoading, preferences, filters, applyDefaultFilters, hasAppliedDefaults, set]);

  // Detectar cuando el usuario cambia los filtros manualmente (ya no son favoritos)
  React.useEffect(() => {
    if (!hasAppliedDefaults) return;

    // Comparar con las preferencias para ver si coinciden
    if (preferences) {
      const defaultFilters = applyDefaultFilters();
      const matchesDefaults =
        JSON.stringify(filters.ritmos.sort()) === JSON.stringify(defaultFilters.ritmos.sort()) &&
        JSON.stringify(filters.zonas.sort()) === JSON.stringify(defaultFilters.zonas.sort());

      // Si no coinciden, ya no está usando favoritos
      if (!matchesDefaults) {
        setUsingFavoriteFilters(false);
      }
    }
  }, [filters.ritmos, filters.zonas, filters.dateFrom, filters.dateTo, preferences, applyDefaultFilters, hasAppliedDefaults]);

  // Función para restablecer a los filtros favoritos
  const resetToFavoriteFilters = React.useCallback(() => {
    if (!preferences) return;
    const defaultFilters = applyDefaultFilters();
    const updates: any = {};

    if (defaultFilters.ritmos.length > 0) {
      updates.ritmos = defaultFilters.ritmos;
    } else {
      updates.ritmos = [];
    }
    if (defaultFilters.zonas.length > 0) {
      updates.zonas = defaultFilters.zonas;
    } else {
      updates.zonas = [];
    }
    if (defaultFilters.fechaDesde || defaultFilters.fechaHasta) {
      if (defaultFilters.fechaDesde) {
        updates.dateFrom = defaultFilters.fechaDesde.toISOString().slice(0, 10);
      }
      if (defaultFilters.fechaHasta) {
        updates.dateTo = defaultFilters.fechaHasta.toISOString().slice(0, 10);
      }
      if (preferences.date_range === 'hoy') {
        updates.datePreset = 'hoy';
      } else if (preferences.date_range === 'semana') {
        updates.datePreset = 'semana';
      } else {
        updates.datePreset = undefined;
      }
    } else {
      updates.datePreset = 'todos';
      updates.dateFrom = undefined;
      updates.dateTo = undefined;
    }

    set(updates);
    setUsingFavoriteFilters(true);
  }, [preferences, applyDefaultFilters, set]);

  // Fecha presets: hoy / semana / siguientes
  const todayYmd = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const applyDatePreset = (preset: 'todos' | 'hoy' | 'semana' | 'siguientes') => {
    const { from, to } = computePresetRange(preset);
    set({ datePreset: preset, dateFrom: from, dateTo: to });
  };

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.q) count += 1;
    count += filters.ritmos.length;
    count += filters.zonas.length;
    if (filters.dateFrom || filters.dateTo) count += 1;
    return count;
  }, [filters.q, filters.ritmos.length, filters.zonas.length, filters.dateFrom, filters.dateTo]);

  const handlePreNavigate = React.useCallback(() => {
    try { if ('scrollRestoration' in window.history) { (window.history as any).scrollRestoration = 'manual'; } } catch { }
    try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch { }
  }, []);

  const { data: fechas, isLoading: fechasLoading } = useExploreQuery({
    type: 'fechas',
    q: filters.q,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    pageSize: 6
  });


  const { data: organizadores, isLoading: organizadoresLoading } = useExploreQuery({
    type: 'organizadores',
    q: filters.q,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: 4
  });

  const { data: maestros, isLoading: maestrosLoading } = useExploreQuery({
    type: 'maestros',
    q: filters.q,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: 4
  });

  const { data: academias, isLoading: academiasLoading } = useExploreQuery({
    type: 'academias',
    q: filters.q,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: 4
  });

  const { data: marcas, isLoading: marcasLoading } = useExploreQuery({
    type: 'marcas',
    q: filters.q,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: 4
  });

  // Usuarios (bailarines)
  const { data: usuarios, isLoading: usuariosLoading } = useExploreQuery({
    type: 'usuarios' as any,
    q: filters.q,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: 32
  });

  // Sociales (event parents)
  const { data: sociales, isLoading: socialesLoading } = useExploreQuery({
    type: 'sociales' as any,
    q: filters.q,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: 8
  });

  // Construir clases desde academias y maestros (todas las páginas disponibles)
  const classesList = React.useMemo(() => {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const allA = (academias?.pages || []).flatMap(p => p?.data || []);
    const allM = (maestros?.pages || []).flatMap(p => p?.data || []);

    const parseYmdToDate = (value?: string | null) => {
      if (!value) return null;
      const plain = String(value).split('T')[0];
      const [year, month, day] = plain.split('-').map((part) => parseInt(part, 10));
      if (
        Number.isFinite(year) &&
        Number.isFinite(month) &&
        Number.isFinite(day)
      ) {
        return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      }
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const rangeFrom = parseYmdToDate(filters.dateFrom);
    const rangeTo = parseYmdToDate(filters.dateTo);
    const todayBase = parseYmdToDate(todayYmd);
    const weekEnd = todayBase ? addDays(todayBase, 6) : null;

    const resolveOwnerCover = (owner: any) => {
      const direct = owner?.avatar_url || owner?.portada_url || owner?.banner_url || owner?.avatar || owner?.portada || owner?.banner;
      if (direct) return String(direct);
      const media = Array.isArray(owner?.media) ? owner.media : [];
      if (media.length) {
        const bySlot = media.find((m: any) => m?.slot === 'cover' || m?.slot === 'p1' || m?.slot === 'avatar');
        if (bySlot?.url) return String(bySlot.url);
        if ((bySlot as any)?.path) return String((bySlot as any).path);
        const first = media[0];
        return String(first?.url || (first as any)?.path || (typeof first === 'string' ? first : ''));
      }
      return undefined as unknown as string | undefined;
    };

    const mapClase = (owner: any, c: any, ownerType: 'academy' | 'teacher', cronogramaIndex: number) => ({
      titulo: c?.titulo,
      fecha: c?.fecha,
      diasSemana: c?.diasSemana || (typeof c?.diaSemana === 'number' ? [dayNames[c.diaSemana] || ''] : undefined),
      inicio: c?.inicio,
      fin: c?.fin,
      ubicacion: c?.ubicacion || owner?.ubicaciones?.[0]?.nombre || owner?.ciudad || owner?.direccion || '',
      ownerType,
      ownerId: owner?.id,
      ownerName: owner?.nombre_publico,
      ownerCoverUrl: resolveOwnerCover(owner),
      cronogramaIndex // Índice original en el cronograma
    });

    const fromAcademies = allA.flatMap((ac: any) => (Array.isArray(ac?.cronograma) ? ac.cronograma.map((c: any, idx: number) => mapClase(ac, c, 'academy', idx)) : []));
    const fromTeachers = allM.flatMap((tc: any) => (Array.isArray(tc?.cronograma) ? tc.cronograma.map((c: any, idx: number) => mapClase(tc, c, 'teacher', idx)) : []));

    const merged = [...fromAcademies, ...fromTeachers].filter(x => x && (x.titulo || x.fecha || (x.diasSemana && x.diasSemana[0])));
    // Filtro por preset de fechas
    const weekdayIndex = (name: string) => dayNames.findIndex(d => d.toLowerCase() === String(name).toLowerCase());
    const nextOccurrence = (c: any): Date | null => {
      try {
        if (c.fecha) {
          return parseYmdToDate(c.fecha);
        }
        const days: string[] = Array.isArray(c.diasSemana) ? c.diasSemana : [];
        if (!days.length) return null;
        const today = new Date();
        const todayIdx = today.getDay(); // 0..6
        let minDelta: number | null = null;
        for (const dn of days) {
          const idx = weekdayIndex(dn);
          if (idx < 0) continue;
          // Si el día ya pasó esta semana (idx < todayIdx), calcular para la próxima semana
          // Si el día es hoy o futuro (idx >= todayIdx), calcular para esta semana
          const delta = idx >= todayIdx
            ? idx - todayIdx  // Esta semana
            : (idx - todayIdx + 7) % 7; // Próxima semana (si ya pasó, sumar 7 días)
          if (minDelta === null || delta < minDelta) minDelta = delta;
        }
        if (minDelta === null) return null;
        const upcoming = addDays(today, minDelta);
        return new Date(Date.UTC(
          upcoming.getUTCFullYear(),
          upcoming.getUTCMonth(),
          upcoming.getUTCDate(),
          12, 0, 0
        ));
      } catch { return null; }
    };
    const preset = filters.datePreset || 'todos';

    const matchesPresetAndRange = (item: any) => {
      const occurrence = nextOccurrence(item);
      // Filtrar fechas pasadas: si la ocurrencia es anterior a hoy (sin hora), eliminar
      if (occurrence && todayBase) {
        const occurrenceDate = new Date(Date.UTC(
          occurrence.getUTCFullYear(),
          occurrence.getUTCMonth(),
          occurrence.getUTCDate(),
          0, 0, 0
        ));
        const todayDate = new Date(Date.UTC(
          todayBase.getUTCFullYear(),
          todayBase.getUTCMonth(),
          todayBase.getUTCDate(),
          0, 0, 0
        ));
        if (occurrenceDate < todayDate) return false;
      }
      if (rangeFrom && occurrence && occurrence < rangeFrom) return false;
      if (rangeTo && occurrence && occurrence > rangeTo) return false;
      if (preset === 'todos') return true;
      if (!occurrence) return true;
      if (preset === 'hoy') {
        return occurrence.toISOString().slice(0, 10) === todayYmd;
      }
      if (preset === 'semana') {
        if (!todayBase || !weekEnd) return true;
        return occurrence >= todayBase && occurrence <= weekEnd;
      }
      if (preset === 'siguientes') {
        if (!weekEnd) return true;
        return occurrence > weekEnd;
      }
      return true;
    };

    const filtered = merged.filter(matchesPresetAndRange);

    // Ordenar por fecha cronológica (próxima ocurrencia)
    const sorted = filtered.sort((a, b) => {
      const dateA = nextOccurrence(a);
      const dateB = nextOccurrence(b);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1; // Sin fecha al final
      if (!dateB) return -1; // Sin fecha al final
      return dateA.getTime() - dateB.getTime();
    });

    // Log para debug
    console.log("[ExploreHomeScreenModern] 🔍 Clases mapeadas con cronogramaIndex:", sorted.map((c: any) => ({
      titulo: c.titulo,
      ownerType: c.ownerType,
      ownerId: c.ownerId,
      cronogramaIndex: c.cronogramaIndex
    })));

    return sorted.slice(0, 12);
  }, [academias, maestros, filters.datePreset, filters.dateFrom, filters.dateTo, todayYmd]);

  const usuariosList = React.useMemo(
    () => (usuarios?.pages || []).flatMap((page) => page?.data ?? []),
    [usuarios]
  );

  const validUsuarios = React.useMemo(
    () =>
      usuariosList.filter((u: any) => u && u.display_name && u.display_name.trim() !== ''),
    [usuariosList]
  );

  const handleFilterChange = (newFilters: typeof filters) => {
    set(newFilters);
  };

  const renderDatePresetButtons = (mobile = false) => (
    <div
      style={{
        display: 'flex',
        gap: mobile ? 6 : 8,
        flexWrap: mobile ? 'nowrap' : 'wrap',
        overflowX: mobile ? 'auto' : 'visible',
        marginTop: mobile ? 8 : 12,
        padding: mobile ? '0 4px' : 0,
      }}
    >
      {([
        { id: 'todos', label: 'Todos' },
        { id: 'hoy', label: 'Hoy' },
        { id: 'semana', label: 'Esta semana' },
        { id: 'siguientes', label: 'Siguientes' },
      ] as const).map((p) => {
        const active = (filters.datePreset || 'todos') === p.id;
        return (
          <button
            key={p.id}
            onClick={() => applyDatePreset(p.id)}
            style={{
              padding: mobile ? '8px 12px' : '8px 14px',
              borderRadius: 999,
              border: active ? '1px solid rgba(240,147,251,0.55)' : '1px solid rgba(255,255,255,0.12)',
              background: active
                ? 'linear-gradient(135deg, rgba(240,147,251,0.18), rgba(245,87,108,0.18))'
                : 'rgba(30,30,35,0.45)',
              color: active ? 'rgba(240,147,251,0.95)' : 'rgba(255,255,255,0.8)',
              fontWeight: 700,
              letterSpacing: 0.2,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              minWidth: mobile ? 105 : undefined,
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <SeoHead section="explore" />
      <style>{`
        .explore-container { min-height: 100vh; background: #0b0d10; color: ${colors.gray[50]}; }
        .filters { padding: ${spacing[6]}; }
        .card-skeleton { height: 260px; border-radius: 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); display: grid; place-items: center; color: ${colors.gray[400]}; }
        .cards-grid { 
          display: grid; 
          grid-template-columns: 1fr; 
          gap: 1.5rem;
          padding: 1rem 0;
        }
        @media (min-width: 768px) {
          .cards-grid { 
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
            padding: 1.5rem 0;
          }
        }
        .wrap { max-width: 1280px; margin: 0 auto; padding: 0 ${spacing[6]} ${spacing[10]}; }
        .panel { 
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: ${spacing[5]};
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }
        .panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #f093fb, #f5576c, #FFD166);
          opacity: 0.9;
        }
        .section-container {
          margin-bottom: 4rem;
          position: relative;
        }
        .explore-slider {
          width: 100%;
        }
        @media (max-width: 768px) {
          .explore-slider--mobile {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
          }
          .explore-slider--mobile > button {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .cards-grid {
            gap: 1.25rem !important;
            padding: 0.75rem 0 !important;
          }
          .wrap {
            padding: 0 1rem 2rem !important;
          }
          .panel {
            margin: 1rem 0 !important;
            padding: 1rem !important;
            border-radius: 16px !important;
          }
          .section-container {
            margin-bottom: 2.5rem !important;
          }
        }
        @media (max-width: 480px) {
          .cards-grid {
            gap: 1rem !important;
            padding: 0.5rem 0 !important;
          }
          .wrap {
            padding: 0 0.75rem 1.5rem !important;
          }
          .panel {
            margin: 0.75rem 0 !important;
            padding: 0.875rem !important;
            border-radius: 14px !important;
          }
          .section-container h2 {
            font-size: 1.5rem !important;
          }
          .section-container > div > div:first-child > div:first-child {
            width: 48px !important;
            height: 48px !important;
            font-size: 1.25rem !important;
          }
        }
      `}</style>

      <div className="explore-container">
        {/* Hero removido para una vista más directa al contenido */}

        <div className="wrap">
          {/* Indicador de filtros favoritos */}
          {usingFavoriteFilters && user && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(240,147,251,0.15), rgba(245,87,108,0.15))',
                border: '1px solid rgba(240,147,251,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                <span style={{ fontSize: '1.25rem' }}>⭐</span>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  Usando tus filtros favoritos
                </span>
              </div>
              <button
                onClick={resetToFavoriteFilters}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
              >
                🔄 Restablecer favoritos
              </button>
            </motion.div>
          )}

          <div style={{ margin: `${spacing[6]} 0` }}>
            <div className="panel">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, rgba(240,147,251,0.2), rgba(245,87,108,0.24))',
                      border: '1px solid rgba(240,147,251,0.4)',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                      color: '#FFE4FF',
                      fontSize: '1.1rem',
                    }}
                  >
                    🎛️
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '0.98rem',
                        fontWeight: 700,
                        letterSpacing: 0.25,
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.92)',
                      }}
                    >
                      Filtros de búsqueda
                    </div>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      Ajusta ritmos, zonas, fechas y palabras clave para encontrar dónde bailar.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(0,0,0,0.25)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.8)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activeFiltersCount > 0
                    ? `${activeFiltersCount} filtro${activeFiltersCount !== 1 ? 's' : ''} activos`
                    : 'Sin filtros activos'}
                </div>
              </div>

              <FilterBar
                filters={filters}
                onFiltersChange={handleFilterChange}
                showTypeFilter={false}
              />
              {!isMobile && renderDatePresetButtons(false)}
            </div>
          </div>

          {isMobile && (
            <div style={{ margin: '0 0 1.5rem 0' }}>
              {renderDatePresetButtons(true)}
            </div>
          )}

          {(showAll || selectedType === 'fechas') && (
            <Section title="Próximas Fechas" toAll="/explore/list?type=fechas">
              {fechasLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
              ) : (() => {
                const parseYmdToDate = (value?: string | null) => {
                  if (!value) return null;
                  const plain = String(value).split('T')[0];
                  const [year, month, day] = plain.split('-').map((part) => parseInt(part, 10));
                  if (
                    Number.isFinite(year) &&
                    Number.isFinite(month) &&
                    Number.isFinite(day)
                  ) {
                    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
                  }
                  const parsed = new Date(value);
                  return Number.isNaN(parsed.getTime()) ? null : parsed;
                };
                const todayBase = parseYmdToDate(todayYmd);

                // Filtrar fechas pasadas y ordenar cronológicamente
                const allFechas = (fechas?.pages?.[0]?.data || []).filter((d: any) => d?.estado_publicacion === 'publicado');
                const filteredFechas = allFechas.filter((fecha: any) => {
                  const fechaDate = parseYmdToDate(fecha?.fecha);
                  if (!fechaDate || !todayBase) return true;
                  // Comparar solo la fecha (sin hora)
                  const fechaDateOnly = new Date(Date.UTC(
                    fechaDate.getUTCFullYear(),
                    fechaDate.getUTCMonth(),
                    fechaDate.getUTCDate(),
                    0, 0, 0
                  ));
                  const todayDateOnly = new Date(Date.UTC(
                    todayBase.getUTCFullYear(),
                    todayBase.getUTCMonth(),
                    todayBase.getUTCDate(),
                    0, 0, 0
                  ));
                  return fechaDateOnly >= todayDateOnly;
                });

                // Ordenar por fecha cronológica
                const sortedFechas = filteredFechas.sort((a: any, b: any) => {
                  const dateA = parseYmdToDate(a?.fecha);
                  const dateB = parseYmdToDate(b?.fecha);
                  if (!dateA && !dateB) return 0;
                  if (!dateA) return 1;
                  if (!dateB) return -1;
                  return dateA.getTime() - dateB.getTime();
                });

                const list = sortedFechas;
                return list.length ? (
                  <HorizontalSlider
                    {...sliderProps}
                    items={list}
                    renderItem={(fechaEvento: any, idx: number) => (
                      <motion.div
                        key={fechaEvento.id ?? idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        onClickCapture={handlePreNavigate}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 16,
                          padding: 0,
                          overflow: 'hidden',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        <EventCard item={fechaEvento} />
                      </motion.div>
                    )}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
                );
              })()}
            </Section>
          )}

          {(showAll || selectedType === 'clases') && (
            <Section title="Encuentra tus clases" toAll="/explore/list?type=clases">
              {(() => {
                const loading = academiasLoading || maestrosLoading;
                if (loading) return <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>;
                if (!classesList.length) return <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Aún no hay clases</div>;
                return (
                  <HorizontalSlider
                    {...sliderProps}
                    items={classesList}
                    renderItem={(clase: any, idx: number) => {
                      const stableKey =
                        `${clase.ownerType || 'owner'}-${clase.ownerId ?? 'unknown'}-${clase.titulo ?? 'class'}-${clase.fecha ?? (Array.isArray(clase.diasSemana) ? clase.diasSemana.join('-') : 'semana')}-${idx}`;
                      return (
                        <motion.div
                          key={stableKey}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05, duration: 0.3 }}
                          whileHover={{ y: -4, scale: 1.02 }}
                          onClickCapture={handlePreNavigate}
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 16,
                            padding: 0,
                            overflow: 'hidden',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          <ClassCard item={clase} />
                        </motion.div>
                      );
                    }}
                  />
                );
              })()}
            </Section>
          )}

          {/* {(showAll || selectedType === 'sociales') && (
            <Section title="Sociales" toAll="/explore/list?type=sociales">
              {socialesLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
              ) : (() => {
                const list = sociales?.pages?.[0]?.data || [];
                return list.length ? (
                  <HorizontalSlider
                    items={list}
                    renderItem={(social: any, idx: number) => (
                      <motion.div 
                        key={social.id ?? idx} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                        whileHover={{ y: -4, scale: 1.02 }} 
                        onClickCapture={handlePreNavigate}
                        style={{ 
                          background: 'rgba(255,255,255,0.04)', 
                          border: '1px solid rgba(255,255,255,0.08)', 
                          borderRadius: 16, 
                          padding: 0,
                          overflow: 'hidden',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        <SocialCard item={social} />
                      </motion.div>
                    )}
                  />
                ) : (<div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>);
              })()}
            </Section>
          )} */}

          {(showAll || selectedType === 'academias') && (
            <Section title="Academias" toAll="/explore/list?type=academias">
              {academiasLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
              ) : academias && academias.pages?.[0]?.data?.length > 0 ? (
                <HorizontalSlider
                  {...sliderProps}
                  items={academias.pages[0].data}
                  renderItem={(academia: any, idx: number) => (
                    <motion.div
                      key={academia.id ?? idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClickCapture={handlePreNavigate}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 16,
                        padding: 0,
                        overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <AcademyCard item={academia} />
                    </motion.div>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
              )}
            </Section>
          )}

          {/* {(showAll || selectedType === 'organizadores') && (
            <Section title="Organizadores" toAll="/explore/list?type=organizadores">
              {organizadoresLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
              ) : organizadores && organizadores.pages?.[0]?.data?.length > 0 ? (
                <HorizontalSlider
                  items={organizadores.pages[0].data}
                  renderItem={(organizador: any, idx: number) => (
                    <motion.div 
                      key={organizador.id ?? idx} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      whileHover={{ y: -4, scale: 1.02 }} 
                      onClickCapture={handlePreNavigate}
                      style={{ 
                        background: 'rgba(255,255,255,0.04)', 
                        border: '1px solid rgba(255,255,255,0.08)', 
                        borderRadius: 16, 
                        padding: 0,
                        overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <OrganizerCard item={organizador} />
                    </motion.div>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
              )}
            </Section>
          )} */}

          {(showAll || selectedType === 'usuarios') && (
            <Section title={`¿Con quién bailar?${validUsuarios.length ? ` · ${validUsuarios.length}` : ''}`} toAll="/explore/list?type=usuarios">
              {usuariosLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
              ) : (() => {
                return validUsuarios.length > 0 ? (
                  <HorizontalSlider
                    {...sliderProps}
                    items={validUsuarios}
                    renderItem={(u: any, idx: number) => (
                      <motion.div
                        key={u.user_id ?? idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        onClickCapture={handlePreNavigate}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 16,
                          padding: 0,
                          overflow: 'hidden',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        <DancerCard item={{
                          id: u.user_id,
                          display_name: u.display_name,
                          bio: u.bio,
                          avatar_url: u.avatar_url,
                          banner_url: u.banner_url,
                          portada_url: u.portada_url,
                          media: u.media,
                          ritmos: u.ritmos,
                          ritmosSeleccionados: u.ritmos_seleccionados,
                          zonas: u.zonas
                        }} to={`/u/${encodeURIComponent(u.user_id)}`} />
                      </motion.div>
                    )}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Aún no hay perfiles disponibles</div>
                );
              })()}
            </Section>
          )}

          {(showAll || selectedType === 'maestros') && (
            <Section title="Maestros" toAll="/explore/list?type=teacher">
              {maestrosLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
              ) : maestros && maestros.pages?.[0]?.data?.length > 0 ? (
                <HorizontalSlider
                  {...sliderProps}
                  items={maestros.pages[0].data}
                  renderItem={(maestro: any, idx: number) => (
                    <motion.div
                      key={maestro.id ?? idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClickCapture={handlePreNavigate}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 16,
                        padding: 0,
                        overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <TeacherCard item={maestro} />
                    </motion.div>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
              )}
            </Section>
          )}

          {(showAll || selectedType === 'marcas') && (
            <Section title="Marcas" toAll="/explore/list?type=marcas">
              {marcasLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
              ) : marcas && marcas.pages?.[0]?.data?.length > 0 ? (
                <HorizontalSlider
                  {...sliderProps}
                  items={marcas.pages[0].data}
                  renderItem={(brand: any, idx: number) => (
                    <motion.div
                      key={brand.id ?? idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClickCapture={handlePreNavigate}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 16,
                        padding: 0,
                        overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <BrandCard item={brand} />
                    </motion.div>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
              )}
            </Section>
          )}
        </div>
      </div>
    </>
  );
}
