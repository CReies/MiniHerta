import { catalogNames } from "../domain/catalog.js";
import { importInventory, serializeInventory } from "../domain/inventory.js";
import type { FilterState, ItemKind, RawRun, RawRunCollection, SerializedInventory } from "../domain/types.js";
import type { InventoryRepository, RunsRepository } from "./ports.js";
import { AppStore, type InventorySearchState } from "./state.js";

export type RawRunsPayload = RawRun[] | RawRunCollection;

export class HertaApplication {
  constructor(
    readonly store: AppStore,
    private readonly inventoryRepository: InventoryRepository,
    private readonly runsRepositories: RunsRepository[]
  ) {}

  async initialize(): Promise<void> {
    this.store.replaceInventory(this.inventoryRepository.load());
    this.store.setStatus("loading", "Cargando runs...");

    for (const repository of this.runsRepositories) {
      let runs: RawRun[];
      try {
        runs = await repository.load();
      } catch {
        // Repositories are ordered fallbacks; the final failure is reported below.
        continue;
      }

      this.replaceRuns(runs);
      return;
    }

    this.store.setStatus(
      "error",
      'No pude descargar las runs. Abre esta carpeta con un servidor local o usa el botón "Cargar runs".'
    );
  }

  replaceRunsPayload(payload: RawRunsPayload): void {
    this.replaceRuns(Array.isArray(payload) ? payload : payload.items);
  }

  importInventory(data: SerializedInventory): void {
    const inventory = importInventory(data, catalogNames(this.store.snapshot.catalog));
    this.store.replaceInventory(inventory);
    this.persistInventory();
    this.restoreReadyStatus();
  }

  updateInventoryItem(kind: ItemKind, name: string, level: number | null): void {
    this.store.updateInventoryItem(kind, name, level);
    this.persistInventory();
    this.restoreReadyStatus();
  }

  resetInventory(): void {
    this.store.resetInventory();
    this.persistInventory();
    this.restoreReadyStatus();
  }

  updateFilters(filters: Partial<FilterState>): void {
    this.store.updateFilters(filters);
    this.restoreReadyStatus();
  }

  updateInventorySearch(kind: keyof InventorySearchState, query: string): void {
    this.store.updateInventorySearch(kind, query);
    this.restoreReadyStatus();
  }

  exportInventory(): SerializedInventory {
    return serializeInventory(this.store.snapshot.inventory);
  }

  reportError(message: string): void {
    this.store.setStatus("error", message);
  }

  private replaceRuns(rawRuns: RawRun[]): void {
    this.store.replaceRuns(rawRuns);
    this.persistInventory();
    this.store.setStatus("ready");
  }

  private persistInventory(): void {
    this.inventoryRepository.save(this.store.snapshot.inventory);
  }

  private restoreReadyStatus(): void {
    if (this.store.snapshot.runs.length > 0 && this.store.snapshot.status === "error") {
      this.store.setStatus("ready");
    }
  }
}
