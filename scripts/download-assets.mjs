import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const force = process.argv.includes("--force");
const concurrency = Number(process.env.HERTA_ASSET_CONCURRENCY || 6);
const sourceFile = join(root, "scrapped.json");

const rawRuns = JSON.parse(await readFile(sourceFile, "utf8"));
const assets = [
  ...collectItems("character", "characters", "px_char", "p{slot}_char"),
  ...collectItems("lightCone", "lightcones", "px_lc", "p{slot}_lc"),
];
const manifest = {
  character: {},
  lightCone: {},
};

let downloaded = 0;
let skipped = 0;
const failed = [];

await Promise.all(
  Array.from({ length: concurrency }, async (_, workerIndex) => {
    for (let index = workerIndex; index < assets.length; index += concurrency) {
      await downloadAsset(assets[index]);
    }
  })
);

console.log(`Assets: ${downloaded} descargados, ${skipped} existentes, ${failed.length} fallidos.`);
if (failed.length) {
  for (const item of failed) console.log(`- ${item.kind}: ${item.name} (${item.status})`);
  process.exitCode = 1;
}

function collectItems(kind, folder, remoteFolder, keyTemplate) {
  const names = new Set();

  for (const run of rawRuns) {
    const data = run?.data || {};
    for (const slot of [1, 2, 3, 4]) {
      const name = data[keyTemplate.replace("{slot}", slot)];
      if (typeof name === "string" && name.trim()) names.add(name.trim());
    }
  }

  return [...names].sort().map((name) => ({
    kind,
    folder,
    name,
    url: `https://theherta.com/${remoteFolder}/${encodeURIComponent(name)}.png`,
    baseOutput: join(root, "assets", folder, assetBaseName(name)),
  }));
}

async function downloadAsset(asset) {
  await mkdir(join(root, "assets", asset.folder), { recursive: true });

  const existing = await findExistingAsset(asset);
  if (!force && existing) {
    manifest[asset.kind][asset.name] = existing.url;
    skipped++;
    return;
  }

  const response = await fetch(asset.url, {
    headers: {
      accept: "image/png,image/*;q=0.8,*/*;q=0.5",
      referer: "https://theherta.com/",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    failed.push({ ...asset, status: response.status });
    return;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const extension = detectImageExtension(buffer, response.headers.get("content-type"));
  const output = `${asset.baseOutput}.${extension}`;
  await writeFile(output, buffer);
  await removeAlternateFormats(asset, extension);
  manifest[asset.kind][asset.name] = `assets/${asset.folder}/${assetBaseName(asset.name)}.${extension}`;
  downloaded++;
}

await writeAssetManifest();

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function findExistingAsset(asset) {
  for (const extension of ["png", "webp", "avif"]) {
    const output = `${asset.baseOutput}.${extension}`;
    if (await exists(output))
      return { output, url: `assets/${asset.folder}/${assetBaseName(asset.name)}.${extension}` };
  }
  return null;
}

function detectImageExtension(buffer, contentType) {
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "png";
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buffer.toString("ascii", 4, 12).includes("ftypavif")) return "avif";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("avif")) return "avif";
  return "png";
}

async function removeAlternateFormats(asset, activeExtension) {
  for (const extension of ["png", "webp", "avif"]) {
    if (extension === activeExtension) continue;
    const output = `${asset.baseOutput}.${extension}`;
    try {
      await unlink(output);
    } catch {
      // It is fine when an alternate format was never downloaded.
    }
  }
}

async function writeAssetManifest() {
  const output = join(root, "src", "generated", "assets.ts");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(
    output,
    [
      `export const characterAssets: Record<string, string> = ${JSON.stringify(manifest.character, null, 2)};`,
      "",
      `export const lightConeAssets: Record<string, string> = ${JSON.stringify(manifest.lightCone, null, 2)};`,
      "",
    ].join("\n"),
    "utf8"
  );
}

function assetBaseName(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
