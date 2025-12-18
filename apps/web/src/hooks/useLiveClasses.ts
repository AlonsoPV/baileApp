import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Clase } from "@/types/classes";

/**
 * Convierte nombre de día en español a número (0=Dom, 1=Lun, ..., 6=Sáb)
 */
function dayNameToNumber(dayName: string): number | null {
  const normalized = dayName.toLowerCase().trim();
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
}

/**
 * Convierte un item del cronograma JSONB a uno o más objetos Clase
 */
function cronoItemToClases(
  item: any,
  index: number,
  academyId?: number,
  teacherId?: number,
  ubicaciones?: any[],
  costos?: any[] // Array de costos para buscar el precio por referenciaCosto
): Clase[] {
  const clases: Clase[] = [];
  const titulo = item.titulo || item.nombre || 'Clase';
  const inicio = item.inicio || item.hora_inicio || null;
  const fin = item.fin || item.hora_fin || null;
  const nivel = item.nivel || null;
  const ritmo = item.ritmo || item.ritmoId || item.ritmo_id || null;
  // Manejar ritmos: puede venir como ritmoIds (array) o ritmoId (número)
  const ritmos = item.ritmos_seleccionados || item.ritmoIds || (ritmo ? [ritmo] : null);
  const fecha = item.fecha || null;
  const descripcion = item.descripcion || null;
  const fechaModo = item.fechaModo || (fecha ? 'especifica' : (item.diaSemana !== null && item.diaSemana !== undefined ? 'semanal' : null));
  const horarioModo = item.horarioModo || (fechaModo === 'por_agendar' ? 'duracion' : (item.duracionHoras ? 'duracion' : 'especifica'));
  const duracionHoras = item.duracionHoras ?? null;
  
  // PRIORIDAD 1: Buscar costo directamente en el item del cronograma (más rápido y confiable)
  let costo: number | null = null;
  if (item.costo && typeof item.costo === 'object') {
    // Si el costo está embebido en el item, usarlo directamente
    const costoEmbebido = item.costo;
    if (typeof costoEmbebido.precio === 'number') {
      costo = Number(costoEmbebido.precio);
    }
  }
  
  // PRIORIDAD 2: Buscar en campos directos del item (compatibilidad)
  if (!costo) {
    costo = item.costo || item.precio || null;
    if (typeof costo === 'object' && costo !== null) {
      costo = (costo as any).precio || null;
    }
    if (typeof costo === 'number') {
      costo = Number(costo);
    } else {
      costo = null;
    }
  }
  
  // PRIORIDAD 3: Buscar en el array de costos (fallback para datos antiguos)
  if (!costo && costos && Array.isArray(costos)) {
    let costoItem: any = null;
    
    // 1. Buscar por ID de clase (más confiable - no cambia aunque cambie el nombre)
    if (item.id) {
      const classId = String(item.id);
      costoItem = costos.find((c: any) => {
        // Buscar por classId (campo dedicado)
        if (c?.classId && String(c.classId) === classId) return true;
        // Buscar por referenciaCosto que sea el ID (para compatibilidad)
        if (c?.referenciaCosto && String(c.referenciaCosto) === classId) return true;
        // También buscar si el nombre del costo es el ID (para compatibilidad con costos muy antiguos)
        return String(c?.nombre || '').trim() === classId;
      });
    }
    
    // 2. Buscar por índice del cronograma
    if (!costoItem && index !== null && index !== undefined) {
      costoItem = costos.find((c: any) => c?.cronogramaIndex === index);
    }
    
    // 3. Buscar por referenciaCosto o título (case-insensitive)
    if (!costoItem) {
      const referencia = item.referenciaCosto || item.titulo || item.nombre;
      if (referencia) {
        const refLower = String(referencia).trim().toLowerCase();
        costoItem = costos.find((c: any) => {
          const nombre = String(c?.nombre || '').trim().toLowerCase();
          const titulo = String(c?.titulo || '').trim().toLowerCase();
          return nombre === refLower || titulo === refLower;
        });
      }
    }
    
    if (costoItem && costoItem.precio !== null && costoItem.precio !== undefined) {
      costo = Number(costoItem.precio);
    }
  }
  
  // Obtener ubicación (puede venir del item o de la lista de ubicaciones)
  let ubicacion: string | null = null;
  let ubicacionJson: any = null;
  if (item.ubicacion) {
    if (typeof item.ubicacion === 'string') {
      ubicacion = item.ubicacion;
    } else {
      ubicacion = item.ubicacion.nombre || item.ubicacion.direccion || item.ubicacion.lugar || null;
      ubicacionJson = item.ubicacion;
    }
  } else if (ubicaciones && ubicaciones.length > 0) {
    const primeraUbicacion = ubicaciones[0];
    ubicacion = primeraUbicacion.nombre || primeraUbicacion.direccion || primeraUbicacion.lugar || null;
    ubicacionJson = primeraUbicacion;
  }

  // Usar el ID de la clase si está disponible, si no, generar uno basado en el índice
  // Esto permite que las clases tengan IDs únicos y persistentes
  const classId = (item.id && typeof item.id === 'number' && item.id > 0) 
    ? item.id 
    : (index * 1000);

  // Si tiene fechaModo 'por_agendar', crear clase sin fecha ni hora
  if (fechaModo === 'por_agendar') {
    clases.push({
      id: classId,
      titulo,
      nombre: titulo,
      descripcion,
      fechaModo: 'por_agendar',
      horarioModo,
      hora_inicio: null,
      hora_fin: null,
      inicio: null,
      fin: null,
      duracionHoras,
      nivel,
      ritmo: ritmo ? String(ritmo) : null,
      ritmos_seleccionados: ritmos,
      ubicacion,
      ubicacionJson,
      costo: costo ? Number(costo) : null,
      moneda: 'MXN',
      academia_id: academyId || null,
      maestro_id: teacherId || null,
      teacher_id: teacherId || null,
      cover_url: null,
      cronogramaIndex: index,
    });
  }
  // Si tiene fecha específica, crear una clase con esa fecha
  else if (fecha) {
    clases.push({
      id: classId, // Usar ID de la clase si existe, si no usar índice * 1000
      titulo,
      nombre: titulo,
      descripcion,
      fecha,
      fechaModo: fechaModo || 'especifica',
      horarioModo,
      hora_inicio: inicio,
      hora_fin: fin,
      inicio,
      fin,
      duracionHoras,
      nivel,
      ritmo: ritmo ? String(ritmo) : null,
      ritmos_seleccionados: ritmos,
      ubicacion,
      ubicacionJson,
      costo: costo ? Number(costo) : null,
      moneda: 'MXN',
      academia_id: academyId || null,
      maestro_id: teacherId || null,
      teacher_id: teacherId || null,
      cover_url: null,
      cronogramaIndex: index, // Preservar índice original del cronograma
    });
  }
  // Si tiene diasSemana (array de strings), crear una clase por cada día
  else if (item.diasSemana && Array.isArray(item.diasSemana)) {
    // Convertir todos los días a números para preservarlos
    const diasSemanaNumeros: number[] = [];
    item.diasSemana.forEach((diaStr: string) => {
      const diaNum = dayNameToNumber(diaStr);
      if (diaNum !== null) {
        diasSemanaNumeros.push(diaNum);
      }
    });
    
    item.diasSemana.forEach((diaStr: string, diaIdx: number) => {
      const diaNum = dayNameToNumber(diaStr);
      if (diaNum !== null) {
        // Si la clase tiene un ID único, usarlo; si no, generar uno basado en índice y día
        const dayClassId = (item.id && typeof item.id === 'number' && item.id > 0)
          ? item.id + diaIdx // Si tiene ID base, añadir el índice del día
          : (index * 1000 + diaIdx); // Si no, usar índice * 1000 + día
        clases.push({
          id: dayClassId,
          titulo,
          nombre: titulo,
          descripcion,
          dia_semana: diaNum,
          diaSemana: diaNum,
          // Preservar diasSemana original (como números) para que los componentes puedan usarlo
          diasSemana: diasSemanaNumeros.length > 0 ? diasSemanaNumeros : null,
          fechaModo: fechaModo || 'semanal',
          horarioModo,
          hora_inicio: inicio,
          hora_fin: fin,
          inicio,
          fin,
          duracionHoras,
          nivel,
          ritmo: ritmo ? String(ritmo) : null,
          ritmos_seleccionados: ritmos,
          ubicacion,
          ubicacionJson,
          costo: costo ? Number(costo) : null,
          moneda: 'MXN',
          academia_id: academyId || null,
          maestro_id: teacherId || null,
          teacher_id: teacherId || null,
          cover_url: null,
          cronogramaIndex: index, // Preservar índice original del cronograma
        });
      }
    });
  }
  // Si tiene diaSemana como número directo
  else if (typeof item.diaSemana === 'number' || typeof item.dia_semana === 'number') {
    const diaNum = item.diaSemana ?? item.dia_semana;
    clases.push({
      id: classId, // Usar ID de la clase si existe, si no usar índice * 1000
      titulo,
      nombre: titulo,
      descripcion,
      dia_semana: diaNum,
      diaSemana: diaNum,
      fechaModo: fechaModo || 'semanal',
      horarioModo,
      hora_inicio: inicio,
      hora_fin: fin,
      inicio,
      fin,
      duracionHoras,
      nivel,
      ritmo: ritmo ? String(ritmo) : null,
      ritmos_seleccionados: ritmos,
      ubicacion,
      ubicacionJson,
      costo: costo ? Number(costo) : null,
      moneda: 'MXN',
      academia_id: academyId || null,
      maestro_id: teacherId || null,
      teacher_id: teacherId || null,
      cover_url: null,
      cronogramaIndex: index, // Preservar índice original del cronograma
    });
  }

  return clases;
}

