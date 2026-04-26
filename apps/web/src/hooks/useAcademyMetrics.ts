import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type RoleType = 'lead' | 'follow' | 'ambos' | 'otro' | 'leader' | 'follower' | null;

export type ClassReservationPaymentType = 'class' | 'package' | 'other';

function rowAttendedFromData(row: { status?: string; attended?: boolean | null }): boolean {
  if (typeof row.attended === 'boolean') return row.attended;
  return String(row.status ?? '') === 'attended';
}

function rowPaidFromData(row: { status?: string; paid?: boolean | null }): boolean {
  if (typeof row.paid === 'boolean') return row.paid;
  return String(row.status ?? '') === 'pagado';
}

function rowPaymentTypeFromData(
  row: { payment_type?: string | null; paid?: boolean | null; status?: string }
): ClassReservationPaymentType | null {
  if (!rowPaidFromData(row)) return null;
  const t = row.payment_type;
  if (t === 'class' || t === 'package' || t === 'other') return t;
  return 'class';
}

/** `events_date.id` vía PostgREST + `in.()` debe ser entero en rango seguro (evita 400 y pérdida de precisión). */
function isSafeIntegerForInFilter(n: number): boolean {
  return Number.isInteger(n) && n > 0 && n <= Number.MAX_SAFE_INTEGER;
}

export type DateFilter = 'today' | 'this_week' | 'this_month' | 'all' | 'custom';

export interface MetricsFilters {
  from?: string; // ISO date string
  to?: string;   // ISO date string
  dateFilter: DateFilter;
}

/** Fila de zona desde rpc_get_academy_global_metrics */
export interface AcademyZoneMetricRow {
  zoneId: number;
  zoneName: string;
  attendanceCount: number;
  uniqueStudents: number;
}

export interface GlobalMetrics {
  /** Registros tentative en el período (volumen; el mismo usuario puede repetirse). */
  totalTentative: number;
  totalAttended: number;
  /** Alias explícito para dashboard; coincide con totalTentative cuando viene de RPC. */
  totalAttendanceRecords: number;
  /** Usuarios distintos con al menos una reserva tentative en el período. */
  uniqueStudents: number;
  /** Ítems en profiles_academy.cronograma (inventario; no depende del filtro de fechas). */
  totalClassesRegistered: number;
  /** Sesiones distintas (class_id + fecha_especifica) con ≥1 reserva en el período. */
  sessionsWithReservations: number;
  byRole: Record<string, number>; // 'leader', 'follower', 'ambos', 'otro'
  byZone: Record<string, number>; // key = zone name → attendance count (período)
  zoneRows: AcademyZoneMetricRow[];
  totalPurchases: number; // compras (status = 'pagado'), hoy sin filtro de período en el hook
  /** true si rpc_get_academy_global_metrics respondió OK */
  globalRpcLoaded: boolean;
}

export interface ClassReservationMetric {
  id: string;
  classId: number;
  className: string;
  classDate: string | null;
  status: string;
  userId: string;
  userName: string;
  roleType: RoleType;
  zone?: string;
  createdAt: string;
  /** Asistió a la sesión (independiente de pago). */
  attended: boolean;
  /** Pago registrado. */
  paid: boolean;
  /** Solo si paid: class | package | other */
  paymentType: ClassReservationPaymentType | null;
}

export interface ClassSummary {
  sessionKey: string;
  classId: number;
  className: string;
  classDate: string | null;
  timeLabel: string | null;
  diaSemana: number | null; // 0=Domingo, 1=Lunes, ..., 6=Sábado
  diaSemanaNombre: string | null; // 'lunes', 'martes', etc.
  totalAsistentes: number;
  totalTentative: number;
  totalAttended: number;
  byRole: Record<string, number>; // 'leader', 'follower', 'ambos', 'otro'
  reservations: ClassReservationMetric[]; // Lista de usuarios
  reservationsByDate: Map<string, ClassReservationMetric[]>; // Agrupado por fecha específica
  totalPurchases?: number; // compras (status = 'pagado') asociadas a esta clase
}

