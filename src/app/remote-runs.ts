import type { RawRun } from "../domain/types.js";
import { fetchJson } from "./json-file.js";

const RUNS_URL =
  "https://theherta.com/api/archive/submissions?season=4.3&mode=Memory+of+Chaos&bossName=Murata+Graphia%2C+Founding+Artist";

export function fetchRemoteRuns(): Promise<RawRun[]> {
  return fetchJson<RawRun[]>(RUNS_URL);
}
