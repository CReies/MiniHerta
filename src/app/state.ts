import { createCatalogFromRuns, type ItemCatalog } from "../domain/catalog.js";
import { createEmptyInventory } from "../domain/inventory.js";
import { normalizeRuns } from "../domain/normalize.js";
import type { FilterState, Inventory, ItemKind, RawRun, Run } from "../domain/types.js";
import type { RunSource } from "./ports.js";

export type AppStatus = "idle" | "loading" | "ready" | "error";

export interface InventorySearchState {
  character: string;
  lightCone: string;
}

export interface AppState {
  runs: Run[];
  runSources: RunSource[];
  catalog: ItemCatalog;
  inventory: Inventory;
  filters: FilterState;
  inventorySearch: InventorySearchState;
  status: AppStatus;
  statusMessage: string;
}

export type StateListener = (state: AppState) => void;

const defaultFilters: FilterState = {
  endgame: "Todos",
  version: "",
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
      runs: [],
      runSources: [],
      catalog: { characters: [], lightCones: [] },
      inventory: cloneInventory(inventory),
      filters: { ...defaultFilters },
      inventorySearch: { character: "", lightCone: "" },
      status: "idle",
      statusMessage: "",
    };
  }

  get snapshot(): AppState {
    return this.state;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  replaceRuns(rawRuns: RawRun[]): void {
    const runs = normalizeRuns(rawRuns);
    const catalog = createCatalogFromRuns(runs);
    const inventory = cloneInventory(this.state.inventory);
    const availableEndgames = new Set(runs.map((run) => run.endgame));
    const availableVersions = new Set(runs.map((run) => run.version));
    const endgame =
      this.state.filters.endgame === "Todos" || availableEndgames.has(this.state.filters.endgame)
        ? this.state.filters.endgame
        : "Todos";
    const version = availableVersions.has(this.state.filters.version)
      ? this.state.filters.version
      : latestVersion(availableVersions);

    this.commit({ ...this.state, runs, catalog, inventory, filters: { ...this.state.filters, endgame, version } });
  }

  replaceRunSources(runSources: RunSource[]): void {
    this.commit({ ...this.state, runSources: [...runSources] });
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

  setStatus(status: AppStatus, statusMessage = ""): void {
    this.commit({ ...this.state, status, statusMessage });
  }

  private commit(nextState: AppState): void {
    this.state = nextState;
    for (const listener of this.listeners) listener(this.state);
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

function cloneInventory(inventory: Inventory): Inventory {
  return {
    characters: new Map(inventory.characters),
    lightCones: new Map(inventory.lightCones),
  };
}
