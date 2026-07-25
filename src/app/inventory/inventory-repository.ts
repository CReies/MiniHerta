import type { Inventory } from "../../domain/inventory/inventory.types.js";

export interface InventoryRepository {
  load(): Inventory;
  save(inventory: Inventory): void;
}
