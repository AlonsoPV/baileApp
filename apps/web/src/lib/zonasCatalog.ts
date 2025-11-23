export interface ZonaOption {
  id: string;
  label: string;
  slug: string;
  parent?: string;
  tagId?: number; // ID numérico del tag correspondiente (se llena dinámicamente)
}

export interface ZonaGroup {
  id: string;
  label: string;
  items: ZonaOption[];
}

export const ZONAS_CATALOG: ZonaGroup[] = [
  {
    id: 'cdmx',
    label: 'CDMX',
    items: [
      { id: 'cdmx_centro', label: 'CDMX Centro', slug: 'cdmx-centro', parent: 'cdmx' },
      { id: 'cdmx_norte', label: 'CDMX Norte', slug: 'cdmx-norte', parent: 'cdmx' },
      { id: 'cdmx_sur', label: 'CDMX Sur', slug: 'cdmx-sur', parent: 'cdmx' },
      { id: 'cdmx_oriente', label: 'CDMX Oriente', slug: 'cdmx-oriente', parent: 'cdmx' },
      { id: 'cdmx_poniente', label: 'CDMX Poniente', slug: 'cdmx-poniente', parent: 'cdmx' },
    ],
  },
  {
    id: 'edomex',
    label: 'Edo. de México',
    items: [
      { id: 'edomex_general', label: 'Edo. de México', slug: 'edomex', parent: 'edomex' },
    ],
  },
  {
    id: 'norte',
    label: 'Norte',
    items: [
      { id: 'baja_california', label: 'Baja California', slug: 'baja_california', parent: 'norte' },
      { id: 'sonora', label: 'Sonora', slug: 'sonora', parent: 'norte' },
      { id: 'chihuahua', label: 'Chihuahua', slug: 'chihuahua', parent: 'norte' },
      { id: 'coahuila', label: 'Coahuila', slug: 'coahuila', parent: 'norte' },
      { id: 'nuevo_leon', label: 'Nuevo León', slug: 'nuevo_leon', parent: 'norte' },
      { id: 'tamaulipas', label: 'Tamaulipas', slug: 'tamaulipas', parent: 'norte' },
      { id: 'durango', label: 'Durango', slug: 'durango', parent: 'norte' },
      { id: 'monterrey', label: 'Monterrey', slug: 'monterrey', parent: 'norte' },
      { id: 'guadalajara', label: 'Guadalajara', slug: 'guadalajara', parent: 'norte' },
    ],
  },
  {
    id: 'bajio',
    label: 'Bajío',
    items: [
      { id: 'queretaro', label: 'Querétaro', slug: 'queretaro', parent: 'bajio' },
      { id: 'guanajuato', label: 'Guanajuato', slug: 'guanajuato', parent: 'bajio' },
      { id: 'aguascalientes', label: 'Aguascalientes', slug: 'aguascalientes', parent: 'bajio' },
      { id: 'san_luis_potosi', label: 'San Luis Potosí', slug: 'san_luis_potosi', parent: 'bajio' },
      { id: 'zacatecas', label: 'Zacatecas', slug: 'zacatecas', parent: 'bajio' },
    ],
  },
  {
    id: 'centro',
    label: 'Centro',
    items: [
      { id: 'puebla', label: 'Puebla', slug: 'puebla', parent: 'centro' },
      { id: 'hidalgo', label: 'Hidalgo', slug: 'hidalgo', parent: 'centro' },
      { id: 'tlaxcala', label: 'Tlaxcala', slug: 'tlaxcala', parent: 'centro' },
      { id: 'morelos', label: 'Morelos', slug: 'morelos', parent: 'centro' },
    ],
  },
  {
    id: 'sur_sureste',
    label: 'Sur / Sureste',
    items: [
      { id: 'oaxaca', label: 'Oaxaca', slug: 'oaxaca', parent: 'sur_sureste' },
      { id: 'puerto_escondido', label: 'Puerto Escondido', slug: 'puerto_escondido', parent: 'sur_sureste' },
      { id: 'chiapas', label: 'Chiapas', slug: 'chiapas', parent: 'sur_sureste' },
      { id: 'guerrero', label: 'Guerrero', slug: 'guerrero', parent: 'sur_sureste' },
      { id: 'veracruz', label: 'Veracruz', slug: 'veracruz', parent: 'sur_sureste' },
      { id: 'xalapa', label: 'Xalapa', slug: 'xalapa', parent: 'sur_sureste' },
      { id: 'orizaba', label: 'Orizaba', slug: 'orizaba', parent: 'sur_sureste' },
      { id: 'cordova', label: 'Córdova', slug: 'cordova', parent: 'sur_sureste' },
      { id: 'tabasco', label: 'Tabasco', slug: 'tabasco', parent: 'sur_sureste' },
      { id: 'campeche', label: 'Campeche', slug: 'campeche', parent: 'sur_sureste' },
      { id: 'yucatan', label: 'Yucatán', slug: 'yucatan', parent: 'sur_sureste' },
      { id: 'quintana_roo', label: 'Quintana Roo', slug: 'quintana_roo', parent: 'sur_sureste' },
      { id: 'cancun', label: 'Cancún', slug: 'cancun', parent: 'sur_sureste' },
      { id: 'playa_del_carmen', label: 'Playa del Carmen', slug: 'playa_del_carmen', parent: 'sur_sureste' },
    ],
  },
];

