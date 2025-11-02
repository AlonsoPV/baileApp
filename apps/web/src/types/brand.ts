export type BrandProduct = {
  id?: string; // uuid local o nanoid
  titulo: string;
  precio?: number | null;
  moneda?: 'MXN'|'USD'|'EUR'|string;
  url_externa?: string;
  imagen_url?: string;
  category?: 'calzado'|'ropa'|'accesorios'|string;
};

export type BrandProfile = {
  id?: number;
  user_id: string;
  nombre_publico: string;
  bio?: string | null;
  avatar_url?: string | null;
  portada_url?: string | null;
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
  media: { type: 'image'|'video'; url: string }[];
  productos: BrandProduct[];
  size_guide?: { mx: string; us: string; eu: string }[];
  fit_tips?: { style: string; tip: string }[];
  policies?: { shipping?: string; returns?: string; warranty?: string };
  conversion?: { headline?: string; subtitle?: string; coupons?: string[] };
  estado_aprobacion: 'borrador'|'en_revision'|'aprobado'|'rechazado';
  created_at?: string;
  updated_at?: string;
};
