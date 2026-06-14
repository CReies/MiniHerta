export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as T;
}

export function readJsonFile<T>(event: Event, onRead: (data: T) => void, onError: () => void): void {
  const input = event.target as HTMLInputElement;
  const [file] = Array.from(input.files || []);
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      onRead(JSON.parse(String(reader.result)) as T);
      input.value = "";
    } catch {
      onError();
    }
  };
  reader.readAsText(file);
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
