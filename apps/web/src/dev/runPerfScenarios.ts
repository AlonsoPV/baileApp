/**
 * Dev-only: runners para escenarios de medición PERF.
 * Expone window.runPerfScenarioSearch() y window.runPerfScenarioRecurring()
 */

import { fetchExplorePage } from "../hooks/useExploreQuery";
import type { ExploreFilters } from "../state/exploreFilters";
import { queryClient } from "../lib/queryClient";

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = String(ymd).split("-").map((x) => parseInt(x, 10));
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function getTodayCDMX(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

const DELAY_MS = 450;

function baseParams(type: "search" | "recurring"): ExploreFilters {
  const today = getTodayCDMX();
  const dateTo = addDaysYmd(today, 14);
  return {
    type: "fechas",
    q: type === "search" ? "bachata" : "",
    ritmos: [],
    zonas: [],
    dateFrom: today,
    dateTo,
    pageSize: 12,
  };
}

declare global {
  interface Window {
    runPerfScenarioSearch?: () => Promise<void>;
    runPerfScenarioRecurring?: () => Promise<void>;
  }
}

export function installPerfScenarioRunners() {
  if (typeof window === "undefined") return;

  window.runPerfScenarioSearch = async () => {
    console.log("[PERF] runPerfScenarioSearch: 5 ejecuciones con q=bachata");
    const params = baseParams("search");
    for (let i = 0; i < 5; i++) {
      if (i > 0 && i % 2 === 1) {
        queryClient.removeQueries({ queryKey: ["explore"] });
      }
      await fetchExplorePage(params, 0);
      if (i < 4) await new Promise((r) => setTimeout(r, DELAY_MS));
    }
    console.log("[PERF] runPerfScenarioSearch done. Llamar window.perfExport()");
    if (typeof (window as any).perfExport === "function") {
      (window as any).perfExport();
    }
  };

  window.runPerfScenarioRecurring = async () => {
    console.log("[PERF] runPerfScenarioRecurring: 5 ejecuciones (date range amplio)");
    const params = baseParams("recurring");
    params.dateTo = addDaysYmd(getTodayCDMX(), 30);
    for (let i = 0; i < 5; i++) {
      if (i > 0 && i % 2 === 1) {
        queryClient.removeQueries({ queryKey: ["explore"] });
      }
      await fetchExplorePage(params, 0);
      if (i < 4) await new Promise((r) => setTimeout(r, DELAY_MS));
    }
    console.log("[PERF] runPerfScenarioRecurring done. Llamar window.perfExport()");
    if (typeof (window as any).perfExport === "function") {
      (window as any).perfExport();
    }
  };

  console.log("[PERF] Runners instalados: runPerfScenarioSearch(), runPerfScenarioRecurring()");
}
