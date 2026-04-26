import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type DateFilter = "today" | "this_week" | "this_month" | "all" | "custom";
export type StudentSegment = "all" | "active" | "new" | "recurrent" | "with_history";
export type StudentRoleFilter = "all" | "leader" | "follower" | "ambos" | "otro";
export type StudentHistoryPaymentType = "class" | "package" | "other";

export interface StudentsFilters {
  dateFilter: DateFilter;
  from?: string;
  to?: string;
  search?: string;
  role?: StudentRoleFilter;
  zone?: string;
  segment?: StudentSegment;
  limit?: number;
  offset?: number;
}

export interface StudentZoneRow {
  zoneName: string;
  attendanceCount: number;
  uniqueStudents: number;
}

export interface StudentGlobalMetrics {
  uniqueStudents: number;
  activeStudents: number;
  newStudents: number;
  recurrentStudents: number;
  studentsWithHistory: number;
  totalRecords: number;
  statusRecordBreakdown: Record<string, number>;
  statusStudentBreakdown: Record<string, number>;
  roleBreakdown: Record<string, number>;
  zoneBreakdown: StudentZoneRow[];
}

export interface StudentListItem {
  userId: string;
  studentName: string;
  studentEmail: string | null;
  primaryRole: string;
  primaryZone: string | null;
  firstActivityAt: string | null;
  lastActivityAt: string | null;
  totalRecords: number;
  totalTentative: number;
  totalPaid: number;
  totalAttended: number;
  totalCancelled: number;
  distinctClasses: number;
  distinctSessions: number;
  lastClassName: string | null;
  lastClassDate: string | null;
  statusBreakdown: Record<string, number>;
  roleBreakdown: Record<string, number>;
  zoneBreakdown: Record<string, number>;
}

export interface StudentHistoryItem {
  id: number;
  classId: number;
  className: string;
  sessionDate: string | null;
  hour: string | null;
  status: string;
  role: string;
  zone: string | null;
  teacherId: number | null;
  teacherName: string | null;
  createdAt: string;
  attended: boolean;
  paid: boolean;
  paymentType: StudentHistoryPaymentType | null;
}

export interface StudentClassBreakdownItem {
  classId: number;
  className: string;
  records: number;
  tentative: number;
  attended: number;
  paid: number;
  lastActivityAt: string | null;
}

export interface StudentDetail {
  student: {
    userId: string;
    name: string;
    email: string | null;
  };
  metrics: {
    totalRecords: number;
    totalReservations: number;
    totalPaid: number;
    totalAttended: number;
    totalCancelled: number;
    distinctClasses: number;
    distinctSessions: number;
    firstActivityAt: string | null;
    lastActivityAt: string | null;
    lastClassName: string | null;
    lastClassDate: string | null;
  };
  statusBreakdown: Record<string, number>;
  roleBreakdown: Record<string, number>;
  zoneBreakdown: Record<string, number>;
  classBreakdown: StudentClassBreakdownItem[];
  history: StudentHistoryItem[];
}

function toNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Evita enviar "" o texto inválido a RPC con parámetros `date` (PostgREST/Postgres pueden responder 400). */
function normalizeRpcDate(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = String(value).trim();
  if (!t) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  return t;
}

function parseAcademyId(academyId: string | number | undefined): number | null {
  if (academyId === undefined || academyId === null) return null;
  const n = typeof academyId === "string" ? Number(academyId.trim()) : academyId;
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

export function mapHistoryItem(h: any): StudentHistoryItem {
  const st = String(h?.status ?? "");
  const attended =
    typeof h?.attended === "boolean" ? h.attended : st === "attended" || st === "asistio" || st === "asistió";
  const paid = typeof h?.paid === "boolean" ? h.paid : st === "pagado";
  let paymentType: StudentHistoryPaymentType | null = null;
  if (paid) {
    const t = h?.payment_type;
    if (t === "class" || t === "package" || t === "other") paymentType = t;
    else paymentType = "class";
  }
  return {
    id: toNum(h.id),
    classId: toNum(h.class_id),
    className: String(h.class_name ?? "Clase"),
    sessionDate: h.session_date ? String(h.session_date) : null,
    hour: h.hora ? String(h.hora) : null,
    status: st || "unknown",
    role: String(h.role ?? "otro"),
    zone: h.zone ? String(h.zone) : null,
    teacherId: h.teacher_id != null && h.teacher_id !== undefined ? toNum(h.teacher_id) : null,
    teacherName: h.teacher_name ? String(h.teacher_name) : null,
    createdAt: String(h.created_at),
    attended,
    paid,
    paymentType,
  };
}

function toRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const input = value as Record<string, unknown>;
  const out: Record<string, number> = {};
  Object.entries(input).forEach(([k, v]) => {
    out[k] = toNum(v);
  });
  return out;
}

