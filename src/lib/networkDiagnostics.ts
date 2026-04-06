import type { NetInfoState } from "@react-native-community/netinfo";

export type ConnectivitySnapshot = {
  capturedAt: string;
  available: boolean;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
  details: Record<string, unknown> | null;
  reason?: string;
  lastChangeAt: string | null;
  changeCount: number;
};

export type NetworkDiagnosticsEventName =
  | "start"
  | "initial_fetch"
  | "state_change"
  | "fetch_failed"
  | "module_missing"
  | "api_unavailable"
  | "stop";

export type NetworkDiagnosticsEvent = {
  event: NetworkDiagnosticsEventName;
  timestamp: string;
  snapshot: ConnectivitySnapshot;
  payload?: Record<string, unknown>;
};

type NetInfoShape = {
  addEventListener?: (listener: (state: NetInfoState) => void) => () => void;
  fetch?: () => Promise<NetInfoState>;
};

export type NetworkDiagnosticsOptions = {
  logPrefix?: string;
  onSnapshot?: (snapshot: ConnectivitySnapshot) => void;
  onEvent?: (event: NetworkDiagnosticsEvent) => void;
};

export type NetworkDiagnosticsSession = {
  getSnapshot: () => ConnectivitySnapshot;
  stop: () => void;
};

export type HealthcheckTargetResult = {
  target: "web_domain" | "supabase";
  url: string;
  ok: boolean;
  status: number | null;
  durationMs: number;
  error: string | null;
};

export type LightweightHealthcheckResult = {
  event: "light_healthcheck";
  timestamp: string;
  reason: string;
  timeoutMs: number;
  totalDurationMs: number;
  ok: boolean;
  checks: HealthcheckTargetResult[];
};

export type LightweightHealthcheckOptions = {
  webUrl: string;
  supabaseUrl?: string | null;
  supabaseAnonKey?: string | null;
  timeoutMs?: number;
  reason?: string;
};

const DEFAULT_LOG_PREFIX = "[NET_DIAG]";
const DEFAULT_HEALTHCHECK_TIMEOUT_MS = 3_500;

function nowIso(): string {
  return new Date().toISOString();
}

export function createInitialConnectivitySnapshot(reason = "not_initialized"): ConnectivitySnapshot {
  return {
    capturedAt: nowIso(),
    available: false,
    isConnected: null,
    isInternetReachable: null,
    type: "unknown",
    details: null,
    reason,
    lastChangeAt: null,
    changeCount: 0,
  };
}

function normalizeDetails(details: NetInfoState["details"] | undefined): Record<string, unknown> | null {
  if (details && typeof details === "object") {
    return details as Record<string, unknown>;
  }
  return null;
}

function hasConnectivityChange(prev: ConnectivitySnapshot, next: ConnectivitySnapshot): boolean {
  return (
    prev.isConnected !== next.isConnected ||
    prev.isInternetReachable !== next.isInternetReachable ||
    prev.type !== next.type
  );
}

function buildSnapshot(
  state: NetInfoState | null | undefined,
  reason: string,
  prev: ConnectivitySnapshot
): ConnectivitySnapshot {
  const capturedAt = nowIso();
  const next: ConnectivitySnapshot = {
    capturedAt,
    available: Boolean(state),
    isConnected:
      typeof state?.isConnected === "boolean" || state?.isConnected === null
        ? (state.isConnected ?? null)
        : null,
    isInternetReachable:
      typeof state?.isInternetReachable === "boolean" || state?.isInternetReachable === null
        ? (state.isInternetReachable ?? null)
        : null,
    type: typeof state?.type === "string" ? state.type : "unknown",
    details: normalizeDetails(state?.details),
    reason,
    lastChangeAt: prev.lastChangeAt,
    changeCount: prev.changeCount,
  };

  if (hasConnectivityChange(prev, next)) {
    next.lastChangeAt = capturedAt;
    next.changeCount = prev.changeCount + 1;
  }

  return next;
}

function logNetEvent(prefix: string, payload: NetworkDiagnosticsEvent): void {
  if (typeof console?.log !== "function") return;
  console.log(prefix, JSON.stringify(payload));
}

function normalizeBaseUrl(rawUrl: string): string | null {
  const trimmed = String(rawUrl ?? "").trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return null;
  }
}

