import { spanishCharacterNames, spanishLightConeNames } from "../data/spanish-item-names.js";
import type { ItemKind, Run } from "../domain/types.js";
import { characterAssets, lightConeAssets } from "../generated/assets.js";
import type { Locale } from "./i18n.js";

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

export function itemSearchLabels(kind: ItemKind, name: string): readonly string[] {
  const spanishName = spanishNamesByKind[kind][name];
  return spanishName && spanishName !== name ? [name, spanishName] : [name];
}

export function itemImageUrl(kind: ItemKind, name: string): string {
  const folder = kind === "character" ? "characters" : "lightcones";
  return assetsByKind[kind][name] ?? `assets/${folder}/${assetFileName(name)}`;
}

export function localizedRunSearchText(run: Run): string {
  return run.team
    .flatMap((member) => [
      ...itemSearchLabels("character", member.char),
      ...(member.lc ? itemSearchLabels("lightCone", member.lc) : []),
    ])
    .join(" ");
}

function assetFileName(name: string): string {
  return `${name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}.webp`;
}
