import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { buildICS, buildGoogleUrl, formatDateToLocalISO } from "../utils/calendarUtils";
import { calculateRecurringDates, calculateMultipleRecurringDates } from "../utils/calculateRecurringDates";
import { useAuth } from "@/contexts/AuthProvider";
import { isNativeApp } from "@/utils/isNativeApp";
import { getCalendarAddMenuVisibility } from "@/utils/calendarAddOptions";
import { logger } from "@/utils/logger";
import { CalendarDays } from "lucide-react";
import { useAddToCalendarStatus } from "@/hooks/useAddToCalendar";

type AddToCalendarProps = {
  eventId: string | number;
  title: string;
  description?: string;
  location?: string;
  start: string | Date;
  end: string | Date;
  allDay?: boolean;
  showAsIcon?: boolean;
  eventLink?: string; // URL del evento para descripción en calendario
  classId?: number;      // ID de clase (si es  diferente de eventId)
  academyId?: number;    // ID de academia dueña de la clase
  teacherId?: number;    // ID de maestro dueño de la clase
  // Rol de baile del usuario:
  // - 'lead' / 'follow' / 'ambos' vienen del front
  // - 'leader' / 'follower' son las formas normalizadas que guardamos en BD
  roleBaile?: 'lead' | 'follow' | 'ambos' | 'leader' | 'follower' | null;
  zonaTagId?: number | null; // ID de tag de zona
  // Información de la clase para calcular fechas específicas
  fecha?: string | null; // Fecha específica (YYYY-MM-DD) - si existe, no es recurrente
  diaSemana?: number | null; // Día de la semana (0-6) para clases recurrentes
  diasSemana?: number[] | null; // Array de días de la semana para clases con múltiples días
  /** Icono del botón ancho (no aplica a showAsIcon). */
  calendarGlyph?: "emoji" | "lucide-calendar-days";
};

