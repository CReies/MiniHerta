import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number(process.env.PORT || 8000);
const host = process.env.HOST || "127.0.0.1";

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
        "Content-Length": fileStat.size,
        "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      });
      createReadStream(filePath).pipe(response);
    } catch (error) {
      const status = error?.code === "ENOENT" ? 404 : 500;
      response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(status === 404 ? "Not found" : "Server error");
    }
  });

  server.listen(port, host, () => {
    console.log(`Serving http://${host}:${port}/index.html`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Try PORT=8123 pnpm start.`);
    } else {
      console.error(error);
    }
    process.exit(1);
  });

  return server;
}

async function resolveFilePath(rawUrl) {
  const url = new URL(rawUrl, `http://${host}:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const requested = pathname === "/" ? "/index.html" : pathname;
  const normalized = normalize(requested).replace(/^([/\\])+/, "");
  const filePath = join(root, normalized);

  if (relative(root, filePath).startsWith("..")) {
    const error = new Error("Forbidden");
    error.code = "ENOENT";
    throw error;
  }

  if (!existsSync(filePath)) {
    const error = new Error("Not found");
    error.code = "ENOENT";
    throw error;
  }

  return filePath;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  serve();
}
