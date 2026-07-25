import type { SerializedInventory } from "../domain/inventory/inventory.types.js";
import type { ItemKind } from "../domain/item.types.js";
import type { FilterState } from "../domain/scoring/scoring.types.js";
import type { AppStore } from "./application-state/app-store.js";
import type { AppErrorCode, InventorySearchState } from "./application-state/app-state.types.js";
import { InventoryActions } from "./inventory/inventory-actions.js";
import type { InventoryRepository } from "./inventory/inventory-repository.js";
import { RunActions } from "./runs/run-actions.js";
import type { RunsRepository } from "./runs/runs-repository.js";

/** Public application facade used by the presentation layer. */
export class HertaApplication {
  private readonly inventoryActions: InventoryActions;
  private readonly runActions: RunActions;

  constructor(
    readonly store: AppStore,
    inventoryRepository: InventoryRepository,
    runsRepositories: readonly RunsRepository[]
  ) {
    this.inventoryActions = new InventoryActions(store, inventoryRepository);
    this.runActions = new RunActions(
      store,
      runsRepositories,
      () => this.inventoryActions.completeRunLoad(),
      () => this.inventoryActions.restoreReadyStatus()
    );
  }

  async initialize(): Promise<void> {
    this.inventoryActions.loadFromStorage();
    await this.runActions.initialize();
  }

  replaceRunsPayload(payload: unknown): void {
    this.runActions.replacePayload(payload);
  }

  importInventory(data: unknown): void {
    this.inventoryActions.import(data);
  }

  updateInventoryItem(kind: ItemKind, name: string, level: number | null): void {
    this.inventoryActions.updateItem(kind, name, level);
  }

  resetInventory(): void {
    this.inventoryActions.reset();
  }

  updateFilters(filters: Partial<FilterState>): void {
    this.store.updateFilters(filters);
    this.inventoryActions.restoreReadyStatus();
  }

  selectRunSource(endgame: string, version: string): Promise<void> {
    return this.runActions.selectSource(endgame, version);
  }

  updateInventorySearch(kind: keyof InventorySearchState, query: string): void {
    this.store.updateInventorySearch(kind, query);
    this.inventoryActions.restoreReadyStatus();
  }

  exportInventory(): SerializedInventory {
    return this.inventoryActions.export();
  }

  reportError(message: AppErrorCode): void {
    this.store.setStatus({ type: "error", message });
  }
}
