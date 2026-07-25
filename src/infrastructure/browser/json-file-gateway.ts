export class BrowserJsonFileGateway {
  async readFromEvent(event: Event): Promise<unknown | null> {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      throw new TypeError("JSON file input event must come from an HTML input element");
    }
    const file = input.files?.[0];
    if (!file) return null;

    try {
      const contents = await readFile(file);
      const payload: unknown = JSON.parse(contents);
      return payload;
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
