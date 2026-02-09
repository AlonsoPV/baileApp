import React from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useExploreFilters, type DatePreset } from "../../state/exploreFilters";
import { useExploreQuery } from "../../hooks/useExploreQuery";
import { useUsedFilterTags } from "@/hooks/useUsedFilterTags";
import { useZonaCatalogGroups } from "@/hooks/useZonaCatalogGroups";
import { groupRitmos, zonaGroupsToTreeGroups } from "@/filters/exploreFilterGroups";
import { MultiSelectTreeDropdown } from "@/components/explore/MultiSelectTreeDropdown";
import { DateFilterDropdown } from "@/components/explore/DateFilterDropdown";
import EventCard from "../../components/explore/cards/EventCard";
import OrganizerCard from "../../components/explore/cards/OrganizerCard";
import TeacherCard from "../../components/explore/cards/TeacherCard";
import AcademyCard from "../../components/explore/cards/AcademyCard";
import HorizontalSlider from "../../components/explore/HorizontalSlider";
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
import { EventsSection } from "../../components/sections/EventsSection";
import { ClassesSection } from "../../components/sections/ClassesSection";
import { AcademiesSection } from "../../components/sections/AcademiesSection";
import { buildAvailableFilters } from "../../filters/buildAvailableFilters";
import { useToast } from "../../components/Toast";

// Tipo mínimo local para no depender de @tanstack/react-query a nivel de tipos.
// Acepta la firma real de `fetchNextPage` (que devuelve un Promise con resultado),
// pero nosotros lo usamos solo como callback sin esperar su valor.
type InfiniteQueryLike<TData = any, TError = unknown> = {
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage: (...args: any[]) => any;
};

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

