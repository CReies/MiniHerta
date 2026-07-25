import type { RunsRepository } from "../../app/ports.js";
import { parseRawRunsPayload } from "../../domain/normalize.js";
import type { RawRun } from "../../domain/types.js";

export class HttpRunsRepository implements RunsRepository {
  constructor(
    private readonly url: string,
    private readonly request: RequestInit = {},
    private readonly fetcher: typeof fetch = fetch
  ) {}

  async load(): Promise<RawRun[]> {
    const fetcher = this.fetcher;
    const response = await fetcher(this.url, { cache: "no-store", ...this.request });
    if (!response.ok) throw new Error(`HTTP ${response.status} al cargar ${this.url}`);

    const payload: unknown = await response.json();
    return parseRawRunsPayload(payload);
  }
}
