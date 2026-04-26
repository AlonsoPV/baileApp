import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthProvider";
import { mapHistoryItem, type StudentHistoryItem } from "@/hooks/useAcademyStudents";

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
        ...mapHistoryItem(item),
        academyId: item.academy_id != null ? Number(item.academy_id) : null,
        academyName: item.academy_name ? String(item.academy_name) : null,
      }));
    },
  });
}
