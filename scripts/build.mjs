import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { stripTypeScriptTypes } from "node:module";

const root = fileURLToPath(new URL("../", import.meta.url));
const srcRoot = join(root, "src");
const outRoot = join(root, "dist");
const scrappedRoot = join(root, "scrapped");

const sources = await collectSources(srcRoot);
const runSources = await collectRunSources(scrappedRoot);

await rm(outRoot, { recursive: true, force: true });
await writeFile(join(scrappedRoot, "index.json"), `${JSON.stringify({ files: runSources }, null, 2)}\n`, "utf8");
console.log(`scrapped/index.json (${runSources.length} fuentes)`);

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
      return [relative(scrappedRoot, absolutePath).replaceAll("\\", "/")];
    })
  );
  return nested.flat().sort();
}
