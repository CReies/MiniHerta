import type { Run } from "../../domain/runs/run.types.js";
import { evaluateRun } from "../../domain/scoring/evaluate-run.js";
import { applyResultMode, compareRuns, matchesFilters } from "../../domain/scoring/filter-runs.js";
import type { EvaluatedRun, FilterState } from "../../domain/scoring/scoring.types.js";
import { isThreeTeamSelection, selectThreeTeamRuns } from "../../domain/scoring/team-bundle.js";
import type { AppState } from "../application-state/app-state.types.js";

export interface ResultSelection {
  evaluated: EvaluatedRun[];
  visible: EvaluatedRun[];
}

export type AdditionalRunSearchText = (run: Run) => string;

export function selectResults(
  state: AppState,
  filters: FilterState = state.filters,
  additionalSearchText: AdditionalRunSearchText = () => ""
): ResultSelection {
  const hasSearchQuery = filters.resultSearch.trim().length > 0;
  const evaluated = state.runs
    .filter((run) => matchesFilters(run, filters, hasSearchQuery ? additionalSearchText(run) : ""))
    .map((run) => evaluateRun(run, state.inventory, filters.lcMode, state.catalog));
  const filtered = applyResultMode(evaluated, filters.resultMode);
  const visible = isThreeTeamSelection(filters.boss)
    ? selectBundleResults(filtered, filters)
    : filtered.sort((a, b) => compareRuns(a, b, filters.sortMode));

  return { evaluated, visible };
}

function selectBundleResults(runs: readonly EvaluatedRun[], filters: FilterState): EvaluatedRun[] {
  const ranked = [...runs].sort((a, b) => compareRuns(a, b, "missing"));
  return selectThreeTeamRuns(ranked, filters.endgame).sort((a, b) => compareRuns(a, b, filters.sortMode));
}
