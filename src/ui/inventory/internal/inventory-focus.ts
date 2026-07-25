import type { ItemKind } from "../../../domain/item.types.js";
import type { InventoryElements } from "../inventory-elements.js";

export function createInventoryFocusIdentifier(kind: ItemKind, item: string, control: string, scope: string): string {
  return JSON.stringify([kind, item, control, scope]);
}

export function captureInventoryFocus(): string | undefined {
  return document.activeElement instanceof HTMLElement ? document.activeElement.dataset.inventoryFocus : undefined;
}

export function restoreInventoryFocus(elements: InventoryElements, focusId: string | undefined): void {
  if (!focusId) return;
  const controls = [
    ...elements.characters.querySelectorAll<HTMLElement>("[data-inventory-focus]"),
    ...elements.lightCones.querySelectorAll<HTMLElement>("[data-inventory-focus]"),
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
      const kind = value[0] === "character" ? "character" : "lightCone";
      return createInventoryFocusIdentifier(kind, value[1], "level", value[3]);
    }
  } catch {
    // An invalid focus token simply means there is nothing safe to restore.
  }
  return "";
}
