import { applyResultMode, compareRuns, evaluateRun, matchesFilters } from "../domain/scoring.js";
import type { EvaluatedRun, FilterState } from "../domain/types.js";
import type { AppState } from "./state.js";
import { findCatalogItem } from "../domain/catalog.js";
import type { Run } from "../domain/types.js";

export interface ResultSelection {
  evaluated: EvaluatedRun[];
  visible: EvaluatedRun[];
}

export function selectResults(state: AppState, filters: FilterState = state.filters): ResultSelection {
  const evaluated = state.runs
    .map((run) => evaluateRun(run, state.inventory, filters.lcMode, state.catalog))
    .filter((run) => matchesFilters(run, filters, localizedRunSearchText(run, state)));
  const visible = applyResultMode(evaluated, filters.resultMode).sort((a, b) => compareRuns(a, b, filters.sortMode));

  return { evaluated, visible };
}

function localizedRunSearchText(run: Run, state: AppState): string {
  return run.team
    .flatMap((member) => [
      ...Object.values(findCatalogItem(state.catalog, "character", member.char).labels),
      ...(member.lc ? Object.values(findCatalogItem(state.catalog, "lightCone", member.lc).labels) : []),
    ])
    .join(" ");
}
