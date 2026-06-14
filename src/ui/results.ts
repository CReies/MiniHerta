import { itemImageUrl, type ItemCatalog } from "../domain/catalog.js";
import { nearScoreLimit } from "../domain/scoring.js";
import type { Elements } from "./dom.js";
import type { EvaluatedRun, Run } from "../domain/types.js";
import { escapeHtml, formatDate } from "../utils/text.js";

type RunStatus = "possible" | "near" | "blocked";

export function renderResults(
  els: Elements,
  evaluated: EvaluatedRun[],
  visible: EvaluatedRun[],
  catalog: ItemCatalog
): void {
  const counts = resultCounts(evaluated);

  els.possibleCount.textContent = String(counts.possible);
  els.nearCount.textContent = String(counts.near);
  els.runCount.textContent = String(evaluated.length);
  els.results.innerHTML = renderVisibleRuns(visible, catalog);
}

function resultCounts(runs: EvaluatedRun[]): { possible: number; near: number } {
  return {
    possible: runs.filter((run) => run.missingScore === 0).length,
    near: runs.filter((run) => run.missingScore > 0 && run.missingScore <= nearScoreLimit).length,
  };
}

function renderVisibleRuns(runs: EvaluatedRun[], catalog: ItemCatalog): string {
  if (!runs.length) {
    return `<div class="empty">No hay equipos para esos filtros. Prueba ignorar light cones o cambiar a "Posibles y cercanos".</div>`;
  }

  return runs
    .slice(0, 160)
    .map((run) => renderRunCard(run, catalog))
    .join("");
}

function renderRunCard(run: EvaluatedRun, catalog: ItemCatalog): string {
  const status = runStatus(run);

  return `
    <article class="run-card ${status === "possible" ? "" : status}">
      <div class="run-header">
        <div>
          <h3>${escapeHtml(teamTitle(run))}</h3>
          <p class="meta">${escapeHtml(run.boss)} · ${escapeHtml(run.author)} · ${formatDate(run.videoDate)} · ${run.limitedCost} limited 5★</p>
        </div>
        <span class="badge ${status === "possible" ? "" : status}">${escapeHtml(statusLabel(status, run))}</span>
      </div>
      <div class="team-grid">
        ${run.team.map((member) => renderMember(member, catalog)).join("")}
      </div>
      ${run.missing.length ? `<div class="missing-list">${run.missing.map(renderMissingChip).join("")}</div>` : ""}
      <div class="run-actions">
        ${run.videoUrl ? `<a href="${escapeHtml(run.videoUrl)}" target="_blank" rel="noreferrer">Ver run</a>` : ""}
        <span class="meta">ID ${escapeHtml(run.id)}</span>
      </div>
    </article>
  `;
}

function runStatus(run: EvaluatedRun): RunStatus {
  if (run.missingScore === 0) return "possible";
  return run.missingScore <= nearScoreLimit ? "near" : "blocked";
}

function statusLabel(status: RunStatus, run: EvaluatedRun): string {
  if (status === "possible") return "Posible";
  if (status === "near") return `Cercano ${run.missingScore}`;
  return `${run.missingScore} pts`;
}

function teamTitle(run: Run): string {
  return run.team.map((member) => member.char).join(" / ");
}

function renderMember(member: Run["team"][number], catalog: ItemCatalog): string {
  return `
    <div class="member">
      <div class="member-media">
        <img src="${escapeHtml(itemImageUrl(catalog, "character", member.char))}" alt="" loading="lazy" onerror="this.hidden=true" />
        ${renderLightConeImage(member, catalog)}
      </div>
      <strong>${escapeHtml(member.char)} E${member.eidolon}</strong>
      <span>${escapeHtml(member.lc || "Sin light cone")} S${member.superimp}</span>
    </div>
  `;
}

function renderLightConeImage(member: Run["team"][number], catalog: ItemCatalog): string {
  if (!member.lc) return "";
  const imageUrl = escapeHtml(itemImageUrl(catalog, "lightCone", member.lc));
  return `<img class="lc-image" src="${imageUrl}" alt="" loading="lazy" onerror="this.hidden=true" />`;
}

function renderMissingChip(item: EvaluatedRun["missing"][number]): string {
  const kind = item.kind === "character" ? "PJ" : "LC";
  const action = item.isUpgrade ? "dupe" : "nuevo";
  return `<span title="${kind} ${item.rarity}★ · ${action} · ${item.score} pts">${escapeHtml(item.label)}</span>`;
}
