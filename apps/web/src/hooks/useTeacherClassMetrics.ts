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
  totalAttended: number;
  totalPagados: number;
  porRol: RolCounts;
};

type GlobalMetrics = {
  totalTentativos: number;
  totalAttended: number;
  totalPagados: number;
  porRol: RolCounts;
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
      const { data, error } = await supabase.rpc("get_teacher_class_metrics", {
        p_teacher_id: teacherId!,
      });

      if (error) throw error;

      const emptyRoles: RolCounts = { leader: 0, follower: 0, ambos: 0, otros: 0 };
      const global: GlobalMetrics = {
        totalTentativos: 0,
        totalAttended: 0,
        totalPagados: 0,
        porRol: { ...emptyRoles },
      };

      const porClase: ClaseMetric[] = (data ?? []).map((row: any) => {
        const porRol = row.por_rol || {};
        const totalTentativos = Number(row.total_tentativos) || 0;
        const totalAttended = Number(row.total_attended) || 0;
        const totalPagados = Number(row.total_pagados) || 0;

        global.totalTentativos += totalTentativos;
        global.totalAttended += totalAttended;
        global.totalPagados += totalPagados;
        global.porRol.leader += Number(porRol.leader) || 0;
        global.porRol.follower += Number(porRol.follower) || 0;
        global.porRol.ambos += Number(porRol.ambos) || 0;
        global.porRol.otros += Number(porRol.otros) || 0;

        return {
          class_id: Number(row.class_id) || 0,
          nombre: row.nombre_clase || `Clase #${row.class_id}`,
          fecha: row.fecha_clase || null,
          precio: row.precio_clase !== null && row.precio_clase !== undefined ? Number(row.precio_clase) : null,
          totalTentativos,
          totalAttended,
          totalPagados,
          porRol: {
            leader: Number(porRol.leader) || 0,
            follower: Number(porRol.follower) || 0,
            ambos: Number(porRol.ambos) || 0,
            otros: Number(porRol.otros) || 0,
          },
        };
      });

      porClase.sort(
        (a, b) =>
          b.totalAttended + b.totalTentativos + b.totalPagados - (a.totalAttended + a.totalTentativos + a.totalPagados),
      );

      return { global, porClase };
    },
    refetchInterval: 5000,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    global: query.data?.global || null,
    porClase: query.data?.porClase || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

