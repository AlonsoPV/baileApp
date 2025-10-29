export type Aprobacion = 'borrador'|'en_revision'|'aprobado'|'rechazado';
export type PubEstado = 'borrador'|'publicado';
export type RSVPStatus = 'voy'|'interesado'|'no_voy';

export type Organizer = {
  id: number; 
  user_id: string; 
  nombre_publico: string; 
  bio?: string|null;
  media: any[]; 
  estado_aprobacion: Aprobacion; 
  created_at: string;
};

export type EventParent = {
  id: number; 
  organizer_id: number; 
  nombre: string; 
  descripcion?: string|null;
  estilos: number[]; 
  sede_general?: string|null; 
  ubicaciones?: any[]; // Ubicaciones del evento
  media: any[];
  created_at: string;
};

export type EventDate = {
  id: number; 
  parent_id: number; 
  nombre?: string|null; // Nombre de la fecha
  biografia?: string|null; // Biografía de la fecha
  fecha: string; 
  hora_inicio?: string|null; 
  hora_fin?: string|null;
  lugar?: string|null; 
  direccion?: string|null; 
  ciudad?: string|null;
  zona?: number|null; 
  zonas?: number[]; // Múltiples zonas
  referencias?: string|null; // Referencias de ubicación
  requisitos?: string|null; 
  cronograma?: any[]; // Cronograma de actividades
  costos?: any[]; // Costos y promociones
  flyer_url?: string|null; // URL del flyer del evento
  estilos: number[]; 
  media: any[]; 
  estado_publicacion: PubEstado;
  created_at: string;
};

export type RSVPCount = { 
  event_date_id: number; 
  voy: number; 
  interesado: number; 
  no_voy: number; 
};

export type EventSchedule = {
  id?: number;
  event_date_id: number;
  tipo: "clase" | "show" | "social" | "otro";
  titulo: string;
  descripcion?: string;
  hora_inicio: string;
  hora_fin?: string;
  ritmo?: number;
};

export type EventPrice = {
  id?: number;
  event_date_id: number;
  tipo: "preventa" | "taquilla" | "promo";
  nombre: string;
  monto?: number;
  descripcion?: string;
  hora_inicio?: string;
  hora_fin?: string;
  descuento?: number;
};