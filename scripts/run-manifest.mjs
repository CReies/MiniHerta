// @ts-check

import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";

/**
 * @typedef {object} RunSource
 * @property {string} file
 * @property {string} endgame
 * @property {string} version
 * @property {string} updatedAt
 */

/** @typedef {Record<string, unknown>} JsonRecord */

/**
 * @param {string} runsRoot
 * @param {string} [directory]
 * @returns {Promise<RunSource[]>}
 */
export async function collectRunSources(runsRoot, directory = runsRoot) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) return collectRunSources(runsRoot, absolutePath);
      if (!entry.isFile() || !entry.name.endsWith(".json") || entry.name === "index.json") return [];

      const payload = JSON.parse(await readFile(absolutePath, "utf8"));
      const firstRun = collectionItems(payload)[0] ?? {};
      const data = recordValue(firstRun.data) ?? firstRun;
      return [
        {
          file: relative(runsRoot, absolutePath).replaceAll("\\", "/"),
          endgame: canonicalEndgame(String(data.mode ?? firstRun.mode ?? relative(runsRoot, dirname(absolutePath)))),
          version: String(data.season ?? firstRun.season ?? basename(entry.name, ".json")),
          updatedAt: collectionUpdatedAt(payload),
        },
      ];
    })
  );

  return sortRunSources(nested.flat());
}

/**
 * @param {unknown} payload
 * @returns {string}
 */
export function collectionUpdatedAt(payload) {
  const explicit = timestampValue(recordValue(payload)?.updatedAt);
  if (explicit !== null) return new Date(explicit).toISOString();

  let latest = 0;
  for (const run of collectionItems(payload)) {
    const data = recordValue(run.data) ?? run;
    for (const candidate of [data.video_date, run.created_at]) {
      latest = Math.max(latest, timestampValue(candidate) ?? 0);
    }
  }
  return new Date(latest).toISOString();
}

/**
 * @param {RunSource[]} sources
 * @returns {RunSource[]}
 */
export function sortRunSources(sources) {
  return sources.sort(
    (a, b) =>
      compareVersionsDescending(a.version, b.version) ||
      b.updatedAt.localeCompare(a.updatedAt) ||
      a.file.localeCompare(b.file)
  );
}

/**
 * @param {string} value
 * @returns {string}
 */
export function canonicalEndgame(value) {
  /** @type {Record<string, string>} */
  const aliases = {
    aa: "Anomaly Arbitration",
    "anomaly arbitration": "Anomaly Arbitration",
    as: "Apocalyptic Shadow",
    "apocalyptic shadow": "Apocalyptic Shadow",
    moc: "Memory of Chaos",
    "memory of chaos": "Memory of Chaos",
    pf: "Pure Fiction",
    "pure fiction": "Pure Fiction",
  };
  const trimmed = value.trim();
  return aliases[trimmed.toLowerCase()] ?? trimmed;
}

/**
 * @param {unknown} payload
 * @returns {JsonRecord[]}
 */
function collectionItems(payload) {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  const items = recordValue(payload)?.items;
  return Array.isArray(items) ? items.filter(isRecord) : [];
}

/**
 * @param {string} left
 * @param {string} right
 * @returns {number}
 */
function compareVersionsDescending(left, right) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (rightParts[index] ?? 0) - (leftParts[index] ?? 0);
    if (Number.isFinite(difference) && difference !== 0) return difference;
  }
  return right.localeCompare(left);
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function timestampValue(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

/**
 * @param {unknown} value
 * @returns {JsonRecord | null}
 */
function recordValue(value) {
  return isRecord(value) ? value : null;
}

/**
 * @param {unknown} value
 * @returns {value is JsonRecord}
 */
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
