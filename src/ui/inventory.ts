import { itemImageUrl, type CatalogItem, type ItemCatalog } from "../domain/catalog.js";
import { inventoryLevelBounds, stepInventoryLevel } from "../domain/inventory.js";
import { mostUsedLightConesByCharacter, type LightConeUsage } from "../domain/light-cone-usage.js";
import type { Inventory, ItemKind, Run } from "../domain/types.js";
import { normalizeText } from "../utils/text.js";
import type { Elements } from "./dom.js";

export type InventoryItemChange = (kind: ItemKind, item: string, level: number | null) => void;

interface LevelEditorOptions {
  kind: ItemKind;
  item: string;
  owned: Map<string, number>;
  root: HTMLElement;
  onChange: InventoryItemChange;
}

export function renderInventory(
  els: Elements,
  inventory: Inventory,
  catalog: ItemCatalog,
  runs: Run[],
  search: { character: string; lightCone: string },
  onChange: InventoryItemChange
): void {
  const usageByCharacter = mostUsedLightConesByCharacter(runs);
  const recommendedConeNames = new Set(
    [...usageByCharacter.values()].flatMap((lightCones) => lightCones.map((lightCone) => lightCone.name))
  );

  renderCharacters(els, inventory, catalog, usageByCharacter, search.character, onChange);
  renderOtherLightCones(els, inventory, catalog, recommendedConeNames, search.lightCone, onChange);

  els.characterCount.textContent = `${inventory.characters.size} de ${catalog.characters.length} en tu cuenta`;
  els.lightConeCount.textContent = `${inventory.lightCones.size} en tu cuenta · ${recommendedConeNames.size} junto a personajes`;
}

function renderCharacters(
  els: Elements,
  inventory: Inventory,
  catalog: ItemCatalog,
  usageByCharacter: Map<string, LightConeUsage[]>,
  search: string,
  onChange: InventoryItemChange
): void {
  els.characters.replaceChildren();
  const characters = filteredCatalogItems(catalog.characters, search);

  for (const character of characters) {
    els.characters.appendChild(
      createCharacterCard(character, usageByCharacter.get(character.name) ?? [], inventory, catalog, els, onChange)
    );
  }

  if (characters.length === 0) {
    els.characters.appendChild(createEmptyInventoryMessage("No hay personajes que coincidan con la búsqueda."));
  }
}

function renderOtherLightCones(
  els: Elements,
  inventory: Inventory,
  catalog: ItemCatalog,
  recommendedConeNames: Set<string>,
  search: string,
  onChange: InventoryItemChange
): void {
  els.lightCones.replaceChildren();
  const lightCones = filteredCatalogItems(
    catalog.lightCones.filter((lightCone) => !recommendedConeNames.has(lightCone.name)),
    search
  );

  for (const lightCone of lightCones) {
    els.lightCones.appendChild(
      createLightConeCard(lightCone, inventory.lightCones, catalog, els.lightConeCardTemplate, onChange)
    );
  }

  if (lightCones.length === 0) {
    els.lightCones.appendChild(createEmptyInventoryMessage("No hay otros light cones que coincidan."));
  }
}

