import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const [directory, version] = process.argv.slice(2);

if (!directory || !version) {
  throw new Error("Usage: node scripts/version-module-imports.mjs <directory> <version>");
}

const moduleFiles = await collectJavaScriptFiles(directory);
const relativeModuleSpecifier = /((?:from\s+|import\s*)["'])(\.{1,2}\/[^"']+\.js)(["'])/g;

for (const file of moduleFiles) {
  const source = await readFile(file, "utf8");
  const versioned = source.replace(
    relativeModuleSpecifier,
    (_match, prefix, specifier, suffix) => `${prefix}${specifier}?v=${version}${suffix}`
  );

  await writeFile(file, versioned, "utf8");
}

async function collectJavaScriptFiles(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const entryPath = join(path, entry.name);
      if (entry.isDirectory()) return collectJavaScriptFiles(entryPath);
      return entry.isFile() && entry.name.endsWith(".js") ? [entryPath] : [];
    })
  );

  return nested.flat();
}
