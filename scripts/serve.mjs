// @ts-check

import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const root = join(projectRoot, "dist");
const port = Number(process.env.PORT || 8000);
const host = process.env.HOST || "127.0.0.1";

/** @type {Readonly<Record<string, string>>} */
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".tsv": "text/tab-separated-values; charset=utf-8",
  ".webp": "image/webp",
};

export function serve() {
  const server = createServer(async (request, response) => {
    try {
      const filePath = await resolveFilePath(request.url || "/");
      const fileStat = await stat(filePath);

      response.writeHead(200, {
        "Cache-Control": cacheControl(filePath),
        "Content-Length": fileStat.size,
        "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      });
      createReadStream(filePath).pipe(response);
    } catch (error) {
      const status = errorCode(error) === "ENOENT" ? 404 : 500;
      response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(status === 404 ? "Not found" : "Server error");
    }
  });

  server.listen(port, host, () => {
    console.log(`Serving http://${host}:${port}/index.html`);
  });

  server.on("error", (error) => {
    if (errorCode(error) === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Try PORT=8123 pnpm start.`);
    } else {
      console.error(error);
    }
    process.exit(1);
  });

  return server;
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function cacheControl(filePath) {
  const relativePath = relative(root, filePath).replaceAll("\\", "/");
  if (relativePath.startsWith("_astro/")) return "public, max-age=31536000, immutable";
  if (relativePath.startsWith("assets/")) return "public, max-age=86400";
  return "no-cache";
}

/**
 * @param {string} rawUrl
 * @returns {Promise<string>}
 */
async function resolveFilePath(rawUrl) {
  const url = new URL(rawUrl, `http://${host}:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const requested = pathname === "/" ? "/index.html" : pathname;
  const normalized = normalize(requested).replace(/^([/\\])+/, "");
  const filePath = join(root, normalized);

  if (relative(root, filePath).startsWith("..")) {
    throw notFoundError("Forbidden");
  }

  if (!existsSync(filePath)) {
    throw notFoundError("Not found");
  }

  return filePath;
}

/**
 * @param {string} message
 * @returns {NodeJS.ErrnoException}
 */
function notFoundError(message) {
  const error = /** @type {NodeJS.ErrnoException} */ (new Error(message));
  error.code = "ENOENT";
  return error;
}

/**
 * @param {unknown} error
 * @returns {string | undefined}
 */
function errorCode(error) {
  if (!error || typeof error !== "object" || !("code" in error)) return undefined;
  return typeof error.code === "string" ? error.code : undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  serve();
}
