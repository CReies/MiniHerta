export interface RawRun {
  id?: string;
  author_name?: string;
  boss_name?: string;
  season?: string;
  mode?: string;
  created_at?: string;
  data?: Record<string, unknown>;

  [key: string]: unknown;
}

export interface TeamMember {
  readonly slot: number;
  readonly char: string;
  readonly eidolon: number;
  readonly lc: string;
  readonly superimp: number;
}

export interface Run {
  readonly id: string;
  readonly author: string;
  readonly boss: string;
  readonly endgame: string;
  readonly version: string;
  readonly videoUrl: string;
  readonly videoDate: string;
  readonly subcategory: string;
  readonly metricValue: number;
  readonly limitedCost: number;
  readonly standardCost: number;
  readonly team: readonly TeamMember[];
}
