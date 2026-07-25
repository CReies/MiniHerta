import { queryInventoryElements, type InventoryElements } from "../inventory/inventory-elements.js";
import { queryRunFilterElements, type RunFilterElements } from "../run-filters/run-filter-elements.js";
import { queryRunListElements, type RunListElements } from "../run-list/run-list-elements.js";

export interface ApplicationShellElements {
  readonly jsonFile: HTMLInputElement;
  readonly appStatus: HTMLElement;
  readonly languageSelect: HTMLSelectElement;
  readonly viewPages: readonly HTMLElement[];
  readonly viewLinks: readonly HTMLAnchorElement[];
}

export interface ApplicationElements {
  readonly shell: ApplicationShellElements;
  readonly inventory: InventoryElements;
  readonly filters: RunFilterElements;
  readonly runList: RunListElements;
}

export function queryApplicationElements(): ApplicationElements {
  return {
    shell: {
      jsonFile: requireElement("jsonFile", HTMLInputElement),
      appStatus: requireElement("appStatus", HTMLElement),
      languageSelect: requireElement("languageSelect", HTMLSelectElement),
      viewPages: Array.from(document.querySelectorAll<HTMLElement>("[data-view]")),
      viewLinks: Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-view-link]")),
    },
    inventory: queryInventoryElements(),
    filters: queryRunFilterElements(),
    runList: queryRunListElements(),
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
