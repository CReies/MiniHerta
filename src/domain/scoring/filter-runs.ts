import { normalizeText } from "../../shared/normalize-text.js";
import { matchesBoss } from "../runs/boss-filter.js";
import type { Run } from "../runs/run.types.js";
import type { EvaluatedRun, FilterState } from "./scoring.types.js";

export const nearScoreLimit = 220;

export function matchesFilters(run: Run, filters: FilterState, additionalSearchText = ""): boolean {
  if (filters.endgame && filters.endgame !== "Todos" && run.endgame !== filters.endgame) return false;
  if (filters.version && run.version !== filters.version) return false;
  if (!matchesBoss(run.boss, filters.boss)) return false;

  const query = normalizeText(filters.resultSearch);
  if (!query) return true;

  const haystack = normalizeText(
    [
      run.author,
      run.boss,
      run.endgame,
      run.version,
      ...run.team.flatMap((member) => [member.char, member.lc]),
      additionalSearchText,
    ].join(" ")
  );
  return haystack.includes(query);
}

export function applyResultMode(runs: EvaluatedRun[], mode: FilterState["resultMode"]): EvaluatedRun[] {
  if (mode === "complete") return runs.filter((run) => run.missingScore === 0);
  if (mode === "near") return runs.filter((run) => run.missingScore <= nearScoreLimit);
  return runs;
}

export function compareRuns(a: EvaluatedRun, b: EvaluatedRun, mode: FilterState["sortMode"]): number {
  if (mode === "cost") return a.limitedCost - b.limitedCost || a.missingScore - b.missingScore;
  if (mode === "date") return new Date(b.videoDate).getTime() - new Date(a.videoDate).getTime();
  return a.missingScore - b.missingScore || a.missing.length - b.missing.length || a.limitedCost - b.limitedCost;
}
