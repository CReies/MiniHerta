// @ts-check

import { cp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectRunSources } from "./run-manifest.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const outRoot = join(root, "dist");
const runsRoot = join(root, "runs");
const assetsRoot = join(root, "assets");

const runSources = await collectRunSources(runsRoot);

await writeFile(join(runsRoot, "index.json"), `${JSON.stringify({ sources: runSources }, null, 2)}\n`, "utf8");
console.log(`runs/index.json (${runSources.length} sources)`);

// Importing Astro after disabling telemetry keeps builds self-contained in restricted environments.
process.env.ASTRO_TELEMETRY_DISABLED = "1";
const { build } = await import("astro");
await build({ root });

// Runs and generated images remain source-controlled outside public/ because maintenance scripts update them in place.
// Copying them after Astro builds produces one closed, deployable directory without duplicating those files in Git.
await Promise.all([
  cp(assetsRoot, join(outRoot, "assets"), { recursive: true }),
  cp(runsRoot, join(outRoot, "runs"), { recursive: true }),
]);
console.log("Copied static assets and run collections");
