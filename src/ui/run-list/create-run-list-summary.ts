import { nearScoreLimit } from "../../domain/scoring/filter-runs.js";
import type { EvaluatedRun } from "../../domain/scoring/scoring.types.js";

export interface RunListSummary {
  readonly possible: number;
  readonly near: number;
  readonly total: number;
  readonly visible: number;
}

export function createRunListSummary(runs: readonly EvaluatedRun[], visible: number): RunListSummary {
  let possible = 0;
  let near = 0;

  for (const run of runs) {
    if (run.missingScore === 0) possible += 1;
    else if (run.missingScore <= nearScoreLimit) near += 1;
  }

  return { possible, near, total: runs.length, visible };
}
