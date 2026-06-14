import { catalogNames } from "./domain/catalog.js";
import { importInventory, loadSavedInventory, saveInventory, serializeInventory } from "./domain/inventory.js";
import { downloadJson, fetchJson, readJsonFile } from "./app/json-file.js";
import { fetchRemoteRuns } from "./app/remote-runs.js";
import { createAppState, resetInventory, setInventory, setRuns } from "./app/state.js";
import { getElements, getFilters } from "./ui/dom.js";
import { loadTheme, toggleTheme } from "./ui/theme.js";
import { selectResults } from "./app/results.js";
import { renderBossOptions, renderInventory, renderResults } from "./ui/render.js";
import type { RawRun, SerializedInventory } from "./domain/types.js";

const els = getElements();
const state = createAppState();

document.addEventListener("DOMContentLoaded", () => {
  loadTheme(els);
  state.inventory = loadSavedInventory();
  bindEvents();
  loadRuns();
});

function bindEvents(): void {
  els.jsonFile.addEventListener("change", handleRunImport);
  els.inventoryFile.addEventListener("change", handleInventoryImport);
  els.exportInventory.addEventListener("click", exportInventory);
  els.themeToggle.addEventListener("click", () => toggleTheme(els));
  els.resetBuild.addEventListener("click", () => {
    resetInventory(state);
    persistAndRenderInventory();
  });

  for (const el of [els.characterSearch, els.lightConeSearch]) {
    el.addEventListener("input", () => renderInventory(els, state.inventory, state.catalog, persistAndRenderInventory));
  }

  for (const el of [els.bossFilter, els.resultMode, els.lcMode, els.resultSearch, els.sortMode]) {
    el.addEventListener("input", renderCurrentResults);
  }
}

async function loadRuns(): Promise<void> {
  const hasLocalRuns = await loadLocalRuns();
  void loadRemoteRuns(hasLocalRuns);
}

async function loadLocalRuns(): Promise<boolean> {
  try {
    replaceRuns(await fetchJson<RawRun[]>("scrapped.json"));
    return true;
  } catch {
    els.results.innerHTML = `<div class="empty">Descargando runs...</div>`;
    return false;
  }
}

async function loadRemoteRuns(hasFallback: boolean): Promise<void> {
  try {
    replaceRuns(await fetchRemoteRuns());
  } catch {
    if (!hasFallback) {
      els.results.innerHTML = `<div class="empty">No pude descargar las runs. Abre esta carpeta con un servidor local o usa el botón "Cargar runs".</div>`;
    }
  }
}

function handleRunImport(event: Event): void {
  readJsonFile<RawRun[]>(
    event,
    replaceRuns,
    () => (els.results.innerHTML = `<div class="empty">Ese archivo no parece ser un JSON válido de runs.</div>`)
  );
}

function handleInventoryImport(event: Event): void {
  readJsonFile<SerializedInventory>(
    event,
    (data) => {
      setInventory(state, importInventory(data, catalogNames(state.catalog)));
      persistAndRenderInventory();
    },
    () => (els.results.innerHTML = `<div class="empty">Ese inventario no parece ser un JSON válido.</div>`)
  );
}

function replaceRuns(rawRuns: RawRun[]): void {
  setRuns(state, rawRuns);
  renderBossOptions(els, state.runs);
  renderInventory(els, state.inventory, state.catalog, persistAndRenderInventory);
  renderCurrentResults();
}

function persistAndRenderInventory(): void {
  saveInventory(state.inventory);
  renderInventory(els, state.inventory, state.catalog, persistAndRenderInventory);
  renderCurrentResults();
}

function renderCurrentResults(): void {
  const { evaluated, visible } = selectResults(state, getFilters(els));
  renderResults(els, evaluated, visible, state.catalog);
}

function exportInventory(): void {
  const filename = `herta-inventario-${new Date().toISOString().slice(0, 10)}.json`;
  downloadJson(filename, serializeInventory(state.inventory));
}
