import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { useTags } from "../../../hooks/useTags";
import { supabase } from "../../../lib/supabase";
import { RITMOS_CATALOG } from "../../../lib/ritmosCatalog";
// no se usa urls.userLive, pedimos navegar a /app/profile con query

type DancerItem = {
  id?: string;
  display_name?: string;
  bio?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  portada_url?: string | null;
  media?: Array<{ url?: string; path?: string; slot?: string } | string>;
  ritmos?: number[];
  ritmosSeleccionados?: string[]; // por catálogo
  zonas?: number[];
};

interface Props {
  item: DancerItem;
  to?: string; // ruta opcional; si no existe ruta pública, usa '#'
}

export default function DancerCard({ item, to }: Props) {
  const { data: allTags } = useTags() as any;

  const normalizeUrl = (u?: string) => {
    if (!u) return u;
    const v = String(u).trim();
    if (/^https?:\/\//i.test(v) || v.startsWith('/')) return v;
    if (/^\d+x\d+(\/.*)?$/i.test(v)) return `https://via.placeholder.com/${v}`;
    if (/^[0-9A-Fa-f]{6}(\/|\?).*/.test(v)) return `https://via.placeholder.com/800x400/${v}`;
    return v;
  };

  // Convierte rutas tipo "bucket/path/to/file" a URL pública de Supabase
  const toSupabasePublicUrl = (maybePath?: string): string | undefined => {
    if (!maybePath) return undefined;
    const v = String(maybePath).trim();
    if (/^https?:\/\//i.test(v) || v.startsWith('data:') || v.startsWith('/')) return v;
    const slash = v.indexOf('/');
    if (slash > 0) {
      const bucket = v.slice(0, slash);
      const path = v.slice(slash + 1);
      try {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl || v;
      } catch {
        return v;
      }
    }
    return v;
  };

  // Resolver imagen de portada del usuario (prioriza banner/portada, luego avatar, luego media[0])
  const coverUrl: string | undefined = (() => {
    const direct = item.banner_url || item.portada_url || item.avatar_url;
    if (direct) return toSupabasePublicUrl(normalizeUrl(direct as string) as string);
    const media = Array.isArray(item.media) ? item.media : [];
    if (media.length) {
      const bySlot: any = media.find((m: any) => m?.slot === 'cover' || m?.slot === 'p1' || m?.slot === 'avatar');
      if (bySlot?.url) return toSupabasePublicUrl(normalizeUrl(bySlot.url as string) as string);
      if (bySlot?.path) return toSupabasePublicUrl(normalizeUrl(bySlot.path as string) as string);
      const first = media[0] as any;
      return toSupabasePublicUrl(normalizeUrl(first?.url || first?.path || (typeof first === 'string' ? first : undefined)) as string | undefined);
    }
    return undefined;
  })();

  const name = item.display_name || "Dancer";
  const bio = item.bio || "";

  // Tags de ritmos via ids numéricos o catálogo seleccionado
  const ritmoNames: string[] = React.useMemo(() => {
    try {
      const fromCatalog = (item.ritmosSeleccionados || []) as string[];
      if (Array.isArray(fromCatalog) && fromCatalog.length > 0) {
        const mapSlugToLabel = new Map<string, string>();
        RITMOS_CATALOG.forEach(group =>
          group.items.forEach(entry => mapSlugToLabel.set(entry.id, entry.label))
        );
        return fromCatalog
          .map((slug) => mapSlugToLabel.get(slug) || slug)
          .filter(Boolean) as string[];
      }
      const fromNums = (item.ritmos || []) as number[];
      if (Array.isArray(allTags) && fromNums.length > 0) {
        return fromNums
          .map((id: number) => allTags.find((t: any) => t.id === id && t.tipo === 'ritmo'))
          .filter(Boolean)
          .map((t: any) => t.nombre as string);
      }
    } catch {}
    return [] as string[];
  }, [item, allTags]);

  const zonaNames: string[] = React.useMemo(() => {
    try {
      const ids: number[] = (item.zonas || []) as number[];
      if (Array.isArray(allTags) && ids.length > 0) {
        return ids
          .map((id: number) => allTags.find((t: any) => t.id === id && t.tipo === 'zona'))
          .filter(Boolean)
          .map((t: any) => t.nombre as string);
      }
    } catch {}
    return [] as string[];
  }, [item, allTags]);

  const href = to || (item.id ? `/u/${encodeURIComponent(String(item.id))}` : '#');

  return (
    <LiveLink to={href} asCard={false}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        style={{
          position: 'relative',
          borderRadius: '1.25rem',
          background: coverUrl
            ? `url(${coverUrl})`
            : 'linear-gradient(135deg, rgba(40, 30, 45, 0.95), rgba(30, 20, 40, 0.95))',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          padding: '1.5rem',
          cursor: 'pointer',
          overflow: 'hidden',
          border: '1px solid rgba(240, 147, 251, 0.2)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(240, 147, 251, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '280px',
          height: '350px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)', opacity: 0.9 }} />
        {!coverUrl && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.80) 100%)', zIndex: 0, pointerEvents: 'none' }} />
        )}

        {/* Contenido */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: '1.375rem', fontWeight: 700, letterSpacing: 0.2, marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.3
          }}>
            <span style={{
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: '#fff',
              textShadow: 'rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px'
            }}>
              {name}
            </span>
          </div>

          {bio && (
            <div style={{ fontSize: 12, marginBottom: 10, color: 'rgba(255,255,255,0.78)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
              {bio}
            </div>
          )}

          {(ritmoNames.length > 0 || zonaNames.length > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {ritmoNames.slice(0, 3).map((r, i) => (
                <span key={`r-${i}`} style={{ border: '1px solid rgb(255 255 255 / 48%)', background: 'rgb(25 25 25 / 89%)', padding: 8, borderRadius: 999, fontSize: 12, color: 'rgba(255,255,255,0.92)' }}>
                  🎵 {r}
                </span>
              ))}
              {zonaNames.slice(0, 2).map((z, i) => (
                <span key={`z-${i}`} style={{ border: '1px solid rgb(255 255 255 / 48%)', background: 'rgb(25 25 25 / 89%)', padding: 8, borderRadius: 999, fontSize: 12, color: 'rgba(255,255,255,0.92)' }}>
                  📍 {z}
                </span>
              ))}
            </div>
          )}
        </div>

        <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: -2, borderRadius: 18, boxShadow: '0 0 0 0px rgba(255,255,255,0)', transition: 'box-shadow .2s ease' }} className="card-focus-ring" />
      </motion.div>
    </LiveLink>
  );
}


