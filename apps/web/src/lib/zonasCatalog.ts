export interface ZonaOption {
  id: string;
  label: string;
  tagId?: number; // ID numérico del tag correspondiente
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
      { id: 'cdmx_norte', label: 'CDMX Norte' },
      { id: 'cdmx_sur', label: 'CDMX Sur' },
      { id: 'cdmx_oriente', label: 'CDMX Oriente' },
      { id: 'cdmx_poniente', label: 'CDMX Poniente' },
      { id: 'edomex', label: 'Edo. de México' },
    ],
  },
  {
    id: 'playa_del_carmen',
    label: 'Playa del Carmen',
    items: [{ id: 'playa_del_carmen', label: 'Playa del Carmen' }],
  },
  {
    id: 'cancun',
    label: 'Cancún',
    items: [{ id: 'cancun', label: 'Cancún' }],
  },
  {
    id: 'orizaba',
    label: 'Orizaba',
    items: [{ id: 'orizaba', label: 'Orizaba' }],
  },
  {
    id: 'cordova',
    label: 'Córdova',
    items: [{ id: 'cordova', label: 'Córdova' }],
  },
  {
    id: 'xalapa',
    label: 'Xalapa',
    items: [{ id: 'xalapa', label: 'Xalapa' }],
  },
  {
    id: 'puebla',
    label: 'Puebla',
    items: [{ id: 'puebla', label: 'Puebla' }],
  },
  {
    id: 'queretaro',
    label: 'Querétaro',
    items: [{ id: 'queretaro', label: 'Querétaro' }],
  },
];

