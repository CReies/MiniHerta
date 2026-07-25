export type ItemKind = "character" | "lightCone";
export type LcMode = "strict" | "name" | "ignore";
export type ResultMode = "complete" | "near" | "all";
export type SortMode = "missing" | "cost" | "date";
export type Rarity = 4 | 5;

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

export interface Inventory {
  readonly characters: ReadonlyMap<string, number>;
  readonly lightCones: ReadonlyMap<string, number>;
}

export interface SerializedInventory {
  version?: number;
  exportedAt?: string;
  characters?: Record<string, number>;
  personajes?: Record<string, number>;
  lightCones?: Record<string, number>;
  light_cones?: Record<string, number>;
  conos?: Record<string, number>;
}

export interface MissingItem {
  kind: ItemKind;
  name: string;
  required: number;
  owned: number | null;
  rarity: Rarity;
  isUpgrade: boolean;
  score: number;
  label: string;
}

export interface EvaluatedRun extends Run {
  missing: MissingItem[];
  missingScore: number;
}

export interface FilterState {
  readonly endgame: string;
  readonly version: string;
  readonly resultMode: ResultMode;
  readonly lcMode: LcMode;
  readonly resultSearch: string;
  readonly sortMode: SortMode;
}
