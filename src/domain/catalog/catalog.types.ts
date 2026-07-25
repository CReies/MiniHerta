import type { ItemKind, Rarity } from "../item.types.js";

export interface CatalogItem {
  readonly kind: ItemKind;
  readonly name: string;
  readonly rarity: Rarity;
}

export interface ItemCatalog {
  readonly characters: readonly CatalogItem[];
  readonly lightCones: readonly CatalogItem[];
  readonly itemsByKind: Readonly<Record<ItemKind, ReadonlyMap<string, CatalogItem>>>;
}
