import { canonicalEndgame } from "../runs/endgame.js";
import { canonicalBossName } from "../runs/boss-filter.js";
import type { EvaluatedRun } from "./scoring.types.js";

export const threeTeamSelection = "__three-teams__";

const bundleEndgames = new Set(["Pure Fiction", "Apocalyptic Shadow", "Memory of Chaos", "Anomaly Arbitration"]);

export function supportsThreeTeamSelection(endgame: string): boolean {
  return bundleEndgames.has(canonicalEndgame(endgame));
}

export function isThreeTeamSelection(value: string): boolean {
  return value === threeTeamSelection;
}

export function selectThreeTeamRuns(runs: readonly EvaluatedRun[], endgame: string): EvaluatedRun[] {
  const canonicalMode = canonicalEndgame(endgame);
  const kingBosses = collectKingBosses(runs, canonicalMode);
  const candidates = runs.filter((run) => isBundleCandidate(run, canonicalMode, kingBosses));
  if (canonicalMode === "Anomaly Arbitration") {
    return selectKnightRuns(candidates);
  }

  const greedySelection = selectGreedily(candidates);
  if (greedySelection.length === 3) return greedySelection;

  return findBundle(candidates) ?? greedySelection;
}

function selectKnightRuns(candidates: readonly EvaluatedRun[]): EvaluatedRun[] {
  const knightGroups = new Map<string, EvaluatedRun[]>();
  candidates.forEach((run) => {
    const boss = canonicalBossName(run.boss);
    const group = knightGroups.get(boss) ?? [];
    group.push(run);
    knightGroups.set(boss, group);
  });

  const groups = [...knightGroups.values()].slice(0, 3);
  return groups.length === 3 ? (findKnightBundle(groups, 0, [], new Set()) ?? []) : [];
}

function findKnightBundle(
  groups: readonly (readonly EvaluatedRun[])[],
  groupIndex: number,
  selected: EvaluatedRun[],
  usedCharacters: Set<string>
): EvaluatedRun[] | null {
  if (groupIndex === groups.length) return selected;

  for (const run of groups[groupIndex] ?? []) {
    if (!isCompatible(run, usedCharacters)) continue;

    const nextUsedCharacters = new Set(usedCharacters);
    addCharacters(run, nextUsedCharacters);
    const result = findKnightBundle(groups, groupIndex + 1, [...selected, run], nextUsedCharacters);
    if (result) return result;
  }

  return null;
}

function selectGreedily(candidates: readonly EvaluatedRun[]): EvaluatedRun[] {
  const selected: EvaluatedRun[] = [];
  const usedCharacters = new Set<string>();

  for (const run of candidates) {
    if (!isCompatible(run, usedCharacters)) continue;

    selected.push(run);
    addCharacters(run, usedCharacters);
    if (selected.length === 3) break;
  }

  return selected;
}

function findBundle(candidates: readonly EvaluatedRun[]): EvaluatedRun[] | null {
  if (candidates.length < 3) return null;

  const characterMasks = buildCharacterMasks(candidates);
  const allCandidates = (1n << BigInt(candidates.length)) - 1n;

  for (let firstIndex = 0; firstIndex < candidates.length - 2; firstIndex += 1) {
    const first = candidates[firstIndex];
    if (!first) continue;

    const firstCharacters = new Set(first.team.map((member) => member.char));
    for (let secondIndex = firstIndex + 1; secondIndex < candidates.length - 1; secondIndex += 1) {
      const second = candidates[secondIndex];
      if (!second || !isCompatible(second, firstCharacters)) continue;

      const blocked = characterMask(first, characterMasks) | characterMask(second, characterMasks);
      const suffix = (1n << BigInt(secondIndex + 1)) - 1n;
      const thirdMask = allCandidates & ~blocked & ~suffix;
      const thirdIndex = firstSetBit(thirdMask);
      if (thirdIndex === null) continue;

      return [first, second, candidates[thirdIndex]!];
    }
  }

  return null;
}

function buildCharacterMasks(candidates: readonly EvaluatedRun[]): Map<string, bigint> {
  const characterMasks = new Map<string, bigint>();
  candidates.forEach((run, index) => {
    const runMask = 1n << BigInt(index);
    run.team.forEach((member) => {
      characterMasks.set(member.char, (characterMasks.get(member.char) ?? 0n) | runMask);
    });
  });
  return characterMasks;
}

function characterMask(run: EvaluatedRun, characterMasks: ReadonlyMap<string, bigint>): bigint {
  return run.team.reduce((mask, member) => mask | (characterMasks.get(member.char) ?? 0n), 0n);
}

function firstSetBit(mask: bigint): number | null {
  if (mask === 0n) return null;

  let index = 0;
  let remaining = mask;
  while ((remaining & 1n) === 0n) {
    remaining >>= 1n;
    index += 1;
  }
  return index;
}

function isCompatible(run: EvaluatedRun, usedCharacters: ReadonlySet<string>): boolean {
  return !run.team.some((member) => usedCharacters.has(member.char));
}

function addCharacters(run: EvaluatedRun, usedCharacters: Set<string>): void {
  run.team.forEach((member) => usedCharacters.add(member.char));
}

function isBundleCandidate(run: EvaluatedRun, endgame: string, kingBosses: ReadonlySet<string>): boolean {
  if (!supportsThreeTeamSelection(endgame) || canonicalEndgame(run.endgame) !== canonicalEndgame(endgame)) {
    return false;
  }

  return canonicalEndgame(endgame) !== "Anomaly Arbitration" || !kingBosses.has(canonicalBossName(run.boss));
}

function collectKingBosses(runs: readonly EvaluatedRun[], endgame: string): Set<string> {
  return new Set(
    runs
      .filter((run) => canonicalEndgame(run.endgame) === endgame && isPlightRun(run))
      .map((run) => canonicalBossName(run.boss))
  );
}

function isPlightRun(run: EvaluatedRun): boolean {
  return canonicalBossName(run.boss) !== run.boss.trim();
}
