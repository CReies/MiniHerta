import type { HertaApplication } from "../app/application.js";
import { selectResults } from "../app/results.js";
import type { AppState, AppStatus, AppStore } from "../app/state.js";
import { getFilters, type Elements } from "./dom.js";
import { renderRunFilterOptions } from "./bosses.js";
import { getLocale, setLocale, subscribeLocale, t, translateDocument, type MessageKey } from "./i18n.js";
import { renderInventory } from "./inventory.js";
import { localizedRunSearchText } from "./item-presentation.js";
import { renderResults } from "./results.js";

interface JsonFileGateway {
  readFromEvent(event: Event): Promise<unknown | null>;
  download(filename: string, data: unknown): void;
}

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
    private readonly files: JsonFileGateway
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
    this.els.languageSelect.addEventListener("change", () => setLocale(this.els.languageSelect.value));

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
      const payload = await this.files.readFromEvent(event);
      if (payload) this.application.replaceRunsPayload(payload);
    } catch {
      this.application.reportError("runsFileInvalid");
    }
  }

  private async importInventory(event: Event): Promise<void> {
    try {
      const inventory = await this.files.readFromEvent(event);
      if (inventory) this.application.importInventory(inventory);
    } catch {
      this.application.reportError("inventoryFileInvalid");
    }
  }

  private exportInventory(): void {
    const filename = `herta-inventario-${new Date().toISOString().slice(0, 10)}.json`;
    this.files.download(filename, this.application.exportInventory());
  }

  private syncView(): void {
    const view = window.location.hash === "#inventario" ? "inventario" : "team-finder";

    for (const page of this.els.viewPages) {
      page.hidden = page.dataset.view !== view;
    }

    for (const link of this.els.viewLinks) {
      const active = link.dataset.viewLink === view;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
  }

  private render(state: AppState): void {
    renderStatus(this.els.appStatus, state.status);
    const inventoryView = window.location.hash === "#inventario";

    if (inventoryView) {
      this.els.results.replaceChildren();
      if (state.status.type === "loading" && state.runs.length === 0) {
        this.els.characters.replaceChildren();
        this.els.lightCones.replaceChildren();
        this.els.characterCount.textContent = "";
        this.els.lightConeCount.textContent = "";
      } else {
        renderInventory(
          this.els,
          state.inventory,
          state.catalog,
          state.runs,
          state.inventorySearch,
          (kind, item, level) => this.application.updateInventoryItem(kind, item, level),
          getLocale()
        );
      }
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
      if (state.status.type === "loading") {
        this.els.possibleCount.textContent = "0";
        this.els.nearCount.textContent = "0";
        this.els.runCount.textContent = "0";
        this.els.resultsAnnouncement.textContent = "";
        this.els.results.replaceChildren();
      } else {
        const { evaluated, visible } = selectResults(state, state.filters, localizedRunSearchText);
        renderResults(
          this.els,
          evaluated,
          visible,
          this.resultLimit,
          () => {
            this.resultLimit += 24;
            this.render(this.store.snapshot);
          },
          getLocale()
        );
      }
    }
  }
}

const statusMessages: Readonly<
  Record<Exclude<AppStatus, { type: "idle" } | { type: "ready" }>["message"], MessageKey>
> = {
  loadingRuns: "status.loading",
  runsDownloadFailed: "error.download",
  runCollectionFailed: "error.collection",
  runsFileInvalid: "error.runsFile",
  inventoryFileInvalid: "error.inventoryFile",
  inventoryStorageReadFailed: "error.inventoryStorageRead",
  inventoryStorageWriteFailed: "error.inventoryStorageWrite",
};

function renderStatus(element: HTMLElement, status: AppStatus): void {
  if (status.type === "idle" || status.type === "ready") {
    element.hidden = true;
    element.textContent = "";
    element.removeAttribute("data-status");
    return;
  }

  element.hidden = false;
  element.dataset.status = status.type;
  element.setAttribute("role", status.type === "error" ? "alert" : "status");
  element.setAttribute("aria-live", status.type === "error" ? "assertive" : "polite");
  element.textContent = t(statusMessages[status.message]);
}
