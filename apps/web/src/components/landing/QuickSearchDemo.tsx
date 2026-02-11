import React, { useMemo, useState } from "react";
import { track, LANDING_EVENTS } from "@/lib/track";
import { landingContent } from "@/config/content";
import { Modal } from "@/components/ui/Modal";
import { TabbedResults, type TabKey } from "@/components/landing/TabbedResults";

const DATE_OPTIONS = landingContent.demo.dateOptions;
const RITMOS = ["Salsa", "Bachata", "Kizomba", "Swing", "Tango", "Urbano"];
const ZONAS = [
  "Roma/Condesa",
  "Centro",
  "Polanco",
  "Coyoacán",
  "Narvarte",
  "Satélite",
];

export type DateFilter = (typeof DATE_OPTIONS)[number];
export type { TabKey } from "@/components/landing/TabbedResults";

const MOCK_ITEMS: Array<{
  id: string;
  type: TabKey;
  title: string;
  subtitle: string;
  ritmos: string[];
  zonas: string[];
  dateLabel?: string;
}> = [
  {
    id: "1",
    type: "eventos",
    title: "Social Salsa Roma",
    subtitle: "Roma Norte · Hoy 21:00",
    ritmos: ["Salsa"],
    zonas: ["Roma/Condesa"],
    dateLabel: "Hoy",
  },
  {
    id: "2",
    type: "eventos",
    title: "Bachata Night",
    subtitle: "Condesa · Mañana 20:00",
    ritmos: ["Bachata"],
    zonas: ["Roma/Condesa"],
    dateLabel: "Mañana",
  },
  {
    id: "3",
    type: "clases",
    title: "Clase Salsa On1",
    subtitle: "Academia Danza CDMX · Esta semana",
    ritmos: ["Salsa"],
    zonas: ["Centro"],
    dateLabel: "Esta semana",
  },
  {
    id: "4",
    type: "academias",
    title: "Estudio Salsa & Bachata",
    subtitle: "Polanco · Salsa, Bachata, Kizomba",
    ritmos: ["Salsa", "Bachata", "Kizomba"],
    zonas: ["Polanco"],
  },
  {
    id: "5",
    type: "maestros",
    title: "María López",
    subtitle: "Bachata, Kizomba · Roma",
    ritmos: ["Bachata", "Kizomba"],
    zonas: ["Roma/Condesa"],
  },
  {
    id: "6",
    type: "organizadores",
    title: "Fiestas Latinas CDMX",
    subtitle: "Eventos mensuales · Varias zonas",
    ritmos: ["Salsa", "Bachata"],
    zonas: ["Roma/Condesa", "Centro"],
  },
  {
    id: "7",
    type: "eventos",
    title: "Tango en Coyoacán",
    subtitle: "Coyoacán · Esta semana",
    ritmos: ["Tango"],
    zonas: ["Coyoacán"],
    dateLabel: "Esta semana",
  },
  {
    id: "8",
    type: "clases",
    title: "Kizomba beginners",
    subtitle: "Narvarte · Mañana",
    ritmos: ["Kizomba"],
    zonas: ["Narvarte"],
    dateLabel: "Mañana",
  },
];

function filterItems(
  items: typeof MOCK_ITEMS,
  tab: TabKey,
  dateFilter: DateFilter,
  ritmos: string[],
  zonas: string[]
) {
  return items.filter((item) => {
    if (item.type !== tab) return false;
    if (dateFilter !== "Todos" && item.dateLabel && item.dateLabel !== dateFilter)
      return false;
    if (ritmos.length && !ritmos.some((r) => item.ritmos.includes(r)))
      return false;
    if (zonas.length && !zonas.some((z) => item.zonas.includes(z)))
      return false;
    return true;
  });
}

export function QuickSearchDemo() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("Todos");
  const [ritmos, setRitmos] = useState<string[]>([]);
  const [zonas, setZonas] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("eventos");
  const [detailId, setDetailId] = useState<string | null>(null);

  const toggleRitmo = (r: string) => {
    const next = ritmos.includes(r) ? ritmos.filter((x) => x !== r) : [...ritmos, r];
    setRitmos(next);
    track(LANDING_EVENTS.FILTER_CHANGE, { filter: "ritmos", value: next.join(",") });
  };

  const toggleZona = (z: string) => {
    const next = zonas.includes(z) ? zonas.filter((x) => x !== z) : [...zonas, z];
    setZonas(next);
    track(LANDING_EVENTS.FILTER_CHANGE, { filter: "zonas", value: next.join(",") });
  };

  const handleDateChange = (d: DateFilter) => {
    setDateFilter(d);
    track(LANDING_EVENTS.FILTER_CHANGE, { filter: "date", value: d });
  };

  const filtered = useMemo(
    () => filterItems(MOCK_ITEMS, activeTab, dateFilter, ritmos, zonas),
    [activeTab, dateFilter, ritmos, zonas]
  );

  const itemForDetail = detailId ? MOCK_ITEMS.find((i) => i.id === detailId) : null;

  return (
    <section
      className="landing-section bg-[color:var(--lb-bg2)]"
      aria-label="Demo de búsqueda"
    >
      <div className="landing-container">
        <h2 className="landing-h2 text-center mb-6 md:mb-8">
          {landingContent.demo.title}
        </h2>

        {/* CRO: card con bordes 20px, glassmorphism sutil, sombra */}
        <div className="glass-card space-y-6">
          <div>
            <span className="overline block mb-2">Fecha</span>
            <div className="flex flex-wrap gap-2">
              {DATE_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDateChange(d)}
                  className={`chip ${dateFilter === d ? "chip--active" : ""}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="overline block mb-2">Ritmos</span>
            <div className="flex flex-wrap gap-2">
              {RITMOS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRitmo(r)}
                  className={`chip ${ritmos.includes(r) ? "chip--active" : ""}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="overline block mb-2">Zonas</span>
            <div className="flex flex-wrap gap-2">
              {ZONAS.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => toggleZona(z)}
                  className={`chip ${zonas.includes(z) ? "chip--active" : ""}`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>
        </div>

        <TabbedResults
          activeTab={activeTab}
          onTabChange={setActiveTab}
          items={filtered}
          onViewDetails={setDetailId}
        />
      </div>

      {itemForDetail && (
        <DetailModal
          item={itemForDetail}
          onClose={() => setDetailId(null)}
        />
      )}
    </section>
  );
}

function DetailModal({
  item: i,
  onClose,
}: {
  item: (typeof MOCK_ITEMS)[0];
  onClose: () => void;
}) {
  return (
    <Modal open={true} onClose={onClose} title={i.title}>
      <div className="space-y-4 text-white/90">
        <p className="text-white/70">{i.subtitle}</p>
        <div className="flex flex-wrap gap-2">
          {i.ritmos.map((r) => (
            <span
              key={r}
              className="px-3 py-1 rounded-lg bg-white/10 text-sm"
            >
              {r}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {i.zonas.map((z) => (
            <span
              key={z}
              className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-200 text-sm"
            >
              {z}
            </span>
          ))}
        </div>
        <p className="text-sm text-white/60">
          Este es un contenido de demostración. En la app verás la información
          real del evento o clase.
        </p>
      </div>
    </Modal>
  );
}
