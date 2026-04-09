import { SITE_URL } from "./siteUrl";

const BASE_URL = SITE_URL;

// Usar el logo de la app (desde Supabase Storage)
const ICON_URL = 'https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/DB_LOGO150.webp';
const LOGO_URL = 'https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/DB_LOGO150.webp';

const DEFAULT_KEYWORDS = [
  'clases de baile',
  'sociales de baile',
  'eventos de salsa',
  'eventos de bachata',
  'academias de baile en CDMX',
  'maestros de baile',
  'baile en México',
  'ritmos latinos',
  'dónde bailar',
  'eventos de baile',
];

export interface SeoMeta {
  title: string;
  description: string;
  keywords: string[];
  image: string;
  icon: string;
  url: string;
  siteName: string;
}

type SeoConfig = Record<string, Partial<SeoMeta>>;

const LANDING_KEYWORDS = [
  'donde bailar',
  'clases de baile',
  'eventos de baile',
  'salsa',
  'bachata',
  'academias de baile',
  'lugares para bailar',
  'maestros de baile',
  'baile en México',
  'eventos de salsa',
  'eventos de bachata',
  'ritmos latinos',
];

const SEO_CONFIG: SeoConfig = {
  default: {
    title: 'Donde Bailar | Encuentra eventos, clases y academias de baile cerca de ti',
    description:
      'Encuentra dónde bailar hoy: eventos de salsa y bachata, clases de baile, academias y maestros. Filtra por ritmo, zona y fecha en CDMX y México.',
    keywords: LANDING_KEYWORDS.length ? LANDING_KEYWORDS : DEFAULT_KEYWORDS,
    image: LOGO_URL,
    icon: ICON_URL,
    url: BASE_URL,
    siteName: 'Donde Bailar',
  },
  landing: {
    title: 'Donde Bailar | Encuentra eventos, clases y academias de baile cerca de ti',
    description:
      'Descubre eventos de baile, clases, academias y sociales cerca de ti. Encuentra dónde bailar salsa, bachata y más con la comunidad de Donde Bailar.',
    keywords: LANDING_KEYWORDS,
    url: BASE_URL,
  },
  explore: {
    title: 'Explorar Dónde Bailar | Encuentra eventos y clases de baile',
    description:
      'Filtra por ritmos, zonas y fechas para encontrar clases, sociales y eventos de baile en tu ciudad.',
    url: `${BASE_URL}/explore`,
  },
  'explore-list': {
    title: 'Resultados de búsqueda de baile | Dónde Bailar',
    description:
      'Explora resultados detallados de academias, maestros, sociales y eventos según tus filtros personalizados.',
    url: `${BASE_URL}/explore/list`,
  },
  academy: {
    url: `${BASE_URL}/academia`,
  },
  organizer: {
    url: `${BASE_URL}/organizer`,
  },
  event: {
    url: `${BASE_URL}/social`,
  },
  class: {
    url: `${BASE_URL}/clase`,
  },
};

export function getSeoMeta(section: string = 'default', overrides?: Partial<SeoMeta>): SeoMeta {
  const base = {
    ...SEO_CONFIG.default,
    ...(section && SEO_CONFIG[section] ? SEO_CONFIG[section] : {}),
  };

  return {
    title: overrides?.title ?? base.title ?? SEO_CONFIG.default.title!,
    description: overrides?.description ?? base.description ?? SEO_CONFIG.default.description!,
    keywords: overrides?.keywords ?? base.keywords ?? DEFAULT_KEYWORDS,
    image: overrides?.image ?? base.image ?? LOGO_URL,
    icon: overrides?.icon ?? base.icon ?? ICON_URL,
    url: overrides?.url ?? base.url ?? BASE_URL,
    siteName: overrides?.siteName ?? base.siteName ?? 'Dónde Bailar',
  };
}

export const SEO_ICON_URL = ICON_URL;
export const SEO_LOGO_URL = LOGO_URL;
export const SEO_BASE_URL = BASE_URL;

