import type { ItemKind } from "../../domain/item.types.js";

export type InventoryItemChange = (kind: ItemKind, item: string, level: number | null) => void;

export interface LevelEditorOptions {
  readonly kind: ItemKind;
  readonly item: string;
  readonly focusScope: string;
  readonly owned: ReadonlyMap<string, number>;
  readonly root: HTMLElement;
  readonly onChange: InventoryItemChange;
  readonly displayName: string;
}
