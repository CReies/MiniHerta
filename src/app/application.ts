import { importInventory, serializeInventory } from "../domain/inventory.js";
import type { FilterState, ItemKind, RawRun, RawRunCollection, SerializedInventory } from "../domain/types.js";
import type { InventoryRepository, RunSource, RunsRepository, SelectableRunsRepository } from "./ports.js";
import { AppStore, type InventorySearchState } from "./state.js";
import { t } from "../i18n.js";

export type RawRunsPayload = RawRun[] | RawRunCollection;

export class HertaApplication {
  private selectableRepository: SelectableRunsRepository | null = null;
  private runSources: RunSource[] = [];
  private loadSequence = 0;

  constructor(
    readonly store: AppStore,
    private readonly inventoryRepository: InventoryRepository,
    private readonly runsRepositories: RunsRepository[]
  ) {}

  async initialize(): Promise<void> {
    this.store.replaceInventory(this.inventoryRepository.load());
    this.store.setStatus("loading", t("status.loading"));

    for (const repository of this.runsRepositories) {
      let runs: RawRun[];
      try {
        if (isSelectableRepository(repository)) {
          const sources = await repository.list();
          const initialSource = sources[0];
          if (!initialSource) throw new Error("No hay fuentes de runs disponibles");
          runs = await repository.loadSource(initialSource);
          this.selectableRepository = repository;
          this.runSources = sources;
          this.store.replaceRunSources(sources);
          this.store.updateFilters({ endgame: initialSource.endgame, version: initialSource.version });
        } else {
          runs = await repository.load();
        }
      } catch {
        // Repositories are ordered fallbacks; the final failure is reported below.
        continue;
      }

      this.replaceRuns(runs);
      return;
    }

    this.store.setStatus("error", t("error.download"));
  }

  replaceRunsPayload(payload: RawRunsPayload): void {
    this.selectableRepository = null;
    this.runSources = [];
    this.store.replaceRunSources([]);
    this.replaceRuns(Array.isArray(payload) ? payload : payload.items);
  }

  importInventory(data: SerializedInventory): void {
    // The runtime catalog is intentionally partial because only one run source is loaded at a time.
    const inventory = importInventory(data);
    this.store.replaceInventory(inventory);
    this.persistInventory();
    this.restoreReadyStatus();
  }

  updateInventoryItem(kind: ItemKind, name: string, level: number | null): void {
    this.store.updateInventoryItem(kind, name, level);
    this.persistInventory();
    this.restoreReadyStatus();
  }

  resetInventory(): void {
    this.store.resetInventory();
    this.persistInventory();
    this.restoreReadyStatus();
  }

  updateFilters(filters: Partial<FilterState>): void {
    this.store.updateFilters(filters);
    this.restoreReadyStatus();
  }

  async selectRunSource(endgame: string, version: string): Promise<void> {
    if (!this.selectableRepository || this.runSources.length === 0) {
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

    const sequence = ++this.loadSequence;
    this.store.updateFilters({ endgame, version: selectedVersion });
    this.store.setStatus("loading", t("status.loading"));
    try {
      const runs = (await Promise.all(sources.map((source) => this.selectableRepository!.loadSource(source)))).flat();
      if (sequence !== this.loadSequence) return;
      this.replaceRuns(runs);
    } catch {
      if (sequence === this.loadSequence) this.store.setStatus("error", t("error.collection"));
    }
  }

  updateInventorySearch(kind: keyof InventorySearchState, query: string): void {
    this.store.updateInventorySearch(kind, query);
    this.restoreReadyStatus();
  }

  exportInventory(): SerializedInventory {
    return serializeInventory(this.store.snapshot.inventory);
  }

  reportError(message: string): void {
    this.store.setStatus("error", message);
  }

  private replaceRuns(rawRuns: RawRun[]): void {
    this.store.replaceRuns(rawRuns);
    this.persistInventory();
    this.store.setStatus("ready");
  }

  private persistInventory(): void {
    this.inventoryRepository.save(this.store.snapshot.inventory);
  }

  private restoreReadyStatus(): void {
    if (this.store.snapshot.runs.length > 0 && this.store.snapshot.status === "error") {
      this.store.setStatus("ready");
    }
  }
}

function isSelectableRepository(repository: RunsRepository): repository is SelectableRunsRepository {
  const candidate = repository as Partial<SelectableRunsRepository>;
  return typeof candidate.list === "function" && typeof candidate.loadSource === "function";
}
