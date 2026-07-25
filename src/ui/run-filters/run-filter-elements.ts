import type { FilterState, LcMode } from "../../domain/scoring/scoring.types.js";

export interface RunFilterElements {
  readonly endgameFilter: HTMLSelectElement;
  readonly versionFilter: HTMLSelectElement;
  readonly lcMode: HTMLSelectElement;
  readonly resultSearch: HTMLInputElement;
}

export function queryRunFilterElements(): RunFilterElements {
  return {
    endgameFilter: requireElement("endgameFilter", HTMLSelectElement),
    versionFilter: requireElement("versionFilter", HTMLSelectElement),
    lcMode: requireElement("lcMode", HTMLSelectElement),
    resultSearch: requireElement("resultSearch", HTMLInputElement),
  };
}

export function readRunFilters(elements: RunFilterElements): Partial<FilterState> {
  return {
    endgame: elements.endgameFilter.value,
    version: elements.versionFilter.value,
    lcMode: parseLcMode(elements.lcMode.value),
    resultSearch: elements.resultSearch.value,
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
