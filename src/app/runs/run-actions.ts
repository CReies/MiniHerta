import { parseRawRunsPayload } from "../../domain/runs/parse-runs-payload.js";
import { allBosses } from "../../domain/runs/boss-filter.js";
import type { AppStore } from "../application-state/app-store.js";
import { loadInitialRunRepository, loadSelectedRunSources } from "./internal/load-run-repository.js";
import { selectRunSources } from "./internal/select-run-sources.js";
import type { RunSource, RunsRepository, SelectableRunsRepository } from "./runs-repository.js";

export class RunActions {
  private selectableRepository: SelectableRunsRepository | null = null;
  private runSources: RunSource[] = [];
  private loadSequence = 0;

  constructor(
    private readonly store: AppStore,
    private readonly repositories: readonly RunsRepository[],
    private readonly onRunLoadComplete: () => void,
    private readonly onFilterOnlySelection: () => void
  ) {}

  async initialize(): Promise<void> {
    const sequence = ++this.loadSequence;
    this.store.setStatus({ type: "loading", message: "loadingRuns" });

    for (const repository of this.repositories) {
      if (!this.isCurrent(sequence)) return;

      let loaded: Awaited<ReturnType<typeof loadInitialRunRepository>>;
      try {
        loaded = await loadInitialRunRepository(repository);
      } catch {
        if (!this.isCurrent(sequence)) return;
        // Repositories are ordered fallbacks; the final failure is reported below.
        continue;
      }

      if (!this.isCurrent(sequence)) return;
      this.applyInitialLoad(loaded);
      this.onRunLoadComplete();
      return;
    }

    if (this.isCurrent(sequence)) {
      this.store.setStatus({ type: "error", message: "runsDownloadFailed" });
    }
  }

  replacePayload(payload: unknown): void {
    this.loadSequence += 1;
    const runs = parseRawRunsPayload(payload);
    this.selectableRepository = null;
    this.runSources = [];
    this.store.replaceRunSources([]);
    this.store.replaceRuns(runs);
    this.onRunLoadComplete();
  }

  async selectSource(endgame: string, requestedVersion: string): Promise<void> {
    const repository = this.selectableRepository;
    if (!repository || this.runSources.length === 0) {
      this.store.updateFilters({ endgame, version: requestedVersion, boss: allBosses });
      this.onFilterOnlySelection();
      return;
    }

    const selection = selectRunSources(this.runSources, endgame, requestedVersion);
    if (!selection) return;

    const previousSelection = {
      endgame: this.store.snapshot.filters.endgame,
      version: this.store.snapshot.filters.version,
      boss: this.store.snapshot.filters.boss,
    };
    const sequence = ++this.loadSequence;
    this.store.updateFilters({ endgame, version: selection.version, boss: allBosses });
    this.store.setStatus({ type: "loading", message: "loadingRuns" });

    try {
      const runs = await loadSelectedRunSources(repository, selection.sources);
      if (!this.isCurrent(sequence)) return;
      this.store.replaceRuns(runs);
      this.onRunLoadComplete();
    } catch {
      if (this.isCurrent(sequence)) {
        this.store.updateFilters(previousSelection);
        this.store.setStatus({ type: "error", message: "runCollectionFailed" });
      }
    }
  }

  private applyInitialLoad(loaded: Awaited<ReturnType<typeof loadInitialRunRepository>>): void {
    this.selectableRepository = loaded.repository;
    this.runSources = loaded.sources;
    this.store.replaceRunSources(loaded.sources);
    if (loaded.initialSource) {
      this.store.updateFilters({
        endgame: loaded.initialSource.endgame,
        version: loaded.initialSource.version,
      });
    }
    this.store.replaceRuns(loaded.runs);
  }

  private isCurrent(sequence: number): boolean {
    return sequence === this.loadSequence;
  }
}
