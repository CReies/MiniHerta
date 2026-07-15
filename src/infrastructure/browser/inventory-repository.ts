import type { InventoryRepository } from "../../app/ports.js";
import {
  createEmptyInventory,
  importInventory,
  inventoryStorageKey,
  serializeInventory,
} from "../../domain/inventory.js";
import type { Inventory, SerializedInventory } from "../../domain/types.js";

export class LocalStorageInventoryRepository implements InventoryRepository {
  constructor(
    private readonly storage: Storage,
    private readonly storageKey = inventoryStorageKey
  ) {}

  load(): Inventory {
    try {
      const raw = this.storage.getItem(this.storageKey);
      return raw ? importInventory(JSON.parse(raw) as SerializedInventory) : createEmptyInventory();
    } catch {
      return createEmptyInventory();
    }
  }

  save(inventory: Inventory): void {
    this.storage.setItem(this.storageKey, JSON.stringify(serializeInventory(inventory)));
  }
}
