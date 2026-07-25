import type { ItemKind } from "../item.types.js";
import type { Run } from "../runs/run.types.js";
import type { CatalogItem, ItemCatalog } from "./catalog.types.js";
import { inferItemRarity } from "./item-rarity.js";

export function createCatalogFromRuns(runs: readonly Run[]): ItemCatalog {
  const namesByKind = {
    character: new Set<string>(),
    lightCone: new Set<string>(),
  };

  for (const run of runs) {
    for (const member of run.team) {
      if (member.char) namesByKind.character.add(member.char);
      if (member.lc) namesByKind.lightCone.add(member.lc);
    }
  }

  return createCatalog(namesByKind);
}

export function createEmptyCatalog(): ItemCatalog {
  return createCatalog({ character: new Set(), lightCone: new Set() });
}

export function findCatalogItem(catalog: ItemCatalog, kind: ItemKind, name: string): CatalogItem {
  return catalog.itemsByKind[kind].get(name) ?? createCatalogItem(kind, name);
}

export function itemRarity(catalog: ItemCatalog, kind: ItemKind, name: string): CatalogItem["rarity"] {
  return findCatalogItem(catalog, kind, name).rarity;
}

function createCatalog(namesByKind: Readonly<Record<ItemKind, ReadonlySet<string>>>): ItemCatalog {
  const characters = createCatalogItems("character", namesByKind.character);
  const lightCones = createCatalogItems("lightCone", namesByKind.lightCone);

  return {
    characters,
    lightCones,
    itemsByKind: {
      character: new Map(characters.map((item) => [item.name, item])),
      lightCone: new Map(lightCones.map((item) => [item.name, item])),
    },
  };
}

function createCatalogItems(kind: ItemKind, names: ReadonlySet<string>): CatalogItem[] {
  return [...names].sort().map((name) => createCatalogItem(kind, name));
}

function createCatalogItem(kind: ItemKind, name: string): CatalogItem {
  return {
    kind,
    name,
    rarity: inferItemRarity(kind, name),
  };
}
