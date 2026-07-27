import type { RunSource } from "../runs-repository.js";
import { canonicalEndgame } from "../../../domain/runs/endgame.js";

export interface RunSourceSelection {
  readonly version: string;
  readonly sources: readonly RunSource[];
}

export function selectRunSources(
  runSources: readonly RunSource[],
  endgame: string,
  requestedVersion: string
): RunSourceSelection | null {
  const selectedEndgame = canonicalEndgame(endgame);
  const candidates =
    selectedEndgame === "Todos"
      ? runSources
      : runSources.filter((source) => canonicalEndgame(source.endgame) === selectedEndgame);
  const version = candidates.some((candidate) => candidate.version === requestedVersion)
    ? requestedVersion
    : candidates[0]?.version;
  if (!version) return null;

  return {
    version,
    sources: candidates.filter((candidate) => candidate.version === version),
  };
}
