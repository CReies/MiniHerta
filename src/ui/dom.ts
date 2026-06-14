import type { FilterState, LcMode, ResultMode, SortMode } from "../domain/types.js";

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
  resultMode: HTMLSelectElement;
  lcMode: HTMLSelectElement;
  resultSearch: HTMLInputElement;
  sortMode: HTMLSelectElement;
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
  "resultMode",
  "lcMode",
  "resultSearch",
  "sortMode",
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

export function getFilters(els: Elements): FilterState {
  return {
    boss: els.bossFilter.value,
    resultMode: els.resultMode.value as ResultMode,
    lcMode: els.lcMode.value as LcMode,
    resultSearch: els.resultSearch.value,
    sortMode: els.sortMode.value as SortMode,
  };
}

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element;
}
