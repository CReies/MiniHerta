import assert from "node:assert/strict";
import test from "node:test";

import { HertaApplication } from "../dist/app/application.js";
import { AppStore } from "../dist/app/state.js";
import { FolderRunsRepository } from "../dist/infrastructure/http/folder-runs-repository.js";

function makeRawRun(id = "run-1") {
  return {
    id,
    data: {
      author_name: "Test",
      boss_name: "Boss",
      season: id === "run-43" ? "4.3" : "4.4",
      mode: "Anomaly Arbitration",
      subcategory: "0-Cycle",
      metric_value: 0,
      p1_char: "Acheron",
      p1_eidolon: 0,
      p1_lc: "In the Night",
      p1_superimp: 1,
    },
  };
}

test("the observable store emits immutable inventory replacements", () => {
  const store = new AppStore();
  const emissions = [];
  const unsubscribe = store.subscribe((state) => emissions.push(state));
  const initialInventory = store.snapshot.inventory;

  store.updateInventoryItem("character", "Acheron", 2);
  unsubscribe();

  assert.equal(emissions.length, 2);
  assert.notEqual(store.snapshot.inventory, initialInventory);
  assert.equal(initialInventory.characters.has("Acheron"), false);
  assert.equal(store.snapshot.inventory.characters.get("Acheron"), 2);
});

test("the result list defaults to every run ordered by the least missing investment", () => {
  const store = new AppStore();

  assert.equal(store.snapshot.filters.resultMode, "all");
  assert.equal(store.snapshot.filters.sortMode, "missing");
});

test("the run filters default to the latest available version", () => {
  const store = new AppStore();

  store.replaceRuns([makeRawRun("run-43"), makeRawRun("run-44")]);

  assert.equal(store.snapshot.filters.endgame, "Todos");
  assert.equal(store.snapshot.filters.version, "4.4");
});

test("the application falls back to the next run repository", async () => {
  const saved = [];
  const inventoryRepository = {
    load: () => ({ characters: new Map(), lightCones: new Map() }),
    save: (inventory) => saved.push(inventory),
  };
  const failingSource = { load: async () => Promise.reject(new Error("offline")) };
  const workingSource = { load: async () => [makeRawRun()] };
  const store = new AppStore();
  const application = new HertaApplication(store, inventoryRepository, [failingSource, workingSource]);

  await application.initialize();

  assert.equal(store.snapshot.status, "ready");
  assert.equal(store.snapshot.runs.length, 1);
  assert.equal(store.snapshot.catalog.characters[0].name, "Acheron");
  assert.equal(saved.length, 1);
});

test("the folder repository loads only the newest run collection by default", async () => {
  const requested = [];
  const sources = [
    { file: "AA/4.4.json", endgame: "Anomaly Arbitration", version: "4.4", updatedAt: "2026-07-16" },
    { file: "AA/4.3.json", endgame: "Anomaly Arbitration", version: "4.3", updatedAt: "2026-07-15" },
  ];
  const payloads = new Map([
    ["https://example.test/scrapped/index.json", { sources }],
    ["https://example.test/scrapped/AA/4.3.json", { items: [makeRawRun("run-43")], count: 1 }],
    ["https://example.test/scrapped/AA/4.4.json", { items: [makeRawRun("run-44")], count: 1 }],
  ]);
  async function fetcher(url) {
    assert.equal(this, undefined);
    requested.push(url);
    const payload = payloads.get(url);
    return {
      ok: Boolean(payload),
      status: payload ? 200 : 404,
      url,
      json: async () => payload,
    };
  }
  const repository = new FolderRunsRepository("https://example.test/scrapped/index.json", fetcher);

  const runs = await repository.load();

  assert.deepEqual(runs.map((run) => run.id), ["run-44"]);
  assert.deepEqual(requested, [
    "https://example.test/scrapped/index.json",
    "https://example.test/scrapped/AA/4.4.json",
  ]);

  const olderRuns = await repository.loadSource(sources[1]);
  assert.deepEqual(olderRuns.map((run) => run.id), ["run-43"]);
});

test("the application exposes sources and fetches a selected season on demand", async () => {
  const sources = [
    { file: "AA/4.4.json", endgame: "Anomaly Arbitration", version: "4.4", updatedAt: "2026-07-16" },
    { file: "AA/4.3.json", endgame: "Anomaly Arbitration", version: "4.3", updatedAt: "2026-07-15" },
  ];
  const loaded = [];
  const repository = {
    list: async () => sources,
    load: async () => [makeRawRun("run-44")],
    loadSource: async (source) => {
      loaded.push(source.file);
      return [makeRawRun(source.version === "4.3" ? "run-43" : "run-44")];
    },
  };
  const inventoryRepository = {
    load: () => ({ characters: new Map(), lightCones: new Map() }),
    save: () => {},
  };
  const store = new AppStore();
  const application = new HertaApplication(store, inventoryRepository, [repository]);

  await application.initialize();
  await application.selectRunSource("Anomaly Arbitration", "4.3");

  assert.deepEqual(loaded, ["AA/4.4.json", "AA/4.3.json"]);
  assert.equal(store.snapshot.filters.version, "4.3");
  assert.equal(store.snapshot.runs[0].id, "run-43");
});

test("inventory commands persist a new collection without mutating prior state", async () => {
  const saved = [];
  const inventoryRepository = {
    load: () => ({ characters: new Map(), lightCones: new Map() }),
    save: (inventory) => saved.push(inventory),
  };
  const store = new AppStore();
  const application = new HertaApplication(store, inventoryRepository, [{ load: async () => [makeRawRun()] }]);
  await application.initialize();
  const previousInventory = store.snapshot.inventory;

  application.updateInventoryItem("character", "Acheron", 1);

  assert.equal(previousInventory.characters.has("Acheron"), false);
  assert.equal(store.snapshot.inventory.characters.get("Acheron"), 1);
  assert.equal(saved.at(-1).characters.get("Acheron"), 1);
});
