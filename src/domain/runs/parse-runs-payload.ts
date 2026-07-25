import type { RawRun } from "./run.types.js";

export function parseRawRunsPayload(payload: unknown): RawRun[] {
  const items = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.items)
      ? payload.items
      : null;

  if (!items) {
    throw new TypeError("Invalid runs payload: expected an array or an object with an items array");
  }

  return items.map((item, index) => {
    if (!isRawRun(item)) {
      throw new TypeError(`Invalid runs payload: item ${index} is not a valid run object`);
    }
    return item;
  });
}

function isRawRun(value: unknown): value is RawRun {
  if (!isRecord(value)) return false;
  if (value.data !== undefined && !isRecord(value.data)) return false;

  const data = isRecord(value.data) ? value.data : value;
  const hasTeamMember = [1, 2, 3, 4].some((slot) => isNonEmptyString(data[`p${slot}_char`]));

  return (
    isNonEmptyString(value.id) &&
    isEffectiveNonEmptyString(value, data, "author_name") &&
    isEffectiveNonEmptyString(value, data, "boss_name") &&
    isEffectiveNonEmptyString(value, data, "season") &&
    isEffectiveNonEmptyString(value, data, "mode") &&
    isOptionalString(value.created_at) &&
    isOptionalNullableString(data.video_date) &&
    isOptionalString(data.video_url) &&
    isOptionalString(data.subcategory) &&
    isMetricValue(data.metric_value) &&
    isNonNegativeInteger(data.total_limited_5star_count) &&
    isNonNegativeInteger(data.total_standard_5star_count) &&
    hasTeamMember &&
    [1, 2, 3, 4].every((slot) => isTeamSlot(data, slot))
  );
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function isOptionalNullableString(value: unknown): boolean {
  return value === null || isOptionalString(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isEffectiveNonEmptyString(raw: Record<string, unknown>, data: Record<string, unknown>, key: string): boolean {
  return isNonEmptyString(data[key] ?? raw[key]);
}

function isMetricValue(value: unknown): boolean {
  if (value === null) return true;
  return isFiniteNumberInRange(value, 0, Number.POSITIVE_INFINITY, false);
}

function isTeamSlot(data: Record<string, unknown>, slot: number): boolean {
  const character = data[`p${slot}_char`];
  const lightCone = data[`p${slot}_lc`];
  const hasCharacter = isNonEmptyString(character);

  return (
    (character === undefined || isNonEmptyString(character)) &&
    (lightCone === undefined || typeof lightCone === "string") &&
    (hasCharacter
      ? isFiniteNumberInRange(data[`p${slot}_eidolon`], 0, 6, true)
      : isOptionalNumberInRange(data[`p${slot}_eidolon`], 0, 6, true)) &&
    (hasCharacter
      ? isFiniteNumberInRange(data[`p${slot}_superimp`], 0, 5, true)
      : isOptionalNumberInRange(data[`p${slot}_superimp`], 0, 5, true))
  );
}

function isNonNegativeInteger(value: unknown): boolean {
  return isFiniteNumberInRange(value, 0, Number.POSITIVE_INFINITY, true);
}

function isOptionalNumberInRange(value: unknown, min: number, max: number, integer: boolean): boolean {
  return value === undefined || isFiniteNumberInRange(value, min, max, integer);
}

function isFiniteNumberInRange(value: unknown, min: number, max: number, integer: boolean): boolean {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max && (!integer || Number.isInteger(parsed));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
