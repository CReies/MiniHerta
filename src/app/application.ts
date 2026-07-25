import { importInventory, serializeInventory } from "../domain/inventory.js";
import { parseRawRunsPayload } from "../domain/normalize.js";
import type { FilterState, ItemKind, RawRun, SerializedInventory } from "../domain/types.js";
import type { InventoryRepository, RunSource, RunsRepository, SelectableRunsRepository } from "./ports.js";
import type { AppErrorCode, AppStore, InventorySearchState } from "./state.js";

export class HertaApplication {
  private selectableRepository: SelectableRunsRepository | null = null;
  private runSources: RunSource[] = [];
  private loadSequence = 0;
  private inventoryStorageError: InventoryStorageErrorCode | null = null;

  constructor(
    readonly store: AppStore,
    private readonly inventoryRepository: InventoryRepository,
    private readonly runsRepositories: RunsRepository[]
  ) {}

  async initialize(): Promise<void> {
    const sequence = ++this.loadSequence;
    try {
      this.store.replaceInventory(this.inventoryRepository.load());
      this.inventoryStorageError = null;
    } catch {
      this.inventoryStorageError = "inventoryStorageReadFailed";
    }
    this.store.setStatus({ type: "loading", message: "loadingRuns" });

    for (const repository of this.runsRepositories) {
      if (sequence !== this.loadSequence) return;

      let runs: RawRun[];
      try {
        if (isSelectableRepository(repository)) {
          const sources = await repository.list();
          if (sequence !== this.loadSequence) return;
          const initialSource = sources[0];
          if (!initialSource) throw new Error("No hay fuentes de runs disponibles");
          runs = parseRawRunsPayload(await repository.loadSource(initialSource));
          if (sequence !== this.loadSequence) return;
          this.selectableRepository = repository;
          this.runSources = sources;
          this.store.replaceRunSources(sources);
          this.store.updateFilters({ endgame: initialSource.endgame, version: initialSource.version });
        } else {
          runs = parseRawRunsPayload(await repository.load());
          if (sequence !== this.loadSequence) return;
        }
      } catch {
        if (sequence !== this.loadSequence) return;
        // Repositories are ordered fallbacks; the final failure is reported below.
        continue;
      }

      this.replaceRuns(runs);
      this.completeRunLoad();
      return;
    }

    if (sequence === this.loadSequence) {
      this.store.setStatus({ type: "error", message: "runsDownloadFailed" });
    }
  }

  replaceRunsPayload(payload: unknown): void {
    this.loadSequence += 1;
    const runs = parseRawRunsPayload(payload);
    this.selectableRepository = null;
    this.runSources = [];
    this.store.replaceRunSources([]);
    this.replaceRuns(runs);
    this.completeRunLoad();
  }

  importInventory(data: unknown): void {
    // The runtime catalog is intentionally partial because only one run source is loaded at a time.
    const inventory = importInventory(data);
    this.store.replaceInventory(inventory);
    if (this.persistInventory()) this.restoreReadyStatus();
  }

  updateInventoryItem(kind: ItemKind, name: string, level: number | null): void {
    this.store.updateInventoryItem(kind, name, level);
    if (this.persistInventory()) this.restoreReadyStatus();
  }

  resetInventory(): void {
    this.store.resetInventory();
    if (this.persistInventory()) this.restoreReadyStatus();
  }

  updateFilters(filters: Partial<FilterState>): void {
    this.store.updateFilters(filters);
    this.restoreReadyStatus();
  }

  async selectRunSource(endgame: string, version: string): Promise<void> {
    const repository = this.selectableRepository;
    if (!repository || this.runSources.length === 0) {
      this.updateFilters({ endgame, version });
      return;
    }

    const candidates =
      endgame === "Todos" ? this.runSources : this.runSources.filter((source) => source.endgame === endgame);
    const selectedVersion = candidates.some((candidate) => candidate.version === version)
      ? version
      : candidates[0]?.version;
    if (!selectedVersion) return;
    const sources = candidates.filter((candidate) => candidate.version === selectedVersion);
    const previousSelection = {
      endgame: this.store.snapshot.filters.endgame,
      version: this.store.snapshot.filters.version,
    };

    const sequence = ++this.loadSequence;
    this.store.updateFilters({ endgame, version: selectedVersion });
    this.store.setStatus({ type: "loading", message: "loadingRuns" });
    try {
      const payload = (await Promise.all(sources.map((source) => repository.loadSource(source)))).flat();
      if (sequence !== this.loadSequence) return;
      const runs = parseRawRunsPayload(payload);
      this.replaceRuns(runs);
      this.completeRunLoad();
    } catch {
      if (sequence === this.loadSequence) {
        this.store.updateFilters(previousSelection);
        this.store.setStatus({ type: "error", message: "runCollectionFailed" });
      }
    }
  }

  updateInventorySearch(kind: keyof InventorySearchState, query: string): void {
    this.store.updateInventorySearch(kind, query);
    this.restoreReadyStatus();
  }

  exportInventory(): SerializedInventory {
    return serializeInventory(this.store.snapshot.inventory);
  }

  reportError(message: AppErrorCode): void {
    this.store.setStatus({ type: "error", message });
  }

  private replaceRuns(rawRuns: RawRun[]): void {
    this.store.replaceRuns(rawRuns);
  }

  private completeRunLoad(): void {
    this.store.setStatus(
      this.inventoryStorageError ? { type: "error", message: this.inventoryStorageError } : { type: "ready" }
    );
  }

  private persistInventory(): boolean {
    try {
      this.inventoryRepository.save(this.store.snapshot.inventory);
      this.inventoryStorageError = null;
      return true;
    } catch {
      this.inventoryStorageError = "inventoryStorageWriteFailed";
      this.store.setStatus({ type: "error", message: this.inventoryStorageError });
      return false;
    }
  }

  private restoreReadyStatus(): void {
    if (this.store.snapshot.runs.length > 0 && this.store.snapshot.status.type === "error") {
      this.store.setStatus(
        this.inventoryStorageError ? { type: "error", message: this.inventoryStorageError } : { type: "ready" }
      );
    }
  }
}

type InventoryStorageErrorCode = "inventoryStorageReadFailed" | "inventoryStorageWriteFailed";

function isSelectableRepository(repository: RunsRepository): repository is SelectableRunsRepository {
  return (
    "list" in repository &&
    typeof repository.list === "function" &&
    "loadSource" in repository &&
    typeof repository.loadSource === "function"
  );
}
