import assert from "node:assert/strict";
import test from "node:test";

import { HertaApplication } from "../dist/app/application.js";
import { AppStore } from "../dist/app/state.js";

function makeRawRun(id = "run-1") {
  return {
    id,
    data: {
      author_name: "Test",
      boss_name: "Boss",
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
