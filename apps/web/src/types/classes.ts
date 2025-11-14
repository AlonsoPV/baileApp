export type Clase = {
  id: number;
  titulo: string;
  nombre?: string; // Alias para titulo
  descripcion?: string | null;

  // O recurrente por día fijo (0=Dom, 1=Lun,... 6=Sab)
  dia_semana?: number | null;
  diaSemana?: number | null; // Alias

  // O clase por fecha puntual (YYYY-MM-DD)
  fecha?: string | null;

  hora_inicio?: string | null; // 'HH:mm'
  hora_fin?: string | null;    // 'HH:mm'
  inicio?: string | null;      // Alias para hora_inicio
  fin?: string | null;         // Alias para hora_fin

  ubicacion?: string | null;
  ubicacionJson?: any; // Para ubicacion JSONB
  costo?: number | null;
  moneda?: string | null;

  academia_id?: number | null;
  maestro_id?: number | null;
  teacher_id?: number | null; // Alias
  cover_url?: string | null;
  nivel?: string | null; // opcional
  ritmo?: string | null; // opcional
  ritmos_seleccionados?: string[] | number[] | null;
  diasSemana?: Array<string | number> | null; // días recurrentes escritos
  cronogramaIndex?: number; // Índice original en el cronograma (para navegación)
};

