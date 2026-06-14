import { applyResultMode, compareRuns, evaluateRun, matchesFilters } from "../domain/scoring.js";
import type { EvaluatedRun, FilterState } from "../domain/types.js";
import type { AppState } from "./state.js";

export interface ResultSelection {
  evaluated: EvaluatedRun[];
  visible: EvaluatedRun[];
}

export function selectResults(state: AppState, filters: FilterState): ResultSelection {
  const evaluated = state.runs
    .map((run) => evaluateRun(run, state.inventory, filters.lcMode, state.catalog))
    .filter((run) => matchesFilters(run, filters));
  const visible = applyResultMode(evaluated, filters.resultMode).sort((a, b) => compareRuns(a, b, filters.sortMode));

  return { evaluated, visible };
}
