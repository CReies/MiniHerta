import type { CatalogItem } from "../domain/catalog.js";
import type { LightConeUsage } from "../domain/light-cone-usage.js";
import { normalizeText } from "../shared/normalize-text.js";
import { itemSearchLabels } from "./item-presentation.js";

export function filterCatalogItems(items: readonly CatalogItem[], search: string): CatalogItem[] {
  const query = normalizeText(search);
  return items.filter((item) =>
    itemSearchLabels(item.kind, item.name).some((label) => normalizeText(label).includes(query))
  );
}

export function filterCharacters(
  characters: readonly CatalogItem[],
  usageByCharacter: ReadonlyMap<string, readonly LightConeUsage[]>,
  search: string
): CatalogItem[] {
  const query = normalizeText(search);
  if (!query) return [...characters];

  return characters.filter((character) => {
    if (itemSearchLabels("character", character.name).some((label) => normalizeText(label).includes(query))) {
      return true;
    }
    return (usageByCharacter.get(character.name) ?? []).some((lightCone) =>
      itemSearchLabels("lightCone", lightCone.name).some((label) => normalizeText(label).includes(query))
    );
  });
}
