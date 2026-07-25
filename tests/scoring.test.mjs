import assert from "node:assert/strict";
import test from "node:test";

import { createCatalogFromRuns } from "../.test-dist/domain/catalog.js";
import { compareRuns, evaluateRun } from "../.test-dist/domain/scoring.js";

function makeRun({ id, character = "Acheron", eidolon = 0, lightCone = "In the Night", superimp = 1 }) {
  return {
    id,
    author: "Test",
    boss: "Test",
    videoUrl: "",
    videoDate: "2026-01-01",
    subcategory: "0-Cycle",
    metricValue: 0,
    limitedCost: 0,
    standardCost: 0,
    team: [{ slot: 1, char: character, eidolon, lc: lightCone, superimp }],
  };
}

function evaluate(run, inventory, lcMode = "strict") {
  return evaluateRun(run, inventory, lcMode, createCatalogFromRuns([run]));
}

test("counts eidolons required after obtaining a missing character", () => {
  const inventory = { characters: new Map(), lightCones: new Map([["In the Night", 1]]) };
  const e2 = evaluate(makeRun({ id: "e2", eidolon: 2 }), inventory);

  assert.equal(e2.missingScore, 100 + 2 * 135);
  assert.equal(e2.missing[0].label, "Acheron E2");
});

test("ranks a new E0 character and cone closer than a missing E2 character", () => {
  const inventory = { characters: new Map(), lightCones: new Map() };
  const missingE2 = evaluate(makeRun({ id: "e2", eidolon: 2, lightCone: "" }), inventory);
  const missingE0AndCone = evaluate(makeRun({ id: "e0-lc", eidolon: 0 }), inventory);

  assert.ok(compareRuns(missingE0AndCone, missingE2, "missing") < 0);
});

test("strict light-cone mode accepts an equal or higher superimposition", () => {
  const runS2 = makeRun({ id: "s2", superimp: 2 });
  const ownedS2 = { characters: new Map([["Acheron", 0]]), lightCones: new Map([["In the Night", 2]]) };
  const ownedS3 = { characters: new Map([["Acheron", 0]]), lightCones: new Map([["In the Night", 3]]) };

  assert.equal(evaluate(runS2, ownedS2).missingScore, 0);
  assert.equal(evaluate(runS2, ownedS3).missingScore, 0);
});

test("strict light-cone mode rejects a lower superimposition", () => {
  const runS2 = makeRun({ id: "s2", superimp: 2 });
  const inventory = { characters: new Map([["Acheron", 0]]), lightCones: new Map([["In the Night", 1]]) };

  assert.equal(evaluate(runS2, inventory).missingScore, 90);
});

test("counts superimpositions required after obtaining a missing light cone", () => {
  const inventory = { characters: new Map([["Acheron", 0]]), lightCones: new Map() };
  const s3 = evaluate(makeRun({ id: "s3", superimp: 3 }), inventory);

  assert.equal(s3.missingScore, 70 + 2 * 90);
  assert.equal(s3.missing[0].label, "In the Night S3");
});
