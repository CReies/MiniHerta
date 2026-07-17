import type { HertaApplication, RawRunsPayload } from "../app/application.js";
import { selectResults } from "../app/results.js";
import type { AppState, AppStore } from "../app/state.js";
import type { BrowserJsonFileGateway } from "../infrastructure/browser/json-file-gateway.js";
import type { SerializedInventory } from "../domain/types.js";
import { getFilters, type Elements } from "./dom.js";
import { renderInventory, renderResults, renderRunFilterOptions } from "./render.js";
import { getLocale, setLocale, subscribeLocale, t, translateDocument, type Locale } from "../i18n.js";

export class AppViewController {
  private unsubscribe: (() => void) | null = null;
  private unsubscribeLocale: (() => void) | null = null;
  private resultLimit = 24;
  private readonly handleHashChange = (): void => {
    this.syncView();
    this.render(this.store.snapshot);
  };

  constructor(
    private readonly els: Elements,
    private readonly application: HertaApplication,
    private readonly store: AppStore,
    private readonly files: BrowserJsonFileGateway
  ) {}

  start(): void {
    this.els.languageSelect.value = getLocale();
    this.bindEvents();
    window.addEventListener("hashchange", this.handleHashChange);
    this.syncView();
    this.unsubscribe = this.store.subscribe((state) => this.render(state));
    this.unsubscribeLocale = subscribeLocale(() => {
      this.els.languageSelect.value = getLocale();
      translateDocument();
      this.render(this.store.snapshot);
    });
    void this.application.initialize();
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.unsubscribeLocale?.();
    this.unsubscribeLocale = null;
    window.removeEventListener("hashchange", this.handleHashChange);
  }

  private bindEvents(): void {
    this.els.jsonFile.addEventListener("change", (event) => void this.importRuns(event));
    this.els.inventoryFile.addEventListener("change", (event) => void this.importInventory(event));
    this.els.exportInventory.addEventListener("click", () => this.exportInventory());
    this.els.resetBuild.addEventListener("click", () => this.application.resetInventory());
    this.els.languageSelect.addEventListener("change", () => setLocale(this.els.languageSelect.value as Locale));

    this.els.characterSearch.addEventListener("input", () =>
      this.application.updateInventorySearch("character", this.els.characterSearch.value)
    );
    this.els.lightConeSearch.addEventListener("input", () =>
      this.application.updateInventorySearch("lightCone", this.els.lightConeSearch.value)
    );

    for (const element of [this.els.endgameFilter, this.els.versionFilter]) {
      element.addEventListener("input", () => {
        this.resultLimit = 24;
        void this.application.selectRunSource(this.els.endgameFilter.value, this.els.versionFilter.value);
      });
    }
    for (const element of [this.els.lcMode, this.els.resultSearch]) {
      element.addEventListener("input", () => {
        this.resultLimit = 24;
        this.application.updateFilters(getFilters(this.els));
      });
    }
  }

  private async importRuns(event: Event): Promise<void> {
    try {
      const payload = await this.files.readFromEvent<RawRunsPayload>(event);
      if (payload) this.application.replaceRunsPayload(payload);
    } catch {
      this.application.reportError(t("error.runsFile"));
    }
  }

  private async importInventory(event: Event): Promise<void> {
    try {
      const inventory = await this.files.readFromEvent<SerializedInventory>(event);
      if (inventory) this.application.importInventory(inventory);
    } catch {
      this.application.reportError(t("error.inventoryFile"));
    }
  }

  private exportInventory(): void {
    const filename = `herta-inventario-${new Date().toISOString().slice(0, 10)}.json`;
    this.files.download(filename, this.application.exportInventory());
  }

  private syncView(): void {
    const view = window.location.hash === "#inventario" ? "inventario" : "team-finder";
    const viewPages = this.els.viewPages ?? Array.from(document.querySelectorAll<HTMLElement>("[data-view]"));
    const viewLinks =
      this.els.viewLinks ?? Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-view-link]"));

    for (const page of viewPages) {
      page.hidden = page.dataset.view !== view;
    }

    for (const link of viewLinks) {
      const active = link.dataset.viewLink === view;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
  }

  private render(state: AppState): void {
    const inventoryView = window.location.hash === "#inventario";

    if (inventoryView) {
      this.els.results.replaceChildren();
      renderInventory(
        this.els,
        state.inventory,
        state.catalog,
        state.runs,
        state.inventorySearch,
        (kind, item, level) => this.application.updateInventoryItem(kind, item, level),
        getLocale()
      );
    } else {
      this.els.characters.replaceChildren();
      this.els.lightCones.replaceChildren();
      renderRunFilterOptions(
        this.els,
        state.runSources.length > 0 ? state.runSources : state.runs,
        state.filters.endgame,
        state.filters.version,
        getLocale()
      );
      const { evaluated, visible } = selectResults(state);
      renderResults(
        this.els,
        evaluated,
        visible,
        state.catalog,
        this.resultLimit,
        () => {
          this.resultLimit += 24;
          this.render(this.store.snapshot);
        },
        getLocale()
      );
    }

    if ((state.status === "error" || state.runs.length === 0) && state.statusMessage) {
      this.els.results.replaceChildren(createMessage(state.statusMessage));
    }
  }
}

function createMessage(message: string): HTMLElement {
  const element = document.createElement("div");
  element.className = "empty";
  element.textContent = message;
  return element;
}
