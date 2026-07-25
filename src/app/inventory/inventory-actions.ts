import { importInventory, serializeInventory } from "../../domain/inventory/inventory-serialization.js";
import type { SerializedInventory } from "../../domain/inventory/inventory.types.js";
import type { ItemKind } from "../../domain/item.types.js";
import type { AppStore } from "../application-state/app-store.js";
import type { AppErrorCode } from "../application-state/app-state.types.js";
import type { InventoryRepository } from "./inventory-repository.js";

type InventoryStorageErrorCode = Extract<AppErrorCode, "inventoryStorageReadFailed" | "inventoryStorageWriteFailed">;

export class InventoryActions {
  private storageError: InventoryStorageErrorCode | null = null;

  constructor(
    private readonly store: AppStore,
    private readonly repository: InventoryRepository
  ) {}

  loadFromStorage(): void {
    try {
      this.store.replaceInventory(this.repository.load());
      this.storageError = null;
    } catch {
      this.storageError = "inventoryStorageReadFailed";
    }
  }

  import(data: unknown): void {
    // The runtime catalog is intentionally partial because only one run source is loaded at a time.
    this.store.replaceInventory(importInventory(data));
    if (this.persist()) this.restoreReadyStatus();
  }

  updateItem(kind: ItemKind, name: string, level: number | null): void {
    this.store.updateInventoryItem(kind, name, level);
    if (this.persist()) this.restoreReadyStatus();
  }

  reset(): void {
    this.store.resetInventory();
    if (this.persist()) this.restoreReadyStatus();
  }

  export(): SerializedInventory {
    return serializeInventory(this.store.snapshot.inventory);
  }

  completeRunLoad(): void {
    this.store.setStatus(this.storageError ? { type: "error", message: this.storageError } : { type: "ready" });
  }

  restoreReadyStatus(): void {
    const state = this.store.snapshot;
    if (state.runs.length > 0 && state.status.type === "error") {
      this.completeRunLoad();
    }
  }

  private persist(): boolean {
    try {
      this.repository.save(this.store.snapshot.inventory);
      this.storageError = null;
      return true;
    } catch {
      this.storageError = "inventoryStorageWriteFailed";
      this.store.setStatus({ type: "error", message: this.storageError });
      return false;
    }
  }
}
