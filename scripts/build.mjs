import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { stripTypeScriptTypes } from "node:module";

const root = fileURLToPath(new URL("../", import.meta.url));
const srcRoot = join(root, "src");
const outRoot = join(root, "dist");

const sources = await collectSources(srcRoot);

await rm(outRoot, { recursive: true, force: true });

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
