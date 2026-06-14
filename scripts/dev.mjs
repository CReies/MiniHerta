import { spawn } from "node:child_process";
import { existsSync, watch } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "./serve.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const watchTargets = ["src", "index.html", "styles.css"].map((target) => join(root, target));
let buildRunning = false;
let buildQueued = false;
let debounceTimer;

await runBuild();
serve();

for (const target of watchTargets) {
  if (!existsSync(target)) continue;
  watch(target, { recursive: true }, () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(queueBuild, 80);
  });
}

console.log("Watching src/, index.html and styles.css");

function queueBuild() {
  if (buildRunning) {
    buildQueued = true;
    return;
  }

  runBuild().then(() => {
    if (buildQueued) {
      buildQueued = false;
      queueBuild();
    }
  });
}

function runBuild() {
  buildRunning = true;
  console.log("Building...");

  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["scripts/build.mjs"], {
      cwd: root,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      buildRunning = false;
      if (code === 0) console.log("Build ready");
      else console.log(`Build failed with exit code ${code}`);
      resolve();
    });
  });
}
