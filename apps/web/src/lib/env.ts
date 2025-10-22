export const ENV = {
  MODE: import.meta.env.MODE, // "development" | "production"
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  
  get SUPABASE_REF() {
    try {
      // https://xxxxxx.supabase.co -> xxxxxx
      const m = (this.SUPABASE_URL || "").match(/^https?:\/\/([^.]+)\.supabase\.co/i);
      return m?.[1] || "unknown";
    } catch {
      return "unknown";
    }
  },
};

if (ENV.MODE === "development") {
  // Log seguro (sin llave completa)
  console.log("[ENV] MODE:", ENV.MODE);
  console.log("[ENV] REF:", ENV.SUPABASE_REF);
  console.log("[ENV] URL:", ENV.SUPABASE_URL?.slice(0, 30) + "…");
}

