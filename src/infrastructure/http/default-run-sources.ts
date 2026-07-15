import type { RunsRepository } from "../../app/ports.js";
import { FolderRunsRepository } from "./folder-runs-repository.js";

export function createDefaultRunsRepositories(): RunsRepository[] {
  return [new FolderRunsRepository("scrapped/index.json")];
}
