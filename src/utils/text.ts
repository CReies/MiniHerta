export function normalizeText(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatDate(value: string, locale = "en"): string {
  if (!value) return locale === "es" ? "sin fecha" : "no date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === "es" ? "es-CO" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