function createCharacterCard(
  character: CatalogItem,
  recommendations: LightConeUsage[],
  inventory: Inventory,
  catalog: ItemCatalog,
  els: Elements,
  onChange: InventoryItemChange
): HTMLElement {
  const card = cloneTemplate(els.characterCardTemplate);
  const checkbox = requireDescendant<HTMLInputElement>(card, ".owned-input");
  const image = requireDescendant<HTMLImageElement>(card, ".inventory-image");
  const name = requireDescendant<HTMLElement>(card, ".name");
  const rarity = requireDescendant<HTMLElement>(card, ".rarity-badge");
  const recommendationList = requireDescendant<HTMLElement>(card, ".recommended-cone-list");

  card.classList.toggle("is-owned", inventory.characters.has(character.name));
  name.textContent = character.name;
  rarity.textContent = `${character.rarity}★`;
  rarity.classList.add(`rarity-badge--${character.rarity}`);
  configureImage(image, catalog, "character", character.name);
  bindOwnershipToggle(checkbox, card, "character", character.name, inventory.characters, onChange);
  bindLevelEditor({
    kind: "character",
    item: character.name,
    owned: inventory.characters,
    root: card,
    onChange,
  });

  for (const [index, recommendation] of recommendations.entries()) {
    const catalogItem = catalog.lightCones.find((item) => item.name === recommendation.name);
    if (!catalogItem) continue;
    recommendationList.appendChild(
      createLightConeCard(
        catalogItem,
        inventory.lightCones,
        catalog,
        els.lightConeCardTemplate,
        onChange,
        recommendation,
        index + 1
      )
    );
  }

  if (recommendationList.childElementCount === 0) {
    recommendationList.appendChild(createEmptyInventoryMessage("Aún no hay conos registrados para este personaje."));
  }

  return card;
}

function createLightConeCard(
  lightCone: CatalogItem,
  owned: Map<string, number>,
  catalog: ItemCatalog,
  template: HTMLTemplateElement,
  onChange: InventoryItemChange,
  recommendation?: LightConeUsage,
  rank?: number
): HTMLElement {
  const card = cloneTemplate(template);
  const checkbox = requireDescendant<HTMLInputElement>(card, ".owned-input");
  const image = requireDescendant<HTMLImageElement>(card, ".inventory-image");
  const name = requireDescendant<HTMLElement>(card, ".name");
  const usage = requireDescendant<HTMLElement>(card, ".usage-count");
  const rankElement = requireDescendant<HTMLElement>(card, ".recommendation-rank");

  card.classList.toggle("is-owned", owned.has(lightCone.name));
  card.classList.toggle("is-recommended", Boolean(recommendation));
  name.textContent = lightCone.name;
  configureImage(image, catalog, "lightCone", lightCone.name);
  bindOwnershipToggle(checkbox, card, "lightCone", lightCone.name, owned, onChange);
  bindLevelEditor({ kind: "lightCone", item: lightCone.name, owned, root: card, onChange });

  if (recommendation) {
    usage.textContent = `${recommendation.uses} ${recommendation.uses === 1 ? "uso" : "usos"}`;
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
  owned: Map<string, number>,
  onChange: InventoryItemChange
): void {
  const label = card.querySelector<HTMLElement>("[data-owned-label]");
  checkbox.checked = owned.has(item);
  checkbox.setAttribute("aria-label", `${owned.has(item) ? "Quitar" : "Añadir"} ${item} del inventario`);
  if (label) label.textContent = owned.has(item) ? "En cuenta" : "Añadir";
  checkbox.addEventListener("change", () => {
    card.classList.toggle("is-owned", checkbox.checked);
    if (label) label.textContent = checkbox.checked ? "En cuenta" : "Añadir";
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

  select.replaceChildren(new Option("Sin obtener", ""));
  for (let value = min; value <= max; value += 1) {
    select.appendChild(new Option(`${prefix}${value}`, String(value)));
  }
  select.value = current === undefined ? "" : String(current);
  select.setAttribute(
    "aria-label",
    `${options.kind === "character" ? "Eidolon" : "Superimposición"} de ${options.item}`
  );

  decrement.disabled = current === undefined;
  increment.disabled = current !== undefined && current >= max;
  decrement.setAttribute("aria-label", `Reducir ${prefix} de ${options.item}`);
  increment.setAttribute("aria-label", `Aumentar ${prefix} de ${options.item}`);

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

function filteredCatalogItems(items: CatalogItem[], search: string): CatalogItem[] {
  const query = normalizeText(search);
  return items.filter((item) => normalizeText(item.name).includes(query));
}

function configureImage(image: HTMLImageElement, catalog: ItemCatalog, kind: ItemKind, item: string): void {
  image.src = itemImageUrl(catalog, kind, item);
  image.alt = "";
  image.hidden = false;
  image.onerror = () => {
    image.hidden = true;
  };
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
