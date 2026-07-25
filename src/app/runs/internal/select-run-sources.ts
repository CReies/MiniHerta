import type { RunSource } from "../runs-repository.js";

export interface RunSourceSelection {
  readonly version: string;
  readonly sources: readonly RunSource[];
}

export function selectRunSources(
  runSources: readonly RunSource[],
  endgame: string,
  requestedVersion: string
): RunSourceSelection | null {
  const candidates = endgame === "Todos" ? runSources : runSources.filter((source) => source.endgame === endgame);
  const version = candidates.some((candidate) => candidate.version === requestedVersion)
    ? requestedVersion
    : candidates[0]?.version;
  if (!version) return null;

  return {
    version,
    sources: candidates.filter((candidate) => candidate.version === version),
  };
}
