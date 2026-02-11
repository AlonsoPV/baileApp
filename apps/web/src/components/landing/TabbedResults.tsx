import React from "react";
import { landingContent } from "@/config/content";

export type TabKey = "eventos" | "clases" | "academias" | "maestros" | "organizadores";

const TAB_LABELS: Record<TabKey, string> = {
  eventos: landingContent.demo.tabEvents,
  clases: landingContent.demo.tabClasses,
  academias: landingContent.demo.tabAcademies,
  maestros: landingContent.demo.tabTeachers,
  organizadores: landingContent.demo.tabOrganizers,
};

type Item = {
  id: string;
  type: TabKey;
  title: string;
  subtitle: string;
};

interface TabbedResultsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  items: Item[];
  onViewDetails: (id: string) => void;
}

const TABS: TabKey[] = [
  "eventos",
  "clases",
  "academias",
  "maestros",
  "organizadores",
];

export function TabbedResults({
  activeTab,
  onTabChange,
  items,
  onViewDetails,
}: TabbedResultsProps) {
  return (
    <div className="mt-6">
      <div
        className="tabbar mb-5"
        role="tablist"
        aria-label="Tipo de resultado"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`panel-${tab}`}
            id={`tab-${tab}`}
            onClick={() => onTabChange(tab)}
            className={`tab ${activeTab === tab ? "tab--active" : ""}`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {items.length === 0 ? (
          <p className="md:col-span-2 lg:col-span-3 text-center landing-muted py-10">
            No hay resultados con estos filtros. Prueba cambiando fecha, ritmo o
            zona.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="result-card"
            >
              <h3 className="result-title">{item.title}</h3>
              <p className="result-meta mt-1">{item.subtitle}</p>
              <button
                type="button"
                onClick={() => onViewDetails(item.id)}
                className="result-link"
              >
                {landingContent.demo.viewDetails}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
