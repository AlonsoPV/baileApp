/**
 * Environment Report for Runtime Validation
 * 
 * This module provides detailed reporting of environment variables
 * at runtime to help debug configuration issues in TestFlight builds.
 */

import Constants from "expo-constants";

export interface EnvReport {
  hasExpoConfig: boolean;
  extraKeys: string[];
  supabaseUrl: string | null;
  hasSupabaseUrl: boolean;
  hasAnonKey: boolean;
  releaseChannel: string | null;
  updatesUrl: string | null;
  jsEngine: string;
}

/**
 * Generate a detailed environment report
 * 
 * This function checks all possible sources of environment variables
 * and logs a comprehensive report for debugging.
 * 
 * @returns EnvReport object with all environment information
 */
export function envReport(): EnvReport {
  const expoConfig = Constants.expoConfig;
  const extra = (expoConfig?.extra as any) ?? {};
  
  // Also check manifest and manifest2 as fallbacks
  const manifestExtra = (Constants.manifest as any)?.extra ?? {};
  const manifest2Extra = (Constants.manifest2 as any)?.extra ?? {};
  
  // Merge all sources (priority: manifest2 > manifest > expoConfig)
  const allExtra = { ...extra, ...manifestExtra, ...manifest2Extra };

  // OJO: process.env en runtime casi siempre no existe como esperas.
  // Lo que sí conviene es validar lo que Expo dejó en extra.
  const supabaseUrl = 
    allExtra.EXPO_PUBLIC_SUPABASE_URL ?? 
    allExtra.supabaseUrl ?? 
    null;

  const anonKey = 
    allExtra.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 
    allExtra.supabaseAnonKey ?? 
    null;

  // Detect JS engine
  const anyGlobal = global as any;
  const jsEngine = anyGlobal?.HermesInternal ? "Hermes" : "JSC";

  const report: EnvReport = {
    hasExpoConfig: !!expoConfig,
    extraKeys: Object.keys(allExtra).sort(),
    supabaseUrl,
    hasSupabaseUrl: !!supabaseUrl,
    hasAnonKey: !!anonKey,
    releaseChannel: (expoConfig as any)?.releaseChannel ?? null,
    updatesUrl: (expoConfig as any)?.updates?.url ?? null,
    jsEngine,
  };

  console.log("[ENV_REPORT]", JSON.stringify(report, null, 2));
  
  // Also log individual checks for easier filtering
  console.log("[ENV_REPORT] hasExpoConfig:", report.hasExpoConfig);
  console.log("[ENV_REPORT] hasSupabaseUrl:", report.hasSupabaseUrl);
  console.log("[ENV_REPORT] hasAnonKey:", report.hasAnonKey);
  console.log("[ENV_REPORT] jsEngine:", report.jsEngine);
  console.log("[ENV_REPORT] extraKeys:", report.extraKeys.join(", "));
  
  return report;
}

