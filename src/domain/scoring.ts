import { itemRarity, type ItemCatalog } from "./catalog.js";
import type { EvaluatedRun, FilterState, Inventory, MissingItem, Run, TeamMember } from "./types.js";
import { normalizeText } from "../utils/text.js";

export const nearScoreLimit = 220;

const scoreTable = {
  character: {
    4: { new: 20, upgrade: 30 },
    5: { new: 100, upgrade: 135 },
  },
  lightCone: {
    4: { new: 10, upgrade: 16 },
    5: { new: 70, upgrade: 90 },
  },
} as const;

export function evaluateRun(
  run: Run,
  inventory: Inventory,
  lcMode: FilterState["lcMode"],
  catalog: ItemCatalog
): EvaluatedRun {
  const missing = run.team.flatMap((member) => evaluateMember(member, inventory, lcMode, catalog));
  return {
    ...run,
    missing,
    missingScore: missing.reduce((total, item) => total + item.score, 0),
  };
}

export function matchesFilters(run: EvaluatedRun, filters: FilterState): boolean {
  if (filters.boss && filters.boss !== "Todos" && run.boss !== filters.boss) return false;

  const query = normalizeText(filters.resultSearch);
  if (!query) return true;

  const haystack = normalizeText(
    [run.author, run.boss, ...run.team.flatMap((member) => [member.char, member.lc])].join(" ")
  );
  return haystack.includes(query);
}

export function applyResultMode(runs: EvaluatedRun[], mode: FilterState["resultMode"]): EvaluatedRun[] {
  if (mode === "complete") return runs.filter((run) => run.missingScore === 0);
  if (mode === "near") return runs.filter((run) => run.missingScore <= nearScoreLimit);
  return runs;
}

export function compareRuns(a: EvaluatedRun, b: EvaluatedRun, mode: FilterState["sortMode"]): number {
  if (mode === "cost") return a.limitedCost - b.limitedCost || a.missingScore - b.missingScore;
  if (mode === "date") return new Date(b.videoDate).getTime() - new Date(a.videoDate).getTime();
  return a.missingScore - b.missingScore || a.missing.length - b.missing.length || a.limitedCost - b.limitedCost;
}

function evaluateMember(
  member: TeamMember,
  inventory: Inventory,
  lcMode: FilterState["lcMode"],
  catalog: ItemCatalog
): MissingItem[] {
  const missing: MissingItem[] = [];
  const ownedEidolon = inventory.characters.get(member.char);
  const characterRarity = itemRarity(catalog, "character", member.char);

  if (ownedEidolon === undefined) {
    missing.push(buildMissingItem("character", member.char, characterRarity, member.eidolon, null));
  } else if (ownedEidolon < member.eidolon) {
    missing.push(buildMissingItem("character", member.char, characterRarity, member.eidolon, ownedEidolon));
  }

  if (lcMode !== "ignore" && member.lc) {
    const ownedSuperimp = inventory.lightCones.get(member.lc);
    const lightConeRarity = itemRarity(catalog, "lightCone", member.lc);

    if (ownedSuperimp === undefined) {
      missing.push(buildMissingItem("lightCone", member.lc, lightConeRarity, member.superimp, null));
    } else if (lcMode === "strict" && ownedSuperimp < member.superimp) {
      missing.push(buildMissingItem("lightCone", member.lc, lightConeRarity, member.superimp, ownedSuperimp));
    }
  }

  return missing;
}

function buildMissingItem(
  kind: MissingItem["kind"],
  name: string,
  rarity: MissingItem["rarity"],
  required: number,
  owned: number | null
): MissingItem {
  const isUpgrade = owned !== null;
  const unitsNeeded = owned === null ? 1 : Math.max(required - owned, 1);
  const unitScore = scoreTable[kind][rarity][isUpgrade ? "upgrade" : "new"];
  const score = unitScore * unitsNeeded;
  const prefix = kind === "character" ? "E" : "S";
  const label = owned === null ? name : `${name} ${prefix}${required}`;

  return { kind, name, required, owned, rarity, isUpgrade, score, label };
}
