import { characterAssets, lightConeAssets } from "../generated/assets.js";
import type { ItemKind, Rarity, Run } from "./types.js";

export type Locale = "en" | "es";

export interface CatalogItem {
  kind: ItemKind;
  name: string;
  labels: Partial<Record<Locale, string>> & { en: string };
  rarity: Rarity;
  assetUrl: string;
}

export interface ItemCatalog {
  characters: CatalogItem[];
  lightCones: CatalogItem[];
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

export function createCatalogFromRuns(runs: Run[]): ItemCatalog {
  return {
    characters: collectRunItems(runs, "character"),
    lightCones: collectRunItems(runs, "lightCone"),
  };
}

export function catalogNames(catalog: ItemCatalog): { characters: string[]; lightCones: string[] } {
  return {
    characters: catalog.characters.map((item) => item.name),
    lightCones: catalog.lightCones.map((item) => item.name),
  };
}

export function findCatalogItem(catalog: ItemCatalog, kind: ItemKind, name: string): CatalogItem {
  const items = kind === "character" ? catalog.characters : catalog.lightCones;
  return items.find((item) => item.name === name) ?? createCatalogItem(kind, name);
}

export function itemImageUrl(catalog: ItemCatalog, kind: ItemKind, name: string): string {
  return findCatalogItem(catalog, kind, name).assetUrl;
}

export function itemRarity(catalog: ItemCatalog, kind: ItemKind, name: string): Rarity {
  return findCatalogItem(catalog, kind, name).rarity;
}

function collectRunItems(runs: Run[], kind: ItemKind): CatalogItem[] {
  const names = new Set<string>();

  for (const run of runs) {
    for (const member of run.team) {
      const name = kind === "character" ? member.char : member.lc;
      if (name) names.add(name);
    }
  }

  return [...names].sort().map((name) => createCatalogItem(kind, name));
}

function createCatalogItem(kind: ItemKind, name: string): CatalogItem {
  return {
    kind,
    name,
    labels: { en: name },
    rarity: inferRarity(kind, name),
    assetUrl: assetUrl(kind, name),
  };
}

function inferRarity(kind: ItemKind, name: string): Rarity {
  const fourStars = kind === "character" ? fourStarCharacters : fourStarLightCones;
  return fourStars.has(name) ? 4 : 5;
}

function assetUrl(kind: ItemKind, name: string): string {
  const folder = kind === "character" ? "characters" : "lightcones";
  const assets = kind === "character" ? characterAssets : lightConeAssets;
  return assets[name] || `assets/${folder}/${assetFileName(name)}`;
}

function assetFileName(name: string): string {
  return `${name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}.png`;
}
