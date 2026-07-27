import { allBosses, canonicalBossName } from "../../domain/runs/boss-filter.js";
import { canonicalEndgame } from "../../domain/runs/endgame.js";

interface BossFilterRun {
  readonly boss: string;
  readonly endgame: string;
}

export interface BossFilterOption {
  readonly value: string;
  readonly label: string;
}

export function buildBossFilterOptions(runs: readonly BossFilterRun[], selectedEndgame: string): BossFilterOption[] {
  const endgame = canonicalEndgame(selectedEndgame);
  const relevantRuns = endgame === "Todos" ? runs : runs.filter((run) => canonicalEndgame(run.endgame) === endgame);
  const bosses = collectBosses(relevantRuns);

  if (endgame === "Anomaly Arbitration") {
    return buildAnomalyArbitrationOptions(bosses);
  }

  if (endgame !== "Todos") {
    return bosses.map((boss, index) => ({
      value: boss.name,
      label: `Stage ${index + 1} — ${boss.name}`,
    }));
  }

  return bosses.map((boss) => ({ value: boss.name, label: boss.name }));
}

interface CollectedBoss {
  readonly name: string;
  readonly isKing: boolean;
}

function collectBosses(runs: readonly BossFilterRun[]): CollectedBoss[] {
  const bosses = new Map<string, CollectedBoss>();
  for (const run of runs) {
    const name = canonicalBossName(run.boss);
    if (!name) continue;
    const isKing = name !== run.boss.trim();
    const existing = bosses.get(name);
    bosses.set(name, { name, isKing: isKing || existing?.isKing === true });
  }
  return [...bosses.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function buildAnomalyArbitrationOptions(bosses: readonly CollectedBoss[]): BossFilterOption[] {
  const knights = bosses.filter((boss) => !boss.isKing);
  const kings = bosses.filter((boss) => boss.isKing);

  return [
    ...knights.map((boss, index) => ({
      value: boss.name,
      label: `Knight ${index + 1} — ${boss.name}`,
    })),
    ...kings.map((boss) => ({
      value: boss.name,
      label: `King — ${boss.name}`,
    })),
  ];
}

export { allBosses };
