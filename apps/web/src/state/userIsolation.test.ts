import { describe, expect, it, beforeEach } from "vitest";
import { setActiveUserId } from "@/storage/activeUser";
import { userLocalStorage } from "@/storage/userScopedStorage";
import { useExploreFilters } from "@/state/exploreFilters";
import { useProfileMode } from "@/state/profileMode";

describe("user data isolation (storage)", () => {
  beforeEach(() => {
    // Clean jsdom storages
    localStorage.clear();
    sessionStorage.clear();
    // Reset in-memory stores
    useExploreFilters.setState({ filters: { type: "all", q: "", ritmos: [], zonas: [], datePreset: "todos", pageSize: 12 } as any });
    useProfileMode.setState({ mode: "usuario" as any });
  });

  it("does not leak explore filters across users", () => {
    setActiveUserId("userA");
    useExploreFilters.getState().rehydrateForUser("userA");
    useExploreFilters.getState().set({ q: "salsa", zonas: [1, 2], ritmos: [10] });

    // Ensure persisted under userA namespace
    const storedA = userLocalStorage.getItem(["filters", "explore", "v1"], "userA");
    expect(storedA).toContain("salsa");

    // Switch to userB: should not see userA filters
    setActiveUserId("userB");
    useExploreFilters.getState().rehydrateForUser("userB");
    const filtersB = useExploreFilters.getState().filters;
    expect(filtersB.q).toBe("");
    expect(filtersB.zonas).toEqual([]);
    expect(filtersB.ritmos).toEqual([]);
  });

  it("does not leak profileMode across users", () => {
    setActiveUserId("userA");
    useProfileMode.getState().rehydrateForUser("userA");
    useProfileMode.getState().setMode("maestro");

    expect(userLocalStorage.getItem(["profile_mode", "v1"], "userA")).toBe("maestro");

    setActiveUserId("userB");
    useProfileMode.getState().rehydrateForUser("userB");
    expect(useProfileMode.getState().mode).toBe("usuario");
  });
});

