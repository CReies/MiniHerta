import type { Inventory, MutableInventory } from "./inventory.types.js";

export function createEmptyInventory(): Inventory {
  return {
    characters: new Map(),
    lightCones: new Map(),
  };
}

/** Removes entries outside the supplied catalog, mutating the provided working inventory. */
export function reconcileInventory(inventory: MutableInventory, characters: string[], lightCones: string[]): void {
  const characterSet = new Set(characters);
  const lightConeSet = new Set(lightCones);

  for (const character of [...inventory.characters.keys()]) {
    if (!characterSet.has(character)) inventory.characters.delete(character);
  }
  for (const lightCone of [...inventory.lightCones.keys()]) {
    if (!lightConeSet.has(lightCone)) inventory.lightCones.delete(lightCone);
  }
}
