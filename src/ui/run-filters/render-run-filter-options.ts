import { t, type Locale } from "../localization/locale.js";
import { canonicalEndgame } from "../../domain/runs/endgame.js";
import { supportsThreeTeamSelection, threeTeamSelection } from "../../domain/scoring/team-bundle.js";
import type { Run } from "../../domain/runs/run.types.js";
import { allBosses, buildBossFilterOptions } from "./build-boss-filter-options.js";
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
  runs: readonly Run[] = [],
  selectedBoss = allBosses,
  locale: Locale = "en"
): void {
  const endgames = ["Todos", ...uniqueValues(sources, (source) => canonicalEndgame(source.endgame))];
  const requestedEndgame = canonicalEndgame(selectedEndgame);
  const activeEndgame = endgames.includes(requestedEndgame) ? requestedEndgame : (endgames[0] ?? "");
  const versions = uniqueValues(
    sources.filter((source) => activeEndgame === "Todos" || canonicalEndgame(source.endgame) === activeEndgame),
    (source) => source.version
  ).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  const bosses = buildBossFilterOptions(runs, activeEndgame);

  els.endgameFilter.replaceChildren(
    ...endgames.map(
      (endgame) => new Option(endgame === "Todos" ? t("filter.all") : localizedEndgame(endgame, locale), endgame)
    )
  );
  els.endgameFilter.value = activeEndgame;

  els.versionFilter.replaceChildren(...versions.map((version) => new Option(version, version)));
  els.versionFilter.value = versions.includes(selectedVersion) ? selectedVersion : (versions[0] ?? "");

  const bundleOption = buildThreeTeamOption(activeEndgame);
  els.bossFilter.replaceChildren(
    new Option(t("filter.all"), allBosses),
    ...(bundleOption ? [bundleOption] : []),
    ...bosses.map((boss) => new Option(boss.label, boss.value))
  );
  const validBosses = new Set([
    allBosses,
    ...bosses.map((boss) => boss.value),
    ...(bundleOption ? [threeTeamSelection] : []),
  ]);
  els.bossFilter.value = validBosses.has(selectedBoss) ? selectedBoss : allBosses;
}

function buildThreeTeamOption(endgame: string): HTMLOptionElement | null {
  if (!supportsThreeTeamSelection(endgame)) return null;

  const label =
    canonicalEndgame(endgame) === "Anomaly Arbitration" ? t("filters.threeTeamsKnights") : t("filters.threeTeams");
  return new Option(label, threeTeamSelection);
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
