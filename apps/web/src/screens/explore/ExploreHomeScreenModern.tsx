import React, { useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { m } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useExploreFilters, type DatePreset, type ExploreFilters, type ExploreType } from "../../state/exploreFilters";
import { useExploreQuery } from "../../hooks/useExploreQuery";
import { useUsedRhythmsByContext } from "@/hooks/useUsedRhythms";
import { useUsedZonesByContext } from "@/hooks/useUsedZones";
import { useZonaCatalogGroups } from "@/hooks/useZonaCatalogGroups";
import { mapExploreTypeToContext, mapExploreTypeToZoneContext } from "@/filters/exploreContext";
import { groupRitmos, zonaGroupsToTreeGroups } from "@/filters/exploreFilterGroups";
import EventListRow from "@/components/explore/EventListRow";
import "@/components/explore/exploreFechasCartelera.css";
import { readFechasViewMode, writeFechasViewMode, type FechasViewMode } from "@/utils/fechasViewModeStorage";
import {
  readExploreSectionViewModes,
  patchExploreSectionViewMode,
  type ExploreListableSectionId,
  type ExploreSectionViewMode,
} from "@/utils/exploreSectionViewModeStorage";
import { ExploreSectionViewToggle } from "@/components/explore/ExploreSectionViewToggle";
import ClaseListRow from "@/components/explore/ClaseListRow";
import ExploreProfileListRow from "@/components/explore/ExploreProfileListRow";
import ExploreEntityCarteleraCard from "@/components/explore/ExploreEntityCarteleraCard";
import HorizontalCarousel from "../../components/explore/HorizontalCarousel";
import ClassExploreGridCard from "@/components/explore/ClassExploreGridCard";
import ProfileExploreGridCard from "@/components/explore/ProfileExploreGridCard";
import BrandCard from "../../components/explore/cards/BrandCard";
import { LoadMoreCard } from "@/components/explore/cards/LoadMoreCard";
import { urls } from "../../lib/urls";
import { colors, typography, spacing, borderRadius, transitions } from "../../theme/colors";
import { useUserFilterPreferences } from "../../hooks/useUserFilterPreferences";
import { useAuth } from "@/contexts/AuthProvider";
import { useTags } from "@/hooks/useTags";
import SeoHead from "@/components/SeoHead";
import { buildAvailableFilters } from "../../filters/buildAvailableFilters";
import { useToast } from "../../components/Toast";
import { mark, notifyError, notifyReady } from "@/utils/performanceLogger";
import { normalizeEventsForCards } from "@/utils/normalizeEventsForCards";
import { getEffectiveEventDateYmd } from "@/utils/effectiveEventDate";
import { sortFechasByRecentFirst } from "@/utils/exploreFechasGrid";
import { getLocaleFromI18n } from "@/utils/locale";
import { useFilteredFechas } from "@/hooks/explore/useFilteredFechas";
import { useClassesList } from "@/hooks/explore/useClassesList";
import { buildEventOccurrenceKey } from "@/utils/exploreEventOccurrence";
import { buildExploreTagMaps } from "@/utils/exploreTagMaps";

const MultiSelectTreeDropdown = React.lazy(() =>
  import("@/components/explore/MultiSelectTreeDropdown").then((m) => ({ default: m.MultiSelectTreeDropdown })),
);
const DateFilterDropdown = React.lazy(() =>
  import("@/components/explore/DateFilterDropdown").then((m) => ({ default: m.DateFilterDropdown })),
);
const EventSocialGridCard = React.lazy(() => import("@/components/explore/EventSocialGridCard"));
const EventCarteleraCard = React.lazy(() => import("@/components/explore/EventCarteleraCard"));
const AcademiesSection = React.lazy(() =>
  import("../../components/sections/AcademiesSection").then((m) => ({ default: m.AcademiesSection })),
);

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

function DeferredChunk({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return <React.Suspense fallback={fallback}>{children}</React.Suspense>;
}

/** Hook para calcular dimensiones hero de cards en mobile (viewport-aware). */
function useExploreCardDimensions(isMobile: boolean) {
  const compute = React.useCallback(() => {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!isMobile || vw >= 769) return { width: 0, height: 0 };

    const topNavHeight = 72;
    const filtersCollapsedHeight = 70;
    const sectionHeaderHeight = 52;
    const verticalPadding = 20;

    const availableHeight =
      vh - topNavHeight - filtersCollapsedHeight - sectionHeaderHeight - verticalPadding;

    const cardHeight = Math.max(440, Math.min(640, availableHeight));
    const containerWidth = vw - 32;
    const cardWidth = Math.floor(containerWidth * 0.9);
    const cardWidthClamped = Math.min(cardWidth, Math.floor(vw * 0.92));

    return { width: cardWidthClamped, height: cardHeight };
  }, [isMobile]);

  /** Sin leer window en el primer render: evita reflow forzado (Lighthouse). Medición en useLayoutEffect. */
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    setDimensions(compute());
  }, [compute]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    let rafId: number | null = null;
    const handler = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setDimensions(compute());
      });
    };
    window.addEventListener('resize', handler, { passive: true });
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handler, { passive: true });
    }
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handler);
      vv?.removeEventListener('resize', handler);
    };
  }, [compute]);

  return React.useMemo(
    () => ({
      cardHeight: dimensions.height,
      cardWidth: dimensions.width,
      sectionMinHeight: dimensions.height > 0 ? dimensions.height + 52 + 24 + 20 : undefined,
    }),
    [dimensions.height, dimensions.width]
  );
}

/** Dimensiones vista cuadrícula sociales: ~2 cards visibles en viewport, proporción compacta. */
function useExploreFechasGridDimensions(isMobile: boolean) {
  const compute = React.useCallback(() => {
    if (typeof window === "undefined") return { width: 0, height: 0, gap: 10 };
    const vw = window.innerWidth;
    const paddingX = 32;
    const gap = 10;
    // 2 cards + 1 hueco entre ellas: 2*w + gap = vw - paddingX
    const rawW = Math.floor((vw - paddingX - gap) / 2);
    const cardW = vw >= 769 ? Math.max(120, Math.min(320, rawW)) : Math.max(100, rawW);
    const posterH = Math.round(cardW * 1.05);
    const bodyH = 92;
    const cardH = posterH + bodyH;
    return { width: cardW, height: cardH, gap };
  }, [isMobile]);

  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0, gap: 10 });

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    setDimensions(compute());
  }, [compute]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let rafId: number | null = null;
    const handler = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setDimensions(compute());
      });
    };
    window.addEventListener("resize", handler, { passive: true });
    const vv = window.visualViewport;
    vv?.addEventListener("resize", handler, { passive: true });
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handler);
      vv?.removeEventListener("resize", handler);
    };
  }, [compute]);

  return React.useMemo(
    () => ({
      gridCardWidth: dimensions.width,
      gridCardHeight: dimensions.height,
      gridGap: dimensions.gap,
    }),
    [dimensions.width, dimensions.height, dimensions.gap]
  );
}

