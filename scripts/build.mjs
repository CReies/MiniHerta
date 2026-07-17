import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { stripTypeScriptTypes } from "node:module";

const root = fileURLToPath(new URL("../", import.meta.url));
const srcRoot = join(root, "src");
const outRoot = join(root, "dist");
const runsRoot = join(root, "runs");

const sources = await collectSources(srcRoot);
const runSources = await collectRunSources(runsRoot);

await rm(outRoot, { recursive: true, force: true });
await writeFile(join(runsRoot, "index.json"), `${JSON.stringify({ sources: runSources }, null, 2)}\n`, "utf8");
console.log(`runs/index.json (${runSources.length} fuentes)`);

for (const source of sources) {
  const input = join(srcRoot, source);
  const output = join(outRoot, source.replace(/\.ts$/, ".js"));
  const code = await readFile(input, "utf8");
  const transformed = stripTypeScriptTypes(code, { mode: "transform" });

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, transformed, "utf8");
  console.log(relative(root, output));
}

async function collectSources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) return collectSources(absolutePath);
      return entry.isFile() && entry.name.endsWith(".ts") ? [relative(srcRoot, absolutePath)] : [];
    })
  );
  return nested.flat().sort();
}

async function collectRunSources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) return collectRunSources(absolutePath);
      if (!entry.isFile() || !entry.name.endsWith(".json") || entry.name === "index.json") return [];
      const payload = JSON.parse(await readFile(absolutePath, "utf8"));
      const firstRun = (Array.isArray(payload) ? payload : payload.items)?.[0] ?? {};
      const data = firstRun.data ?? {};
      const fileStat = await stat(absolutePath);
      return [
        {
          file: relative(runsRoot, absolutePath).replaceAll("\\", "/"),
          endgame: String(data.mode ?? firstRun.mode ?? relative(runsRoot, dirname(absolutePath))),
          version: String(data.season ?? firstRun.season ?? basename(entry.name, ".json")),
          updatedAt: fileStat.mtime.toISOString(),
        },
      ];
    })
  );
  return nested
    .flat()
    .sort(
      (a, b) =>
        b.updatedAt.localeCompare(a.updatedAt) ||
        b.version.localeCompare(a.version, undefined, { numeric: true }) ||
        a.file.localeCompare(b.file)
    );
}
