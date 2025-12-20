import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
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
import { EventsSection } from "../../components/sections/EventsSection";
import { ClassesSection } from "../../components/sections/ClassesSection";
import { AcademiesSection } from "../../components/sections/AcademiesSection";

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

/**
 * FechaItem - Componente memoizado optimizado para scroll fluido
 * 
 * Optimizaciones:
 * - Memoización con comparación personalizada para evitar re-renders innecesarios
 * - Reducción de animaciones en mobile (solo primeras 10 cards en desktop)
 * - CSS contain para limitar repaints
 * - Aceleración de hardware con translateZ(0)
 * - Comparación por ID y recurrence_index para estabilidad
 */
const FechaItem = React.memo(({ fechaEvento, idx, handlePreNavigate }: { fechaEvento: any; idx: number; handlePreNavigate: () => void }) => {
  const uniqueKey = fechaEvento._recurrence_index !== undefined
    ? `${fechaEvento._original_id || fechaEvento.id}_${fechaEvento._recurrence_index}`
    : (fechaEvento.id ?? `fecha_${idx}`);

  // Reducir animaciones en mobile para mejor rendimiento
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const shouldAnimate = !isMobile && idx < 10; // Solo animar primeras 10 cards

  return (
    <div
      key={uniqueKey}
      onClickCapture={handlePreNavigate}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 0,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
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
          <EventCard item={fechaEvento} />
        </motion.div>
      ) : (
        <EventCard item={fechaEvento} />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return prevProps.fechaEvento?.id === nextProps.fechaEvento?.id &&
         prevProps.fechaEvento?._recurrence_index === nextProps.fechaEvento?._recurrence_index &&
         prevProps.idx === nextProps.idx;
});

FechaItem.displayName = 'FechaItem';

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
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
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
          <ClassCard item={clase} fillHeight />
        </motion.div>
      ) : (
        <ClassCard item={clase} fillHeight />
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
          boxShadow: '0 4px 16px rgba(240, 147, 251, 0.3)',
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
          border: '2px solid rgba(255, 255, 255, 0.3)'
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
          maxWidth: '90%'
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
    background: #0b0d10; 
    color: ${colors.gray[50]}; 
    width: 100%;
    overflow-x: hidden;
    padding-top: 0;
    padding-bottom: env(safe-area-inset-bottom); 

  }
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
  .wrap { 
    max-width: 1280px; 
    margin: 0 auto; 
    padding: 0 ${spacing[6]} ${spacing[10]};
    width: 100%;
    box-sizing: border-box;
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
  .section-header {
    margin-bottom: 2rem;
    padding: 0 0.5rem;
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
  .filters-panel {
    background: linear-gradient(180deg, var(--panel), var(--panel-2));
    border: 1px solid var(--stroke);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-1);
    backdrop-filter: blur(10px);
    color: var(--text);
    padding: clamp(8px, 1.6vw, 12px);
    max-width: 960px;
    margin: 1.5px auto;
    display: grid;
    gap: var(--gap-2);
    font-family: system-ui,-apple-system,Segoe UI,Inter,Roboto,sans-serif;
  }
  .fxc__row2 {
    margin-bottom: 0;
    padding-bottom: 0;
  }
  @media (min-width: 769px) {
    .filters-panel {
      max-width: 100%;
      width: 100%;
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
    padding: 0.2rem;
    background: hsl(235 25% 21% / .55);
    border: 1px solid var(--stroke);
    border-radius: 999px;
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
    justify-content: space-evenly;
    gap: var(--gap-2);
    width: 100%;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x proximity;
    padding-bottom: 0.15rem;
    margin-top: 0;
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
      margin: 1.5px 0 !important;
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
      margin: 1.5px 0 !important;
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
      margin: 1.5px 0 !important;
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

function Section({ title, toAll, children, count }: { title: string; toAll: string; children: React.ReactNode; count?: number }) {
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
      <div className="section-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        padding: '0 0.5rem',
        position: 'relative'
      }}>
        <div>
          <h2 className="section-title-text" style={{
            fontSize: '1.875rem',
            fontWeight: 800,
            margin: 0,
            marginBottom: '0.25rem',
            background: 'linear-gradient(135deg, #f093fb, #FFD166)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.2,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {title}
            {typeof count === 'number' && count > 0 && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '28px',
                height: '28px',
                padding: '0 8px',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#fff',
                marginLeft: '0.25rem'
              }}>
                {count}
              </span>
            )}
          </h2>
          <div className="section-title-underline" style={{
            width: 60,
            height: 4,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)',
            opacity: 0.8
          }} />
        </div>
      </div>
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
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });
  const [hasAppliedDefaults, setHasAppliedDefaults] = React.useState(false);
  const [usingFavoriteFilters, setUsingFavoriteFilters] = React.useState(false);
  const [openFilterDropdown, setOpenFilterDropdown] = React.useState<string | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const { data: allTags } = useTags();
  const { preferences, applyDefaultFilters, loading: prefsLoading } = useUserFilterPreferences();

  const qDebounced = useDebouncedValue(filters.q || '', 300);
  const qDeferred = React.useDeferredValue(qDebounced);

  const hasConfiguredFavorites = React.useMemo(
    () => !!(preferences && (preferences as any).id),
    [preferences]
  );

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
    const todayCDMX = getTodayCDMX();
    const todayDate = new Date(todayCDMX + 'T12:00:00');

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

  const applyDatePreset = React.useCallback((preset: 'todos' | 'hoy' | 'semana' | 'siguientes') => {
    if (filters.datePreset === preset) return;

    startTransition(() => {
      const { from, to } = computePresetRange(preset);
      // Actualizar todo en una sola llamada para evitar renders duplicados
      set({ datePreset: preset, dateFrom: from, dateTo: to });
    });
  }, [filters.datePreset, computePresetRange, set, startTransition]);

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

  // Memoizar renderItem functions para evitar recrearlas en cada render
  const renderFechaItem = React.useCallback((fechaEvento: any, idx: number) => {
    return (
      <FechaItem 
        key={fechaEvento._recurrence_index !== undefined 
          ? `${fechaEvento._original_id || fechaEvento.id}_${fechaEvento._recurrence_index}` 
          : (fechaEvento.id ?? `fecha_${idx}`)} 
        fechaEvento={fechaEvento} 
        idx={idx} 
        handlePreNavigate={handlePreNavigate} 
      />
    );
  }, [handlePreNavigate]);

  const renderClaseItem = React.useCallback((item: any, idx: number) => {
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
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
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
  }, [handlePreNavigate, t]);

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
  const hasMarcas = marcasData.length > 0;

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
    !hasMarcas;

  const handleFilterChange = (newFilters: typeof filters) => {
    set(newFilters);
  };

  const renderDatePresetButtons = (mobile = false) => (
    <>
      {([
        { id: 'todos', label: t('all') },
        { id: 'hoy', label: t('today') },
        { id: 'semana', label: t('this_week') },
        { id: 'siguientes', label: t('next_week') },
      ] as const).map((p) => {
        const active = (filters.datePreset || 'todos') === p.id;
        return (
          <button
            key={p.id}
            onClick={() => applyDatePreset(p.id)}
            className={`q ${active ? 'q--active' : ''}`}
            disabled={isPending}
            aria-pressed={active}
          >
            <span className="label">{p.label}</span>
          </button>
        );
      })}
    </>
  );

  return (
    <>
      <SeoHead section="explore" />
      <style>{STYLES}</style>

      <div className="explore-container">
        <div className="wrap">
          <section className="filters-panel" style={{ margin: `0 0 ${spacing[6]} 0` }}>
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

            {/* Row 1: Título + estado + búsqueda colapsada */}
            <div className="fxc__row1">
              <div className="fxc__head">
                <h2 className="fxc__title" id="fxc-title">
                  <span aria-hidden="true">🧩</span> {t('filters')}
                </h2>
                <span className="fxc__state" aria-live="polite">
                  {activeFiltersCount > 0
                    ? (activeFiltersCount === 1
                      ? t('active_filters', { count: activeFiltersCount })
                      : t('active_filters_plural', { count: activeFiltersCount }))
                    : t('no_filters')}
                </span>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
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
                      setIsSearchExpanded(false);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.7rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(239,68,68,0.3)',
                      background: 'rgba(239,68,68,.14)',
                      color: '#fecaca',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      marginLeft: 'auto'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,.2)';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#f97373';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,.14)';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)';
                    }}
                    aria-label={t('clear_all_filters')}
                  >
                    🗑️ {t('clear')}
                  </button>
                )}
                </div>
                  {!usingFavoriteFilters && user && preferences && (
                    (preferences.ritmos && preferences.ritmos.length > 0) ||
                    (preferences.zonas && preferences.zonas.length > 0) ||
                    (preferences.date_range && preferences.date_range !== 'none')
                  ) && (
                      <button
                        type="button"
                        onClick={resetToFavoriteFilters}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.7rem',
                          borderRadius: '999px',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'rgba(255, 255, 255, 0.75)',
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.1)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.25)';
                          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.9)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.05)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.15)';
                          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.75)';
                        }}
                      >
                        <span style={{ fontSize: '0.75rem' }}>⭐</span>
                        <span>{t('activate_favorites')}</span>
                      </button>
                    )}
                </div>

            {/* Row 2: 4 chips en una fila */}
            <div className="fxc__row2" role="toolbar" aria-label={t('controls')}>
              <nav className="segment" aria-label={t('filter_type_aria')}>
                <button
                  className={`seg ${openFilterDropdown === 'tipos' ? 'seg--active' : ''}`}
                  onClick={() => setOpenFilterDropdown(openFilterDropdown === 'tipos' ? null : 'tipos')}
                  aria-pressed={openFilterDropdown === 'tipos'}
                  role="button"
                >
                  👥 {t('what_are_you_looking_for')}
                  {filters.type !== 'all' && (
                    <span style={{
                      display: 'inline-grid',
                      placeItems: 'center',
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 6px',
                      borderRadius: '999px',
                      border: '1px solid var(--chip-stroke)',
                      background: 'hsl(235 25% 24% / .9)',
                      fontSize: '0.68rem',
                      fontWeight: 900
                    }}>1</span>
                  )}
                </button>
                <button
                  className={`seg ${openFilterDropdown === 'ritmos' ? 'seg--active' : ''}`}
                  onClick={() => setOpenFilterDropdown(openFilterDropdown === 'ritmos' ? null : 'ritmos')}
                  aria-pressed={openFilterDropdown === 'ritmos'}
                  role="button"
                >
                  🎵 {t('rhythms')}
                  {stableRitmos.length > 0 && (
                    <span style={{
                      display: 'inline-grid',
                      placeItems: 'center',
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 6px',
                      borderRadius: '999px',
                      border: '1px solid var(--chip-stroke)',
                      background: 'hsl(235 25% 24% / .9)',
                      fontSize: '0.68rem',
                      fontWeight: 900
                    }}>{stableRitmos.length}</span>
                  )}
                </button>
                <button
                  className={`seg ${openFilterDropdown === 'zonas' ? 'seg--active' : ''}`}
                  onClick={() => setOpenFilterDropdown(openFilterDropdown === 'zonas' ? null : 'zonas')}
                  aria-pressed={openFilterDropdown === 'zonas'}
                  role="button"
                >
                  📍 {t('zones')}
                  {stableZonas.length > 0 && (
                    <span style={{
                      display: 'inline-grid',
                      placeItems: 'center',
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 6px',
                      borderRadius: '999px',
                      border: '1px solid var(--chip-stroke)',
                      background: 'hsl(235 25% 24% / .9)',
                      fontSize: '0.68rem',
                      fontWeight: 900
                    }}>{stableZonas.length}</span>
                  )}
                </button>
                <button
                  className={`seg ${openFilterDropdown === 'fechas' ? 'seg--active' : ''}`}
                  onClick={() => setOpenFilterDropdown(openFilterDropdown === 'fechas' ? null : 'fechas')}
                  aria-pressed={openFilterDropdown === 'fechas'}
                  role="button"
                >
                  🗓️ {t('dates')}
                  {(filters.dateFrom || filters.dateTo) && (
                    <span style={{
                      display: 'inline-grid',
                      placeItems: 'center',
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 6px',
                      borderRadius: '999px',
                      border: '1px solid var(--chip-stroke)',
                      background: 'hsl(235 25% 24% / .9)',
                      fontSize: '0.68rem',
                      fontWeight: 900
                    }}>1</span>
                  )}
                </button>
                <button
                  className={`seg ${isSearchExpanded || filters.q ? 'seg--active' : ''}`}
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  aria-pressed={isSearchExpanded}
                  role="button"
                  style={{
                    border: filters.q ? '2px solid rgba(240, 147, 251, 0.5)' : undefined,
                    background: filters.q ? 'rgba(240, 147, 251, 0.12)' : undefined
                  }}
                >
                  🔎 {t('search_action')}
                  {filters.q && (
                    <span style={{
                      display: 'inline-grid',
                      placeItems: 'center',
                      minWidth: '18px',
                      height: '18px',
                      padding: '0 6px',
                      borderRadius: '999px',
                      border: '1px solid var(--chip-stroke)',
                      background: '#f093fb',
                      fontSize: '0.68rem',
                      fontWeight: 900
                    }}>1</span>
                  )}
                </button>
                {activeFiltersCount > 0 && (
                  <button
                    className="seg"
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
                      setIsSearchExpanded(false);
                    }}
                    style={{
                      background: 'rgba(239,68,68,.14)',
                      borderColor: '#f97373',
                      color: '#fecaca'
                    }}
                    role="button"
                  >
                    🗑️ {t('clear')} ({activeFiltersCount})
                  </button>
                )}
              </nav>
            </div>

            <div style={{ marginTop: '4px', position: 'relative' }}>
              <FilterBar
                filters={filters}
                onFiltersChange={(newFilters) => {
                  handleFilterChange(newFilters);
                }}
                showTypeFilter={true}
                initialOpenDropdown={openFilterDropdown}
                hideButtons={true}
              />
            </div>

            {/* Fila de búsqueda expandida */}
            {isSearchExpanded && (
              <div className="filters-search-expanded" style={{
                marginTop: '4px',
                padding: '8px 0',
                animation: 'fadeIn 0.2s ease-in'
              }}>
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  width: '100%',
                  gap: '8px'
                  }}>
                    <span style={{
                      position: 'absolute',
                    left: '14px',
                    fontSize: '16px',
                      pointerEvents: 'none',
                    zIndex: 1,
                    color: 'rgba(255, 255, 255, 0.7)'
                    }}>
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
                      fontFamily: 'inherit'
                      }}
                      autoFocus
                    />
                    {filters.q && (
                      <button
                      onClick={() => {
                        handleFilterChange({ ...filters, q: '' });
                      }}
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
                        WebkitTapHighlightColor: 'rgba(255, 255, 255, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#1b2130';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#4b5563';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#181b26';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--fp-border-soft)';
                        }}
                        aria-label="Limpiar búsqueda"
                      >
                      {t('clear')}
                      </button>
                    )}
                    <button
                      onClick={() => setIsSearchExpanded(false)}
                    className="filters-search-close-btn"
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
                      WebkitTapHighlightColor: 'rgba(255, 255, 255, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = '#1b2130';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#4b5563';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = '#181b26';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--fp-border-soft)';
                      }}
                      aria-label={t('collapse_search')}
                    >
                      ✖
                    </button>
                  </div>
              </div>
            )}

            {/* Rangos rápidos: UNA fila + tamaño reducido */}
            <nav className="quick-row" aria-label="Rangos rápidos">
              {renderDatePresetButtons(false)}
            </nav>
          </section>

          {(showAll || selectedType === 'fechas') && (fechasLoading || hasFechas) && (
            <Section title={t('section_upcoming_scene')} toAll="/explore/list?type=fechas" count={filteredFechas.length}>
              {fechasLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">{t('loading')}</div>)}</div>
              ) : (
                <>
                  {filteredFechas.length > 0 ? (
                    <HorizontalSlider
                      {...sliderProps}
                      items={filteredFechas}
                      renderItem={renderFechaItem}
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

          {(showAll || selectedType === 'clases') && ((academiasLoading || maestrosLoading) || hasClases) && (
            <Section title={t('section_recommended_classes')} toAll="/explore/list?type=clases" count={classesList.length}>
              {(() => {
                const loading = academiasLoading || maestrosLoading;
                if (loading) return <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">{t('loading')}</div>)}</div>;

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

          {(showAll || selectedType === 'academias') && (academiasLoading || hasAcademias) && (
            <Section title={t('section_best_academies_zone')} toAll="/explore/list?type=academias" count={academiasData.length}>
              <AcademiesSection
                filters={filters}
                q={qDeferred || undefined}
                enabled={showAll || selectedType === 'academias'}
                maxItems={12}
              />
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

          {(showAll || selectedType === 'maestros') && (maestrosLoading || hasMaestros) && (
            <Section title={t('section_featured_teachers')} toAll="/explore/list?type=teacher" count={maestrosData.length}>
              {maestrosLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">{t('loading')}</div>)}</div>
              ) : (
                <>
                  <HorizontalSlider
                    {...sliderProps}
                    items={maestrosDataWithCTA}
                    renderItem={(item: any, idx: number) => {
                      if (item?.__isCTA) {
                        return (
                          <motion.div
                            key="cta-maestros"
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
                              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                            }}
                          >
                            <CTACard text={t('cta_teachers')} sectionType="maestros" idx={idx} />
                          </motion.div>
                        );
                      }
                      return (
                        <motion.div
                          key={item.id ?? idx}
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
                          <TeacherCard item={item} />
                        </motion.div>
                      );
                    }}
                  />
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

          {(showAll || selectedType === 'usuarios') && (usuariosLoading || hasUsuarios) && (
            <Section title={t('section_dancers_near_you')} toAll="/explore/list?type=usuarios" count={validUsuarios.length}>
              {usuariosLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
              ) : (
                <>
                  {validUsuarios.length > 0 ? (
                    <>
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
                  ) : null}
                </>
              )}
            </Section>
          )}

          {(showAll || selectedType === 'organizadores') && (organizadoresLoading || organizadoresData.length > 0) && (
            <Section title={t('section_event_producers')} toAll="/explore/list?type=organizadores" count={organizadoresData.length}>
              {organizadoresLoading ? (
                <div className="cards-grid">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="card-skeleton">
                      {t('loading')}
                    </div>
                  ))}
                </div>
              ) : organizadoresData.length > 0 ? (
                <>
                  <HorizontalSlider
                    {...sliderProps}
                    items={organizadoresDataWithCTA}
                    renderItem={(item: any, idx: number) => {
                      if (item?.__isCTA) {
                        return (
                          <motion.div
                            key="cta-organizadores"
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
                              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                            }}
                          >
                            <CTACard text={t('cta_organizers')} sectionType="organizadores" idx={idx} />
                          </motion.div>
                        );
                      }
                      return (
                        <motion.div
                          key={item.id ?? idx}
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
                          <OrganizerCard item={item} />
                        </motion.div>
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

          {(showAll || selectedType === 'marcas') && (marcasLoading || hasMarcas) && (
            <Section title={t('section_specialized_brands')} toAll="/explore/list?type=marcas" count={marcasData.length}>
              {marcasLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">{t('loading')}</div>)}</div>
              ) : (
                <>
                  <HorizontalSlider
                    {...sliderProps}
                    items={marcasDataWithCTA}
                    renderItem={(item: any, idx: number) => {
                      if (item?.__isCTA) {
                        return (
                          <motion.div
                            key="cta-marcas"
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
                              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                            }}
                          >
                            <CTACard text={t('cta_brands')} sectionType="marcas" idx={idx} />
                          </motion.div>
                        );
                      }
                      return (
                        <motion.div
                          key={item.id ?? idx}
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
                          <BrandCard item={item} />
                        </motion.div>
                      );
                    }}
                  />
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
          <Section title={t('share_section')} toAll="">
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
                      📱📱📱📱
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
    </>
  );
}
