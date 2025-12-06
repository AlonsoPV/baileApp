// src/types/db.ts

import { MediaItem } from '../lib/storage';

export interface Tag {
  id: number;
  tipo: 'ritmo' | 'zona';
  nombre: string;
  slug: string;
}

export interface ProfileUser {
  user_id: string;
  email?: string;  // Email del usuario
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  // Rol de baile del usuario (solo usuario final, no academias/organizadores)
  rol_baile?: 'lead' | 'follow' | 'ambos';
  ritmos: number[];
  zonas: number[];
  premios: any[];
  respuestas: Record<string, any>;
  media?: MediaItem[];  // Sprint 3 - Media items
  created_at: string;
  redes_sociales?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
}

