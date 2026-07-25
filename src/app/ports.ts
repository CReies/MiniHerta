import type { Inventory, RawRun } from "../domain/types.js";

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

export interface InventoryRepository {
  load(): Inventory;
  save(inventory: Inventory): void;
}
