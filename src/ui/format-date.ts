import type { Locale } from "./i18n.js";

export function formatDate(value: string, locale: Locale): string {
  if (!value) return locale === "es" ? "sin fecha" : "no date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === "es" ? "es-CO" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