/**
 * Obtiene clases visibles de una academia/maestro desde cronograma JSONB.
 * Si pasas academyId o teacherId, filtra.
 */
export function useLiveClasses(opts?: { academyId?: number; teacherId?: number }) {
  return useQuery({
    queryKey: ["live-classes", opts?.academyId, opts?.teacherId],
    enabled: !!(opts?.academyId || opts?.teacherId),
    staleTime: 1000 * 60 * 2, // 2 minutos - clases cambian poco
    gcTime: 1000 * 60 * 10, // 10 minutos en cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async (): Promise<Clase[]> => {
      let cronograma: any[] = [];
      let ubicaciones: any[] = [];
      let error: any = null;

      if (opts?.academyId) {
        // Obtener desde profiles_academy o v_academies_public
        const { data: academyData, error: academyError } = await supabase
          .from("v_academies_public")
          .select("id, cronograma, ubicaciones")
          .eq("id", opts.academyId)
          .single();

        if (academyError) {
          // Si falla la vista, intentar directamente desde profiles_academy
          const { data: directData, error: directError } = await supabase
            .from("profiles_academy")
            .select("id, cronograma, ubicaciones")
            .eq("id", opts.academyId)
            .single();

          if (directError) {
            error = directError;
            console.error("[useLiveClasses] Error fetching academy:", directError);
          } else {
            cronograma = Array.isArray(directData?.cronograma) ? directData.cronograma : [];
            ubicaciones = Array.isArray(directData?.ubicaciones) ? directData.ubicaciones : [];
            console.log("[useLiveClasses] Academy cronograma from profiles_academy:", cronograma);
          }
        } else {
          cronograma = Array.isArray(academyData?.cronograma) ? academyData.cronograma : [];
          ubicaciones = Array.isArray(academyData?.ubicaciones) ? academyData.ubicaciones : [];
          console.log("[useLiveClasses] Academy cronograma from v_academies_public:", cronograma);
        }
      } else if (opts?.teacherId) {
        // Obtener desde profiles_teacher
        const { data: teacherData, error: teacherError } = await supabase
          .from("profiles_teacher")
          .select("id, cronograma, ubicaciones")
          .eq("id", opts.teacherId)
          .single();

        if (teacherError) {
          error = teacherError;
          console.error("[useLiveClasses] Error fetching teacher:", teacherError);
        } else {
          cronograma = Array.isArray(teacherData?.cronograma) ? teacherData.cronograma : [];
          ubicaciones = Array.isArray(teacherData?.ubicaciones) ? teacherData.ubicaciones : [];
          console.log("[useLiveClasses] Teacher cronograma:", cronograma);
        }
      }

      if (error) {
        console.error("[useLiveClasses] Error:", error);
        throw error;
      }

      // Convertir cada item del cronograma a objetos Clase
      const clases: Clase[] = [];
      // Obtener costos si están disponibles (para academias/teachers)
      let costos: any[] = [];
      if (opts?.academyId) {
        const { data: academyDataWithCostos } = await supabase
          .from("v_academies_public")
          .select("costos")
          .eq("id", opts.academyId)
          .single();
        if (academyDataWithCostos?.costos && Array.isArray(academyDataWithCostos.costos)) {
          costos = academyDataWithCostos.costos;
        } else {
          // Fallback a profiles_academy
          const { data: directDataWithCostos } = await supabase
            .from("profiles_academy")
            .select("costos")
            .eq("id", opts.academyId)
            .single();
          if (directDataWithCostos?.costos && Array.isArray(directDataWithCostos.costos)) {
            costos = directDataWithCostos.costos;
          }
        }
      } else if (opts?.teacherId) {
        const { data: teacherDataWithCostos } = await supabase
          .from("profiles_teacher")
          .select("costos")
          .eq("id", opts.teacherId)
          .single();
        if (teacherDataWithCostos?.costos && Array.isArray(teacherDataWithCostos.costos)) {
          costos = teacherDataWithCostos.costos;
        }
      }

      // Convertir cada item del cronograma a objetos Clase
      cronograma.forEach((item, index) => {
        const clasesFromItem = cronoItemToClases(
          item,
          index,
          opts?.academyId,
          opts?.teacherId,
          ubicaciones,
          costos
        );
        clases.push(...clasesFromItem);
      });

      console.log("[useLiveClasses] Mapped classes:", clases);
      return clases;
    },
  });
}

