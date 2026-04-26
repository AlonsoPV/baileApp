import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type ClaseAsistenciaPaymentType = "class" | "package" | "other";

export type ClaseAsistenciaFlagsScope = {
  academyId?: string | number;
  teacherId?: string | number;
};

function normalizeFlagsScope(
  input: string | number | ClaseAsistenciaFlagsScope | undefined,
): ClaseAsistenciaFlagsScope {
  if (input == null) return {};
  if (typeof input === "object" && !Array.isArray(input)) {
    return {
      academyId: input.academyId != null ? Number(input.academyId) : undefined,
      teacherId: input.teacherId != null ? Number(input.teacherId) : undefined,
    };
  }
  return { academyId: Number(input) };
}

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

type UpdateFlags = {
  attendanceId: string | number;
  attended: boolean;
  paid: boolean;
  paymentType: ClaseAsistenciaPaymentType | null;
};

function invalidateAfterFlags(
  queryClient: ReturnType<typeof useQueryClient>,
  scope: ClaseAsistenciaFlagsScope,
) {
  if (scope.academyId != null) {
    const a = scope.academyId;
    void queryClient.invalidateQueries({ queryKey: ["academy-metrics", a] });
    void queryClient.invalidateQueries({ queryKey: ["academy-students-global", a] });
    void queryClient.invalidateQueries({ queryKey: ["academy-students-list", a] });
    void queryClient.invalidateQueries({ queryKey: ["academy-student-detail", a] });
  }
  if (scope.teacherId != null) {
    const t = scope.teacherId;
    void queryClient.invalidateQueries({ queryKey: ["teacher-students-global", t] });
    void queryClient.invalidateQueries({ queryKey: ["teacher-students-list", t] });
    void queryClient.invalidateQueries({ queryKey: ["teacher-student-detail", t] });
    void queryClient.invalidateQueries({ queryKey: ["teacher-class-metrics", t] });
  }
  if (scope.academyId == null && scope.teacherId == null) {
    void queryClient.invalidateQueries({ queryKey: ["academy-metrics"] });
  }
}

export function useUpdateClaseAsistenciaFlags(
  input: string | number | ClaseAsistenciaFlagsScope | undefined,
) {
  const queryClient = useQueryClient();
  const scope = normalizeFlagsScope(input);
  return useMutation({
    mutationFn: async ({ attendanceId, attended, paid, paymentType }: UpdateFlags) => {
      const id = typeof attendanceId === "string" ? Number(attendanceId) : attendanceId;
      if (!id || isNaN(id)) throw new Error("ID de asistencia no válido");

      const pPaymentType = paid
        ? paymentType && ["class", "package", "other"].includes(paymentType)
          ? paymentType
          : "class"
        : null;

      const { data, error } = await supabase.rpc("rpc_update_clase_asistencia_flags", {
        p_id: id,
        p_attended: attended,
        p_paid: paid,
        p_payment_type: pPaymentType,
      });

      if (error) throw error;
      return data;
    },
    onSettled: () => {
      invalidateAfterFlags(queryClient, scope);
    },
  });
}
