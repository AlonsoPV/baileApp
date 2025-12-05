import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type RoleType = 'lead' | 'follow' | 'ambos' | 'otro' | 'leader' | 'follower' | null;

export type DateFilter = 'today' | 'this_week' | 'this_month' | 'all' | 'custom';

export interface MetricsFilters {
  from?: string; // ISO date string
  to?: string;   // ISO date string
  dateFilter: DateFilter;
}

export interface GlobalMetrics {
  totalTentative: number;
  byRole: Record<string, number>; // 'leader', 'follower', 'ambos', 'otro'
  byZone: Record<string, number>; // key = zone chip/nombre
  totalPurchases: number; // número de compras (status = 'pagado')
}

export interface ClassReservationMetric {
  id: string;
  classId: number;
  className: string;
  classDate: string | null;
  userId: string;
  userName: string;
  roleType: RoleType;
  zone?: string;
  createdAt: string;
}

export interface ClassSummary {
  classId: number;
  className: string;
  classDate: string | null;
  diaSemana: number | null; // 0=Domingo, 1=Lunes, ..., 6=Sábado
  diaSemanaNombre: string | null; // 'lunes', 'martes', etc.
  totalAsistentes: number;
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
      console.log("[useAcademyMetrics] 🔍 Consultando métricas para academyId:", academyIdNum, "filtros:", filters);
      
      const dateRange = getDateRange(filters.dateFilter, filters.from, filters.to);
      
      // Usar función RPC para bypassar RLS y obtener todas las reservas de la academia
      // Esta función verifica que el usuario sea dueño de la academia
      console.log("[useAcademyMetrics] 🔧 Llamando a función RPC get_academy_class_reservations con academyId:", academyIdNum);
      const { data: rpcData, error: rpcError } = await supabase
        .rpc("get_academy_class_reservations", { p_academy_id: academyIdNum! });
      
      console.log("[useAcademyMetrics] 📥 Respuesta RPC:", { 
        hasData: !!rpcData, 
        dataLength: rpcData?.length || 0, 
        hasError: !!rpcError,
        error: rpcError 
      });
      
      let data: any[] = [];
      
      if (rpcError) {
        console.error("[useAcademyMetrics] ❌ Error en RPC get_academy_class_reservations:", rpcError);
        console.log("[useAcademyMetrics] 💡 La función RPC puede no existir aún. Ejecuta: supabase/07_get_academy_class_reservations.sql");
        console.log("[useAcademyMetrics] 💡 Detalles del error:", JSON.stringify(rpcError, null, 2));
        // Fallback: intentar consulta directa (puede fallar por RLS)
        console.log("[useAcademyMetrics] 🔄 Intentando consulta directa como fallback...");
        let query = supabase
          .from("clase_asistencias")
          .select(`
            id,
            user_id,
            class_id,
            role_baile,
            zona_tag_id,
            fecha_especifica,
            created_at
          `)
          .eq("academy_id", academyIdNum!)
          .eq("status", "tentative");
        
        // Aplicar filtros de fecha si existen
        if (dateRange.from) {
          query = query.gte("created_at", `${dateRange.from}T00:00:00.000Z`);
        }
        if (dateRange.to) {
          query = query.lte("created_at", `${dateRange.to}T23:59:59.999Z`);
        }
        
        const { data: directData, error: directError } = await query;
        
        if (directError) {
          console.error("[useAcademyMetrics] ❌ Error en consulta directa:", directError);
          throw directError;
        }
        
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
        
        console.log("[useAcademyMetrics] 📊 Registros encontrados (fallback):", data?.length || 0);
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
        
        console.log("[useAcademyMetrics] 📊 Registros encontrados (RPC):", data?.length || 0);
      }
      
      console.log("[useAcademyMetrics] 📊 Total registros procesados:", data?.length || 0);
      
