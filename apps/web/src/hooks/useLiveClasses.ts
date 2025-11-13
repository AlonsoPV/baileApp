import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Clase } from "@/types/classes";

/**
 * Obtiene clases visibles de una academia/maestro (opcionalmente por owner).
 * Si pasas academyId o teacherId, filtra.
 */
export function useLiveClasses(opts?: { academyId?: number; teacherId?: number }) {
  return useQuery({
    queryKey: ["live-classes", opts?.academyId, opts?.teacherId],
    enabled: !!(opts?.academyId || opts?.teacherId),
    queryFn: async (): Promise<Clase[]> => {
      let data: any[] = [];
      let error: any = null;

      if (opts?.academyId) {
        // Obtener desde vista pública de academias
        const { data: academyData, error: academyError } = await supabase
          .from("v_academy_classes_public")
          .select("*")
          .eq("academy_id", opts.academyId)
          .order("dia_semana", { ascending: true })
          .order("hora_inicio", { ascending: true });

        if (academyError) {
          error = academyError;
        } else {
          data = (academyData || []).map((c: any) => ({
            id: c.id,
            titulo: c.nombre,
            nombre: c.nombre,
            descripcion: c.descripcion,
            dia_semana: c.dia_semana,
            hora_inicio: c.hora_inicio,
            hora_fin: c.hora_fin,
            costo: c.costo ? Number(c.costo) : null,
            moneda: "MXN",
            ubicacion: c.ubicacion?.nombre || c.ubicacion?.direccion || c.ubicacion?.lugar || null,
            ubicacionJson: c.ubicacion,
            nivel: c.nivel,
            ritmos_seleccionados: c.ritmos_seleccionados,
            academia_id: c.academy_id,
            cover_url: null, // Las vistas públicas no incluyen cover_url por ahora
          }));
        }
      } else if (opts?.teacherId) {
        // Obtener desde vista pública de maestros
        const { data: teacherData, error: teacherError } = await supabase
          .from("v_teacher_classes_public")
          .select("*")
          .eq("teacher_id", opts.teacherId)
          .order("dia_semana", { ascending: true })
          .order("hora_inicio", { ascending: true });

        if (teacherError) {
          error = teacherError;
        } else {
          data = (teacherData || []).map((c: any) => ({
            id: c.id,
            titulo: c.nombre,
            nombre: c.nombre,
            descripcion: c.descripcion,
            dia_semana: c.dia_semana,
            hora_inicio: c.hora_inicio,
            hora_fin: c.hora_fin,
            costo: c.costo ? Number(c.costo) : null,
            moneda: "MXN",
            ubicacion: c.ubicacion?.nombre || c.ubicacion?.direccion || c.ubicacion?.lugar || null,
            ubicacionJson: c.ubicacion,
            nivel: c.nivel,
            ritmos_seleccionados: c.ritmos_seleccionados,
            teacher_id: c.teacher_id,
            maestro_id: c.teacher_id,
            cover_url: null, // Las vistas públicas no incluyen cover_url por ahora
          }));
        }
      }

      if (error) {
        console.error("[useLiveClasses] Error:", error);
        throw error;
      }

      return data as Clase[];
    },
  });
}

