import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { stripTypeScriptTypes } from "node:module";

const root = fileURLToPath(new URL("../", import.meta.url));
const srcRoot = join(root, "src");
const outRoot = join(root, "dist");

const sources = [
  "main.ts",
  "app/json-file.ts",
  "app/results.ts",
  "app/state.ts",
  "domain/catalog.ts",
  "domain/inventory.ts",
  "domain/normalize.ts",
  "domain/scoring.ts",
  "domain/types.ts",
  "generated/assets.ts",
  "ui/bosses.ts",
  "ui/dom.ts",
  "ui/inventory.ts",
  "ui/render.ts",
  "ui/results.ts",
  "ui/theme.ts",
  "utils/text.ts",
];

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
