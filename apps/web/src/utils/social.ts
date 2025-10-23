export type Social = {
  instagram?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  facebook?: string | null;
  whatsapp?: string | null;
};

export function normalizeSocialInput(s: Partial<Social>): Social {
  // 1) trim
  const trimmed: any = {};
  for (const k of Object.keys(s)) {
    const v = (s as any)[k];
    if (typeof v === "string") trimmed[k] = v.trim();
    else trimmed[k] = v;
  }
  // 2) strings vacías -> null (para borrar)
  for (const k of Object.keys(trimmed)) {
    if (trimmed[k] === "") trimmed[k] = null;
  }
  // 3) normaliza whatsapp a solo dígitos (opcional)
  if (trimmed.whatsapp && typeof trimmed.whatsapp === "string") {
    trimmed.whatsapp = trimmed.whatsapp.replace(/\D+/g, "");
  }
  return trimmed as Social;
}
