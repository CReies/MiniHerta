import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { importInventory } from "../.test-dist/domain/inventory.js";
import { normalizeRuns, parseRawRunsPayload } from "../.test-dist/domain/normalize.js";
import { LocalStorageInventoryRepository } from "../.test-dist/infrastructure/browser/inventory-repository.js";
import { HttpRunsRepository } from "../.test-dist/infrastructure/http/runs-repository.js";
import { FolderRunsRepository } from "../.test-dist/infrastructure/http/folder-runs-repository.js";

const runsRoot = fileURLToPath(new URL("../runs/", import.meta.url));

test("inventory imports reject invalid collection shapes and levels", () => {
  assert.throws(() => importInventory({ unexpected: true }), /Invalid inventory payload/);
  assert.throws(() => importInventory({ characters: [] }), /Invalid inventory payload/);
  assert.throws(() => importInventory({ lightCones: { "In the Night": "S1" } }), /Invalid inventory payload/);
  assert.throws(() => importInventory({ version: 2, characters: {} }), /Invalid inventory payload/);
  assert.equal(importInventory({ characters: { Acheron: 1 } }).characters.get("Acheron"), 1);
  assert.equal(importInventory({ version: 1, characters: { Acheron: 2 } }).characters.get("Acheron"), 2);
});

test("local inventory storage distinguishes missing and corrupt data", () => {
  const missing = new LocalStorageInventoryRepository({
    getItem: () => null,
    setItem: () => {},
  });
  const corrupt = new LocalStorageInventoryRepository({
    getItem: () => "{not-json",
    setItem: () => {},
  });

  assert.equal(missing.load().characters.size, 0);
  assert.throws(() => corrupt.load(), SyntaxError);
});

test("HTTP run repositories reject malformed run items", async () => {
  const fetcher = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ items: [{}] }),
  });
  const repository = new HttpRunsRepository("https://example.test/runs.json", {}, fetcher);

  await assert.rejects(repository.load(), /Invalid runs payload: item 0/);
});

test("folder run repositories reject malformed manifests", async () => {
  const fetcher = async () => ({
    ok: true,
    status: 200,
    url: "https://example.test/runs/index.json",
    json: async () => ({
      sources: [{ file: "AA/4.4.json", endgame: "Anomaly Arbitration", version: "4.4" }],
    }),
  });
  const repository = new FolderRunsRepository("https://example.test/runs/index.json", fetcher);

  await assert.rejects(repository.list(), /Invalid runs manifest: source 0/);
});

test("folder run repositories reject encoded traversal paths", async () => {
  const fetcher = async () => ({
    ok: true,
    status: 200,
    url: "https://example.test/runs/index.json",
    json: async () => ({
      sources: [
        {
          file: "%2e%2e/private.json",
          endgame: "Anomaly Arbitration",
          version: "4.4",
          updatedAt: "2026-07-24",
        },
      ],
    }),
  });
  const repository = new FolderRunsRepository("https://example.test/runs/index.json", fetcher);

  await assert.rejects(repository.list(), /Invalid runs manifest: source 0/);
});

test("run payload validation rejects incomplete teams and invalid numeric domains", async () => {
  const malformedRuns = [
    {
      id: "teamless",
      author_name: "Test",
      boss_name: "Boss",
      season: "4.4",
      mode: "Anomaly Arbitration",
      subcategory: "0-Cycle",
      metric_value: null,
      total_limited_5star_count: 0,
      total_standard_5star_count: 0,
    },
    {
      id: "bad-eidolon",
      author_name: "Test",
      boss_name: "Boss",
      season: "4.4",
      mode: "Anomaly Arbitration",
      subcategory: "0-Cycle",
      metric_value: 0,
      total_limited_5star_count: 0,
      total_standard_5star_count: 0,
      p1_char: "Acheron",
      p1_eidolon: 7,
      p1_superimp: 1,
    },
  ];

  for (const rawRun of malformedRuns) {
    const repository = new HttpRunsRepository("https://example.test/runs.json", {}, async () => ({
      ok: true,
      status: 200,
      json: async () => ({ items: [rawRun] }),
    }));
    await assert.rejects(repository.load(), /Invalid runs payload: item 0/);
  }
});

test("every source-controlled run collection satisfies the external boundary schema", async () => {
  let validatedRuns = 0;
  for (const directory of await readdir(runsRoot, { withFileTypes: true })) {
    if (!directory.isDirectory()) continue;
    for (const file of await readdir(join(runsRoot, directory.name))) {
      if (!file.endsWith(".json")) continue;
      const payload = JSON.parse(await readFile(join(runsRoot, directory.name, file), "utf8"));
      validatedRuns += parseRawRunsPayload(payload).length;
    }
  }

  assert.ok(validatedRuns > 20_000);
});

test("run normalization keeps only HTTP video links", () => {
  const rawRun = {
    id: "video-run",
    data: {
      author_name: "Test",
      boss_name: "Boss",
      season: "4.4",
      mode: "Anomaly Arbitration",
      subcategory: "0-Cycle",
      metric_value: 0,
      total_limited_5star_count: 0,
      total_standard_5star_count: 0,
      video_url: "javascript:alert(1)",
      p1_char: "Acheron",
      p1_eidolon: 0,
      p1_superimp: 1,
    },
  };

  assert.equal(normalizeRuns([rawRun])[0].videoUrl, "");
  rawRun.data.video_url = "https://example.test/watch";
  assert.equal(normalizeRuns([rawRun])[0].videoUrl, "https://example.test/watch");
  assert.deepEqual(
    normalizeRuns([rawRun])[0].team.map((member) => member.char),
    ["Acheron"]
  );
});
