import type { HertaApplication } from "../../app/herta-application.js";
import { setLocale } from "../localization/locale.js";
import { readRunFilters } from "../run-filters/run-filter-elements.js";
import type { ApplicationElements } from "./application-elements.js";

export interface JsonFileGateway {
  readFromEvent(event: Event): Promise<unknown | null>;
  download(filename: string, data: unknown): void;
}

interface BindApplicationEventsOptions {
  readonly elements: ApplicationElements;
  readonly application: HertaApplication;
  readonly files: JsonFileGateway;
  readonly onResultCriteriaChanged: () => void;
}

export function bindApplicationEvents(options: BindApplicationEventsOptions): () => void {
  const removers: Array<() => void> = [];
  const { elements, application } = options;

  listen(removers, elements.shell.jsonFile, "change", (event) => void importRuns(event, options));
  listen(removers, elements.inventory.inventoryFile, "change", (event) => void importInventory(event, options));
  listen(removers, elements.inventory.exportInventory, "click", () => exportInventory(options));
  listen(removers, elements.inventory.resetBuild, "click", () => application.resetInventory());
  listen(removers, elements.shell.languageSelect, "change", () => setLocale(elements.shell.languageSelect.value));
  listen(removers, elements.inventory.characterSearch, "input", () =>
    application.updateInventorySearch("character", elements.inventory.characterSearch.value)
  );
  listen(removers, elements.inventory.lightConeSearch, "input", () =>
    application.updateInventorySearch("lightCone", elements.inventory.lightConeSearch.value)
  );

  for (const element of [elements.filters.endgameFilter, elements.filters.versionFilter]) {
    listen(removers, element, "input", () => {
      options.onResultCriteriaChanged();
      void application.selectRunSource(elements.filters.endgameFilter.value, elements.filters.versionFilter.value);
    });
  }
  for (const element of [elements.filters.bossFilter, elements.filters.lcMode, elements.filters.resultSearch]) {
    listen(removers, element, "input", () => {
      options.onResultCriteriaChanged();
      application.updateFilters(readRunFilters(elements.filters));
    });
  }

  return () => removers.forEach((remove) => remove());
}

async function importRuns(event: Event, options: BindApplicationEventsOptions): Promise<void> {
  try {
    const payload = await options.files.readFromEvent(event);
    if (payload) options.application.replaceRunsPayload(payload);
  } catch {
    options.application.reportError("runsFileInvalid");
  }
}

async function importInventory(event: Event, options: BindApplicationEventsOptions): Promise<void> {
  try {
    const inventory = await options.files.readFromEvent(event);
    if (inventory) options.application.importInventory(inventory);
  } catch {
    options.application.reportError("inventoryFileInvalid");
  }
}

function exportInventory(options: BindApplicationEventsOptions): void {
  const filename = `herta-inventario-${new Date().toISOString().slice(0, 10)}.json`;
  options.files.download(filename, options.application.exportInventory());
}

function listen(removers: Array<() => void>, target: EventTarget, event: string, listener: EventListener): void {
  target.addEventListener(event, listener);
  removers.push(() => target.removeEventListener(event, listener));
}
