import type { CatalogItem, ItemCatalog } from "../domain/catalog.js";
import { inventoryLevelBounds, stepInventoryLevel } from "../domain/inventory.js";
import { mostUsedLightConesByCharacter, type LightConeUsage } from "../domain/light-cone-usage.js";
import type { Inventory, ItemKind, Run } from "../domain/types.js";
import type { Elements } from "./dom.js";
import { t, type Locale } from "./i18n.js";
import { filterCatalogItems, filterCharacters } from "./inventory-search.js";
import { itemImageUrl, itemLabel } from "./item-presentation.js";

export type InventoryItemChange = (kind: ItemKind, item: string, level: number | null) => void;

interface LevelEditorOptions {
  kind: ItemKind;
  item: string;
  focusScope: string;
  owned: ReadonlyMap<string, number>;
  root: HTMLElement;
  onChange: InventoryItemChange;
  displayName: string;
}

export function renderInventory(
  els: Elements,
  inventory: Inventory,
  catalog: ItemCatalog,
  runs: readonly Run[],
  search: { character: string; lightCone: string },
  onChange: InventoryItemChange,
  locale: Locale
): void {
  const focusId = currentInventoryFocusId();
  const usageByCharacter = mostUsedLightConesByCharacter(runs);
  const recommendedConeNames = new Set(
    [...usageByCharacter.values()].flatMap((lightCones) => lightCones.map((lightCone) => lightCone.name))
  );

  renderCharacters(els, inventory, catalog, usageByCharacter, search.character, onChange, locale);
  renderOtherLightCones(els, inventory, catalog, recommendedConeNames, search.lightCone, onChange, locale);

  els.characterCount.textContent = t("inventory.characterCount", {
    owned: inventory.characters.size,
    total: catalog.characters.length,
  });
  els.lightConeCount.textContent = t("inventory.coneCount", {
    owned: inventory.lightCones.size,
    recommended: recommendedConeNames.size,
  });
  restoreInventoryFocus(els, focusId);
}

function renderCharacters(
  els: Elements,
  inventory: Inventory,
  catalog: ItemCatalog,
  usageByCharacter: Map<string, LightConeUsage[]>,
  search: string,
  onChange: InventoryItemChange,
  locale: Locale
): void {
  els.characters.replaceChildren();
  const characters = filterCharacters(catalog.characters, usageByCharacter, search);

  for (const character of characters) {
    els.characters.appendChild(
      createCharacterCard(
        character,
        usageByCharacter.get(character.name) ?? [],
        inventory,
        catalog,
        els,
        onChange,
        locale
      )
    );
  }

  if (characters.length === 0) {
    els.characters.appendChild(createEmptyInventoryMessage(t("inventory.noCharacters")));
  }
}

function renderOtherLightCones(
  els: Elements,
  inventory: Inventory,
  catalog: ItemCatalog,
  recommendedConeNames: Set<string>,
  search: string,
  onChange: InventoryItemChange,
  locale: Locale
): void {
  els.lightCones.replaceChildren();
  const lightCones = filterCatalogItems(
    catalog.lightCones.filter((lightCone) => !recommendedConeNames.has(lightCone.name)),
    search
  );

  for (const lightCone of lightCones) {
    els.lightCones.appendChild(
      createLightConeCard(lightCone, inventory.lightCones, els.lightConeCardTemplate, onChange, locale)
    );
  }

  if (lightCones.length === 0) {
    els.lightCones.appendChild(createEmptyInventoryMessage(t("inventory.noOtherCones")));
  }
}

function createCharacterCard(
  character: CatalogItem,
  recommendations: LightConeUsage[],
  inventory: Inventory,
  catalog: ItemCatalog,
  els: Elements,
  onChange: InventoryItemChange,
  locale: Locale
): HTMLElement {
  const card = cloneTemplate(els.characterCardTemplate);
  const checkbox = requireDescendant<HTMLInputElement>(card, ".owned-input");
  const image = requireDescendant<HTMLImageElement>(card, ".inventory-image");
  const name = requireDescendant<HTMLElement>(card, ".name");
  const rarity = requireDescendant<HTMLElement>(card, ".rarity-badge");
  const recommendationList = requireDescendant<HTMLElement>(card, ".recommended-cone-list");

  card.classList.toggle("is-owned", inventory.characters.has(character.name));
  const displayName = itemLabel("character", character.name, locale);
  name.textContent = displayName;
  rarity.textContent = `${character.rarity}★`;
  rarity.classList.add(`rarity-badge--${character.rarity}`);
  configureImage(image, "character", character.name);
  bindOwnershipToggle(
    checkbox,
    card,
    "character",
    character.name,
    displayName,
    inventory.characters,
    onChange,
    "characters"
  );
  bindLevelEditor({
    kind: "character",
    item: character.name,
    focusScope: "characters",
    owned: inventory.characters,
    root: card,
    onChange,
    displayName,
  });

  for (const [index, recommendation] of recommendations.entries()) {
    const catalogItem = catalog.itemsByKind.lightCone.get(recommendation.name);
    if (!catalogItem) continue;
    recommendationList.appendChild(
      createLightConeCard(
        catalogItem,
        inventory.lightCones,
        els.lightConeCardTemplate,
        onChange,
        locale,
        recommendation,
        index + 1,
        character.name
      )
    );
  }

  if (recommendationList.childElementCount === 0) {
    recommendationList.appendChild(createEmptyInventoryMessage(t("inventory.noRecommendations")));
  }

  return card;
}

