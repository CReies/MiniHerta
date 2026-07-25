import assert from "node:assert/strict";
import test from "node:test";

import { selectResults } from "../.test-dist/app/results.js";
import { AppStore } from "../.test-dist/app/state.js";
import { createCatalogFromRuns } from "../.test-dist/domain/catalog.js";
import { itemLabel, localizedRunSearchText } from "../.test-dist/ui/item-presentation.js";

test("catalog exposes Spanish character and Light Cone labels without changing canonical names", () => {
  const catalog = createCatalogFromRuns([
    {
      team: [{ char: "Firefly", lc: "Good Night and Sleep Well" }],
    },
  ]);

  assert.equal(catalog.characters[0].name, "Firefly");
  assert.equal(catalog.itemsByKind.character.get("Firefly"), catalog.characters[0]);
  assert.equal(itemLabel("character", "Firefly", "es"), "Luciérnaga");
  assert.equal(itemLabel("lightCone", "Good Night and Sleep Well", "es"), "Buenas noches, que duermas bien");
});

test("result search accepts localized Spanish item names", () => {
  const store = new AppStore();
  store.replaceRuns([
    {
      id: "localized-run",
      data: {
        author_name: "Test",
        boss_name: "Boss",
        season: "4.4",
        mode: "Anomaly Arbitration",
        subcategory: "0-Cycle",
        metric_value: 0,
        p1_char: "Firefly",
        p1_eidolon: 0,
        p1_lc: "Good Night and Sleep Well",
        p1_superimp: 1,
      },
    },
  ]);

  const filters = { ...store.snapshot.filters, resultSearch: "luciernaga" };
  assert.equal(selectResults(store.snapshot, filters, localizedRunSearchText).visible.length, 1);
});
