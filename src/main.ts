import { applyResultMode, compareRuns, evaluateRun, matchesFilters } from "./domain/scoring.js";
import {
  createEmptyInventory,
  importInventory,
  loadSavedInventory,
  reconcileInventory,
  saveInventory,
  serializeInventory,
} from "./domain/inventory.js";
import { getElements, getFilters } from "./ui/dom.js";
import { loadTheme, toggleTheme } from "./ui/theme.js";
import { normalizeRuns } from "./domain/normalize.js";
import { renderBossOptions, renderInventory, renderResults } from "./ui/render.js";
import type { Inventory, RawRun, Run, SerializedInventory } from "./domain/types.js";

const els = getElements();
const state: {
  runs: Run[];
  characters: string[];
  lightCones: string[];
  inventory: Inventory;
} = {
  runs: [],
  characters: [],
  lightCones: [],
  inventory: createEmptyInventory(),
};

document.addEventListener("DOMContentLoaded", () => {
  loadTheme(els);
  state.inventory = loadSavedInventory();
  bindEvents();
  loadJson();
});

function bindEvents(): void {
  els.jsonFile.addEventListener("change", handleRunImport);
  els.inventoryFile.addEventListener("change", handleInventoryImport);
  els.exportInventory.addEventListener("click", exportInventory);
  els.themeToggle.addEventListener("click", () => toggleTheme(els));
  els.resetBuild.addEventListener("click", () => {
    state.inventory = createEmptyInventory();
    persistAndRenderInventory();
  });

  for (const el of [els.characterSearch, els.lightConeSearch]) {
    el.addEventListener("input", () =>
      renderInventory(els, state.inventory, state.characters, state.lightCones, persistAndRenderInventory)
    );
  }

  for (const el of [els.bossFilter, els.resultMode, els.lcMode, els.resultSearch, els.sortMode]) {
    el.addEventListener("input", renderCurrentResults);
  }
}

async function loadJson(): Promise<void> {
  try {
    const response = await fetch("scrapped.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    setRuns((await response.json()) as RawRun[]);
  } catch {
    els.results.innerHTML = `<div class="empty">No pude cargar scrapped.json automáticamente. Abre esta carpeta con un servidor local o usa el botón "Cargar runs".</div>`;
  }
}

function handleRunImport(event: Event): void {
  readJsonFile<RawRun[]>(event, setRuns, "Ese archivo no parece ser un JSON válido de runs.");
}

function handleInventoryImport(event: Event): void {
  readJsonFile<SerializedInventory>(
    event,
    (data) => {
      state.inventory = importInventory(data, { characters: state.characters, lightCones: state.lightCones });
      persistAndRenderInventory();
    },
    "Ese inventario no parece ser un JSON válido."
  );
}

function setRuns(rawRuns: RawRun[]): void {
  state.runs = normalizeRuns(rawRuns);
  state.characters = [...new Set(state.runs.flatMap((run) => run.team.map((member) => member.char)))].sort();
  state.lightCones = [
    ...new Set(state.runs.flatMap((run) => run.team.map((member) => member.lc)).filter(Boolean)),
  ].sort();

  reconcileInventory(state.inventory, state.characters, state.lightCones);
  renderBossOptions(els, state.runs);
  renderInventory(els, state.inventory, state.characters, state.lightCones, persistAndRenderInventory);
  renderCurrentResults();
}

function persistAndRenderInventory(): void {
  saveInventory(state.inventory);
  renderInventory(els, state.inventory, state.characters, state.lightCones, persistAndRenderInventory);
  renderCurrentResults();
}

function renderCurrentResults(): void {
  const filters = getFilters(els);
  const evaluated = state.runs
    .map((run) => evaluateRun(run, state.inventory, filters.lcMode))
    .filter((run) => matchesFilters(run, filters));

  const visible = applyResultMode(evaluated, filters.resultMode).sort((a, b) => compareRuns(a, b, filters.sortMode));
  renderResults(els, evaluated, visible);
}

function exportInventory(): void {
  const data = JSON.stringify(serializeInventory(state.inventory), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `herta-inventario-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function readJsonFile<T>(event: Event, onRead: (data: T) => void, errorMessage: string): void {
  const input = event.target as HTMLInputElement;
  const [file] = Array.from(input.files || []);
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      onRead(JSON.parse(String(reader.result)) as T);
      input.value = "";
    } catch {
      els.results.innerHTML = `<div class="empty">${errorMessage}</div>`;
    }
  };
  reader.readAsText(file);
}
