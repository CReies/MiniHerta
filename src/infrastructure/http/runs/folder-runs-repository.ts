import type { RunSource, SelectableRunsRepository } from "../../../app/runs/runs-repository.js";
import type { RawRun } from "../../../domain/runs/run.types.js";
import { isRunSource, parseRunsManifest } from "./internal/parse-runs-manifest.js";
import { resolveRunSourceUrl } from "./internal/resolve-run-source-url.js";
import { HttpRunsRepository } from "./http-runs-repository.js";

export class FolderRunsRepository implements SelectableRunsRepository {
  private sources: RunSource[] | null = null;
  private resolvedManifestUrl: string;

  constructor(
    private readonly manifestUrl: string,
    private readonly fetcher: typeof fetch = fetch
  ) {
    this.resolvedManifestUrl = manifestUrl;
  }

  async load(): Promise<RawRun[]> {
    const sources = await this.list();
    const source = sources[0];
    if (!source) throw new Error("The runs manifest does not contain any sources");
    return this.loadSource(source);
  }

  async list(): Promise<RunSource[]> {
    if (this.sources) return this.sources;

    const fetcher = this.fetcher;
    const response = await fetcher(this.manifestUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status} al cargar ${this.manifestUrl}`);
    this.resolvedManifestUrl = response.url || this.manifestUrl;

    const manifest: unknown = await response.json();
    this.sources = parseRunsManifest(manifest);
    return this.sources;
  }

  async loadSource(source: RunSource): Promise<RawRun[]> {
    if (!isRunSource(source)) throw new Error(`Fuente de runs inválida: ${JSON.stringify(source)}`);
    const sourceUrl = resolveRunSourceUrl(this.resolvedManifestUrl, source.file);
    return new HttpRunsRepository(sourceUrl, {}, this.fetcher).load();
  }
}
