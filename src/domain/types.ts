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

export interface RawRunCollection {
  items: RawRun[];
  count?: number;
}

export interface TeamMember {
  slot: number;
  char: string;
  eidolon: number;
  lc: string;
  superimp: number;
}

export interface Run {
  id: string;
  author: string;
  boss: string;
  endgame: string;
  version: string;
  videoUrl: string;
  videoDate: string;
  subcategory: string;
  metricValue: number;
  limitedCost: number;
  standardCost: number;
  team: TeamMember[];
}

export interface Inventory {
  characters: Map<string, number>;
  lightCones: Map<string, number>;
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
  endgame: string;
  version: string;
  resultMode: ResultMode;
  lcMode: LcMode;
  resultSearch: string;
  sortMode: SortMode;
}
