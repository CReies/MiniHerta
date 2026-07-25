import assert from "node:assert/strict";
import test from "node:test";

import { AppStore } from "../.test-dist/app/application-state/app-store.js";
import { HertaApplication } from "../.test-dist/app/herta-application.js";
import { LocalStorageInventoryRepository } from "../.test-dist/infrastructure/browser/inventory-repository.js";
import { FolderRunsRepository } from "../.test-dist/infrastructure/http/runs/folder-runs-repository.js";

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
      total_limited_5star_count: 0,
      total_standard_5star_count: 0,
      p1_char: "Acheron",
      p1_eidolon: 0,
      p1_lc: "In the Night",
      p1_superimp: 1,
      p2_char: "Pela",
      p2_eidolon: 0,
      p2_lc: "",
      p2_superimp: 1,
      p3_char: "Asta",
      p3_eidolon: 0,
      p3_lc: "",
      p3_superimp: 1,
      p4_char: "Gallagher",
      p4_eidolon: 0,
      p4_lc: "",
      p4_superimp: 1,
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

test("store snapshots cannot mutate internal maps or normalized runs", () => {
  const store = new AppStore();
  store.replaceRuns([makeRawRun()]);
  const snapshot = store.snapshot;

  snapshot.inventory.characters.set("Injected", 6);
  snapshot.catalog.itemsByKind.character.set("Injected", {
    kind: "character",
    name: "Injected",
    rarity: 5,
  });

  assert.throws(() => {
    snapshot.runs[0].team[0].char = "Injected";
  }, TypeError);
  assert.equal(store.snapshot.inventory.characters.has("Injected"), false);
  assert.equal(store.snapshot.catalog.itemsByKind.character.has("Injected"), false);
  assert.equal(store.snapshot.runs[0].team[0].char, "Acheron");
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

  assert.equal(store.snapshot.status.type, "ready");
  assert.equal(store.snapshot.runs.length, 1);
  assert.equal(store.snapshot.catalog.characters[0].name, "Acheron");
  assert.equal(saved.length, 0);
});

test("the folder repository loads only the newest run collection by default", async () => {
  const requested = [];
  const sources = [
    { file: "AA/4.4.json", endgame: "Anomaly Arbitration", version: "4.4", updatedAt: "2026-07-16" },
    { file: "AA/4.3.json", endgame: "Anomaly Arbitration", version: "4.3", updatedAt: "2026-07-15" },
  ];
  const payloads = new Map([
    ["https://example.test/runs/index.json", { sources }],
    ["https://example.test/runs/AA/4.3.json", { items: [makeRawRun("run-43")], count: 1 }],
    ["https://example.test/runs/AA/4.4.json", { items: [makeRawRun("run-44")], count: 1 }],
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
  const repository = new FolderRunsRepository("https://example.test/runs/index.json", fetcher);

  const runs = await repository.load();

  assert.deepEqual(
    runs.map((run) => run.id),
    ["run-44"]
  );
  assert.deepEqual(requested, ["https://example.test/runs/index.json", "https://example.test/runs/AA/4.4.json"]);

  const olderRuns = await repository.loadSource(sources[1]);
  assert.deepEqual(
    olderRuns.map((run) => run.id),
    ["run-43"]
  );
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

test("manual run replacement invalidates an in-flight selectable load", async () => {
  const sources = [
    { file: "AA/4.4.json", endgame: "Anomaly Arbitration", version: "4.4", updatedAt: "2026-07-16" },
    { file: "AA/4.3.json", endgame: "Anomaly Arbitration", version: "4.3", updatedAt: "2026-07-15" },
  ];
  let resolveOlderSource;
  const olderSource = new Promise((resolve) => {
    resolveOlderSource = resolve;
  });
  const repository = {
    list: async () => sources,
    load: async () => [makeRawRun("run-44")],
    loadSource: async (source) => (source.version === "4.3" ? olderSource : [makeRawRun("run-44")]),
  };
  const inventoryRepository = {
    load: () => ({ characters: new Map(), lightCones: new Map() }),
    save: () => {},
  };
  const store = new AppStore();
  const application = new HertaApplication(store, inventoryRepository, [repository]);

  await application.initialize();
  const pendingSelection = application.selectRunSource("Anomaly Arbitration", "4.3");
  assert.equal(typeof resolveOlderSource, "function");

  application.replaceRunsPayload([makeRawRun("manual")]);
  resolveOlderSource([makeRawRun("run-43")]);
  await pendingSelection;

  assert.equal(store.snapshot.runs[0].id, "manual");
  assert.equal(store.snapshot.runSources.length, 0);
  assert.equal(store.snapshot.status.type, "ready");
});

test("a failed source load restores the previous filter selection", async () => {
  const sources = [
    { file: "AA/4.4.json", endgame: "Anomaly Arbitration", version: "4.4", updatedAt: "2026-07-16" },
    { file: "AA/4.3.json", endgame: "Anomaly Arbitration", version: "4.3", updatedAt: "2026-07-15" },
  ];
  const repository = {
    list: async () => sources,
    load: async () => [makeRawRun("run-44")],
    loadSource: async (source) => {
      if (source.version === "4.3") throw new Error("offline");
      return [makeRawRun("run-44")];
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

  assert.equal(store.snapshot.filters.endgame, "Anomaly Arbitration");
  assert.equal(store.snapshot.filters.version, "4.4");
  assert.deepEqual(store.snapshot.status, { type: "error", message: "runCollectionFailed" });
});

test("corrupt stored inventory is reported and not overwritten during run loading", async () => {
  let writes = 0;
  const storage = {
    getItem: () => "{not-json",
    setItem: () => {
      writes += 1;
    },
  };
  const store = new AppStore();
  const application = new HertaApplication(store, new LocalStorageInventoryRepository(storage), [
    { load: async () => [makeRawRun()] },
  ]);

  await application.initialize();

  assert.equal(store.snapshot.runs.length, 1);
  assert.deepEqual(store.snapshot.status, { type: "error", message: "inventoryStorageReadFailed" });
  assert.equal(writes, 0);

  application.resetInventory();
  assert.equal(writes, 1);
  assert.deepEqual(store.snapshot.status, { type: "ready" });
});

test("inventory persistence failures are reported without escaping the command", async () => {
  const inventoryRepository = {
    load: () => ({ characters: new Map(), lightCones: new Map() }),
    save: () => {
      throw new Error("quota exceeded");
    },
  };
  const store = new AppStore();
  const application = new HertaApplication(store, inventoryRepository, [{ load: async () => [makeRawRun()] }]);
  await application.initialize();

  assert.doesNotThrow(() => application.updateInventoryItem("character", "Acheron", 1));
  assert.equal(store.snapshot.inventory.characters.get("Acheron"), 1);
  assert.deepEqual(store.snapshot.status, { type: "error", message: "inventoryStorageWriteFailed" });

  application.updateFilters({ resultSearch: "Acheron" });
  assert.deepEqual(store.snapshot.status, { type: "error", message: "inventoryStorageWriteFailed" });
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
