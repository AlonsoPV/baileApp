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
    label: 'CDMX y alrededores',
    items: [
      { id: 'cdmx_centro', label: 'CDMX Centro', slug: 'cdmx-centro', parent: 'cdmx' },
      { id: 'cdmx_norte', label: 'CDMX Norte', slug: 'cdmx-norte', parent: 'cdmx' },
      { id: 'cdmx_sur', label: 'CDMX Sur', slug: 'cdmx-sur', parent: 'cdmx' },
      { id: 'cdmx_oriente', label: 'CDMX Oriente', slug: 'cdmx-oriente', parent: 'cdmx' },
      { id: 'cdmx_poniente', label: 'CDMX Poniente', slug: 'cdmx-poniente', parent: 'cdmx' },
      { id: 'edomex', label: 'Edo. de México', slug: 'edomex', parent: 'cdmx' },
    ],
  },
  {
    id: 'caribe',
    label: 'Caribe mexicano',
    items: [
      { id: 'playa_del_carmen', label: 'Playa del Carmen', slug: 'playa_del_carmen', parent: 'caribe' },
      { id: 'cancun', label: 'Cancún', slug: 'cancun', parent: 'caribe' },
    ],
  },
  {
    id: 'veracruz',
    label: 'Veracruz y Puebla',
    items: [
      { id: 'orizaba', label: 'Orizaba', slug: 'orizaba', parent: 'veracruz' },
      { id: 'cordova', label: 'Córdova', slug: 'cordova', parent: 'veracruz' },
      { id: 'xalapa', label: 'Xalapa', slug: 'xalapa', parent: 'veracruz' },
      { id: 'puebla', label: 'Puebla', slug: 'puebla', parent: 'veracruz' },
    ],
  },
  {
    id: 'bajio',
    label: 'Bajío',
    items: [{ id: 'queretaro', label: 'Querétaro', slug: 'queretaro', parent: 'bajio' }],
  },
];

