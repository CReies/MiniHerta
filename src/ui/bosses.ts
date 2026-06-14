import type { Elements } from "./dom.js";
import type { Run } from "../domain/types.js";
import { escapeHtml } from "../utils/text.js";

export function renderBossOptions(els: Elements, runs: Run[]): void {
  const current = els.bossFilter.value || "Todos";
  const bosses = ["Todos", ...uniqueBosses(runs)];

  els.bossFilter.innerHTML = bosses
    .map((boss) => `<option value="${escapeHtml(boss)}">${escapeHtml(boss)}</option>`)
    .join("");
  els.bossFilter.value = bosses.includes(current) ? current : "Todos";
}

function uniqueBosses(runs: Run[]): string[] {
  return [...new Set(runs.map((run) => run.boss).filter(Boolean))].sort();
}
