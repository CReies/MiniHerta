import type { ItemCatalog } from "../../domain/catalog/catalog.types.js";
import type { Inventory } from "../../domain/inventory/inventory.types.js";
import { mostUsedLightConesByCharacter, type LightConeUsage } from "../../domain/runs/light-cone-usage.js";
import type { Run } from "../../domain/runs/run.types.js";
import { t, type Locale } from "../localization/locale.js";
import type { InventoryElements } from "./inventory-elements.js";
import { filterCatalogItems, filterCharacters } from "./inventory-search.js";
import type { InventoryItemChange } from "./inventory-view.types.js";
import {
  createCharacterCard,
  createEmptyInventoryMessage,
  createLightConeCard,
} from "./internal/create-inventory-card.js";
import { captureInventoryFocus, restoreInventoryFocus } from "./internal/inventory-focus.js";

export function renderInventory(
  elements: InventoryElements,
  inventory: Inventory,
  catalog: ItemCatalog,
  runs: readonly Run[],
  search: { character: string; lightCone: string },
  onChange: InventoryItemChange,
  locale: Locale
): void {
  const focusId = captureInventoryFocus();
  const usageByCharacter = mostUsedLightConesByCharacter(runs);
  const recommendedConeNames = new Set(
    [...usageByCharacter.values()].flatMap((lightCones) => lightCones.map((lightCone) => lightCone.name))
  );

  renderCharacterList(elements, inventory, catalog, usageByCharacter, search.character, onChange, locale);
  renderOtherLightConeList(elements, inventory, catalog, recommendedConeNames, search.lightCone, onChange, locale);
  renderInventoryCounts(elements, inventory, catalog, recommendedConeNames.size);
  restoreInventoryFocus(elements, focusId);
}

function renderCharacterList(
  elements: InventoryElements,
  inventory: Inventory,
  catalog: ItemCatalog,
  usageByCharacter: ReadonlyMap<string, readonly LightConeUsage[]>,
  search: string,
  onChange: InventoryItemChange,
  locale: Locale
): void {
  elements.characters.replaceChildren();
  for (const character of filterCharacters(catalog.characters, usageByCharacter, search)) {
    elements.characters.appendChild(
      createCharacterCard({
        character,
        recommendations: usageByCharacter.get(character.name) ?? [],
        inventory,
        catalog,
        elements,
        onChange,
        locale,
      })
    );
  }
  if (elements.characters.childElementCount === 0) {
    elements.characters.appendChild(createEmptyInventoryMessage(t("inventory.noCharacters")));
  }
}

function renderOtherLightConeList(
  elements: InventoryElements,
  inventory: Inventory,
  catalog: ItemCatalog,
  recommendedConeNames: ReadonlySet<string>,
  search: string,
  onChange: InventoryItemChange,
  locale: Locale
): void {
  elements.lightCones.replaceChildren();
  const otherLightCones = filterCatalogItems(
    catalog.lightCones.filter((lightCone) => !recommendedConeNames.has(lightCone.name)),
    search
  );
  for (const lightCone of otherLightCones) {
    elements.lightCones.appendChild(
      createLightConeCard(lightCone, inventory.lightCones, elements.lightConeCardTemplate, onChange, locale)
    );
  }
  if (otherLightCones.length === 0) {
    elements.lightCones.appendChild(createEmptyInventoryMessage(t("inventory.noOtherCones")));
  }
}

function renderInventoryCounts(
  elements: InventoryElements,
  inventory: Inventory,
  catalog: ItemCatalog,
  recommendedConeCount: number
): void {
  elements.characterCount.textContent = t("inventory.characterCount", {
    owned: inventory.characters.size,
    total: catalog.characters.length,
  });
  elements.lightConeCount.textContent = t("inventory.coneCount", {
    owned: inventory.lightCones.size,
    recommended: recommendedConeCount,
  });
}
