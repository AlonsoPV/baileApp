import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PickZonas } from "./PickZonas";

vi.mock("@/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("../../hooks/useTags", () => ({
  useTags: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/hooks/useZonaCatalogGroups", () => ({
  useZonaCatalogGroups: () => ({ groups: [] }),
}));

vi.mock("@/components/profile/ZonaGroupedChips", () => ({
  default: ({ onToggle }: any) => (
    <button onClick={() => onToggle(123)}>Select zona</button>
  ),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("../../hooks/useUserProfile", () => ({
  useUserProfile: () => ({
    profile: { zonas: [123] },
    updateProfileFields: () => {
      const e: any = new Error("La conexión está tardando demasiado. Intenta de nuevo.");
      e.code = "NETWORK_TIMEOUT";
      return Promise.reject(e);
    },
  }),
}));

vi.mock("../../lib/supabase", () => ({
  supabase: {
    from: () => ({
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ error: null }),
          }),
        }),
      }),
    }),
  },
}));

describe("PickZonas - loading never sticks forever", () => {
  it("clears 'Guardando...' and shows error when save fails", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/onboarding/zonas"]}>
          <PickZonas />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Button should be enabled because profile.zonas preselects one.
    const submit = screen.getByRole("button", { name: /finalizar/i });
    fireEvent.click(submit);

    // After rejection, loading should clear and error should be visible.
    expect(await screen.findByText(/tardando demasiado/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /finalizar/i })).toBeTruthy();
  });
});

