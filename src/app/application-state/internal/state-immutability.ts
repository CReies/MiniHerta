import type { Inventory, MutableInventory } from "../../../domain/inventory/inventory.types.js";
import type { Run } from "../../../domain/runs/run.types.js";
import type { AppState } from "../app-state.types.js";

export function cloneInventory(inventory: Inventory): MutableInventory {
  return {
    characters: new Map(inventory.characters),
    lightCones: new Map(inventory.lightCones),
  };
}

export function freezeRuns(runs: Run[]): readonly Run[] {
  return Object.freeze(
    runs.map((run) =>
      Object.freeze({
        ...run,
        team: Object.freeze(run.team.map((member) => Object.freeze({ ...member }))),
      })
    )
  );
}

export function createStateSnapshot(state: AppState): AppState {
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
