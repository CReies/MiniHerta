export class BrowserJsonFileGateway {
  async readFromEvent<T>(event: Event): Promise<T | null> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return null;

    try {
      const contents = await readFile(file);
      return JSON.parse(contents) as T;
    } finally {
      input.value = "";
    }
  }

  download(filename: string, data: unknown): void {
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
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer el archivo"));
    reader.readAsText(file);
  });
}
