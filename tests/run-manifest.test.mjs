import assert from "node:assert/strict";
import test from "node:test";

import { canonicalEndgame, collectionUpdatedAt, sortRunSources } from "../scripts/run-manifest.mjs";

test("run manifest canonicalizes endgame directory aliases", () => {
  assert.equal(canonicalEndgame("AS"), "Apocalyptic Shadow");
  assert.equal(canonicalEndgame("Apocalyptic Shadow"), "Apocalyptic Shadow");
});

test("run manifest dates are stable data, not checkout mtimes", () => {
  assert.equal(
    collectionUpdatedAt({
      items: [{ video_date: "2026-07-20T10:00:00.000Z" }, { video_date: "2026-07-22T10:00:00.000Z" }],
    }),
    "2026-07-22T10:00:00.000Z"
  );
  assert.equal(
    collectionUpdatedAt({
      updatedAt: "2026-07-24T12:30:00.000Z",
      items: [{ video_date: "2026-07-25T10:00:00.000Z" }],
    }),
    "2026-07-24T12:30:00.000Z"
  );
});

test("run manifest ordering prefers the newest game version deterministically", () => {
  const sources = [
    { file: "AS/4.3.json", version: "4.3", updatedAt: "2026-07-25T00:00:00.000Z" },
    { file: "AA/4.4.json", version: "4.4", updatedAt: "2026-07-20T00:00:00.000Z" },
    { file: "MOC/4.3.json", version: "4.3", updatedAt: "2026-07-24T00:00:00.000Z" },
  ];

  assert.deepEqual(
    sortRunSources(sources).map((source) => source.file),
    ["AA/4.4.json", "AS/4.3.json", "MOC/4.3.json"]
  );
});
