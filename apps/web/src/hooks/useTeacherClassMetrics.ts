import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type RolCounts = {
  leader: number;
  follower: number;
  ambos: number;
  otros: number;
};

type ClaseMetric = {
  class_id: number;
  nombre: string;
  fecha: string | null;
  precio: number | null;
  totalTentativos: number;
  porRol: RolCounts;
  totalPagados: number;
};

type GlobalMetrics = {
  totalTentativos: number;
  porRol: RolCounts;
  totalPagados: number;
};

type TeacherClassMetricsResult = {
  global: GlobalMetrics;
  porClase: ClaseMetric[];
};

export function useTeacherClassMetrics(teacherId?: number) {
  const query = useQuery<TeacherClassMetricsResult>({
    queryKey: ["teacher-class-metrics", teacherId],
    enabled: !!teacherId,
    queryFn: async () => {
      console.log("[useTeacherClassMetrics] 🔍 Consultando métricas para teacherId:", teacherId);
      
      // Usar función RPC para obtener métricas agregadas
      const { data: metricsData, error: rpcError } = await supabase
        .rpc("get_teacher_class_metrics", { p_teacher_id: teacherId! });
      
      console.log("[useTeacherClassMetrics] 📊 Resultado RPC:", { metricsData, rpcError });

      if (rpcError) {
        console.error("[useTeacherClassMetrics] ❌ Error en RPC:", rpcError);
        console.error("[useTeacherClassMetrics] Detalles del error RPC:", {
          code: rpcError.code,
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
        });
        
        // Si falla RPC, intentar consulta directa (solo para superadmins)
        console.log("[useTeacherClassMetrics] 🔄 Intentando consulta directa a clase_asistencias...");
        const { data, error: fetchError } = await supabase
          .from("clase_asistencias")
          .select(`
            class_id,
            status,
            role_baile,
            zona_tag_id
          `)
          .eq("teacher_id", teacherId!)
          .eq("status", "tentative");

        console.log("[useTeacherClassMetrics] 📊 Resultado consulta directa:", { data, fetchError });
        
        if (fetchError) {
          console.error("[useTeacherClassMetrics] ❌ Error en consulta directa:", fetchError);
          throw fetchError;
        }

        // Procesar datos directos
        const rolEmpty: RolCounts = { leader: 0, follower: 0, ambos: 0, otros: 0 };
        const g: GlobalMetrics = {
          totalTentativos: 0,
          porRol: { ...rolEmpty },
          totalPagados: 0,
        };
        const mapPorClase = new Map<number, ClaseMetric>();

        (data ?? []).forEach((row: any) => {
          const classId = row.class_id as number;
          const rol = (row.role_baile ?? "otros") as string;
          let normalizedRol: keyof RolCounts = "otros";
          if (rol === "lead" || rol === "leader") normalizedRol = "leader";
          else if (rol === "follow" || rol === "follower") normalizedRol = "follower";
          else if (rol === "ambos") normalizedRol = "ambos";
          else normalizedRol = "otros";

          g.totalTentativos += 1;
          if (normalizedRol in g.porRol) g.porRol[normalizedRol] += 1;
          else g.porRol.otros += 1;

          const base = mapPorClase.get(classId) ?? {
            class_id: classId,
            nombre: `Clase #${classId}`,
            fecha: null,
            precio: null,
            totalTentativos: 0,
            porRol: { ...rolEmpty },
            totalPagados: 0,
          };

          base.totalTentativos += 1;
          if (normalizedRol in base.porRol) base.porRol[normalizedRol] += 1;
          else base.porRol.otros += 1;

          mapPorClase.set(classId, base);
        });

        // Métricas de compras (status = 'pagado')
        try {
          const { data: purchaseRows, error: purchaseError } = await supabase
            .from("clase_asistencias")
            .select("class_id")
            .eq("teacher_id", teacherId!)
            .eq("status", "pagado");

          if (purchaseError) {
            console.error("[useTeacherClassMetrics] ❌ Error obteniendo compras (fallback):", purchaseError);
          } else {
            const mapPagosPorClase = new Map<number, number>();
            (purchaseRows ?? []).forEach((row: any) => {
              const classId = row.class_id as number;
              if (!classId) return;
              g.totalPagados += 1;
              mapPagosPorClase.set(classId, (mapPagosPorClase.get(classId) || 0) + 1);
            });

            mapPorClase.forEach((metric) => {
              metric.totalPagados = mapPagosPorClase.get(metric.class_id) || 0;
            });
          }
        } catch (purchaseErr) {
          console.error("[useTeacherClassMetrics] ❌ Excepción obteniendo compras (fallback):", purchaseErr);
        }

        return {
          global: g,
          porClase: Array.from(mapPorClase.values()).sort((a, b) => b.totalTentativos - a.totalTentativos),
        };
      }

      // Procesar datos de RPC
      if (!metricsData || metricsData.length === 0) {
        console.log("[useTeacherClassMetrics] ⚠️ No hay datos de métricas (array vacío o null)");
        // Verificar si hay registros en la tabla directamente
        const { count } = await supabase
          .from("clase_asistencias")
          .select("*", { count: "exact", head: true })
          .eq("teacher_id", teacherId!)
          .eq("status", "tentative");
        console.log("[useTeacherClassMetrics] 📊 Total de registros en clase_asistencias para teacherId:", count);
        
        return {
          global: { totalTentativos: 0, porRol: { leader: 0, follower: 0, ambos: 0, otros: 0 }, totalPagados: 0 },
          porClase: [],
        };
      }
      
      console.log("[useTeacherClassMetrics] ✅ Procesando", metricsData.length, "registros de métricas");
      console.log("[useTeacherClassMetrics] 🔍 ========== DEBUG DATOS RPC ==========");
      console.log("[useTeacherClassMetrics] 🔍 Datos completos de RPC:", JSON.stringify(metricsData, null, 2));
      metricsData.forEach((row: any, idx: number) => {
        console.log(`[useTeacherClassMetrics] 🔍 Registro ${idx}:`, {
          class_id: row.class_id,
          total_tentativos: row.total_tentativos,
          nombre_clase: row.nombre_clase,
          fecha_clase: row.fecha_clase,
          precio_clase: row.precio_clase,
          por_rol: row.por_rol,
        });
      });
      console.log("[useTeacherClassMetrics] 🔍 ========== FIN DEBUG DATOS RPC ==========");

      const rolEmpty: RolCounts = { leader: 0, follower: 0, ambos: 0, otros: 0 };
      const g: GlobalMetrics = {
        totalTentativos: 0,
        porRol: { ...rolEmpty },
        totalPagados: 0,
      };
      const mapPorClase = new Map<number, ClaseMetric>();

      metricsData.forEach((row: any) => {
        const classId = row.class_id as number;
        const total = Number(row.total_tentativos) || 0;
        const porRol = row.por_rol || {};
        const nombreClase = row.nombre_clase || `Clase #${classId}`;
        const fechaClase = row.fecha_clase || null;
        const precioClase = row.precio_clase !== null && row.precio_clase !== undefined ? Number(row.precio_clase) : null;
        
        console.log(`[useTeacherClassMetrics] 🔍 Procesando clase ${classId}:`, {
          nombreClase,
          fechaClase,
          precioClase,
          total,
          porRol,
        });

        g.totalTentativos += total;
        g.porRol.leader += Number(porRol.leader) || 0;
        g.porRol.follower += Number(porRol.follower) || 0;
        g.porRol.ambos += Number(porRol.ambos) || 0;
        g.porRol.otros += Number(porRol.otros) || 0;

        mapPorClase.set(classId, {
          class_id: classId,
          nombre: nombreClase,
          fecha: fechaClase,
          precio: precioClase,
          totalTentativos: total,
          porRol: {
            leader: Number(porRol.leader) || 0,
            follower: Number(porRol.follower) || 0,
            ambos: Number(porRol.ambos) || 0,
            otros: Number(porRol.otros) || 0,
          },
          totalPagados: 0,
        });
      });

      // Métricas de compras (status = 'pagado')
      try {
        const { data: purchaseRows, error: purchaseError } = await supabase
          .from("clase_asistencias")
          .select("class_id")
          .eq("teacher_id", teacherId!)
          .eq("status", "pagado");

        if (purchaseError) {
          console.error("[useTeacherClassMetrics] ❌ Error obteniendo compras:", purchaseError);
        } else {
          const mapPagosPorClase = new Map<number, number>();
          (purchaseRows ?? []).forEach((row: any) => {
            const classId = row.class_id as number;
            if (!classId) return;
            g.totalPagados += 1;
            mapPagosPorClase.set(classId, (mapPagosPorClase.get(classId) || 0) + 1);
          });

          mapPorClase.forEach((metric) => {
            metric.totalPagados = mapPagosPorClase.get(metric.class_id) || 0;
          });
        }
      } catch (purchaseErr) {
        console.error("[useTeacherClassMetrics] ❌ Excepción obteniendo compras:", purchaseErr);
      }

      return {
        global: g,
        porClase: Array.from(mapPorClase.values()).sort((a, b) => b.totalTentativos - a.totalTentativos),
      };
    },
    refetchInterval: 3000, // Refrescar cada 3 segundos
    staleTime: 0, // Los datos se consideran obsoletos inmediatamente
    gcTime: 0, // No cachear los datos
  });

  return {
    global: query.data?.global || null,
    porClase: query.data?.porClase || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

