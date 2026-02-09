import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useExploreFilters } from "../../state/exploreFilters";
import { useExploreQuery } from "../../hooks/useExploreQuery";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import FilterChips from "../../components/explore/FilterChips";
import InfiniteGrid from "../../components/explore/InfiniteGrid";
import EventCard from "../../components/explore/cards/EventCard";
import OrganizerCard from "../../components/explore/cards/OrganizerCard";
import TeacherCard from "../../components/explore/cards/TeacherCard";
import AcademyCard from "../../components/explore/cards/AcademyCard";
import BrandCard from "../../components/explore/cards/BrandCard";
import type { UseInfiniteQueryResult } from "@tanstack/react-query";
import SeoHead from "@/components/SeoHead";
import { useTags } from "../../hooks/useTags";
import { buildAvailableFilters } from "../../filters/buildAvailableFilters";
import { useToast } from "../../components/Toast";

type InfiniteData<T> = { pages: { data: T[]; count: number; nextPage?: number }[]; pageParams: number[] };

const colors = {
  dark: '#0b0d10',
  panel: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  light: '#F5F5F5',
  gray300: '#D1D5DB',
};

const typeLabels: Record<string, string> = {
  fechas: 'Sociales',
  clases: 'Clases',
  academias: 'Academias',
  maestros: 'Maestros',
  usuarios: 'Con quien bailar',
  marcas: 'Marcas',
};

const typeIcons: Record<string, string> = {
  fechas: '📆',
  clases: '🎓',
  academias: '🏫',
  maestros: '🎓',
  usuarios: '🧍',
  marcas: '🏷️',
};