function createLightConeCard(
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

function bindOwnershipToggle(
  checkbox: HTMLInputElement,
  card: HTMLElement,
  kind: ItemKind,
  item: string,
  displayName: string,
  owned: ReadonlyMap<string, number>,
  onChange: InventoryItemChange,
  focusScope: string
): void {
  const label = card.querySelector<HTMLElement>("[data-owned-label]");
  checkbox.dataset.inventoryFocus = focusIdentifier(kind, item, "ownership", focusScope);
  checkbox.checked = owned.has(item);
  checkbox.setAttribute(
    "aria-label",
    t(owned.has(item) ? "inventory.removeAria" : "inventory.addAria", { item: displayName })
  );
  if (label) label.textContent = t(owned.has(item) ? "card.owned" : "card.add");
  checkbox.addEventListener("change", () => {
    card.classList.toggle("is-owned", checkbox.checked);
    if (label) label.textContent = t(checkbox.checked ? "card.owned" : "card.add");
    onChange(kind, item, checkbox.checked ? inventoryLevelBounds(kind).min : null);
  });
}

function bindLevelEditor(options: LevelEditorOptions): void {
  const select = requireDescendant<HTMLSelectElement>(options.root, ".level-select select");
  const decrement = requireDescendant<HTMLButtonElement>(options.root, '[data-step="decrement"]');
  const increment = requireDescendant<HTMLButtonElement>(options.root, '[data-step="increment"]');
  const current = options.owned.get(options.item);
  const { min, max } = inventoryLevelBounds(options.kind);
  const prefix = options.kind === "character" ? "E" : "S";

  select.dataset.inventoryFocus = focusIdentifier(options.kind, options.item, "level", options.focusScope);
  decrement.dataset.inventoryFocus = focusIdentifier(options.kind, options.item, "decrement", options.focusScope);
  increment.dataset.inventoryFocus = focusIdentifier(options.kind, options.item, "increment", options.focusScope);
  select.replaceChildren(new Option("—", ""));
  for (let value = min; value <= max; value += 1) {
    select.appendChild(new Option(`${prefix}${value}`, String(value)));
  }
  select.value = current === undefined ? "" : String(current);
  select.setAttribute(
    "aria-label",
    t(options.kind === "character" ? "level.characterAria" : "level.coneAria", {
      item: options.displayName,
    })
  );

  decrement.disabled = current === undefined;
  increment.disabled = current !== undefined && current >= max;
  decrement.setAttribute("aria-label", t("level.decreaseAria", { prefix, item: options.displayName }));
  increment.setAttribute("aria-label", t("level.increaseAria", { prefix, item: options.displayName }));

  select.addEventListener("change", () => {
    options.onChange(options.kind, options.item, select.value === "" ? null : Number(select.value));
  });
  decrement.addEventListener("click", () => {
    options.onChange(options.kind, options.item, stepInventoryLevel(options.kind, current, -1));
  });
  increment.addEventListener("click", () => {
    options.onChange(options.kind, options.item, stepInventoryLevel(options.kind, current, 1));
  });
}

function configureImage(image: HTMLImageElement, kind: ItemKind, item: string): void {
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

function createEmptyInventoryMessage(message: string): HTMLElement {
  const element = document.createElement("p");
  element.className = "inventory-empty";
  element.textContent = message;
  return element;
}

function focusIdentifier(kind: ItemKind, item: string, control: string, scope: string): string {
  return JSON.stringify([kind, item, control, scope]);
}

function currentInventoryFocusId(): string | undefined {
  return document.activeElement instanceof HTMLElement ? document.activeElement.dataset.inventoryFocus : undefined;
}

function restoreInventoryFocus(els: Elements, focusId: string | undefined): void {
  if (!focusId) return;
  const controls = [
    ...els.characters.querySelectorAll<HTMLElement>("[data-inventory-focus]"),
    ...els.lightCones.querySelectorAll<HTMLElement>("[data-inventory-focus]"),
  ];
  const previousControl = controls.find((control) => control.dataset.inventoryFocus === focusId);
  if (previousControl && !isDisabledControl(previousControl)) {
    previousControl.focus({ preventScroll: true });
    return;
  }

  const fallbackId = levelEditorFocusIdentifier(focusId);
  controls.find((control) => control.dataset.inventoryFocus === fallbackId)?.focus({ preventScroll: true });
}

function isDisabledControl(control: HTMLElement): boolean {
  return (control instanceof HTMLButtonElement || control instanceof HTMLInputElement) && control.disabled;
}

function levelEditorFocusIdentifier(focusId: string): string {
  try {
    const value: unknown = JSON.parse(focusId);
    if (
      Array.isArray(value) &&
      value.length === 4 &&
      typeof value[0] === "string" &&
      typeof value[1] === "string" &&
      typeof value[3] === "string"
    ) {
      return focusIdentifier(value[0] === "character" ? "character" : "lightCone", value[1], "level", value[3]);
    }
  } catch {
    // An invalid focus token simply means there is nothing safe to restore.
  }
  return "";
}
