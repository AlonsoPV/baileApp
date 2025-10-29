import React, { useEffect, useMemo, useState } from "react";
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

  // Construir URLs
  const icsBlobUrl = useMemo(() => {
    try {
      const ics = buildICS({ title, description, location, start, end, allDay });
      return URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    } catch (err) {
      console.error("Error building ICS:", err);
      return null;
    }
  }, [title, description, location, start, end, allDay]);

  const googleUrl = useMemo(
    () =>
      buildGoogleUrl({
        title,
        description: description || "",
        location: location || "",
        start,
        end,
        allDay,
      }),
    [title, description, location, start, end, allDay]
  );

  if (showAsIcon) {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen((v) => !v)}
          disabled={loading}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.2)',
            background: added 
              ? 'rgba(76, 175, 80, 0.2)' 
              : 'rgba(255,255,255,0.08)',
            color: '#fff',
            fontSize: '20px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: loading ? 0.6 : 1,
          }}
          title={added ? "✅ Añadido al calendario" : "📅 Añadir a calendario"}
        >
          {added ? "✅" : loading ? "⏳" : "📅"}
        </motion.button>

        {/* Contador en tooltip/modal pequeño */}
        {count > 0 && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            minWidth: '20px',
            height: '20px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f093fb, #f5576c)',
            color: 'white',
            fontSize: '10px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 2px 8px rgba(240, 147, 251, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.9)',
            zIndex: 5
          }}>
            {count > 99 ? '99+' : count}
          </div>
        )}

        {/* Overlay para cerrar menú */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 999,
                background: 'rgba(0, 0, 0, 0.3)',
              }}
              onClick={() => setOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Menú de opciones */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                minWidth: 200,
                background: 'rgba(20,20,28,0.98)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 12,
                boxShadow: '0 18px 44px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                zIndex: 1000,
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
      </div>
    );
  }

  // Versión con botón completo y contador
  return (
    <div style={{ position: "relative", display: "inline-block", textAlign: "center" }}>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.14)",
          background: added 
            ? "rgba(76, 175, 80, 0.2)" 
            : "rgba(255,255,255,0.06)",
          color: "#fff",
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
          backdropFilter: "blur(8px)",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {added ? "✅ Añadido" : loading ? "⏳ Cargando..." : "📅 Añadir a calendario"}
      </motion.button>

      {/* Contador de interesados */}
      {count > 0 && (
        <div style={{ 
          fontSize: 13, 
          color: "rgba(255,255,255,0.8)", 
          marginTop: 4, 
          textAlign: "center" 
        }}>
          👯‍♀️ {count} persona{count !== 1 ? "s" : ""} planean asistir
        </div>
      )}

      {/* Overlay para cerrar menú */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
              background: 'rgba(0, 0, 0, 0.3)',
            }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menú de opciones */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              top: "110%",
              right: 0,
              minWidth: 240,
              background: "rgba(20,20,28,0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              boxShadow: "0 18px 44px rgba(0,0,0,0.45)",
              overflow: "hidden",
              zIndex: 1000,
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

