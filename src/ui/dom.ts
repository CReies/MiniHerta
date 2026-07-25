import type { FilterState, LcMode } from "../domain/types.js";

export interface Elements {
  jsonFile: HTMLInputElement;
  appStatus: HTMLElement;
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
  resultsAnnouncement: HTMLElement;
  results: HTMLElement;
  characterCount: HTMLElement;
  lightConeCount: HTMLElement;
  languageSelect: HTMLSelectElement;
  characterCardTemplate: HTMLTemplateElement;
  lightConeCardTemplate: HTMLTemplateElement;
  viewPages: readonly HTMLElement[];
  viewLinks: readonly HTMLAnchorElement[];
}

export function getElements(): Elements {
  return {
    jsonFile: requireElement("jsonFile", HTMLInputElement),
    appStatus: requireElement("appStatus", HTMLElement),
    inventoryFile: requireElement("inventoryFile", HTMLInputElement),
    exportInventory: requireElement("exportInventory", HTMLButtonElement),
    resetBuild: requireElement("resetBuild", HTMLButtonElement),
    characterSearch: requireElement("characterSearch", HTMLInputElement),
    lightConeSearch: requireElement("lightConeSearch", HTMLInputElement),
    characters: requireElement("characters", HTMLElement),
    lightCones: requireElement("lightCones", HTMLElement),
    endgameFilter: requireElement("endgameFilter", HTMLSelectElement),
    versionFilter: requireElement("versionFilter", HTMLSelectElement),
    lcMode: requireElement("lcMode", HTMLSelectElement),
    resultSearch: requireElement("resultSearch", HTMLInputElement),
    possibleCount: requireElement("possibleCount", HTMLElement),
    nearCount: requireElement("nearCount", HTMLElement),
    runCount: requireElement("runCount", HTMLElement),
    resultsAnnouncement: requireElement("resultsAnnouncement", HTMLElement),
    results: requireElement("results", HTMLElement),
    characterCount: requireElement("characterCount", HTMLElement),
    lightConeCount: requireElement("lightConeCount", HTMLElement),
    languageSelect: requireElement("languageSelect", HTMLSelectElement),
    characterCardTemplate: requireElement("characterCardTemplate", HTMLTemplateElement),
    lightConeCardTemplate: requireElement("lightConeCardTemplate", HTMLTemplateElement),
    viewPages: Array.from(document.querySelectorAll<HTMLElement>("[data-view]")),
    viewLinks: Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-view-link]")),
  };
}

export function getFilters(els: Elements): Partial<FilterState> {
  return {
    endgame: els.endgameFilter.value,
    version: els.versionFilter.value,
    lcMode: parseLcMode(els.lcMode.value),
    resultSearch: els.resultSearch.value,
  };
}

interface HtmlElementConstructor<T extends HTMLElement> {
  new (): T;
}

function requireElement<T extends HTMLElement>(id: string, constructor: HtmlElementConstructor<T>): T {
  const element = document.getElementById(id);
  if (!(element instanceof constructor)) {
    throw new Error(`Expected #${id} to be a ${constructor.name}`);
  }
  return element;
}

function parseLcMode(value: string): LcMode {
  return value === "name" || value === "ignore" ? value : "strict";
}
