import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));
const forbiddenDependencies = {
  app: new Set(["data", "generated", "infrastructure", "ui"]),
  domain: new Set(["app", "data", "generated", "infrastructure", "ui"]),
  infrastructure: new Set(["data", "generated", "ui"]),
  shared: new Set(["app", "data", "domain", "generated", "infrastructure", "ui"]),
  ui: new Set(["infrastructure"]),
};

test("layer dependencies point toward the application and domain", async () => {
  const graph = await sourceGraph();
  const violations = [];

  for (const [source, dependencies] of graph) {
    const sourceLayer = firstSegment(source);
    const forbiddenTargets = forbiddenDependencies[sourceLayer];
    if (!forbiddenTargets) continue;

    for (const dependency of dependencies) {
      const targetLayer = firstSegment(dependency);
      if (forbiddenTargets.has(targetLayer)) {
        violations.push(`${source} -> ${dependency}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test("source modules do not contain circular dependencies", async () => {
  const graph = await sourceGraph();
  const visiting = new Set();
  const visited = new Set();

  function visit(module, path) {
    if (visiting.has(module)) {
      const cycleStart = path.indexOf(module);
      return [...path.slice(cycleStart), module];
    }
    if (visited.has(module)) return null;

    visiting.add(module);
    for (const dependency of graph.get(module) ?? []) {
      const cycle = visit(dependency, [...path, module]);
      if (cycle) return cycle;
    }
    visiting.delete(module);
    visited.add(module);
    return null;
  }

  const cycle = [...graph.keys()].map((module) => visit(module, [])).find(Boolean);
  assert.equal(cycle?.join(" -> "), undefined);
});

async function sourceGraph() {
  const files = await collectTypeScriptFiles(sourceRoot);
  const graph = new Map();

  await Promise.all(
    files.map(async (file) => {
      const source = relative(sourceRoot, file).replaceAll("\\", "/");
      const code = await readFile(file, "utf8");
      graph.set(source, resolveImports(file, code));
    })
  );

  return graph;
}

async function collectTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return collectTypeScriptFiles(path);
      return entry.isFile() && extname(entry.name) === ".ts" ? [path] : [];
    })
  );
  return nested.flat();
}

function resolveImports(sourceFile, code) {
  const dependencies = [];
  const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;

  for (const match of code.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier?.startsWith(".")) continue;
    const target = resolve(dirname(sourceFile), specifier.replace(/\.js$/, ".ts"));
    dependencies.push(relative(sourceRoot, target).replaceAll("\\", "/"));
  }

  return dependencies;
}

function firstSegment(path) {
  return path.split("/")[0];
}
