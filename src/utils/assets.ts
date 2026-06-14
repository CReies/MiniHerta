import type { ItemKind } from "../domain/types.js";
import { characterAssets, lightConeAssets } from "../generated/assets.js";

export function assetFileName(name: string): string {
  return `${name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}.png`;
}

export function itemImageUrl(kind: ItemKind, name: string): string {
  const folder = kind === "character" ? "characters" : "lightcones";
  const assets = kind === "character" ? characterAssets : lightConeAssets;
  return assets[name] || `assets/${folder}/${assetFileName(name)}`;
}
