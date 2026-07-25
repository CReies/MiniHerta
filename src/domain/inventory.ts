import type { Inventory, ItemKind, SerializedInventory } from "./types.js";

export const inventoryStorageKey = "herta-0cycle-inventory-v1";

export interface MutableInventory {
  characters: Map<string, number>;
  lightCones: Map<string, number>;
}

export function createEmptyInventory(): Inventory {
  return {
    characters: new Map(),
    lightCones: new Map(),
  };
}

export function inventoryLevelBounds(kind: ItemKind): { min: number; max: number } {
  return kind === "character" ? { min: 0, max: 6 } : { min: 1, max: 5 };
}

export function stepInventoryLevel(kind: ItemKind, current: number | undefined, direction: -1 | 1): number | null {
  const { min, max } = inventoryLevelBounds(kind);
  if (current === undefined) return direction === 1 ? min : null;
  const next = current + direction;
  if (next < min) return null;
  return Math.min(next, max);
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
  data: unknown,
  reconcileWith?: { characters: string[]; lightCones: string[] }
): Inventory {
  const parsed = parseSerializedInventory(data);
  const characters = parsed.characters ?? parsed.personajes ?? {};
  const lightCones = parsed.lightCones ?? parsed.light_cones ?? parsed.conos ?? {};
  const inventory = {
    characters: entriesToMap(characters, 0, 6),
    lightCones: entriesToMap(lightCones, 1, 5),
  };

  if (reconcileWith) reconcileInventory(inventory, reconcileWith.characters, reconcileWith.lightCones);
  return inventory;
}

export function parseSerializedInventory(value: unknown): SerializedInventory {
  if (!isSerializedInventory(value)) {
    throw new TypeError("Invalid inventory payload");
  }
  return value;
}

/** Removes entries outside the supplied catalog, mutating the provided working inventory. */
export function reconcileInventory(inventory: MutableInventory, characters: string[], lightCones: string[]): void {
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

function isSerializedInventory(value: unknown): value is SerializedInventory {
  if (!isRecord(value)) return false;

  return (
    [value.characters, value.personajes, value.lightCones, value.light_cones, value.conos].some(
      (collection) => collection !== undefined
    ) &&
    (value.version === undefined || value.version === 1) &&
    (value.exportedAt === undefined || typeof value.exportedAt === "string") &&
    isOptionalLevelRecord(value.characters) &&
    isOptionalLevelRecord(value.personajes) &&
    isOptionalLevelRecord(value.lightCones) &&
    isOptionalLevelRecord(value.light_cones) &&
    isOptionalLevelRecord(value.conos)
  );
}

function isOptionalLevelRecord(value: unknown): value is Record<string, number> | undefined {
  return value === undefined || isLevelRecord(value);
}

function isLevelRecord(value: unknown): value is Record<string, number> {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([name, level]) => name.trim().length > 0 && typeof level === "number" && Number.isFinite(level)
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
