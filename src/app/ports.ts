import type { Inventory, RawRun } from "../domain/types.js";

export interface RunsRepository {
  load(): Promise<RawRun[]>;
}

export interface InventoryRepository {
  load(): Inventory;
  save(inventory: Inventory): void;
}
