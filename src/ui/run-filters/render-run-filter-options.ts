import { t, type Locale } from "../localization/locale.js";
import type { RunFilterElements } from "./run-filter-elements.js";

interface RunFilterOption {
  endgame: string;
  version: string;
}

export function renderRunFilterOptions(
  els: RunFilterElements,
  sources: readonly RunFilterOption[],
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

  els.endgameFilter.replaceChildren(
    ...endgames.map(
      (endgame) => new Option(endgame === "Todos" ? t("filter.all") : localizedEndgame(endgame, locale), endgame)
    )
  );
  els.endgameFilter.value = activeEndgame;

  els.versionFilter.replaceChildren(...versions.map((version) => new Option(version, version)));
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

function uniqueValues<T>(items: readonly T[], select: (item: T) => string): string[] {
  return [...new Set(items.map(select).filter(Boolean))];
}
