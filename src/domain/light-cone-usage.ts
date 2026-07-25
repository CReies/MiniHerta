import type { Run } from "./types.js";

export interface LightConeUsage {
  name: string;
  uses: number;
}

export function mostUsedLightConesByCharacter(runs: readonly Run[], limit = 3): Map<string, LightConeUsage[]> {
  const usage = new Map<string, Map<string, number>>();

  for (const run of runs) {
    for (const member of run.team) {
      if (!member.char || !member.lc) continue;
      const characterUsage = usage.get(member.char) ?? new Map<string, number>();
      characterUsage.set(member.lc, (characterUsage.get(member.lc) ?? 0) + 1);
      usage.set(member.char, characterUsage);
    }
  }

  return new Map(
    [...usage].map(([character, lightCones]) => [
      character,
      [...lightCones]
        .map(([name, uses]) => ({ name, uses }))
        .sort((left, right) => right.uses - left.uses || left.name.localeCompare(right.name, "en"))
        .slice(0, limit),
    ])
  );
}
