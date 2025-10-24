import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type EnrollmentStatus = 'inscrito' | 'interesado' | 'no_voy';

export interface ClassEnrollment {
  user_id: string;
  session_id: number;
  status: EnrollmentStatus;
  created_at: string;
}

export function useEnroll() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: number; status: EnrollmentStatus }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      console.log('🔍 [useClassEnroll] Inscribiendo en sesión...');
      console.log('📥 [useClassEnroll] Session ID:', sessionId);
      console.log('📥 [useClassEnroll] Status:', status);

      const { error } = await supabase
        .from("class_enrollments")
        .upsert({
          user_id: user.id,
          session_id: sessionId,
          status: status
        });

      if (error) {
        console.error('[useClassEnroll] Error inscribiendo:', error);
        throw error;
      }

      console.log('✅ [useClassEnroll] Inscripción exitosa');
    },
    onSuccess: (_, { sessionId }) => {
      qc.invalidateQueries({ queryKey: ["enrollments", "my"] });
      qc.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: ["enrollments", "my"],
    queryFn: async (): Promise<ClassEnrollment[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("class_enrollments")
        .select(`
          *,
          classes_session!inner(
            *,
            classes_parent!inner(
              *,
              profiles_academy!inner(*)
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useSessionEnrollments(sessionId: number) {
  return useQuery({
    queryKey: ["enrollments", "by-session", sessionId],
    enabled: !!sessionId,
    queryFn: async (): Promise<ClassEnrollment[]> => {
      const { data, error } = await supabase
        .from("class_enrollments")
        .select(`
          *,
          auth.users!inner(display_name, avatar_url)
        `)
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useMyEnrollmentStatus(sessionId: number) {
  return useQuery({
    queryKey: ["enrollment", "status", sessionId],
    enabled: !!sessionId,
    queryFn: async (): Promise<EnrollmentStatus | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("class_enrollments")
        .select("status")
        .eq("user_id", user.id)
        .eq("session_id", sessionId)
        .maybeSingle();

      if (error) throw error;
      return data?.status || null;
    },
  });
}
