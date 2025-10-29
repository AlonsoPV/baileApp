export type ProfileVM = {
  id: string;
  tipo: 'academy' | 'teacher';
  nombre_publico: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  redes?: {
    instagram?: string | null;
    tiktok?: string | null;
    youtube?: string | null;
    facebook?: string | null;
    whatsapp?: string | null;
  };
  ubicacion?: { texto?: string | null; zonaIds?: number[] };
  ritmos?: number[];
  clases?: Array<{
    id: string;
    titulo: string;
    fecha?: string | null;
    inicio?: string | null;
    fin?: string | null;
    nivel?: string | null;
    ubicacion?: string | null;
    costo?: { label: string; precio?: number | null; tipo?: string } | undefined;
    flyer_url?: string | null;
  }>;
  media?: Array<{ type: 'image' | 'video'; url: string }>;
};

export function mapTeacherToVM(teacher: any, clases: any[] = [], media: any[] = []): ProfileVM {
  const redes = teacher?.redes_sociales || teacher?.redes || teacher?.respuestas?.redes || {};
  const ritmos: number[] = teacher?.ritmos || [];
  const zonas: number[] = teacher?.zonas || [];

  const cronograma = Array.isArray(teacher?.cronograma) ? teacher.cronograma : clases;
  const costos = Array.isArray(teacher?.costos) ? teacher.costos : [];

  const costoIndex = new Map<string, any[]>();
  costos.forEach((c: any) => {
    const key = String(c?.nombre || '').trim().toLowerCase();
    if (!key) return;
    if (!costoIndex.has(key)) costoIndex.set(key, []);
    costoIndex.get(key)!.push(c);
  });

  const vmClases = (cronograma || []).map((c: any) => {
    const ref = String(c?.referenciaCosto || c?.titulo || '').trim().toLowerCase();
    const matched = ref ? (costoIndex.get(ref) ?? []) : [];
    const costo = matched?.length
      ? { label: matched[0]?.tipo || 'Precio', precio: matched[0]?.precio ?? null, tipo: matched[0]?.tipo }
      : (c?.precio != null ? { label: 'Precio', precio: c.precio } : undefined);

    return {
      id: String(c?.id ?? c?.event_date_id ?? c?.uuid ?? `${c?.titulo || 'clase'}`),
      titulo: c?.titulo ?? c?.nombre ?? 'Clase',
      fecha: c?.fecha ?? c?.evento_fecha ?? null,
      inicio: c?.inicio ?? c?.hora_inicio ?? null,
      fin: c?.fin ?? c?.hora_fin ?? null,
      nivel: c?.nivel ?? null,
      ubicacion: c?.ubicacion ?? c?.lugar ?? null,
      costo,
      flyer_url: c?.flyer_url ?? c?.flyer ?? null,
    };
  });

  const vmMedia = (Array.isArray(teacher?.media) ? teacher.media : media || [])
    .map((m: any) => {
      const url = m?.url || m;
      if (!url) return null;
      const isVideo = /\.(mp4|mov|webm)$/i.test(url) || m?.type === 'video';
      return { type: isVideo ? 'video' as const : 'image' as const, url };
    })
    .filter(Boolean) as Array<{ type: 'image' | 'video'; url: string }>;

  return {
    id: String(teacher?.id || ''),
    tipo: 'teacher',
    nombre_publico: teacher?.nombre_publico ?? teacher?.display_name ?? 'Maestro',
    bio: teacher?.bio ?? teacher?.biografia ?? '',
    avatar_url: teacher?.avatar_url ?? teacher?.portada_url ?? '',
    banner_url: teacher?.banner_url ?? teacher?.portada_url ?? '',
    redes,
    ubicacion: {
      texto: teacher?.ubicacion_texto ?? teacher?.ciudad ?? teacher?.ubicaciones?.[0]?.nombre ?? null,
      zonaIds: zonas,
    },
    ritmos,
    clases: vmClases,
    media: vmMedia,
  };
}