function getDateRange(filter: DateFilter, from?: string, to?: string): { from: string | null; to: string | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case "today":
      return {
        from: today.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      };
    case "this_week": {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return {
        from: weekStart.toISOString().split("T")[0],
        to: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      };
    }
    case "this_month": {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        from: monthStart.toISOString().split("T")[0],
        to: monthEnd.toISOString().split("T")[0],
      };
    }
    case "custom":
      return { from: from || null, to: to || null };
    case "all":
    default:
      return { from: null, to: null };
  }
}

function normalizeRoleFilter(role?: StudentRoleFilter): string | null {
  if (!role || role === "all") return null;
  return role;
}

function normalizeSegment(segment?: StudentSegment): string | null {
  if (!segment || segment === "all") return null;
  return segment;
}

export function useAcademyStudentsGlobalMetrics(
  academyId: string | number | undefined,
  filters: Pick<StudentsFilters, "dateFilter" | "from" | "to">,
) {
  const academyIdNum = parseAcademyId(academyId);

  const query = useQuery({
    queryKey: ["academy-students-global", academyIdNum, filters],
    enabled: academyIdNum != null,
    queryFn: async (): Promise<StudentGlobalMetrics> => {
      const dateRange = getDateRange(filters.dateFilter, filters.from, filters.to);
      const { data, error } = await supabase.rpc("rpc_get_academy_students_global_metrics", {
        p_academy_id: academyIdNum!,
        p_from: normalizeRpcDate(dateRange.from),
        p_to: normalizeRpcDate(dateRange.to),
      });

      if (error) throw error;

      const payload = (data ?? {}) as Record<string, unknown>;
      const zoneRowsRaw = Array.isArray(payload.zone_breakdown) ? payload.zone_breakdown : [];
      const zoneBreakdown = zoneRowsRaw.map((row: any) => ({
        zoneName: String(row?.zone_name ?? "Sin zona"),
        attendanceCount: toNum(row?.attendance_count),
        uniqueStudents: toNum(row?.unique_students),
      }));

      return {
        uniqueStudents: toNum(payload.unique_students),
        activeStudents: toNum(payload.active_students),
        newStudents: toNum(payload.new_students),
        recurrentStudents: toNum(payload.recurrent_students),
        studentsWithHistory: toNum(payload.students_with_history),
        totalRecords: toNum(payload.total_records),
        statusRecordBreakdown: toRecord(payload.status_record_breakdown),
        statusStudentBreakdown: toRecord(payload.status_student_breakdown),
        roleBreakdown: toRecord(payload.role_breakdown),
        zoneBreakdown,
      };
    },
    refetchInterval: 5000,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    metrics: query.data || null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useAcademyStudentsList(academyId: string | number | undefined, filters: StudentsFilters) {
  const academyIdNum = parseAcademyId(academyId);

  const query = useQuery({
    queryKey: ["academy-students-list", academyIdNum, filters],
    enabled: academyIdNum != null,
    queryFn: async (): Promise<StudentListItem[]> => {
      const dateRange = getDateRange(filters.dateFilter, filters.from, filters.to);
      const { data, error } = await supabase.rpc("rpc_get_academy_students_list", {
        p_academy_id: academyIdNum!,
        p_from: normalizeRpcDate(dateRange.from),
        p_to: normalizeRpcDate(dateRange.to),
        p_search: filters.search?.trim() || null,
        p_role: normalizeRoleFilter(filters.role),
        p_zone: filters.zone?.trim() || null,
        p_segment: normalizeSegment(filters.segment),
        p_limit: filters.limit ?? 100,
        p_offset: filters.offset ?? 0,
      });

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        userId: String(row.user_id),
        studentName: String(row.student_name ?? "Alumno"),
        studentEmail: row.student_email ? String(row.student_email) : null,
        primaryRole: String(row.primary_role ?? "otro"),
        primaryZone: row.primary_zone ? String(row.primary_zone) : null,
        firstActivityAt: row.first_activity_at ? String(row.first_activity_at) : null,
        lastActivityAt: row.last_activity_at ? String(row.last_activity_at) : null,
        totalRecords: toNum(row.total_records),
        totalTentative: toNum(row.total_tentative),
        totalPaid: toNum(row.total_paid),
        totalAttended: toNum(row.total_attended),
        totalCancelled: toNum(row.total_cancelled),
        distinctClasses: toNum(row.distinct_classes),
        distinctSessions: toNum(row.distinct_sessions),
        lastClassName: row.last_class_name ? String(row.last_class_name) : null,
        lastClassDate: row.last_class_date ? String(row.last_class_date) : null,
        statusBreakdown: toRecord(row.status_breakdown),
        roleBreakdown: toRecord(row.role_breakdown),
        zoneBreakdown: toRecord(row.zone_breakdown),
      }));
    },
    refetchInterval: 5000,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    students: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useAcademyStudentDetail(
  academyId: string | number | undefined,
  userId: string | null | undefined,
  filters: Pick<StudentsFilters, "dateFilter" | "from" | "to">,
) {
  const academyIdNum = parseAcademyId(academyId);

  const query = useQuery({
    queryKey: ["academy-student-detail", academyIdNum, userId, filters],
    enabled: academyIdNum != null && !!userId,
    queryFn: async (): Promise<StudentDetail | null> => {
      if (!userId) return null;
      const dateRange = getDateRange(filters.dateFilter, filters.from, filters.to);
      const { data, error } = await supabase.rpc("rpc_get_academy_student_detail", {
        p_academy_id: academyIdNum!,
        p_user_id: userId,
        p_from: normalizeRpcDate(dateRange.from),
        p_to: normalizeRpcDate(dateRange.to),
      });

      if (error) throw error;
      if (!data || typeof data !== "object") return null;
      const payload = data as Record<string, any>;

      const studentRaw = payload.student || {};
      const metricsRaw = payload.metrics || {};
      const classBreakdown = Array.isArray(payload.class_breakdown) ? payload.class_breakdown : [];
      const history = Array.isArray(payload.history) ? payload.history : [];

      return {
        student: {
          userId: String(studentRaw.user_id ?? userId),
          name: String(studentRaw.name ?? "Alumno"),
          email: studentRaw.email ? String(studentRaw.email) : null,
        },
        metrics: {
          totalRecords: toNum(metricsRaw.total_records),
          totalReservations: toNum(metricsRaw.total_reservations),
          totalPaid: toNum(metricsRaw.total_paid),
          totalAttended: toNum(metricsRaw.total_attended),
          totalCancelled: toNum(metricsRaw.total_cancelled),
          distinctClasses: toNum(metricsRaw.distinct_classes),
          distinctSessions: toNum(metricsRaw.distinct_sessions),
          firstActivityAt: metricsRaw.first_activity_at ? String(metricsRaw.first_activity_at) : null,
          lastActivityAt: metricsRaw.last_activity_at ? String(metricsRaw.last_activity_at) : null,
          lastClassName: metricsRaw.last_class_name ? String(metricsRaw.last_class_name) : null,
          lastClassDate: metricsRaw.last_class_date ? String(metricsRaw.last_class_date) : null,
        },
        statusBreakdown: toRecord(payload.status_breakdown),
        roleBreakdown: toRecord(payload.role_breakdown),
        zoneBreakdown: toRecord(payload.zone_breakdown),
        classBreakdown: classBreakdown.map((c: any) => ({
          classId: toNum(c.class_id),
          className: String(c.class_name ?? "Clase"),
          records: toNum(c.records),
          tentative: toNum(c.tentative),
          attended: c.attended !== undefined && c.attended !== null ? toNum(c.attended) : 0,
          paid: toNum(c.paid),
          lastActivityAt: c.last_activity_at ? String(c.last_activity_at) : null,
        })),
        history: history.map((h: any) => mapHistoryItem(h)),
      };
    },
    staleTime: 0,
    gcTime: 0,
  });

  return {
    detail: query.data || null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
