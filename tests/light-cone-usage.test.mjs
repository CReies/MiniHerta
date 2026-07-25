import assert from "node:assert/strict";
import test from "node:test";

import { mostUsedLightConesByCharacter } from "../.test-dist/domain/runs/light-cone-usage.js";

function makeRun(id, lightCones) {
  return {
    id,
    author: "Test",
    boss: "Boss",
    videoUrl: "",
    videoDate: "",
    subcategory: "0-Cycle",
    metricValue: 0,
    limitedCost: 0,
    standardCost: 0,
    team: lightCones.map((lightCone, index) => ({
      slot: index + 1,
      char: "Acheron",
      eidolon: 0,
      lc: lightCone,
      superimp: 1,
    })),
  };
}

test("selects the three most used light cones per character", () => {
  const runs = [
    makeRun("one", ["Along the Passing Shore", "Good Night and Sleep Well"]),
    makeRun("two", ["Along the Passing Shore", "Boundless Choreo"]),
    makeRun("three", ["Along the Passing Shore", "Boundless Choreo", "In the Night"]),
    makeRun("four", ["A Secret Vow"]),
  ];

  const usage = mostUsedLightConesByCharacter(runs).get("Acheron");

  assert.deepEqual(usage, [
    { name: "Along the Passing Shore", uses: 3 },
    { name: "Boundless Choreo", uses: 2 },
    { name: "A Secret Vow", uses: 1 },
  ]);
});
