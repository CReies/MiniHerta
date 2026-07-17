import type { FilterState, LcMode } from "../domain/types.js";

export interface Elements {
  jsonFile: HTMLInputElement;
  inventoryFile: HTMLInputElement;
  exportInventory: HTMLButtonElement;
  resetBuild: HTMLButtonElement;
  characterSearch: HTMLInputElement;
  lightConeSearch: HTMLInputElement;
  characters: HTMLElement;
  lightCones: HTMLElement;
  endgameFilter: HTMLSelectElement;
  versionFilter: HTMLSelectElement;
  lcMode: HTMLSelectElement;
  resultSearch: HTMLInputElement;
  possibleCount: HTMLElement;
  nearCount: HTMLElement;
  runCount: HTMLElement;
  results: HTMLElement;
  characterCount: HTMLElement;
  lightConeCount: HTMLElement;
  languageSelect: HTMLSelectElement;
  characterCardTemplate: HTMLTemplateElement;
  lightConeCardTemplate: HTMLTemplateElement;
  viewPages: HTMLElement[];
  viewLinks: HTMLAnchorElement[];
}

const ids = [
  "jsonFile",
  "inventoryFile",
  "exportInventory",
  "resetBuild",
  "characterSearch",
  "lightConeSearch",
  "characters",
  "lightCones",
  "endgameFilter",
  "versionFilter",
  "lcMode",
  "resultSearch",
  "possibleCount",
  "nearCount",
  "runCount",
  "results",
  "characterCount",
  "lightConeCount",
  "languageSelect",
] as const;

export function getElements(): Elements {
  const entries = ids.map((id) => [id, requireElement(id)]);
  return {
    ...Object.fromEntries(entries),
    characterCardTemplate: requireElement("characterCardTemplate") as HTMLTemplateElement,
    lightConeCardTemplate: requireElement("lightConeCardTemplate") as HTMLTemplateElement,
    viewPages: Array.from(document.querySelectorAll<HTMLElement>("[data-view]")),
    viewLinks: Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-view-link]")),
  } as Elements;
}

export function getFilters(els: Elements): Partial<FilterState> {
  return {
    endgame: els.endgameFilter.value,
    version: els.versionFilter.value,
    lcMode: els.lcMode.value as LcMode,
    resultSearch: els.resultSearch.value,
  };
}

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element;
}
