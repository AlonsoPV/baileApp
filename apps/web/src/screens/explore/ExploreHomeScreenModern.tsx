import React from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useExploreFilters, type DatePreset, type ExploreType } from "../../state/exploreFilters";
import { useExploreQuery } from "../../hooks/useExploreQuery";
import { useUsedRhythmsByContext } from "@/hooks/useUsedRhythms";
import { useUsedZonesByContext } from "@/hooks/useUsedZones";
import { useZonaCatalogGroups } from "@/hooks/useZonaCatalogGroups";
import { mapExploreTypeToContext, mapExploreTypeToZoneContext } from "@/filters/exploreContext";
import { groupRitmos, zonaGroupsToTreeGroups } from "@/filters/exploreFilterGroups";
import { MultiSelectTreeDropdown } from "@/components/explore/MultiSelectTreeDropdown";
import { DateFilterDropdown } from "@/components/explore/DateFilterDropdown";
import EventListRow from "@/components/explore/EventListRow";
import EventSocialGridCard from "@/components/explore/EventSocialGridCard";
import EventCarteleraCard from "@/components/explore/EventCarteleraCard";
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
import { LayoutGrid, List, Images } from "lucide-react";
import HorizontalCarousel from "../../components/explore/HorizontalCarousel";
import ClassExploreGridCard from "@/components/explore/ClassExploreGridCard";
import ProfileExploreGridCard from "@/components/explore/ProfileExploreGridCard";
import BrandCard from "../../components/explore/cards/BrandCard";
import SocialCard from "../../components/explore/cards/SocialCard";
import { LoadMoreCard } from "@/components/explore/cards/LoadMoreCard";
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
import { mark, notifyError, notifyReady } from "@/utils/performanceLogger";
import { normalizeEventsForCards } from "@/utils/normalizeEventsForCards";
import { getEffectiveEventDate, getEffectiveEventDateYmd, normalizeDateOnly } from "@/utils/effectiveEventDate";
import { sortFechasByRecentFirst } from "@/utils/exploreFechasGrid";
import { shouldHideExploreClassForBlackout } from "@/config/classBlackoutDates";
import { getLocaleFromI18n } from "@/utils/locale";

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

function buildEventOccurrenceKey(event: any): string {
  const instanceId = event?.instance_id;
  if (instanceId) return `instance_${String(instanceId)}`;

  const effectiveDate = getEffectiveEventDateYmd(event);
  const horaInicio = String(event?.hora_inicio || event?.evento_hora_inicio || "");
  const parentOrOwn = String(event?.parent_id ?? event?.id ?? "no_id");
  // Incluir id: dos events_date con mismo parent/fecha/hora no deben colisionar una card.
  if (effectiveDate) return `${parentOrOwn}_${effectiveDate}_${horaInicio}_${String(event?.id ?? "no_id")}`;
  return `id_${String(event?.id ?? "no_id")}`;
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

  const [dimensions, setDimensions] = React.useState(compute);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    setDimensions(compute());
    const handler = () => setDimensions(compute());
    window.addEventListener('resize', handler);
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handler);
      vv.addEventListener('scroll', handler);
    }
    return () => {
      window.removeEventListener('resize', handler);
      vv?.removeEventListener('resize', handler);
      vv?.removeEventListener('scroll', handler);
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

  const [dimensions, setDimensions] = React.useState(compute);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setDimensions(compute());
    const handler = () => setDimensions(compute());
    window.addEventListener("resize", handler);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", handler);
    return () => {
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
      className="section-header section-header--hero"
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
        borderBottom: '3px solid transparent',
        borderImage: 'linear-gradient(90deg, rgba(255,157,28,0.6), rgba(168,85,247,0.4), transparent) 1',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2
            className="section-title section-title--hero"
            style={{
              margin: 0,
              fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
              fontWeight: 900,
              color: '#fff',
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
const EAGER_MAIN = 2;
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
        /* En escritorio, igualar altura con las tarjetas de carrusel/cartelera.
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
    --explore-bottom-space: max(104px, calc(env(safe-area-inset-bottom, 0px) + 88px));
    min-height: 100vh; 
    min-height: 100dvh;
    /* IMPORTANT: This screen is styled for a dark UI (cards/text assume dark background). */
    background: #0b0d10; 
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
    border: 1px solid rgba(255,255,255,0.34);
    background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.22), rgba(255,255,255,0.06) 35%), linear-gradient(135deg, rgba(41,127,150,0.38) 0%, rgba(235,55,127,0.26) 100%);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform .16s ease, box-shadow .2s ease, border-color .2s ease;
    box-shadow: 0 10px 24px rgba(0,0,0,.34), 0 0 0 1px rgba(255,255,255,.08) inset, 0 0 18px rgba(125, 96, 255, .22);
    z-index: 15;
    -webkit-appearance: none;
    appearance: none;
    -webkit-tap-highlight-color: transparent;
    backdrop-filter: blur(6px);
  }
  .filters-hero-trigger:hover {
    transform: translateY(-1px);
    border-color: rgba(255,255,255,0.48);
    box-shadow: 0 14px 28px rgba(0,0,0,.38), 0 0 0 1px rgba(255,255,255,.1) inset, 0 0 24px rgba(125, 96, 255, .28);
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
  .filters-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    max-width: 280px;
    height: 3px;
    border-radius: 0 0 999px 999px;
    background: linear-gradient(90deg, transparent, rgba(41, 127, 150, .6), transparent);
    opacity: .9;
  }
  /* Filters card (barra principal) — diseño contenedor oscuro con borde claro */
  .filters-card {
    width: 100%;
    max-width: 680px;
    margin-left: auto;
    margin-right: auto;
    padding: 16px 14px 14px;
    border-radius: 20px;
    background: linear-gradient(180deg, #1c1f28 0%, #14171e 100%);
    border: 1px solid rgba(255,255,255,.12);
    box-shadow: 0 0 0 1px rgba(0,0,0,.2) inset, 0 4px 16px rgba(0,0,0,.3);
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
  .filters-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent);
    opacity: .9;
    border-radius: 20px 20px 0 0;
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
}) {
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
          background: 'linear-gradient(180deg, #1c1f28 0%, #14171e 100%)',
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,.12)',
          boxShadow: '0 16px 48px rgba(0,0,0,.5)',
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
              <span style={{ minWidth: 16, height: 16, padding: '0 4px', fontSize: 11, fontWeight: 700, background: activeFiltersCount > 0 ? 'rgba(255,106,26,0.9)' : 'rgba(255,255,255,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFiltersCount}</span>
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
}: {
  title: string;
  children: React.ReactNode;
  count?: number;
  sectionId?: string;
  subline?: string;
  sectionMinHeight?: number;
  headerAction?: React.ReactNode;
}) {
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
        scrollMarginTop: '100px',
        ...(sectionMinHeight ? { minHeight: sectionMinHeight } : {}),
      }}
    >
      <div className="section-container__main">
        <SectionHeader title={title} count={count} subline={subline} actionSlot={headerAction} />
        {children}
      </div>
    </motion.section>
  );
}

