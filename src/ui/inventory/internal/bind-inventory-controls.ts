import { inventoryLevelBounds, stepInventoryLevel } from "../../../domain/inventory/inventory-levels.js";
import type { ItemKind } from "../../../domain/item.types.js";
import { t } from "../../localization/locale.js";
import type { InventoryItemChange, LevelEditorOptions } from "../inventory-view.types.js";
import { createInventoryFocusIdentifier } from "./inventory-focus.js";

export function bindOwnershipToggle(
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
  checkbox.dataset.inventoryFocus = createInventoryFocusIdentifier(kind, item, "ownership", focusScope);
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

export function bindLevelEditor(options: LevelEditorOptions): void {
  const controls = {
    select: requireDescendant<HTMLSelectElement>(options.root, ".level-select select"),
    decrement: requireDescendant<HTMLButtonElement>(options.root, '[data-step="decrement"]'),
    increment: requireDescendant<HTMLButtonElement>(options.root, '[data-step="increment"]'),
  };
  const current = options.owned.get(options.item);
  const { min, max } = inventoryLevelBounds(options.kind);
  const prefix = options.kind === "character" ? "E" : "S";

  configureLevelEditor(controls, options, current, min, max, prefix);
  controls.select.addEventListener("change", () => {
    options.onChange(options.kind, options.item, controls.select.value === "" ? null : Number(controls.select.value));
  });
  controls.decrement.addEventListener("click", () => {
    options.onChange(options.kind, options.item, stepInventoryLevel(options.kind, current, -1));
  });
  controls.increment.addEventListener("click", () => {
    options.onChange(options.kind, options.item, stepInventoryLevel(options.kind, current, 1));
  });
}

interface LevelEditorControls {
  readonly select: HTMLSelectElement;
  readonly decrement: HTMLButtonElement;
  readonly increment: HTMLButtonElement;
}

function configureLevelEditor(
  controls: LevelEditorControls,
  options: LevelEditorOptions,
  current: number | undefined,
  min: number,
  max: number,
  prefix: string
): void {
  controls.select.dataset.inventoryFocus = focusId(options, "level");
  controls.decrement.dataset.inventoryFocus = focusId(options, "decrement");
  controls.increment.dataset.inventoryFocus = focusId(options, "increment");
  controls.select.replaceChildren(new Option("—", ""));
  for (let value = min; value <= max; value += 1) {
    controls.select.appendChild(new Option(`${prefix}${value}`, String(value)));
  }
  controls.select.value = current === undefined ? "" : String(current);
  controls.select.setAttribute(
    "aria-label",
    t(options.kind === "character" ? "level.characterAria" : "level.coneAria", {
      item: options.displayName,
    })
  );

  controls.decrement.disabled = current === undefined;
  controls.increment.disabled = current !== undefined && current >= max;
  controls.decrement.setAttribute("aria-label", t("level.decreaseAria", { prefix, item: options.displayName }));
  controls.increment.setAttribute("aria-label", t("level.increaseAria", { prefix, item: options.displayName }));
}

function focusId(options: LevelEditorOptions, control: string): string {
  return createInventoryFocusIdentifier(options.kind, options.item, control, options.focusScope);
}

function requireDescendant<T extends Element>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Falta ${selector} dentro del inventario`);
  return element;
}