      // Obtener información de clases, zonas y usuarios
      const classIds = [...new Set((data || []).map((r: any) => r.class_id))];
      const zonaTagIds = [...new Set((data || []).map((r: any) => r.zona_tag_id).filter(Boolean))];
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      
      // Obtener información de clases (desde cronograma) incluyendo día de la semana
      const classInfoMap = new Map<number, { 
        nombre: string; 
        fecha: string | null;
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
                diaSemana,
                diaSemanaNombre
              });
            }
          });
        }
        
        // Para clases que no se encontraron, intentar buscar en event_dates como último recurso
        const missingClassIds = classIds.filter(id => !classInfoMap.has(id));
        if (missingClassIds.length > 0) {
          const { data: eventDates } = await supabase
            .from("events_date")
            .select("id, nombre, titulo")
            .in("id", missingClassIds);
          
          (eventDates || []).forEach((event: any) => {
            if (!classInfoMap.has(event.id)) {
              classInfoMap.set(event.id, {
                nombre: event.titulo || event.nombre || `Clase #${event.id}`,
                fecha: null,
                diaSemana: null,
                diaSemanaNombre: null
              });
            }
          });
        }
        
        // Para clases que aún no se encontraron, usar el ID como nombre (último fallback)
        classIds.forEach((id) => {
          if (!classInfoMap.has(id)) {
            classInfoMap.set(id, {
              nombre: `Clase #${id}`,
              fecha: null,
              diaSemana: null,
              diaSemanaNombre: null
            });
          }
        });
      }
      
      // Obtener nombres de zonas
      const zonaInfoMap = new Map<number, string>();
      if (zonaTagIds.length > 0) {
        const { data: zonaTags } = await supabase
          .from("tags")
          .select("id, nombre")
          .in("id", zonaTagIds);
        
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
          console.error("[useAcademyMetrics] Error obteniendo perfiles de usuario:", userError);
        }
        
        console.log("[useAcademyMetrics] Perfiles encontrados:", userProfiles?.length || 0, "de", userIds.length);
        
        (userProfiles || []).forEach((profile: any) => {
          // Priorizar display_name, luego email, luego ID truncado
          const nombre = profile.display_name?.trim() 
            || profile.email?.split('@')[0]?.trim()
            || `Usuario ${profile.user_id.substring(0, 8)}`;
          userInfoMap.set(profile.user_id, nombre);
          console.log("[useAcademyMetrics] Usuario mapeado:", profile.user_id, "->", nombre);
        });
        
        // Para usuarios que no se encontraron en profiles_user
        const missingUserIds = userIds.filter(id => !userInfoMap.has(id));
        if (missingUserIds.length > 0) {
          console.log("[useAcademyMetrics] Usuarios no encontrados:", missingUserIds.length);
          missingUserIds.forEach((id) => {
            userInfoMap.set(id, `Usuario ${id.substring(0, 8)}`);
          });
        }
      }
      
      // Procesar datos
      const global: GlobalMetrics = {
        totalTentative: 0,
        byRole: { leader: 0, follower: 0, ambos: 0, otro: 0 },
        byZone: {},
        totalPurchases: 0,
      };
      
      const perClass: ClassReservationMetric[] = [];
      
      (data || []).forEach((row: any) => {
        // Normalizar role_baile
        let normalizedRole: string = 'otro';
        const role = row.role_baile;
        if (role === 'lead' || role === 'leader') normalizedRole = 'leader';
        else if (role === 'follow' || role === 'follower') normalizedRole = 'follower';
        else if (role === 'ambos') normalizedRole = 'ambos';
        else normalizedRole = 'otro';
        
        // Actualizar métricas globales
        global.totalTentative += 1;
        global.byRole[normalizedRole] = (global.byRole[normalizedRole] || 0) + 1;
        
        // Por zona
        if (row.zona_tag_id && zonaInfoMap.has(row.zona_tag_id)) {
          const zonaNombre = zonaInfoMap.get(row.zona_tag_id)!;
          global.byZone[zonaNombre] = (global.byZone[zonaNombre] || 0) + 1;
        }
        
        // Información de la clase - asegurar que siempre tenga un nombre
        const classInfo = classInfoMap.get(row.class_id);
        if (!classInfo) {
          // Si no se encontró, intentar buscar de nuevo o usar fallback
          classInfoMap.set(row.class_id, {
            nombre: `Clase #${row.class_id}`,
            fecha: null,
            diaSemana: null,
            diaSemanaNombre: null
          });
        }
        const finalClassInfo = classInfoMap.get(row.class_id)!;
        const classDate = row.fecha_especifica || finalClassInfo.fecha || null;
        
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
          userId: row.user_id,
          userName: userName, // Siempre usar nombre, nunca ID
          roleType: normalizedRole as RoleType,
          zone: row.zona_tag_id && zonaInfoMap.has(row.zona_tag_id) 
            ? zonaInfoMap.get(row.zona_tag_id)! 
            : undefined,
          createdAt: row.created_at
        });
      });
      
      // Ordenar perClass por fecha de creación (más recientes primero)
      perClass.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Agrupar por clase + día de la semana
      // Usar una clave compuesta: classId-diaSemana para separar clases del mismo nombre en diferentes días
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
        
        // Crear clave única: classId-diaSemana (o solo classId si no hay día)
        const key = diaSemana !== null ? `${reservation.classId}-${diaSemana}` : String(reservation.classId);
        
        const existing = byClassMap.get(key);
        
        if (existing) {
          existing.totalAsistentes += 1;
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
          // Crear nombre de clase con día de la semana
          let classNameWithDay = reservation.className;
          if (diaSemanaNombre) {
            classNameWithDay = `${reservation.className} - ${diaSemanaNombre.charAt(0).toUpperCase() + diaSemanaNombre.slice(1)}`;
          }
          
          const reservationsByDate = new Map<string, ClassReservationMetric[]>();
          const fechaKey = reservation.classDate || 'sin-fecha';
          reservationsByDate.set(fechaKey, [reservation]);
          
          byClassMap.set(key, {
            classId: reservation.classId,
            className: classNameWithDay,
            classDate: reservation.classDate,
            diaSemana,
            diaSemanaNombre,
            totalAsistentes: 1,
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

      // Métricas de compras (status = 'pagado')
      try {
        const { data: purchaseRows, error: purchaseError } = await supabase
          .from("clase_asistencias")
          .select("class_id, created_at")
          .eq("academy_id", academyIdNum!)
          .eq("status", "pagado");

        if (purchaseError) {
          console.error("[useAcademyMetrics] ❌ Error obteniendo compras (clase_asistencias):", purchaseError);
        } else {
          const purchasesByClassId = new Map<number, number>();
          (purchaseRows || []).forEach((row: any) => {
            const classId = row.class_id as number;
            if (!classId) return;
            global.totalPurchases += 1;
            purchasesByClassId.set(classId, (purchasesByClassId.get(classId) || 0) + 1);
          });

          // Asignar compras a cada resumen de clase
          byClassMap.forEach((summary) => {
            const count = purchasesByClassId.get(summary.classId) || 0;
            summary.totalPurchases = count;
          });
        }
      } catch (purchaseErr) {
        console.error("[useAcademyMetrics] ❌ Excepción obteniendo compras:", purchaseErr);
      }
      
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
      
      // Convertir a array y ordenar por total de asistentes (mayor primero)
      const byClass = Array.from(byClassMap.values()).sort((a, b) => b.totalAsistentes - a.totalAsistentes);
      
      return {
        global,
        perClass,
        byClass
      };
    },
    refetchInterval: 5000, // Refrescar cada 5 segundos
    staleTime: 0,
    gcTime: 0,
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