export default function ExploreHomeScreen() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { filters, set } = useExploreFilters();
  // "Marcas" oculto en el selector: si quedó persistido, volver a un tipo visible.
  React.useEffect(() => {
    if (filters.type === "marcas") set({ type: "fechas" });
  }, [filters.type, set]);
  const selectedType = (!filters.type || filters.type === 'all' ? 'fechas' : filters.type) as ExploreType;
  const showAll = false;

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
    if (typeof window === "undefined") return "carousel";
    return readFechasViewMode() ?? "carousel";
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

  const qDebounced = useDebouncedValue(filters.q || '', 300);
  const qDeferred = React.useDeferredValue(qDebounced);

  const hasConfiguredFavorites = React.useMemo(
    () => !!(preferences && (preferences as any).id),
    [preferences]
  );

  const { cardHeight, cardWidth, sectionMinHeight } = useExploreCardDimensions(isMobile);
  const { gridCardWidth, gridCardHeight, gridGap } = useExploreFechasGridDimensions(isMobile);

  React.useEffect(() => {
    if (!showAll) {
      const section = selectedType as ExploreSectionId | undefined;
      if (section) {
        setMountedSections(new Set([section]));
      }
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

  const shouldRenderSection = React.useCallback((section: ExploreSectionId) => {
    if (!showAll) return selectedType === section;
    return mountedSections.has(section);
  }, [mountedSections, selectedType, showAll]);

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

  // Memoizar handlePreNavigate para evitar re-renders de cards
  const handlePreNavigate = React.useCallback(() => {
    try { if ('scrollRestoration' in window.history) { (window.history as any).scrollRestoration = 'manual'; } } catch { }
    try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch { }
  }, []);

  const shouldLoadFechas = selectedType === 'fechas';
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

  React.useEffect(() => {
    if (!import.meta.env?.DEV) return;
    if (selectedType !== "fechas") return;
    console.log("[DATE FILTER STATE]", {
      selectedDateFilter: filters.datePreset ?? null,
      dateFrom: filters.dateFrom ?? null,
      dateTo: filters.dateTo ?? null,
      query: qDeferred || "",
    });
  }, [selectedType, filters.datePreset, filters.dateFrom, filters.dateTo, qDeferred]);

  const filteredFechas = React.useMemo(() => {
    const isValidDiaSemana = (value: any): value is number =>
      Number.isInteger(value) && value >= 0 && value <= 6;
    const todayOnly = normalizeDateOnly(todayYmd);
    // Server ya filtra por estado_publicacion=publicado; si no viene el campo, incluimos igual
    const allFechas = fechasData.filter((d: any) => !d?.estado_publicacion || d.estado_publicacion === 'publicado');
    const includePastEvents = !!qDeferred && qDeferred.trim().length > 0;
    const dateFrom = filters.dateFrom ? normalizeDateOnly(filters.dateFrom) : null;
    const dateTo = filters.dateTo ? normalizeDateOnly(filters.dateTo) : null;
    const hasDateRange = dateFrom !== null || dateTo !== null;
    const nextRecurringYmd = (dayValue: any) => {
      if (!todayOnly) return null;
      const day = Number(dayValue);
      if (!Number.isFinite(day) || day < 0 || day > 6) return null;
      const currentDay = todayOnly.getDay();
      let offset = day - currentDay;
      if (offset < 0) offset += 7;
      const next = new Date(todayOnly.getFullYear(), todayOnly.getMonth(), todayOnly.getDate() + offset);
      const year = next.getFullYear();
      const month = String(next.getMonth() + 1).padStart(2, '0');
      const dayNum = String(next.getDate()).padStart(2, '0');
      return `${year}-${month}-${dayNum}`;
    };

    const upcoming = allFechas.filter((fecha: any) => {
      if (includePastEvents) return true;
      const hasDiaSemana = isValidDiaSemana(fecha?.dia_semana);
      let eventDateOnly = normalizeDateOnly(getEffectiveEventDate(fecha));

      // Si hay rango de fechas (ej. "Hoy" con from=to=hoy), usar solo la fecha de INICIO del evento.
      // - Eventos que empiezan hoy se muestran en "Hoy" aunque ya haya pasado la hora de inicio.
      // - Eventos que empiezan sábado y terminan domingo 2am no se muestran en "Domingo".
      if (hasDateRange) {
        // Recurrentes: si no vienen como ocurrencia materializada, evaluar por próxima ocurrencia.
        if (!eventDateOnly && hasDiaSemana && fecha._recurrence_index === undefined) {
          try {
            const nextYmd = nextRecurringYmd(fecha.dia_semana);
            eventDateOnly = normalizeDateOnly(nextYmd);
          } catch {
            // Si falla el cálculo, no ocultar agresivamente un recurrente.
            return true;
          }
        }
        if (!eventDateOnly) return false;
        if (dateFrom && eventDateOnly < dateFrom) return false;
        if (dateTo && eventDateOnly > dateTo) return false;
        return true;
      }

      // Si no hay rango de fechas, solo mostrar eventos futuros
      if (!eventDateOnly && hasDiaSemana) {
        // Plantilla recurrente sin ocurrencia materializada: sigue vigente por dia_semana.
        return true;
      }
      if (!eventDateOnly || !todayOnly) return false;
      return eventDateOnly >= todayOnly;
    });

    const deduped = (() => {
      const map = new Map<string, any>();
      for (const event of upcoming) {
        const key = buildEventOccurrenceKey(event);
        if (!map.has(key)) map.set(key, event);
      }
      return Array.from(map.values());
    })();

    if (import.meta.env?.DEV) {
      const selectedDateFilter = filters.datePreset ?? null;
      const isSiguientesPreset = selectedDateFilter === "siguientes";
      const hasTodayFilter = !!filters.dateFrom && !!filters.dateTo && filters.dateFrom === filters.dateTo && !!todayOnly;
      const tomorrowOnly = todayOnly
        ? new Date(todayOnly.getFullYear(), todayOnly.getMonth(), todayOnly.getDate() + 1)
        : null;
      const todayEvents = hasTodayFilter
        ? deduped.filter((event: any) => {
            const d = normalizeDateOnly(getEffectiveEventDate(event));
            return !!d && !!todayOnly && d.getTime() === todayOnly.getTime();
          })
        : [];
      const upcomingEvents = tomorrowOnly
        ? deduped.filter((event: any) => {
            const d = normalizeDateOnly(getEffectiveEventDate(event));
            return !!d && d.getTime() >= tomorrowOnly.getTime();
          })
        : [];
      console.log("[ExploreFechas] hoy normalizado:", todayOnly);
      console.log("[ExploreFechas] manana normalizado:", tomorrowOnly);
      console.log("[ExploreFechas] eventos originales:", allFechas.length);
      console.log("[ExploreFechas] eventos generados:", upcoming.length);
      console.log("[ExploreFechas] eventos deduplicados:", deduped.length);
      console.log("[ExploreFechas] eventos HOY:", todayEvents);
      console.log("[ExploreFechas] eventos FUTUROS:", upcomingEvents);
      console.log("[DATE FILTER APPLIED]", {
        selectedDateFilter,
        totalEventsBeforeFilter: allFechas.length,
        totalEventsAfterFilter: deduped.length,
      });

      if (isSiguientesPreset) {
        console.log("[RAW EVENTS]", allFechas.length, allFechas.slice(0, 10));
        console.log("[GENERATED EVENTS]", upcoming.length, upcoming.slice(0, 10));
        console.log("[FILTER PREVIOUS COUNT]", allFechas.length);
        console.log("[FUTURE FILTER RESULT]", deduped.length, deduped.slice(0, 20));
        deduped.slice(0, 60).forEach((event: any) => {
          const effective = getEffectiveEventDate(event);
          const normalized = normalizeDateOnly(effective);
          console.log("[EVENT DATE CHECK]", {
            id: event?.id,
            parent_id: event?.parent_id,
            nombre: event?.nombre,
            instance_date: event?.instance_date,
            fecha: event?.fecha,
            fecha_inicio: event?.fecha_inicio,
            effectiveDate: effective,
            normalized,
            hora_inicio: event?.hora_inicio,
          });
        });
      }
    }

    // Orden robusto en UI: primero por fecha, luego por hora, luego por id.
    // Esto evita mezclas cuando los datos vienen de múltiples fuentes/páginas.
    const toSortableHora = (raw?: string | null) => {
      if (!raw) return "99:99";
      const s = String(raw).trim();
      if (!s) return "99:99";
      if (s.includes(":")) {
        const [hh = "99", mm = "99"] = s.split(":");
        return `${hh.padStart(2, "0").slice(-2)}:${mm.padStart(2, "0").slice(0, 2)}`;
      }
      if (s.length === 4) return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
      return "99:99";
    };

    return [...deduped].sort((a: any, b: any) => {
      const ymdA = getEffectiveEventDateYmd(a);
      const ymdB = getEffectiveEventDateYmd(b);
      if (ymdA !== ymdB) return ymdA < ymdB ? -1 : 1;

      const horaA = toSortableHora(a?.hora_inicio ?? a?.evento_hora_inicio);
      const horaB = toSortableHora(b?.hora_inicio ?? b?.evento_hora_inicio);
      if (horaA !== horaB) return horaA < horaB ? -1 : 1;

      const nameA = String(a?.nombre || a?.events_parent?.nombre || "");
      const nameB = String(b?.nombre || b?.events_parent?.nombre || "");
      const byName = nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
      if (byName !== 0) return byName;

      const idA = Number(a?.id ?? 0);
      const idB = Number(b?.id ?? 0);
      if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) return idA - idB;
      return String(a?.id ?? "").localeCompare(String(b?.id ?? ""));
    });
  }, [fechasData, todayYmd, qDeferred, filters.dateFrom, filters.dateTo, filters.datePreset, selectedType]);

  /** Eventos con __ui precomputado: cero hooks/queries por card en Explore. */
  const normalizedFechas = React.useMemo(
    () => normalizeEventsForCards(filteredFechas, allTags as any[]),
    [filteredFechas, allTags]
  );
  const hasExactDateFilter = React.useMemo(
    () =>
      selectedType === 'fechas' &&
      !!filters.dateFrom &&
      !!filters.dateTo &&
      filters.dateFrom === filters.dateTo,
    [selectedType, filters.dateFrom, filters.dateTo],
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
  const showLoadMoreCard = selectedType === 'fechas' && (hasMoreClient || hasMoreServer);
  const loadMoreBusyRef = React.useRef(false);

  const onLoadMoreFechas = React.useCallback(async () => {
    if (loadMoreBusyRef.current) return;
    loadMoreBusyRef.current = true;
    const nextCount = visibleCount + NEXT_LIMIT;
    try {
      if (import.meta.env?.DEV) {
        console.log("[LOAD_MORE] click", {
          visibleCount,
          normalizedCount: normalizedFechas.length,
          nextCount,
          hasNextPage: !!fechasQuery.hasNextPage,
          isFetchingNextPage: !!fechasQuery.isFetchingNextPage,
        });
      }
      if (normalizedFechas.length >= nextCount) {
        setVisibleCount(nextCount);
        return;
      }
      if (fechasQuery.hasNextPage && !fechasQuery.isFetchingNextPage) {
        await fechasQuery.fetchNextPage();
      }
      setVisibleCount(nextCount);
    } catch (error) {
      console.warn("[LOAD_MORE] fetchNextPage failed", error);
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

      if (__DEV__ && (idx === 0 || idx % 20 === 0)) {
        __DEV_LOG("renderItem", {
          type: "fechas_grid",
          idx,
          id: fechaEvento?.id,
          original: (fechaEvento as any)?._original_id,
          rec: (fechaEvento as any)?._recurrence_index,
        });
      }

      const card = (
        <div
          onClickCapture={handlePreNavigate}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 0,
            overflow: "hidden",
            boxShadow: "none",
            height: "100%",
          }}
        >
          <EventSocialGridCard item={fechaEvento} priority={idx < 3} />
        </div>
      );

      if (__DEV__) {
        try {
          return card;
        } catch (e) {
          __DEV_LOG("renderItem_error", { type: "fechas_grid", idx, id: fechaEvento?.id, error: (e as any)?.message || e });
          return null;
        }
      }

      return card;
    },
    [__DEV__, __DEV_LOG, handlePreNavigate, onLoadMoreFechas, fechasQuery.isFetchingNextPage, t]
  );

  const renderClaseCarouselItem = React.useCallback(
    (item: any, idx: number) => {
      if (item?.__isCTA) {
        return (
          <motion.div
            key="cta-clases"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            whileHover={{ y: -4, scale: 1.02 }}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 0,
              overflow: "hidden",
              boxShadow: "none",
              height: "100%",
            }}
          >
            <CTACard text={t("cta_classes")} sectionType="clases" idx={idx} />
          </motion.div>
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
            boxShadow: "none",
            height: "100%",
          }}
        >
          <ClassExploreGridCard item={item} priority={idx < 3} />
        </div>
      );
    },
    [handlePreNavigate, t]
  );

  const renderMaestroCarouselItem = React.useCallback(
    (item: any, idx: number) => {
      if (item?.__isCTA) {
        return (
          <motion.div
            key="cta-maestros"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            whileHover={{ y: -4, scale: 1.02 }}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 0,
              overflow: "hidden",
              boxShadow: "none",
              height: "100%",
            }}
          >
            <CTACard text={t("cta_teachers")} sectionType="maestros" idx={idx} />
          </motion.div>
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
            boxShadow: "none",
            height: "100%",
          }}
        >
          <ProfileExploreGridCard variant="teacher" item={item} priority={idx < 3} />
        </div>
      );
    },
    [handlePreNavigate, t]
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
          boxShadow: "none",
          height: "100%",
        }}
      >
        <ProfileExploreGridCard
          variant="dancer"
          item={item}
          priority={idx < 3}
        />
      </div>
    ),
    [handlePreNavigate]
  );

  const renderOrganizerCarouselItem = React.useCallback(
    (item: any, idx: number) => {
      if (item?.__isCTA) {
        return (
          <motion.div
            key="cta-organizadores"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            whileHover={{ y: -4, scale: 1.02 }}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 0,
              overflow: "hidden",
              boxShadow: "none",
              height: "100%",
            }}
          >
            <CTACard text={t("cta_organizers")} sectionType="organizadores" idx={idx} />
          </motion.div>
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
            boxShadow: "none",
            height: "100%",
          }}
        >
          <ProfileExploreGridCard variant="organizer" item={item} priority={idx < 3} />
        </div>
      );
    },
    [handlePreNavigate, t]
  );

  const renderMarcaCarouselItem = React.useCallback(
    (item: any, idx: number) => {
      if (item?.__isCTA) {
        return (
          <div
            key="cta-marcas"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 0,
              overflow: "hidden",
              boxShadow: "none",
            }}
          >
            <CTACard text={t("cta_brands")} sectionType="marcas" idx={idx} />
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
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: 0,
                overflow: "hidden",
                boxShadow: "none",
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
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 0,
            overflow: "hidden",
            boxShadow: "none",
          }}
        >
          <BrandCard item={item} />
        </div>
      );
    },
    [__DEV__, __DEV_LOG, handlePreNavigate, t]
  );

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

      return (
        <div
          key={key}
          role="listitem"
          onClickCapture={handlePreNavigate}
          style={{ width: "100%" }}
        >
          <EventListRow item={fechaEvento} priority={idx < EAGER_MAIN} allTags={allTags as any[]} />
        </div>
      );
    },
    [handlePreNavigate, onLoadMoreFechas, fechasQuery.isFetchingNextPage, t, allTags]
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
          <EventCarteleraCard item={fechaEvento} priority={idx < 4} />
        </div>
      );
    },
    [handlePreNavigate, onLoadMoreFechas, fechasQuery.isFetchingNextPage, t]
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

  // Si hay filtro de zonas activo, cargar todas las páginas del contexto visible
  // para que también aparezcan resultados no visibles en la primera página.
  const hasZoneFilter = (filters.zonas?.length || 0) > 0;
  const zoneAutoLoadBusyRef = React.useRef<Record<string, boolean>>({});
  const runAutoLoadAllPages = React.useCallback(async (key: string, queryLike: any) => {
    if (!queryLike) return;
    if (zoneAutoLoadBusyRef.current[key]) return;
    if (!queryLike.hasNextPage || queryLike.isFetchingNextPage || queryLike.isLoading) return;
    zoneAutoLoadBusyRef.current[key] = true;
    try {
      let r: { hasNextPage?: boolean } | undefined = await queryLike.fetchNextPage();
      while (r?.hasNextPage) {
        r = await queryLike.fetchNextPage();
      }
    } catch (err) {
      if (import.meta.env?.DEV) {
        console.warn(`[ExploreHomeScreen] Auto load failed for ${key}:`, err);
      }
    } finally {
      zoneAutoLoadBusyRef.current[key] = false;
    }
  }, []);

  React.useEffect(() => {
    if (!hasZoneFilter) return;
    if (selectedType !== 'fechas') return;
    void runAutoLoadAllPages('fechas', fechasQuery);
  }, [hasZoneFilter, selectedType, fechasQuery.hasNextPage, fechasQuery.isFetchingNextPage, fechasQuery.isLoading, fechasQuery.fetchNextPage, runAutoLoadAllPages]);

  React.useEffect(() => {
    if (!hasZoneFilter) return;
    if (selectedType !== 'academias') return;
    void runAutoLoadAllPages('academias', academiasQuery);
  }, [hasZoneFilter, selectedType, academiasQuery.hasNextPage, academiasQuery.isFetchingNextPage, academiasQuery.isLoading, academiasQuery.fetchNextPage, runAutoLoadAllPages]);

  React.useEffect(() => {
    if (!hasZoneFilter) return;
    if (selectedType !== 'maestros') return;
    void runAutoLoadAllPages('maestros', maestrosQuery);
  }, [hasZoneFilter, selectedType, maestrosQuery.hasNextPage, maestrosQuery.isFetchingNextPage, maestrosQuery.isLoading, maestrosQuery.fetchNextPage, runAutoLoadAllPages]);

  React.useEffect(() => {
    if (!hasZoneFilter) return;
    if (selectedType !== 'organizadores') return;
    void runAutoLoadAllPages('organizadores', organizadoresQuery);
  }, [hasZoneFilter, selectedType, organizadoresQuery.hasNextPage, organizadoresQuery.isFetchingNextPage, organizadoresQuery.isLoading, organizadoresQuery.fetchNextPage, runAutoLoadAllPages]);

  React.useEffect(() => {
    if (!hasZoneFilter) return;
    if (selectedType !== 'marcas') return;
    void runAutoLoadAllPages('marcas', marcasQuery);
  }, [hasZoneFilter, selectedType, marcasQuery.hasNextPage, marcasQuery.isFetchingNextPage, marcasQuery.isLoading, marcasQuery.fetchNextPage, runAutoLoadAllPages]);

  React.useEffect(() => {
    if (!hasZoneFilter) return;
    if (selectedType !== 'usuarios') return;
    void runAutoLoadAllPages('usuarios', usuariosQuery);
  }, [hasZoneFilter, selectedType, usuariosQuery.hasNextPage, usuariosQuery.isFetchingNextPage, usuariosQuery.isLoading, usuariosQuery.fetchNextPage, runAutoLoadAllPages]);

  React.useEffect(() => {
    if (!hasZoneFilter) return;
    if (selectedType !== 'clases') return;
    void runAutoLoadAllPages('clases_academias', academiasQuery);
    void runAutoLoadAllPages('clases_maestros', maestrosQuery);
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
    runAutoLoadAllPages,
  ]);

  // Cargar automáticamente todas las páginas de usuarios para mostrar todos sin límite
  const usuariosAutoLoadRef = React.useRef(false);
  React.useEffect(() => {
    // Importante: no autoload cuando "showAll" está activo (pantalla inicial),
    // porque dispara muchas requests y puede inflar first_screen_mount.
    if (!shouldLoadUsuarios || selectedType !== 'usuarios' || !usuariosQuery.data) {
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

  const classesList = React.useMemo(() => {
    const dayNames = [
      t('sunday'),
      t('monday'),
      t('tuesday'),
      t('wednesday'),
      t('thursday'),
      t('friday'),
      t('saturday'),
    ];
    const allA = academiasData;
    const allM = maestrosData;
    const selectedRitmoSet = new Set<number>(filters.ritmos || []);
    const selectedZonaSet = new Set<number>(filters.zonas || []);
    const ritmoIdBySlugLocal = new Map<string, number>();
    for (const t of (allTags || []) as any[]) {
      if (t?.tipo === 'ritmo' && typeof t?.id === 'number' && typeof t?.slug === 'string') {
        ritmoIdBySlugLocal.set(String(t.slug).trim().toLowerCase(), t.id);
      }
    }

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
        // Campos para construir filtros dinámicos (ritmos/zonas realmente visibles).
        // No hacer fallback al owner para evitar ritmos sobrantes en contexto "clases".
        ritmos: c?.ritmos ?? [],
        ritmoId: c?.ritmoId,
        ritmoIds: c?.ritmoIds ?? [],
        estilos: c?.estilos ?? [],
        ritmos_seleccionados: c?.ritmosSeleccionados ?? c?.ritmos_seleccionados ?? [],
        zonas: c?.zonas ?? owner?.zonas ?? [],
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
    const classMatchesSelectedFilters = (item: any) => {
      if (selectedRitmoSet.size > 0) {
        const itemRitmoIds = new Set<number>();
        const addNum = (v: any) => {
          const n = Number(v);
          if (Number.isFinite(n) && n > 0) itemRitmoIds.add(Math.trunc(n));
        };
        const addArr = (arr: any) => {
          if (!Array.isArray(arr)) return;
          arr.forEach(addNum);
        };
        addNum(item?.ritmoId);
        addArr(item?.ritmoIds);
        addArr(item?.ritmos);
        addArr(item?.estilos);
        const slugs = [
          ...(Array.isArray(item?.ritmos_seleccionados) ? item.ritmos_seleccionados : []),
          ...(Array.isArray(item?.ritmosSeleccionados) ? item.ritmosSeleccionados : []),
        ];
        for (const raw of slugs) {
          const key = String(raw ?? '').trim().toLowerCase();
          if (!key) continue;
          const mapped = ritmoIdBySlugLocal.get(key);
          if (typeof mapped === 'number') itemRitmoIds.add(mapped);
        }
        let hit = false;
        itemRitmoIds.forEach((id) => {
          if (selectedRitmoSet.has(id)) hit = true;
        });
        if (!hit) return false;
      }

      if (selectedZonaSet.size > 0) {
        const itemZonaIds = new Set<number>();
        const addZona = (v: any) => {
          const n = Number(v);
          if (Number.isFinite(n) && n > 0) itemZonaIds.add(Math.trunc(n));
        };
        addZona(item?.zonaId);
        addZona(item?.zona);
        if (Array.isArray(item?.zonas)) item.zonas.forEach(addZona);
        if (Array.isArray(item?.zonaIds)) item.zonaIds.forEach(addZona);
        let hit = false;
        itemZonaIds.forEach((id) => {
          if (selectedZonaSet.has(id)) hit = true;
        });
        if (!hit) return false;
      }
      return true;
    };
    const mergedByRhythmAndZone = merged.filter(classMatchesSelectedFilters);
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

    const filtered = mergedByRhythmAndZone
      .filter(matchesPresetAndRange)
      .filter((item: any) => !shouldHideExploreClassForBlackout(item));

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
  }, [
    t,
    i18n.language,
    academiasData,
    maestrosData,
    allTags,
    filters.ritmos,
    filters.zonas,
    filters.datePreset,
    filters.dateFrom,
    filters.dateTo,
    qDeferred,
    todayYmd,
  ]);

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
    if (type === 'fechas') return filteredFechas;
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
  const showDatesDropdown = selectedType === 'fechas' || selectedType === 'clases';

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
      {activeFiltersCount > 0 && (
        <span className="filters-hero-trigger__badge">
          {activeFiltersCount > 99 ? '99+' : activeFiltersCount}
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
              >
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
                        {t(TYPE_OPTIONS.find((o) => o.id === (filters.type || 'fechas'))?.labelKey ?? 'explore_type_sociales')}
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
                    background: 'linear-gradient(180deg, #161b24 0%, #0f1218 100%)',
                    border: '1px solid rgba(41, 127, 150, 0.3)',
                    borderRadius: 16,
                    padding: '12px 10px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05) inset',
                    top: rect.bottom + 8,
                    left,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {TYPE_OPTIONS.map((opt) => {
                      const active = (filters.type || 'fechas') === opt.id;
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
                datePreset={filters.datePreset}
                onApply={applyDateFilter}
                onPresetSelect={applyDatePreset}
                anchorEl={openFilterDropdown === "fechas" ? fechasPillRef.current : null}
                open={openFilterDropdown === "fechas"}
                onClose={() => setOpenFilterDropdown(null)}
                triggerRef={fechasPillRef}
                summaryText={dateSummaryText}
                t={t}
              />

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

          {shouldRenderSection('fechas') && (((showAll && (fechasLoading || hasFechas || fechasError)) || selectedType === 'fechas')) && (
            <Section
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
              <div
                className="explore-fechas-view-toggle-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  width: '100%',
                  marginTop: -4,
                  marginBottom: 14,
                  paddingLeft: 2,
                  paddingRight: 2,
                }}
              >
                <div
                  role="group"
                  aria-label={t('explore_fechas_view_group') || 'Vista de sociales'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0,
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.22)',
                    background: 'rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    aria-pressed={fechasViewMode === 'carousel'}
                    onClick={() => setFechasViewMode('carousel')}
                    title={t('explore_fechas_view_cards') || 'Tarjetas'}
                    aria-label={t('explore_fechas_view_cards') || 'Vista en tarjetas'}
                    style={{
                      border: 'none',
                      background: fechasViewMode === 'carousel' ? 'rgba(255,255,255,0.18)' : 'transparent',
                      color: '#fff',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 0,
                    }}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    type="button"
                    aria-pressed={fechasViewMode === 'cartelera'}
                    onClick={() => setFechasViewMode('cartelera')}
                    title={t('explore_fechas_view_cartelera') || 'Cartelera'}
                    aria-label={t('explore_fechas_view_cartelera') || 'Vista cartelera'}
                    style={{
                      border: 'none',
                      borderLeft: '1px solid rgba(255,255,255,0.12)',
                      background: fechasViewMode === 'cartelera' ? 'rgba(255,255,255,0.18)' : 'transparent',
                      color: '#fff',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 0,
                    }}
                  >
                    <Images size={18} />
                  </button>
                  <button
                    type="button"
                    aria-pressed={fechasViewMode === 'list'}
                    onClick={() => setFechasViewMode('list')}
                    title={t('explore_fechas_view_list') || 'Lista'}
                    aria-label={t('explore_fechas_view_list') || 'Vista en lista'}
                    style={{
                      border: 'none',
                      borderLeft: '1px solid rgba(255,255,255,0.12)',
                      background: fechasViewMode === 'list' ? 'rgba(255,255,255,0.18)' : 'transparent',
                      color: '#fff',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 0,
                    }}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
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
                                <div
                                  style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: 14,
                                    overflow: "hidden",
                                  }}
                                >
                                  <CTACard text={t("cta_classes")} sectionType="clases" idx={idx} />
                                </div>
                              </div>
                            );
                          }
                          const rowKey = `${item.ownerType || "owner"}-${item.ownerId ?? "unknown"}-${item.titulo ?? "class"}-${item.fecha ?? (Array.isArray(item.diasSemana) ? item.diasSemana.join("-") : "semana")}-${idx}`;
                          return (
                            <div key={rowKey} role="listitem" onClickCapture={handlePreNavigate} style={{ width: "100%" }}>
                              <ClaseListRow item={item} priority={idx < EAGER_OTHERS} />
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
                                <div
                                  style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: 14,
                                    overflow: "hidden",
                                  }}
                                >
                                  <CTACard text={t("cta_classes")} sectionType="clases" idx={idx} />
                                </div>
                              </div>
                            );
                          }
                          const rowKey = `${item.ownerType || "owner"}-${item.ownerId ?? "unknown"}-${item.titulo ?? "class"}-${item.fecha ?? (Array.isArray(item.diasSemana) ? item.diasSemana.join("-") : "semana")}-${idx}`;
                          return (
                            <div key={rowKey} role="listitem" onClickCapture={handlePreNavigate} style={{ minWidth: 0 }}>
                              <ExploreEntityCarteleraCard variant="clase" item={item} priority={idx < EAGER_OTHERS} />
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
              <AcademiesSection
                filters={filters}
                q={qDeferred || undefined}
                enabled={showAll || selectedType === 'academias'}
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
              />
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
                                <div
                                  style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: 14,
                                    overflow: "hidden",
                                  }}
                                >
                                  <CTACard text={t("cta_teachers")} sectionType="maestros" idx={idx} />
                                </div>
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
                              <ExploreProfileListRow variant="teacher" item={item} priority={idx < EAGER_OTHERS} />
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
                                <div
                                  style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: 14,
                                    overflow: "hidden",
                                  }}
                                >
                                  <CTACard text={t("cta_teachers")} sectionType="maestros" idx={idx} />
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div key={item.id ?? idx} role="listitem" onClickCapture={handlePreNavigate} style={{ minWidth: 0 }}>
                              <ExploreEntityCarteleraCard variant="teacher" item={item} priority={idx < EAGER_OTHERS} />
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
                                priority={idx < EAGER_OTHERS}
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
                                priority={idx < EAGER_OTHERS}
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
                              <div
                                style={{
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  borderRadius: 14,
                                  overflow: "hidden",
                                }}
                              >
                                <CTACard text={t("cta_organizers")} sectionType="organizadores" idx={idx} />
                              </div>
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
                            <ExploreProfileListRow variant="organizer" item={item} priority={idx < EAGER_OTHERS} />
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
                              <div
                                style={{
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  borderRadius: 14,
                                  overflow: "hidden",
                                }}
                              >
                                <CTACard text={t("cta_organizers")} sectionType="organizadores" idx={idx} />
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={item.id ?? idx} role="listitem" onClickCapture={handlePreNavigate} style={{ minWidth: 0 }}>
                            <ExploreEntityCarteleraCard variant="organizer" item={item} priority={idx < EAGER_OTHERS} />
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