export default function AddToCalendarWithStats({
  eventId,
  title,
  description,
  location,
  start,
  end,
  allDay,
  showAsIcon = false,
  eventLink,
  classId,
  academyId,
  teacherId,
  roleBaile,
  zonaTagId,
  fecha,
  diaSemana,
  diasSemana,
  calendarGlyph = "emoji",
}: AddToCalendarProps) {
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [calendarError, setCalendarError] = useState<{ code?: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [countOverride, setCountOverride] = useState<number | null>(null);
  const [alreadyAddedOverride, setAlreadyAddedOverride] = useState<boolean | null>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const eventIdStr = String(eventId);

  // Determinar si es una clase (tiene classId, academyId o teacherId)
  const isClass = !!(classId || academyId || teacherId);
  const { count: fetchedCount, alreadyAdded: fetchedAlreadyAdded } = useAddToCalendarStatus({
    eventId,
    userId: user?.id,
    classId,
    fecha,
  });

  useEffect(() => {
    setCountOverride(null);
  }, [fetchedCount]);

  useEffect(() => {
    setAlreadyAddedOverride(null);
  }, [fetchedAlreadyAdded]);

  const count = countOverride ?? fetchedCount;
  const alreadyAdded = alreadyAddedOverride ?? fetchedAlreadyAdded;

  const inNative = isNativeApp(routerLocation.search);
  const calAddOpts = useMemo(() => getCalendarAddMenuVisibility(), []);

  const invalidateRelatedMetrics = React.useCallback(() => {
    if (academyId) {
      qc.invalidateQueries({ queryKey: ["academy-class-metrics", academyId] });
      qc.refetchQueries({ queryKey: ["academy-class-metrics", academyId] });
      qc.invalidateQueries({ queryKey: ["academy-metrics"] });
      qc.refetchQueries({ queryKey: ["academy-metrics"] });
      qc.invalidateQueries({ queryKey: ["academy-students-global", academyId] });
      qc.invalidateQueries({ queryKey: ["academy-students-list", academyId] });
    }
    if (teacherId) {
      qc.invalidateQueries({ queryKey: ["teacher-class-metrics", teacherId] });
      qc.refetchQueries({ queryKey: ["teacher-class-metrics", teacherId] });
      qc.invalidateQueries({ queryKey: ["teacher-students-global", teacherId] });
      qc.invalidateQueries({ queryKey: ["teacher-students-list", teacherId] });
    }
    qc.invalidateQueries({ queryKey: ["my-class-attendance"] });
  }, [academyId, teacherId, qc]);

  useEffect(() => {
    if (!inNative) return;
    const handler = (e: CustomEvent<{ ok: boolean; code?: string; message: string }>) => {
      const d = e.detail;
      setLoading(false);
      setOpen(false);
      if (d.ok) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      } else {
        setCalendarError({ code: d.code, message: d.message });
      }
    };
    window.addEventListener("baileapp:add-to-calendar-result", handler as EventListener);
    return () => window.removeEventListener("baileapp:add-to-calendar-result", handler as EventListener);
  }, [inNative]);

  const getNativePayload = () => ({
    title,
    start: formatDateToLocalISO(normalizedStart),
    end: formatDateToLocalISO(normalizedEnd),
    location: location || undefined,
    description: description || undefined,
    eventLink: eventLink || undefined,
  });

  const handleAddNative = async () => {
    if (!user?.id) {
      setOpen(false);
      navigate("/auth/login", { state: { from: routerLocation.pathname + routerLocation.search } });
      return;
    }
    if (alreadyAdded) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      setOpen(false);
      const rn = (window as any).ReactNativeWebView;
      if (rn?.postMessage) {
        rn.postMessage(JSON.stringify({ type: "ADD_TO_CALENDAR", requestId: String(Date.now()), payload: getNativePayload() }));
      }
      return;
    }
    setLoading(true);
    setCalendarError(null);
    try {
      const { error: errorInteresados } = await supabase.from("eventos_interesados").insert({
        event_id: eventIdStr,
        user_id: user.id,
      });
      if (errorInteresados) throw errorInteresados;
      const finalClassId = classId || (typeof eventId === "number" ? eventId : Number(eventIdStr));
      if (typeof finalClassId === "number" && !Number.isNaN(finalClassId)) {
        let normalizedRoleBaile = roleBaile;
        if (roleBaile === "lead") normalizedRoleBaile = "leader";
        else if (roleBaile === "follow") normalizedRoleBaile = "follower";
        let fechasEspecificas: (string | null)[] = [];
        if (fecha) fechasEspecificas = [fecha];
        else if (diasSemana && Array.isArray(diasSemana) && diasSemana.length > 0)
          fechasEspecificas = calculateMultipleRecurringDates(diasSemana, 3);
        else if (diaSemana != null && typeof diaSemana === "number")
          fechasEspecificas = calculateRecurringDates(diaSemana, 3);
        else fechasEspecificas = [null as any];
        const insertPayloads = fechasEspecificas.map((fechaEspecifica) => ({
          user_id: user.id,
          class_id: finalClassId,
          academy_id: academyId || null,
          teacher_id: teacherId || null,
          role_baile: normalizedRoleBaile || null,
          zona_tag_id: zonaTagId || null,
          status: "tentative" as const,
          fecha_especifica: fechaEspecifica || null,
        }));
        await supabase.from("clase_asistencias").upsert(insertPayloads, {
          onConflict: "user_id,class_id,fecha_especifica",
        });
        invalidateRelatedMetrics();
      }
      setAdded(true);
      setAlreadyAddedOverride(true);
      setCountOverride((prev) => (prev ?? fetchedCount) + 1);
      const rn = (window as any).ReactNativeWebView;
      if (rn?.postMessage) {
        rn.postMessage(
          JSON.stringify({
            type: "ADD_TO_CALENDAR",
            requestId: String(Date.now()),
            payload: getNativePayload(),
          })
        );
      } else {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      alert(t("error_adding_calendar"));
    }
  };

  const handleOpenSettings = () => {
    setCalendarError(null);
    const rn = (window as any).ReactNativeWebView;
    if (rn?.postMessage) rn.postMessage(JSON.stringify({ type: "OPEN_SETTINGS" }));
  };

  const handleFallbackGoogle = () => {
    setCalendarError(null);
    const rn = (window as any).ReactNativeWebView;
    if (rn?.postMessage)
      rn.postMessage(
        JSON.stringify({
          type: "ADD_TO_CALENDAR_FALLBACK_GOOGLE",
          payload: getNativePayload(),
        })
      );
  };

  const handleFallbackICS = () => {
    setCalendarError(null);
    try {
      const ics = buildICS({
        title,
        description,
        location,
        start: normalizedStart,
        end: normalizedEnd,
        allDay,
      });
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "donde-bailar-evento.ics";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const handleAdd = async (href: string) => {
    if (!user?.id) {
      // TEMP: sin login permitir abrir enlace (Google Calendar / ICS) sin registrar en backend
      setOpen(false);
      window.open(href, "_blank");
      return;
    }

    if (alreadyAdded) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      setOpen(false);
      window.open(href, "_blank");
      return;
    }

    setLoading(true);
    try {
      // Registrar en eventos_interesados (lógica existente)
      const { error: errorInteresados } = await supabase.from("eventos_interesados").insert({
        event_id: eventIdStr,
        user_id: user.id,
      });
      if (errorInteresados) throw errorInteresados;

      // Registrar asistencia tentativa en clase_asistencias (si hay classId o academyId)
      const finalClassId = classId || (typeof eventId === 'number' ? eventId : Number(eventIdStr));



      // Validar que classId sea un número válido (incluyendo 0)
      if (typeof finalClassId === 'number' && !Number.isNaN(finalClassId)) {

        try {
          // Normalizar role_baile: convertir 'lead' a 'leader' y 'follow' a 'follower' para consistencia
          let normalizedRoleBaile = roleBaile;
          if (roleBaile === 'lead') normalizedRoleBaile = 'leader';
          else if (roleBaile === 'follow') normalizedRoleBaile = 'follower';

          // Calcular fechas específicas para clases recurrentes
          let fechasEspecificas: string[] = [];

          // Si tiene fecha específica, usar solo esa fecha
          if (fecha) {
            fechasEspecificas = [fecha];
          }
          // Si tiene múltiples días de la semana, calcular todas las fechas
          else if (diasSemana && Array.isArray(diasSemana) && diasSemana.length > 0) {
            fechasEspecificas = calculateMultipleRecurringDates(diasSemana, 3);
          }
          // Si tiene un solo día de la semana, calcular fechas recurrentes
          else if (diaSemana !== null && diaSemana !== undefined && typeof diaSemana === 'number') {
            fechasEspecificas = calculateRecurringDates(diaSemana, 3);
          }
          // Si no tiene fecha ni día, usar null (clase sin fecha específica)
          else {
            fechasEspecificas = [null as any]; // null significa sin fecha específica
          }

          console.log("[AddToCalendarWithStats] 📅 Fechas específicas calculadas:", fechasEspecificas);

          // Insertar un registro por cada fecha específica
          const insertPayloads = fechasEspecificas.map(fechaEspecifica => ({
            user_id: user.id,
            class_id: finalClassId,
            academy_id: academyId || null,
            teacher_id: teacherId || null,
            role_baile: normalizedRoleBaile || null,
            zona_tag_id: zonaTagId || null,
            status: "tentative" as const,
            fecha_especifica: fechaEspecifica || null,
          }));

          // Insertar todos los registros
          const { data: insertData, error: insertError } = await supabase
            .from("clase_asistencias")
            .insert(insertPayloads)
            .select();

          if (insertError) {
            // Si hay conflictos (algunos registros ya existen), intentar actualizar solo los que faltan
            if (insertError.code === '23505') {

              // Para cada fecha, intentar insertar o actualizar
              const results = await Promise.allSettled(
                insertPayloads.map(async (payload) => {
                  const { data: upsertData, error: upsertError } = await supabase
                    .from("clase_asistencias")
                    .upsert(payload, {
                      onConflict: 'user_id,class_id,fecha_especifica',
                    })
                    .select();

                  if (upsertError) {

                    throw upsertError;
                  }
                  return upsertData;
                })
              );

              const successful = results.filter(r => r.status === 'fulfilled').length;
            } else {
              logger.error("[AddToCalendarWithStats] Error insertando asistencias:", insertError);
            }
          }

          // Invalidar y refetch queries de métricas si hay academyId o teacherId
          invalidateRelatedMetrics();
        } catch (err) {
          logger.error("[AddToCalendarWithStats] Error inesperado:", err);
        }
      } else {
        logger.warn("[AddToCalendarWithStats] No se puede insertar: classId inválido o NaN", {
          finalClassId,
          classId,
          eventId,
          eventIdStr,
        });
      }

      setAdded(true);
      setAlreadyAddedOverride(true);
      setCountOverride((prev) => (prev ?? fetchedCount) + 1);

      setTimeout(() => setAdded(false), 2000);
      setOpen(false);
      window.open(href, "_blank");
    } catch (err) {

      alert(t('error_adding_calendar'));
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para validar formato de hora (HH:MM o HH:MM:SS)
  const isValidTimeFormat = (timeStr: string): boolean => {
    if (!timeStr || typeof timeStr !== 'string') return false;
    // Acepta HH:MM o HH:MM:SS
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return timeRegex.test(timeStr);
  };

  // Función auxiliar para extraer y validar hora de un string de fecha
  // IMPORTANTE: Trata todas las fechas como hora local, ignorando Z (UTC) u offsets
  // Esto evita que 10:00 CDMX se convierta en 4:00 am al interpretarse como UTC
  const extractAndValidateTime = (dateInput: string | Date): { isValid: boolean; date: Date | null; error?: string } => {
    try {
      // Si ya es un objeto Date, validarlo directamente
      if (dateInput instanceof Date) {
        return { isValid: !isNaN(dateInput.getTime()), date: dateInput };
      }

      // Si es string, extraer fecha y hora ignorando zona horaria (Z, +00:00, etc.)
      const dateStr = String(dateInput);

      // 1️⃣ Si viene en formato ISO con Z u offset, extraer solo fecha y hora
      //    y reconstruir como hora local (sin Z)
      const isoMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}(?::\d{2})?(?:\.\d{3})?)/);
      if (isoMatch) {
        const [, fecha, hora] = isoMatch;
        if (isValidTimeFormat(hora)) {
          // Extraer horas, minutos y segundos (si existen)
          const [h, m, s = '00'] = hora.split(':');
          // Reconstruir como fecha local (SIN Z) para que se interprete como hora local
          const localDate = new Date(`${fecha}T${h}:${m}:${s}`);
          if (!isNaN(localDate.getTime())) {

            return { isValid: true, date: localDate };
          }
        }
      }

      // 2️⃣ Si no es formato ISO "bonito", intentar parsear normal
      //    pero si tiene Z u offset, extraer solo la parte de fecha/hora
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        // Si el string original tenía Z u offset, reconstruir como local
        if (dateStr.includes('Z') || dateStr.match(/[+-]\d{2}:\d{2}$/)) {
          // Extraer componentes de la fecha parseada y reconstruir como local
          const year = parsed.getFullYear();
          const month = String(parsed.getMonth() + 1).padStart(2, '0');
          const day = String(parsed.getDate()).padStart(2, '0');
          const hours = String(parsed.getHours()).padStart(2, '0');
          const minutes = String(parsed.getMinutes()).padStart(2, '0');
          const seconds = String(parsed.getSeconds()).padStart(2, '0');
          const localDate = new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
          if (!isNaN(localDate.getTime())) {

            return { isValid: true, date: localDate };
          }
        }
        return { isValid: true, date: parsed };
      }

      return { isValid: false, date: null, error: 'Invalid date format' };
    } catch (err) {
      return { isValid: false, date: null, error: String(err) };
    }
  };

  // Validar y normalizar fechas
  const normalizedStart = useMemo(() => {
    try {
      if (!start) {

        return new Date(); // Fallback a fecha actual
      }

      const validation = extractAndValidateTime(start);

      if (!validation.isValid || !validation.date) {

        return new Date(); // Fallback
      }

      const d = validation.date;



      return d;
    } catch (err) {

      return new Date();
    }
  }, [start]);

  const normalizedEnd = useMemo(() => {
    try {
      if (!end) {
        const defaultEnd = new Date(normalizedStart);
        defaultEnd.setHours(defaultEnd.getHours() + 2);
        return defaultEnd;
      }

      const validation = extractAndValidateTime(end);

      if (!validation.isValid || !validation.date) {

        const defaultEnd = new Date(normalizedStart);
        defaultEnd.setHours(defaultEnd.getHours() + 2);
        return defaultEnd;
      }

      const d = validation.date;

      // Asegurar que end sea después de start
      if (d.getTime() <= normalizedStart.getTime()) {

        const correctedEnd = new Date(normalizedStart);
        correctedEnd.setHours(correctedEnd.getHours() + 2);
        return correctedEnd;
      }

      // Log para depuración


      return d;
    } catch (err) {

      const defaultEnd = new Date(normalizedStart);
      defaultEnd.setHours(defaultEnd.getHours() + 2);
      return defaultEnd;
    }
  }, [end, normalizedStart]);

  // Construir URLs
  const icsBlobUrl = useMemo(() => {
    try {
      const ics = buildICS({
        title,
        description,
        location,
        start: normalizedStart,
        end: normalizedEnd,
        allDay
      });
      return URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    } catch (err) {

      return null;
    }
  }, [title, description, location, normalizedStart, normalizedEnd, allDay]);

  const googleUrl = useMemo(() => {
    try {
      return buildGoogleUrl({
        title,
        description: description || "",
        location: location || "",
        start: normalizedStart,
        end: normalizedEnd,
        allDay,
      });
    } catch (err) {

      // Devolver URL genérica de Google Calendar como fallback
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
      });
      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    }
  }, [title, description, location, normalizedStart, normalizedEnd, allDay]);

  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 200;
      const icsVisible = !!(icsBlobUrl && calAddOpts.showIcsOption);
      const rowCount = inNative ? (icsVisible ? 3 : 2) : icsVisible ? 2 : 1;
      const menuHeight = rowCount * 49;

      // Calcular posición, asegurándose de que esté dentro del viewport
      let left = rect.right - menuWidth;
      let top = rect.bottom + 8;

      // Ajustar si se sale por la derecha
      if (left < 8) {
        left = 8;
      }

      // Ajustar si se sale por abajo
      if (top + menuHeight > window.innerHeight - 8) {
        top = rect.top - menuHeight - 8;
      }

      // Ajustar si se sale por arriba
      if (top < 8) {
        top = 8;
      }

      setMenuPosition({
        top,
        left,
      });
    } else {
      setMenuPosition(null);
    }
  }, [open, inNative, icsBlobUrl, calAddOpts.showIcsOption]);

  // TEMP: candado desactivado — siempre mostrar botón de calendario (ICS/Google sin login)
  // Antes: isClass && !user?.id mostraba botón "Inicia sesión para añadir al calendario"

  if (showAsIcon) {
    return (
      <div ref={buttonRef} style={{ position: "relative", display: "inline-block" }}>
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={loading}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.18)',
            background: added
              ? 'linear-gradient(135deg, rgba(76,175,80,.25), rgba(76,175,80,.15))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06))',
            color: '#fff',
            fontSize: '20px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: loading ? 0.7 : 1,
            boxShadow: added
              ? '0 6px 16px rgba(76,175,80,0.25)'
              : '0 6px 16px rgba(0,0,0,0.25)',
          }}
          title={added ? t('added_calendar_tooltip') : t('add_calendar_tooltip')}
          aria-label={added ? t('event_added_calendar') : t('add_event_calendar')}
        >
          {added ? "✅" : loading ? "⏳" : "📅"}
        </button>

        {/* Contador en tooltip/modal pequeño */}
        {count > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              minWidth: '20px',
              height: '20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7F7CFF, #21D4FD)',
              color: 'white',
              fontSize: '10px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 6px',
              boxShadow: '0 2px 10px rgba(33, 212, 253, 0.35)',
              border: '2px solid rgba(255, 255, 255, 0.95)',
              zIndex: 5
            }}
            aria-live="polite"
          >
            {count > 99 ? '99+' : count}
          </div>
        )}

        {typeof document !== 'undefined' && document.body && createPortal(
          <>
            {calendarError && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 10000,
                  background: "rgba(0,0,0,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 24,
                }}
                onClick={() => setCalendarError(null)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "rgba(20,20,28,0.98)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 16,
                    padding: 24,
                    maxWidth: 360,
                    width: "100%",
                  }}
                >
                    <h3 style={{ color: "#fff", marginBottom: 12, fontSize: 18, fontWeight: 700 }}>
                      {calendarError.code === "PERMISSION_DENIED"
                        ? t("calendar_permission_required")
                        : t("calendar_add_failed")}
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: 20, fontSize: 14 }}>
                      {calendarError.message}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {calendarError.code === "PERMISSION_DENIED" && (
                        <button
                          onClick={handleOpenSettings}
                          style={{
                            padding: 12,
                            borderRadius: 10,
                            background: "linear-gradient(135deg, #7F7CFF, #21D4FD)",
                            color: "#000",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {t("calendar_open_settings")}
                        </button>
                      )}
                      <button
                        onClick={handleFallbackGoogle}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          background: "rgba(255,255,255,0.12)",
                          color: "#fff",
                          fontWeight: 600,
                          border: "1px solid rgba(255,255,255,0.25)",
                          cursor: "pointer",
                        }}
                      >
                        {t("google_calendar")}
                      </button>
                      {icsBlobUrl && calAddOpts.showIcsOption && (
                        <button
                          onClick={handleFallbackICS}
                          style={{
                            padding: 12,
                            borderRadius: 10,
                            background: "rgba(255,255,255,0.08)",
                            color: "#fff",
                            fontWeight: 600,
                            border: "1px solid rgba(255,255,255,0.2)",
                            cursor: "pointer",
                          }}
                        >
                          {t(calAddOpts.icsLabelKey)}
                        </button>
                      )}
                      <button
                        onClick={() => setCalendarError(null)}
                        style={{
                          padding: 10,
                          color: "rgba(255,255,255,0.7)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        {t("close")}
                      </button>
                    </div>
                </div>
              </div>
            )}
            {open && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 9998,
                  background: 'rgba(0, 0, 0, 0.3)',
                }}
                onClick={() => setOpen(false)}
              />
            )}
            {open && menuPosition && (
              <div
                style={{
                  position: 'fixed',
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                  minWidth: 200,
                  background: 'rgba(20,20,28,0.98)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  boxShadow: '0 18px 44px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  zIndex: 9999,
                  backdropFilter: 'blur(20px)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                  {inNative ? (
                    <>
                      <MenuItem
                        label={t('add_to_calendar_button')}
                        onClick={() => handleAddNative()}
                        icon="📅"
                      />
                      <MenuItem
                        label={t('google_calendar')}
                        onClick={() => handleAdd(googleUrl)}
                        icon="📅"
                      />
                      {icsBlobUrl && calAddOpts.showIcsOption && (
                        <MenuItem
                          label={t(calAddOpts.icsLabelKey)}
                          onClick={() => handleAdd(icsBlobUrl)}
                          icon="📱"
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <MenuItem
                        label={t('google_calendar')}
                        onClick={() => handleAdd(googleUrl)}
                        icon="📅"
                      />
                      {icsBlobUrl && calAddOpts.showIcsOption && (
                        <MenuItem
                          label={t(calAddOpts.icsLabelKey)}
                          onClick={() => handleAdd(icsBlobUrl)}
                          icon="📱"
                        />
                      )}
                    </>
                  )}
              </div>
            )}
          </>,
          document.body
        )}
      </div>
    );
  }

  // Versión con botón completo y contador
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 12, flexWrap: 'wrap' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        style={{
          padding: "12px 16px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.18)",
          background: added
            ? "linear-gradient(135deg, rgba(76,175,80,.30), rgba(76,175,80,.18))"
            : "linear-gradient(135deg, rgba(127,124,255,0.18), rgba(33,212,253,0.14))",
          color: "#fff",
          fontWeight: 900,
          letterSpacing: '.01em',
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: added ? "0 10px 26px rgba(76,175,80,0.30)" : "0 10px 28px rgba(0,0,0,0.35)",
          backdropFilter: "blur(8px)",
          opacity: loading ? 0.7 : 1,
        }}
        aria-label={added ? t('event_added_calendar') : t('add_event_calendar')}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {calendarGlyph === "lucide-calendar-days" ? (
            loading ? (
              <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
                ⏳
              </span>
            ) : (
              <CalendarDays
                className="lucide lucide-calendar-days"
                size={20}
                strokeWidth={2.25}
                color="rgba(255,255,255,0.95)"
                aria-hidden
              />
            )
          ) : (
            <span
              aria-hidden
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: added
                  ? 'linear-gradient(135deg, #4CAF50, #81C784)'
                  : 'linear-gradient(135deg, #7F7CFF, #21D4FD)',
                boxShadow: added
                  ? '0 4px 10px rgba(129,199,132,0.35)'
                  : '0 4px 10px rgba(33,212,253,0.35)'
              }}
            >
              {loading ? "⏳" : "📅"}
            </span>
          )}
          <span>{added ? t('added_to_calendar') : loading ? t('adding_to_calendar') : t('add_to_calendar_button')}</span>
        </span>
      </button>

      {/* Contador de interesados en formato pill */}
      {/* <AnimatePresence initial={false}>
        {count > 0 && (
          <motion.div
            key={count}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 12px',
              borderRadius: 999,
              background: 'linear-gradient(135deg, rgba(127,124,255,.28), rgba(33,212,253,.22))',
              border: '1px solid rgba(255,255,255,0.22)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 900,
              boxShadow: '0 8px 22px rgba(33,212,253,0.25)',
              backdropFilter: 'blur(8px)'
            }}
            aria-live="polite"
          >
            <span
              aria-hidden
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, #7F7CFF, #21D4FD)',
                boxShadow: '0 2px 8px rgba(33,212,253,0.35)'
              }}
            >
              👥
            </span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</span>
            <span style={{ opacity: 0.9 }}>interesado{count !== 1 ? 's' : ''}</span>
          </motion.div>
        )}
      </AnimatePresence> */}

      {typeof document !== 'undefined' && document.body && createPortal(
        <>
          {calendarError && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 10000,
                background: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
              }}
              onClick={() => setCalendarError(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "rgba(20,20,28,0.98)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 16,
                  padding: 24,
                  maxWidth: 360,
                  width: "100%",
                }}
              >
                  <h3 style={{ color: "#fff", marginBottom: 12, fontSize: 18, fontWeight: 700 }}>
                    {calendarError.code === "PERMISSION_DENIED"
                      ? t("calendar_permission_required")
                      : t("calendar_add_failed")}
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: 20, fontSize: 14 }}>
                    {calendarError.message}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {calendarError.code === "PERMISSION_DENIED" && (
                      <button
                        onClick={handleOpenSettings}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          background: "linear-gradient(135deg, #7F7CFF, #21D4FD)",
                          color: "#000",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {t("calendar_open_settings")}
                      </button>
                    )}
                    <button
                      onClick={handleFallbackGoogle}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.12)",
                        color: "#fff",
                        fontWeight: 600,
                        border: "1px solid rgba(255,255,255,0.25)",
                        cursor: "pointer",
                      }}
                    >
                      {t("google_calendar")}
                    </button>
                    {icsBlobUrl && calAddOpts.showIcsOption && (
                      <button
                        onClick={handleFallbackICS}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          background: "rgba(255,255,255,0.08)",
                          color: "#fff",
                          fontWeight: 600,
                          border: "1px solid rgba(255,255,255,0.2)",
                          cursor: "pointer",
                        }}
                      >
                        {t(calAddOpts.icsLabelKey)}
                      </button>
                    )}
                    <button
                      onClick={() => setCalendarError(null)}
                      style={{
                        padding: 10,
                        color: "rgba(255,255,255,0.7)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      {t("close")}
                    </button>
                  </div>
              </div>
            </div>
          )}
          {open && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9998,
                background: 'rgba(0, 0, 0, 0.3)',
              }}
              onClick={() => setOpen(false)}
            />
          )}
          {open && (
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                minWidth: 240,
                background: "rgba(20,20,28,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                boxShadow: "0 18px 44px rgba(0,0,0,0.45)",
                overflow: "hidden",
                zIndex: 9999,
                backdropFilter: "blur(20px)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
                {inNative ? (
                  <>
                    <MenuItem label={t('add_to_calendar_button')} onClick={() => handleAddNative()} icon="📅" />
                    <MenuItem label={t('google_calendar')} onClick={() => handleAdd(googleUrl)} icon="📅" />
                    {icsBlobUrl && calAddOpts.showIcsOption && (
                      <MenuItem label={t(calAddOpts.icsLabelKey)} onClick={() => handleAdd(icsBlobUrl)} icon="📱" />
                    )}
                  </>
                ) : (
                  <>
                    <MenuItem label={t('google_calendar')} onClick={() => handleAdd(googleUrl)} icon="📅" />
                    {icsBlobUrl && calAddOpts.showIcsOption && (
                      <MenuItem label={t(calAddOpts.icsLabelKey)} onClick={() => handleAdd(icsBlobUrl)} icon="📱" />
                    )}
                  </>
                )}
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  );
}

function MenuItem({ label, onClick, icon }: { label: string; onClick: () => void; icon?: string }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 16px",
        color: "#fff",
        fontSize: 14,
        cursor: "pointer",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        transition: "background 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      <span style={{ fontWeight: 500 }}>{label}</span>
    </div>
  );
}

