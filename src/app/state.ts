import { catalogNames, createCatalogFromRuns, type ItemCatalog } from "../domain/catalog.js";
import { createEmptyInventory, reconcileInventory } from "../domain/inventory.js";
import { normalizeRuns } from "../domain/normalize.js";
import type { Inventory, RawRun, Run } from "../domain/types.js";

export interface AppState {
  runs: Run[];
  catalog: ItemCatalog;
  inventory: Inventory;
}

export function createAppState(inventory: Inventory = createEmptyInventory()): AppState {
  return {
    runs: [],
    catalog: { characters: [], lightCones: [] },
    inventory,
  };
}

export function setInventory(state: AppState, inventory: Inventory): void {
  state.inventory = inventory;
}

export function setRuns(state: AppState, rawRuns: RawRun[]): void {
  state.runs = normalizeRuns(rawRuns);
  state.catalog = createCatalogFromRuns(state.runs);
  reconcileStateInventory(state);
}

export function resetInventory(state: AppState): void {
  state.inventory = createEmptyInventory();
}

export function reconcileStateInventory(state: AppState): void {
  const names = catalogNames(state.catalog);
  reconcileInventory(state.inventory, names.characters, names.lightCones);
}
