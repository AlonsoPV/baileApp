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
  media: any[];
  estado_aprobacion: Aprobacion; 
  created_at: string;
};

export type EventDate = {
  id: number; 
  parent_id: number; 
  fecha: string; 
  hora_inicio?: string|null; 
  hora_fin?: string|null;
  lugar?: string|null; 
  direccion?: string|null; 
  ciudad?: string|null;
  zona?: number|null; 
  estilos: number[]; 
  media: any[]; 
  estado_publicacion: PubEstado;
  requisitos?: string|null; 
  created_at: string;
};

export type RSVPCount = { 
  event_date_id: number; 
  voy: number; 
  interesado: number; 
  no_voy: number; 
};