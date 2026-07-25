import type { ItemKind } from "../item.types.js";

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
