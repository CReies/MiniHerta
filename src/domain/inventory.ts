import type { Inventory, SerializedInventory } from "./types.js";

export const inventoryStorageKey = "herta-0cycle-inventory-v1";

export function createEmptyInventory(): Inventory {
  return {
    characters: new Map(),
    lightCones: new Map(),
  };
}

export function serializeInventory(inventory: Inventory): SerializedInventory {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    characters: Object.fromEntries(inventory.characters),
    lightCones: Object.fromEntries(inventory.lightCones),
  };
}

export function importInventory(
  data: SerializedInventory,
  reconcileWith?: { characters: string[]; lightCones: string[] }
): Inventory {
  const characters = data.characters || data.personajes || {};
  const lightCones = data.lightCones || data.light_cones || data.conos || {};
  const inventory = {
    characters: entriesToMap(characters, 0, 6),
    lightCones: entriesToMap(lightCones, 1, 5),
  };

  if (reconcileWith) reconcileInventory(inventory, reconcileWith.characters, reconcileWith.lightCones);
  return inventory;
}

export function loadSavedInventory(): Inventory {
  try {
    const raw = localStorage.getItem(inventoryStorageKey);
    return raw ? importInventory(JSON.parse(raw) as SerializedInventory) : createEmptyInventory();
  } catch {
    return createEmptyInventory();
  }
}

export function saveInventory(inventory: Inventory): void {
  localStorage.setItem(inventoryStorageKey, JSON.stringify(serializeInventory(inventory)));
}

export function reconcileInventory(inventory: Inventory, characters: string[], lightCones: string[]): void {
  const characterSet = new Set(characters);
  const lightConeSet = new Set(lightCones);

  for (const char of [...inventory.characters.keys()]) {
    if (!characterSet.has(char)) inventory.characters.delete(char);
  }
  for (const cone of [...inventory.lightCones.keys()]) {
    if (!lightConeSet.has(cone)) inventory.lightCones.delete(cone);
  }
}

function entriesToMap(input: Record<string, number>, min: number, max: number): Map<string, number> {
  return new Map(
    Object.entries(input)
      .filter(([key]) => typeof key === "string" && key.trim())
      .map(([key, value]) => [key, clampNumber(value, min, max)])
  );
}

function clampNumber(value: unknown, min: number, max: number): number {
  const number = Number(value);
  if (Number.isNaN(number)) return min;
  return Math.min(max, Math.max(min, Math.trunc(number)));
}
