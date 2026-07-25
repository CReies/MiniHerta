export interface RunListElements {
  readonly possibleCount: HTMLElement;
  readonly nearCount: HTMLElement;
  readonly runCount: HTMLElement;
  readonly resultsAnnouncement: HTMLElement;
  readonly results: HTMLElement;
}

export function queryRunListElements(): RunListElements {
  return {
    possibleCount: requireElement("possibleCount"),
    nearCount: requireElement("nearCount"),
    runCount: requireElement("runCount"),
    resultsAnnouncement: requireElement("resultsAnnouncement"),
    results: requireElement("results"),
  };
}

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Expected #${id} to be an HTMLElement`);
  }
  return element;
}
