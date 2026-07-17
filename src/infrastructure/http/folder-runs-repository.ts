import type { RunSource, SelectableRunsRepository } from "../../app/ports.js";
import type { RawRun } from "../../domain/types.js";
import { HttpRunsRepository } from "./runs-repository.js";

interface RunsManifest {
  sources: RunSource[];
  files?: string[];
}

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
    return this.loadSource(sources[0]);
  }

  async list(): Promise<RunSource[]> {
    if (this.sources) return this.sources;

    const fetcher = this.fetcher;
    const response = await fetcher(this.manifestUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status} al cargar ${this.manifestUrl}`);
    this.resolvedManifestUrl = response.url || this.manifestUrl;

    const manifest = (await response.json()) as Partial<RunsManifest>;
    const sources = Array.isArray(manifest.sources)
      ? manifest.sources
      : (manifest.files ?? []).map(sourceFromLegacyPath);
    if (sources.length === 0) {
      throw new Error("El índice de scrapped/ no contiene fuentes de runs");
    }

    for (const source of sources) {
      if (!isRunSource(source)) throw new Error(`Fuente de runs inválida: ${JSON.stringify(source)}`);
    }

    this.sources = sources;
    return sources;
  }

  async loadSource(source: RunSource): Promise<RawRun[]> {
    if (!isRunSource(source)) throw new Error(`Fuente de runs inválida: ${JSON.stringify(source)}`);
    return new HttpRunsRepository(resolveFromManifest(this.resolvedManifestUrl, source.file), {}, this.fetcher).load();
  }
}

function isRunSource(value: Partial<RunSource> | undefined): value is RunSource {
  return Boolean(
    value &&
      isRelativeJsonPath(value.file) &&
      typeof value.endgame === "string" &&
      value.endgame.length > 0 &&
      typeof value.version === "string" &&
      value.version.length > 0 &&
      typeof value.updatedAt === "string"
  );
}

function sourceFromLegacyPath(file: string): RunSource {
  const parts = file.split("/");
  return {
    file,
    endgame: parts.at(-2) || "Unknown",
    version: (parts.at(-1) || "").replace(/\.json$/i, ""),
    updatedAt: "",
  };
}

function isRelativeJsonPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.endsWith(".json") &&
    !value.startsWith("/") &&
    !value.includes("..") &&
    !/^[a-z]+:/i.test(value)
  );
}

function resolveFromManifest(manifestUrl: string, file: string): string {
  const separator = manifestUrl.lastIndexOf("/");
  return `${manifestUrl.slice(0, separator + 1)}${file}`;
}
