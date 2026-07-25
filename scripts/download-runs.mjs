import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
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

const options = parseArguments(process.argv.slice(2));
let matchedBossRuns = 0;
if (options.help) {
  printHelp();
  process.exit(0);
}

const selectedCollections = selectCollections(options);
for (const collection of selectedCollections) {
  const versions = options.version ? [options.version] : collection.versions;
  for (const version of versions) {
    await downloadCollection(collection, version);
  }
}

if (options.boss && matchedBossRuns === 0) {
  throw new Error(`No se encontraron runs para el boss "${options.boss}" en las colecciones seleccionadas.`);
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
  const output = options.boss ? await mergeBossRuns(destination, data, options.boss) : data;
  if (!output) {
    console.log(`  Sin runs de "${options.boss}"; archivo sin cambios.`);
    return;
  }
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(temporary, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  await rm(destination, { force: true });
  await rename(temporary, destination);
  console.log(`  ${output.items.length} runs -> runs/${collection.directory}/${version}.json`);
}

async function mergeBossRuns(destination, downloaded, boss) {
  const bossKey = normalize(boss);
  const matchingRuns = downloaded.items.filter((run) => normalize(run.boss_name) === bossKey);
  if (matchingRuns.length === 0) return null;

  matchedBossRuns += matchingRuns.length;
  const current = await readExistingCollection(destination);
  const retainedRuns = current.items.filter((run) => normalize(run.boss_name) !== bossKey);
  const items = [...retainedRuns, ...matchingRuns];
  console.log(
    `  Actualizando ${matchingRuns.length} runs de "${boss}" y conservando ${retainedRuns.length} restantes.`
  );
  return { ...downloaded, items, count: items.length };
}

async function readExistingCollection(destination) {
  try {
    const body = await readFile(destination, "utf8");
    const data = JSON.parse(body);
    return Array.isArray(data.items) ? data : { items: [] };
  } catch (error) {
    if (error.code === "ENOENT") return { items: [] };
    throw new Error(`No se pudo leer la colección existente ${destination}`, { cause: error });
  }
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

function parseArguments(args) {
  const options = { version: null, mode: null, boss: null, help: false };
  const names = new Set(["version", "mode", "boss"]);

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    if (!argument.startsWith("--")) throw new Error(`Parámetro inesperado: ${argument}`);

    const [rawName, inlineValue] = argument.slice(2).split(/=(.*)/s, 2);
    if (!names.has(rawName)) throw new Error(`Parámetro desconocido: --${rawName}`);
    const value = inlineValue ?? args[++index];
    if (!value || value.startsWith("--")) throw new Error(`Falta el valor de --${rawName}`);
    options[rawName] = value.trim();
  }

  if (options.version && !/^\d+\.\d+$/.test(options.version)) {
    throw new Error(`Versión inválida: ${options.version}. Usa el formato 4.3.`);
  }
  return options;
}

function selectCollections(options) {
  const selected = options.mode ? [resolveMode(options.mode)] : collections;
  if (!options.version) return selected;

  const compatible = selected.filter((collection) => collection.versions.includes(options.version));
  if (compatible.length === 0) {
    const mode = options.mode ? ` para ${options.mode}` : "";
    throw new Error(`La versión ${options.version} no está soportada${mode}.`);
  }
  return compatible;
}

function resolveMode(value) {
  const key = normalize(value).replaceAll(" ", "");
  const aliases = new Map(
    collections.flatMap((collection) => [
      [normalize(collection.directory), collection],
      [normalize(collection.mode).replaceAll(" ", ""), collection],
    ])
  );
  const collection = aliases.get(key);
  if (!collection) {
    throw new Error(`Modo desconocido: ${value}. Usa AA, PF, AS o MOC.`);
  }
  return collection;
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("en-US");
}

function printHelp() {
  console.log(`Uso: pnpm runs:download -- [opciones]

Opciones:
  --version <versión>  Descarga sólo esa versión (por ejemplo, 4.3).
  --mode <modo>        Descarga sólo AA, PF, AS o MOC. También acepta el nombre completo.
  --boss <nombre>      Actualiza sólo ese boss y conserva los demás runs del archivo.
  -h, --help           Muestra esta ayuda.

Los filtros se pueden combinar. Sin opciones se descargan todas las colecciones soportadas.`);
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
