import type { RawRun, Run, TeamMember } from "./run.types.js";

export function normalizeRuns(rawRuns: RawRun[]): Run[] {
  return rawRuns.map(normalizeRun).filter((run) => run.subcategory === "0-Cycle" || run.metricValue === 0);
}

function normalizeRun(raw: RawRun): Run {
  const data = raw.data || raw;
  const team: TeamMember[] = [1, 2, 3, 4].flatMap((slot) => {
    const character = stringValue(data[`p${slot}_char`], "");
    if (!character) return [];
    return [
      {
        slot,
        char: character,
        eidolon: numberValue(data[`p${slot}_eidolon`], 0),
        lc: stringValue(data[`p${slot}_lc`], ""),
        superimp: numberValue(data[`p${slot}_superimp`], 1),
      },
    ];
  });

  return {
    id: stringValue(raw.id, "sin-id"),
    author: stringValue(data.author_name, stringValue(raw.author_name, "Unknown")),
    boss: stringValue(data.boss_name, stringValue(raw.boss_name, "Unknown")),
    endgame: stringValue(data.mode, stringValue(raw.mode, "Unknown")),
    version: stringValue(data.season, stringValue(raw.season, "Unknown")),
    videoUrl: httpUrlValue(data.video_url),
    videoDate: stringValue(data.video_date, stringValue(raw.created_at, "")),
    subcategory: stringValue(data.subcategory, ""),
    metricValue: numberValue(data.metric_value, Number.POSITIVE_INFINITY),
    limitedCost: numberValue(data.total_limited_5star_count, 0),
    standardCost: numberValue(data.total_standard_5star_count, 0),
    team,
  };
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberValue(value: unknown, fallback: number): number {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function httpUrlValue(value: unknown): string {
  if (typeof value !== "string") return "";
  const candidate = value.trim();
  if (!candidate) return "";

  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? candidate : "";
  } catch {
    return "";
  }
}
