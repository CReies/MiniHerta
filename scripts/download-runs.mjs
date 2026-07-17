import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, URL, URLSearchParams } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const runsRoot = join(root, "runs");
const endpoint = "https://theherta.com/api/archive/submissions";

const collections = [
  { directory: "AA", mode: "Anomaly Arbitration", versions: versionsBetween("3.6", "4.4") },
  { directory: "PF", mode: "Pure Fiction", versions: versionsBetween("3.3", "4.3") },
  { directory: "AS", mode: "Apocalyptic Shadow", versions: versionsBetween("3.2", "4.3") },
  { directory: "MOC", mode: "Memory of Chaos", versions: versionsBetween("3.0", "4.3") },
];

for (const collection of collections) {
  for (const version of collection.versions) {
    await downloadCollection(collection, version);
  }
}

console.log("Descarga terminada.");

async function downloadCollection(collection, version) {
  const url = new URL(endpoint);
  url.search = new URLSearchParams({ season: version, mode: collection.mode }).toString();
  const destination = join(runsRoot, collection.directory, `${version}.json`);
  const temporary = `${destination}.tmp`;

  console.log(`Descargando ${collection.directory} ${version}...`);
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "accept-language": "es-419,es;q=0.9",
      referer: "https://theherta.com/",
      "user-agent": "TheHerta-runs-downloader/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`${collection.directory} ${version}: HTTP ${response.status} ${response.statusText}`);
  }

  const body = await response.text();
  const data = parseAndValidate(body, collection, version);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rm(destination, { force: true });
  await rename(temporary, destination);
  console.log(`  ${data.items.length} runs -> runs/${collection.directory}/${version}.json`);
}

function parseAndValidate(body, collection, version) {
  let data;
  try {
    data = JSON.parse(body);
  } catch (error) {
    throw new Error(`${collection.directory} ${version}: la respuesta no es JSON válido`, { cause: error });
  }

  if (!data || !Array.isArray(data.items) || typeof data.count !== "number") {
    throw new Error(`${collection.directory} ${version}: formato de respuesta inesperado`);
  }
  return data;
}

function versionsBetween(start, end) {
  const versions = [];
  for (let major = Number(start[0]); major <= Number(end[0]); major += 1) {
    const firstMinor = major === Number(start[0]) ? Number(start[2]) : 0;
    const lastMinor = major === Number(end[0]) ? Number(end[2]) : 8;
    for (let minor = firstMinor; minor <= lastMinor; minor += 1) {
      versions.push(`${major}.${minor}`);
    }
  }
  return versions;
}
