import type { InventoryRepository } from "../../app/inventory/inventory-repository.js";
import { createEmptyInventory } from "../../domain/inventory/create-inventory.js";
import {
  importInventory,
  inventoryStorageKey,
  serializeInventory,
} from "../../domain/inventory/inventory-serialization.js";
import type { Inventory } from "../../domain/inventory/inventory.types.js";

export class LocalStorageInventoryRepository implements InventoryRepository {
  constructor(
    private readonly storage: Storage,
    private readonly storageKey = inventoryStorageKey
  ) {}

  load(): Inventory {
    const raw = this.storage.getItem(this.storageKey);
    if (raw === null) return createEmptyInventory();
    const payload: unknown = JSON.parse(raw);
    return importInventory(payload);
  }

  save(inventory: Inventory): void {
    this.storage.setItem(this.storageKey, JSON.stringify(serializeInventory(inventory)));
  }
}