function canUseAbortController(): boolean {
  return typeof AbortController !== "undefined";
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  if (canUseAbortController()) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return await Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

async function runSingleCheck(
  target: "web_domain" | "supabase",
  url: string,
  timeoutMs: number,
  options: RequestInit = {}
): Promise<HealthcheckTargetResult> {
  const startedAt = Date.now();
  try {
    const response = await fetchWithTimeout(url, options, timeoutMs);
    return {
      target,
      url,
      ok: response.ok,
      status: response.status,
      durationMs: Date.now() - startedAt,
      error: null,
    };
  } catch (error) {
    return {
      target,
      url,
      ok: false,
      status: null,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runLightweightHealthcheck(
  options: LightweightHealthcheckOptions
): Promise<LightweightHealthcheckResult> {
  const timeoutMs = Math.max(500, Number(options.timeoutMs ?? DEFAULT_HEALTHCHECK_TIMEOUT_MS));
  const reason = String(options.reason ?? "manual");
  const checks: HealthcheckTargetResult[] = [];
  const startedAt = Date.now();

  const webOrigin = normalizeBaseUrl(options.webUrl);
  const supabaseOrigin = normalizeBaseUrl(options.supabaseUrl ?? "");
  const supabaseAnonKey = String(options.supabaseAnonKey ?? "").trim();

  if (webOrigin) {
    const webResult = await runSingleCheck("web_domain", webOrigin, timeoutMs, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    checks.push(webResult);
  } else {
    checks.push({
      target: "web_domain",
      url: String(options.webUrl ?? ""),
      ok: false,
      status: null,
      durationMs: 0,
      error: "invalid_web_url",
    });
  }

  if (supabaseOrigin) {
    const supabaseUrl = `${supabaseOrigin}/rest/v1/`;
    const headers: Record<string, string> = {
      "Cache-Control": "no-cache",
    };
    if (supabaseAnonKey) {
      headers.apikey = supabaseAnonKey;
      headers.Authorization = `Bearer ${supabaseAnonKey}`;
    }
    const supabaseResult = await runSingleCheck("supabase", supabaseUrl, timeoutMs, {
      method: "GET",
      headers,
    });
    checks.push(supabaseResult);
  } else {
    checks.push({
      target: "supabase",
      url: String(options.supabaseUrl ?? ""),
      ok: false,
      status: null,
      durationMs: 0,
      error: "supabase_url_missing",
    });
  }

  return {
    event: "light_healthcheck",
    timestamp: nowIso(),
    reason,
    timeoutMs,
    totalDurationMs: Date.now() - startedAt,
    ok: checks.every((check) => check.ok),
    checks,
  };
}

export function startNetworkDiagnostics(options: NetworkDiagnosticsOptions = {}): NetworkDiagnosticsSession {
  const logPrefix = options.logPrefix ?? DEFAULT_LOG_PREFIX;
  let stopped = false;
  let unsubscribe: (() => void) | undefined;
  let snapshot = createInitialConnectivitySnapshot();

  const emit = (event: NetworkDiagnosticsEventName, payload?: Record<string, unknown>) => {
    const diagnosticEvent: NetworkDiagnosticsEvent = {
      event,
      timestamp: nowIso(),
      snapshot,
      payload,
    };
    logNetEvent(logPrefix, diagnosticEvent);
    options.onEvent?.(diagnosticEvent);
  };

  const publishSnapshot = (nextSnapshot: ConnectivitySnapshot) => {
    snapshot = nextSnapshot;
    options.onSnapshot?.(snapshot);
  };

  emit("start", { reason: "session_started" });

  try {
    // Lazy require prevents hard crash if native module is unavailable.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const netInfoModule = require("@react-native-community/netinfo");
    const netInfo = (netInfoModule?.default ?? netInfoModule) as NetInfoShape;

    if (!netInfo?.addEventListener || !netInfo?.fetch) {
      publishSnapshot(buildSnapshot(null, "netinfo_api_unavailable", snapshot));
      emit("api_unavailable", { reason: "missing_fetch_or_listener" });
      return {
        getSnapshot: () => ({ ...snapshot }),
        stop: () => {},
      };
    }

    unsubscribe = netInfo.addEventListener((state) => {
      if (stopped) return;
      const nextSnapshot = buildSnapshot(state, "state_change", snapshot);
      const changed = hasConnectivityChange(snapshot, nextSnapshot);
      publishSnapshot(nextSnapshot);
      if (changed) {
        emit("state_change", {
          isConnected: nextSnapshot.isConnected,
          isInternetReachable: nextSnapshot.isInternetReachable,
          type: nextSnapshot.type,
          changeCount: nextSnapshot.changeCount,
        });
      }
    });

    netInfo
      .fetch()
      .then((state) => {
        if (stopped) return;
        publishSnapshot(buildSnapshot(state, "initial_fetch", snapshot));
        emit("initial_fetch");
      })
      .catch((error: unknown) => {
        if (stopped) return;
        publishSnapshot(buildSnapshot(null, "netinfo_fetch_failed", snapshot));
        emit("fetch_failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      });
  } catch (error) {
    publishSnapshot(buildSnapshot(null, "netinfo_module_missing", snapshot));
    emit("module_missing", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    getSnapshot: () => ({ ...snapshot }),
    stop: () => {
      if (stopped) return;
      stopped = true;
      unsubscribe?.();
      emit("stop");
    },
  };
}
