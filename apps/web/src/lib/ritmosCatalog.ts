export interface RitmoOption {
  id: string;
  label: string;
  parent?: string;
}

export interface RitmoGroup {
  id: string;
  label: string;
  items: RitmoOption[];
}

export const RITMOS_CATALOG: RitmoGroup[] = [
  {
    id: 'latinos',
    label: 'Latinos',
    items: [
      { id: 'salsa_on1', label: 'Salsa On 1', parent: 'latinos' },
      { id: 'moderna', label: 'Bachata Moderna', parent: 'latinos' },
      { id: 'salsa_on2', label: 'Salsa On 2', parent: 'latinos' },
      { id: 'salsa_casino', label: 'Salsa Casino', parent: 'latinos' },
      { id: 'bachata_tradicional', label: 'Bachata tradicional', parent: 'latinos' },
      { id: 'bachata_sensual', label: 'Bachata sensual', parent: 'latinos' },
      { id: 'merengue', label: 'Merengue', parent: 'latinos' },
      { id: 'cumbia', label: 'Cumbia', parent: 'latinos' },
      { id: 'timba', label: 'Timba', parent: 'latinos' },
    ],
  },
  {
    id: 'afro_latinos',
    label: 'Afro-latinos',
    items: [
      { id: 'kizomba', label: 'Kizomba', parent: 'afro_latinos' },
      { id: 'semba', label: 'Semba', parent: 'afro_latinos' },
      { id: 'zouk', label: 'Zouk', parent: 'afro_latinos' },
    ],
  },
  {
    id: 'urbanos',
    label: 'Urbanos y Contemporáneos',
    items: [
      
      { id: 'hiphop', label: 'Hip hop', parent: 'urbanos' },
      { id: 'breakdance', label: 'Break dance', parent: 'urbanos' },
      { id: 'reggaeton', label: 'Reggaetón', parent: 'urbanos' },
      { id: 'twerk', label: 'Twerk', parent: 'urbanos' },
      { id: 'zumba', label: 'Zumba', parent: 'urbanos' },
    ],
  },
  {
    id: 'clasicos',
    label: 'Época y Clásicos Urbanos',
    items: [
      { id: 'danzon', label: 'Danzón', parent: 'clasicos' },
      { id: 'rockandroll', label: 'Rock and Roll', parent: 'clasicos' },
      { id: 'swing', label: 'Swing', parent: 'clasicos' },
      { id: 'chachacha', label: 'Cha-cha-chá', parent: 'clasicos' },
      { id: 'boogiewoogie', label: 'Boogie Woogie', parent: 'clasicos' },
    ],
  },
];


