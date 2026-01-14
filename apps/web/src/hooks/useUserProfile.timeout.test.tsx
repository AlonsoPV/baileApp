import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act } from "@testing-library/react";
import { useUserProfile } from "./useUserProfile";

// Provide a logged-in user
vi.mock("@/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

// Minimal Supabase mock:
// - profile query resolves quickly
// - rpc hangs forever (never resolves), so withTimeout must reject
vi.mock("../lib/supabase", () => {
  const never = new Promise(() => {});

  return {
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
      rpc: () => never,
    },
  };
});

describe("useUserProfile - timeout protection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fails fast (no infinite loading) when RPC never resolves", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUserProfile(), { wrapper });

    let p!: Promise<any>;
    act(() => {
      p = result.current.updateProfileFields({ display_name: "Test" } as any);
      // Avoid Node's "PromiseRejectionHandledWarning" by attaching a handler immediately.
      p.catch(() => {});
    });

    // The hook timeout is 12s. Advance past it.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(12_500);
    });

    await expect(p).rejects.toMatchObject({
      message: "La conexión está tardando demasiado. Intenta de nuevo.",
      code: "NETWORK_TIMEOUT",
    });
  });
});

