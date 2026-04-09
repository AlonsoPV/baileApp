import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthProvider";
import type { StudentHistoryItem } from "@/hooks/useAcademyStudents";

export type MyClassAttendanceItem = StudentHistoryItem & {
  academyId?: number | null;
  academyName?: string | null;
};

export function useMyClassAttendance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-class-attendance", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<MyClassAttendanceItem[]> => {
      const { data, error } = await supabase.rpc("rpc_get_my_class_attendance");
      if (error) throw error;

      const payload = (data ?? {}) as Record<string, any>;
      const history = Array.isArray(payload.history) ? payload.history : [];
      return history.map((item: any) => ({
        id: Number(item.id ?? 0),
        classId: Number(item.class_id ?? 0),
        className: String(item.class_name ?? "Clase"),
        sessionDate: item.session_date ? String(item.session_date) : null,
        hour: item.hora ? String(item.hora) : null,
        status: String(item.status ?? "unknown"),
        role: String(item.role ?? "otro"),
        zone: item.zone ? String(item.zone) : null,
        teacherId: item.teacher_id != null ? Number(item.teacher_id) : null,
        teacherName: item.teacher_name ? String(item.teacher_name) : null,
        createdAt: String(item.created_at),
        academyId: item.academy_id != null ? Number(item.academy_id) : null,
        academyName: item.academy_name ? String(item.academy_name) : null,
      }));
    },
  });
}
