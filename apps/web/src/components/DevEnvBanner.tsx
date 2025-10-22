import React from "react";
import { ENV } from "../lib/env";

export default function DevEnvBanner() {
  if (ENV.MODE !== "development") return null;
  
  return (
    <div style={{
      fontSize: '0.75rem',
      padding: '0.25rem 0.75rem',
      background: 'rgba(180, 83, 9, 0.4)',
      border: '1px solid rgba(161, 98, 7, 0.4)',
      color: 'rgb(254, 240, 138)',
      textAlign: 'center'
    }}>
      DEV • Supabase REF: <strong>{ENV.SUPABASE_REF}</strong> • URL: {ENV.SUPABASE_URL?.slice(0, 30)}…
    </div>
  );
}

