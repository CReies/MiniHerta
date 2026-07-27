import type { ItemKind, Rarity } from "../item.types.js";
import type { Run } from "../runs/run.types.js";

export type LcMode = "strict" | "name" | "ignore";
export type ResultMode = "complete" | "near" | "all";
export type SortMode = "missing" | "cost" | "date";

export interface MissingItem {
  readonly kind: ItemKind;
  readonly name: string;
  readonly required: number;
  readonly owned: number | null;
  readonly rarity: Rarity;
  readonly isUpgrade: boolean;
  readonly score: number;
  readonly label: string;
}

export interface EvaluatedRun extends Run {
  readonly missing: readonly MissingItem[];
  readonly missingScore: number;
}

export interface FilterState {
  readonly endgame: string;
  readonly version: string;
  readonly boss: string;
  readonly resultMode: ResultMode;
  readonly lcMode: LcMode;
  readonly resultSearch: string;
  readonly sortMode: SortMode;
}
