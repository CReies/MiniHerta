import type { RunSource, SelectableRunsRepository } from "../../app/ports.js";
import type { RawRun } from "../../domain/types.js";
import { HttpRunsRepository } from "./runs-repository.js";

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
    const sources = parseRunsManifest(manifest);

    this.sources = sources;
    return sources;
  }

  async loadSource(source: RunSource): Promise<RawRun[]> {
    if (!isRunSource(source)) throw new Error(`Fuente de runs inválida: ${JSON.stringify(source)}`);
    return new HttpRunsRepository(resolveFromManifest(this.resolvedManifestUrl, source.file), {}, this.fetcher).load();
  }
}

function parseRunsManifest(value: unknown): RunSource[] {
  if (!isRecord(value)) {
    throw new TypeError("Invalid runs manifest: expected an object");
  }

  let sources: RunSource[];
  if (value.sources !== undefined) {
    if (!Array.isArray(value.sources)) {
      throw new TypeError("Invalid runs manifest: sources must be an array");
    }
    sources = value.sources.map((source, index) => {
      if (!isRunSource(source)) {
        throw new TypeError(`Invalid runs manifest: source ${index} is invalid`);
      }
      return source;
    });
  } else if (value.files !== undefined) {
    if (!Array.isArray(value.files)) {
      throw new TypeError("Invalid runs manifest: files must be an array");
    }
    sources = value.files.map((file, index) => {
      if (!isRelativeJsonPath(file)) {
        throw new TypeError(`Invalid runs manifest: legacy file ${index} is invalid`);
      }
      return sourceFromLegacyPath(file);
    });
  } else {
    sources = [];
  }

  if (sources.length === 0) {
    throw new TypeError("Invalid runs manifest: no run sources were provided");
  }
  return sources;
}

function isRunSource(value: unknown): value is RunSource {
  return (
    isRecord(value) &&
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
  if (
    typeof value !== "string" ||
    !value.endsWith(".json") ||
    value.startsWith("/") ||
    value.includes("\\") ||
    /^[a-z]+:/i.test(value)
  ) {
    return false;
  }

  try {
    const decoded = decodeURIComponent(value);
    return decoded === value && !decoded.split("/").some((segment) => segment === "." || segment === "..");
  } catch {
    return false;
  }
}

function resolveFromManifest(manifestUrl: string, file: string): string {
  const manifest = new URL(manifestUrl, documentBaseUrl());
  const base = new URL(".", manifest);
  const target = new URL(file, base);

  if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname)) {
    throw new TypeError("Invalid runs manifest: source path leaves the manifest directory");
  }

  return target.href;
}

function documentBaseUrl(): string {
  return typeof document === "undefined" ? "http://localhost/" : document.baseURI;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