export default function ExploreListScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, set } = useExploreFilters();
  const { showToast } = useToast();
  const currentLabel = typeLabels[filters.type] || 'Resultados';
  const seoTitle = `${currentLabel} | Dónde Bailar`;
  const seoDescription = `Explora ${currentLabel.toLowerCase()} de baile con filtros por ritmos, zonas y fechas en Dónde Bailar.`;
  
  // Update filters based on URL parameters
  React.useEffect(() => {
    const type = searchParams.get('type');
    const ritmosRaw = searchParams.get('ritmos');
    const zonasRaw = searchParams.get('zonas');
    const whenRaw = searchParams.get('when');
    const fromRaw = searchParams.get('from');
    const toRaw = searchParams.get('to');

    const parseCsv = (v: string | null) =>
      (v ? v.split(',') : [])
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n) && n > 0)
        .map((n) => Math.trunc(n));

    const nextPatch: any = {};
    if (type && type !== filters.type) nextPatch.type = type as any;
    if (ritmosRaw !== null) nextPatch.ritmos = parseCsv(ritmosRaw);
    if (zonasRaw !== null) nextPatch.zonas = parseCsv(zonasRaw);
    if (whenRaw) nextPatch.datePreset = whenRaw as any;
    if (fromRaw !== null) nextPatch.dateFrom = fromRaw || undefined;
    if (toRaw !== null) nextPatch.dateTo = toRaw || undefined;

    if (Object.keys(nextPatch).length > 0) set(nextPatch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync filtros -> URL (sin romper navegación)
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('type', filters.type);
    if ((filters.ritmos || []).length > 0) params.set('ritmos', filters.ritmos.join(','));
    else params.delete('ritmos');
    if ((filters.zonas || []).length > 0) params.set('zonas', filters.zonas.join(','));
    else params.delete('zonas');
    if (filters.datePreset) params.set('when', String(filters.datePreset));
    else params.delete('when');
    if (filters.dateFrom) params.set('from', filters.dateFrom);
    else params.delete('from');
    if (filters.dateTo) params.set('to', filters.dateTo);
    else params.delete('to');

    const next = params.toString();
    const curr = searchParams.toString();
    if (next !== curr) {
      setSearchParams(params, { replace: true });
    }
  }, [filters.type, filters.ritmos, filters.zonas, filters.datePreset, filters.dateFrom, filters.dateTo, searchParams, setSearchParams]);
  
  const query = useExploreQuery(filters);
  const typedQuery = query as unknown as UseInfiniteQueryResult<InfiniteData<any>, Error>;

  const { data: allTags } = useTags();
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

  const listItems = React.useMemo(() => {
    const pages = (query.data as any)?.pages || [];
    return pages.flatMap((p: any) => p?.data || []);
  }, [query.data]);

  const available = React.useMemo(
    () => buildAvailableFilters(listItems, { ritmoNameById, zonaNameById, ritmoIdBySlug, zonaIdBySlug }),
    [listItems, ritmoNameById, zonaNameById, ritmoIdBySlug, zonaIdBySlug],
  );

  const prevContextRef = React.useRef<string>('');
  const contextKey = React.useMemo(() => {
    const qKey = String(filters.q || '').trim().toLowerCase();
    return [
      filters.type,
      filters.datePreset ?? '',
      filters.dateFrom ?? '',
      filters.dateTo ?? '',
      qKey,
    ].join('|');
  }, [filters.type, filters.datePreset, filters.dateFrom, filters.dateTo, filters.q]);

  React.useEffect(() => {
    if (!prevContextRef.current) {
      prevContextRef.current = contextKey;
      return;
    }
    if (prevContextRef.current === contextKey) return;
    prevContextRef.current = contextKey;

    const nextRitmos = (filters.ritmos || []).filter((id) => available.ritmoIdSet.has(id));
    const nextZonas = (filters.zonas || []).filter((id) => available.zonaIdSet.has(id));
    const changed = nextRitmos.length !== (filters.ritmos || []).length || nextZonas.length !== (filters.zonas || []).length;
    if (!changed) return;
    set({ ritmos: nextRitmos, zonas: nextZonas });
    try {
      showToast?.('Filtros ajustados', 'info');
    } catch {
      // ignore
    }
  }, [contextKey, available.ritmoIdSet, available.zonaIdSet, filters.ritmos, filters.zonas, set, showToast]);

  const totalCount = query.data?.pages[0]?.count || 0;

  const renderItem = (item: any, i: number) => {
    let CardComponent;
    let key;

    switch (filters.type) {
      case "fechas":
        CardComponent = EventCard;
        key = item.id ?? i;
        break;
      case "organizadores":
        CardComponent = OrganizerCard;
        key = item.id ?? i;
        break;
      case "maestros":
        CardComponent = TeacherCard;
        key = item.id ?? i;
        break;
      case "academias":
        CardComponent = AcademyCard;
        key = item.id ?? i;
        break;
      case "marcas":
        CardComponent = BrandCard;
        key = item.id ?? i;
        break;
      case "sociales":
        CardComponent = OrganizerCard; // Reutilizar OrganizerCard para sociales
        key = item.id ?? i;
        break;
      case "usuarios":
        CardComponent = TeacherCard; // Reutilizar TeacherCard para usuarios
        key = item.user_id ?? i;
        break;
      default:
        CardComponent = EventCard;
        key = item.id ?? i;
    }

    return <CardComponent key={key} item={item} />;
  };

  return (
    <>
      <SeoHead section="explore-list" title={seoTitle} description={seoDescription} />
      <div style={{
      minHeight: '100vh',
      background: colors.dark,
      color: colors.light,
      paddingBottom: '2rem'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.5rem 0' }}>
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/', icon: '🏠' },
            { label: 'Explorar', href: '/explore', icon: '🔍' },
            { label: typeLabels[filters.type] || 'Resultados', icon: typeIcons[filters.type] || '📋' },
          ]}
        />
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {typeIcons[filters.type]} {typeLabels[filters.type]}
          </h1>
          <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>{query.isLoading ? 'Cargando...' : `${totalCount} resultados encontrados`}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: '1.5rem' }}>
          <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 16, padding: '0.75rem 1rem' }}>
            <FilterChips availableRitmos={available.ritmos} availableZonas={available.zonas} />
          </div>
        </motion.div>

        {query.isLoading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: colors.gray300 }}>Cargando resultados…</div>
        )}

        {!query.isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <InfiniteGrid query={typedQuery} renderItem={renderItem} emptyText="No se encontraron resultados. Intenta ajustar los filtros." />
          </motion.div>
        )}
      </div>
      </div>
    </>
  );
}
