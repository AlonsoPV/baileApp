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

const FechaItem = React.memo(({ fechaEvento, idx, handlePreNavigate }: { fechaEvento: any; idx: number; handlePreNavigate: () => void }) => {
  const uniqueKey = fechaEvento._recurrence_index !== undefined
    ? `${fechaEvento._original_id || fechaEvento.id}_${fechaEvento._recurrence_index}`
    : (fechaEvento.id ?? `fecha_${idx}`);

  return (
    <motion.div
      key={uniqueKey}
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
  );
});

FechaItem.displayName = 'FechaItem';

const ClaseItem = React.memo(({ clase, idx, handlePreNavigate }: { clase: any; idx: number; handlePreNavigate: () => void }) => {
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
  const handleClick = React.useCallback(() => {
    window.location.href = 'https://dondebailar.com.mx/app/roles/info';
  }, []);

  const logoUrl = 'https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/LogoDondeBMx.webp';

  return (
    <>
      <style>{`
        .cta-card-mobile {
          width: 100%;
        }
        @media (max-width: 768px) {
          .cta-card-mobile {
            aspect-ratio: 9 / 16 !important;
            height: auto !important;
            min-height: auto !important;
            max-width: calc((9 / 16) * 100vh);
            margin: 0 auto;
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
          minHeight: '350px',
          height: '350px',
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
          Únete
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
    max-width: 100%;
    margin: 0 auto;
    padding: 16px 18px 18px;
    border-radius: var(--fp-radius-lg);
    border: 1px solid #20232e;
    background: radial-gradient(circle at top left,#262a34 0,#14171f 45%,#090b10 100%);
    box-shadow: var(--fp-shadow);
    font-family: system-ui,-apple-system,Segoe UI,Inter,Roboto,sans-serif;
    color: var(--fp-text);
    display: flex;
    flex-direction: column;
    gap: 10px;
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
  .filters-box {
    border-radius: var(--fp-radius);
    background: var(--fp-bg-soft);
    border: 1px solid var(--fp-border);
    padding: 10px 10px 12px;
  }
  .filters-box__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .filters-box__title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
  }
  .filters-box__icon {
    font-size: 16px;
  }
  .filters-box__badge {
    font-size: 11px;
    color: var(--fp-muted);
    border-radius: var(--fp-pill);
    border: 1px solid var(--fp-border-soft);
    padding: 3px 8px;
    background: #141722;
  }
  .filters-chips {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 2px 2px;
    scrollbar-width: thin;
    scrollbar-color: #4b5563 transparent;
  }
  .filters-chips::-webkit-scrollbar {
    height: 6px;
  }
  .filters-chips::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 10px;
  }
  .chip {
    position: relative;
    flex: 0 0 auto;
    border-radius: var(--fp-pill);
    border: 1px solid var(--fp-border-soft);
    background: #181b26;
    color: var(--fp-text);
    font-size: 12px;
    padding: 8px 14px;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: background var(--fp-speed), border-color var(--fp-speed), transform var(--fp-speed), box-shadow var(--fp-speed);
    font-weight: 600;
  }
  .chip__icon {
    font-size: 14px;
  }
  .chip__badge {
    min-width: 18px;
    height: 18px;
    border-radius: 999px;
    background: #ec4899;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    padding: 0 5px;
  }
  .chip__label {
    white-space: nowrap;
  }
  .chip--filter:hover {
    background: #1f2330;
    border-color: #4b5563;
    transform: translateY(-1px);
  }
  .chip--filter.chip--active {
    background: #1f2330;
    border-color: #4b5563;
    box-shadow: 0 0 0 1px rgba(255,75,139,0.4);
  }
  .chip--danger {
    background: rgba(239,68,68,.14);
    border-color: #f97373;
    color: #fecaca;
  }
  .chip--danger:hover {
    background: rgba(239,68,68,.22);
    box-shadow: 0 0 0 1px rgba(248,113,113,.6);
  }
  .filters-tabs {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 4px;
  }
  .tab {
    flex: 1;
    border-radius: var(--fp-pill);
    border: 1px solid var(--fp-border-soft);
    background: #141722;
    color: var(--fp-text);
    font-size: 13px;
    padding: 9px 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background var(--fp-speed), border-color var(--fp-speed), transform var(--fp-speed), box-shadow var(--fp-speed);
  }
  .tab:hover {
    background: #1b2130;
    transform: translateY(-0.5px);
  }
  .tab--active {
    background: var(--fp-grad);
    border-color: transparent;
    box-shadow: 0 0 0 1px rgba(0,0,0,.35);
  }
  .load-more-btn {
    margin-top: 1.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
    color: var(--fp-text);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  .load-more-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }
  .load-more-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  @media (max-width: 768px) {
    .filters-panel {
      max-width: 100% !important;
      padding: 12px 14px 14px !important;
      border-radius: 20px !important;
      margin: 0 !important;
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
    .filters-box {
      padding: 10px 10px 12px !important;
      border-radius: 14px !important;
    }
    .filters-box__header {
      margin-bottom: 10px !important;
    }
    .filters-box__title {
      font-size: 12px !important;
      font-weight: 700 !important;
    }
    .filters-box__icon {
      font-size: 16px !important;
    }
    .filters-box__badge {
      font-size: 10px !important;
      padding: 3px 7px !important;
      min-height: 18px !important;
    }
    .filters-chips {
      gap: 6px !important;
      padding: 6px 4px 4px !important;
      -webkit-overflow-scrolling: touch !important;
      scroll-behavior: smooth !important;
      scrollbar-width: thin !important;
      scrollbar-color: rgba(255, 255, 255, 0.2) transparent !important;
    }
    .filters-chips::-webkit-scrollbar {
      height: 4px !important;
    }
    .filters-chips::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2) !important;
      border-radius: 4px !important;
    }
    .chip {
      font-size: 11px !important;
      padding: 8px 12px !important;
      min-height: 36px !important;
      gap: 6px !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1) !important;
      white-space: nowrap !important;
    }
    .chip__icon {
      font-size: 13px !important;
    }
    .chip__badge {
      min-width: 16px !important;
      height: 16px !important;
      font-size: 9px !important;
      font-weight: 700 !important;
    }
    .tab {
      font-size: 12px !important;
      padding: 8px 6px !important;
      min-height: 36px !important;
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
    .tab {
      font-size: 11px !important;
      padding: 7px 5px !important;
      min-height: 34px !important;
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
    .filters-box {
      padding: 7px 7px 9px !important;
    }
    .filters-box__title {
      font-size: 10px !important;
    }
    .filters-box__icon {
      font-size: 14px !important;
    }
    .chip {
      font-size: 9px !important;
      padding: 6px 10px !important;
      min-height: 32px !important;
    }
    .chip__icon {
      font-size: 11px !important;
    }
    .chip__badge {
      min-width: 14px !important;
      height: 14px !important;
      font-size: 8px !important;
    }
    .tab {
      font-size: 10px !important;
      padding: 6px 4px !important;
      min-height: 32px !important;
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
            lineHeight: 1.2
          }}>
            {title}
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
    if (filters.dateFrom !== from || filters.dateTo !== to) {
      set({ dateFrom: from, dateTo: to });
    }
  }, [filters.datePreset, computePresetRange, set, filters.dateFrom, filters.dateTo]);

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
      set({ datePreset: preset });
      const { from, to } = computePresetRange(preset);
      set({ datePreset: preset, dateFrom: from, dateTo: to });
    });
  }, [filters.datePreset, computePresetRange, set]);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.q) count += 1;
    count += stableRitmos.length;
    count += stableZonas.length;
    if (filters.dateFrom || filters.dateTo) count += 1;
    return count;
  }, [filters.q, stableRitmos.length, stableZonas.length, filters.dateFrom, filters.dateTo]);

  const handlePreNavigate = React.useCallback(() => {
    try { if ('scrollRestoration' in window.history) { (window.history as any).scrollRestoration = 'manual'; } } catch { }
    try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch { }
  }, []);

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
            className={active ? 'tab tab--active' : 'tab'}
            disabled={isPending}
          >
            {p.label}
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
                    <p className="filters-fav__title">Usando tus filtros favoritos</p>
                    <p style={{
                      margin: '0.25rem 0 0 0',
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.65)',
                      fontWeight: 400
                    }}>
                      Configúralos en tu{' '}
                      <Link
                        to="/profile"
                        style={{
                          color: 'rgba(147, 197, 253, 0.9)',
                          textDecoration: 'underline',
                          textUnderlineOffset: '2px',
                          fontWeight: 500
                        }}
                      >
                        perfil
                      </Link>
                    </p>
                  </div>
                </div>
                <button className="filters-fav__btn" type="button" onClick={resetToFavoriteFilters}>
                  <span>🔁 Restablecer favoritos</span>
                </button>
              </motion.div>
            )}

            <div className="filters-box">
              <header className="filters-box__header">
                <div className="filters-box__title">
                  <span className="filters-box__icon">🎛️</span>
                  <span>Filtros</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                        <span>Activar favoritos</span>
                      </button>
                    )}
                  <span className="filters-box__badge">
                    {activeFiltersCount > 0
                      ? `${activeFiltersCount} filtro${activeFiltersCount !== 1 ? 's' : ''} activos`
                      : 'Sin filtros activos'}
                  </span>
                </div>
              </header>

              <div className="filters-chips">
                <button
                  className={`chip chip--filter ${openFilterDropdown === 'ritmos' ? 'chip--active' : ''}`}
                  onClick={() => setOpenFilterDropdown(openFilterDropdown === 'ritmos' ? null : 'ritmos')}
                >
                  <span className="chip__icon">🎵</span>
                  {stableRitmos.length > 0 && (
                    <span className="chip__badge">{stableRitmos.length}</span>
                  )}
                  <span className="chip__label">Ritmos</span>
                </button>
                <button
                  className={`chip chip--filter ${openFilterDropdown === 'zonas' ? 'chip--active' : ''}`}
                  onClick={() => setOpenFilterDropdown(openFilterDropdown === 'zonas' ? null : 'zonas')}
                >
                  <span className="chip__icon">📍</span>
                  {stableZonas.length > 0 && (
                    <span className="chip__badge">{stableZonas.length}</span>
                  )}
                  <span className="chip__label">Zona</span>
                </button>
                <button
                  className={`chip chip--filter ${openFilterDropdown === 'fechas' ? 'chip--active' : ''}`}
                  onClick={() => setOpenFilterDropdown(openFilterDropdown === 'fechas' ? null : 'fechas')}
                >
                  <span className="chip__icon">📅</span>
                  {(filters.dateFrom || filters.dateTo) && (
                    <span className="chip__badge">1</span>
                  )}
                  <span className="chip__label">Fechas</span>
                </button>
                {isSearchExpanded ? (
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    flex: '1 1 auto',
                    minWidth: '200px',
                    maxWidth: '400px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      fontSize: '14px',
                      pointerEvents: 'none',
                      zIndex: 1
                    }}>
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={filters.q || ''}
                      onChange={(e) => handleFilterChange({ ...filters, q: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 36px',
                        borderRadius: '999px',
                        border: filters.q ? '2px solid rgba(240, 147, 251, 0.5)' : '1px solid var(--fp-border-soft)',
                        background: filters.q ? 'rgba(240, 147, 251, 0.12)' : '#181b26',
                        color: 'var(--fp-text)',
                        fontSize: '12px',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        boxShadow: filters.q ? '0 0 0 3px rgba(240, 147, 251, 0.2), 0 4px 16px rgba(240, 147, 251, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.2)'
                      }}
                      autoFocus
                    />
                    {filters.q && (
                      <button
                        onClick={() => handleFilterChange({ ...filters, q: '' })}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          fontSize: '12px',
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(255,255,255,0.7)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        aria-label="Limpiar búsqueda"
                      >
                        ✖
                      </button>
                    )}
                    <button
                      onClick={() => setIsSearchExpanded(false)}
                      style={{
                        marginLeft: '6px',
                        padding: '8px 12px',
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
                        whiteSpace: 'nowrap'
                      }}
                      aria-label="Colapsar búsqueda"
                    >
                      ✖
                    </button>
                  </div>
                ) : (
                  <button
                    className="chip chip--filter"
                    onClick={() => setIsSearchExpanded(true)}
                    style={{
                      border: filters.q ? '2px solid rgba(240, 147, 251, 0.5)' : undefined,
                      background: filters.q ? 'rgba(240, 147, 251, 0.12)' : undefined
                    }}
                  >
                    <span className="chip__icon">🔍</span>
                    {filters.q && (
                      <span className="chip__badge" style={{ background: '#f093fb' }}>1</span>
                    )}
                    <span className="chip__label">{filters.q || 'Buscar'}</span>
                  </button>
                )}
                {activeFiltersCount > 0 && (
                  <button className="chip chip--danger" onClick={() => {
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
                  }}>
                    <span className="chip__icon">🗑️</span>
                    <span className="chip__label">Limpiar ({activeFiltersCount})</span>
                  </button>
                )}
              </div>

              <div style={{ marginTop: '8px', position: 'relative' }}>
                <FilterBar
                  filters={filters}
                  onFiltersChange={(newFilters) => {
                    handleFilterChange(newFilters);
                  }}
                  showTypeFilter={false}
                  initialOpenDropdown={openFilterDropdown}
                  hideButtons={true}
                />
              </div>
            </div>

            <div className="filters-tabs">
              {renderDatePresetButtons(false)}
            </div>
          </section>

          {(showAll || selectedType === 'fechas') && (fechasLoading || hasFechas) && (
            <Section title="Lo que viene en la escena" toAll="/explore/list?type=fechas">
              {fechasLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
              ) : (
                <>
                  {filteredFechas.length > 0 ? (
                    <HorizontalSlider
                      {...sliderProps}
                      items={filteredFechas}
                      renderItem={(fechaEvento: any, idx: number) => (
                        <FechaItem key={fechaEvento._recurrence_index !== undefined ? `${fechaEvento._original_id || fechaEvento.id}_${fechaEvento._recurrence_index}` : (fechaEvento.id ?? `fecha_${idx}`)} fechaEvento={fechaEvento} idx={idx} handlePreNavigate={handlePreNavigate} />
                      )}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
                  )}
                  {fechasLoadMore.hasNextPage && (
                    <button
                      className="load-more-btn"
                      onClick={fechasLoadMore.handleLoadMore}
                      disabled={fechasLoadMore.isFetching}
                    >
                      {fechasLoadMore.isFetching ? 'Cargando...' : 'Cargar más fechas'}
                    </button>
                  )}
                </>
              )}
            </Section>
          )}

          {(showAll || selectedType === 'clases') && ((academiasLoading || maestrosLoading) || hasClases) && (
            <Section title="Clases recomendadas para ti" toAll="/explore/list?type=clases">
              {(() => {
                const loading = academiasLoading || maestrosLoading;
                if (loading) return <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>;

                return (
                  <>
                    <HorizontalSlider
                      {...sliderProps}
                      items={classesListWithCTA}
                      renderItem={(item: any, idx: number) => {
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
                              <CTACard text="¿Eres maestro o academia? Publica tus clases aquí." sectionType="clases" idx={idx} />
                            </motion.div>
                          );
                        }
                        return (
                          <ClaseItem key={`${item.ownerType || 'owner'}-${item.ownerId ?? 'unknown'}-${item.titulo ?? 'class'}-${item.fecha ?? (Array.isArray(item.diasSemana) ? item.diasSemana.join('-') : 'semana')}-${idx}`} clase={item} idx={idx} handlePreNavigate={handlePreNavigate} />
                        );
                      }}
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
                        {(academiasLoadMore.isFetching || maestrosLoadMore.isFetching) ? 'Cargando...' : 'Cargar más clases'}
                      </button>
                    )}
                  </>
                );
              })()}
            </Section>
          )}

          {(showAll || selectedType === 'academias') && (academiasLoading || hasAcademias) && (
            <Section title="Las mejores academias de tu zona" toAll="/explore/list?type=academias">
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
                      {academiasLoadMore.isFetching ? 'Cargando...' : 'Cargar más academias'}
                    </button>
              )}
            </Section>
          )}

          {(showAll || selectedType === 'maestros') && (maestrosLoading || hasMaestros) && (
            <Section title="Maestros destacados" toAll="/explore/list?type=teacher">
              {maestrosLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
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
                            <CTACard text="¿Eres maestro? Comparte tus clases y muestra tu trayectoria." sectionType="maestros" idx={idx} />
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
                      {maestrosLoadMore.isFetching ? 'Cargando...' : 'Cargar más maestros'}
                    </button>
                  )}
                </>
              )}
            </Section>
          )}

          {(showAll || selectedType === 'usuarios') && (usuariosLoading || hasUsuarios) && (
            <Section title={`Parejas de baile cerca de ti${validUsuarios.length ? ` · ${validUsuarios.length}` : ''}`} toAll="/explore/list?type=usuarios">
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
                          Cargando más usuarios...
                        </div>
                      )}
                    </>
                  ) : null}
                </>
              )}
            </Section>
          )}

          {(showAll || selectedType === 'organizadores') && (organizadoresLoading || organizadoresData.length > 0) && (
            <Section title="Productores de eventos" toAll="/explore/list?type=organizadores">
              {organizadoresLoading ? (
                <div className="cards-grid">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="card-skeleton">
                      Cargando…
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
                            <CTACard text="¿Organizas eventos? Publícalos aquí y recibe más asistentes." sectionType="organizadores" idx={idx} />
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
                      {organizadoresLoadMore.isFetching ? 'Cargando...' : 'Cargar más organizadores'}
                    </button>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
              )}
            </Section>
          )}

          {(showAll || selectedType === 'marcas') && (marcasLoading || hasMarcas) && (
            <Section title="Marcas especializadas en baile" toAll="/explore/list?type=marcas">
              {marcasLoading ? (
                <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
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
                            <CTACard text="¿Tienes una marca de baile? Llega a más bailarines desde aquí." sectionType="marcas" idx={idx} />
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
                      {marcasLoadMore.isFetching ? 'Cargando...' : 'Cargar más marcas'}
                    </button>
                  )}
                </>
              )}
            </Section>
          )}

          {/* Sección Comparte */}
          <Section title="Comparte" toAll="">
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
                      Comparte Dónde Bailar
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
                      Escanea el código QR y comparte la app con tus amigos bailarines
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
                    ¡Únete a la comunidad de bailarines!
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
                No encontramos resultados con estos filtros
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.85 }}>
                Intenta ajustar los filtros o cambiar de zona/ritmo.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
