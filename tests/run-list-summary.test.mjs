import assert from "node:assert/strict";
import test from "node:test";

import { createRunListSummary } from "../.test-dist/ui/run-list/create-run-list-summary.js";

test("run list summaries separate possible, near, and visible counts", () => {
  const runs = [{ missingScore: 0 }, { missingScore: 120 }, { missingScore: 500 }];
  const summary = createRunListSummary(runs, 2);

  assert.deepEqual(summary, { possible: 1, near: 1, total: 3, visible: 2 });
});
