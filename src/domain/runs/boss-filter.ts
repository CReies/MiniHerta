export const allBosses = "Todos";

export function canonicalBossName(value: string): string {
  return value.trim().replace(/\s+\(Plight\)$/i, "");
}

export function matchesBoss(runBoss: string, selectedBoss: string): boolean {
  return !selectedBoss || selectedBoss === allBosses || canonicalBossName(runBoss) === canonicalBossName(selectedBoss);
}
