import type { RunSource } from "../../../../app/runs/runs-repository.js";

export function parseRunsManifest(value: unknown): RunSource[] {
  if (!isRecord(value)) {
    throw new TypeError("Invalid runs manifest: expected an object");
  }

  const sources = parseSources(value);
  if (sources.length === 0) {
    throw new TypeError("Invalid runs manifest: no run sources were provided");
  }
  return sources;
}

export function isRunSource(value: unknown): value is RunSource {
  return (
    isRecord(value) &&
    isRelativeJsonPath(value.file) &&
    typeof value.endgame === "string" &&
    value.endgame.length > 0 &&
    typeof value.version === "string" &&
    value.version.length > 0 &&
    typeof value.updatedAt === "string"
  );
}

function parseSources(manifest: Record<string, unknown>): RunSource[] {
  if (manifest.sources !== undefined) {
    if (!Array.isArray(manifest.sources)) {
      throw new TypeError("Invalid runs manifest: sources must be an array");
    }
    return manifest.sources.map((source, index) => {
      if (!isRunSource(source)) {
        throw new TypeError(`Invalid runs manifest: source ${index} is invalid`);
      }
      return source;
    });
  }

  if (manifest.files !== undefined) {
    if (!Array.isArray(manifest.files)) {
      throw new TypeError("Invalid runs manifest: files must be an array");
    }
    return manifest.files.map((file, index) => {
      if (!isRelativeJsonPath(file)) {
        throw new TypeError(`Invalid runs manifest: legacy file ${index} is invalid`);
      }
      return sourceFromLegacyPath(file);
    });
  }

  return [];
}

function sourceFromLegacyPath(file: string): RunSource {
  const parts = file.split("/");
  return {
    file,
    endgame: parts.at(-2) || "Unknown",
    version: (parts.at(-1) || "").replace(/\.json$/i, ""),
    updatedAt: "",
  };
}

function isRelativeJsonPath(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !value.endsWith(".json") ||
    value.startsWith("/") ||
    value.includes("\\") ||
    /^[a-z]+:/i.test(value)
  ) {
    return false;
  }

  try {
    const decoded = decodeURIComponent(value);
    return decoded === value && !decoded.split("/").some((segment) => segment === "." || segment === "..");
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
