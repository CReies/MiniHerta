import type { FilterState, LcMode } from "../domain/types.js";

export interface Elements {
  jsonFile: HTMLInputElement;
  inventoryFile: HTMLInputElement;
  exportInventory: HTMLButtonElement;
  themeToggle: HTMLButtonElement;
  resetBuild: HTMLButtonElement;
  characterSearch: HTMLInputElement;
  lightConeSearch: HTMLInputElement;
  characters: HTMLElement;
  lightCones: HTMLElement;
  bossFilter: HTMLSelectElement;
  lcMode: HTMLSelectElement;
  resultSearch: HTMLInputElement;
  possibleCount: HTMLElement;
  nearCount: HTMLElement;
  runCount: HTMLElement;
  results: HTMLElement;
  characterCount: HTMLElement;
  lightConeCount: HTMLElement;
  rowTemplate: HTMLTemplateElement;
}

const ids = [
  "jsonFile",
  "inventoryFile",
  "exportInventory",
  "themeToggle",
  "resetBuild",
  "characterSearch",
  "lightConeSearch",
  "characters",
  "lightCones",
  "bossFilter",
  "lcMode",
  "resultSearch",
  "possibleCount",
  "nearCount",
  "runCount",
  "results",
  "characterCount",
  "lightConeCount",
] as const;

export function getElements(): Elements {
  const entries = ids.map((id) => [id, requireElement(id)]);
  return {
    ...Object.fromEntries(entries),
    rowTemplate: requireElement("inventoryRowTemplate") as HTMLTemplateElement,
  } as Elements;
}

export function getFilters(els: Elements): Partial<FilterState> {
  return {
    boss: els.bossFilter.value,
    lcMode: els.lcMode.value as LcMode,
    resultSearch: els.resultSearch.value,
  };
}

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element;
}
