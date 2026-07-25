import type { RunsRepository } from "../../../app/runs/runs-repository.js";
import { FolderRunsRepository } from "./folder-runs-repository.js";

export function createDefaultRunsRepositories(): RunsRepository[] {
  return [new FolderRunsRepository("runs/index.json")];
}
