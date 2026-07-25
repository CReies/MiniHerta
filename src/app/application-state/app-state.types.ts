import type { ItemCatalog } from "../../domain/catalog/catalog.types.js";
import type { Inventory } from "../../domain/inventory/inventory.types.js";
import type { Run } from "../../domain/runs/run.types.js";
import type { FilterState } from "../../domain/scoring/scoring.types.js";
import type { RunSource } from "../runs/runs-repository.js";

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
