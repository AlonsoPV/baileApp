import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { fmtDate } from "@/utils/format";
import { getLocale } from "@/utils/locale";

/** Card/list date chips: weekday + month follow current i18n language; re-renders when language changes (fixes React.memo + stale locale). */
export function useFmtDate() {
  const { i18n } = useTranslation();
  return useCallback(
    (iso: string) => fmtDate(iso, getLocale(i18n.language || "es")),
    [i18n.language]
  );
}
