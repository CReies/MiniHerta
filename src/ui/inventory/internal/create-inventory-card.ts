import type { CatalogItem, ItemCatalog } from "../../../domain/catalog/catalog.types.js";
import type { Inventory } from "../../../domain/inventory/inventory.types.js";
import type { LightConeUsage } from "../../../domain/runs/light-cone-usage.js";
import { itemImageUrl, itemLabel } from "../../items/item-presentation.js";
import { t, type Locale } from "../../localization/locale.js";
import type { InventoryElements } from "../inventory-elements.js";
import type { InventoryItemChange } from "../inventory-view.types.js";
import { bindLevelEditor, bindOwnershipToggle } from "./bind-inventory-controls.js";

interface CharacterCardOptions {
  readonly character: CatalogItem;
  readonly recommendations: readonly LightConeUsage[];
  readonly inventory: Inventory;
  readonly catalog: ItemCatalog;
  readonly elements: InventoryElements;
  readonly onChange: InventoryItemChange;
  readonly locale: Locale;
}

export function createCharacterCard(options: CharacterCardOptions): HTMLElement {
  const card = cloneTemplate(options.elements.characterCardTemplate);
  const checkbox = requireDescendant<HTMLInputElement>(card, ".owned-input");
  const image = requireDescendant<HTMLImageElement>(card, ".inventory-image");
  const name = requireDescendant<HTMLElement>(card, ".name");
  const rarity = requireDescendant<HTMLElement>(card, ".rarity-badge");

  card.classList.toggle("is-owned", options.inventory.characters.has(options.character.name));
  const displayName = itemLabel("character", options.character.name, options.locale);
  name.textContent = displayName;
  rarity.textContent = `${options.character.rarity}★`;
  rarity.classList.add(`rarity-badge--${options.character.rarity}`);
  configureImage(image, "character", options.character.name);
  bindOwnershipToggle(
    checkbox,
    card,
    "character",
    options.character.name,
    displayName,
    options.inventory.characters,
    options.onChange,
    "characters"
  );
  bindLevelEditor({
    kind: "character",
    item: options.character.name,
    focusScope: "characters",
    owned: options.inventory.characters,
    root: card,
    onChange: options.onChange,
    displayName,
  });
  renderRecommendations(card, options);
  return card;
}

export function createLightConeCard(
  lightCone: CatalogItem,
  owned: ReadonlyMap<string, number>,
  template: HTMLTemplateElement,
  onChange: InventoryItemChange,
  locale: Locale,
  recommendation?: LightConeUsage,
  rank?: number,
  focusScope = "other"
): HTMLElement {
  const card = cloneTemplate(template);
  const checkbox = requireDescendant<HTMLInputElement>(card, ".owned-input");
  const image = requireDescendant<HTMLImageElement>(card, ".inventory-image");
  const name = requireDescendant<HTMLElement>(card, ".name");
  const usage = requireDescendant<HTMLElement>(card, ".usage-count");
  const rankElement = requireDescendant<HTMLElement>(card, ".recommendation-rank");

  card.classList.toggle("is-owned", owned.has(lightCone.name));
  card.classList.toggle("is-recommended", Boolean(recommendation));
  const displayName = itemLabel("lightCone", lightCone.name, locale);
  name.textContent = displayName;
  configureImage(image, "lightCone", lightCone.name);
  bindOwnershipToggle(checkbox, card, "lightCone", lightCone.name, displayName, owned, onChange, focusScope);
  bindLevelEditor({ kind: "lightCone", item: lightCone.name, focusScope, displayName, owned, root: card, onChange });

  if (recommendation) {
    usage.textContent = t(recommendation.uses === 1 ? "inventory.use" : "inventory.uses", {
      count: recommendation.uses,
    });
    rankElement.textContent = `#${rank}`;
  } else {
    usage.hidden = true;
    rankElement.hidden = true;
  }

  return card;
}

function renderRecommendations(card: HTMLElement, options: CharacterCardOptions): void {
  const list = requireDescendant<HTMLElement>(card, ".recommended-cone-list");
  for (const [index, recommendation] of options.recommendations.entries()) {
    const catalogItem = options.catalog.itemsByKind.lightCone.get(recommendation.name);
    if (!catalogItem) continue;
    list.appendChild(
      createLightConeCard(
        catalogItem,
        options.inventory.lightCones,
        options.elements.lightConeCardTemplate,
        options.onChange,
        options.locale,
        recommendation,
        index + 1,
        options.character.name
      )
    );
  }

  if (list.childElementCount === 0) {
    list.appendChild(createEmptyInventoryMessage(t("inventory.noRecommendations")));
  }
}

function configureImage(image: HTMLImageElement, kind: CatalogItem["kind"], item: string): void {
  image.alt = "";
  image.hidden = false;
  image.onload = () => {
    const aspectRatio = image.naturalWidth / image.naturalHeight;
    image.classList.toggle("inventory-image--square", kind === "character" && aspectRatio >= 0.9);
  };
  image.onerror = () => {
    image.hidden = true;
  };
  image.src = itemImageUrl(kind, item);
}

function cloneTemplate(template: HTMLTemplateElement): HTMLElement {
  const element = template.content.firstElementChild?.cloneNode(true);
  if (!(element instanceof HTMLElement)) throw new Error(`Template #${template.id} vacío`);
  return element;
}

function requireDescendant<T extends Element>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Falta ${selector} dentro del inventario`);
  return element;
}

export function createEmptyInventoryMessage(message: string): HTMLElement {
  const element = document.createElement("p");
  element.className = "inventory-empty";
  element.textContent = message;
  return element;
}
