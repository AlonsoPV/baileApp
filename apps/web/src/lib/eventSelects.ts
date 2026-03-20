/**
 * Selects mínimos para eventos — reduce payload en Explore (cards) vs detalle.
 * Ver OPTIMIZATION_PLAN.md Fase 1.2, 1.3
 */

/** Columnas para cards en Explore (lista). Mínimo para card + navegación + RSVP. */
export const SELECT_EVENTS_CARD = `
  id,
  parent_id,
  organizer_id,
  nombre,
  djs,
  fecha,
  dia_semana,
  hora_inicio,
  hora_fin,
  lugar,
  ciudad,
  zona,
  estilos,
  ritmos_seleccionados,
  costos,
  flyer_url,
  updated_at,
  events_parent(
    id,
    nombre,
    organizer_id
  )
`;

/** Columnas para detalle (EventDatePublicScreen). Incluye media, costos, cronograma. */
export const SELECT_EVENTS_DETAIL = `
  id,
  parent_id,
  organizer_id,
  nombre,
  biografia,
  fecha,
  dia_semana,
  hora_inicio,
  hora_fin,
  lugar,
  direccion,
  ciudad,
  zona,
  zonas,
  referencias,
  requisitos,
  telefono_contacto,
  mensaje_contacto,
  estado_publicacion,
  estilos,
  ritmos_seleccionados,
  costos,
  cronograma,
  media,
  flyer_url,
  created_at,
  updated_at,
  events_parent(
    id,
    nombre,
    biografia,
    descripcion,
    estilos,
    ritmos_seleccionados,
    zonas,
    media,
    organizer_id
  )
`;
