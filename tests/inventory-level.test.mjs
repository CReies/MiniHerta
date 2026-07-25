import assert from "node:assert/strict";
import test from "node:test";

import { stepInventoryLevel } from "../.test-dist/domain/inventory/inventory-levels.js";

test("plus and minus traverse character eidolons including unowned", () => {
  assert.equal(stepInventoryLevel("character", undefined, 1), 0);
  assert.equal(stepInventoryLevel("character", 0, 1), 1);
  assert.equal(stepInventoryLevel("character", 1, -1), 0);
  assert.equal(stepInventoryLevel("character", 0, -1), null);
  assert.equal(stepInventoryLevel("character", 6, 1), 6);
});

test("plus and minus traverse light cone superimpositions including unowned", () => {
  assert.equal(stepInventoryLevel("lightCone", undefined, 1), 1);
  assert.equal(stepInventoryLevel("lightCone", 1, 1), 2);
  assert.equal(stepInventoryLevel("lightCone", 2, -1), 1);
  assert.equal(stepInventoryLevel("lightCone", 1, -1), null);
  assert.equal(stepInventoryLevel("lightCone", 5, 1), 5);
});
