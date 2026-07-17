import type { Elements } from "./dom.js";
import { t, type Locale } from "../i18n.js";
import { escapeHtml } from "../utils/text.js";

interface RunFilterOption {
  endgame: string;
  version: string;
}

export function renderRunFilterOptions(
  els: Elements,
  sources: RunFilterOption[],
  selectedEndgame = "",
  selectedVersion = "",
  locale: Locale = "en"
): void {
  const endgames = ["Todos", ...uniqueValues(sources, (source) => source.endgame)];
  const activeEndgame = endgames.includes(selectedEndgame) ? selectedEndgame : (endgames[0] ?? "");
  const versions = uniqueValues(
    sources.filter((source) => activeEndgame === "Todos" || source.endgame === activeEndgame),
    (source) => source.version
  ).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

  els.endgameFilter.innerHTML = endgames
    .map(
      (endgame) =>
        `<option value="${escapeHtml(endgame)}">${escapeHtml(endgame === "Todos" ? t("filter.all") : localizedEndgame(endgame, locale))}</option>`
    )
    .join("");
  els.endgameFilter.value = activeEndgame;

  els.versionFilter.innerHTML = versions
    .map((version) => `<option value="${escapeHtml(version)}">${escapeHtml(version)}</option>`)
    .join("");
  els.versionFilter.value = versions.includes(selectedVersion) ? selectedVersion : (versions[0] ?? "");
}

function localizedEndgame(value: string, locale: Locale): string {
  if (locale !== "es") return value;
  const labels: Record<string, string> = {
    "Anomaly Arbitration": "Arbitraje de Anomalías",
    "Memory of Chaos": "Recuerdo del Caos",
    "Apocalyptic Shadow": "Espejismo Apocalíptico",
    "Pure Fiction": "Pura Ficción",
  };
  return labels[value] ?? value;
}

function uniqueValues<T>(items: T[], select: (item: T) => string): string[] {
  return [...new Set(items.map(select).filter(Boolean))];
}
