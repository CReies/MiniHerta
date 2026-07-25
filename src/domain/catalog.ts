import type { ItemKind, Rarity, Run } from "./types.js";

export interface CatalogItem {
  readonly kind: ItemKind;
  readonly name: string;
  readonly rarity: Rarity;
}

export interface ItemCatalog {
  characters: readonly CatalogItem[];
  lightCones: readonly CatalogItem[];
  itemsByKind: Readonly<Record<ItemKind, ReadonlyMap<string, CatalogItem>>>;
}

const fourStarCharacters = new Set([
  "Arlan",
  "Asta",
  "Dan Heng",
  "Gallagher",
  "Guinaifen",
  "Hanya",
  "Herta",
  "Hook",
  "Luka",
  "Lynx",
  "March 7th",
  "Misha",
  "Moze",
  "Natasha",
  "Pela",
  "Qingque",
  "Sampo",
  "Serval",
  "Sushang",
  "Tingyun",
  "Trailblazer (Elation)",
  "Trailblazer (Harmony)",
  "Trailblazer (Remembrance)",
  "Xueyi",
  "Yukong",
]);

const fourStarLightCones = new Set([
  "A Secret Vow",
  "After the Charmony Fall",
  "Boundless Choreo",
  "Concert for Two",
  "Dance! Dance! Dance!",
  "Dance Dance Dance",
  "Day One of My New Life",
  "Dream's Montage",
  "Eyes of the Prey",
  "Geniuses' Greetings",
  "Geniuses' Repose",
  "Good Night and Sleep Well",
  "Indelible Promise",
  "Landau's Choice",
  "Make the World Clamor",
  "Memories of the Past",
  "Only Silence Remains",
  "Perfect Timing",
  "Planetary Rendezvous",
  "Poised to Bloom",
  "Post-Op Conversation",
  "Resolution Shines As Pearls of Sweat",
  "Shadowed by Night",
  "Shared Feeling",
  "Subscribe for More!",
  "Swordplay",
  "The Birth of the Self",
  "The Moles Welcome You",
  "The Story's Next Page",
  "Trend of the Universal Market",
  "Under the Blue Sky",
]);

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

export function itemRarity(catalog: ItemCatalog, kind: ItemKind, name: string): Rarity {
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
    rarity: inferRarity(kind, name),
  };
}

function inferRarity(kind: ItemKind, name: string): Rarity {
  const fourStars = kind === "character" ? fourStarCharacters : fourStarLightCones;
  return fourStars.has(name) ? 4 : 5;
}
