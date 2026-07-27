import type { AppState } from "../../app/application-state/app-state.types.js";
import type { HertaApplication } from "../../app/herta-application.js";
import { selectResults } from "../../app/results/select-results.js";
import { renderInventory } from "../inventory/render-inventory.js";
import { localizedRunSearchText } from "../items/item-search.js";
import { getLocale } from "../localization/locale.js";
import { renderRunFilterOptions } from "../run-filters/render-run-filter-options.js";
import { renderRunList } from "../run-list/render-run-list.js";
import type { ApplicationElements } from "./application-elements.js";
import type { ApplicationView } from "./sync-view-navigation.js";
import { renderApplicationStatus } from "./render-application-status.js";

interface RenderApplicationStateOptions {
  readonly elements: ApplicationElements;
  readonly application: HertaApplication;
  readonly state: AppState;
  readonly view: ApplicationView;
  readonly resultLimit: number;
  readonly onShowMore: () => void;
}

export function renderApplicationState(options: RenderApplicationStateOptions): void {
  renderApplicationStatus(options.elements.shell.appStatus, options.state.status);
  if (options.view === "inventario") {
    renderInventoryView(options);
    return;
  }
  renderTeamFinderView(options);
}

function renderInventoryView(options: RenderApplicationStateOptions): void {
  const { elements, state, application } = options;
  elements.runList.results.replaceChildren();
  if (state.status.type === "loading" && state.runs.length === 0) {
    elements.inventory.characters.replaceChildren();
    elements.inventory.lightCones.replaceChildren();
    elements.inventory.characterCount.textContent = "";
    elements.inventory.lightConeCount.textContent = "";
    return;
  }

  renderInventory(
    elements.inventory,
    state.inventory,
    state.catalog,
    state.runs,
    state.inventorySearch,
    (kind, item, level) => application.updateInventoryItem(kind, item, level),
    getLocale()
  );
}

function renderTeamFinderView(options: RenderApplicationStateOptions): void {
  const { elements, state } = options;
  elements.inventory.characters.replaceChildren();
  elements.inventory.lightCones.replaceChildren();
  renderRunFilterOptions(
    elements.filters,
    state.runSources.length > 0 ? state.runSources : state.runs,
    state.filters.endgame,
    state.filters.version,
    state.runs,
    state.filters.boss,
    getLocale()
  );

  if (state.status.type === "loading") {
    renderLoadingRunList(elements);
    return;
  }

  const { evaluated, visible } = selectResults(state, state.filters, localizedRunSearchText);
  renderRunList(elements.runList, evaluated, visible, options.resultLimit, options.onShowMore, getLocale());
}

function renderLoadingRunList(elements: ApplicationElements): void {
  elements.runList.possibleCount.textContent = "0";
  elements.runList.nearCount.textContent = "0";
  elements.runList.runCount.textContent = "0";
  elements.runList.resultsAnnouncement.textContent = "";
  elements.runList.results.replaceChildren();
}