export interface AcademyMetricsResult {
  global: GlobalMetrics;
  perClass: ClassReservationMetric[];
  byClass: ClassSummary[]; // Agrupado por clase
}

function getDateRange(filter: DateFilter, from?: string, to?: string): { from: string | null; to: string | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (filter) {
    case 'today':
      return {
        from: today.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
      };
    case 'this_week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Domingo
      return {
        from: weekStart.toISOString().split('T')[0],
        to: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
    case 'this_month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        from: monthStart.toISOString().split('T')[0],
        to: monthEnd.toISOString().split('T')[0]
      };
    case 'custom':
      return {
        from: from || null,
        to: to || null
      };
    case 'all':
    default:
      return { from: null, to: null };
  }
}

export function useAcademyMetrics(academyId: string | number | undefined, filters: MetricsFilters) {
  const academyIdNum = typeof academyId === 'string' ? Number(academyId) : academyId;
  
  const query = useQuery({
    queryKey: ["academy-metrics", academyIdNum, filters],
    enabled: !!academyIdNum,
    queryFn: async (): Promise<AcademyMetricsResult> => {
      const dateRange = getDateRange(filters.dateFilter, filters.from, filters.to);

      type RpcGlobalRow = {
        total_classes_registered?: number;
        unique_students?: number;
        total_attendance_records?: number;
        total_tentative?: number;
        total_attended?: number;
        total_paid?: number;
        sessions_with_reservations?: number;
        status_breakdown?: Record<string, number>;
        role_breakdown?: { lead?: number; follow?: number; ambos?: number; other?: number };
        zone_breakdown?: Array<{
          zone_id?: number;
          zone_name?: string;
          attendance_count?: number;
          unique_students?: number;
        }>;
      };

      const { data: rpcGlobalRaw, error: rpcGlobalErr } = await supabase.rpc(
        "rpc_get_academy_global_metrics",
        {
          p_academy_id: academyIdNum!,
          p_from: dateRange.from ?? null,
          p_to: dateRange.to ?? null,
        },
      );

      const rpcGlobal =
        !rpcGlobalErr && rpcGlobalRaw && typeof rpcGlobalRaw === "object"
          ? (rpcGlobalRaw as RpcGlobalRow)
          : null;

      const { data: rpcData, error: rpcError } = await supabase
        .rpc("get_academy_class_reservations", { p_academy_id: academyIdNum! });

      let data: any[] = [];
      
      if (rpcError) {
        // Fallback: intentar consulta directa (puede fallar por RLS)
        let query = supabase
          .from("clase_asistencias")
          .select(`
            id,
            user_id,
            class_id,
            role_baile,
            zona_tag_id,
            status,
            attended,
            paid,
            payment_type,
            fecha_especifica,
            created_at
          `)
          .eq("academy_id", academyIdNum!);
        
        // Aplicar filtros de fecha si existen
        if (dateRange.from) {
          query = query.gte("created_at", `${dateRange.from}T00:00:00.000Z`);
        }
        if (dateRange.to) {
          query = query.lte("created_at", `${dateRange.to}T23:59:59.999Z`);
        }
        
        const { data: directData, error: directError } = await query;
        
        if (directError) throw directError;
        
        // Filtrar por fecha si es necesario
        data = directData || [];
        if (dateRange.from || dateRange.to) {
          data = data.filter((row: any) => {
            const created = new Date(row.created_at);
            if (dateRange.from) {
              const fromDate = new Date(`${dateRange.from}T00:00:00.000Z`);
              if (created < fromDate) return false;
            }
            if (dateRange.to) {
              const toDate = new Date(`${dateRange.to}T23:59:59.999Z`);
              if (created > toDate) return false;
            }
            return true;
          });
        }
      } else {
        // Filtrar por fecha si es necesario (ya que RPC no tiene filtros)
        data = rpcData || [];
        if (dateRange.from || dateRange.to) {
          data = data.filter((row: any) => {
            const created = new Date(row.created_at);
            if (dateRange.from) {
              const fromDate = new Date(`${dateRange.from}T00:00:00.000Z`);
              if (created < fromDate) return false;
            }
            if (dateRange.to) {
              const toDate = new Date(`${dateRange.to}T23:59:59.999Z`);
              if (created > toDate) return false;
            }
            return true;
          });
        }
      }
      
      // Obtener información de clases, zonas y usuarios
      const classIds = [...new Set((data || []).map((r: any) => r.class_id))];
      const zonaTagIds = [...new Set((data || []).map((r: any) => r.zona_tag_id).filter(Boolean))];
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      
      // Obtener información de clases (desde cronograma) incluyendo día de la semana
      const classInfoMap = new Map<number, { 
        nombre: string; 
        fecha: string | null;
        horaInicio: string | null;
        diaSemana: number | null;
        diaSemanaNombre: string | null;
      }>();
      
      const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      
      if (classIds.length > 0) {
        // Intentar obtener desde profiles_academy.cronograma
        const { data: academyData } = await supabase
          .from("profiles_academy")
          .select("cronograma")
          .eq("id", academyIdNum!)
          .maybeSingle();
        
        if (academyData?.cronograma && Array.isArray(academyData.cronograma)) {
          // Estrategia de búsqueda múltiple para encontrar clases
          academyData.cronograma.forEach((clase: any, index: number) => {
            const claseId = clase.id ? Number(clase.id) : null;
            const nombreClase = clase.titulo || clase.nombre || null;
            const horaInicio = typeof (clase?.inicio || clase?.hora_inicio) === 'string'
              ? String(clase.inicio || clase.hora_inicio)
              : null;
            
            // Obtener día de la semana
            let diaSemana: number | null = null;
            let diaSemanaNombre: string | null = null;
            
            if (clase.diaSemana !== null && clase.diaSemana !== undefined) {
              diaSemana = Number(clase.diaSemana);
              diaSemanaNombre = dayNames[diaSemana] || null;
            } else if (clase.diasSemana && Array.isArray(clase.diasSemana) && clase.diasSemana.length > 0) {
              // Si tiene array de días, usar el primero
              const firstDay = clase.diasSemana[0];
              if (typeof firstDay === 'number') {
                diaSemana = firstDay;
                diaSemanaNombre = dayNames[diaSemana] || null;
              } else if (typeof firstDay === 'string') {
                // Convertir nombre de día a número
                const dayIndex = dayNames.findIndex(d => d.toLowerCase() === firstDay.toLowerCase());
                if (dayIndex >= 0) {
                  diaSemana = dayIndex;
                  diaSemanaNombre = dayNames[dayIndex];
                }
              }
            }
            
            // Buscar por ID exacto
            if (claseId && classIds.includes(claseId)) {
              classInfoMap.set(claseId, {
                nombre: nombreClase || `Clase #${claseId}`,
                fecha: clase.fecha || null,
                horaInicio,
                diaSemana,
                diaSemanaNombre
              });
            }
            
            // Buscar por índice si el class_id es múltiplo de 1000
            classIds.forEach((id) => {
              if (id % 1000 === 0 && (id / 1000) === index) {
                if (!classInfoMap.has(id)) {
                  classInfoMap.set(id, {
                    nombre: nombreClase || `Clase #${id}`,
                    fecha: clase.fecha || null,
                    horaInicio,
                    diaSemana,
                    diaSemanaNombre
                  });
                }
              }
            });
            
            // Buscar por índice directo si class_id < 1000
            classIds.forEach((id) => {
              if (id < 1000 && id === index) {
                if (!classInfoMap.has(id)) {
                  classInfoMap.set(id, {
                    nombre: nombreClase || `Clase #${id}`,
                    fecha: clase.fecha || null,
                    horaInicio,
                    diaSemana,
                    diaSemanaNombre
                  });
                }
              }
            });
          });
          
          // Si class_id coincide con academy_id, usar la primera clase como fallback
          classIds.forEach((id) => {
            if (id === academyIdNum && academyData.cronograma.length > 0 && !classInfoMap.has(id)) {
              const primeraClase = academyData.cronograma[0];
              let diaSemana: number | null = null;
              let diaSemanaNombre: string | null = null;
              if (primeraClase.diaSemana !== null && primeraClase.diaSemana !== undefined) {
                diaSemana = Number(primeraClase.diaSemana);
                diaSemanaNombre = dayNames[diaSemana] || null;
              }
              classInfoMap.set(id, {
                nombre: primeraClase.titulo || primeraClase.nombre || `Clase #${id}`,
                fecha: primeraClase.fecha || null,
                horaInicio: typeof (primeraClase?.inicio || primeraClase?.hora_inicio) === 'string'
                  ? String(primeraClase.inicio || primeraClase.hora_inicio)
                  : null,
                diaSemana,
                diaSemanaNombre
              });
            }
          });
        }
        
        // Para clases que no se encontraron, intentar buscar en event_dates como último recurso.
        // Omitir IDs > MAX_SAFE_INTEGER: no se serializan bien a JSON/PostgREST y suelen ser class_id
        // sintéticos (cronograma) que no existen en events_date.
        const missingClassIds = classIds.filter((id) => !classInfoMap.has(id));
        const eventDateInIds = missingClassIds.filter(isSafeIntegerForInFilter);
        if (eventDateInIds.length > 0) {
          const { data: eventDates, error: eventDateErr } = await supabase
            .from("events_date")
            .select("id, nombre, titulo")
            .in("id", eventDateInIds);
          if (eventDateErr) {
            if (import.meta.env.DEV) {
              // eslint-disable-next-line no-console
              console.warn("[useAcademyMetrics] events_date by class_id", eventDateErr);
            }
          } else {
            (eventDates || []).forEach((event: any) => {
              if (!classInfoMap.has(event.id)) {
                classInfoMap.set(event.id, {
                  nombre: event.titulo || event.nombre || `Clase #${event.id}`,
                  fecha: null,
                  horaInicio: null,
                  diaSemana: null,
                  diaSemanaNombre: null
                });
              }
            });
          }
        }
        
        // Para clases que aún no se encontraron, usar el ID como nombre (último fallback)
        classIds.forEach((id) => {
          if (!classInfoMap.has(id)) {
            classInfoMap.set(id, {
              nombre: `Clase #${id}`,
              fecha: null,
              horaInicio: null,
              diaSemana: null,
              diaSemanaNombre: null
            });
          }
        });
      }
      
      // Obtener nombres de zonas (FILTRAR SOLO TIPO 'zona' para evitar mezclar con ritmos)
      const zonaInfoMap = new Map<number, string>();
      if (zonaTagIds.length > 0) {
        const { data: zonaTags } = await supabase
          .from("tags")
          .select("id, nombre")
          .in("id", zonaTagIds)
          .eq("tipo", "zona");  // 🔧 FIX: Filtrar solo tags de tipo 'zona' para evitar mezclar con ritmos
        
        (zonaTags || []).forEach((tag: any) => {
          zonaInfoMap.set(tag.id, tag.nombre);
        });
      }
      
      // Obtener nombres de usuarios
      const userInfoMap = new Map<string, string>();
      if (userIds.length > 0) {
        // Consultar profiles_user para obtener nombres
        // IMPORTANTE: profiles_user usa user_id (no id) y display_name (no nombre_publico)
        const { data: userProfiles, error: userError } = await supabase
          .from("profiles_user")
          .select("user_id, display_name, email")
          .in("user_id", userIds);
        
        if (userError) {
          throw userError;
        }
        
        (userProfiles || []).forEach((profile: any) => {
          // Priorizar display_name, luego email, luego ID truncado
          const nombre = profile.display_name?.trim() 
            || profile.email?.split('@')[0]?.trim()
            || `Usuario ${profile.user_id.substring(0, 8)}`;
          userInfoMap.set(profile.user_id, nombre);
        });
        
        // Para usuarios que no se encontraron en profiles_user
        const missingUserIds = userIds.filter(id => !userInfoMap.has(id));
        if (missingUserIds.length > 0) {
          missingUserIds.forEach((id) => {
            userInfoMap.set(id, `Usuario ${id.substring(0, 8)}`);
          });
        }
      }
      
      // Procesar datos — KPIs globales preferentemente desde rpc_get_academy_global_metrics
      const global: GlobalMetrics = {
        totalTentative: 0,
        totalAttended: 0,
        totalAttendanceRecords: 0,
        uniqueStudents: 0,
        totalClassesRegistered: 0,
        sessionsWithReservations: 0,
        byRole: { leader: 0, follower: 0, ambos: 0, otro: 0 },
        byZone: {},
        zoneRows: [],
        totalPurchases: 0,
        globalRpcLoaded: false,
      };

      if (rpcGlobal) {
        global.globalRpcLoaded = true;
        global.totalClassesRegistered = Number(rpcGlobal.total_classes_registered) || 0;
        global.uniqueStudents = Number(rpcGlobal.unique_students) || 0;
        global.totalAttendanceRecords = Number(rpcGlobal.total_attendance_records) || 0;
        global.totalTentative = Number(rpcGlobal.total_tentative) || 0;
        global.totalAttended = Number(rpcGlobal.total_attended) || 0;
        global.sessionsWithReservations = Number(rpcGlobal.sessions_with_reservations) || 0;
        global.totalPurchases = Number(rpcGlobal.total_paid) || 0;
        const rb = rpcGlobal.role_breakdown || {};
        global.byRole.leader = Number(rb.lead) || 0;
        global.byRole.follower = Number(rb.follow) || 0;
        global.byRole.ambos = Number(rb.ambos) || 0;
        global.byRole.otro = Number(rb.other) || 0;
        const zlist = Array.isArray(rpcGlobal.zone_breakdown) ? rpcGlobal.zone_breakdown : [];
        global.zoneRows = zlist.map((z) => ({
          zoneId: Number(z.zone_id),
          zoneName: String(z.zone_name ?? ""),
          attendanceCount: Number(z.attendance_count) || 0,
          uniqueStudents: Number(z.unique_students) || 0,
        }));
        zlist.forEach((z) => {
          const name = String(z.zone_name ?? "").trim();
          if (name) global.byZone[name] = Number(z.attendance_count) || 0;
        });
      }
      
      const perClass: ClassReservationMetric[] = [];
      
      (data || []).forEach((row: any) => {
        // Normalizar role_baile
        let normalizedRole: string = 'otro';
        const role = row.role_baile;
        if (role === 'lead' || role === 'leader') normalizedRole = 'leader';
        else if (role === 'follow' || role === 'follower') normalizedRole = 'follower';
        else if (role === 'ambos') normalizedRole = 'ambos';
        else normalizedRole = 'otro';
        
        // Actualizar métricas globales (solo si no vinieron de rpc_get_academy_global_metrics)
        if (!global.globalRpcLoaded) {
          const a = rowAttendedFromData(row);
          const p = rowPaidFromData(row);
          if (!a && !p && String(row.status ?? '') === 'tentative') global.totalTentative += 1;
          if (a) global.totalAttended += 1;
          global.totalAttendanceRecords += 1;
          global.byRole[normalizedRole] = (global.byRole[normalizedRole] || 0) + 1;
          if (row.zona_tag_id && zonaInfoMap.has(row.zona_tag_id)) {
            const zonaNombre = zonaInfoMap.get(row.zona_tag_id)!;
            global.byZone[zonaNombre] = (global.byZone[zonaNombre] || 0) + 1;
          }
        }
        
        // Información de la clase - asegurar que siempre tenga un nombre
        const classInfo = classInfoMap.get(row.class_id);
        if (!classInfo) {
          // Si no se encontró, intentar buscar de nuevo o usar fallback
          classInfoMap.set(row.class_id, {
            nombre: `Clase #${row.class_id}`,
            fecha: null,
            horaInicio: null,
            diaSemana: null,
            diaSemanaNombre: null
          });
        }
        const finalClassInfo = classInfoMap.get(row.class_id)!;
        const classDateRaw = row.fecha_especifica || finalClassInfo.fecha || null;
        const classDate = typeof classDateRaw === 'string' && classDateRaw.includes('T')
          ? classDateRaw.split('T')[0]
          : classDateRaw;
        
        // Si hay fecha_especifica, determinar el día de la semana
        let diaSemana: number | null = finalClassInfo.diaSemana;
        let diaSemanaNombre: string | null = finalClassInfo.diaSemanaNombre;
        if (row.fecha_especifica && !diaSemana) {
          try {
            const fecha = new Date(row.fecha_especifica);
            if (!isNaN(fecha.getTime())) {
              diaSemana = fecha.getDay();
              diaSemanaNombre = dayNames[diaSemana];
            }
          } catch (e) {
            // Ignorar errores de fecha
          }
        }
        
        // Información del usuario - asegurar que siempre tenga un nombre
        let userName = userInfoMap.get(row.user_id);
        if (!userName) {
          // Si no se encontró, usar fallback
          userName = `Usuario ${row.user_id.substring(0, 8)}`;
          userInfoMap.set(row.user_id, userName);
        }
        
        // Agregar a perClass - asegurar que siempre se use el nombre, no el ID
        perClass.push({
          id: String(row.id),
          classId: row.class_id,
          className: finalClassInfo.nombre, // Siempre usar nombre, nunca ID
          classDate: classDate,
          status: String(row.status ?? "tentative"),
          userId: row.user_id,
          userName: userName, // Siempre usar nombre, nunca ID
          roleType: normalizedRole as RoleType,
          zone: row.zona_tag_id && zonaInfoMap.has(row.zona_tag_id) 
            ? zonaInfoMap.get(row.zona_tag_id)! 
            : undefined,
          createdAt: row.created_at,
          attended: rowAttendedFromData(row),
          paid: rowPaidFromData(row),
          paymentType: rowPaymentTypeFromData(row),
        });
      });

      if (!global.globalRpcLoaded) {
        const rows = data || [];
        const userSet = new Set<string>();
        const sessionSet = new Set<string>();
        rows.forEach((row: any) => {
          if (row.user_id) userSet.add(String(row.user_id));
          sessionSet.add(`${row.class_id}|${row.fecha_especifica ?? "null"}`);
        });
        global.uniqueStudents = userSet.size;
        global.totalAttendanceRecords = rows.length;
        global.totalTentative = rows.filter(
          (row: any) =>
            !rowAttendedFromData(row) &&
            !rowPaidFromData(row) &&
            String(row.status ?? "") === "tentative"
        ).length;
        global.totalAttended = rows.filter((row: any) => rowAttendedFromData(row)).length;
        global.totalPurchases = rows.filter((row: any) => rowPaidFromData(row)).length;
        global.sessionsWithReservations = sessionSet.size;
        const { data: paCron } = await supabase
          .from("profiles_academy")
          .select("cronograma")
          .eq("id", academyIdNum!)
          .maybeSingle();
        const cr = paCron?.cronograma;
        global.totalClassesRegistered = Array.isArray(cr) ? cr.length : 0;
      }
      
      // Ordenar perClass por fecha de creación (más recientes primero)
      perClass.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Agrupar por sesión exacta: class_id + fecha_especifica (+ fallback por día/hora)
      const byClassMap = new Map<string, ClassSummary>();
      
      perClass.forEach((reservation) => {
        const classInfo = classInfoMap.get(reservation.classId)!;
        
        // Determinar día de la semana
        let diaSemana: number | null = classInfo.diaSemana;
        let diaSemanaNombre: string | null = classInfo.diaSemanaNombre;
        
        // Si hay fecha específica, usar el día de esa fecha
        if (reservation.classDate) {
          try {
            const fecha = new Date(reservation.classDate);
            if (!isNaN(fecha.getTime()) && fecha.getFullYear() > 1970) {
              diaSemana = fecha.getDay();
              diaSemanaNombre = dayNames[diaSemana];
            }
          } catch (e) {
            // Ignorar errores
          }
        }
        
        const timeLabel = classInfo.horaInicio ? String(classInfo.horaInicio) : null;
        const sessionDateKey = reservation.classDate && String(reservation.classDate).trim()
          ? String(reservation.classDate).trim()
          : 'sin-fecha';
        // Fallback legacy para filas antiguas sin fecha específica: separar por día/hora.
        const key = `${reservation.classId}|${sessionDateKey}|${diaSemana ?? 'na'}|${timeLabel ?? 'na'}`;
        
        const existing = byClassMap.get(key);
        
        if (existing) {
          existing.totalAsistentes += 1;
          if (
            !reservation.attended &&
            !reservation.paid &&
            reservation.status === "tentative"
          ) {
            existing.totalTentative += 1;
          }
          if (reservation.attended) existing.totalAttended += 1;
          existing.byRole[reservation.roleType || 'otro'] = (existing.byRole[reservation.roleType || 'otro'] || 0) + 1;
          existing.reservations.push(reservation);
          
          // Si el ClassSummary no tiene classDate pero esta reserva sí tiene, actualizarlo
          if (!existing.classDate && reservation.classDate) {
            try {
              const fecha = new Date(reservation.classDate);
              if (!isNaN(fecha.getTime()) && fecha.getFullYear() > 1970) {
                existing.classDate = reservation.classDate;
              }
            } catch (e) {
              // Ignorar errores
            }
          }
          
          // Agrupar por fecha específica
          const fechaKey = reservation.classDate || 'sin-fecha';
          if (!existing.reservationsByDate.has(fechaKey)) {
            existing.reservationsByDate.set(fechaKey, []);
          }
          existing.reservationsByDate.get(fechaKey)!.push(reservation);
        } else {
          // Crear nombre de sesión con día/hora para que la UI refleje sesión exacta.
          let classNameWithDay = reservation.className;
          if (diaSemanaNombre || timeLabel) {
            const dayPart = diaSemanaNombre
              ? diaSemanaNombre.charAt(0).toUpperCase() + diaSemanaNombre.slice(1)
              : '';
            const parts = [dayPart, timeLabel].filter(Boolean);
            if (parts.length) classNameWithDay = `${reservation.className} - ${parts.join(' ')}`;
          }
          
          const reservationsByDate = new Map<string, ClassReservationMetric[]>();
          const fechaKey = reservation.classDate || 'sin-fecha';
          reservationsByDate.set(fechaKey, [reservation]);
          
          byClassMap.set(key, {
            sessionKey: key,
            classId: reservation.classId,
            className: classNameWithDay,
            classDate: reservation.classDate,
            timeLabel,
            diaSemana,
            diaSemanaNombre,
            totalAsistentes: 1,
            totalTentative:
              !reservation.attended &&
              !reservation.paid &&
              reservation.status === "tentative"
                ? 1
                : 0,
            totalAttended: reservation.attended ? 1 : 0,
            byRole: {
              leader: reservation.roleType === 'leader' ? 1 : 0,
              follower: reservation.roleType === 'follower' ? 1 : 0,
              ambos: reservation.roleType === 'ambos' ? 1 : 0,
              otro: reservation.roleType === 'otro' || !reservation.roleType ? 1 : 0,
            },
            reservations: [reservation],
            reservationsByDate,
            totalPurchases: 0,
          });
        }
      });

      byClassMap.forEach((summary) => {
        summary.totalPurchases = summary.reservations.filter((r) => r.paid).length;
      });
      
      // Post-procesamiento: asegurar que todas las clases tengan classDate si alguna reserva tiene fecha
      byClassMap.forEach((classSummary) => {
        // Si no tiene classDate, buscar la fecha más común entre las reservas
        if (!classSummary.classDate || (() => {
          try {
            const fecha = new Date(classSummary.classDate);
            return isNaN(fecha.getTime()) || fecha.getFullYear() <= 1970;
          } catch {
            return true;
          }
        })()) {
          // Contar fechas válidas
          const fechaCounts = new Map<string, number>();
          classSummary.reservations.forEach((reservation) => {
            if (reservation.classDate) {
              try {
                const fecha = new Date(reservation.classDate);
                if (!isNaN(fecha.getTime()) && fecha.getFullYear() > 1970) {
                  const fechaKey = reservation.classDate;
                  fechaCounts.set(fechaKey, (fechaCounts.get(fechaKey) || 0) + 1);
                }
              } catch {
                // Ignorar fechas inválidas
              }
            }
          });
          
          // Encontrar la fecha más común
          if (fechaCounts.size > 0) {
            let maxCount = 0;
            let mostCommonDate: string | null = null;
            fechaCounts.forEach((count, fecha) => {
              if (count > maxCount) {
                maxCount = count;
                mostCommonDate = fecha;
              }
            });
            if (mostCommonDate) {
              classSummary.classDate = mostCommonDate;
            }
          }
        }
      });
      
      // Optimización Stage 1: enriquecer/normalizar desde RPC por sesión exacta.
      try {
        const { data: sessionRows, error: sessionErr } = await supabase.rpc("rpc_get_academy_class_metrics", {
          p_academy_id: academyIdNum!,
          p_from: dateRange.from ?? null,
          p_to: dateRange.to ?? null,
        });
        if (!sessionErr && Array.isArray(sessionRows)) {
          const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
          const sessionMap = new Map<string, any>();
          sessionRows.forEach((row: any) => {
            const dateKey = row.class_session_date ? String(row.class_session_date) : 'sin-fecha';
            sessionMap.set(`${row.class_id}|${dateKey}`, row);
          });

          byClassMap.forEach((summary) => {
            const dateKey = summary.classDate ? String(summary.classDate) : 'sin-fecha';
            const rpcRow = sessionMap.get(`${summary.classId}|${dateKey}`);
            if (!rpcRow) return;
            const dayPart = rpcRow.dia_label ? capitalize(String(rpcRow.dia_label)) : null;
            const timePart = rpcRow.hora_inicio ? String(rpcRow.hora_inicio) : null;
            const nameParts = [dayPart, timePart].filter(Boolean);
            summary.className = nameParts.length
              ? `${String(rpcRow.class_name || summary.className)} - ${nameParts.join(' ')}`
              : String(rpcRow.class_name || summary.className);
            summary.timeLabel = timePart || summary.timeLabel || null;
            summary.totalAsistentes = Number(rpcRow.total_alumnos) || summary.totalAsistentes;
            summary.totalTentative = Number(rpcRow.tentative_count) || summary.totalTentative;
            summary.totalAttended = Number(rpcRow.attended_count) || summary.totalAttended;
            summary.byRole = {
              leader: Number(rpcRow.leader_count) || 0,
              follower: Number(rpcRow.follower_count) || 0,
              ambos: Number(rpcRow.ambos_count) || 0,
              otro: Number(rpcRow.otros_count) || 0,
            };
          });
        }
      } catch {
      }

      // Convertir a array y ordenar por total de asistentes (mayor primero)
      const byClass = Array.from(byClassMap.values()).sort((a, b) => b.totalAsistentes - a.totalAsistentes);
      
      return {
        global,
        perClass,
        byClass
      };
    },
    refetchInterval: 5000, // Refrescar cada 5 segundos
    staleTime: 60_000,
    gcTime: 300_000,
  });
  
  return {
    global: query.data?.global || null,
    perClass: query.data?.perClass || [],
    byClass: query.data?.byClass || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

