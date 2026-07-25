import { parseRawRunsPayload } from "../../../domain/runs/parse-runs-payload.js";
import type { RawRun } from "../../../domain/runs/run.types.js";
import type { RunSource, RunsRepository, SelectableRunsRepository } from "../runs-repository.js";

export interface InitialRunLoad {
  readonly runs: RawRun[];
  readonly repository: SelectableRunsRepository | null;
  readonly sources: RunSource[];
  readonly initialSource: RunSource | null;
}

export async function loadInitialRunRepository(repository: RunsRepository): Promise<InitialRunLoad> {
  if (!isSelectableRepository(repository)) {
    return {
      runs: parseRawRunsPayload(await repository.load()),
      repository: null,
      sources: [],
      initialSource: null,
    };
  }

  const sources = await repository.list();
  const initialSource = sources[0];
  if (!initialSource) throw new Error("No hay fuentes de runs disponibles");

  return {
    runs: parseRawRunsPayload(await repository.loadSource(initialSource)),
    repository,
    sources,
    initialSource,
  };
}

export async function loadSelectedRunSources(
  repository: SelectableRunsRepository,
  sources: readonly RunSource[]
): Promise<RawRun[]> {
  const payload = (await Promise.all(sources.map((source) => repository.loadSource(source)))).flat();
  return parseRawRunsPayload(payload);
}

function isSelectableRepository(repository: RunsRepository): repository is SelectableRunsRepository {
  return (
    "list" in repository &&
    typeof repository.list === "function" &&
    "loadSource" in repository &&
    typeof repository.loadSource === "function"
  );
}
