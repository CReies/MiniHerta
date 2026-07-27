import assert from "node:assert/strict";
import test from "node:test";

import { normalizeRuns } from "../.test-dist/domain/runs/normalize-runs.js";
import { matchesFilters } from "../.test-dist/domain/scoring/filter-runs.js";
import { buildBossFilterOptions } from "../.test-dist/ui/run-filters/build-boss-filter-options.js";

function makeRawRun({
  id = "run",
  mode = "Apocalyptic Shadow",
  boss = "Boss",
  subcategory = "0 AV",
  metric = 4000,
} = {}) {
  return {
    id,
    mode,
    boss_name: boss,
    season: "4.3",
    subcategory,
    metric_value: metric,
    p1_char: "Acheron",
  };
}

test("Apocalyptic Shadow aliases and 0 AV runs are normalized into searchable results", () => {
  const runs = normalizeRuns([makeRawRun({ mode: "AS" })]);

  assert.equal(runs.length, 1);
  assert.equal(runs[0].endgame, "Apocalyptic Shadow");
});

test("AA boss options expose three Knights and group the Plight variant under King", () => {
  const options = buildBossFilterOptions(
    [
      { endgame: "Anomaly Arbitration", boss: "Svarog" },
      { endgame: "Anomaly Arbitration", boss: "Murata Graphia, Founding Artist (Plight)" },
      { endgame: "Anomaly Arbitration", boss: "Argenti" },
      { endgame: "Anomaly Arbitration", boss: "Murata Graphia, Founding Artist" },
      { endgame: "Anomaly Arbitration", boss: "Illwish Archlotus" },
    ],
    "Anomaly Arbitration"
  );

  assert.deepEqual(
    options.map((option) => option.label),
    [
      "Knight 1 — Argenti",
      "Knight 2 — Illwish Archlotus",
      "Knight 3 — Svarog",
      "King — Murata Graphia, Founding Artist",
    ]
  );
});

test("other endgames expose their bosses as numbered stages", () => {
  const options = buildBossFilterOptions(
    [
      { endgame: "Apocalyptic Shadow", boss: "Ichor Memosprite" },
      { endgame: "Apocalyptic Shadow", boss: "Cocolia" },
      { endgame: "Apocalyptic Shadow", boss: "Flame Reaver" },
    ],
    "AS"
  );

  assert.deepEqual(
    options.map((option) => option.label),
    ["Stage 1 — Cocolia", "Stage 2 — Flame Reaver", "Stage 3 — Ichor Memosprite"]
  );
});

test("selecting the AA King includes its normal and Plight runs", () => {
  const filters = {
    endgame: "Anomaly Arbitration",
    version: "4.3",
    boss: "Murata Graphia, Founding Artist",
    resultMode: "all",
    lcMode: "strict",
    resultSearch: "",
    sortMode: "missing",
  };
  const normal = normalizeRuns([
    makeRawRun({
      mode: "Anomaly Arbitration",
      boss: "Murata Graphia, Founding Artist",
      subcategory: "0-Cycle",
      metric: 0,
    }),
  ])[0];
  const plight = { ...normal, boss: "Murata Graphia, Founding Artist (Plight)" };
  const other = { ...normal, boss: "Svarog" };

  assert.equal(matchesFilters(normal, filters), true);
  assert.equal(matchesFilters(plight, filters), true);
  assert.equal(matchesFilters(other, filters), false);
});
