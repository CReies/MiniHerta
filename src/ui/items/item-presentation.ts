import { spanishCharacterNames, spanishLightConeNames } from "../../data/spanish-item-names.js";
import type { ItemKind } from "../../domain/item.types.js";
import { characterAssets, lightConeAssets } from "../../generated/assets.js";
import type { Locale } from "../localization/locale.js";

const spanishNamesByKind: Readonly<Record<ItemKind, Readonly<Record<string, string>>>> = {
  character: spanishCharacterNames,
  lightCone: spanishLightConeNames,
};

const assetsByKind: Readonly<Record<ItemKind, Readonly<Record<string, string>>>> = {
  character: characterAssets,
  lightCone: lightConeAssets,
};

export function itemLabel(kind: ItemKind, name: string, locale: Locale): string {
  return locale === "es" ? (spanishNamesByKind[kind][name] ?? name) : name;
}

export function itemImageUrl(kind: ItemKind, name: string): string {
  const folder = kind === "character" ? "characters" : "lightcones";
  return assetsByKind[kind][name] ?? `assets/${folder}/${assetFileName(name)}`;
}

function assetFileName(name: string): string {
  return `${name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}.webp`;
}
