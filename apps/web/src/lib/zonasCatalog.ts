export interface ZonaOption {
  id: string;
  label: string;
  slug: string;
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
      { id: 'cdmx_norte', label: 'CDMX Norte', slug: 'cdmx_norte' },
      { id: 'cdmx_sur', label: 'CDMX Sur', slug: 'cdmx_sur' },
      { id: 'cdmx_oriente', label: 'CDMX Oriente', slug: 'cdmx_oriente' },
      { id: 'cdmx_poniente', label: 'CDMX Poniente', slug: 'cdmx_poniente' },
      { id: 'edomex', label: 'Edo. de México', slug: 'edomex' },
    ],
  },
  {
    id: 'playa_del_carmen',
    label: 'Playa del Carmen',
    items: [{ id: 'playa_del_carmen', label: 'Playa del Carmen', slug: 'playa_del_carmen' }],
  },
  {
    id: 'cancun',
    label: 'Cancún',
    items: [{ id: 'cancun', label: 'Cancún', slug: 'cancun' }],
  },
  {
    id: 'orizaba',
    label: 'Orizaba',
    items: [{ id: 'orizaba', label: 'Orizaba', slug: 'orizaba' }],
  },
  {
    id: 'cordova',
    label: 'Córdova',
    items: [{ id: 'cordova', label: 'Córdova', slug: 'cordova' }],
  },
  {
    id: 'xalapa',
    label: 'Xalapa',
    items: [{ id: 'xalapa', label: 'Xalapa', slug: 'xalapa' }],
  },
  {
    id: 'puebla',
    label: 'Puebla',
    items: [{ id: 'puebla', label: 'Puebla', slug: 'puebla' }],
  },
  {
    id: 'queretaro',
    label: 'Querétaro',
    items: [{ id: 'queretaro', label: 'Querétaro', slug: 'queretaro' }],
  },
];

