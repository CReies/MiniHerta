import type { Inventory, RawRun } from "../domain/types.js";

export interface RunSource {
  file: string;
  endgame: string;
  version: string;
  updatedAt: string;
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
