import type { Elements } from "./dom.js";
import type { Run } from "../domain/types.js";
import { escapeHtml } from "../utils/text.js";

export function renderRunFilterOptions(
  els: Elements,
  runs: Run[],
  selectedEndgame = "Todos",
  selectedVersion = ""
): void {
  const endgames = ["Todos", ...uniqueValues(runs, (run) => run.endgame).sort()];
  const versions = uniqueValues(runs, (run) => run.version).sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true })
  );

  els.endgameFilter.innerHTML = endgames
    .map((endgame) => `<option value="${escapeHtml(endgame)}">${escapeHtml(endgame)}</option>`)
    .join("");
  els.endgameFilter.value = endgames.includes(selectedEndgame) ? selectedEndgame : "Todos";

  els.versionFilter.innerHTML = versions
    .map((version) => `<option value="${escapeHtml(version)}">${escapeHtml(version)}</option>`)
    .join("");
  els.versionFilter.value = versions.includes(selectedVersion) ? selectedVersion : (versions[0] ?? "");
}

function uniqueValues(runs: Run[], select: (run: Run) => string): string[] {
  return [...new Set(runs.map(select).filter(Boolean))];
}
