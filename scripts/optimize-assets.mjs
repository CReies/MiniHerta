import { access, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const assetGroups = [
  { directory: join(root, "assets", "characters"), width: 340 },
  { directory: join(root, "assets", "lightcones"), width: 120 },
];

let originalBytes = 0;
let optimizedBytes = 0;
let optimizedFiles = 0;

for (const group of assetGroups) {
  for (const name of await readdir(group.directory)) {
    if (!/[.](?:png|jpe?g)$/i.test(name)) continue;
    await optimizeFile(join(group.directory, name), group.width);
  }
}

await optimizeHero();
await updateAssetManifest();

const savedMegabytes = (originalBytes - optimizedBytes) / 1024 / 1024;
console.log(`${optimizedFiles} imágenes optimizadas; ahorro: ${savedMegabytes.toFixed(2)} MiB.`);

async function optimizeFile(input, width) {
  const inputStats = await stat(input);
  const source = await readFile(input);
  const { dir, name } = parse(input);
  const output = join(dir, `${name}.webp`);
  const temporary = join(dir, `${name}.optimized.webp`);

  await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82, effort: 5, smartSubsample: true })
    .toFile(temporary);

  if (input !== output) await rm(input);
  else await rm(output);
  await rename(temporary, output);

  originalBytes += inputStats.size;
  optimizedBytes += (await stat(output)).size;
  optimizedFiles += 1;
}

async function optimizeHero() {
  const input = join(root, "assets", "bosses", "murata-graphia-banner.png");
  if (!(await exists(input))) return;
  const source = await readFile(input);
  const inputStats = await stat(input);
  const outputs = [
    { filename: "murata-graphia-banner.webp", width: 1600 },
    { filename: "murata-graphia-banner-800.webp", width: 800 },
  ];

  for (const output of outputs) {
    const path = join(root, "assets", "bosses", output.filename);
    await sharp(source)
      .resize({ width: output.width, withoutEnlargement: true })
      .webp({ quality: 84, effort: 5, smartSubsample: true })
      .toFile(path);
    optimizedBytes += (await stat(path)).size;
  }

  originalBytes += inputStats.size;
  optimizedFiles += outputs.length;
  await rm(input);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function updateAssetManifest() {
  const manifestPath = join(root, "src", "generated", "assets.ts");
  const manifest = await readFile(manifestPath, "utf8");
  const updated = manifest.replace(/(assets\/(?:characters|lightcones)\/[^"']+)[.](?:png|jpe?g)/g, "$1.webp");
  await writeFile(manifestPath, updated, "utf8");
}
