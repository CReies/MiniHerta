import type { RawRun } from "../../domain/runs/run.types.js";

export interface RunSource {
  readonly file: string;
  readonly endgame: string;
  readonly version: string;
  readonly updatedAt: string;
}

export interface RunsRepository {
  load(): Promise<RawRun[]>;
}

export interface SelectableRunsRepository extends RunsRepository {
  list(): Promise<RunSource[]>;
  loadSource(source: RunSource): Promise<RawRun[]>;
}