function getTodayCDMX(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

function flattenQueryData(data?: { pages?: Array<{ data?: any[] }> }) {
  if (!data?.pages?.length) return [];
  return data.pages.flatMap((page) => (page?.data as any[]) || []);
}

function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function useStableArray<T>(arr: T[]): T[] {
  return React.useMemo(() => [...arr], [JSON.stringify(arr)]);
}

function useLoadMoreOnDemand(query: InfiniteQueryLike<any, unknown> | null) {
  const handleLoadMore = React.useCallback(() => {
    if (query?.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query?.hasNextPage, query?.isFetchingNextPage, query?.fetchNextPage]);

  return { handleLoadMore, hasNextPage: query?.hasNextPage ?? false, isFetching: query?.isFetchingNextPage ?? false };
}

function InlineQueryError({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: unknown;
  onRetry?: () => void;
}) {
  const message =
    typeof (error as any)?.message === 'string'
      ? (error as any).message
      : 'No se pudo cargar. Intenta de nuevo.';

  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.18)',
        background: 'rgba(0,0,0,0.18)',
        borderRadius: 14,
        padding: '14px 16px',
        color: '#fff',
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div style={{ opacity: 0.9, fontSize: 13, lineHeight: 1.35 }}>{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 10,
            padding: '8px 12px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.22)',
            background: 'rgba(255,255,255,0.10)',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}


/**
 * ClaseItem - Componente memoizado optimizado para scroll fluido
 * 
 * Optimizaciones:
 * - Memoización con comparación personalizada por ownerType/ownerId/titulo
 * - Reducción de animaciones en mobile (solo primeras 10 cards en desktop)
 * - CSS contain para limitar repaints
 * - Aceleración de hardware con translateZ(0)
 * - Comparación estable por clave única del item
 */
const ClaseItem = React.memo(({ clase, idx, handlePreNavigate }: { clase: any; idx: number; handlePreNavigate: () => void }) => {
  const stableKey =
    `${clase.ownerType || 'owner'}-${clase.ownerId ?? 'unknown'}-${clase.titulo ?? 'class'}-${clase.fecha ?? (Array.isArray(clase.diasSemana) ? clase.diasSemana.join('-') : 'semana')}-${idx}`;

  // Reducir animaciones en mobile para mejor rendimiento
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const shouldAnimate = !isMobile && idx < 10; // Solo animar primeras 10 cards

  return (
    <div
      key={stableKey}
      onClickCapture={handlePreNavigate}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 0,
        overflow: 'hidden',
        boxShadow: 'none',
        // Optimizaciones de rendimiento
        transform: 'translateZ(0)',
        willChange: 'auto',
        contain: 'layout style paint',
        // Mejorar rendimiento en mobile
        WebkitTransform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
    >
      {shouldAnimate ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05, duration: 0.3 }}
          whileHover={{ y: -4, scale: 1.02 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ClassCard item={clase} fillHeight priority={idx === 0} />
        </motion.div>
      ) : (
        <ClassCard item={clase} fillHeight priority={idx === 0} />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  const prevKey = `${prevProps.clase.ownerType || 'owner'}-${prevProps.clase.ownerId ?? 'unknown'}-${prevProps.clase.titulo ?? 'class'}`;
  const nextKey = `${nextProps.clase.ownerType || 'owner'}-${nextProps.clase.ownerId ?? 'unknown'}-${nextProps.clase.titulo ?? 'class'}`;
  return prevKey === nextKey && prevProps.idx === nextProps.idx;
});

ClaseItem.displayName = 'ClaseItem';

// Hook para generar un índice aleatorio estable basado en la longitud del array
function useStableRandomIndex(length: number, sectionId: string): number {
  return React.useMemo(() => {
    if (length === 0) return 0; // Si no hay items, insertar al inicio (aunque no se usará)
    if (length < 5) return length; // Si hay menos de 5 items, insertar al final

    // Generar un índice aleatorio entre 5 y 15 (o hasta length si es menor)
    // Usar sectionId como seed para que sea estable por sección
    const seed = sectionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (seed * 9301 + 49297) % 233280; // Generador pseudoaleatorio simple
    const normalized = random / 233280;

    const minIndex = 5;
    const maxIndex = Math.min(15, length); // No exceder la longitud del array
    const range = maxIndex - minIndex + 1;

    return Math.floor(minIndex + normalized * range); // Entre 5 y 15 (o hasta length)
  }, [length, sectionId]);
}

// Helper para crear array con CTA insertada (no usa hooks, solo calcula)
function createArrayWithCTA<T>(
  items: T[],
  ctaIndex: number,
  sectionType: 'clases' | 'academias' | 'maestros' | 'organizadores' | 'marcas'
): Array<T | { __isCTA: true; sectionType: typeof sectionType }> {
  if (items.length === 0) return items as any;
  const result = [...items];
  result.splice(ctaIndex, 0, { __isCTA: true, sectionType } as any);
  return result as any;
}

// Componente CTA Card
const CTACard = React.memo(({
  text,
  sectionType,
  idx
}: {
  text: string;
  sectionType: 'clases' | 'academias' | 'maestros' | 'organizadores' | 'marcas';
  idx: number;
}) => {
  const { t } = useTranslation();
  const handleClick = React.useCallback(() => {
    window.location.href = 'https://dondebailar.com.mx/app/roles/info';
  }, []);

  const logoUrl = 'https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/LogoDondeBMx.webp';

  return (
    <>
      <style>{`
        /* En escritorio, igualar ALTURA con las ClassCard (que ahora usan fillHeight en el slider).
           En mobile mantenemos la proporción 4/5 para que se vea consistente. */
        .cta-card-mobile {
          width: 100%;
          height: 100%;
          align-self: stretch;
        }
        @media (max-width: 768px) {
          .cta-card-mobile {
            /* Mantener proporción en mobile */
            aspect-ratio: 4 / 5 !important;
            max-width: 100%;
            margin: 0;
          }
        }
      `}</style>
      <div
        className="cta-card-mobile"
        onClick={handleClick}
        style={{
          backgroundImage: `url(${logoUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          border: '2px solid rgba(240, 147, 251, 0.4)',
          borderRadius: 16,
          padding: 0,
          overflow: 'hidden',
          boxShadow: 'none',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1rem',
          width: '100%'
        }}
      >
      {/* Overlay oscuro para mejor contraste */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(40, 30, 45, 0.75), rgba(30, 20, 40, 0.75))',
        zIndex: 1
      }} />

      {/* Contenido */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        gap: '1rem',
        height: '100%',
        width: '100%'
      }}>
        {/* Badge "Únete" */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'linear-gradient(135deg, #f093fb, #f5576c)',
          color: 'white',
          padding: '0.4rem 0.8rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          boxShadow: '0 4px 12px rgba(240, 147, 251, 0.5)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }}>
          {t('join')}
        </div>

        {/* Icono */}
        <div style={{
          fontSize: '3rem',
          marginBottom: '0.5rem'
        }}>
          {sectionType === 'clases' ? '🎓' :
            sectionType === 'academias' ? '🏫' :
              sectionType === 'maestros' ? '👨‍🏫' :
                sectionType === 'organizadores' ? '📅' :
                  '🏷️'}
        </div>

        {/* Texto */}
        <p style={{
          color: '#fff',
          fontSize: '1.1rem',
          fontWeight: 600,
          margin: 0,
          lineHeight: 1.4,
          maxWidth: '90%',
          fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }}>
          {text}
        </p>

        {/* Flecha indicativa */}
        <div style={{
          marginTop: '0.5rem',
          fontSize: '1.5rem',
          opacity: 0.8
        }}>
          →
        </div>
      </div>
    </div>
    </>
  );
});

CTACard.displayName = 'CTACard';

const STYLES = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .explore-container { 
    min-height: 100vh; 
    /* IMPORTANT: This screen is styled for a dark UI (cards/text assume dark background). */
    background: #0b0d10; 
    color: ${colors.gray[50]}; 
    width: 100%;
    overflow-x: hidden;
    overflow-y: auto; /* Permitir scroll vertical cuando el contenido supera el viewport */
    padding-top: 0;
    padding-bottom: env(safe-area-inset-bottom);
    /* Optimizaciones de scroll vertical */
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    touch-action: pan-y;
    /* No usar contain/transform aquí para no romper el scroll ni position: fixed */
  }
  @media (min-width: 769px) {
    .explore-container {
      overflow-y: auto;
      height: auto;
      min-height: 100vh;
    }
  }
  .filters { padding: ${spacing[6]}; }
  .card-skeleton { height: 260px; border-radius: 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); display: grid; place-items: center; color: ${colors.gray[400]}; }
  .cards-grid { 
    display: grid; 
    grid-template-columns: 1fr; 
    gap: 1.5rem;
    padding: 1rem 0;
    /* Optimizaciones de rendimiento */
    contain: layout style;
    transform: translateZ(0);
    will-change: auto;
  }
  @media (min-width: 768px) {
    .cards-grid { 
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      padding: 1.5rem 0;
    }
  }
  .wrap { 
    max-width: 1280px; 
    margin: 0 auto; 
    padding: 0 ${spacing[6]} ${spacing[10]};
    width: 100%;
    box-sizing: border-box;
    /* Optimizaciones de scroll */
    transform: translateZ(0);
    will-change: auto;
  }
  .panel { 
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
    border: 2px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    padding: ${spacing[5]};
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    position: relative;
    overflow: hidden;
    /* Optimizaciones de rendimiento */
    contain: layout style paint;
    transform: translateZ(0);
    will-change: auto;
    backfaceVisibility: hidden;
    -webkit-backfaceVisibility: hidden;
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
    /* Optimizaciones de rendimiento durante scroll */
    contain: layout style paint;
    transform: translateZ(0);
    will-change: auto;
  }
  .section-header {
    margin-bottom: 2rem;
    padding: 0 0.5rem;
  }
  .section-header-link {
    flex-shrink: 0;
  }
  .section-title-text {
    font-size: 1.875rem;
    font-weight: 800;
    margin: 0;
    margin-bottom: 0.25rem;
    line-height: 1.2;
  }
  .section-title-underline {
    width: 60px;
    height: 4px;
    border-radius: 2px;
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
  :root {
    --panel: hsl(235 28% 16% / .65);
    --panel-2: hsl(235 28% 18% / .65);
    --stroke: hsl(235 35% 70% / .14);
    --text: hsl(0 0% 98%);
    --muted: hsl(235 10% 78%);
    --chip: hsl(235 26% 22% / .7);
    --chip-stroke: hsl(235 35% 60% / .25);
    --accent: hsl(265 78% 67%);
    --accent-2: hsl(200 75% 60%);
    --active-a: hsl(12 80% 58%);
    --active-b: hsl(330 70% 60%);
    --radius-lg: 14px;
    --radius-md: 10px;
    --shadow-1: 0 10px 26px hsl(0 0% 0% / .28);
    --gap-1: .35rem;
    --gap-2: .55rem;
    --gap-3: .8rem;
    --fp-bg: #15181f;
    --fp-bg-soft: #101119;
    --fp-border: #262a36;
    --fp-border-soft: #343947;
    --fp-text: #f5f5ff;
    --fp-muted: #a4a9bd;
    --fp-radius-lg: 22px;
    --fp-radius: 16px;
    --fp-pill: 999px;
    --fp-speed: 0.16s;
    --fp-shadow: 0 14px 40px rgba(0,0,0,.55);
    --fp-grad: linear-gradient(90deg,#ff4b8b,#ff9b45);
  }
  /* Filters card (estructura nueva: header + pills + chips) */
  .filters-card {
    width: 100%;
    max-width: 680px;
    margin-left: auto;
    margin-right: auto;
    padding: 14px 14px 12px;
    border-radius: var(--radius-lg);
    background: #000000;
    border: 1px solid rgba(255,255,255,.14);
    box-shadow: 0 12px 28px rgba(0,0,0,.28);
    color: var(--text);
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    backdrop-filter: blur(10px);
  }
  .filters-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }
  /* Header + búsqueda en la misma fila */
  .filters-top-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }
  .filters-top-row__title {
    flex: 0 0 auto;
  }
  .filters-top-row__search {
    flex: 1 1 320px;
    min-width: 240px;
  }
  .filters-top-row__actions {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .filters-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
    letter-spacing: .2px;
  }
  .filters-icon {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: rgba(255,255,255,.10);
    border: 1px solid rgba(255,255,255,.12);
  }
  .filters-clear {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.16);
    background: rgba(255,255,255,.06);
    color: var(--muted);
    font-size: 13px;
    cursor: pointer;
    transition: transform .12s ease, background .12s ease, border-color .12s ease;
  }
  .filters-clear:hover {
    background: rgba(255,255,255,.10);
    border-color: rgba(255,255,255,.22);
    transform: translateY(-1px);
  }
  .filters-clear:active { transform: translateY(0); }
  .filters-clear .dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: rgba(255,255,255,.35);
  }
  .filters-card__row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  /* Mantener la fila de selectores en una sola fila (scroll si hace falta) */
  .filters-card__row--selects {
    flex-wrap: nowrap;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: hsl(235 20% 28% / .6) transparent;
    padding-bottom: 2px;
  }
  .filters-card__row--selects::-webkit-scrollbar {
    height: 6px;
  }
  .filters-card__row--selects::-webkit-scrollbar-thumb {
    background: hsl(235 20% 28% / .6);
    border-radius: 999px;
  }
  .filter-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.14);
    background: rgba(255,255,255,.06);
    color: var(--text);
    font-size: 14px;
    cursor: pointer;
    user-select: none;
    transition: transform .12s ease, background .12s ease, border-color .12s ease;
    outline: none;
  }
  .filter-pill .pill-text {
    color: #f5f5ff;
  }
  .filter-pill:hover {
    background: rgba(255,255,255,.10);
    border-color: rgba(255,255,255,.22);
    transform: translateY(-1px);
  }
  .filter-pill:active { transform: translateY(0); }
  .filter-pill:focus-visible {
    box-shadow: 0 0 0 3px rgba(255,106,26,.35);
    border-color: rgba(255,106,26,.65);
  }
  .filter-pill .pill-icon {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: rgba(255,255,255,.10);
  }
  .filter-pill.is-primary {
    background: linear-gradient(135deg, rgba(255,106,26,.20), rgba(233,78,27,.12));
    border-color: rgba(255,106,26,.35);
  }
  .filter-pill.is-danger {
    background: rgba(239,68,68,.14);
    border-color: rgba(239,68,68,0.35);
    color: #fecaca;
  }
  .filter-pill.is-danger:hover {
    background: rgba(239,68,68,.20);
    border-color: rgba(239,68,68,0.55);
  }
  .filter-pill.filter-pill--active {
    background: rgba(255,255,255,.12);
    border-color: rgba(255,255,255,.22);
  }
  .filters-divider {
    height: 1px;
    background: rgba(255,255,255,.12);
    margin: 12px 2px;
  }
  .filters-card__row.chips { gap: 8px; justify-content: center; }
  .filters-card__row.chips .chip {
    padding: 9px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.14);
    background: rgba(255,255,255,.05);
    color: #f5f5ff;
    font-size: 13px;
    cursor: pointer;
    transition: transform .12s ease, background .12s ease, border-color .12s ease;
  }
  .filters-card__row.chips .chip:hover {
    background: rgba(255,255,255,.10);
    border-color: rgba(255,255,255,.22);
    transform: translateY(-1px);
  }
  .filters-card__row.chips .chip.is-active {
    background: linear-gradient(135deg, #FF6A1A, #E94E1B);
    border-color: rgba(255,255,255,.18);
    color: #111;
    font-weight: 700;
  }

  /* Tabs de secciones (fila horizontal con scroll) */
  .filters-tabs {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding: 2px 0 6px 0;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: hsl(235 20% 28% / .6) transparent;
  }
  .filters-tabs::-webkit-scrollbar {
    height: 6px;
  }
  .filters-tabs::-webkit-scrollbar-thumb {
    background: hsl(235 20% 28% / .6);
    border-radius: 999px;
  }
  .tab {
    flex: 0 0 auto;
    border: 1px solid rgba(255,255,255,.14);
    background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.92);
    border-radius: 999px;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition: transform .12s ease, background .12s ease, border-color .12s ease;
    outline: none;
  }
  .tab:hover {
    background: rgba(255,255,255,.10);
    border-color: rgba(255,255,255,.22);
    transform: translateY(-1px);
  }
  .tab:active { transform: translateY(0); }
  .tab:focus-visible {
    box-shadow: 0 0 0 3px rgba(255,106,26,.35);
    border-color: rgba(255,106,26,.65);
  }
  .tab--active {
    background: linear-gradient(135deg, #FF6A1A, #E94E1B);
    border-color: rgba(255,255,255,.18);
    color: #111;
  }

  /* FilterBar embebido: no sticky (para que el dropdown se vea aquí) */
  .filterbar-inline {
    position: static !important;
    top: auto !important;
    z-index: auto !important;
  }
  @media (max-width: 420px) {
    .filter-pill.is-primary {
      flex: 1 1 100%;
      justify-content: flex-start;
    }
  }
  .filters-fav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: var(--fp-radius);
    background: rgba(0,0,0,.25);
    border: 1px solid var(--fp-border);
  }
  .filters-fav__left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .filters-fav__icon {
    font-size: 20px;
  }
  .filters-fav__title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }
  .filters-fav__btn {
    border-radius: var(--fp-pill);
    border: 1px solid var(--fp-border-soft);
    background: #1b1f2a;
    color: var(--fp-text);
    font-size: 12px;
    padding: 6px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: background var(--fp-speed), border-color var(--fp-speed), transform var(--fp-speed);
  }
  .filters-fav__btn:hover {
    background: #222735;
    border-color: #4b5568;
    transform: translateY(-0.5px);
  }
  /* Row 1: Título + estado + búsqueda colapsada */
  .fxc__row1 {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: var(--gap-3);
  }
  @media (max-width: 700px) {
    .fxc__row1 {
      grid-template-columns: 1fr;
    }
  }
  .fxc__head {
    display: flex;
    align-items: center;
    gap: var(--gap-2);
    min-width: 0;
    flex: 1;
  }
  .fxc__title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 900;
    font-size: clamp(0.9rem, 1.6vw, 1rem);
    margin: 0;
  }
  .fxc__state {
    color: var(--muted);
    font-weight: 700;
    font-size: 0.78rem;
    border: 1px solid var(--stroke);
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    background: hsl(235 25% 22% / .4);
    white-space: nowrap;
  }
  /* Lupa colapsada: icono que expande input al enfocar */
  .search-c {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: hsl(235 22% 22% / .55);
    border: 1px solid var(--stroke);
    border-radius: 999px;
    padding: 0.35rem 0.5rem;
    height: 34px;
    max-width: 320px;
    transition: background-color 0.15s ease, box-shadow 0.15s ease;
  }
  .search-c:focus-within {
    box-shadow: 0 0 0 2px hsl(200 75% 60% / .35);
  }
  .search-c__icon {
    font-size: 1rem;
    opacity: 0.95;
  }
  .search-c__input {
    background: transparent;
    border: 0;
    outline: 0;
    color: var(--text);
    width: 0;
    min-width: 0;
    font: inherit;
    font-size: 0.9rem;
    caret-color: var(--accent);
    transition: width 0.18s ease;
  }
  .search-c:focus-within .search-c__input {
    width: 180px;
  }
  @media (max-width: 700px) {
    .search-c__input {
      width: 0;
    }
    .search-c:focus-within .search-c__input {
      width: 140px;
    }
  }
  .search-c__input::placeholder {
    color: hsl(235 10% 74%);
  }
  /* Row 2: 3 chips en UNA fila (si desborda, scroll horizontal) */
  .fxc__row2 {
    display: flex;
    align-items: center;
    gap: var(--gap-2);
    overflow-x: auto;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: hsl(235 20% 28% / .6) transparent;
    padding-bottom: 0.1rem;
    white-space: nowrap;
  }
  .fxc__row2::-webkit-scrollbar {
    height: 6px;
  }
  .fxc__row2::-webkit-scrollbar-thumb {
    background: hsl(235 20% 28% / .6);
    border-radius: 999px;
  }
  .segment {
    display: inline-flex;
    gap: 0.25rem;
    justify-content: space-evenly;
    padding: 0.2rem;
    background: hsl(235 25% 21% / .55);
    border: 1px solid var(--stroke);
    border-radius: 999px;
    margin: auto;
  }
  .seg {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.35rem 0.6rem;
    border-radius: 999px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text);
    text-decoration: none;
    font-weight: 800;
    font-size: 0.85rem;
    transition: background-color 0.15s ease, transform 0.12s ease;
    cursor: pointer;
  }
  .seg:hover {
    transform: translateY(-1px);
  }
  .seg:active {
    transform: translateY(0);
  }
  .seg:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .seg[aria-pressed="true"],
  .seg.seg--active {
    background: hsl(260 45% 45% / .35);
    border-color: hsl(260 60% 65% / .35);
  }
  .q.q--active {
    background: linear-gradient(135deg, var(--active-a), var(--active-b));
    border-color: transparent;
    box-shadow: 0 6px 14px hsl(330 80% 40% / .28);
  }
  /* Rangos rápidos MÁS CHICOS en una fila (scroll en móvil) */
  .quick-row {
    display: flex;
    align-items: stretch;
    gap: var(--gap-2);
    overflow-x: auto;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x proximity;
    padding-bottom: 0.15rem;
    margin: auto;
  }
  .quick-row::-webkit-scrollbar {
    height: 6px;
  }
  .quick-row::-webkit-scrollbar-thumb {
    background: hsl(235 20% 28% / .6);
    border-radius: 999px;
  }
  .q {
    scroll-snap-align: start;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    height: 32px;
    flex: 0 0 auto;
    min-width: fit-content;
    padding: 0.25rem 0.75rem;
    border-radius: 10px;
    border: 1px solid var(--chip-stroke);
    background: hsl(235 22% 20% / .55);
    color: var(--text);
    font-weight: 900;
    letter-spacing: 0.2px;
    font-size: 0.85rem;
    text-decoration: none;
    white-space: nowrap;
    transition: background-color 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease;
    box-shadow: 0 4px 10px hsl(0 0% 0% / .18);
    cursor: pointer;
  }
  .q:hover {
    transform: translateY(-1px);
  }
  .q:active {
    transform: translateY(0);
  }
  .q[aria-pressed="true"] {
    background: linear-gradient(135deg, var(--active-a), var(--active-b));
    border-color: transparent;
    box-shadow: 0 6px 14px hsl(330 80% 40% / .28);
  }
  .q:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 2px;
  }
  .q .label {
    white-space: nowrap;
  }
  .q .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid hsl(235 35% 50% / .4);
    background: linear-gradient(135deg, hsl(265 78% 67% / .25), hsl(200 75% 60% / .25));
    font-size: 0.7rem;
    font-weight: 900;
    color: var(--text);
    box-shadow: 0 2px 6px hsl(0 0% 0% / .2);
    margin-left: 0.4rem;
  }
  .q[aria-pressed="true"] .badge {
    background: linear-gradient(135deg, hsl(12 80% 58% / .4), hsl(330 70% 60% / .4));
    border-color: hsl(330 70% 60% / .5);
    box-shadow: 0 2px 8px hsl(330 80% 40% / .3);
  }
  .tab-icon,
  .tab-label,
  .tab-badge {
    display: inline-block;
  }
  @media (prefers-reduced-motion: reduce) {
    .seg, .q {
      transition: none;
    }
  }
  .load-more-btn {
    margin-top: 1.5rem;
    padding: 0.875rem 1.75rem;
    border-radius: 999px;
    border: 1px solid rgba(240, 147, 251, 0.35);
    background: rgba(240, 147, 251, 0.1);
    color: #fff;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(240, 147, 251, 0.15);
    letter-spacing: 0.3px;
  }
  .load-more-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(255, 195, 143, 0.15));
    opacity: 0;
    transition: opacity 0.25s ease;
  }
  .load-more-btn:hover {
    background: rgba(240, 147, 251, 0.18);
    border-color: rgba(240, 147, 251, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(240, 147, 251, 0.3);
  }
  .load-more-btn:hover::before {
    opacity: 1;
  }
  .load-more-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(240, 147, 251, 0.2);
  }
  .load-more-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
  @media (min-width: 769px) and (max-width: 1024px) {
    .filters-tabs {
      gap: 6px;
    }
    .tab {
      font-size: 12px;
      padding: 8px 10px;
      min-height: 34px;
    }
  }
  @media (max-width: 768px) {
    .filters-panel {
      max-width: 100% !important;
      padding: 12px 14px 14px !important;
      border-radius: 20px !important;
      margin: 5px 0 2em 0 !important;
    }
    .filters-fav {
      padding: 10px 12px !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
    }
    .filters-fav__left {
      flex: 1 !important;
      min-width: 0 !important;
    }
    .filters-fav__icon {
      font-size: 18px !important;
    }
    .filters-fav__title {
      font-size: 13px !important;
      font-weight: 700 !important;
    }
    .filters-fav__btn {
      font-size: 11px !important;
      padding: 6px 12px !important;
      min-height: 32px !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1) !important;
    }
    .fxc__row1 {
      gap: var(--gap-2) !important;
    }
    .fxc__title {
      font-size: 0.9rem !important;
    }
    .fxc__state {
      font-size: 0.7rem !important;
      padding: 0.15rem 0.4rem !important;
    }
    .fxc__row2 {
      gap: var(--gap-1) !important;
      padding-bottom: 0.15rem !important;
    }
    .segment {
      gap: 0.2rem !important;
      padding: 0.15rem !important;
    }
    .seg {
      font-size: 0.8rem !important;
      padding: 0.3rem 0.5rem !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1) !important;
    }
    .search-c {
      height: 32px !important;
      max-width: 280px !important;
    }
    .search-c__input {
      font-size: 0.85rem !important;
    }
    .search-c:focus-within .search-c__input {
      width: 120px !important;
    }
    .quick-row {
      gap: var(--gap-1) !important;
    }
    .q {
      height: 30px !important;
      min-width: fit-content !important;
      font-size: 0.8rem !important;
      padding: 0.2rem 0.6rem !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1) !important;
    }
    .q .badge {
      min-width: 16px !important;
      height: 16px !important;
      font-size: 0.65rem !important;
    }
    /* Estilos para la fila de búsqueda expandida en mobile */
    .filters-search-expanded {
      margin-top: 6px !important;
      padding: 6px 0 !important;
    }
    .filters-search-expanded input {
      font-size: 13px !important;
      padding: 10px 12px 10px 38px !important;
    }
    .filters-search-expanded button {
      font-size: 11px !important;
      padding: 10px 14px !important;
      min-height: 40px !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1) !important;
    }
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
    .section-header {
      margin-bottom: 1.5rem !important;
      padding: 0 0.25rem !important;
    }
    .section-title-text {
      font-size: 1.5rem !important;
      margin-bottom: 0.5rem !important;
    }
    .section-title-underline {
      width: 50px !important;
      height: 3px !important;
    }
  }
  @media (max-width: 480px) {
    .filters-panel {
      padding: 10px 12px 12px !important;
      border-radius: 18px !important;
      margin: 5px 0 2em 0 !important;
    }
    .filters-fav {
      padding: 8px 10px !important;
      gap: 6px !important;
    }
    .filters-fav__icon {
      font-size: 17px !important;
    }
    .filters-fav__title {
      font-size: 12px !important;
      font-weight: 700 !important;
    }
    .filters-fav__btn {
      font-size: 10px !important;
      padding: 5px 10px !important;
      min-height: 30px !important;
    }
    .filters-box {
      padding: 8px 8px 10px !important;
      border-radius: 12px !important;
    }
    .filters-box__header {
      margin-bottom: 8px !important;
    }
    .filters-box__title {
      font-size: 11px !important;
      font-weight: 700 !important;
    }
    .filters-box__icon {
      font-size: 15px !important;
    }
    .filters-box__badge {
      font-size: 9px !important;
      padding: 2px 6px !important;
      min-height: 16px !important;
    }
    .filters-chips {
      gap: 5px !important;
      padding: 5px 3px 3px !important;
    }
    .chip {
      font-size: 10px !important;
      padding: 7px 11px !important;
      min-height: 34px !important;
      gap: 5px !important;
    }
    .chip__icon {
      font-size: 12px !important;
    }
    .chip__badge {
      min-width: 15px !important;
      height: 15px !important;
      font-size: 8px !important;
    }
    .filters-search-expanded {
      margin-top: 5px !important;
      padding: 5px 0 !important;
    }
    .filters-search-expanded input {
      font-size: 12px !important;
      padding: 9px 12px 9px 36px !important;
    }
    .filters-search-expanded button {
      font-size: 10px !important;
      padding: 9px 12px !important;
      min-height: 38px !important;
    }
    .filters-tabs {
      padding: 3px 0 7px 0 !important;
      margin: 0 -1px !important;
      gap: 5px !important;
      padding-left: 1px !important;
      padding-right: 1px !important;
    }
    .filters-tabs::-webkit-scrollbar {
      height: 5px !important;
    }
    .tab {
      font-size: 11px !important;
      padding: 10px 14px !important;
      min-height: 40px !important;
      min-width: fit-content !important;
      flex: 0 0 auto !important;
      white-space: nowrap !important;
      position: relative !important;
      z-index: 1 !important;
      pointer-events: auto !important;
      border-radius: 18px !important;
    }
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
    .section-header {
      margin-bottom: 1.25rem !important;
      padding: 0 0.15rem !important;
    }
    .section-title-text {
      font-size: 1.25rem !important;
      margin-bottom: 0.4rem !important;
    }
    .section-title-underline {
      width: 45px !important;
      height: 3px !important;
    }
  }
  @media (max-width: 430px) {
    .wrap {
      padding: 0 0.75rem 1.5rem !important;
    }
    .section-container {
      margin-bottom: 2.25rem !important;
    }
    .section-header {
      margin-bottom: 1.25rem !important;
      padding: 0 0.1rem !important;
    }
    .section-title-text {
      font-size: 1.15rem !important;
      margin-bottom: 0.35rem !important;
    }
    .section-title-underline {
      width: 40px !important;
      height: 2.5px !important;
    }
    .filters-panel {
      padding: 9px 10px 11px !important;
      border-radius: 16px !important;
      margin: 5px 0 2em 0 !important;
    }
    .filters-fav {
      padding: 7px 9px !important;
    }
    .filters-fav__icon {
      font-size: 16px !important;
    }
    .filters-fav__title {
      font-size: 11px !important;
    }
    .filters-fav__btn {
      font-size: 9px !important;
      padding: 4px 9px !important;
      min-height: 28px !important;
    }
    .fxc__title {
      font-size: 0.8rem !important;
    }
    .fxc__state {
      font-size: 0.6rem !important;
    }
    .seg {
      font-size: 0.7rem !important;
      padding: 0.2rem 0.35rem !important;
    }
    .search-c {
      height: 28px !important;
      max-width: 200px !important;
    }
    .search-c:focus-within .search-c__input {
      width: 80px !important;
    }
    .q {
      height: 26px !important;
      min-width: fit-content !important;
      font-size: 0.7rem !important;
      padding: 0.15rem 0.45rem !important;
    }
    .q .badge {
      min-width: 12px !important;
      height: 12px !important;
      font-size: 0.55rem !important;
    }
    .filters-search-expanded {
      margin-top: 4px !important;
      padding: 4px 0 !important;
    }
    .filters-search-expanded input {
      font-size: 11px !important;
      padding: 8px 10px 8px 34px !important;
    }
    .filters-search-expanded button {
      font-size: 9px !important;
      padding: 8px 10px !important;
      min-height: 36px !important;
    }
    .filters-tabs {
      padding: 2px 0 6px 0 !important;
      gap: 4px !important;
    }
    .filters-tabs::-webkit-scrollbar {
      height: 4px !important;
    }
    .tab {
      font-size: 10px !important;
      padding: 9px 12px !important;
      min-height: 36px !important;
      min-width: fit-content !important;
      flex: 0 0 auto !important;
      white-space: nowrap !important;
      border-radius: 16px !important;
    }
    .panel {
      margin: 0.5rem 0 !important;
      padding: 0.75rem 0.8rem !important;
      border-radius: 12px !important;
    }
    .cards-grid {
      gap: 0.9rem !important;
      padding: 0.5rem 0 !important;
    }
    .card-skeleton {
      height: 210px !important;
      border-radius: 12px !important;
    }
    .section-container > .explore-slider {
      margin: 0 -0.15rem !important;
    }
  }
`;

function Section({ title, toAll, children, count, sectionId }: { title: string; toAll: string; children: React.ReactNode; count?: number; sectionId?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="section-container"
      data-section-id={sectionId}
      style={{
        marginBottom: '4rem',
        position: 'relative',
        scrollMarginTop: '100px'
      }}
    >
      {children}
    </motion.section>
  );
}

export default function ExploreHomeScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { filters, set } = useExploreFilters();
  const selectedType = filters.type;
  const showAll = !selectedType || selectedType === 'all';
  // DEV-only instrumentation helper (safe in prod)
  // Note: Vite does not define __DEV__ by default; we emulate it here.
  const __DEV__ = import.meta.env.DEV;
  const __DEV_LOG = React.useCallback((...args: any[]) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log("[ExploreHome]", ...args);
    }
  }, [__DEV__]);
  const ritmosPillRef = React.useRef<HTMLButtonElement | null>(null);
  const zonasPillRef = React.useRef<HTMLButtonElement | null>(null);
  const fechasPillRef = React.useRef<HTMLButtonElement | null>(null);
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });
  const [hasAppliedDefaults, setHasAppliedDefaults] = React.useState(false);
  const [usingFavoriteFilters, setUsingFavoriteFilters] = React.useState(false);
  const [openFilterDropdown, setOpenFilterDropdown] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  // Navegación entre secciones (solo móvil)
  const scrollToSection = React.useCallback((direction: 'up' | 'down') => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.section-container'));
    if (sections.length === 0) return;

    // Determinar sección "actual" usando el scroll real (no el centro),
    // para que "up" no caiga en la misma sección.
    const headerOffset = 110; // un poco más que el header fijo
    const y = window.scrollY + headerOffset + 1;

    const tops = sections.map((el) => el.getBoundingClientRect().top + window.scrollY);
    let currentIndex = 0;
    for (let i = 0; i < tops.length; i++) {
      if (tops[i] <= y) currentIndex = i;
      else break;
    }

    const nextIndex =
      direction === 'down'
        ? Math.min(sections.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);

    const target = sections[nextIndex];
    if (!target) return;

    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = targetTop - headerOffset;
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
  }, []);

  const { data: allTags } = useTags();
  const { usedRitmoIds, usedZonaIds } = useUsedFilterTags();
  const { groups: zonaCatalogGroups } = useZonaCatalogGroups(
    (allTags as any[])?.filter((t: any) => t?.tipo === "zona") ?? null,
  );

  const usedRitmos = React.useMemo(() => {
    const ritmos = (allTags as any[])?.filter((t: any) => t?.tipo === "ritmo") ?? [];
    if (!usedRitmoIds?.length) return ritmos;
    const set = new Set(usedRitmoIds);
    return ritmos.filter((r: any) => set.has(r.id));
  }, [allTags, usedRitmoIds]);

  const usedZonas = React.useMemo(() => {
    const zonas = (allTags as any[])?.filter((t: any) => t?.tipo === "zona") ?? [];
    if (!usedZonaIds?.length) return zonas;
    const set = new Set(usedZonaIds);
    return zonas.filter((z: any) => set.has(z.id));
  }, [allTags, usedZonaIds]);

  const ritmoTreeGroups = React.useMemo(
    () => groupRitmos(usedRitmos.map((r: any) => ({ id: r.id, nombre: r.nombre, slug: r.slug }))),
    [usedRitmos],
  );

  const zonaTreeGroups = React.useMemo(() => {
    const usedSet = new Set(usedZonaIds);
    const filtered = zonaCatalogGroups
      .map((g) => ({ ...g, items: g.items.filter((it) => usedSet.has(it.id)) }))
      .filter((g) => g.items.length > 0);
    return usedZonaIds.length ? zonaGroupsToTreeGroups(filtered) : zonaGroupsToTreeGroups(zonaCatalogGroups);
  }, [zonaCatalogGroups, usedZonaIds]);

  const { preferences, applyDefaultFilters, loading: prefsLoading } = useUserFilterPreferences();
  const { showToast } = useToast();

  const qDebounced = useDebouncedValue(filters.q || '', 300);
  const qDeferred = React.useDeferredValue(qDebounced);

  const hasConfiguredFavorites = React.useMemo(
    () => !!(preferences && (preferences as any).id),
    [preferences]
  );

  const sliderProps = React.useMemo(
    () => ({
      className: isMobile ? 'explore-slider explore-slider--mobile' : 'explore-slider',
      // No pasar autoColumns en mobile - el componente HorizontalSlider ya tiene estilos CSS para mobile
      autoColumns: undefined,
      // En escritorio, deshabilitar scroll dentro del carrusel (evita que se “trabe” la interacción/scroll de la página)
      disableDesktopScroll: true,
      // Botones Anterior/Siguiente visibles en escritorio; en móvil los oculta el CSS del HorizontalSlider
      showNavButtons: !isMobile,
    }),
    [isMobile]
  );

  // ✅ Opción A (RECOMENDADA): autoColumns explícito SOLO para maestros en mobile
  const maestrosSliderProps = React.useMemo(
    () => ({
      className: isMobile ? 'explore-slider explore-slider--mobile' : 'explore-slider',
      // Ajusta el valor según lo que acepte tu HorizontalSlider:
      // - si acepta string CSS: '80%' / 'min(320px, 85vw)'
      // - si acepta número: 280 / 320
      autoColumns: isMobile ? '80%' : undefined,
      // En escritorio, deshabilitar scroll dentro del carrusel (evita que se “trabe” la interacción/scroll de la página)
      disableDesktopScroll: true,
      // Botones Anterior/Siguiente visibles en escritorio
      showNavButtons: !isMobile,
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

  // Guard rail: asegurar overlay-root (para casos de WebView/PWA o HTML cacheado)
  // COMENTADO: Cortina deshabilitada
  // React.useEffect(() => {
  //   if (typeof document === 'undefined') return;
  //   const existing = document.getElementById('overlay-root');
  //   if (existing) return;

  //   const el = document.createElement('div');
  //   el.id = 'overlay-root';
  //   el.style.position = 'fixed';
  //   el.style.inset = '0';
  //   el.style.pointerEvents = 'none';
  //   el.style.zIndex = '2147483647';
  //   // Aislar stacking context para que nada quede "encima" accidentalmente
  //   (el.style as any).isolation = 'isolate';
  //   document.body.appendChild(el);
  // }, []);

  const shouldShowSectionNav =
    typeof window !== 'undefined' ? window.innerWidth < 769 : isMobile;

  const computePresetRange = React.useCallback((preset: DatePreset) => {
    const todayCDMX = getTodayCDMX();
    const todayDate = new Date(todayCDMX + "T12:00:00");

    if (preset === "todos") return { from: undefined, to: undefined };
    if (preset === "hoy") return { from: todayCDMX, to: todayCDMX };
    if (preset === "manana") {
      const manana = addDays(todayDate, 1).toISOString().slice(0, 10);
      return { from: manana, to: manana };
    }
    if (preset === "semana") {
      const from = todayCDMX;
      const to = addDays(todayDate, 6).toISOString().slice(0, 10);
      return { from, to };
    }
    if (preset === "fin_de_semana") {
      const day = todayDate.getDay();
      const daysUntilSat = day <= 6 ? (6 - day + 7) % 7 : 0;
      const sat = addDays(todayDate, daysUntilSat === 0 ? 7 : daysUntilSat);
      const sun = addDays(sat, 1);
      return {
        from: sat.toISOString().slice(0, 10),
        to: sun.toISOString().slice(0, 10),
      };
    }
    if (preset === "siguientes") {
      const from = addDays(todayDate, 7).toISOString().slice(0, 10);
      return { from, to: undefined };
    }
    return { from: undefined, to: undefined };
  }, []);

  React.useEffect(() => {
    // Solo aplicar preset si no hay fechaPreset undefined (fechas manuales)
    // Si datePreset es undefined, significa que el usuario está usando fechas manuales
    if (filters.datePreset === undefined) {
      // No hacer nada, mantener las fechas manuales
      return;
    }
    
    const preset = filters.datePreset || 'todos';
    const { from, to } = computePresetRange(preset);
    // Solo actualizar si las fechas realmente cambiaron para evitar loops infinitos
    if (filters.dateFrom !== from || filters.dateTo !== to) {
      set({ dateFrom: from, dateTo: to });
    }
  }, [filters.datePreset, filters.dateFrom, filters.dateTo, computePresetRange, set]);

  React.useEffect(() => {
    if (!user || prefsLoading || hasAppliedDefaults) return;
    setHasAppliedDefaults(true);
  }, [user, prefsLoading, hasAppliedDefaults]);

  const stableRitmos = useStableArray(filters.ritmos);
  const stableZonas = useStableArray(filters.zonas);

  const ritmoNameById = React.useMemo(() => {
    const m = new Map<number, string>();
    for (const t of (allTags || []) as any[]) {
      if (t?.tipo === 'ritmo' && typeof t?.id === 'number') m.set(t.id, String(t?.nombre || `Ritmo #${t.id}`));
    }
    return m;
  }, [allTags]);
  const ritmoIdBySlug = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const t of (allTags || []) as any[]) {
      if (t?.tipo === 'ritmo' && typeof t?.id === 'number' && typeof t?.slug === 'string') {
        m.set(String(t.slug).trim().toLowerCase(), t.id);
      }
    }
    return m;
  }, [allTags]);

  const zonaNameById = React.useMemo(() => {
    const m = new Map<number, string>();
    for (const t of (allTags || []) as any[]) {
      if (t?.tipo === 'zona' && typeof t?.id === 'number') m.set(t.id, String(t?.nombre || `Zona #${t.id}`));
    }
    return m;
  }, [allTags]);
  const zonaIdBySlug = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const t of (allTags || []) as any[]) {
      if (t?.tipo === 'zona' && typeof t?.id === 'number' && typeof t?.slug === 'string') {
        m.set(String(t.slug).trim().toLowerCase(), t.id);
      }
    }
    return m;
  }, [allTags]);

  React.useEffect(() => {
    if (!hasAppliedDefaults) return;

    if (!hasConfiguredFavorites) {
      setUsingFavoriteFilters(false);
      return;
    }

    if (!preferences) {
      setUsingFavoriteFilters(false);
      return;
    }

    const defaultFilters = applyDefaultFilters();
    const defaultRitmos = [...defaultFilters.ritmos];
    const defaultZonas = [...defaultFilters.zonas];

    const ritmosMatch = JSON.stringify([...stableRitmos].sort()) === JSON.stringify([...defaultRitmos].sort());
    const zonasMatch = JSON.stringify([...stableZonas].sort()) === JSON.stringify([...defaultZonas].sort());

    let fechasMatch = true;
    if (defaultFilters.fechaDesde || defaultFilters.fechaHasta) {
      const defaultFrom = defaultFilters.fechaDesde ? defaultFilters.fechaDesde.toISOString().slice(0, 10) : null;
      const defaultTo = defaultFilters.fechaHasta ? defaultFilters.fechaHasta.toISOString().slice(0, 10) : null;
      fechasMatch = filters.dateFrom === defaultFrom && filters.dateTo === defaultTo;
    } else {
      fechasMatch = !filters.dateFrom && !filters.dateTo;
    }

    const matchesDefaults = ritmosMatch && zonasMatch && fechasMatch;
    setUsingFavoriteFilters(matchesDefaults);
  }, [stableRitmos, stableZonas, filters.dateFrom, filters.dateTo, preferences, applyDefaultFilters, hasAppliedDefaults, hasConfiguredFavorites]);

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

  const todayYmd = React.useMemo(() => getTodayCDMX(), []);

  const applyDatePreset = React.useCallback(
    (preset: DatePreset) => {
      if (filters.datePreset === preset) return;
      startTransition(() => {
        const { from, to } = computePresetRange(preset);
        set({ datePreset: preset, dateFrom: from, dateTo: to });
      });
    },
    [filters.datePreset, computePresetRange, set, startTransition],
  );

  const applyDateFilter = React.useCallback(
    (from: string | undefined, to: string | undefined) => {
      startTransition(() => {
        if (!from && !to) {
          set({ datePreset: "todos", dateFrom: undefined, dateTo: undefined });
        } else {
          set({ datePreset: undefined, dateFrom: from, dateTo: to });
        }
      });
    },
    [set, startTransition],
  );

  const dateSummaryText = React.useMemo(() => {
    const preset = filters.datePreset ?? "todos";
    if (preset === "todos" && !filters.dateFrom && !filters.dateTo) return "Todos";
    if (preset === "hoy") return "Hoy";
    if (preset === "manana") return "Mañana";
    if (preset === "semana") return "Esta semana";
    if (preset === "fin_de_semana") return "Fin de semana";
    if (preset === "siguientes") return "Siguientes";
    if (filters.dateFrom && filters.dateTo) {
      const from = filters.dateFrom;
      const to = filters.dateTo;
      if (from === to) return from;
      const fmt = (s: string) => {
        const [y, m, d] = s.split("-");
        const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
        return `${Number(d)} ${months[Number(m) - 1]}`;
      };
      return `Del ${fmt(from)} al ${fmt(to)}`;
    }
    if (filters.dateFrom) return `Desde ${filters.dateFrom}`;
    if (filters.dateTo) return `Hasta ${filters.dateTo}`;
    return "Todos";
  }, [filters.datePreset, filters.dateFrom, filters.dateTo]);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.type !== 'all') count += 1;
    if (filters.q) count += 1;
    count += stableRitmos.length;
    count += stableZonas.length;
    if (filters.dateFrom || filters.dateTo) count += 1;
    return count;
  }, [filters.type, filters.q, stableRitmos.length, stableZonas.length, filters.dateFrom, filters.dateTo]);

  // Memoizar handlePreNavigate para evitar re-renders de cards
  const handlePreNavigate = React.useCallback(() => {
    try { if ('scrollRestoration' in window.history) { (window.history as any).scrollRestoration = 'manual'; } } catch { }
    try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch { }
  }, []);


  const renderClaseItem = React.useCallback((item: any, idx: number) => {
    if (__DEV__ && (idx === 0 || idx % 20 === 0)) {
      __DEV_LOG("renderItem", { type: "clases", idx, ownerType: item?.ownerType, ownerId: item?.ownerId, titulo: item?.titulo });
    }
    if (item?.__isCTA) {
      return (
        <motion.div
          key="cta-clases"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05, duration: 0.3 }}
          whileHover={{ y: -4, scale: 1.02 }}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 0,
            overflow: 'hidden',
            boxShadow: 'none'
          }}
        >
          <CTACard text={t('cta_classes')} sectionType="clases" idx={idx} />
        </motion.div>
      );
    }
    return (
      <ClaseItem 
        key={`${item.ownerType || 'owner'}-${item.ownerId ?? 'unknown'}-${item.titulo ?? 'class'}-${item.fecha ?? (Array.isArray(item.diasSemana) ? item.diasSemana.join('-') : 'semana')}-${idx}`} 
        clase={item} 
        idx={idx} 
        handlePreNavigate={handlePreNavigate} 
      />
    );
  }, [__DEV__, __DEV_LOG, handlePreNavigate, t]);

  const shouldLoadFechas = showAll || selectedType === 'fechas';
  const fechasQuery = useExploreQuery({
    type: 'fechas',
    q: qDeferred || undefined,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    pageSize: 48,
    enabled: shouldLoadFechas
  });
  const fechasLoadMore = useLoadMoreOnDemand(shouldLoadFechas ? fechasQuery : null);
  const fechasLoading = fechasQuery.isLoading;
  const fechasError = (fechasQuery as any).isError;
  const fechasErrObj = (fechasQuery as any).error;
  const fechasData = React.useMemo(() => {
    if (!shouldLoadFechas) return [];
    return flattenQueryData(fechasQuery.data);
  }, [fechasQuery.data, shouldLoadFechas]);

  const filteredFechas = React.useMemo(() => {
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
    const allFechas = fechasData.filter((d: any) => d?.estado_publicacion === 'publicado');
    const includePastEvents = !!qDeferred && qDeferred.trim().length > 0;
    const dateFrom = filters.dateFrom ? parseYmdToDate(filters.dateFrom) : null;
    const dateTo = filters.dateTo ? parseYmdToDate(filters.dateTo) : null;
    const hasDateRange = dateFrom !== null || dateTo !== null;

    const upcoming = allFechas.filter((fecha: any) => {
      if (includePastEvents) return true;

      const fechaDate = parseYmdToDate(fecha?.fecha);
      if (!fechaDate || !todayBase) return true;

      // Extraer fecha en formato YYYY-MM-DD para comparación directa (evita problemas de zona horaria)
      const fechaDateStr = fecha?.fecha ? String(fecha.fecha).split('T')[0] : null;
      if (!fechaDateStr) return true; // Si no hay fecha, incluir

      const todayDateOnly = new Date(Date.UTC(
        todayBase.getUTCFullYear(),
        todayBase.getUTCMonth(),
        todayBase.getUTCDate(),
        0, 0, 0
      ));

      // Si hay rango de fechas, verificar que la fecha del evento esté dentro del rango
        if (hasDateRange) {
        // ✅ CORRECCIÓN: Comparar strings YYYY-MM-DD directamente para evitar problemas de zona horaria
        // Esto asegura que eventos del 7, 8, 9 y 10 de febrero se incluyan si el rango es 7-10
        
        // Para eventos recurrentes, verificar que la fecha calculada esté en el rango
        if (fecha._recurrence_index !== undefined) {
          // fechaDateStr ya está en formato YYYY-MM-DD
          if (filters.dateFrom && fechaDateStr < filters.dateFrom) return false;
          if (filters.dateTo && fechaDateStr > filters.dateTo) return false;
          return true; // Si está en el rango, incluir
        }
        
        // Para eventos sin recurrencia, verificar que esté en el rango
        // Incluir TODOS los eventos que ocurran en días dentro del rango
        // No importa si terminan antes, si el evento es de un día dentro del rango, se incluye
        if (filters.dateFrom && fechaDateStr < filters.dateFrom) return false;
        if (filters.dateTo && fechaDateStr > filters.dateTo) return false;
        // Si pasa ambas verificaciones, está en el rango, incluir
        return true;
      }

      // Si no hay rango de fechas, solo mostrar eventos futuros
      if (fecha._recurrence_index !== undefined) {
        // Eventos recurrentes siempre futuros si tienen _recurrence_index
        return true;
      }
      
      // Comparar fechas para eventos futuros (usar fechaDateStr si está disponible)
      if (fechaDateStr) {
        const todayStr = getTodayCDMX();
        return fechaDateStr >= todayStr;
      }
      
      // Fallback a comparación de Date si no hay fechaDateStr
      const fechaDateOnly = new Date(Date.UTC(
        fechaDate.getUTCFullYear(),
        fechaDate.getUTCMonth(),
        fechaDate.getUTCDate(),
        0, 0, 0
      ));
      return fechaDateOnly >= todayDateOnly;
    });

    const sorted = [...upcoming].sort((a: any, b: any) => {
      const parseYmd = (value?: string | null) => parseYmdToDate(value);
      const dateA = parseYmd(a?.fecha);
      const dateB = parseYmd(b?.fecha);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.getTime() - dateB.getTime();
    });

    return sorted;
  }, [fechasData, todayYmd, qDeferred, filters.dateFrom, filters.dateTo]);

  const shouldLoadMaestros = showAll || selectedType === 'maestros' || selectedType === 'clases';
  const maestrosQuery = useExploreQuery({
    type: 'maestros',
    q: qDeferred || undefined,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: 48,
    enabled: shouldLoadMaestros
  });
  const maestrosLoadMore = useLoadMoreOnDemand(shouldLoadMaestros ? maestrosQuery : null);
  const maestrosLoading = maestrosQuery.isLoading;
  const maestrosError = (maestrosQuery as any).isError;
  const maestrosErrObj = (maestrosQuery as any).error;
  const maestrosData = React.useMemo(() => {
    if (!shouldLoadMaestros) return [];
    return flattenQueryData(maestrosQuery.data);
  }, [maestrosQuery.data, shouldLoadMaestros]);

  const shouldLoadOrganizadores = showAll || selectedType === 'organizadores';
  const organizadoresQuery = useExploreQuery({
    type: 'organizadores',
    q: qDeferred || undefined,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: 48,
    enabled: shouldLoadOrganizadores
  });
  const organizadoresLoadMore = useLoadMoreOnDemand(shouldLoadOrganizadores ? organizadoresQuery : null);
  const organizadoresLoading = organizadoresQuery.isLoading;
  const organizadoresError = (organizadoresQuery as any).isError;
  const organizadoresErrObj = (organizadoresQuery as any).error;
  const organizadoresData = React.useMemo(() => {
    if (!shouldLoadOrganizadores) return [];
    return flattenQueryData(organizadoresQuery.data);
  }, [organizadoresQuery.data, shouldLoadOrganizadores]);

  const shouldLoadAcademias = showAll || selectedType === 'academias' || selectedType === 'clases';
  const academiasQuery = useExploreQuery({
    type: 'academias',
    q: qDeferred || undefined,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: 48,
    enabled: shouldLoadAcademias
  });
  const academiasLoadMore = useLoadMoreOnDemand(shouldLoadAcademias ? academiasQuery : null);
  const academiasLoading = academiasQuery.isLoading;
  const academiasError = (academiasQuery as any).isError;
  const academiasErrObj = (academiasQuery as any).error;
  const academiasData = React.useMemo(() => {
    if (!shouldLoadAcademias) return [];
    return flattenQueryData(academiasQuery.data);
  }, [academiasQuery.data, shouldLoadAcademias]);

  const shouldLoadMarcas = showAll || selectedType === 'marcas';
  const marcasQuery = useExploreQuery({
    type: 'marcas',
    q: qDeferred || undefined,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: 48,
    enabled: shouldLoadMarcas
  });
  const marcasLoadMore = useLoadMoreOnDemand(shouldLoadMarcas ? marcasQuery : null);
  const marcasLoading = marcasQuery.isLoading;
  const marcasData = React.useMemo(() => {
    if (!shouldLoadMarcas) return [];
    return flattenQueryData(marcasQuery.data);
  }, [marcasQuery.data, shouldLoadMarcas]);

  const shouldLoadUsuarios = showAll || selectedType === 'usuarios';
  const usuariosQuery = useExploreQuery({
    type: 'usuarios' as any,
    q: qDeferred || undefined,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: 100, // Aumentar pageSize para cargar más usuarios por página
    enabled: shouldLoadUsuarios
  });
  const usuariosLoadMore = useLoadMoreOnDemand(shouldLoadUsuarios ? usuariosQuery : null);
  const usuariosLoading = usuariosQuery.isLoading;
  const usuariosData = React.useMemo(() => {
    if (!shouldLoadUsuarios) return [];
    return flattenQueryData(usuariosQuery.data);
  }, [usuariosQuery.data, shouldLoadUsuarios]);

  // Cargar automáticamente todas las páginas de usuarios para mostrar todos sin límite
  const usuariosAutoLoadRef = React.useRef(false);
  React.useEffect(() => {
    if (!shouldLoadUsuarios || !usuariosQuery.data) {
      usuariosAutoLoadRef.current = false;
      return;
    }
    
    // Si hay más páginas y no se está cargando, cargar la siguiente página automáticamente
    if (usuariosQuery.hasNextPage && !usuariosQuery.isFetchingNextPage && !usuariosQuery.isLoading && !usuariosAutoLoadRef.current) {
      usuariosAutoLoadRef.current = true;
      usuariosQuery.fetchNextPage()
        .then(() => {
          usuariosAutoLoadRef.current = false;
        })
        .catch((err) => {
          usuariosAutoLoadRef.current = false;
          if (process.env.NODE_ENV === 'development') {
            console.warn('[ExploreHomeScreen] Error cargando más usuarios:', err);
          }
        });
    } else if (!usuariosQuery.hasNextPage) {
      usuariosAutoLoadRef.current = false;
    }
  }, [shouldLoadUsuarios, usuariosQuery.hasNextPage, usuariosQuery.isFetchingNextPage, usuariosQuery.isLoading, usuariosQuery.data, usuariosQuery.fetchNextPage]);

  const classesList = React.useMemo(() => {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const allA = academiasData;
    const allM = maestrosData;

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

    const dayNameToNumber = (dayName: string | number): number | null => {
      if (typeof dayName === 'number' && dayName >= 0 && dayName <= 6) {
        return dayName;
      }
      const normalized = String(dayName).toLowerCase().trim();
      const map: Record<string, number> = {
        'domingo': 0, 'dom': 0,
        'lunes': 1, 'lun': 1,
        'martes': 2, 'mar': 2,
        'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3,
        'jueves': 4, 'jue': 4,
        'viernes': 5, 'vie': 5,
        'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6,
      };
      return map[normalized] ?? null;
    };

    const mapClase = (owner: any, c: any, ownerType: 'academy' | 'teacher', cronogramaIndex: number) => {
      const baseClase = {
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
        cronogramaIndex
      };

      if (baseClase.diasSemana && Array.isArray(baseClase.diasSemana) && baseClase.diasSemana.length > 1) {
        const expanded: any[] = [];
        for (const dayStr of baseClase.diasSemana) {
          const dayNum = dayNameToNumber(dayStr);
          if (dayNum !== null) {
            expanded.push({
              ...baseClase,
              diaSemana: dayNum,
              diasSemana: [dayStr],
            });
          }
        }
        return expanded.length > 0 ? expanded : [baseClase];
      }

      return [baseClase];
    };

    const fromAcademies = allA.flatMap((ac: any) => {
      const cronogramaData = ac?.cronograma || ac?.horarios || [];
      return Array.isArray(cronogramaData)
        ? cronogramaData.flatMap((c: any, idx: number) => mapClase(ac, c, 'academy', idx))
        : [];
    });
    const fromTeachers = allM.flatMap((tc: any) => {
      const cronogramaData = tc?.cronograma || tc?.horarios || [];
      return Array.isArray(cronogramaData)
        ? cronogramaData.flatMap((c: any, idx: number) => mapClase(tc, c, 'teacher', idx))
        : [];
    });

    const merged = [...fromAcademies, ...fromTeachers].filter(x => x && (x.titulo || x.fecha || (x.diasSemana && x.diasSemana[0])));
    const weekdayIndex = (name: string) => dayNames.findIndex(d => d.toLowerCase() === String(name).toLowerCase());
    const nextOccurrence = (c: any): Date | null => {
      try {
        if (c.fecha) {
          return parseYmdToDate(c.fecha);
        }
        const days: string[] = Array.isArray(c.diasSemana) ? c.diasSemana : [];
        if (!days.length) return null;
        const today = new Date();
        const todayIdx = today.getDay();
        let minDelta: number | null = null;
        for (const dn of days) {
          const idx = weekdayIndex(dn);
          if (idx < 0) continue;
          const delta = idx >= todayIdx
            ? idx - todayIdx
            : (idx - todayIdx + 7) % 7;
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
    const includePastClasses = !!qDeferred && qDeferred.trim().length > 0;

    const matchesPresetAndRange = (item: any) => {
      const occurrence = nextOccurrence(item);
      if (occurrence && todayBase && !includePastClasses) {
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
    
    // Función helper para convertir hora HH:MM a minutos desde medianoche para comparación
    const timeToMinutes = (timeStr?: string | null): number | null => {
      if (!timeStr) return null;
      const parts = String(timeStr).trim().split(':');
      if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (Number.isFinite(hours) && Number.isFinite(minutes)) {
          return hours * 60 + minutes;
        }
      }
      return null;
    };
    
    const sorted = [...filtered].sort((a, b) => {
      // Primero ordenar por fecha
      const dateA = nextOccurrence(a);
      const dateB = nextOccurrence(b);
      if (!dateA && !dateB) {
        // Si ambas no tienen fecha, ordenar por hora
        const timeA = timeToMinutes(a.inicio);
        const timeB = timeToMinutes(b.inicio);
        if (timeA === null && timeB === null) return 0;
        if (timeA === null) return 1;
        if (timeB === null) return -1;
        return timeA - timeB;
      }
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      const dateDiff = dateA.getTime() - dateB.getTime();
      
      // Si las fechas son iguales (mismo día), ordenar por hora de inicio
      if (dateDiff === 0) {
        const timeA = timeToMinutes(a.inicio);
        const timeB = timeToMinutes(b.inicio);
        if (timeA === null && timeB === null) return 0;
        if (timeA === null) return 1; // Sin hora va al final
        if (timeB === null) return -1; // Sin hora va al final
        return timeA - timeB; // Ordenar por hora ascendente
      }
      
      return dateDiff;
    });
    return sorted;
  }, [academiasData, maestrosData, filters.datePreset, filters.dateFrom, filters.dateTo, qDeferred, todayYmd]);

  const validUsuarios = React.useMemo(
    () =>
      usuariosData.filter((u: any) => u && u.display_name && u.display_name.trim() !== ''),
    [usuariosData]
  );

  const hasFechas = filteredFechas.length > 0;
  const hasClases = classesList.length > 0;
  const hasAcademias = academiasData.length > 0;
  const hasUsuarios = validUsuarios.length > 0;
  const hasMaestros = maestrosData.length > 0;
  const hasOrganizadores = organizadoresData.length > 0;
  const hasMarcas = marcasData.length > 0;

  const itemsForAvailableFilters = React.useMemo(() => {
    // Contexto: “visible” según tipo actual (o all)
    const type = filters.type;
    if (!type || type === 'all') {
      return [
        ...filteredFechas,
        ...classesList,
        ...maestrosData,
        ...academiasData,
        ...validUsuarios,
        ...organizadoresData,
        ...marcasData,
      ];
    }
    if (type === 'fechas') return filteredFechas;
    if (type === 'clases') return classesList;
    if (type === 'maestros') return maestrosData;
    if (type === 'academias') return academiasData;
    if (type === 'usuarios') return validUsuarios;
    if (type === 'organizadores') return organizadoresData;
    if (type === 'marcas') return marcasData;
    return [];
  }, [filters.type, filteredFechas, classesList, maestrosData, academiasData, validUsuarios, organizadoresData, marcasData]);

  const availableFilters = React.useMemo(
    () => buildAvailableFilters(itemsForAvailableFilters, { ritmoNameById, zonaNameById, ritmoIdBySlug, zonaIdBySlug }),
    [itemsForAvailableFilters, ritmoNameById, zonaNameById, ritmoIdBySlug, zonaIdBySlug],
  );

  const prevContextRef = React.useRef<string>('');
  const contextKey = React.useMemo(() => {
    const qKey = String(qDeferred || '').trim().toLowerCase();
    return [
      filters.type,
      filters.datePreset ?? '',
      filters.dateFrom ?? '',
      filters.dateTo ?? '',
      qKey,
    ].join('|');
  }, [filters.type, filters.datePreset, filters.dateFrom, filters.dateTo, qDeferred]);

  React.useEffect(() => {
    // Solo ajustar automáticamente cuando cambia el “contexto base” (tipo/when/búsqueda),
    // no cuando el usuario cambia ritmos/zonas directamente.
    if (!prevContextRef.current) {
      prevContextRef.current = contextKey;
      return;
    }
    if (prevContextRef.current === contextKey) return;
    prevContextRef.current = contextKey;

    const nextRitmos = (filters.ritmos || []).filter((id) => availableFilters.ritmoIdSet.has(id));
    const nextZonas = (filters.zonas || []).filter((id) => availableFilters.zonaIdSet.has(id));
    const changed = nextRitmos.length !== (filters.ritmos || []).length || nextZonas.length !== (filters.zonas || []).length;
    if (!changed) return;

    set({ ritmos: nextRitmos, zonas: nextZonas });
    try {
      showToast?.('Filtros ajustados', 'info');
    } catch {
      // ignore
    }
  }, [contextKey, availableFilters.ritmoIdSet, availableFilters.zonaIdSet, filters.ritmos, filters.zonas, set, showToast]);

  // Calcular índices aleatorios estables para insertar CTAs
  const clasesCTIndex = useStableRandomIndex(classesList.length, 'clases');
  const academiasCTIndex = useStableRandomIndex(academiasData.length, 'academias');
  const maestrosCTIndex = useStableRandomIndex(maestrosData.length, 'maestros');
  const organizadoresCTIndex = useStableRandomIndex(organizadoresData.length, 'organizadores');
  const marcasCTIndex = useStableRandomIndex(marcasData.length, 'marcas');

  // Crear arrays con CTAs insertadas (solo si hay items)
  const classesListWithCTA = React.useMemo(() =>
    classesList.length > 0 ? createArrayWithCTA(classesList, clasesCTIndex, 'clases') : classesList,
    [classesList, clasesCTIndex]
  );
  const academiasDataWithCTA = React.useMemo(() =>
    academiasData.length > 0 ? createArrayWithCTA(academiasData, academiasCTIndex, 'academias') : academiasData,
    [academiasData, academiasCTIndex]
  );
  const maestrosDataWithCTA = React.useMemo(() =>
    maestrosData.length > 0 ? createArrayWithCTA(maestrosData, maestrosCTIndex, 'maestros') : maestrosData,
    [maestrosData, maestrosCTIndex]
  );
  const organizadoresDataWithCTA = React.useMemo(() =>
    organizadoresData.length > 0 ? createArrayWithCTA(organizadoresData, organizadoresCTIndex, 'organizadores') : organizadoresData,
    [organizadoresData, organizadoresCTIndex]
  );
  const marcasDataWithCTA = React.useMemo(() =>
    marcasData.length > 0 ? createArrayWithCTA(marcasData, marcasCTIndex, 'marcas') : marcasData,
    [marcasData, marcasCTIndex]
  );

  const anyLoading =
    fechasLoading ||
    academiasLoading ||
    maestrosLoading ||
    organizadoresLoading ||
    usuariosLoading ||
    marcasLoading;

  const noResultsAllTypes =
    showAll &&
    !anyLoading &&
    !hasFechas &&
    !hasClases &&
    !hasAcademias &&
    !hasUsuarios &&
    !hasMaestros &&
    !hasOrganizadores &&
    !hasMarcas;

  const handleFilterChange = (newFilters: typeof filters) => {
    set(newFilters);
  };

  const showQuickDateRanges = showAll || selectedType === 'fechas' || selectedType === 'clases';

  // -----------------------------
  // DEV instrumentation (runtime diagnosis)
  // -----------------------------
  const devSummary = React.useMemo(() => {
    return {
      userId: user?.id ?? null,
      selectedType,
      showAll,
      filters: {
        type: filters.type,
        q: (filters.q || "").slice(0, 40),
        ritmosCount: (filters.ritmos || []).length,
        zonasCount: (filters.zonas || []).length,
        datePreset: filters.datePreset ?? null,
        dateFrom: filters.dateFrom ?? null,
        dateTo: filters.dateTo ?? null,
      },
      enabled: {
        fechas: shouldLoadFechas,
        clases: (showAll || selectedType === 'clases'),
        academias: shouldLoadAcademias,
        maestros: shouldLoadMaestros,
        organizadores: shouldLoadOrganizadores,
        marcas: shouldLoadMarcas,
        usuarios: shouldLoadUsuarios,
      },
      query: {
        fechas: { isLoading: fechasQuery.isLoading, isError: (fechasQuery as any).isError, pages: fechasQuery.data?.pages?.length ?? 0 },
        academias: { isLoading: academiasQuery.isLoading, isError: (academiasQuery as any).isError, pages: academiasQuery.data?.pages?.length ?? 0 },
        maestros: { isLoading: maestrosQuery.isLoading, isError: (maestrosQuery as any).isError, pages: maestrosQuery.data?.pages?.length ?? 0 },
        organizadores: { isLoading: organizadoresQuery.isLoading, isError: (organizadoresQuery as any).isError, pages: organizadoresQuery.data?.pages?.length ?? 0 },
        marcas: { isLoading: marcasQuery.isLoading, isError: (marcasQuery as any).isError, pages: marcasQuery.data?.pages?.length ?? 0 },
        usuarios: { isLoading: usuariosQuery.isLoading, isError: (usuariosQuery as any).isError, pages: usuariosQuery.data?.pages?.length ?? 0 },
      },
      counts: {
        fechasRaw: fechasData.length,
        fechasFiltered: filteredFechas.length,
        academias: academiasData.length,
        maestros: maestrosData.length,
        organizadores: organizadoresData.length,
        marcas: marcasData.length,
        usuariosRaw: usuariosData.length,
        usuariosValid: validUsuarios.length,
        clases: classesList.length,
      },
      gates: {
        anyLoading,
        noResultsAllTypes,
      },
    };
  }, [
    user?.id,
    selectedType,
    showAll,
    filters.type,
    filters.q,
    filters.ritmos,
    filters.zonas,
    filters.datePreset,
    filters.dateFrom,
    filters.dateTo,
    shouldLoadFechas,
    shouldLoadAcademias,
    shouldLoadMaestros,
    shouldLoadOrganizadores,
    shouldLoadMarcas,
    shouldLoadUsuarios,
    fechasQuery.isLoading,
    (fechasQuery as any).isError,
    fechasQuery.data,
    academiasQuery.isLoading,
    (academiasQuery as any).isError,
    academiasQuery.data,
    maestrosQuery.isLoading,
    (maestrosQuery as any).isError,
    maestrosQuery.data,
    organizadoresQuery.isLoading,
    (organizadoresQuery as any).isError,
    organizadoresQuery.data,
    marcasQuery.isLoading,
    (marcasQuery as any).isError,
    marcasQuery.data,
    usuariosQuery.isLoading,
    (usuariosQuery as any).isError,
    usuariosQuery.data,
    fechasData.length,
    filteredFechas.length,
    academiasData.length,
    maestrosData.length,
    organizadoresData.length,
    marcasData.length,
    usuariosData.length,
    validUsuarios.length,
    classesList.length,
    anyLoading,
    noResultsAllTypes,
  ]);

  const devPrevRef = React.useRef<string>("");
  React.useEffect(() => {
    if (!__DEV__) return;
    const key = JSON.stringify(devSummary);
    if (devPrevRef.current === key) return;
    devPrevRef.current = key;
    __DEV_LOG("state", devSummary);
  }, [__DEV__, __DEV_LOG, devSummary]);

  // Log which conditional branch each section takes (DEV only).
  const devBranches = React.useMemo(() => {
    return {
      fechas: fechasLoading ? "loading" : fechasError ? "error" : filteredFechas.length > 0 ? "render" : "empty",
      clases:
        (academiasLoading || maestrosLoading) ? "loading"
        : (academiasError || maestrosError) ? "error"
        : classesList.length > 0 ? "render"
        : "empty",
      academias: academiasLoading ? "loading" : academiasData.length > 0 ? "render" : "empty",
      maestros: maestrosLoading ? "loading" : maestrosError ? "error" : maestrosData.length > 0 ? "render" : "empty",
      usuarios: usuariosLoading ? "loading" : validUsuarios.length > 0 ? "render" : "empty",
      organizadores: organizadoresLoading ? "loading" : organizadoresError ? "error" : organizadoresData.length > 0 ? "render" : "empty",
      marcas: marcasLoading ? "loading" : marcasData.length > 0 ? "render" : "empty",
    } as const;
  }, [
    fechasLoading,
    fechasError,
    filteredFechas.length,
    academiasLoading,
    maestrosLoading,
    academiasError,
    maestrosError,
    classesList.length,
    academiasData.length,
    maestrosError,
    maestrosData.length,
    usuariosLoading,
    validUsuarios.length,
    organizadoresLoading,
    organizadoresError,
    organizadoresData.length,
    marcasLoading,
    marcasData.length,
  ]);

  const devPrevBranchesRef = React.useRef<string>("");
  React.useEffect(() => {
    if (!__DEV__) return;
    const key = JSON.stringify(devBranches);
    if (devPrevBranchesRef.current === key) return;
    devPrevBranchesRef.current = key;
    __DEV_LOG("branches", devBranches);
  }, [__DEV__, __DEV_LOG, devBranches]);

  return (
    <>
      <SeoHead section="explore" />
      <style>{STYLES}</style>

      <div className="explore-container">
        <div className="wrap">
          <section className="filters-panel" style={{ marginTop: '5px', marginBottom: spacing[6], marginLeft: 'auto', marginRight: 'auto' }} role="region" aria-label={t('filters')}>
            {usingFavoriteFilters && user && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="filters-fav"
              >
                <div className="filters-fav__left">
                  <span className="filters-fav__icon">⭐</span>
                  <div>
                    <p className="filters-fav__title">{t('using_favorites')}</p>
                    <p style={{
                      margin: '0.25rem 0 0 0',
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.65)',
                      fontWeight: 400
                    }}>
                      {t('configure_in_profile')}{' '}
                      <Link
                        to="/profile"
                        style={{
                          color: 'rgba(147, 197, 253, 0.9)',
                          textDecoration: 'underline',
                          textUnderlineOffset: '2px',
                          fontWeight: 500
                        }}
                      >
                        {t('profile')}
                      </Link>
                    </p>
                  </div>
                </div>
                <button className="filters-fav__btn" type="button" onClick={resetToFavoriteFilters}>
                  <span>{t('reset_favorites')}</span>
                </button>
              </motion.div>
            )}

            <div className="filters-card">
              {/* Header + búsqueda en la misma fila */}
              <div className="filters-top-row">
                <div className="filters-title filters-top-row__title">
                  <span className="filters-icon" aria-hidden="true">⚙️</span>
                </div>

                <div className="filters-top-row__search">
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', gap: 8 }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 14,
                      fontSize: 16,
                      pointerEvents: 'none',
                      zIndex: 1,
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder={t('search_placeholder_expanded')}
                    value={filters.q || ''}
                    onChange={(e) => handleFilterChange({ ...filters, q: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 42px',
                      borderRadius: '999px',
                      border: filters.q ? '2px solid rgba(240, 147, 251, 0.6)' : '1px solid var(--fp-border-soft)',
                      background: filters.q ? 'rgba(240, 147, 251, 0.15)' : '#181b26',
                      color: 'var(--fp-text)',
                      fontSize: '13px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxShadow: filters.q
                        ? '0 0 0 3px rgba(240, 147, 251, 0.25), 0 4px 16px rgba(240, 147, 251, 0.25)'
                        : '0 2px 8px rgba(0, 0, 0, 0.2)',
                      fontFamily: 'inherit',
                    }}
                  />
                  {!!filters.q && (
                    <button
                      type="button"
                      onClick={() => handleFilterChange({ ...filters, q: '' })}
                      className="filters-search-clear-btn"
                      style={{
                        padding: '10px 16px',
                        borderRadius: '999px',
                        border: '1px solid var(--fp-border-soft)',
                        background: '#181b26',
                        color: 'var(--fp-text)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'rgba(255, 255, 255, 0.1)',
                      }}
                      aria-label={t('clear') || 'Limpiar'}
                    >
                      {t('clear')}
                    </button>
                  )}
                </div>
                </div>

                <div className="filters-top-row__actions">
                  {!usingFavoriteFilters && user && preferences && (
                    (preferences.ritmos && preferences.ritmos.length > 0) ||
                    (preferences.zonas && preferences.zonas.length > 0) ||
                    (preferences.date_range && preferences.date_range !== 'none')
                  ) && (
                    <button
                      type="button"
                      onClick={resetToFavoriteFilters}
                      className="filters-clear"
                      style={{ marginRight: activeFiltersCount > 0 ? 0 : undefined }}
                    >
                      <span style={{ fontSize: '0.75rem' }}>⭐</span>
                      <span>{t('activate_favorites')}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="filters-clear"
                    onClick={() => {
                      handleFilterChange({
                        ...filters,
                        type: 'all',
                        q: '',
                        ritmos: [],
                        zonas: [],
                        datePreset: 'todos',
                        dateFrom: undefined,
                        dateTo: undefined
                      });
                      setUsingFavoriteFilters(false);
                      setOpenFilterDropdown(null);
                    }}
                    aria-label={t('clear_all_filters')}
                  >
                    <span className="dot" aria-hidden="true" />
                    {activeFiltersCount > 0
                      ? (activeFiltersCount === 1
                        ? t('active_filters', { count: activeFiltersCount })
                        : t('active_filters_plural', { count: activeFiltersCount }))
                      : t('no_filters')}
                  </button>
                </div>
              </div>

              {/* Row 2: Ritmos, Zonas, Fechas (dropdowns jerárquicos) */}
              <div className="filters-card__row filters-card__row--selects" role="toolbar" aria-label={t("filter_type_aria")}>
                <button
                  ref={ritmosPillRef}
                  type="button"
                  className={`filter-pill ${openFilterDropdown === "ritmos" ? "filter-pill--active" : ""}`}
                  onClick={() => setOpenFilterDropdown(openFilterDropdown === "ritmos" ? null : "ritmos")}
                  aria-pressed={openFilterDropdown === "ritmos"}
                  aria-expanded={openFilterDropdown === "ritmos"}
                  style={{ minWidth: 140, justifyContent: "space-between" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span className="pill-icon" aria-hidden="true">🎵</span>
                    <span className="pill-text">{t("rhythms")} ({stableRitmos.length})</span>
                  </span>
                  <span aria-hidden style={{ opacity: 0.7 }}>▾</span>
                </button>
                <button
                  ref={zonasPillRef}
                  type="button"
                  className={`filter-pill ${openFilterDropdown === "zonas" ? "filter-pill--active" : ""}`}
                  onClick={() => setOpenFilterDropdown(openFilterDropdown === "zonas" ? null : "zonas")}
                  aria-pressed={openFilterDropdown === "zonas"}
                  aria-expanded={openFilterDropdown === "zonas"}
                  style={{ minWidth: 140, justifyContent: "space-between" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span className="pill-icon" aria-hidden="true">📍</span>
                    <span className="pill-text">{t("zones")} ({stableZonas.length})</span>
                  </span>
                  <span aria-hidden style={{ opacity: 0.7 }}>▾</span>
                </button>
                <button
                  ref={fechasPillRef}
                  type="button"
                  className={`filter-pill ${openFilterDropdown === "fechas" ? "filter-pill--active" : ""}`}
                  onClick={() => setOpenFilterDropdown(openFilterDropdown === "fechas" ? null : "fechas")}
                  aria-pressed={openFilterDropdown === "fechas"}
                  aria-expanded={openFilterDropdown === "fechas"}
                  style={{ minWidth: 140, justifyContent: "space-between" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span className="pill-icon" aria-hidden="true">🗓️</span>
                    <span className="pill-text">Fechas: {dateSummaryText}</span>
                  </span>
                  <span aria-hidden style={{ opacity: 0.7 }}>▾</span>
                </button>
              </div>

              <MultiSelectTreeDropdown
                label={t("rhythms")}
                groups={ritmoTreeGroups}
                selectedIds={stableRitmos}
                onChange={(nextIds) => set({ ritmos: nextIds })}
                search={true}
                anchorEl={openFilterDropdown === "ritmos" ? ritmosPillRef.current : null}
                open={openFilterDropdown === "ritmos"}
                onClose={() => setOpenFilterDropdown(null)}
                triggerRef={ritmosPillRef}
              />
              <MultiSelectTreeDropdown
                label={t("zones")}
                groups={zonaTreeGroups}
                selectedIds={stableZonas}
                onChange={(nextIds) => set({ zonas: nextIds })}
                search={true}
                anchorEl={openFilterDropdown === "zonas" ? zonasPillRef.current : null}
                open={openFilterDropdown === "zonas"}
                onClose={() => setOpenFilterDropdown(null)}
                triggerRef={zonasPillRef}
              />
              <DateFilterDropdown
                dateFrom={filters.dateFrom}
                dateTo={filters.dateTo}
                onApply={applyDateFilter}
                anchorEl={openFilterDropdown === "fechas" ? fechasPillRef.current : null}
                open={openFilterDropdown === "fechas"}
                onClose={() => setOpenFilterDropdown(null)}
                triggerRef={fechasPillRef}
                summaryText={dateSummaryText}
                t={t}
              />

              {/* Tabs de secciones */}
              <div className="filters-tabs" role="tablist" aria-label="Secciones">
                {([
                  { id: 'fechas', label: 'Eventos' },
                  { id: 'clases', label: 'Clases' },
                  { id: 'academias', label: 'Academias' },
                  { id: 'maestros', label: 'Maestros' },
                  { id: 'usuarios', label: 'Bailarines' },
                  { id: 'organizadores', label: 'Organizadores' },
                  { id: 'marcas', label: 'Marcas' },
                  { id: 'all', label: 'Todo' },
                ] as const).map((tab) => {
                  const active = (filters.type || 'all') === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`tab ${active ? 'tab--active' : ''}`}
                      aria-selected={active}
                      role="tab"
                      onClick={() => {
                        set({ type: tab.id as any });
                        setOpenFilterDropdown(null);
                      }}
                    >
                      <span className="tab-label">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Rangos rápidos de fechas: visible al seleccionar Eventos, Clases o Todo */}
              {showQuickDateRanges && (
                <>
                  <div className="filters-divider" />
                  <div className="filters-card__row chips" aria-label={t('date_shortcuts')}>
                    {([
                      { id: 'todos' as const, labelKey: 'all' },
                      { id: 'hoy' as const, labelKey: 'today' },
                      { id: 'manana' as const, labelKey: 'tomorrow' },
                      { id: 'semana' as const, labelKey: 'this_week' },
                      { id: 'fin_de_semana' as const, labelKey: 'weekend' },
                      { id: 'siguientes' as const, labelKey: 'next_week' },
                    ]).map((p) => {
                      const active = (filters.datePreset || 'todos') === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => applyDatePreset(p.id)}
                          className={`chip ${active ? 'is-active' : ''}`}
                          disabled={isPending}
                          aria-pressed={active}
                        >
                          {t(p.labelKey)}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>

          {(((showAll && (fechasLoading || hasFechas || fechasError)) || selectedType === 'fechas')) && (
            <Section title={t('section_upcoming_scene')} toAll="/explore/list?type=fechas" count={filteredFechas.length} sectionId="fechas">
              {fechasLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">{t('loading')}</div>)}</div>
              ) : fechasError ? (
                <InlineQueryError
                  title="No se pudieron cargar los eventos"
                  error={fechasErrObj}
                  onRetry={() => (fechasQuery as any).refetch?.()}
                />
              ) : (
                <>
                  {filteredFechas.length > 0 ? (
                    <HorizontalSlider
                      {...sliderProps}
                      items={filteredFechas}
                      renderItem={(fechaEvento: any, idx: number) => {
                        if (__DEV__ && (idx === 0 || idx % 20 === 0)) {
                          __DEV_LOG("renderItem", {
                            type: "fechas",
                            idx,
                            id: fechaEvento?.id,
                            original: (fechaEvento as any)?._original_id,
                            rec: (fechaEvento as any)?._recurrence_index,
                          });
                        }

                        const key =
                          (fechaEvento as any)?._recurrence_index !== undefined
                            ? `${(fechaEvento as any)?._original_id || fechaEvento?.id}_${(fechaEvento as any)?._recurrence_index}`
                            : (fechaEvento?.id ?? `fecha_${idx}`);

                        if (__DEV__) {
                          try {
                            return (
                              <div
                                key={key}
                                onClickCapture={handlePreNavigate}
                                style={{
                                  background: 'rgba(255,255,255,0.04)',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  borderRadius: 16,
                                  padding: 0,
                                  overflow: 'hidden',
                                  boxShadow: 'none'
                                }}
                              >
                                <EventCard item={fechaEvento} priority={idx === 0} />
                              </div>
                            );
                          } catch (e) {
                            __DEV_LOG("renderItem_error", { type: "fechas", idx, id: fechaEvento?.id, error: (e as any)?.message || e });
                            return null;
                          }
                        }

                        return (
                          <div
                            key={key}
                            onClickCapture={handlePreNavigate}
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 16,
                              padding: 0,
                              overflow: 'hidden',
                              boxShadow: 'none'
                            }}
                          >
                            <EventCard item={fechaEvento} priority={idx === 0} />
                          </div>
                        );
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>{t('no_results')}</div>
                  )}
                  {fechasLoadMore.hasNextPage && (
                    <button
                      className="load-more-btn"
                      onClick={fechasLoadMore.handleLoadMore}
                      disabled={fechasLoadMore.isFetching}
                    >
                      {fechasLoadMore.isFetching ? t('loading_dots') : t('load_more_dates')}
                    </button>
                  )}
                </>
              )}
            </Section>
          )}

          {(((showAll && ((academiasLoading || maestrosLoading) || hasClases || academiasError || maestrosError)) || selectedType === 'clases')) && (
            <Section title={t('section_recommended_classes')} toAll="/explore/list?type=clases" count={classesList.length} sectionId="clases">
              {(() => {
                const loading = academiasLoading || maestrosLoading;
                if (loading) return <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">{t('loading')}</div>)}</div>;
                if (academiasError || maestrosError) {
                  return (
                    <InlineQueryError
                      title="No se pudieron cargar las clases"
                      error={academiasErrObj || maestrosErrObj}
                      onRetry={() => {
                        (academiasQuery as any).refetch?.();
                        (maestrosQuery as any).refetch?.();
                      }}
                    />
                  );
                }
                if (classesList.length === 0) {
                  return <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>{t('no_results')}</div>;
                }

                return (
                  <>
                    <HorizontalSlider
                      {...sliderProps}
                      items={classesListWithCTA}
                      renderItem={renderClaseItem}
                    />
                    {(academiasLoadMore.hasNextPage || maestrosLoadMore.hasNextPage) && (
                      <button
                        className="load-more-btn"
                        onClick={() => {
                          if (academiasLoadMore.hasNextPage) academiasLoadMore.handleLoadMore();
                          if (maestrosLoadMore.hasNextPage) maestrosLoadMore.handleLoadMore();
                        }}
                        disabled={academiasLoadMore.isFetching || maestrosLoadMore.isFetching}
                      >
                        {(academiasLoadMore.isFetching || maestrosLoadMore.isFetching) ? t('loading_dots') : t('load_more_classes')}
                      </button>
                    )}
                  </>
                );
              })()}
            </Section>
          )}

          {(((showAll && (academiasLoading || hasAcademias)) || selectedType === 'academias')) && (
            <Section title={t('section_best_academies_zone')} toAll="/explore/list?type=academias" count={academiasData.length} sectionId="academias">
              <AcademiesSection
                filters={filters}
                q={qDeferred || undefined}
                enabled={showAll || selectedType === 'academias'}
                maxItems={12}
              />
              {!academiasLoading && academiasData.length === 0 && (
                <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>{t('no_results')}</div>
              )}
              {/* Mantener botón de cargar más si es necesario */}
                  {academiasLoadMore.hasNextPage && (
                    <button
                      className="load-more-btn"
                      onClick={academiasLoadMore.handleLoadMore}
                      disabled={academiasLoadMore.isFetching}
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                    >
                      {academiasLoadMore.isFetching ? t('loading_dots') : t('load_more_academies')}
                    </button>
              )}
            </Section>
          )}

          {(((showAll && (maestrosLoading || hasMaestros || maestrosError)) || selectedType === 'maestros')) && (
            <Section title={t('section_featured_teachers')} toAll="/explore/list?type=maestros" count={maestrosData.length} sectionId="maestros">
              {maestrosLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">{t('loading')}</div>)}</div>
              ) : maestrosError ? (
                <InlineQueryError
                  title="No se pudieron cargar los maestros"
                  error={maestrosErrObj}
                  onRetry={() => (maestrosQuery as any).refetch?.()}
                />
              ) : (
                <>
                  {maestrosData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>{t('no_results')}</div>
                  ) : (
                  <HorizontalSlider
                    {...maestrosSliderProps}
                    items={maestrosDataWithCTA}
                    renderItem={(item: any, idx: number) => {
                      if (item?.__isCTA) {
                        return (
                          <div
                            key="cta-maestros"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 16,
                              padding: 0,
                              overflow: 'hidden',
                              boxShadow: 'none'
                            }}
                          >
                            <CTACard text={t('cta_teachers')} sectionType="maestros" idx={idx} />
                          </div>
                        );
                      }
                      if (__DEV__ && (idx === 0 || idx % 20 === 0)) {
                        __DEV_LOG("renderItem", { type: "maestros", idx, id: item?.id, nombre: item?.nombre_publico });
                      }
                      if (__DEV__) {
                        try {
                          return (
                            <div
                              key={item.id ?? idx}
                              onClickCapture={handlePreNavigate}
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 16,
                                padding: 0,
                                overflow: 'hidden',
                                boxShadow: 'none'
                              }}
                            >
                              <TeacherCard item={item} />
                            </div>
                          );
                        } catch (e) {
                          __DEV_LOG("renderItem_error", { type: "maestros", idx, id: item?.id, error: (e as any)?.message || e });
                          return null;
                        }
                      }
                      return (
                        <div
                          key={item.id ?? idx}
                          onClickCapture={handlePreNavigate}
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 16,
                            padding: 0,
                            overflow: 'hidden',
                            boxShadow: 'none'
                          }}
                        >
                          <TeacherCard item={item} />
                        </div>
                      );
                    }}
                  />
                  )}
                  {maestrosLoadMore.hasNextPage && (
                    <button
                      className="load-more-btn"
                      onClick={maestrosLoadMore.handleLoadMore}
                      disabled={maestrosLoadMore.isFetching}
                    >
                      {maestrosLoadMore.isFetching ? t('loading_dots') : t('load_more_teachers')}
                    </button>
                  )}
                </>
              )}
            </Section>
          )}

          {(((showAll && (usuariosLoading || hasUsuarios)) || selectedType === 'usuarios')) && (
            <Section title={t('section_dancers_near_you')} toAll="/explore/list?type=usuarios" count={validUsuarios.length} sectionId="usuarios">
              {usuariosLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
              ) : (
                <>
                  {validUsuarios.length > 0 ? (
                    <>
                      <HorizontalSlider
                        {...sliderProps}
                        items={validUsuarios}
                        renderItem={(u: any, idx: number) => {
                          if (__DEV__ && (idx === 0 || idx % 30 === 0)) {
                            __DEV_LOG("renderItem", { type: "usuarios", idx, user_id: u?.user_id, display_name: u?.display_name });
                          }
                          if (__DEV__) {
                            try {
                              return (
                                <div
                                  key={u.user_id ?? idx}
                                  onClickCapture={handlePreNavigate}
                                  style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 16,
                                    padding: 0,
                                    overflow: 'hidden',
                                    boxShadow: 'none'
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
                                </div>
                              );
                            } catch (e) {
                              __DEV_LOG("renderItem_error", { type: "usuarios", idx, user_id: u?.user_id, error: (e as any)?.message || e });
                              return null;
                            }
                          }
                          return (
                            <div
                              key={u.user_id ?? idx}
                              onClickCapture={handlePreNavigate}
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 16,
                                padding: 0,
                                overflow: 'hidden',
                                boxShadow: 'none'
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
                            </div>
                          );
                        }}
                      />
                      {/* Mostrar indicador de carga mientras se cargan más usuarios automáticamente */}
                      {usuariosQuery.isFetchingNextPage && (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '1rem', 
                          color: colors.gray[400],
                          fontSize: '0.875rem'
                        }}>
                          {t('loading_more_users')}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>{t('no_results')}</div>
                  )}
                </>
              )}
            </Section>
          )}

          {(((showAll && (organizadoresLoading || organizadoresData.length > 0 || organizadoresError)) || selectedType === 'organizadores')) && (
            <Section title={t('section_event_producers')} toAll="/explore/list?type=organizadores" count={organizadoresData.length} sectionId="organizadores">
              {organizadoresLoading ? (
                <div className="cards-grid">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="card-skeleton">
                      {t('loading')}
                    </div>
                  ))}
                </div>
              ) : organizadoresError ? (
                <InlineQueryError
                  title="No se pudieron cargar los organizadores"
                  error={organizadoresErrObj}
                  onRetry={() => (organizadoresQuery as any).refetch?.()}
                />
              ) : organizadoresData.length > 0 ? (
                <>
                  <HorizontalSlider
                    {...sliderProps}
                    items={organizadoresDataWithCTA}
                    renderItem={(item: any, idx: number) => {
                      if (item?.__isCTA) {
                        return (
                          <div
                            key="cta-organizadores"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 16,
                              padding: 0,
                              overflow: 'hidden',
                              boxShadow: 'none'
                            }}
                          >
                            <CTACard text={t('cta_organizers')} sectionType="organizadores" idx={idx} />
                          </div>
                        );
                      }
                      if (__DEV__ && (idx === 0 || idx % 20 === 0)) {
                        __DEV_LOG("renderItem", { type: "organizadores", idx, id: item?.id, nombre: item?.nombre_publico || item?.nombre });
                      }
                      if (__DEV__) {
                        try {
                          return (
                            <div
                              key={item.id ?? idx}
                              onClickCapture={handlePreNavigate}
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 16,
                                padding: 0,
                                overflow: 'hidden',
                                boxShadow: 'none'
                              }}
                            >
                              <OrganizerCard item={item} />
                            </div>
                          );
                        } catch (e) {
                          __DEV_LOG("renderItem_error", { type: "organizadores", idx, id: item?.id, error: (e as any)?.message || e });
                          return null;
                        }
                      }
                      return (
                        <div
                          key={item.id ?? idx}
                          onClickCapture={handlePreNavigate}
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 16,
                            padding: 0,
                            overflow: 'hidden',
                            boxShadow: 'none'
                          }}
                        >
                          <OrganizerCard item={item} />
                        </div>
                      );
                    }}
                  />
                  {organizadoresLoadMore.hasNextPage && (
                    <button
                      className="load-more-btn"
                      onClick={organizadoresLoadMore.handleLoadMore}
                      disabled={organizadoresLoadMore.isFetching}
                    >
                      {organizadoresLoadMore.isFetching ? t('loading_dots') : t('load_more_organizers')}
                    </button>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>{t('no_results')}</div>
              )}
            </Section>
          )}

          {(((showAll && (marcasLoading || hasMarcas)) || selectedType === 'marcas')) && (
            <Section title={t('section_specialized_brands')} toAll="/explore/list?type=marcas" count={marcasData.length} sectionId="marcas">
              {marcasLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">{t('loading')}</div>)}</div>
              ) : (
                <>
                  {marcasData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>{t('no_results')}</div>
                  ) : (
                    <HorizontalSlider
                      {...sliderProps}
                      items={marcasDataWithCTA}
                      renderItem={(item: any, idx: number) => {
                      if (item?.__isCTA) {
                        return (
                          <div
                            key="cta-marcas"
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 16,
                              padding: 0,
                              overflow: 'hidden',
                              boxShadow: 'none'
                            }}
                          >
                            <CTACard text={t('cta_brands')} sectionType="marcas" idx={idx} />
                          </div>
                        );
                      }
                      if (__DEV__ && (idx === 0 || idx % 20 === 0)) {
                        __DEV_LOG("renderItem", { type: "marcas", idx, id: item?.id, nombre: item?.nombre_publico || item?.nombre });
                      }
                      if (__DEV__) {
                        try {
                          return (
                            <div
                              key={item.id ?? idx}
                              onClickCapture={handlePreNavigate}
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 16,
                                padding: 0,
                                overflow: 'hidden',
                                boxShadow: 'none'
                              }}
                            >
                              <BrandCard item={item} />
                            </div>
                          );
                        } catch (e) {
                          __DEV_LOG("renderItem_error", { type: "marcas", idx, id: item?.id, error: (e as any)?.message || e });
                          return null;
                        }
                      }
                      return (
                        <div
                          key={item.id ?? idx}
                          onClickCapture={handlePreNavigate}
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 16,
                            padding: 0,
                            overflow: 'hidden',
                            boxShadow: 'none'
                          }}
                        >
                          <BrandCard item={item} />
                        </div>
                      );
                      }}
                    />
                  )}
                  {marcasLoadMore.hasNextPage && (
                    <button
                      className="load-more-btn"
                      onClick={marcasLoadMore.handleLoadMore}
                      disabled={marcasLoadMore.isFetching}
                    >
                      {marcasLoadMore.isFetching ? t('loading_dots') : t('load_more_brands')}
                    </button>
                  )}
                </>
              )}
            </Section>
          )}

          {/* Sección Comparte */}
          <Section title={t('share_section')} toAll="" sectionId="comparte">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: spacing[6],
              }}
            >
              <div
                className="panel"
                style={{
                  maxWidth: "500px",
                  width: "100%",
                  padding: spacing[8],
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: spacing[6],
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Efecto de brillo animado */}
                <div
                  style={{
                    position: "absolute",
                    top: "-50%",
                    left: "-50%",
                    width: "200%",
                    height: "200%",
                    background: "radial-gradient(circle, rgba(240, 147, 251, 0.15) 0%, transparent 70%)",
                    animation: "pulse 3s ease-in-out infinite",
                    pointerEvents: "none",
                  }}
                />
                
                {/* Contenido */}
                <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
                  {/* Icono y texto descriptivo */}
                  <div style={{ marginBottom: spacing[6] }}>
                    <div
                      style={{
                        fontSize: "3rem",
                        marginBottom: spacing[3],
                        filter: "drop-shadow(0 4px 8px rgba(240, 147, 251, 0.3))",
                      }}
                    >
                      📱
                    </div>
                    <h3
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        margin: 0,
                        marginBottom: spacing[2],
                        background: "linear-gradient(135deg, #f093fb, #FFD166)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {t('share_db_title')}
                    </h3>
                    <p
                      style={{
                        fontSize: "1rem",
                        color: colors.gray[300],
                        margin: 0,
                        lineHeight: 1.6,
                        opacity: 0.9,
                      }}
                    >
                      {t('share_db_body')}
                    </p>
                  </div>

                  {/* QR Code con diseño mejorado */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: spacing[4],
                      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
                      borderRadius: "20px",
                      border: "2px solid rgba(240, 147, 251, 0.3)",
                      boxShadow: "0 8px 32px rgba(240, 147, 251, 0.2), inset 0 0 20px rgba(240, 147, 251, 0.1)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Efecto de borde brillante */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "18px",
                        padding: "2px",
                        background: "linear-gradient(135deg, #f093fb, #f5576c, #FFD166, #f093fb)",
                        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        WebkitMaskComposite: "xor",
                        maskComposite: "exclude",
                        opacity: 0.6,
                        animation: "rotate 3s linear infinite",
                      }}
                    />
                    
                    <div
                      style={{
                        background: "#FFFFFF",
                        borderRadius: "12px",
                        padding: spacing[3],
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <img
                        src="https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/QRDondeBailar.png"
                        alt="QR Code para compartir Dónde Bailar"
                        style={{
                          width: "220px",
                          height: "220px",
                          maxWidth: "100%",
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                    </div>
                  </motion.div>

                  {/* Texto adicional */}
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: colors.gray[400],
                      margin: 0,
                      marginTop: spacing[4],
                      fontStyle: "italic",
                    }}
                  >
                    {t('join_community')}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Estilos CSS adicionales para animaciones */}
            <style>{`
              @keyframes pulse {
                0%, 100% {
                  opacity: 0.3;
                  transform: scale(1);
                }
                50% {
                  opacity: 0.6;
                  transform: scale(1.1);
                }
              }
              @keyframes rotate {
                from {
                  background-position: 0% 0%;
                }
                to {
                  background-position: 200% 0%;
                }
              }
              @media (max-width: 768px) {
                .panel {
                  padding: 1.5rem !important;
                }
              }
            `}</style>
          </Section>

          {noResultsAllTypes && (
            <div
              style={{
                marginTop: spacing[10],
                marginBottom: spacing[10],
                padding: spacing[8],
                textAlign: 'center',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'radial-gradient(circle at top, rgba(148,163,255,0.12), rgba(15,23,42,0.95))',
                color: colors.gray[200],
                maxWidth: 640,
                marginInline: 'auto',
              }}
            >
              <h3 style={{ margin: 0, marginBottom: spacing[3], fontSize: '1.1rem', fontWeight: 700 }}>
                {t('no_results_with_filters_title')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.85 }}>
                {t('no_results_with_filters_body')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Botones de navegación entre secciones (solo móvil)
          Portal a document.body + estilos inline (evita overrides / CSS invalidado).
          COMENTADO: Uso de cortina deshabilitado */}
      {false && shouldShowSectionNav && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="section-navigation-buttons-portal"
              style={{
                position: 'fixed',
                left: '50%',
                bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'row',
                gap: 12,
                pointerEvents: 'none',
                zIndex: 2147483647,
                width: 'auto',
                justifyContent: 'center',
                // "Píldora" minimalista detrás (no bloquea scroll porque pointerEvents: none)
                padding: '6px',
                borderRadius: 999,
                background: 'rgba(17, 24, 39, 0.55)', // slate/black glass
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
                WebkitBackdropFilter: 'blur(14px)',
                backdropFilter: 'blur(14px)',
              }}
            >
              <style>{`
                /* Mostrar solo en móvil usando media query (más confiable que isMobile al primer paint) */
                @media (min-width: 769px) {
                  .section-navigation-buttons-portal { display: none !important; }
                }
                @media (max-width: 480px) {
                  .section-navigation-buttons-portal { bottom: calc(88px + env(safe-area-inset-bottom, 0px)) !important; }
                }
              `}</style>
              <button
                onClick={() => scrollToSection('up')}
                aria-label="Sección anterior"
                type="button"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  boxShadow: '0 6px 18px rgba(0,0,0,0.28)',
                  transition:
                    'transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                  pointerEvents: 'auto',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'rgba(255, 255, 255, 0.1)',
                }}
                onPointerDown={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.14)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.26)';
                }}
                onPointerUp={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.08)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.16)';
                }}
                onPointerCancel={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.08)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.16)';
                }}
              >
                ↑
              </button>
              <button
                onClick={() => scrollToSection('down')}
                aria-label="Siguiente sección"
                type="button"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  boxShadow: '0 6px 18px rgba(0,0,0,0.28)',
                  transition:
                    'transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                  pointerEvents: 'auto',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'rgba(255, 255, 255, 0.1)',
                }}
                onPointerDown={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.14)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.26)';
                }}
                onPointerUp={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.08)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.16)';
                }}
                onPointerCancel={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.08)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.16)';
                }}
              >
                ↓
              </button>
            </div>,
            (document.getElementById('overlay-root') ?? document.body)
          )
        : null}
    </>
  );
}
