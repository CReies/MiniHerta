import type { HertaApplication, RawRunsPayload } from "../app/application.js";
import { selectResults } from "../app/results.js";
import type { AppState, AppStore } from "../app/state.js";
import type { BrowserJsonFileGateway } from "../infrastructure/browser/json-file-gateway.js";
import type { SerializedInventory } from "../domain/types.js";
import { getFilters, type Elements } from "./dom.js";
import { renderBossOptions, renderInventory, renderResults } from "./render.js";
import { loadTheme, toggleTheme } from "./theme.js";

export class AppViewController {
  private unsubscribe: (() => void) | null = null;

  constructor(
    private readonly els: Elements,
    private readonly application: HertaApplication,
    private readonly store: AppStore,
    private readonly files: BrowserJsonFileGateway
  ) {}

  start(): void {
    loadTheme(this.els);
    this.bindEvents();
    this.unsubscribe = this.store.subscribe((state) => this.render(state));
    void this.application.initialize();
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private bindEvents(): void {
    this.els.jsonFile.addEventListener("change", (event) => void this.importRuns(event));
    this.els.inventoryFile.addEventListener("change", (event) => void this.importInventory(event));
    this.els.exportInventory.addEventListener("click", () => this.exportInventory());
    this.els.themeToggle.addEventListener("click", () => toggleTheme(this.els));
    this.els.resetBuild.addEventListener("click", () => this.application.resetInventory());

    this.els.characterSearch.addEventListener("input", () =>
      this.application.updateInventorySearch("character", this.els.characterSearch.value)
    );
    this.els.lightConeSearch.addEventListener("input", () =>
      this.application.updateInventorySearch("lightCone", this.els.lightConeSearch.value)
    );

    for (const element of [
      this.els.bossFilter,
      this.els.resultMode,
      this.els.lcMode,
      this.els.resultSearch,
      this.els.sortMode,
    ]) {
      element.addEventListener("input", () => this.application.updateFilters(getFilters(this.els)));
    }
  }

  private async importRuns(event: Event): Promise<void> {
    try {
      const payload = await this.files.readFromEvent<RawRunsPayload>(event);
      if (payload) this.application.replaceRunsPayload(payload);
    } catch {
      this.application.reportError("Ese archivo no parece ser un JSON válido de runs.");
    }
  }

  private async importInventory(event: Event): Promise<void> {
    try {
      const inventory = await this.files.readFromEvent<SerializedInventory>(event);
      if (inventory) this.application.importInventory(inventory);
    } catch {
      this.application.reportError("Ese inventario no parece ser un JSON válido.");
    }
  }

  private exportInventory(): void {
    const filename = `herta-inventario-${new Date().toISOString().slice(0, 10)}.json`;
    this.files.download(filename, this.application.exportInventory());
  }

  private render(state: AppState): void {
    renderBossOptions(this.els, state.runs, state.filters.boss);
    renderInventory(this.els, state.inventory, state.catalog, state.inventorySearch, (kind, item, level) =>
      this.application.updateInventoryItem(kind, item, level)
    );
    const { evaluated, visible } = selectResults(state);
    renderResults(this.els, evaluated, visible, state.catalog);

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
