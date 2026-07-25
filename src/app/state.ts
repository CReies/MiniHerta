import { createCatalogFromRuns, createEmptyCatalog, type ItemCatalog } from "../domain/catalog.js";
import { createEmptyInventory } from "../domain/inventory.js";
import { normalizeRuns } from "../domain/normalize.js";
import type { FilterState, Inventory, ItemKind, RawRun, Run } from "../domain/types.js";
import type { RunSource } from "./ports.js";

export type AppErrorCode =
  | "runsDownloadFailed"
  | "runCollectionFailed"
  | "runsFileInvalid"
  | "inventoryFileInvalid"
  | "inventoryStorageReadFailed"
  | "inventoryStorageWriteFailed";

export type AppStatus =
  | { readonly type: "idle" }
  | { readonly type: "loading"; readonly message: "loadingRuns" }
  | { readonly type: "ready" }
  | { readonly type: "error"; readonly message: AppErrorCode };

export interface InventorySearchState {
  readonly character: string;
  readonly lightCone: string;
}

export interface AppState {
  readonly runs: readonly Run[];
  readonly runSources: readonly RunSource[];
  readonly catalog: ItemCatalog;
  readonly inventory: Inventory;
  readonly filters: FilterState;
  readonly inventorySearch: InventorySearchState;
  readonly status: AppStatus;
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
    return createSnapshot(this.state);
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  replaceRuns(rawRuns: RawRun[]): void {
    const runs = freezeRuns(normalizeRuns(rawRuns));
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

function cloneInventory(inventory: Inventory): { characters: Map<string, number>; lightCones: Map<string, number> } {
  return {
    characters: new Map(inventory.characters),
    lightCones: new Map(inventory.lightCones),
  };
}

function freezeRuns(runs: Run[]): readonly Run[] {
  return Object.freeze(
    runs.map((run) =>
      Object.freeze({
        ...run,
        team: Object.freeze(run.team.map((member) => Object.freeze({ ...member }))),
      })
    )
  );
}

function createSnapshot(state: AppState): AppState {
  const characters = Object.freeze(state.catalog.characters.map((item) => Object.freeze({ ...item })));
  const lightCones = Object.freeze(state.catalog.lightCones.map((item) => Object.freeze({ ...item })));

  return {
    runs: state.runs,
    runSources: state.runSources,
    catalog: {
      characters,
      lightCones,
      itemsByKind: {
        character: new Map(characters.map((item) => [item.name, item])),
        lightCone: new Map(lightCones.map((item) => [item.name, item])),
      },
    },
    inventory: cloneInventory(state.inventory),
    filters: { ...state.filters },
    inventorySearch: { ...state.inventorySearch },
    status: { ...state.status },
  };
}
