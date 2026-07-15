import type { RunsRepository } from "../../app/ports.js";
import type { RawRun } from "../../domain/types.js";
import { HttpRunsRepository } from "./runs-repository.js";

interface RunsManifest {
  files: string[];
}

export class FolderRunsRepository implements RunsRepository {
  constructor(
    private readonly manifestUrl: string,
    private readonly fetcher: typeof fetch = fetch
  ) {}

  async load(): Promise<RawRun[]> {
    const fetcher = this.fetcher;
    const response = await fetcher(this.manifestUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status} al cargar ${this.manifestUrl}`);

    const manifest = (await response.json()) as Partial<RunsManifest>;
    if (!manifest || !Array.isArray(manifest.files) || manifest.files.length === 0) {
      throw new Error("El índice de scrapped/ no contiene fuentes de runs");
    }

    const manifestBaseUrl = response.url || this.manifestUrl;
    const sources = manifest.files.map((file) => {
      if (!isRelativeJsonPath(file)) throw new Error(`Ruta de runs inválida: ${String(file)}`);
      return new HttpRunsRepository(resolveFromManifest(manifestBaseUrl, file), {}, this.fetcher);
    });
    const collections = await Promise.all(sources.map((source) => source.load()));
    return collections.flat();
  }
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
