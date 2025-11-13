import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type RolCounts = {
  leader: number;
  follower: number;
  ambos: number;
  otros: number;
};

type ZonaCount = {
  zona_tag_id: number | null;
  zona_nombre: string;
  count: number;
};

type ClaseMetric = {
  class_id: number;
  nombre: string;
  fecha: string | null;
  totalTentativos: number;
  porRol: RolCounts;
};

type GlobalMetrics = {
  totalTentativos: number;
  porRol: RolCounts;
};

export function useAcademyClassMetrics(academyId?: number) {
  const query = useQuery({
    queryKey: ["academy-class-metrics", academyId],
    enabled: !!academyId,
    queryFn: async () => {
      console.log("[useAcademyClassMetrics] 🔍 Consultando métricas para academyId:", academyId);
      
      // Usar función RPC para obtener métricas agregadas (permite a academias ver sus métricas)
      const { data: metricsData, error: rpcError } = await supabase
        .rpc("get_academy_class_metrics", { p_academy_id: academyId! });
      
      console.log("[useAcademyClassMetrics] 📊 Resultado RPC:", { metricsData, rpcError });

      if (rpcError) {
        console.error("[useAcademyClassMetrics] ❌ Error en RPC:", rpcError);
        console.error("[useAcademyClassMetrics] Detalles del error RPC:", {
          code: rpcError.code,
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
        });
        
        // Si falla RPC, intentar consulta directa (solo para superadmins)
        console.log("[useAcademyClassMetrics] 🔄 Intentando consulta directa a clase_asistencias...");
        const { data, error: fetchError } = await supabase
          .from("clase_asistencias")
          .select(`
            class_id,
            status,
            role_baile,
            zona_tag_id
          `)
          .eq("academy_id", academyId!)
          .eq("status", "tentative");

        console.log("[useAcademyClassMetrics] 📊 Resultado consulta directa:", { data, fetchError });
        
        if (fetchError) {
          console.error("[useAcademyClassMetrics] ❌ Error en consulta directa:", fetchError);
          throw fetchError;
        }

        // Procesar datos directos
        const rolEmpty: RolCounts = { leader: 0, follower: 0, ambos: 0, otros: 0 };
        const g: GlobalMetrics = {
          totalTentativos: 0,
          porRol: { ...rolEmpty },
        };
        const mapPorClase = new Map<number, ClaseMetric>();

        (data ?? []).forEach((row: any) => {
          const classId = row.class_id as number;
          const rol = (row.role_baile ?? "otros") as keyof RolCounts;
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
            totalTentativos: 0,
            porRol: { ...rolEmpty },
          };

          base.totalTentativos += 1;
          if (normalizedRol in base.porRol) base.porRol[normalizedRol] += 1;
          else base.porRol.otros += 1;

          mapPorClase.set(classId, base);
        });

        return {
          global: g,
          porClase: Array.from(mapPorClase.values()).sort((a, b) => b.totalTentativos - a.totalTentativos),
        };
      }

      // Procesar datos de RPC
      if (!metricsData || metricsData.length === 0) {
        console.log("[useAcademyClassMetrics] ⚠️ No hay datos de métricas (array vacío o null)");
        // Verificar si hay registros en la tabla directamente
        const { count } = await supabase
          .from("clase_asistencias")
          .select("*", { count: "exact", head: true })
          .eq("academy_id", academyId!)
          .eq("status", "tentative");
        console.log("[useAcademyClassMetrics] 📊 Total de registros en clase_asistencias para academyId:", count);
        
        return {
          global: { totalTentativos: 0, porRol: { leader: 0, follower: 0, ambos: 0, otros: 0 } },
          porClase: [],
        };
      }
      
      console.log("[useAcademyClassMetrics] ✅ Procesando", metricsData.length, "registros de métricas");

      const rolEmpty: RolCounts = { leader: 0, follower: 0, ambos: 0, otros: 0 };
      const g: GlobalMetrics = {
        totalTentativos: 0,
        porRol: { ...rolEmpty },
      };
      const mapPorClase = new Map<number, ClaseMetric>();

      metricsData.forEach((row: any) => {
        const classId = row.class_id as number;
        const total = Number(row.total_tentativos) || 0;
        const porRol = row.por_rol || {};

        g.totalTentativos += total;
        g.porRol.leader += Number(porRol.leader) || 0;
        g.porRol.follower += Number(porRol.follower) || 0;
        g.porRol.ambos += Number(porRol.ambos) || 0;
        g.porRol.otros += Number(porRol.otros) || 0;

        mapPorClase.set(classId, {
          class_id: classId,
          nombre: `Clase #${classId}`,
          fecha: null,
          totalTentativos: total,
          porRol: {
            leader: Number(porRol.leader) || 0,
            follower: Number(porRol.follower) || 0,
            ambos: Number(porRol.ambos) || 0,
            otros: Number(porRol.otros) || 0,
          },
        });
      });

      return {
        global: g,
        porClase: Array.from(mapPorClase.values()).sort((a, b) => b.totalTentativos - a.totalTentativos),
      };
    },
    refetchInterval: 10000, // Refrescar cada 10 segundos
  });

  return {
    global: query.data?.global || null,
    porClase: query.data?.porClase || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

