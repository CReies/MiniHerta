import type { ItemKind } from "../../domain/item.types.js";
import type { Run } from "../../domain/runs/run.types.js";
import { itemLabel } from "./item-presentation.js";

export function itemSearchLabels(kind: ItemKind, name: string): readonly string[] {
  const spanishName = itemLabel(kind, name, "es");
  return spanishName !== name ? [name, spanishName] : [name];
}

export function localizedRunSearchText(run: Run): string {
  return run.team
    .flatMap((member) => [
      ...itemSearchLabels("character", member.char),
      ...(member.lc ? itemSearchLabels("lightCone", member.lc) : []),
    ])
    .join(" ");
}
