import { itemImageUrl, type ItemCatalog } from "../domain/catalog.js";
import type { Elements } from "./dom.js";
import type { Inventory, ItemKind } from "../domain/types.js";
import { normalizeText } from "../utils/text.js";

interface InventoryListOptions {
  root: HTMLElement;
  items: string[];
  search: string;
  owned: Map<string, number>;
  label: string;
  max: number;
  countEl: HTMLElement;
  kind: ItemKind;
  catalog: ItemCatalog;
  template: HTMLTemplateElement;
  onChange: () => void;
}

export function renderInventory(els: Elements, inventory: Inventory, catalog: ItemCatalog, onChange: () => void): void {
  renderInventoryList(characterListOptions(els, inventory, catalog, onChange));
  renderInventoryList(lightConeListOptions(els, inventory, catalog, onChange));
}

function characterListOptions(
  els: Elements,
  inventory: Inventory,
  catalog: ItemCatalog,
  onChange: () => void
): InventoryListOptions {
  return {
    root: els.characters,
    items: catalog.characters.map((item) => item.name),
    search: els.characterSearch.value,
    owned: inventory.characters,
    label: "E",
    max: 6,
    countEl: els.characterCount,
    kind: "character",
    catalog,
    template: els.rowTemplate,
    onChange,
  };
}

function lightConeListOptions(
  els: Elements,
  inventory: Inventory,
  catalog: ItemCatalog,
  onChange: () => void
): InventoryListOptions {
  return {
    root: els.lightCones,
    items: catalog.lightCones.map((item) => item.name),
    search: els.lightConeSearch.value,
    owned: inventory.lightCones,
    label: "S",
    max: 5,
    countEl: els.lightConeCount,
    kind: "lightCone",
    catalog,
    template: els.rowTemplate,
    onChange,
  };
}

function renderInventoryList(options: InventoryListOptions): void {
  options.root.innerHTML = "";

  for (const item of filteredItems(options.items, options.search)) {
    options.root.appendChild(createInventoryRow(item, options));
  }

  options.countEl.textContent = `${options.owned.size} seleccionados`;
}

function filteredItems(items: string[], search: string): string[] {
  const query = normalizeText(search);
  return items.filter((item) => normalizeText(item).includes(query));
}

function createInventoryRow(item: string, options: InventoryListOptions): HTMLElement {
  const row = cloneInventoryRow(options.template);
  const checkbox = row.querySelector("input") as HTMLInputElement;
  const image = row.querySelector("img") as HTMLImageElement;
  const name = row.querySelector(".name") as HTMLElement;
  const controlLabel = row.querySelector(".level-control span") as HTMLElement;
  const select = row.querySelector("select") as HTMLSelectElement;

  configureCheckbox(checkbox, item, options.owned);
  configureImage(image, options.catalog, options.kind, item);
  configureLevelSelect(select, item, options);

  name.textContent = item;
  controlLabel.textContent = options.label;
  bindInventoryRowEvents(checkbox, select, item, options);

  return row;
}

function cloneInventoryRow(template: HTMLTemplateElement): HTMLElement {
  return template.content.firstElementChild?.cloneNode(true) as HTMLElement;
}

function configureCheckbox(checkbox: HTMLInputElement, item: string, owned: Map<string, number>): void {
  checkbox.checked = owned.has(item);
  checkbox.dataset.item = item;
}

function configureImage(image: HTMLImageElement, catalog: ItemCatalog, kind: ItemKind, item: string): void {
  image.src = itemImageUrl(catalog, kind, item);
  image.alt = "";
  image.hidden = false;
  image.onerror = () => {
    image.hidden = true;
  };
}

function configureLevelSelect(select: HTMLSelectElement, item: string, options: InventoryListOptions): void {
  select.disabled = !options.owned.has(item);
  select.innerHTML = levelValues(options.kind, options.max)
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("");
  select.value = String(options.owned.get(item) ?? defaultLevel(options.kind));
}

function bindInventoryRowEvents(
  checkbox: HTMLInputElement,
  select: HTMLSelectElement,
  item: string,
  options: InventoryListOptions
): void {
  checkbox.addEventListener("change", () => {
    updateOwnedItem(checkbox.checked, select.value, item, options.owned);
    options.onChange();
  });

  select.addEventListener("change", () => {
    if (!checkbox.checked) return;
    options.owned.set(item, Number(select.value));
    options.onChange();
  });
}

function updateOwnedItem(isOwned: boolean, level: string, item: string, owned: Map<string, number>): void {
  if (isOwned) owned.set(item, Number(level));
  else owned.delete(item);
}

function levelValues(kind: ItemKind, max: number): number[] {
  return kind === "lightCone"
    ? Array.from({ length: max }, (_, index) => index + 1)
    : Array.from({ length: max + 1 }, (_, index) => index);
}

function defaultLevel(kind: ItemKind): number {
  return kind === "lightCone" ? 1 : 0;
}
