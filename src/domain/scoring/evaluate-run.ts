import { itemRarity } from "../catalog/create-catalog.js";
import type { ItemCatalog } from "../catalog/catalog.types.js";
import type { Inventory } from "../inventory/inventory.types.js";
import type { Run, TeamMember } from "../runs/run.types.js";
import type { EvaluatedRun, FilterState, MissingItem } from "./scoring.types.js";

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
  const initialLevel = kind === "character" ? 0 : 1;
  const score = isUpgrade
    ? scoreTable[kind][rarity].upgrade * Math.max(required - owned, 1)
    : scoreTable[kind][rarity].new + scoreTable[kind][rarity].upgrade * Math.max(required - initialLevel, 0);
  const prefix = kind === "character" ? "E" : "S";
  const label = owned === null && required === initialLevel ? name : `${name} ${prefix}${required}`;

  return { kind, name, required, owned, rarity, isUpgrade, score, label };
}
