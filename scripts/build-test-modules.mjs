import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourceRoot = join(root, "src");
const outputRoot = join(root, ".test-dist");

await rm(outputRoot, { recursive: true, force: true });

for (const source of await collectTypeScriptSources(sourceRoot)) {
  const input = join(sourceRoot, source);
  const output = join(outputRoot, source.replace(/\.ts$/, ".js"));
  const code = await readFile(input, "utf8");
  const transformed = stripTypeScriptTypes(code, { mode: "transform" });

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, transformed, "utf8");
}

async function collectTypeScriptSources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) return collectTypeScriptSources(absolutePath);
      return entry.isFile() && entry.name.endsWith(".ts") ? [relative(sourceRoot, absolutePath)] : [];
    })
  );
  return nested.flat().sort();
}