/** Encabezado de sección reutilizable con título, contador y subline opcional. */
function SectionHeader({
  title,
  count,
  subline,
  actionSlot,
}: {
  title: string;
  count?: number;
  subline?: string;
  actionSlot?: React.ReactNode;
}) {
  return (
    <div
      className="section-header section-header--hero explore-section-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        position: 'relative',
        paddingTop: 10,
        paddingBottom: 12,
        paddingRight: actionSlot ? 56 : 0,
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2
            className="section-title section-title--hero"
            style={{
              margin: 0,
              fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
              fontWeight: 800,
              color: '#f4f4f5',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
            }}
          >
            {title}
          </h2>
        </div>
        {subline && (
          <span style={{ fontSize: 0.8, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{subline}</span>
        )}
      </div>
      {actionSlot && (
        <div
          className="section-header-actions"
          style={{
            position: 'absolute',
            right: 'max(4px, env(safe-area-inset-right, 0px))',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          {actionSlot}
        </div>
      )}
    </div>
  );
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

type ExploreSectionId = 'fechas' | 'clases' | 'academias' | 'maestros' | 'usuarios' | 'organizadores' | 'marcas';
const ABOVE_FOLD_SECTIONS: ExploreSectionId[] = ['fechas', 'clases'];
const ALL_EXPLORE_SECTIONS: ExploreSectionId[] = [
  'fechas',
  'clases',
  'academias',
  'maestros',
  'usuarios',
  'organizadores',
  'marcas',
];

/** Imágenes eager: primera sección usa 2; el resto 1 para priorizar percepción sin saturar red/CPU. */
const EAGER_OTHERS = 1;
const INITIAL_LIMIT = 10;
const NEXT_LIMIT = 20;

function runWhenIdle(callback: () => void, timeoutMs = 350): () => void {
  if (typeof window === 'undefined') {
    const id = setTimeout(callback, 0);
    return () => clearTimeout(id);
  }
  const win = window as any;
  if (typeof win.requestIdleCallback === 'function') {
    const id = win.requestIdleCallback(callback, { timeout: timeoutMs });
    return () => win.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(callback, 120);
  return () => window.clearTimeout(id);
}

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

/** CTA compacta: misma acción (roles/info), menos peso visual que la card hero anterior. */
const CTACard = React.memo(({
  text,
  sectionType,
  idx: _idx
}: {
  text: string;
  sectionType: 'clases' | 'academias' | 'maestros' | 'organizadores' | 'marcas';
  idx: number;
}) => {
  const { t } = useTranslation();
  const handleClick = React.useCallback(() => {
    window.location.href = 'https://dondebailar.com.mx/app/roles/info';
  }, []);

  return (
    <button
      type="button"
      className="explore-cta-inline"
      onClick={handleClick}
      aria-label={`${text} — ${t('join')}`}
    >
      <span className="explore-cta-inline__text">{text}</span>
      <span className="explore-cta-inline__chev" aria-hidden>
        →
      </span>
    </button>
  );
});

CTACard.displayName = 'CTACard';

const STYLES = `
  .explore-section-header {
    border-bottom: 2px solid var(--ex-accent);
    padding-bottom: 12px;
  }
  .explore-cta-inline {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
    color: #f4f4f5;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    font-size: 0.875rem;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .explore-cta-inline:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.14);
    transform: scale(1.01);
  }
  .explore-cta-inline__text {
    flex: 1;
    min-width: 0;
    line-height: 1.35;
  }
  .explore-cta-inline__chev {
    flex-shrink: 0;
    opacity: 0.65;
    font-size: 1rem;
  }
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
    --ex-surface: #0f1218;
    --ex-elevated: #161a22;
    --ex-border: rgba(255, 255, 255, 0.08);
    --ex-border-strong: rgba(255, 255, 255, 0.1);
    --ex-shadow: 0 4px 20px rgba(0, 0, 0, 0.22);
    --ex-accent: rgba(41, 127, 150, 0.5);
    --explore-bottom-space: max(104px, calc(env(safe-area-inset-bottom, 0px) + 88px));
    min-height: 100vh; 
    min-height: 100dvh;
    /* IMPORTANT: This screen is styled for a dark UI (cards/text assume dark background). */
    background: var(--ex-surface); 
    color: ${colors.gray[50]}; 
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
    /* Mobile: no overflow-y aquí; el scroll es en app-shell-content para Android WebView */
    overflow-y: visible;
    padding-top: 0;
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
    box-sizing: border-box;
    -webkit-overflow-scrolling: touch;
    touch-action: auto;
    -webkit-tap-highlight-color: transparent;
    transform: none;
    -webkit-transform: none;
  }
  @media (min-width: 769px) {
    .explore-container {
      overflow-y: visible;
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
    padding: 0 ${spacing[6]};
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    transform: translateZ(0);
    will-change: auto;
  }
  .panel { 
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--ex-border-strong, rgba(255, 255, 255, 0.1));
    border-radius: 20px;
    padding: ${spacing[5]};
    box-shadow: var(--ex-shadow, 0 4px 20px rgba(0, 0, 0, 0.22));
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
  .section-container {
    margin-bottom: 0;
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
  .section-header--hero {
    position: relative;
    z-index: 12;
  }
  .section-header-link {
    flex-shrink: 0;
  }
  .section-header-actions {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    z-index: 14;
    pointer-events: auto;
  }
  .filters-hero-trigger {
    position: relative;
    width: 46px;
    height: 46px;
    border-radius: 999px;
    border: 1px solid var(--ex-border-strong, rgba(255,255,255,0.1));
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform .16s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease;
    box-shadow: var(--ex-shadow, 0 4px 20px rgba(0, 0, 0, 0.22));
    z-index: 15;
    -webkit-appearance: none;
    appearance: none;
    -webkit-tap-highlight-color: transparent;
    backdrop-filter: blur(8px);
  }
  .filters-hero-trigger:hover {
    transform: translateY(-1px);
    border-color: rgba(255,255,255,0.16);
    background: rgba(255, 255, 255, 0.09);
    box-shadow: 0 6px 22px rgba(0,0,0,.28);
  }
  .filters-hero-trigger:active {
    transform: translateY(0);
  }
  .filters-hero-trigger__badge {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: rgba(235, 55, 127, 0.95);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    line-height: 18px;
    text-align: center;
    border: 1px solid rgba(12, 14, 19, 0.65);
    box-shadow: 0 2px 8px rgba(0,0,0,.32);
  }
  .filters-hero-trigger__icon {
    width: 20px;
    height: 20px;
    display: block;
    color: #fff;
    stroke: currentColor;
    stroke-width: 2.25;
    fill: none;
  }
  .filters-hero-trigger-persistent {
    position: sticky;
    top: 50px;
    height: 5px;
    z-index: 30;
    display: flex;
    justify-content: flex-end;
    padding-right: max(calc(.5rem + env(safe-area-inset-right, 0px)), 8px);
    margin-bottom: 6px;
    pointer-events: none;
    align-items: center;
  }
  .filters-hero-trigger-persistent .filters-hero-trigger {
    pointer-events: auto;
  }
  .section-container__main {
    position: relative;
    z-index: 1;
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
    .section-title--hero {
      font-size: clamp(1.6875rem, 5.5vw, 1.9375rem) !important;
    }
    .explore-slider--mobile {
      grid-template-columns: 1fr !important;
      gap: 0 !important;
    }
  }
  :root {
    --navbar-h: 64px;
    --safe-top: max(env(safe-area-inset-top), 0px);
    --topbar-offset: calc(var(--safe-top) + var(--navbar-h));
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
  @media (max-width: 430px) {
    :root {
      --navbar-h: 60px;
    }
  }
  /* Panel contenedor de la barra de filtros */
  .filters-panel {
    width: 100%;
    max-width: 700px;
    margin: 0 auto 0;
    padding: 6px 0 0;
    position: relative;
    box-sizing: border-box;
    min-width: 0;
  }
  .filters-panel.is-collapsed {
    display: none;
  }
  /* Filters card (barra principal) — superficie elevada unificada */
  .filters-card {
    width: 100%;
    max-width: 680px;
    margin-left: auto;
    margin-right: auto;
    padding: 16px 14px 14px;
    border-radius: 20px;
    background: var(--ex-elevated, #161a22);
    border: 1px solid var(--ex-border, rgba(255,255,255,0.08));
    box-shadow: var(--ex-shadow, 0 4px 20px rgba(0, 0, 0, 0.22));
    color: #fff;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    min-width: 0;
    box-sizing: border-box;
    position: relative;
    overflow: visible;
  }
  /* Dropdown de fechas — responsivo, sin scroll interno */
  .date-filter-dropdown {
    max-width: calc(100vw - 24px);
    overflow: visible;
  }
  /* Dropdown multi-select (ritmos/zonas) — dentro del viewport */
  .multi-select-tree-dropdown {
    max-width: calc(100vw - 24px);
    box-sizing: border-box;
  }
  .date-filter-dropdown__presets {
    min-width: 0;
  }
  .date-filter-dropdown__presets button {
    min-width: 0;
  }
  .date-filter-dropdown__range {
    min-width: 0;
    overflow: hidden;
  }
  .date-filter-dropdown__range input {
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    font-size: 16px;
  }
  /* Icono de calendario del input date — más visible sobre fondo oscuro */
  .date-filter-dropdown__range input[type="date"] {
    color-scheme: dark;
  }
  .date-filter-dropdown__range input[type="date"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 1;
    width: 22px;
    height: 22px;
    padding: 2px 0 2px 6px;
    filter: invert(1) brightness(1.15) drop-shadow(0 0 1px rgba(153, 229, 255, 0.5));
  }
  .date-filter-dropdown__range input[type="date"]::-webkit-calendar-picker-indicator:hover {
    filter: invert(1) brightness(1.35) drop-shadow(0 0 2px rgba(41, 127, 150, 0.8));
  }
  @media (max-width: 400px) {
    .date-filter-dropdown {
      padding: 12px !important;
      border-radius: 14px !important;
      font-size: 13px !important;
      max-width: calc(100vw - 24px) !important;
      box-sizing: border-box !important;
    }
    .date-filter-dropdown__presets span {
      font-size: 9px !important;
      margin-bottom: 6px !important;
    }
    .date-filter-dropdown__presets button {
      padding: 8px 12px !important;
      font-size: 12px !important;
    }
    .date-filter-dropdown__custom span {
      font-size: 9px !important;
      margin-bottom: 8px !important;
    }
    .date-filter-dropdown__range {
      grid-template-columns: 1fr !important;
      gap: 8px !important;
      margin-bottom: 10px !important;
      min-width: 0 !important;
    }
    .date-filter-dropdown__range label {
      font-size: 11px !important;
    }
    .date-filter-dropdown__range input {
      padding: 8px 10px !important;
      font-size: 16px !important;
      min-width: 0 !important;
      max-width: 100% !important;
    }
    .date-filter-dropdown__custom > div:last-of-type {
      gap: 8px !important;
    }
    .date-filter-dropdown__custom button {
      padding: 8px 14px !important;
      font-size: 12px !important;
    }
  }
  /* Dropdown de tipo — responsivo */
  .filters-type-dropdown-panel {
    max-width: calc(100vw - 24px);
    box-sizing: border-box;
  }
  @media (max-width: 400px) {
    .filters-type-dropdown-panel {
      padding: 10px 8px !important;
      border-radius: 14px !important;
    }
    .filters-type-dropdown-panel button {
      padding: 10px 12px !important;
      font-size: 13px !important;
    }
  }
  .filters-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }
  .filters-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 12px;
    min-height: 36px;
  }
  .filters-top-row__title {
    flex: 0 0 auto;
  }
  .filters-top-row__search {
    flex: 1 1 320px;
    min-width: 240px;
    max-width: 100%;
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
    color: #fff;
  }
  .filters-icon {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.1);
  }
  .filters-clear {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.14);
    background: rgba(255,255,255,.06);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: transform .12s ease, background .12s ease, border-color .12s ease;
  }
  .filters-clear:hover {
    background: rgba(255,255,255,.10);
    border-color: rgba(255,255,255,.2);
    transform: translateY(-1px);
  }
  .filters-clear:active { transform: translateY(0); }
  .filters-clear .dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: rgba(255,255,255,.35);
  }
  .filters-card__top-action.filters-clear {
    background: linear-gradient(135deg, #297F96 0%, #7c3aed 100%);
    border: 1px solid rgba(41, 127, 150, 0.6);
    box-shadow: 0 0 12px rgba(41, 127, 150, 0.35);
    color: #fff;
  }
  .filters-card__top-action.filters-clear:hover {
    box-shadow: 0 0 16px rgba(41, 127, 150, 0.45);
    filter: brightness(1.05);
  }
  .filters-card__top-action .filters-badge {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    background: rgba(124, 58, 237, 0.9);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .filters-card__row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .filters-card__row--top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    align-items: stretch;
    gap: 8px;
    margin-bottom: 4px;
  }
  .filters-card__row--top-left {
    min-width: 0;
  }
  .filters-card__row--top-left.filters-card__cell--span2 {
    grid-column: 1 / span 2;
  }
  .filters-card__row--top-left .filter-pill {
    width: 100%;
    min-width: 0;
  }
  .filters-card__row--dates-wrap {
    min-width: 0;
  }
  .filters-card__row--dates-wrap .filter-pill {
    width: 100%;
    min-width: 0;
  }
  .filters-card__top-action {
    min-width: 0;
  }
  .filters-card__top-action.filters-clear {
    flex-shrink: 0;
    white-space: nowrap;
  }
  /* Texto de pills visible completo y responsivo */
  .filters-card__row--top .pill-text,
  .filters-card__row--mid .pill-text {
    min-width: 0;
    overflow: visible;
    white-space: normal;
    word-break: break-word;
    line-height: 1.3;
  }
  @media (max-width: 380px) {
    .filters-card__row--top {
      grid-template-columns: 1fr;
      gap: 6px;
    }
    .filters-card__row--top-left.filters-card__cell--span2 {
      grid-column: 1;
    }
    .filters-card__row--mid {
      grid-template-columns: 1fr;
      gap: 6px;
    }
    .filters-card__row--top .filter-pill,
    .filters-card__row--dates-wrap .filter-pill {
      min-width: 0 !important;
      padding: 9px 12px !important;
      font-size: 13px !important;
    }
    .filters-card__top-action.filters-clear {
      justify-content: center;
      min-width: 0;
    }
  }
  @media (max-width: 420px) {
    .filters-card__row--top {
      gap: 6px;
    }
    .filters-card__row--top .filter-pill,
    .filters-card__row--dates-wrap .filter-pill {
      min-width: 0 !important;
      padding: 9px 10px !important;
      font-size: 13px !important;
    }
    .filters-card__row--mid .filter-pill {
      padding: 9px 10px !important;
      font-size: 13px !important;
    }
  }
  .filters-card__row--mid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    gap: 8px;
    align-items: stretch;
    margin-bottom: 0;
  }
  .filters-card__row--mid .filter-pill { min-width: 0; }
  .filters-search-toggle { flex-shrink: 0; }
  .filters-search-input { color: #fff; }
  .filters-search-close { color: #fff; }
  .filters-search-input-wrap {
    position: relative;
    width: 100%;
    min-width: 0;
  }
  .filters-card__row--search {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: max-height 0.25s ease, opacity 0.2s ease;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
    margin-top: 0;
  }
  .filters-card__row--search.filters-card__row--search-open {
    max-height: 80px;
    opacity: 1;
    margin-top: 8px;
  }
  .filters-search-input {
    width: 100%;
    min-width: 0;
    padding: 10px 40px 10px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(255,255,255,.06);
    color: var(--text);
    outline: none;
    font-family: inherit;
  }
  .filters-search-input::placeholder { color: rgba(255,255,255,.5); }
  .filters-search-input:focus {
    border-color: rgba(41, 127, 150, .5);
    box-shadow: 0 0 0 2px rgba(41, 127, 150, .2);
  }
  .filters-search-input-clear {
    position: absolute;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
    width: 22px;
    height: 22px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.18);
    background: rgba(255,255,255,.10);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
  }
  .filters-search-input-clear:hover {
    background: rgba(255,255,255,.16);
    border-color: rgba(255,255,255,.26);
  }
  .filters-search-close {
    flex: 0 0 auto;
    width: 44px;
    height: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(255,255,255,.06);
    color: var(--text);
    cursor: pointer;
    font-size: 18px;
    transition: background 0.2s ease, border-color 0.2s ease;
  }
  .filters-search-close:hover {
    background: rgba(255,255,255,.1);
    border-color: rgba(255,255,255,.2);
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.14);
    background: rgba(255,255,255,.07);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    transition: transform .14s ease, background .14s ease, border-color .14s ease, box-shadow .14s ease;
    outline: none;
  }
  .filter-pill .pill-text {
    color: #fff;
    text-align: center;
  }
  .filter-pill:hover {
    background: rgba(255,255,255,.12);
    border-color: rgba(255,255,255,.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,.2);
  }
  .filter-pill:active { transform: translateY(0); }
  .filter-pill:focus-visible {
    box-shadow: 0 0 0 3px rgba(41, 127, 150, .35);
    border-color: rgba(41, 127, 150, .6);
  }
  .filter-pill .pill-icon {
    width: auto;
    height: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border-radius: 0;
  }
  .filter-pill.is-primary {
    background: linear-gradient(135deg, rgba(255,106,26,.20), rgba(233,78,27,.12));
    border-color: rgba(255,106,26,.35);
  }
  .filter-pill.is-danger {
    background: rgba(239,68,68,.14);
    border-color: rgba(239,68,68,0.35);
    color: #fff;
  }
  .filter-pill.is-danger:hover {
    background: rgba(239,68,68,.20);
    border-color: rgba(239,68,68,0.55);
  }
  .filter-pill.filter-pill--active {
    background: rgba(255,255,255,.12);
    border-color: rgba(255,255,255,.22);
    box-shadow: 0 2px 8px rgba(0,0,0,.2);
  }
  .filters-search-toggle {
    border-radius: 50%;
    width: 44px;
    position: relative;
    height: 44px;
    background: linear-gradient(135deg, rgba(41, 127, 150, 0.25) 0%, rgba(236, 72, 153, 0.2) 100%);
    border: 1px solid rgba(41, 127, 150, 0.4);
    box-shadow: 0 0 10px rgba(41, 127, 150, 0.2);
  }
  .filters-search-toggle.filter-pill--active {
    background: linear-gradient(135deg, rgba(41, 127, 150, 0.35) 0%, rgba(236, 72, 153, 0.3) 100%);
    border-color: rgba(41, 127, 150, 0.6);
    box-shadow: 0 0 14px rgba(41, 127, 150, 0.35);
  }
  .filters-search-toggle__content-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(236, 72, 153, 0.95);
    border: 1.5px solid rgba(255,255,255,0.9);
    pointer-events: none;
  }
  .filters-type-dropdown-panel button:hover {
    background: rgba(255,255,255,.08) !important;
    border-color: rgba(255,255,255,.15) !important;
  }
  .filters-type-dropdown-panel button[aria-selected="true"]:hover {
    background: rgba(41, 127, 150, 0.28) !important;
    border-color: rgba(41, 127, 150, 0.75) !important;
  }
  .filters-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(41, 127, 150, .2), transparent);
    margin: 14px 4px;
    opacity: .9;
  }
  .filters-card__row.chips { gap: 8px; justify-content: center; }
  .filters-card__row.chips .tab { flex: 0 0 auto; }
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
    background: #297F96;
    border-color: rgba(255,255,255,.2);
    color: #fff;
    font-weight: 700;
  }

  /* Tabs de secciones (fila horizontal con scroll) */
  .filters-tabs {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 14px;
    padding: 6px 4px 10px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: rgba(41, 127, 150, .4) transparent;
    border-radius: 16px;
    background: rgba(0,0,0,.2);
  }
  .filters-tabs::-webkit-scrollbar {
    height: 6px;
  }
  .filters-tabs::-webkit-scrollbar-thumb {
    background: rgba(41, 127, 150, .4);
    border-radius: 999px;
  }
  .tab {
    flex: 0 0 auto;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.9);
    border-radius: 999px;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition: transform .14s ease, background .14s ease, border-color .14s ease, box-shadow .14s ease;
    outline: none;
    letter-spacing: 0.02em;
  }
  .tab:hover {
    background: rgba(255,255,255,.1);
    border-color: rgba(255,255,255,.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,.2);
  }
  .tab:active { transform: translateY(0); }
  .tab:focus-visible {
    box-shadow: 0 0 0 3px rgba(41, 127, 150, .35);
    border-color: rgba(41, 127, 150, .6);
  }
  .tab--active {
    background: linear-gradient(180deg, #2d8ba8 0%, #297F96 100%);
    border-color: rgba(255,255,255,.28);
    color: #fff;
    box-shadow: 0 4px 16px rgba(41, 127, 150, .4), 0 0 0 1px rgba(255,255,255,.08) inset;
  }
  .tab--active:hover {
    background: linear-gradient(180deg, #34a0c0 0%, #2d8ba8 100%);
    border-color: rgba(255,255,255,.35);
    box-shadow: 0 6px 20px rgba(41, 127, 150, .45), 0 0 0 1px rgba(255,255,255,.1) inset;
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
    color: #fff;
  }
  .filters-fav__btn {
    border-radius: var(--fp-pill);
    border: 1px solid var(--fp-border-soft);
    background: #1b1f2a;
    color: #fff;
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
    font-size: 16px;
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
    /* Panel de filtros compacto (sheet con height: auto) */
    .filtersPanel-mobile {
      flex: none !important;
    }
    .filtersPanel__row--header {
      min-height: 36px !important;
      padding: 6px 10px !important;
    }
    .filtersPanel-mobile .filters-card {
      padding: 8px 0 0 !important;
    }
    .filtersPanel-mobile .filters-card__row--top {
      grid-template-columns: 1fr 1fr !important;
    }
    .filtersPanel-mobile .filters-card__row--top:not(.filters-card__row--top-with-dates) {
      grid-template-columns: 1fr !important;
    }
    .filtersPanel-mobile .filters-card__row--mid {
      grid-template-columns: 1fr 1fr 44px !important;
      margin-bottom: 0 !important;
    }
    .filtersPanel-mobile .filters-card__row--top,
    .filtersPanel-mobile .filters-card__row--mid {
      gap: 6px !important;
    }
    .filtersPanel-mobile .filter-pill,
    .filtersPanel-mobile .filters-card__row--top .filter-pill,
    .filtersPanel-mobile .filters-card__row--dates-wrap .filter-pill,
    .filtersPanel-mobile .filters-card__row--mid .filter-pill {
      min-height: 44px !important;
      max-height: 48px !important;
      padding: 8px 10px !important;
      font-size: 13px !important;
    }
    .filtersPanel-mobile .filters-search-toggle {
      width: 44px !important;
      height: 44px !important;
      min-width: 44px !important;
      min-height: 44px !important;
    }
    .filtersPanel-mobile .filters-card__row--search {
      margin-top: 6px !important;
    }
    .filtersPanel-mobile .filters-card__row--search.filters-card__row--search-open {
      max-height: 56px !important;
    }
    .filtersPanel-mobile .filters-fav {
      margin-bottom: 6px !important;
    }
    .filters-panel {
      max-width: 100% !important;
      padding: 10px 12px 0 !important;
      border-radius: 20px !important;
      margin: 0 auto !important;
      box-sizing: border-box;
    }
    .filters-card {
      padding: 12px 10px 10px !important;
      border-radius: 18px !important;
      max-width: 100% !important;
      min-width: 0 !important;
    }
    .filters-card__row--top,
    .filters-card__row--mid {
      gap: 6px !important;
    }
    .filters-card__row--top .filter-pill,
    .filters-card__row--dates-wrap .filter-pill {
      min-width: 0 !important;
      padding: 9px 12px !important;
      font-size: 13px !important;
    }
    .filters-card__row--mid .filter-pill {
      min-width: 0 !important;
      padding: 9px 12px !important;
      font-size: 13px !important;
    }
    .filters-top-row__title {
      display: none !important;
    }
    .filters-top-row {
      gap: 8px !important;
      margin-bottom: 10px !important;
      flex-wrap: nowrap !important;
      min-width: 0 !important;
    }
    .filters-top-row__search {
      flex: 1 1 auto !important;
      min-width: 0 !important;
    }
    .filters-top-row__actions {
      flex: 0 0 auto !important;
      flex-wrap: nowrap !important;
    }
    .filters-card__row--selects {
      gap: 8px !important;
      padding-bottom: 4px !important;
      margin: 0 -2px !important;
    }
    .filters-card__row--selects .filter-pill {
      min-width: 120px !important;
      padding: 8px 10px !important;
      font-size: 13px !important;
    }
    .filters-card__row--selects .filter-pill .pill-icon {
      width: 22px !important;
      height: 22px !important;
    }
    .filters-card__row.chips {
      gap: 6px !important;
      flex-wrap: nowrap !important;
      overflow-x: auto !important;
      overscroll-behavior-x: contain !important;
      -webkit-overflow-scrolling: touch !important;
      scrollbar-width: thin !important;
      padding-bottom: 2px !important;
      justify-content: flex-start !important;
    }
    .filters-card__row.chips::-webkit-scrollbar {
      height: 4px !important;
    }
    .filters-card__row.chips::-webkit-scrollbar-thumb {
      background: hsl(235 20% 28% / .6) !important;
      border-radius: 999px !important;
    }
    .filters-card__row.chips .tab,
    .filters-card__row.chips .chip {
      flex: 0 0 auto !important;
    }
    .filters-card__row.chips .tab {
      padding: 7px 10px !important;
      font-size: 12px !important;
    }
    .filters-card__row.chips .chip {
      padding: 7px 10px !important;
      font-size: 12px !important;
    }
    .filters-divider {
      margin: 10px 2px !important;
    }
    .filters-card .filters-clear {
      min-height: 40px !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: rgba(255,255,255,0.08) !important;
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
    .filters-search-expanded {
      margin-top: 6px !important;
      padding: 6px 0 !important;
    }
    .filters-search-expanded input {
      font-size: 16px !important;
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
      padding: 0 1rem !important;
    }
    .panel {
      margin: 1rem 0 !important;
      padding: 1rem !important;
      border-radius: 16px !important;
    }
    /* Mobile: primera sección como pantalla principal */
    .explore-container {
      display: flex;
      flex-direction: column;
      min-height: calc(100dvh - 64px - env(safe-area-inset-top, 0px));
    }
    .explore-container .wrap {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }
    .explore-container .filters-panel {
      flex-shrink: 0;
    }
    .section-container {
      margin-bottom: 0 !important;
      /* Mobile: pantalla completa, card centrada, fila de navegación */
      padding: 6px;
      display: grid;
      grid-template-rows: 1fr;
      align-items: center;
      justify-items: center;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .section-container:first-of-type {
      flex: 1;
      min-height: 0;
    }
    .section-container__main {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      max-width: 100%;
      min-height: 0;
      flex: 1;
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
      padding: 8px 10px 0 !important;
      border-radius: 18px !important;
      margin: 0 auto !important;
    }
    .filters-card {
      padding: 10px 8px 8px !important;
      border-radius: 16px !important;
    }
    .filters-card__row--top,
    .filters-card__row--mid {
      gap: 4px !important;
    }
    .filters-card__row--top .filter-pill,
    .filters-card__row--dates-wrap .filter-pill,
    .filters-card__row--mid .filter-pill {
      padding: 8px 10px !important;
      font-size: 12px !important;
    }
    .filters-card__top-action.filters-clear {
      padding: 8px 10px !important;
      font-size: 12px !important;
    }
    .filters-top-row {
      gap: 6px !important;
      margin-bottom: 8px !important;
    }
    .filters-top-row__search {
      flex: 1 1 100% !important;
      min-width: 0 !important;
    }
    .filters-card__row--selects .filter-pill {
      min-width: 100px !important;
      padding: 7px 9px !important;
      font-size: 12px !important;
    }
    .filters-card__row--selects .filter-pill .pill-text {
      font-size: 12px !important;
    }
    .filters-card__row--selects .filter-pill .pill-icon {
      width: 20px !important;
      height: 20px !important;
    }
    .filters-card__row.chips .tab,
    .filters-card__row.chips .chip {
      padding: 6px 9px !important;
      font-size: 11px !important;
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
      min-height: 40px !important;
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
      font-size: 16px !important;
      padding: 9px 12px 9px 36px !important;
    }
    .filters-search-input {
      font-size: 16px !important;
      padding: 10px 36px 10px 12px !important;
    }
    .filters-card__row--search.filters-card__row--search-open {
      max-height: 72px !important;
      margin-top: 6px !important;
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
      padding: 0 0.75rem !important;
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
      padding: 0 0.75rem !important;
    }
    .section-container {
      margin-bottom: 0 !important;
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
      padding: 9px 10px 0 !important;
      border-radius: 16px !important;
      margin: 0 auto !important;
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
      font-size: 16px !important;
      padding: 8px 10px 8px 34px !important;
    }
    .filters-search-expanded button {
      font-size: 9px !important;
      padding: 8px 10px !important;
      min-height: 40px !important;
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
      min-height: 40px !important;
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
  /* Android mobile: unificar offset del navbar y pegar filters-panel sin hueco */
  .app-shell-content:has(.explore-container.android-mobile) {
    padding-top: 0 !important;
  }
  .explore-container.android-mobile {
    padding-top: var(--topbar-offset) !important;
    margin-top: 0 !important;
  }
  .explore-container.android-mobile .wrap {
    padding-top: 0 !important;
    margin-top: 0 !important;
  }
  .explore-container.android-mobile .filters-panel {
    position: relative !important;
    top: 0 !important;
    z-index: auto;
    padding-top: 0 !important;
    margin-top: 0 !important;
    transform: none !important;
  }
  /* Android: evitar nested scroll en secciones (rompe pan vertical/horizontal sobre cards) */
  .explore-container.android-mobile .section-container {
    overflow: visible !important;
    overflow-y: visible !important;
    display: block !important;
    align-items: initial !important;
    justify-items: initial !important;
  }
  .explore-container.android-mobile .section-container:first-of-type {
    flex: initial !important;
    min-height: auto !important;
  }
  .explore-container.android-mobile .section-container__main {
    display: block !important;
    flex: initial !important;
    min-height: auto !important;
  }
  .explore-bottom-spacer {
    height: max(20px, env(safe-area-inset-bottom, 0px));
    width: 100%;
    pointer-events: none;
    flex-shrink: 0;
  }
`;

function FiltersLayout({
  isMobile,
  onClose,
  title,
  closeLabel,
  children,
  overlayStyle,
  onClickOverlay,
  onClearFilters,
  activeFiltersCount = 0,
  activeFiltersIndicatorCount,
}: {
  isMobile: boolean;
  onClose: () => void;
  title: string;
  closeLabel?: string;
  children: React.ReactNode;
  overlayStyle?: React.CSSProperties;
  onClickOverlay?: (e: React.MouseEvent) => void;
  onClearFilters?: () => void;
  activeFiltersCount?: number;
  /** Si se omite, coincide con activeFiltersCount (retrocompatibilidad). */
  activeFiltersIndicatorCount?: number;
}) {
  const indicatorCount = activeFiltersIndicatorCount ?? activeFiltersCount;
  if (!isMobile) return <>{children}</>;
  const topOffset = 'max(env(safe-area-inset-top), 16px)';
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        padding: `${topOffset} 12px 12px`,
        overflow: 'hidden',
        ...overlayStyle,
      }}
      onClick={onClickOverlay}
    >
      <div
        className="filtersPanel-mobile"
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: `calc(100vh - ${topOffset} - 24px)`,
          display: 'flex',
          flexDirection: 'column',
          background: '#161a22',
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,.08)',
          boxShadow: '0 8px 28px rgba(0,0,0,.32)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="filtersPanel__row--header" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 4, padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, minHeight: 36 }}>
          <span style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff' }}>{title}</span>
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              disabled={activeFiltersCount === 0}
              aria-label="Limpiar filtros"
              style={{
                height: 36,
                padding: '0 8px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: activeFiltersCount > 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 14,
                cursor: activeFiltersCount > 0 ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span aria-hidden style={{ opacity: activeFiltersCount > 0 ? 1 : 0.5 }}>↩</span>
              {indicatorCount > 0 && (
                <span style={{ minWidth: 16, height: 16, padding: '0 4px', fontSize: 11, fontWeight: 700, background: 'rgba(255,106,26,0.9)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{indicatorCount}</span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel ?? title}
            style={{
              width: 36,
              height: 36,
              padding: 0,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 12, overflowY: 'auto', flex: '0 1 auto', minHeight: 0 }}>{children}</div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  count,
  sectionId,
  subline,
  sectionMinHeight,
  headerAction,
  /** Si true: sin fade-in inicial (h2 visible de inmediato → mejor LCP en /explore). */
  skipEntranceAnimation,
}: {
  title: string;
  children: React.ReactNode;
  count?: number;
  sectionId?: string;
  subline?: string;
  sectionMinHeight?: number;
  headerAction?: React.ReactNode;
  skipEntranceAnimation?: boolean;
}) {
  const sectionStyle: React.CSSProperties = {
    marginBottom: "4rem",
    position: "relative",
    scrollMarginTop: "100px",
    ...(sectionMinHeight ? { minHeight: sectionMinHeight } : {}),
  };

  const inner = (
    <div className="section-container__main">
      <SectionHeader title={title} count={count} subline={subline} actionSlot={headerAction} />
      {children}
    </div>
  );

  if (skipEntranceAnimation) {
    return (
      <section className="section-container" data-section-id={sectionId} style={sectionStyle}>
        {inner}
      </section>
    );
  }

  return (
    <m.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="section-container"
      data-section-id={sectionId}
      style={sectionStyle}
    >
      {inner}
    </m.section>
  );
}

export default function ExploreHomeScreen() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { filters, set } = useExploreFilters();
  const [searchParams, setSearchParams] = useSearchParams();

  // Hidratar store desde la URL (igual criterio que /explore/list) para que landing y enlaces con ?type= apliquen el filter-pill.
  const searchParamsKey = searchParams.toString();
  React.useLayoutEffect(() => {
    const type = searchParams.get("type");
    const ritmosRaw = searchParams.get("ritmos");
    const zonasRaw = searchParams.get("zonas");
    const whenRaw = searchParams.get("when");
    const fromRaw = searchParams.get("from");
    const toRaw = searchParams.get("to");

    const parseCsv = (v: string | null) =>
      (v ? v.split(",") : [])
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n) && n > 0)
        .map((n) => Math.trunc(n));

    const nextPatch: Partial<ExploreFilters> = {};
    if (type) nextPatch.type = type as ExploreType;
    if (ritmosRaw !== null) nextPatch.ritmos = parseCsv(ritmosRaw);
    if (zonasRaw !== null) nextPatch.zonas = parseCsv(zonasRaw);
    if (whenRaw) nextPatch.datePreset = whenRaw as DatePreset;
    if (fromRaw !== null) nextPatch.dateFrom = fromRaw || undefined;
    if (toRaw !== null) nextPatch.dateTo = toRaw || undefined;

    if (Object.keys(nextPatch).length > 0) {
      set(nextPatch);
    }
  }, [searchParamsKey, set, searchParams]);

  // Mantener la URL alineada con el estado (misma lógica que ExploreListScreen).
  React.useEffect(() => {
    if (filters.type === "marcas") return;
    const params = new URLSearchParams(searchParams);
    params.set("type", filters.type);
    if ((filters.ritmos || []).length > 0) params.set("ritmos", filters.ritmos.join(","));
    else params.delete("ritmos");
    if ((filters.zonas || []).length > 0) params.set("zonas", filters.zonas.join(","));
    else params.delete("zonas");
    if (filters.datePreset) params.set("when", String(filters.datePreset));
    else params.delete("when");
    if (filters.dateFrom) params.set("from", filters.dateFrom);
    else params.delete("from");
    if (filters.dateTo) params.set("to", filters.dateTo);
    else params.delete("to");

    const next = params.toString();
    const curr = searchParams.toString();
    if (next !== curr) {
      setSearchParams(params, { replace: true });
    }
  }, [
    filters.type,
    filters.ritmos,
    filters.zonas,
    filters.datePreset,
    filters.dateFrom,
    filters.dateTo,
    searchParams,
    setSearchParams,
  ]);

  // "Marcas" oculto en el selector: si quedó persistido, volver a un tipo visible.
  React.useEffect(() => {
    if (filters.type === "marcas") set({ type: "fechas" });
  }, [filters.type, set]);
  const selectedType = (!filters.type || filters.type === 'all' ? 'fechas' : filters.type) as ExploreType;
  /** `sociales` en list usa otra query; en home el feed principal es el mismo que fechas (ocurrencias). */
  const isFechasLike = selectedType === 'fechas' || selectedType === 'sociales';
  /** Alinea el pill "Tipo" con TYPE_OPTIONS (solo incluye id `fechas` para sociales). */
  const exploreTypeMenuId = filters.type === 'sociales' ? 'fechas' : (filters.type || 'fechas');
  const showAll = false;

  const ritmosPillRef = React.useRef<HTMLButtonElement | null>(null);
  const zonasPillRef = React.useRef<HTMLButtonElement | null>(null);
  const fechasPillRef = React.useRef<HTMLButtonElement | null>(null);
  const typePillRef = React.useRef<HTMLButtonElement | null>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const searchToggleRef = React.useRef<HTMLButtonElement | null>(null);
  const hasSearchQuery = (filters.q ?? "").trim().length > 0;
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const [hasAppliedDefaults, setHasAppliedDefaults] = React.useState(false);
  const [usingFavoriteFilters, setUsingFavoriteFilters] = React.useState(false);
  const [openFilterDropdown, setOpenFilterDropdown] = React.useState<string | null>(null);
  const [filtersPanelOpen, setFiltersPanelOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_LIMIT);
  const [fechasViewMode, setFechasViewModeState] = React.useState<FechasViewMode>(() => {
    if (typeof window === "undefined") return "list";
    return readFechasViewMode() ?? "list";
  });
  const setFechasViewMode = React.useCallback((mode: FechasViewMode) => {
    setFechasViewModeState(mode);
    writeFechasViewMode(mode);
  }, []);

  const [exploreSectionViews, setExploreSectionViews] = React.useState(() => readExploreSectionViewModes());
  const setExploreSectionView = React.useCallback((id: ExploreListableSectionId, mode: ExploreSectionViewMode) => {
    setExploreSectionViews((prev) => patchExploreSectionViewMode(id, mode, prev));
  }, []);
  const setClasesViewMode = React.useCallback((mode: ExploreSectionViewMode) => {
    setExploreSectionView("clases", mode);
  }, [setExploreSectionView]);
  const setAcademiasViewMode = React.useCallback((mode: ExploreSectionViewMode) => {
    setExploreSectionView("academias", mode);
  }, [setExploreSectionView]);
  const setMaestrosViewMode = React.useCallback((mode: ExploreSectionViewMode) => {
    setExploreSectionView("maestros", mode);
  }, [setExploreSectionView]);
  const setUsuariosViewMode = React.useCallback((mode: ExploreSectionViewMode) => {
    setExploreSectionView("usuarios", mode);
  }, [setExploreSectionView]);
  const setOrganizadoresViewMode = React.useCallback((mode: ExploreSectionViewMode) => {
    setExploreSectionView("organizadores", mode);
  }, [setExploreSectionView]);
  const [mountedSections, setMountedSections] = React.useState<Set<ExploreSectionId>>(
    () => new Set(ABOVE_FOLD_SECTIONS)
  );

  React.useEffect(() => {
    if (openFilterDropdown !== "type") return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (typePillRef.current?.contains(target)) return;
      const panel = document.querySelector('.filters-type-dropdown-panel');
      if (panel?.contains(target)) return;
      setOpenFilterDropdown(null);
    };
    document.addEventListener("mousedown", handleClick, true);
    return () => document.removeEventListener("mousedown", handleClick, true);
  }, [openFilterDropdown]);

  // Keep search bar expanded while there is typed content.
  React.useEffect(() => {
    if (!hasSearchQuery) return;
    if (!searchOpen) setSearchOpen(true);
  }, [hasSearchQuery, searchOpen]);

  // Default UX: siempre iniciar en Sociales (fechas), sin "Todos" en primera carga.
  React.useEffect(() => {
    if (filters.type && filters.type !== 'all') return;
    set({ type: 'fechas' as ExploreType });
  }, [filters.type, set]);

  // Cerrar SOLO dropdowns de tipo y fechas al hacer scroll (que no sigan fijos en pantalla).
  // Ritmos/Zonas usan panel interactivo con scroll interno y no deben cerrarse al interactuar.
  React.useEffect(() => {
    if (!openFilterDropdown) return;
    const shouldCloseOnScroll = openFilterDropdown === "type" || openFilterDropdown === "fechas";
    if (!shouldCloseOnScroll) return;
    const closeOnScroll = () => setOpenFilterDropdown(null);
    window.addEventListener("scroll", closeOnScroll, { passive: true, capture: true });
    const container = document.querySelector(".explore-container");
    if (container) {
      container.addEventListener("scroll", closeOnScroll, { passive: true, capture: true });
    }
    return () => {
      window.removeEventListener("scroll", closeOnScroll, { capture: true });
      container?.removeEventListener("scroll", closeOnScroll, { capture: true });
    };
  }, [openFilterDropdown]);

  const shouldLoadTags =
    openFilterDropdown === "ritmos" ||
    openFilterDropdown === "zonas" ||
    selectedType === "fechas" ||
    selectedType === "sociales" ||
    selectedType === "marcas" ||
    selectedType === "clases" ||
    selectedType === "academias" ||
    selectedType === "maestros" ||
    selectedType === "usuarios" ||
    selectedType === "organizadores";
  const { data: allTags } = useTags(undefined, { enabled: shouldLoadTags });
  const tagMaps = React.useMemo(() => buildExploreTagMaps(allTags as any[] | null), [allTags]);
  const rhythmContext = React.useMemo(() => mapExploreTypeToContext(filters.type), [filters.type]);
  const zoneContext = React.useMemo(() => mapExploreTypeToZoneContext(filters.type), [filters.type]);
  const {
    rhythmIds: contextRhythmIds,
    isLoading: contextRhythmsLoading,
    isFetched: contextRhythmsFetched,
  } = useUsedRhythmsByContext(rhythmContext);
  const {
    zoneIds: contextZoneIds,
    isLoading: contextZonesLoading,
    isFetched: contextZonesFetched,
  } = useUsedZonesByContext(zoneContext);
  const { groups: zonaCatalogGroups } = useZonaCatalogGroups(
    (allTags as any[])?.filter((t: any) => t?.tipo === "zona") ?? null,
  );

  const { preferences, applyDefaultFilters, loading: prefsLoading } = useUserFilterPreferences();
  const { showToast } = useToast();

  const qDebounced = useDebouncedValue(filters.q || '', 450);
  const qDeferred = React.useDeferredValue(qDebounced);

  const hasConfiguredFavorites = React.useMemo(
    () => !!(preferences && (preferences as any).id),
    [preferences]
  );

  const { cardHeight, cardWidth, sectionMinHeight } = useExploreCardDimensions(isMobile);
  const { gridCardWidth, gridCardHeight, gridGap } = useExploreFechasGridDimensions(isMobile);

  React.useEffect(() => {
    if (!showAll) {
      const mountId: ExploreSectionId | null =
        selectedType === 'sociales'
          ? 'fechas'
          : ALL_EXPLORE_SECTIONS.includes(selectedType as ExploreSectionId)
            ? (selectedType as ExploreSectionId)
            : null;
      if (mountId) setMountedSections(new Set([mountId]));
      return;
    }

    setMountedSections(new Set(ABOVE_FOLD_SECTIONS));
    const pending = ALL_EXPLORE_SECTIONS.filter((s) => !ABOVE_FOLD_SECTIONS.includes(s));
    const cleaners: Array<() => void> = [];
    let cancelled = false;

    const mountNext = () => {
      if (cancelled || pending.length === 0) return;
      const next = pending.shift()!;
      setMountedSections((prev) => {
        if (prev.has(next)) return prev;
        const copy = new Set(prev);
        copy.add(next);
        return copy;
      });
      if (pending.length > 0) {
        cleaners.push(runWhenIdle(mountNext));
      }
    };

    cleaners.push(runWhenIdle(mountNext, 220));

    return () => {
      cancelled = true;
      cleaners.forEach((dispose) => dispose());
    };
  }, [showAll, selectedType]);

  const shouldRenderSection = React.useCallback(
    (section: ExploreSectionId) => {
      if (!showAll) {
        if (section === 'fechas' && isFechasLike) return true;
        return selectedType === section;
      }
      return mountedSections.has(section);
    },
    [mountedSections, selectedType, showAll, isFechasLike],
  );

  const sliderProps = React.useMemo(
    () => ({
      className: isMobile ? 'explore-slider explore-slider--mobile' : 'explore-slider',
      // No pasar autoColumns en mobile - el componente HorizontalSlider ya tiene estilos CSS para mobile
      autoColumns: undefined,
      // En escritorio, deshabilitar scroll dentro del carrusel (evita que se “trabe” la interacción/scroll de la página)
      disableDesktopScroll: true,
      // Botones Anterior/Siguiente visibles en escritorio y móvil
      showNavButtons: true,
      // En mobile: fila inferior dedicada; en desktop: overlay lateral
      navPosition: (isMobile ? 'bottom' : 'overlay') as 'bottom' | 'overlay',
      itemHeight: cardHeight > 0 ? cardHeight : undefined,
      itemWidth: cardWidth > 0 ? cardWidth : undefined,
      // Evita que un swipe corto en carrusel bloquee el scroll vertical del contenedor padre.
      preferVerticalScroll: true,
    }),
    [isMobile, cardHeight, cardWidth]
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setIsMobile(window.innerWidth < 768);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // [PERF] hitos de carga (Android logcat | grep PERF)
  React.useEffect(() => {
    mark("first_screen_mount");
    mark("data_fetch_start", false);
  }, []);

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
      // Fin de semana = viernes + sábado + domingo (no solo sáb-dom).
      const day = todayDate.getDay(); // 0=Dom .. 6=Sáb
      let daysToFriday: number;
      if (day === 0) {
        daysToFriday = -2; // Domingo → viernes de ese mismo fin
      } else if (day === 6) {
        daysToFriday = -1; // Sábado → viernes anterior
      } else if (day >= 1 && day <= 4) {
        daysToFriday = 5 - day; // Lun–Jue → viernes de la misma semana calendario
      } else {
        daysToFriday = 0; // Viernes
      }
      const fri = addDays(todayDate, daysToFriday);
      const sun = addDays(fri, 2);
      return {
        from: fri.toISOString().slice(0, 10),
        to: sun.toISOString().slice(0, 10),
      };
    }
    if (preset === "siguientes") {
      // "Posteriores" = desde manana en adelante (no desde la proxima semana).
      const from = addDays(todayDate, 1).toISOString().slice(0, 10);
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

    // Preset legado removido de filtros rápidos: limpiar estado persistido antiguo.
    if (filters.datePreset === "siguientes") {
      if (filters.dateFrom !== undefined || filters.dateTo !== undefined) {
        set({ datePreset: "todos", dateFrom: undefined, dateTo: undefined });
      } else {
        set({ datePreset: "todos" });
      }
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
      const { from, to } = computePresetRange(preset);
      set({ datePreset: preset, dateFrom: from, dateTo: to });
    },
    [filters.datePreset, computePresetRange, set],
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
    const locale = getLocaleFromI18n();
    const fmtYmd = (s: string) => {
      const [y, m, d] = s.split("-").map(Number);
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return s;
      return new Date(y, m - 1, d).toLocaleDateString(locale, { day: "numeric", month: "short" });
    };
    const preset = filters.datePreset ?? "todos";
    if (preset === "todos" && !filters.dateFrom && !filters.dateTo) return t("all");
    if (preset === "hoy") return t("today");
    if (preset === "manana") return t("tomorrow");
    if (preset === "semana") return t("this_week");
    if (preset === "fin_de_semana") return t("weekend");
    if (preset === "siguientes") return t("next_week");
    if (filters.dateFrom && filters.dateTo) {
      const from = filters.dateFrom;
      const to = filters.dateTo;
      if (from === to) return fmtYmd(from);
      return t("date_range_from_to", { from: fmtYmd(from), to: fmtYmd(to) });
    }
    if (filters.dateFrom) return `${t("from")} ${fmtYmd(filters.dateFrom)}`;
    if (filters.dateTo) return `${t("to")} ${fmtYmd(filters.dateTo)}`;
    return t("all");
  }, [t, i18n.language, filters.datePreset, filters.dateFrom, filters.dateTo]);

  const hasDateFilterActive = Boolean(
    (filters.datePreset && filters.datePreset !== "todos") || filters.dateFrom || filters.dateTo
  );

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.type !== 'all') count += 1;
    if (filters.q) count += 1;
    count += stableRitmos.length;
    count += stableZonas.length;
    if (filters.dateFrom || filters.dateTo) count += 1;
    return count;
  }, [filters.type, filters.q, stableRitmos.length, stableZonas.length, filters.dateFrom, filters.dateTo]);

  /** Badge / contador: no mostrar si solo aplica el filtro de tipo (el tipo ya se ve en la UI). */
  const activeFiltersIndicatorCount = React.useMemo(() => {
    const hasNonDefaultDate =
      Boolean(filters.dateFrom || filters.dateTo) ||
      (Boolean(filters.datePreset) && filters.datePreset !== 'todos');
    const otherThanType =
      (filters.q ? 1 : 0) +
      stableRitmos.length +
      stableZonas.length +
      (hasNonDefaultDate ? 1 : 0);
    if (otherThanType === 0) return 0;
    return activeFiltersCount;
  }, [
    activeFiltersCount,
    filters.q,
    stableRitmos.length,
    stableZonas.length,
    filters.dateFrom,
    filters.dateTo,
    filters.datePreset,
  ]);

  // Memoizar handlePreNavigate para evitar re-renders de cards
  const handlePreNavigate = React.useCallback(() => {
    try { if ('scrollRestoration' in window.history) { (window.history as any).scrollRestoration = 'manual'; } } catch { }
    try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch { }
  }, []);

  const shouldLoadFechas = isFechasLike;
  const fechasQuery = useExploreQuery({
    type: 'fechas',
    q: qDeferred || undefined,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    pageSize: 18,
    enabled: shouldLoadFechas
  });
  const fechasLoadMore = useLoadMoreOnDemand(shouldLoadFechas ? fechasQuery : null);
  const fechasLoading = fechasQuery.isLoading;
  const fechasError = (fechasQuery as any).isError;
  const fechasErrObj = (fechasQuery as any).error;
  const [fechasTimedOut, setFechasTimedOut] = React.useState(false);
  const fechasData = React.useMemo(() => {
    if (!shouldLoadFechas) return [];
    return flattenQueryData(fechasQuery.data);
  }, [fechasQuery.data, shouldLoadFechas]);

  // Evitar loading infinito en mobile: si la primera carga tarda demasiado, mostrar error con reintento.
  const fechasReqKey = React.useMemo(() => {
    const qk = String(qDeferred || '');
    const r = Array.isArray(filters.ritmos) ? filters.ritmos.join(',') : '';
    const z = Array.isArray(filters.zonas) ? filters.zonas.join(',') : '';
    return `${qk}|${r}|${z}|${filters.dateFrom || ''}|${filters.dateTo || ''}`;
  }, [qDeferred, filters.ritmos, filters.zonas, filters.dateFrom, filters.dateTo]);

  React.useEffect(() => {
    if (!shouldLoadFechas) {
      setFechasTimedOut(false);
      return;
    }
    if (!fechasLoading) {
      setFechasTimedOut(false);
      return;
    }
    const t = window.setTimeout(() => setFechasTimedOut(true), 20_000);
    return () => window.clearTimeout(t);
  }, [shouldLoadFechas, fechasLoading, fechasReqKey]);

  // WebView: si hay timeout o error de fetch, notificar al host (evita "loading infinito" en la app)
  React.useEffect(() => {
    if (fechasTimedOut) {
      notifyError({ scope: "fechas", reason: "timeout" });
    }
  }, [fechasTimedOut]);

  React.useEffect(() => {
    if (fechasError) {
      notifyError({ scope: "fechas", reason: "fetch_error" });
    }
  }, [fechasError]);

  const filteredFechas = useFilteredFechas({
    fechasData,
    todayYmd,
    qDeferred,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    datePreset: filters.datePreset,
    selectedType,
  });

  /** Eventos con __ui precomputado: cero hooks/queries por card en Explore. */
  const normalizedFechas = React.useMemo(
    () => normalizeEventsForCards(filteredFechas, allTags as any[]),
    [filteredFechas, allTags]
  );
  const hasExactDateFilter = React.useMemo(
    () =>
      isFechasLike &&
      !!filters.dateFrom &&
      !!filters.dateTo &&
      filters.dateFrom === filters.dateTo,
    [isFechasLike, filters.dateFrom, filters.dateTo],
  );

  React.useEffect(() => {
    setVisibleCount(INITIAL_LIMIT);
  }, [selectedType, qDeferred, filters.ritmos, filters.zonas, filters.dateFrom, filters.dateTo, filters.datePreset]);

  // Fecha especifica: traer todas las paginas para no ocultar eventos despues de las primeras cards.
  React.useEffect(() => {
    if (!hasExactDateFilter) return;
    if (!fechasQuery.hasNextPage || fechasQuery.isFetchingNextPage || fechasQuery.isFetching) return;
    let cancelled = false;
    const loadAllPages = async () => {
      let r: { hasNextPage?: boolean } | undefined = await fechasQuery.fetchNextPage();
      while (!cancelled && r?.hasNextPage) {
        r = await fechasQuery.fetchNextPage();
      }
    };
    void loadAllPages();
    return () => { cancelled = true; };
  }, [hasExactDateFilter, fechasQuery.hasNextPage, fechasQuery.isFetchingNextPage, fechasQuery.isFetching, fechasQuery.fetchNextPage]);

  const visibleFechas = React.useMemo(
    () => (hasExactDateFilter ? normalizedFechas : normalizedFechas.slice(0, visibleCount)),
    [normalizedFechas, visibleCount, hasExactDateFilter]
  );
  const hasMoreServer = !!fechasQuery.hasNextPage;
  const hasMoreClient = normalizedFechas.length > visibleCount;
  const showLoadMoreCard = isFechasLike && (hasMoreClient || hasMoreServer);
  const loadMoreBusyRef = React.useRef(false);

  const onLoadMoreFechas = React.useCallback(async () => {
    if (loadMoreBusyRef.current) return;
    loadMoreBusyRef.current = true;
    const nextCount = visibleCount + NEXT_LIMIT;
    try {
      if (normalizedFechas.length >= nextCount) {
        setVisibleCount(nextCount);
        return;
      }
      if (fechasQuery.hasNextPage && !fechasQuery.isFetchingNextPage) {
        await fechasQuery.fetchNextPage();
      }
      setVisibleCount(nextCount);
    } catch {
      /* fetch failure: UI keeps current page; avoid console noise in lists */
    } finally {
      loadMoreBusyRef.current = false;
    }
  }, [visibleCount, normalizedFechas.length, fechasQuery.hasNextPage, fechasQuery.isFetchingNextPage, fechasQuery.fetchNextPage]);

  const fechasSliderItems = React.useMemo(
    () => (showLoadMoreCard ? [...visibleFechas, { __type: "load_more" as const }] : visibleFechas),
    [showLoadMoreCard, visibleFechas]
  );

  /** Fila 1 — recién cargados (created_at / updated_at desc). */
  const fechasRowRecent = React.useMemo(() => sortFechasByRecentFirst(visibleFechas), [visibleFechas]);

  const fechasGridSliderProps = React.useMemo(
    () => ({
      className: isMobile
        ? "explore-slider explore-slider--mobile explore-slider--fechas-grid"
        : "explore-slider explore-slider--fechas-grid",
      autoColumns: undefined,
      disableDesktopScroll: true,
      showNavButtons: true,
      navPosition: (isMobile ? "bottom" : "overlay") as "bottom" | "overlay",
      gap: gridGap,
      itemHeight: gridCardHeight > 0 ? gridCardHeight : undefined,
      itemWidth: gridCardWidth > 0 ? gridCardWidth : undefined,
      scrollStep: 0.82,
      /** Scroll vertical de página fluido sobre la zona del carrusel (app-shell / Android). */
      preferVerticalScroll: true,
    }),
    [isMobile, gridCardHeight, gridCardWidth, gridGap]
  );

  const fechasGridSectionMinHeight = React.useMemo(() => {
    if (gridCardHeight <= 0) return undefined;
    return gridCardHeight * 2 + 140;
  }, [gridCardHeight]);

  /** Vista cuadrícula: cards compactas + misma fila “cargar más” solo en fila 2 (orden fecha/hora). */
  const renderFechaGridItem = React.useCallback(
    (fechaEvento: any, idx: number) => {
      if ((fechaEvento as any)?.__type === "load_more") {
        return (
          <LoadMoreCard
            key="load-more-fechas"
            onClick={onLoadMoreFechas}
            loading={!!fechasQuery.isFetchingNextPage}
            title={t("load_more") || "Cargar más"}
            subtitle={t("explore_type_sociales") || "Ver más sociales"}
          />
        );
      }

      return (
        <div
          onClickCapture={handlePreNavigate}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 0,
            overflow: "hidden",
            boxShadow: "0 4px 18px rgba(0,0,0,0.2)",
            height: "100%",
          }}
        >
          <DeferredChunk
            fallback={<div style={{ minHeight: gridCardHeight > 0 ? gridCardHeight : 220, background: "rgba(255,255,255,0.05)" }} />}
          >
            <EventSocialGridCard item={fechaEvento} priority={idx === 0} />
          </DeferredChunk>
        </div>
      );
    },
    [gridCardHeight, handlePreNavigate, onLoadMoreFechas, fechasQuery.isFetchingNextPage, t]
  );

  const renderClaseCarouselItem = React.useCallback(
    (item: any, idx: number) => {
      if (item?.__isCTA) {
        return (
          <m.div
            key="cta-clases"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            whileHover={{ y: -2 }}
            style={{ height: "100%", display: "flex", alignItems: "stretch" }}
          >
            <CTACard text={t("cta_classes")} sectionType="clases" idx={idx} />
          </m.div>
        );
      }
      const rowKey = `${item.ownerType || "owner"}-${item.ownerId ?? "unknown"}-${item.titulo ?? "class"}-${item.fecha ?? (Array.isArray(item.diasSemana) ? item.diasSemana.join("-") : "semana")}-${idx}`;
      return (
        <div
          key={rowKey}
          onClickCapture={handlePreNavigate}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 0,
            overflow: "hidden",
            boxShadow: "0 4px 18px rgba(0,0,0,0.2)",
            height: "100%",
          }}
        >
          <ClassExploreGridCard item={item} priority={idx === 0} />
        </div>
      );
    },
    [handlePreNavigate, t]
  );

  const renderMaestroCarouselItem = React.useCallback(
    (item: any, idx: number) => {
      if (item?.__isCTA) {
        return (
          <m.div
            key="cta-maestros"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            whileHover={{ y: -2 }}
            style={{ height: "100%", display: "flex", alignItems: "stretch" }}
          >
            <CTACard text={t("cta_teachers")} sectionType="maestros" idx={idx} />
          </m.div>
        );
      }
      return (
        <div
          key={item.id ?? idx}
          onClickCapture={handlePreNavigate}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 0,
            overflow: "hidden",
            boxShadow: "0 4px 18px rgba(0,0,0,0.2)",
            height: "100%",
          }}
        >
          <ProfileExploreGridCard variant="teacher" item={item} priority={idx === 0} tagMaps={tagMaps} />
        </div>
      );
    },
    [handlePreNavigate, t, tagMaps]
  );

  const renderUsuarioCarouselItem = React.useCallback(
    (item: any, idx: number) => (
      <div
        key={item.id ?? idx}
        onClickCapture={handlePreNavigate}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 0,
          overflow: "hidden",
          boxShadow: "0 4px 18px rgba(0,0,0,0.2)",
          height: "100%",
        }}
      >
        <ProfileExploreGridCard
          variant="dancer"
          item={item}
          priority={idx === 0}
          tagMaps={tagMaps}
        />
      </div>
    ),
    [handlePreNavigate, tagMaps]
  );

  const renderOrganizerCarouselItem = React.useCallback(
    (item: any, idx: number) => {
      if (item?.__isCTA) {
        return (
          <m.div
            key="cta-organizadores"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            whileHover={{ y: -2 }}
            style={{ height: "100%", display: "flex", alignItems: "stretch" }}
          >
            <CTACard text={t("cta_organizers")} sectionType="organizadores" idx={idx} />
          </m.div>
        );
      }
      return (
        <div
          key={item.id ?? idx}
          onClickCapture={handlePreNavigate}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 0,
            overflow: "hidden",
            boxShadow: "0 4px 18px rgba(0,0,0,0.2)",
            height: "100%",
          }}
        >
          <ProfileExploreGridCard variant="organizer" item={item} priority={idx === 0} tagMaps={tagMaps} />
        </div>
      );
    },
    [handlePreNavigate, t, tagMaps]
  );

  const renderMarcaCarouselItem = React.useCallback(
    (item: any, idx: number) => {
      if (item?.__isCTA) {
        return (
          <div key="cta-marcas" style={{ display: "flex", alignItems: "stretch" }}>
            <CTACard text={t("cta_brands")} sectionType="marcas" idx={idx} />
          </div>
        );
      }
      return (
        <div
          key={item.id ?? idx}
          onClickCapture={handlePreNavigate}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 0,
            overflow: "hidden",
            boxShadow: "0 4px 18px rgba(0,0,0,0.2)",
          }}
        >
          <BrandCard item={item} priority={idx === 0} />
        </div>
      );
    },
    [handlePreNavigate, t]
  );

  const formatFechasListDate = React.useCallback((ymd?: string | null) => {
    if (!ymd) return "";
    try {
      const [y, m, d] = String(ymd).split("-").map(Number);
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return String(ymd);
      return new Date(y, m - 1, d)
        .toLocaleDateString(getLocaleFromI18n(), { weekday: "long", day: "numeric", month: "short" })
        .replace(",", "");
    } catch {
      return String(ymd);
    }
  }, []);

  const renderFechaListItem = React.useCallback(
    (fechaEvento: any, idx: number) => {
      if ((fechaEvento as any)?.__type === "load_more") {
        return (
          <div key="load-more-fechas" className="explore-fechas-list__load-more" role="listitem">
            <LoadMoreCard
              onClick={onLoadMoreFechas}
              loading={!!fechasQuery.isFetchingNextPage}
              title={t("load_more") || "Cargar más"}
              subtitle={t("explore_type_sociales") || "Ver más sociales"}
            />
          </div>
        );
      }

      const key =
        (fechaEvento as any)?._recurrence_index !== undefined
          ? `${(fechaEvento as any)?._original_id || fechaEvento?.id}_${(fechaEvento as any)?._recurrence_index}_${getEffectiveEventDateYmd(fechaEvento)}_${String(fechaEvento?.hora_inicio || fechaEvento?.evento_hora_inicio || "")}`
          : buildEventOccurrenceKey(fechaEvento);
      const currentDate = getEffectiveEventDateYmd(fechaEvento);
      const prevItem = idx > 0 ? fechasSliderItems[idx - 1] : null;
      const prevDate = prevItem && (prevItem as any)?.__type !== "load_more" ? getEffectiveEventDateYmd(prevItem) : null;
      const isNewDay = Boolean(currentDate && currentDate !== prevDate);
      const separatorLabel = currentDate ? formatFechasListDate(currentDate) : "";

      return (
        <React.Fragment key={key}>
          {isNewDay && separatorLabel ? (
            <div className="explore-fechas-list__date-sep" role="separator" aria-label={separatorLabel}>
              <div className="explore-fechas-list__date-sep-line" />
              <span className="explore-fechas-list__date-sep-label">{separatorLabel}</span>
              <div className="explore-fechas-list__date-sep-line" />
            </div>
          ) : null}
          <div
            role="listitem"
            onClickCapture={handlePreNavigate}
            style={{ width: "100%" }}
          >
            <EventListRow item={fechaEvento} priority={idx === 0} tagMaps={tagMaps} />
          </div>
        </React.Fragment>
      );
    },
    [fechasQuery.isFetchingNextPage, fechasSliderItems, formatFechasListDate, handlePreNavigate, onLoadMoreFechas, t, tagMaps]
  );

  const renderFechaCarteleraItem = React.useCallback(
    (fechaEvento: any, idx: number) => {
      if ((fechaEvento as any)?.__type === "load_more") {
        return (
          <div key="load-more-fechas" className="explore-fechas-cartelera__load-more" role="listitem">
            <LoadMoreCard
              onClick={onLoadMoreFechas}
              loading={!!fechasQuery.isFetchingNextPage}
              title={t("load_more") || "Cargar más"}
              subtitle={t("explore_type_sociales") || "Ver más sociales"}
            />
          </div>
        );
      }

      const key =
        (fechaEvento as any)?._recurrence_index !== undefined
          ? `${(fechaEvento as any)?._original_id || fechaEvento?.id}_${(fechaEvento as any)?._recurrence_index}_${getEffectiveEventDateYmd(fechaEvento)}_${String(fechaEvento?.hora_inicio || fechaEvento?.evento_hora_inicio || "")}`
          : buildEventOccurrenceKey(fechaEvento);

      return (
        <div key={key} role="listitem" onClickCapture={handlePreNavigate} style={{ minWidth: 0 }}>
          <DeferredChunk
            fallback={<div style={{ minHeight: cardHeight > 0 ? cardHeight : 320, borderRadius: 16, background: "rgba(255,255,255,0.05)" }} />}
          >
            <EventCarteleraCard item={fechaEvento} priority={idx === 0} />
          </DeferredChunk>
        </div>
      );
    },
    [cardHeight, handlePreNavigate, onLoadMoreFechas, fechasQuery.isFetchingNextPage, t]
  );

  const shouldLoadMaestros = selectedType === 'maestros' || selectedType === 'clases';
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

  const shouldLoadOrganizadores = selectedType === 'organizadores';
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

  const shouldLoadAcademias = selectedType === 'academias' || selectedType === 'clases';
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

  const shouldLoadMarcas = selectedType === 'marcas';
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

  const shouldLoadUsuarios = selectedType === 'usuarios';
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

  // Si hay filtro de zonas activo, calentar SOLO la siguiente página del contexto visible.
  // Evita ráfagas de requests al aplicar filtros en Android/WebView.
  const hasZoneFilter = (filters.zonas?.length || 0) > 0;
  const zoneAutoLoadBusyRef = React.useRef<Record<string, boolean>>({});
  const runZoneWarmupPage = React.useCallback(async (key: string, queryLike: any) => {
    if (!queryLike) return;
    if (zoneAutoLoadBusyRef.current[key]) return;
    if (!queryLike.hasNextPage || queryLike.isFetchingNextPage || queryLike.isLoading) return;
    zoneAutoLoadBusyRef.current[key] = true;
    try {
      await queryLike.fetchNextPage();
    } catch {
      /* optional prefetch; ignore */
    } finally {
      zoneAutoLoadBusyRef.current[key] = false;
    }
  }, []);

  React.useEffect(() => {
    if (!hasZoneFilter) return;
    if (!isFechasLike) return;
    void runZoneWarmupPage('fechas', fechasQuery);
  }, [hasZoneFilter, isFechasLike, fechasQuery.hasNextPage, fechasQuery.isFetchingNextPage, fechasQuery.isLoading, fechasQuery.fetchNextPage, runZoneWarmupPage]);

  React.useEffect(() => {
    if (!hasZoneFilter) return;
    if (selectedType !== 'academias') return;
    void runZoneWarmupPage('academias', academiasQuery);
  }, [hasZoneFilter, selectedType, academiasQuery.hasNextPage, academiasQuery.isFetchingNextPage, academiasQuery.isLoading, academiasQuery.fetchNextPage, runZoneWarmupPage]);

  React.useEffect(() => {
    if (!hasZoneFilter) return;
    if (selectedType !== 'maestros') return;
    void runZoneWarmupPage('maestros', maestrosQuery);
  }, [hasZoneFilter, selectedType, maestrosQuery.hasNextPage, maestrosQuery.isFetchingNextPage, maestrosQuery.isLoading, maestrosQuery.fetchNextPage, runZoneWarmupPage]);

  React.useEffect(() => {
    if (!hasZoneFilter) return;
    if (selectedType !== 'organizadores') return;
    void runZoneWarmupPage('organizadores', organizadoresQuery);
  }, [hasZoneFilter, selectedType, organizadoresQuery.hasNextPage, organizadoresQuery.isFetchingNextPage, organizadoresQuery.isLoading, organizadoresQuery.fetchNextPage, runZoneWarmupPage]);

  React.useEffect(() => {
    if (!hasZoneFilter) return;
    if (selectedType !== 'marcas') return;
    void runZoneWarmupPage('marcas', marcasQuery);
  }, [hasZoneFilter, selectedType, marcasQuery.hasNextPage, marcasQuery.isFetchingNextPage, marcasQuery.isLoading, marcasQuery.fetchNextPage, runZoneWarmupPage]);

  React.useEffect(() => {
    if (!hasZoneFilter) return;
    if (selectedType !== 'usuarios') return;
    void runZoneWarmupPage('usuarios', usuariosQuery);
  }, [hasZoneFilter, selectedType, usuariosQuery.hasNextPage, usuariosQuery.isFetchingNextPage, usuariosQuery.isLoading, usuariosQuery.fetchNextPage, runZoneWarmupPage]);

  React.useEffect(() => {
    if (!hasZoneFilter) return;
    if (selectedType !== 'clases') return;
    void runZoneWarmupPage('clases_academias', academiasQuery);
    void runZoneWarmupPage('clases_maestros', maestrosQuery);
  }, [
    hasZoneFilter,
    selectedType,
    academiasQuery.hasNextPage,
    academiasQuery.isFetchingNextPage,
    academiasQuery.isLoading,
    academiasQuery.fetchNextPage,
    maestrosQuery.hasNextPage,
    maestrosQuery.isFetchingNextPage,
    maestrosQuery.isLoading,
    maestrosQuery.fetchNextPage,
    runZoneWarmupPage,
  ]);

  // Usuarios: warmup de una sola página extra por combinación de filtros.
  // Evita descargas completas en background.
  const usuariosAutoLoadRef = React.useRef(false);
  const usuariosWarmupDoneKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    // Importante: no autoload cuando "showAll" está activo (pantalla inicial),
    // porque dispara muchas requests y puede inflar first_screen_mount.
    if (!shouldLoadUsuarios || selectedType !== 'usuarios' || !usuariosQuery.data) {
      usuariosAutoLoadRef.current = false;
      return;
    }
    const usersWarmupKey = [
      String(qDeferred || '').trim().toLowerCase(),
      Array.isArray(filters.ritmos) ? [...filters.ritmos].sort((a, b) => a - b).join(',') : '',
      Array.isArray(filters.zonas) ? [...filters.zonas].sort((a, b) => a - b).join(',') : '',
    ].join('|');
    if (usuariosWarmupDoneKeyRef.current === usersWarmupKey) return;

    // Si hay más páginas y no se está cargando, precargar solo la siguiente página.
    if (usuariosQuery.hasNextPage && !usuariosQuery.isFetchingNextPage && !usuariosQuery.isLoading && !usuariosAutoLoadRef.current) {
      usuariosAutoLoadRef.current = true;
      usuariosQuery.fetchNextPage()
        .then(() => {
          usuariosWarmupDoneKeyRef.current = usersWarmupKey;
          usuariosAutoLoadRef.current = false;
        })
        .catch(() => {
          usuariosAutoLoadRef.current = false;
        });
    } else if (!usuariosQuery.hasNextPage) {
      usuariosWarmupDoneKeyRef.current = usersWarmupKey;
      usuariosAutoLoadRef.current = false;
    }
  }, [
    shouldLoadUsuarios,
    selectedType,
    qDeferred,
    filters.ritmos,
    filters.zonas,
    usuariosQuery.hasNextPage,
    usuariosQuery.isFetchingNextPage,
    usuariosQuery.isLoading,
    usuariosQuery.data,
    usuariosQuery.fetchNextPage,
  ]);

  // [PERF] data_fetch_end cuando llega la primera data (fechas es la sección principal)
  const perfDataFetchEndDone = React.useRef(false);
  React.useEffect(() => {
    if (perfDataFetchEndDone.current || !shouldLoadFechas) return;
    const pages = fechasQuery.data?.pages;
    if (pages?.length && (pages[0]?.data?.length ?? 0) > 0) {
      perfDataFetchEndDone.current = true;
      mark("data_fetch_end");
    }
  }, [shouldLoadFechas, fechasQuery.data]);

  // [PERF] list_render_end + READY (handshake con WebView) tras primer paint con contenido
  const perfReadySent = React.useRef(false);
  React.useEffect(() => {
    if (perfReadySent.current) return;
    const hasListContent = filteredFechas.length > 0;
    const loadingDone = !fechasLoading;
    if (!hasListContent && !loadingDone) return;
    const rafId = requestAnimationFrame(() => {
      if (perfReadySent.current) return;
      perfReadySent.current = true;
      if (hasListContent) mark("list_render_end");
      notifyReady();
    });
    return () => cancelAnimationFrame(rafId);
  }, [filteredFechas.length, fechasLoading]);

  const classesList = useClassesList({
    academiasData,
    maestrosData,
    allTags: allTags as any[] | undefined,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    datePreset: filters.datePreset,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    qDeferred,
    todayYmd,
    t,
    language: i18n.language,
  });

  const validUsuarios = React.useMemo(
    () =>
      usuariosData.filter((u: any) => u && u.display_name && u.display_name.trim() !== ''),
    [usuariosData]
  );
  const normalizedValidUsuarios = React.useMemo(
    () =>
      validUsuarios.map((u: any) => ({
        ...u,
        id: u.user_id ?? u.id,
      })),
    [validUsuarios]
  );

  const hasFechas = filteredFechas.length > 0;
  const hasClases = classesList.length > 0;
  const hasAcademias = academiasData.length > 0;
  const hasUsuarios = normalizedValidUsuarios.length > 0;
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
        ...normalizedValidUsuarios,
        ...organizadoresData,
        ...marcasData,
      ];
    }
    if (type === 'fechas' || type === 'sociales') return filteredFechas;
    if (type === 'clases') return classesList;
    if (type === 'maestros') return maestrosData;
    if (type === 'academias') return academiasData;
    if (type === 'usuarios') return normalizedValidUsuarios;
    if (type === 'organizadores') return organizadoresData;
    if (type === 'marcas') return marcasData;
    return [];
  }, [filters.type, filteredFechas, classesList, maestrosData, academiasData, normalizedValidUsuarios, organizadoresData, marcasData]);

  const availableFilters = React.useMemo(
    () => buildAvailableFilters(itemsForAvailableFilters, { ritmoNameById, zonaNameById, ritmoIdBySlug, zonaIdBySlug }),
    [itemsForAvailableFilters, ritmoNameById, zonaNameById, ritmoIdBySlug, zonaIdBySlug],
  );

  const availableRitmoIdSet = React.useMemo(() => {
    // Sin contexto específico, usar lo visible en pantalla.
    if (!rhythmContext) return availableFilters.ritmoIdSet;
    // Mientras carga el contexto, mantener visibles para evitar parpadeos/vacíos.
    if (contextRhythmsLoading || !contextRhythmsFetched) return availableFilters.ritmoIdSet;
    // Contexto cargado: intersección entre backend contextual y resultados visibles.
    const contextSet = new Set<number>(contextRhythmIds || []);
    // Si aún no hay dataset visible materializado, no vaciar con intersección.
    if (availableFilters.ritmoIdSet.size === 0) return contextSet;
    const out = new Set<number>();
    availableFilters.ritmoIdSet.forEach((id) => {
      if (contextSet.has(id)) out.add(id);
    });
    return out;
  }, [rhythmContext, contextRhythmsLoading, contextRhythmsFetched, contextRhythmIds, availableFilters.ritmoIdSet]);

  const availableZonaIdSet = React.useMemo(() => {
    if (!zoneContext) return availableFilters.zonaIdSet;
    // Mientras carga, no vaciar opciones: conservar visibles temporalmente.
    if (contextZonesLoading || !contextZonesFetched) return availableFilters.zonaIdSet;
    const contextSet = new Set<number>(contextZoneIds || []);
    // Mostrar TODAS las zonas del contexto, no solo las visibles en la página.
    return contextSet;
  }, [zoneContext, contextZonesLoading, contextZonesFetched, contextZoneIds, availableFilters.zonaIdSet]);

  const zonaTreeGroups = React.useMemo(() => {
    const filtered = zonaCatalogGroups
      .map((g) => ({ ...g, items: g.items.filter((it) => availableZonaIdSet.has(it.id)) }))
      .filter((g) => g.items.length > 0);
    if (contextZonesLoading || !contextZonesFetched) return zonaGroupsToTreeGroups(zonaCatalogGroups);
    return zonaGroupsToTreeGroups(filtered);
  }, [zonaCatalogGroups, availableZonaIdSet, contextZonesLoading, contextZonesFetched]);

  const ritmoTagsForVisibleItems = React.useMemo(() => {
    const ritmoIds = availableRitmoIdSet;
    if (!ritmoIds.size) return [];
    const ritmos = (allTags as any[])?.filter((t: any) => t?.tipo === "ritmo") ?? [];
    return ritmos.filter((r: any) => ritmoIds.has(r.id));
  }, [allTags, availableRitmoIdSet]);

  const ritmoTreeGroups = React.useMemo(
    () =>
      groupRitmos(
        ritmoTagsForVisibleItems.map((r: any) => ({ id: r.id, nombre: r.nombre, slug: r.slug })),
      ),
    [ritmoTagsForVisibleItems],
  );

  React.useEffect(() => {
    if (openFilterDropdown === "ritmos" && ritmoTreeGroups.length === 0) {
      setOpenFilterDropdown(null);
    }
  }, [openFilterDropdown, ritmoTreeGroups.length]);

  const baseFilterContextKey = React.useMemo(
    () => String(filters.type ?? ''),
    [filters.type],
  );
  const prevBaseFilterContextRef = React.useRef<string>('');
  const pendingTrimContextRef = React.useRef<string>('');

  React.useEffect(() => {
    const contextChanged = prevBaseFilterContextRef.current !== baseFilterContextKey;
    if (contextChanged) {
      pendingTrimContextRef.current = baseFilterContextKey;
    }

    const contextRhythmsReady = !rhythmContext || !contextRhythmsLoading || contextRhythmsFetched;
    const zonesReady = !zoneContext || !contextZonesLoading || contextZonesFetched;
    const readyToTrim = contextRhythmsReady && zonesReady;
    if (!readyToTrim) return;

    const shouldRun =
      contextChanged || pendingTrimContextRef.current === baseFilterContextKey;
    if (!shouldRun) return;

    const shouldTrimRitmos = !rhythmContext || (!contextRhythmsLoading && contextRhythmsFetched);
    const nextRitmos = shouldTrimRitmos
      ? (filters.ritmos || []).filter((id) => availableRitmoIdSet.has(id))
      : (filters.ritmos || []);
    const nextZonas = (filters.zonas || []).filter((id) => availableZonaIdSet.has(id));
    const sameRitmos =
      nextRitmos.length === (filters.ritmos || []).length &&
      nextRitmos.every((id, idx) => id === (filters.ritmos || [])[idx]);
    const sameZonas =
      nextZonas.length === (filters.zonas || []).length &&
      nextZonas.every((id, idx) => id === (filters.zonas || [])[idx]);
    const changed = !sameRitmos || !sameZonas;
    if (changed) {
      set({ ritmos: nextRitmos, zonas: nextZonas });
    }
    prevBaseFilterContextRef.current = baseFilterContextKey;
    pendingTrimContextRef.current = '';
  }, [
    baseFilterContextKey,
    rhythmContext,
    contextRhythmsLoading,
    contextRhythmsFetched,
    zoneContext,
    contextZonesLoading,
    contextZonesFetched,
    availableRitmoIdSet,
    availableZonaIdSet,
    filters.ritmos,
    filters.zonas,
    set,
  ]);

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

  /** Fechas dropdown solo visible cuando Tipo es Sociales (fechas) o Clases. Oculta y resetea fechas para otros tipos. */
  const showDatesDropdown = isFechasLike || selectedType === 'clases';

  const TYPE_OPTIONS = [
    { id: 'fechas' as const, labelKey: 'explore_type_sociales' },
    { id: 'clases', labelKey: 'classes' },
    { id: 'academias', labelKey: 'academies' },
    { id: 'maestros', labelKey: 'teachers' },
    { id: 'usuarios', labelKey: 'dancers' },
    { id: 'organizadores', labelKey: 'organizers' },
    // { id: 'marcas', labelKey: 'brands' },
  ];

  const setTypeAndClearDatesIfNeeded = React.useCallback(
    (typeId: typeof TYPE_OPTIONS[number]['id']) => {
      const exploreType = typeId as ExploreType;
      if (typeId !== 'fechas' && typeId !== 'clases') {
        set({ type: exploreType, q: "", datePreset: 'todos', dateFrom: undefined, dateTo: undefined });
      } else {
        set({ type: exploreType, q: "" });
      }
      setOpenFilterDropdown(null);
    },
    [set],
  );

  const filtersHeaderAction = (
    <button
      type="button"
      className="filters-hero-trigger"
      onClick={() => setFiltersPanelOpen((prev) => !prev)}
      aria-label={t('filters') || 'Filtros'}
      aria-expanded={filtersPanelOpen}
      title={t('filters') || 'Filtros'}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="filters-hero-trigger__icon"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20L16.65 16.65" strokeLinecap="round" />
      </svg>
      {activeFiltersIndicatorCount > 0 && (
        <span className="filters-hero-trigger__badge">
          {activeFiltersIndicatorCount > 99 ? '99+' : activeFiltersIndicatorCount}
        </span>
      )}
    </button>
  );

  return (
    <>
      <SeoHead section="explore" />
      <style>{STYLES}</style>

      <div className={`explore-container${isMobile && isAndroid ? ' android-mobile' : ''}`}>
        <div className="wrap">
          <div className="filters-hero-trigger-persistent">
            {filtersHeaderAction}
          </div>
          <section
            className={`filters-panel${filtersPanelOpen ? '' : ' is-collapsed'}`}
            role="region"
            aria-label={t('filters')}
            aria-hidden={!filtersPanelOpen}
          >
            {/* Filtros colapsados globalmente: se despliegan desde icono de lupa en el hero header */}
            {filtersPanelOpen && (
              <FiltersLayout
                isMobile={isMobile}
                onClose={() => setFiltersPanelOpen(false)}
                title={t('filters') || 'Filtros'}
                closeLabel={t('close') || 'Cerrar'}
                onClickOverlay={(e) => e.target === e.currentTarget && setFiltersPanelOpen(false)}
                onClearFilters={() => {
                  handleFilterChange({
                    ...filters,
                    type: 'fechas',
                    q: '',
                    ritmos: [],
                    zonas: [],
                    datePreset: 'todos',
                    dateFrom: undefined,
                    dateTo: undefined
                  });
                  setUsingFavoriteFilters(false);
                  setOpenFilterDropdown(null);
                  setSearchOpen(false);
                }}
                activeFiltersCount={activeFiltersCount}
                activeFiltersIndicatorCount={activeFiltersIndicatorCount}
              >
            {usingFavoriteFilters && user && (
              <m.div
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
              </m.div>
            )}

            <div className="filters-card">
              {/* Fila 1: Tipo + Fechas (si aplica) + Filtros activos — misma cuadrícula que fila 2 para alinear anchos */}
              <div
                className={`filters-card__row filters-card__row--top ${showDatesDropdown ? 'filters-card__row--top-with-dates' : ''}`}
                role="toolbar"
                aria-label={t("filter_type_aria")}
              >
                <div className={`filters-card__row chips filters-card__row--top-left ${!showDatesDropdown ? 'filters-card__cell--span2' : ''}`}>
                  <button
                    ref={typePillRef}
                    type="button"
                    className={`filter-pill ${openFilterDropdown === "type" ? "filter-pill--active" : ""}`}
                    onClick={() => setOpenFilterDropdown(openFilterDropdown === "type" ? null : "type")}
                    aria-haspopup="listbox"
                    aria-expanded={openFilterDropdown === "type"}
                    aria-controls="filters-type-listbox"
                    id="filters-type-trigger"
                    style={{ minWidth: 120, justifyContent: "space-between" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span className="pill-text">
                        {t(TYPE_OPTIONS.find((o) => o.id === exploreTypeMenuId)?.labelKey ?? 'explore_type_sociales')}
                      </span>
                    </span>
                    <span aria-hidden style={{ opacity: 0.7 }}>▾</span>
                  </button>
                </div>
                {showDatesDropdown && (
                  <div className="filters-card__row chips filters-card__row--dates-wrap">
                    <button
                      ref={fechasPillRef}
                      type="button"
                      className={`filter-pill ${openFilterDropdown === "fechas" ? "filter-pill--active" : ""}`}
                      onClick={() => setOpenFilterDropdown(openFilterDropdown === "fechas" ? null : "fechas")}
                      aria-pressed={openFilterDropdown === "fechas"}
                      aria-expanded={openFilterDropdown === "fechas"}
                      aria-controls="filters-fechas-panel"
                      style={{ minWidth: 120, justifyContent: "space-between" }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span className="pill-icon" aria-hidden="true">🗓️</span>
                        <span className="pill-text">
                          {dateSummaryText}
                        </span>
                      </span>
                      <span aria-hidden style={{ opacity: 0.7 }}>▾</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tipo dropdown panel (portal) */}
              {openFilterDropdown === "type" && typePillRef.current && typeof document !== "undefined" && (() => {
                const rect = typePillRef.current.getBoundingClientRect();
                const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
                const margin = 12;
                const panelWidth = Math.min(Math.max(240, rect.width), vw - 2 * margin);
                const left = Math.max(margin, Math.min(rect.left, vw - panelWidth - margin));
                return createPortal(
                <div
                  role="listbox"
                  id="filters-type-listbox"
                  aria-labelledby="filters-type-trigger"
                  className="filters-type-dropdown-panel"
                  style={{
                    position: 'fixed',
                    zIndex: 9999,
                    width: panelWidth,
                    maxWidth: 'calc(100vw - 24px)',
                    boxSizing: 'border-box',
                    background: '#161a22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    padding: '12px 10px',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05) inset',
                    top: rect.bottom + 8,
                    left,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {TYPE_OPTIONS.map((opt) => {
                      const active = exploreTypeMenuId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => setTypeAndClearDatesIfNeeded(opt.id)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 12,
                            border: `1px solid ${active ? 'rgba(41, 127, 150, 0.65)' : 'rgba(255,255,255,0.08)'}`,
                            background: active ? 'rgba(41, 127, 150, 0.2)' : 'rgba(255,255,255,0.03)',
                            color: active ? '#99e5ff' : '#fff',
                            fontSize: 14,
                            fontWeight: 600,
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.1s ease',
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {t(opt.labelKey)}
                        </button>
                      );
                    })}
                  </div>
                </div>,
                document.body
              );
              })()}

              {/* Fila 2: Ritmos, Zonas, Lupa (búsqueda colapsada) */}
              <div className="filters-card__row filters-card__row--mid" role="toolbar" aria-label={t("filter_type_aria")}>
                <button
                  ref={ritmosPillRef}
                  type="button"
                  className={`filter-pill ${openFilterDropdown === "ritmos" ? "filter-pill--active" : ""}`}
                  onClick={() => {
                    if (ritmoTreeGroups.length === 0) return;
                    setOpenFilterDropdown(openFilterDropdown === "ritmos" ? null : "ritmos");
                  }}
                  disabled={ritmoTreeGroups.length === 0}
                  aria-pressed={openFilterDropdown === "ritmos"}
                  aria-expanded={openFilterDropdown === "ritmos"}
                  aria-controls="filters-ritmos-panel"
                  title={ritmoTreeGroups.length === 0 ? (t("no_rhythms_available", "No hay ritmos disponibles para este tipo")) : undefined}
                  style={{
                    flex: '1 1 0',
                    minWidth: 0,
                    justifyContent: "space-between",
                    opacity: ritmoTreeGroups.length === 0 ? 0.6 : 1,
                    cursor: ritmoTreeGroups.length === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span className="pill-icon" aria-hidden="true">🎵</span>
                    <span className="pill-text">
                      {stableRitmos.length > 0 ? `${t("rhythms")} (${stableRitmos.length})` : t("rhythms")}
                    </span>
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
                  aria-controls="filters-zonas-panel"
                  style={{ flex: '1 1 0', minWidth: 0, justifyContent: "space-between" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span className="pill-icon" aria-hidden="true">📍</span>
                    <span className="pill-text">
                      {stableZonas.length > 0 ? `${t("zones")} (${stableZonas.length})` : t("zones")}
                    </span>
                  </span>
                  <span aria-hidden style={{ opacity: 0.7 }}>▾</span>
                </button>
                <button
                  ref={searchToggleRef}
                  type="button"
                  className={`filter-pill filters-search-toggle ${searchOpen ? "filter-pill--active" : ""} ${!searchOpen && (filters.q ?? "").trim() ? "filters-search-toggle--has-content" : ""}`}
                  onClick={() =>
                    setSearchOpen((v) => {
                      if (v && hasSearchQuery) return true;
                      return !v;
                    })
                  }
                  aria-label={t('search') || 'Buscar'}
                  aria-expanded={searchOpen}
                  aria-controls="filters-search-row"
                  style={{ flex: '0 0 auto', width: 44, height: 44, padding: 0, justifyContent: 'center' }}
                >
                  <span aria-hidden>🔍</span>
                  {!searchOpen && (filters.q ?? "").trim() && (
                    <span className="filters-search-toggle__content-dot" aria-hidden title={(filters.q ?? "").trim()} />
                  )}
                </button>
              </div>

              {openFilterDropdown === "ritmos" ? (
                <DeferredChunk>
                  <MultiSelectTreeDropdown
                    label={t("rhythms")}
                    groups={ritmoTreeGroups}
                    selectedIds={stableRitmos}
                    onChange={(nextIds) => set({ ritmos: nextIds })}
                    search={true}
                    anchorEl={ritmosPillRef.current}
                    open
                    onClose={() => setOpenFilterDropdown(null)}
                    triggerRef={ritmosPillRef}
                  />
                </DeferredChunk>
              ) : null}
              {openFilterDropdown === "zonas" ? (
                <DeferredChunk>
                  <MultiSelectTreeDropdown
                    label={t("zones")}
                    groups={zonaTreeGroups}
                    selectedIds={stableZonas}
                    onChange={(nextIds) => set({ zonas: nextIds })}
                    search={true}
                    anchorEl={zonasPillRef.current}
                    open
                    onClose={() => setOpenFilterDropdown(null)}
                    triggerRef={zonasPillRef}
                  />
                </DeferredChunk>
              ) : null}
              {openFilterDropdown === "fechas" ? (
                <DeferredChunk>
                  <DateFilterDropdown
                    dateFrom={filters.dateFrom}
                    dateTo={filters.dateTo}
                    datePreset={filters.datePreset}
                    onApply={applyDateFilter}
                    onPresetSelect={applyDatePreset}
                    anchorEl={fechasPillRef.current}
                    open
                    onClose={() => setOpenFilterDropdown(null)}
                    triggerRef={fechasPillRef}
                    summaryText={dateSummaryText}
                    t={t}
                  />
                </DeferredChunk>
              ) : null}

              {/* Fila 3: Búsqueda colapsada. Evitar zoom: input font-size 16px (iOS no hace zoom al focus), transición max-height/opacity sin transform/scale, sin scrollIntoView. */}
              <div
                id="filters-search-row"
                className={`filters-card__row filters-card__row--search ${searchOpen ? 'filters-card__row--search-open' : ''}`}
                aria-hidden={!searchOpen}
              >
                <label className="visually-hidden" htmlFor="filters-search-input">
                  {t('search_placeholder_expanded') || 'Buscar (evento, lugar, maestro...)'}
                </label>
                <div className="filters-search-input-wrap">
                  <input
                    ref={searchInputRef}
                    id="filters-search-input"
                    type="text"
                    placeholder={t('search_placeholder_expanded') || 'Buscar (evento, lugar, maestro...)'}
                    value={filters.q || ''}
                    onChange={(e) => handleFilterChange({ ...filters, q: e.target.value })}
                    className="filters-search-input"
                    autoComplete="off"
                    style={{
                      fontSize: 16,
                      lineHeight: 1.2,
                      height: 44,
                      minHeight: 44,
                    }}
                  />
                  {hasSearchQuery && (
                    <button
                      type="button"
                      className="filters-search-input-clear"
                      onClick={() => {
                        handleFilterChange({ ...filters, q: "" });
                        searchInputRef.current?.focus();
                      }}
                      aria-label={t('clear') || 'Borrar búsqueda'}
                      title={t('clear') || 'Borrar'}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="filters-search-close"
                  onClick={() => {
                    if (hasSearchQuery) {
                      handleFilterChange({ ...filters, q: "" });
                      return;
                    }
                    searchToggleRef.current?.focus();
                    requestAnimationFrame(() => setSearchOpen(false));
                  }}
                  aria-label={t('close') || 'Cerrar'}
                >
                  ✕
                </button>
              </div>

            </div>
              </FiltersLayout>
            )}
          </section>

          {shouldRenderSection('fechas') && (((showAll && (fechasLoading || hasFechas || fechasError)) || isFechasLike)) && (
            <Section
              skipEntranceAnimation
              title={t('section_upcoming_scene')}
              count={normalizedFechas.length}
              sectionId="fechas"
              sectionMinHeight={
                fechasViewMode === "list" || fechasViewMode === "cartelera"
                  ? undefined
                  : fechasGridSectionMinHeight ?? sectionMinHeight
              }
              headerAction={
                (filters.datePreset === 'hoy' || filters.datePreset === 'fin_de_semana' || filters.datePreset === 'semana') ? (
                  <div
                    aria-label={`${normalizedFechas.length} eventos`}
                    title="Eventos según filtros actuales"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 32,
                      height: 28,
                      padding: '0 10px',
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.22)',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 800,
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {normalizedFechas.length}
                  </div>
                ) : undefined
              }
            >
              <>
              <ExploreSectionViewToggle
                value={fechasViewMode}
                onChange={setFechasViewMode}
                likeFechas
                groupLabel={t('explore_fechas_view_group') || 'Vista de sociales'}
              />
              {fechasTimedOut ? (
                <InlineQueryError
                  title="La carga está tardando demasiado"
                  error={{ message: "Timeout cargando eventos" } as any}
                  onRetry={() => (fechasQuery as any).refetch?.()}
                />
              ) : fechasLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">{t('loading')}</div>)}</div>
              ) : fechasError ? (
                <InlineQueryError
                  title="No se pudieron cargar los eventos"
                  error={fechasErrObj}
                  onRetry={() => (fechasQuery as any).refetch?.()}
                />
              ) : (
                <>
                  {normalizedFechas.length > 0 ? (
                    fechasViewMode === 'list' ? (
                      <div className="explore-fechas-list" role="list">
                        {fechasSliderItems.map((item, idx) => renderFechaListItem(item, idx))}
                      </div>
                    ) : fechasViewMode === 'cartelera' ? (
                      <div className="explore-fechas-cartelera" role="list">
                        {fechasSliderItems.map((item, idx) => renderFechaCarteleraItem(item, idx))}
                      </div>
                    ) : (
                      <div className="explore-fechas-grid">
                        <div className="explore-fechas-grid__row">
                          <div className="explore-fechas-grid__row-head">
                            <h3 className="explore-fechas-grid__row-title">
                              {t('explore_fechas_row_recent')}
                            </h3>
                          </div>
                          {fechasRowRecent.length > 0 ? (
                            <HorizontalCarousel
                              {...fechasGridSliderProps}
                              items={fechasRowRecent}
                              renderItem={renderFechaGridItem}
                            />
                          ) : null}
                        </div>
                        <div className="explore-fechas-grid__row">
                          <div className="explore-fechas-grid__row-head">
                            <h3 className="explore-fechas-grid__row-title">
                              {t('explore_fechas_row_date_time')}
                            </h3>
                          </div>
                          <HorizontalCarousel
                            {...fechasGridSliderProps}
                            items={fechasSliderItems}
                            renderItem={renderFechaGridItem}
                          />
                        </div>
                      </div>
                    )
                  ) : (
                    <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>{t('no_results')}</div>
                  )}
                </>
              )}
              </>
            </Section>
          )}

          {shouldRenderSection('clases') && (((showAll && ((academiasLoading || maestrosLoading) || hasClases || academiasError || maestrosError)) || selectedType === 'clases')) && (
            <Section
              title={t('section_recommended_classes')}
              count={classesList.length}
              sectionId="clases"
              sectionMinHeight={
                exploreSectionViews.clases === "list" || exploreSectionViews.clases === "cartelera"
                  ? undefined
                  : fechasGridSectionMinHeight ?? sectionMinHeight
              }
            >
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

                const clasesVm = exploreSectionViews.clases;
                return (
                  <>
                    <ExploreSectionViewToggle
                      value={clasesVm}
                      onChange={setClasesViewMode}
                      likeFechas
                      groupLabel={t("explore_classes_view_group") || t("explore_fechas_view_group")}
                    />
                    {clasesVm === "list" ? (
                      <div className="explore-fechas-list" role="list">
                        {classesListWithCTA.map((item: any, idx: number) => {
                          if (item?.__isCTA) {
                            return (
                              <div key="cta-clases" role="listitem" style={{ width: "100%" }}>
                                  <CTACard text={t("cta_classes")} sectionType="clases" idx={idx} />
                              </div>
                            );
                          }
                          const rowKey = `${item.ownerType || "owner"}-${item.ownerId ?? "unknown"}-${item.titulo ?? "class"}-${item.fecha ?? (Array.isArray(item.diasSemana) ? item.diasSemana.join("-") : "semana")}-${idx}`;
                          return (
                            <div key={rowKey} role="listitem" onClickCapture={handlePreNavigate} style={{ width: "100%" }}>
                              <ClaseListRow item={item} priority={idx === 0} tagMaps={tagMaps} />
                            </div>
                          );
                        })}
                      </div>
                    ) : clasesVm === "cartelera" ? (
                      <div className="explore-fechas-cartelera" role="list">
                        {classesListWithCTA.map((item: any, idx: number) => {
                          if (item?.__isCTA) {
                            return (
                              <div key="cta-clases" className="explore-fechas-cartelera__load-more" role="listitem">
                                  <CTACard text={t("cta_classes")} sectionType="clases" idx={idx} />
                              </div>
                            );
                          }
                          const rowKey = `${item.ownerType || "owner"}-${item.ownerId ?? "unknown"}-${item.titulo ?? "class"}-${item.fecha ?? (Array.isArray(item.diasSemana) ? item.diasSemana.join("-") : "semana")}-${idx}`;
                          return (
                            <div key={rowKey} role="listitem" onClickCapture={handlePreNavigate} style={{ minWidth: 0 }}>
                              <ExploreEntityCarteleraCard variant="clase" item={item} priority={idx === 0} tagMaps={tagMaps} />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <HorizontalCarousel
                        {...fechasGridSliderProps}
                        items={classesListWithCTA}
                        renderItem={renderClaseCarouselItem}
                      />
                    )}
                  </>
                );
              })()}
            </Section>
          )}

          {shouldRenderSection('academias') && (((showAll && (academiasLoading || hasAcademias)) || selectedType === 'academias')) && (
            <Section
              title={t('section_best_academies_zone')}
              count={academiasData.length}
              sectionId="academias"
              sectionMinHeight={
                exploreSectionViews.academias === "list" || exploreSectionViews.academias === "cartelera"
                  ? undefined
                  : fechasGridSectionMinHeight ?? sectionMinHeight
              }
            >
              <ExploreSectionViewToggle
                value={exploreSectionViews.academias}
                onChange={setAcademiasViewMode}
                likeFechas
                groupLabel={t("explore_academies_view_group") || t("explore_classes_view_group")}
              />
              <DeferredChunk fallback={<div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">{t('loading')}</div>)}</div>}>
                <AcademiesSection
                  filters={filters}
                  q={qDeferred || undefined}
                  enabled={showAll || selectedType === 'academias'}
                  externalData={academiasData}
                  isLoading={academiasLoading}
                  maxItems={12}
                  renderAs={
                    exploreSectionViews.academias === "list"
                      ? "list"
                      : exploreSectionViews.academias === "cartelera"
                        ? "cartelera"
                        : "carousel"
                  }
                  gridCarouselProps={fechasGridSliderProps}
                  itemHeight={cardHeight > 0 ? cardHeight : undefined}
                  itemWidth={cardWidth > 0 ? cardWidth : undefined}
                  navPosition={(isMobile ? 'bottom' : 'overlay') as 'bottom' | 'overlay'}
                  eagerPerCarousel={EAGER_OTHERS}
                  onNavigatePrepare={handlePreNavigate}
                  tagMaps={tagMaps}
                />
              </DeferredChunk>
              {!academiasLoading && academiasData.length === 0 && (
                <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>{t('no_results')}</div>
              )}
            </Section>
          )}

          {shouldRenderSection('maestros') && (((showAll && (maestrosLoading || hasMaestros || maestrosError)) || selectedType === 'maestros')) && (
            <Section
              title={t('section_featured_teachers')}
              count={maestrosData.length}
              sectionId="maestros"
              sectionMinHeight={
                exploreSectionViews.maestros === "list" || exploreSectionViews.maestros === "cartelera"
                  ? undefined
                  : fechasGridSectionMinHeight ?? sectionMinHeight
              }
            >
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
                  <>
                    <ExploreSectionViewToggle
                      value={exploreSectionViews.maestros}
                      onChange={setMaestrosViewMode}
                      likeFechas
                      groupLabel={t("explore_maestros_view_group") || t("explore_classes_view_group")}
                    />
                    {exploreSectionViews.maestros === "list" ? (
                      <div className="explore-fechas-list" role="list">
                        {maestrosDataWithCTA.map((item: any, idx: number) => {
                          if (item?.__isCTA) {
                            return (
                              <div key="cta-maestros" role="listitem" style={{ width: "100%" }}>
                                  <CTACard text={t("cta_teachers")} sectionType="maestros" idx={idx} />
                              </div>
                            );
                          }
                          return (
                            <div
                              key={item.id ?? idx}
                              role="listitem"
                              onClickCapture={handlePreNavigate}
                              style={{ width: "100%" }}
                            >
                              <ExploreProfileListRow variant="teacher" item={item} priority={idx === 0} tagMaps={tagMaps} />
                            </div>
                          );
                        })}
                      </div>
                    ) : exploreSectionViews.maestros === "cartelera" ? (
                      <div className="explore-fechas-cartelera" role="list">
                        {maestrosDataWithCTA.map((item: any, idx: number) => {
                          if (item?.__isCTA) {
                            return (
                              <div key="cta-maestros" className="explore-fechas-cartelera__load-more" role="listitem">
                                  <CTACard text={t("cta_teachers")} sectionType="maestros" idx={idx} />
                              </div>
                            );
                          }
                          return (
                            <div key={item.id ?? idx} role="listitem" onClickCapture={handlePreNavigate} style={{ minWidth: 0 }}>
                              <ExploreEntityCarteleraCard variant="teacher" item={item} priority={idx === 0} tagMaps={tagMaps} />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <HorizontalCarousel
                        {...fechasGridSliderProps}
                        items={maestrosDataWithCTA}
                        renderItem={renderMaestroCarouselItem}
                      />
                    )}
                  </>
                  )}
                </>
              )}
            </Section>
          )}

          {shouldRenderSection('usuarios') && (((showAll && (usuariosLoading || hasUsuarios)) || selectedType === 'usuarios')) && (
            <Section
              title={t('section_dancers_near_you')}
              count={normalizedValidUsuarios.length}
              sectionId="usuarios"
              sectionMinHeight={
                exploreSectionViews.usuarios === "list" || exploreSectionViews.usuarios === "cartelera"
                  ? undefined
                  : fechasGridSectionMinHeight ?? sectionMinHeight
              }
            >
              {usuariosLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
              ) : (
                <>
                  {normalizedValidUsuarios.length > 0 ? (
                    <>
                      <ExploreSectionViewToggle
                        value={exploreSectionViews.usuarios}
                        onChange={setUsuariosViewMode}
                        likeFechas
                        groupLabel={t("explore_usuarios_view_group") || t("explore_classes_view_group")}
                      />
                      {exploreSectionViews.usuarios === "list" ? (
                        <div className="explore-fechas-list" role="list">
                          {normalizedValidUsuarios.map((item: any, idx: number) => (
                            <div
                              key={item.id ?? idx}
                              role="listitem"
                              onClickCapture={handlePreNavigate}
                              style={{ width: "100%" }}
                            >
                              <ExploreProfileListRow
                                variant="dancer"
                                item={item}
                                priority={idx === 0}
                                tagMaps={tagMaps}
                              />
                            </div>
                          ))}
                        </div>
                      ) : exploreSectionViews.usuarios === "cartelera" ? (
                        <div className="explore-fechas-cartelera" role="list">
                          {normalizedValidUsuarios.map((item: any, idx: number) => (
                            <div
                              key={item.id ?? idx}
                              role="listitem"
                              onClickCapture={handlePreNavigate}
                              style={{ minWidth: 0 }}
                            >
                              <ExploreEntityCarteleraCard
                                variant="dancer"
                                item={item}
                                priority={idx === 0}
                                tagMaps={tagMaps}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <HorizontalCarousel
                          {...fechasGridSliderProps}
                          items={normalizedValidUsuarios}
                          renderItem={renderUsuarioCarouselItem}
                        />
                      )}
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

          {shouldRenderSection('organizadores') && (((showAll && (organizadoresLoading || organizadoresData.length > 0 || organizadoresError)) || selectedType === 'organizadores')) && (
            <Section
              title={t('section_event_producers')}
              count={organizadoresData.length}
              sectionId="organizadores"
              sectionMinHeight={
                exploreSectionViews.organizadores === "list" || exploreSectionViews.organizadores === "cartelera"
                  ? undefined
                  : fechasGridSectionMinHeight ?? sectionMinHeight
              }
            >
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
                  <ExploreSectionViewToggle
                    value={exploreSectionViews.organizadores}
                    onChange={setOrganizadoresViewMode}
                    likeFechas
                    groupLabel={t("explore_organizadores_view_group") || t("explore_classes_view_group")}
                  />
                  {exploreSectionViews.organizadores === "list" ? (
                    <div className="explore-fechas-list" role="list">
                      {organizadoresDataWithCTA.map((item: any, idx: number) => {
                        if (item?.__isCTA) {
                          return (
                            <div key="cta-organizadores" role="listitem" style={{ width: "100%" }}>
                                  <CTACard text={t("cta_organizers")} sectionType="organizadores" idx={idx} />
                            </div>
                          );
                        }
                        return (
                          <div
                            key={item.id ?? idx}
                            role="listitem"
                            onClickCapture={handlePreNavigate}
                            style={{ width: "100%" }}
                          >
                            <ExploreProfileListRow variant="organizer" item={item} priority={idx === 0} tagMaps={tagMaps} />
                          </div>
                        );
                      })}
                    </div>
                  ) : exploreSectionViews.organizadores === "cartelera" ? (
                    <div className="explore-fechas-cartelera" role="list">
                      {organizadoresDataWithCTA.map((item: any, idx: number) => {
                        if (item?.__isCTA) {
                          return (
                            <div key="cta-organizadores" className="explore-fechas-cartelera__load-more" role="listitem">
                                  <CTACard text={t("cta_organizers")} sectionType="organizadores" idx={idx} />
                            </div>
                          );
                        }
                        return (
                          <div key={item.id ?? idx} role="listitem" onClickCapture={handlePreNavigate} style={{ minWidth: 0 }}>
                            <ExploreEntityCarteleraCard variant="organizer" item={item} priority={idx === 0} tagMaps={tagMaps} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <HorizontalCarousel
                      {...fechasGridSliderProps}
                      items={organizadoresDataWithCTA}
                      renderItem={renderOrganizerCarouselItem}
                    />
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>{t('no_results')}</div>
              )}
            </Section>
          )}

          {shouldRenderSection('marcas') && (((showAll && (marcasLoading || hasMarcas)) || selectedType === 'marcas')) && (
            <Section
              title={t('section_specialized_brands')}
              count={marcasData.length}
              sectionId="marcas"
              sectionMinHeight={sectionMinHeight}
            >
              {marcasLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">{t('loading')}</div>)}</div>
              ) : (
                <>
                  {marcasData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>{t('no_results')}</div>
                  ) : (
                    <HorizontalCarousel
                      {...sliderProps}
                      items={marcasDataWithCTA}
                      renderItem={renderMarcaCarouselItem}
                    />
                  )}
                </>
              )}
            </Section>
          )}

          {/* Sección Comparte */}
        

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
          <div className="explore-bottom-spacer" aria-hidden="true" />
        </div>
      </div>
    </>
  );
}
