import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { buildICS, buildGoogleUrl } from "../utils/calendarUtils";

type AddToCalendarProps = {
  eventId: string | number;
  title: string;
  description?: string;
  location?: string;
  start: string | Date;
  end: string | Date;
  allDay?: boolean;
  showAsIcon?: boolean;
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
}: AddToCalendarProps) {
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [count, setCount] = useState<number>(0);
  const [user, setUser] = useState<any>(null);
  const [alreadyAdded, setAlreadyAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const eventIdStr = String(eventId);

  // Cargar usuario actual
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });
  }, []);

  // Cargar número de interesados
  useEffect(() => {
    const loadCount = async () => {
      const { count, error } = await supabase
        .from("eventos_interesados")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventIdStr);
      if (!error && typeof count === "number") {
        setCount(count);
      }
    };
    loadCount();
  }, [eventIdStr]);

  // Verificar si el usuario ya dio clic
  useEffect(() => {
    const checkIfAdded = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("eventos_interesados")
        .select("id")
        .eq("event_id", eventIdStr)
        .eq("user_id", user.id)
        .maybeSingle();
      setAlreadyAdded(!!data);
    };
    checkIfAdded();
  }, [user, eventIdStr]);

  const handleAdd = async (href: string) => {
    if (!user?.id) {
      alert("Inicia sesión para añadir al calendario 🙌");
      setOpen(false);
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
      const { error } = await supabase.from("eventos_interesados").insert({
        event_id: eventIdStr,
        user_id: user.id,
      });
      if (error) throw error;

      setAdded(true);
      setAlreadyAdded(true);
      setCount((prev) => prev + 1);

      setTimeout(() => setAdded(false), 2000);
      setOpen(false);
      window.open(href, "_blank");
    } catch (err) {
      console.error("Error al registrar interés:", err);
      alert("Error al añadir al calendario. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Validar y normalizar fechas
  const normalizedStart = useMemo(() => {
    try {
      if (!start) {
        console.warn('[AddToCalendarWithStats] No start date provided');
        return new Date(); // Fallback a fecha actual
      }
      const d = typeof start === 'string' ? new Date(start) : start;
      if (isNaN(d.getTime())) {
        console.warn('[AddToCalendarWithStats] Invalid start date:', start);
        return new Date(); // Fallback
      }
      return d;
    } catch (err) {
      console.error('[AddToCalendarWithStats] Error normalizing start date:', err);
      return new Date();
    }
  }, [start]);

  const normalizedEnd = useMemo(() => {
    try {
      if (!end) {
        console.warn('[AddToCalendarWithStats] No end date provided, using start + 2 hours');
        const defaultEnd = new Date(normalizedStart);
        defaultEnd.setHours(defaultEnd.getHours() + 2);
        return defaultEnd;
      }
      const d = typeof end === 'string' ? new Date(end) : end;
      if (isNaN(d.getTime())) {
        console.warn('[AddToCalendarWithStats] Invalid end date:', end);
        const defaultEnd = new Date(normalizedStart);
        defaultEnd.setHours(defaultEnd.getHours() + 2);
        return defaultEnd;
      }
      // Asegurar que end sea después de start
      if (d.getTime() <= normalizedStart.getTime()) {
        const correctedEnd = new Date(normalizedStart);
        correctedEnd.setHours(correctedEnd.getHours() + 2);
        return correctedEnd;
      }
      return d;
    } catch (err) {
      console.error('[AddToCalendarWithStats] Error normalizing end date:', err);
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
      console.error("[AddToCalendarWithStats] Error building ICS:", err);
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
      console.error("[AddToCalendarWithStats] Error building Google URL:", err);
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
      const menuHeight = 120; // Estimado
      
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
  }, [open]);

  if (showAsIcon) {
    return (
      <div ref={buttonRef} style={{ position: "relative", display: "inline-block" }}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
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
          title={added ? "✅ Añadido al calendario" : "📅 Añadir a calendario"}
        >
          {added ? "✅" : loading ? "⏳" : "📅"}
        </motion.button>

        {/* Contador en tooltip/modal pequeño */}
        <AnimatePresence initial={false}>
          {count > 0 && (
            <motion.div
              key={count}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.18 }}
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
            </motion.div>
          )}
        </AnimatePresence>

        {typeof document !== 'undefined' && document.body && createPortal(
          <>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9998,
                    background: 'rgba(0, 0, 0, 0.3)',
                  }}
                  onClick={() => setOpen(false)}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {open && menuPosition && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
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
                  <MenuItem 
                    label="Google Calendar" 
                    onClick={() => handleAdd(googleUrl)} 
                    icon="📅"
                  />
                  {icsBlobUrl && (
                    <MenuItem 
                      label="Apple Calendar (.ics)" 
                      onClick={() => handleAdd(icsBlobUrl)} 
                      icon="📱"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>,
          document.body
        )}
      </div>
    );
  }

  // Versión con botón completo y contador
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 12, flexWrap: 'wrap' }}>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
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
        aria-label={added ? "Evento añadido al calendario" : "Añadir evento al calendario"}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
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
            📅
          </span>
          <span>{added ? "Añadido" : loading ? "Cargando..." : "Añadir a calendario"}</span>
        </span>
      </motion.button>

      {/* Contador de interesados en formato pill */}
      <AnimatePresence initial={false}>
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
      </AnimatePresence>

  {typeof document !== 'undefined' && document.body && createPortal(
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(0, 0, 0, 0.3)',
            }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
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
            <MenuItem label="Google Calendar" onClick={() => handleAdd(googleUrl)} icon="📅" />
            {icsBlobUrl && (
              <MenuItem label="Apple Calendar (.ics)" onClick={() => handleAdd(icsBlobUrl)} icon="📱" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
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

