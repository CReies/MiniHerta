import { createCatalogFromRuns, createEmptyCatalog } from "../../domain/catalog/create-catalog.js";
import { createEmptyInventory } from "../../domain/inventory/create-inventory.js";
import type { Inventory } from "../../domain/inventory/inventory.types.js";
import type { ItemKind } from "../../domain/item.types.js";
import { allBosses, canonicalBossName } from "../../domain/runs/boss-filter.js";
import { normalizeRuns } from "../../domain/runs/normalize-runs.js";
import type { RawRun } from "../../domain/runs/run.types.js";
import type { FilterState } from "../../domain/scoring/scoring.types.js";
import type { RunSource } from "../runs/runs-repository.js";
import type { AppState, AppStatus, InventorySearchState, StateListener } from "./app-state.types.js";
import { cloneInventory, createStateSnapshot, freezeRuns } from "./internal/state-immutability.js";

const defaultFilters: FilterState = {
  endgame: "Todos",
  version: "",
  boss: allBosses,
  resultMode: "all",
  lcMode: "strict",
  resultSearch: "",
  sortMode: "missing",
};

export class AppStore {
  private state: AppState;
  private readonly listeners = new Set<StateListener>();

  constructor(inventory: Inventory = createEmptyInventory()) {
    this.state = {
      runs: Object.freeze([]),
      runSources: Object.freeze([]),
      catalog: createEmptyCatalog(),
      inventory: cloneInventory(inventory),
      filters: { ...defaultFilters },
      inventorySearch: { character: "", lightCone: "" },
      status: { type: "idle" },
    };
  }

  get snapshot(): AppState {
    return createStateSnapshot(this.state);
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  replaceRuns(rawRuns: RawRun[]): void {
    const runs = freezeRuns(normalizeRuns(rawRuns));
    const availableEndgames = new Set(runs.map((run) => run.endgame));
    const availableVersions = new Set(runs.map((run) => run.version));
    const availableBosses = new Set(runs.map((run) => canonicalBossName(run.boss)));
    const endgame =
      this.state.filters.endgame === "Todos" || availableEndgames.has(this.state.filters.endgame)
        ? this.state.filters.endgame
        : "Todos";
    const version = availableVersions.has(this.state.filters.version)
      ? this.state.filters.version
      : latestVersion(availableVersions);
    const boss = availableBosses.has(canonicalBossName(this.state.filters.boss))
      ? canonicalBossName(this.state.filters.boss)
      : allBosses;

    this.commit({
      ...this.state,
      runs,
      catalog: createCatalogFromRuns(runs),
      inventory: cloneInventory(this.state.inventory),
      filters: { ...this.state.filters, endgame, version, boss },
    });
  }

  replaceRunSources(runSources: RunSource[]): void {
    const immutableSources = Object.freeze(runSources.map((source) => Object.freeze({ ...source })));
    this.commit({ ...this.state, runSources: immutableSources });
  }

  replaceInventory(inventory: Inventory): void {
    this.commit({ ...this.state, inventory: cloneInventory(inventory) });
  }

  updateInventoryItem(kind: ItemKind, name: string, level: number | null): void {
    const inventory = cloneInventory(this.state.inventory);
    const collection = kind === "character" ? inventory.characters : inventory.lightCones;
    if (level === null) collection.delete(name);
    else collection.set(name, level);
    this.commit({ ...this.state, inventory });
  }

  resetInventory(): void {
    this.commit({ ...this.state, inventory: createEmptyInventory() });
  }

  updateFilters(filters: Partial<FilterState>): void {
    this.commit({ ...this.state, filters: { ...this.state.filters, ...filters } });
  }

  updateInventorySearch(kind: keyof InventorySearchState, query: string): void {
    this.commit({
      ...this.state,
      inventorySearch: { ...this.state.inventorySearch, [kind]: query },
    });
  }

  setStatus(status: AppStatus): void {
    this.commit({ ...this.state, status });
  }

  private commit(nextState: AppState): void {
    this.state = nextState;
    for (const listener of this.listeners) listener(this.snapshot);
  }
}

function latestVersion(versions: Set<string>): string {
  return [...versions].sort(compareVersions).at(-1) ?? "";
}

function compareVersions(a: string, b: string): number {
  const aParts = a.split(".").map(Number);
  const bParts = b.split(".").map(Number);
  const length = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (aParts[index] ?? 0) - (bParts[index] ?? 0);
    if (Number.isFinite(difference) && difference !== 0) return difference;
  }

  return a.localeCompare(b, undefined, { numeric: true });
}
