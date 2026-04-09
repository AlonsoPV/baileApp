import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useMarkClassAttendanceAttended() {
  return useMutation({
    mutationFn: async (attendanceId: number) => {
      const { data, error } = await supabase.rpc("rpc_mark_class_attendance_attended", {
        p_attendance_id: attendanceId,
      });

      if (error) throw error;
      return data;
    },
  });
}
