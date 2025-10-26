export type AcademyLocation = { 
  sede?: string; 
  direccion?: string; 
  ciudad?: string; 
  zona_id?: number|null 
};

export type AcademyHorario = { 
  dia: string; 
  desde?: string; 
  hasta?: string; 
  ritmo_id?: number|null 
};

export type AcademyProfile = {
  id?: number;
  user_id: string;
  nombre_publico: string;
  bio?: string | null;
  avatar_url?: string | null;
  portada_url?: string | null;
  estilos?: number[]; // Columna existente en la BD
  ritmos: number[];
  zonas: number[];
  redes_sociales?: {
    instagram?: string|null;
    tiktok?: string|null;
    youtube?: string|null;
    facebook?: string|null;
    whatsapp?: string|null;
    web?: string|null;
  };
  respuestas?: any; // Columna existente en la BD
  ubicaciones: AcademyLocation[];
  horarios: AcademyHorario[];
  media: { type: 'image'|'video'; url: string }[];
  estado_aprobacion: 'borrador'|'en_revision'|'aprobado'|'rechazado';
  created_at?: string;
  updated_at?: string;
};
