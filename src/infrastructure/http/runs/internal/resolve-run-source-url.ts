export function resolveRunSourceUrl(manifestUrl: string, file: string): string {
  const manifest = new URL(manifestUrl, documentBaseUrl());
  const base = new URL(".", manifest);
  const target = new URL(file, base);

  if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname)) {
    throw new TypeError("Invalid runs manifest: source path leaves the manifest directory");
  }

  return target.href;
}

function documentBaseUrl(): string {
  return typeof document === "undefined" ? "http://localhost/" : document.baseURI;
}
