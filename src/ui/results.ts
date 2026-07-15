import { itemImageUrl, type ItemCatalog } from "../domain/catalog.js";
import { nearScoreLimit } from "../domain/scoring.js";
import type { EvaluatedRun, Run } from "../domain/types.js";
import { escapeHtml, formatDate } from "../utils/text.js";
import type { Elements } from "./dom.js";

type RunStatus = "possible" | "near" | "blocked";
type IconName =
  | "alert"
  | "calendar"
  | "check"
  | "hash"
  | "package"
  | "play"
  | "search"
  | "shield"
  | "sparkles"
  | "star"
  | "user";

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
    return `
      <div class="empty">
        <span class="empty-icon" aria-hidden="true">${svgIcon("search")}</span>
        <strong>No encontramos equipos</strong>
        <span>Prueba con otro boss, cambia el criterio de light cones o limpia la búsqueda.</span>
      </div>
    `;
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
        <div class="run-heading">
          <h3>${escapeHtml(teamTitle(run))}</h3>
          <div class="run-meta">
            <span>${svgIcon("shield")}${escapeHtml(run.boss)}</span>
            <span>${svgIcon("user")}${escapeHtml(run.author)}</span>
            <span>${svgIcon("calendar")}${formatDate(run.videoDate)}</span>
            <span>${svgIcon("star")}${run.limitedCost} limited 5★</span>
          </div>
        </div>
        <span class="badge ${status === "possible" ? "" : status}">${statusIcon(status)}${escapeHtml(statusLabel(status, run))}</span>
      </div>
      <div class="team-grid">
        ${run.team.map((member) => renderMember(member, catalog)).join("")}
      </div>
      ${renderMissingSection(run, catalog)}
      <div class="run-actions">
        ${run.videoUrl ? `<a class="button button--secondary" href="${escapeHtml(run.videoUrl)}" target="_blank" rel="noreferrer">${svgIcon("play")}Ver run</a>` : "<span></span>"}
        <span class="run-id">${svgIcon("hash")}ID ${escapeHtml(run.id)}</span>
      </div>
    </article>
  `;
}

function runStatus(run: EvaluatedRun): RunStatus {
  if (run.missingScore === 0) return "possible";
  return run.missingScore <= nearScoreLimit ? "near" : "blocked";
}

function statusLabel(status: RunStatus, run: EvaluatedRun): string {
  if (status === "possible") return "Listo para jugar";
  if (status === "near") return `${run.missingScore} pts para completar`;
  return `${run.missingScore} pts faltantes`;
}

function statusIcon(status: RunStatus): string {
  if (status === "possible") return svgIcon("check");
  if (status === "near") return svgIcon("sparkles");
  return svgIcon("alert");
}

function teamTitle(run: Run): string {
  return run.team.map((member) => member.char).join(" · ");
}

function renderMember(member: Run["team"][number], catalog: ItemCatalog): string {
  const characterImage = escapeHtml(itemImageUrl(catalog, "character", member.char));
  const lightConeLabel = member.lc ? `${member.lc} · S${member.superimp}` : "Sin light cone";

  return `
    <div class="member">
      <div class="member-media">
        <img src="${characterImage}" alt="${escapeHtml(member.char)}" loading="lazy" onerror="this.hidden=true" />
        <span class="member-level">E${member.eidolon}</span>
        ${renderLightConeImage(member, catalog)}
      </div>
      <div class="member-copy">
        <strong>${escapeHtml(member.char)}</strong>
        <span>${escapeHtml(lightConeLabel)}</span>
      </div>
    </div>
  `;
}

function renderLightConeImage(member: Run["team"][number], catalog: ItemCatalog): string {
  if (!member.lc) return "";
  const imageUrl = escapeHtml(itemImageUrl(catalog, "lightCone", member.lc));
  return `<img class="lc-image" src="${imageUrl}" alt="${escapeHtml(member.lc)}" loading="lazy" onerror="this.hidden=true" />`;
}

function renderMissingSection(run: EvaluatedRun, catalog: ItemCatalog): string {
  if (!run.missing.length) return "";
  return `
    <div class="missing-section">
      <p class="missing-heading">${svgIcon("package")}Necesitas añadir</p>
      <div class="missing-list">${run.missing.map((item) => renderMissingChip(item, catalog)).join("")}</div>
    </div>
  `;
}

function renderMissingChip(item: EvaluatedRun["missing"][number], catalog: ItemCatalog): string {
  const kind = item.kind === "character" ? "Personaje" : "Light cone";
  const action = item.isUpgrade ? "mejora" : "nuevo";
  const imageUrl = escapeHtml(itemImageUrl(catalog, item.kind, item.name));
  const details = `${kind} ${item.rarity}★ · ${action} · ${item.score} pts`;

  return `
    <span class="missing-chip" title="${escapeHtml(details)}">
      <img src="${imageUrl}" alt="" loading="lazy" onerror="this.hidden=true" />
      <span>
        <strong>${escapeHtml(item.label)}</strong>
        <small>${escapeHtml(details)}</small>
      </span>
    </span>
  `;
}

function svgIcon(name: IconName): string {
  const paths: Record<IconName, string> = {
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3h.01"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M8 3v5m8-5v5M4 10h16"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    hash: '<path d="M9 3 7 21m10-18-2 18M4 9h16M3 15h16"/>',
    package: '<path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4.5 7.5 7.5 4.2 7.5-4.2M12 12v9"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
    shield: '<path d="M12 3 5 6v5c0 4.6 2.9 8.1 7 10 4.1-1.9 7-5.4 7-10V6l-7-3Z"/>',
    sparkles:
      '<path d="m12 3 1.45 4.55L18 9l-4.55 1.45L12 15l-1.45-4.55L6 9l4.55-1.45L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/>',
    star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6"/>',
  };
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}
