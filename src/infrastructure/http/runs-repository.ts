import type { RunsRepository } from "../../app/ports.js";
import type { RawRun, RawRunCollection } from "../../domain/types.js";

export class HttpRunsRepository implements RunsRepository {
  constructor(
    private readonly url: string,
    private readonly request: RequestInit = {}
  ) {}

  async load(): Promise<RawRun[]> {
    const response = await fetch(this.url, { cache: "no-store", ...this.request });
    if (!response.ok) throw new Error(`HTTP ${response.status} al cargar ${this.url}`);

    const payload = (await response.json()) as RawRun[] | RawRunCollection;
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.items)) return payload.items;
    throw new Error("La fuente no devolvió una colección de runs válida");
  }
}
