import { nearScoreLimit } from "../domain/scoring.js";
import type { EvaluatedRun, Run } from "../domain/types.js";
import type { Elements } from "./dom.js";
import { escapeHtml } from "./escape-html.js";
import { formatDate } from "./format-date.js";
import { t, type Locale } from "./i18n.js";
import { itemImageUrl, itemLabel } from "./item-presentation.js";

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

const iconPaths: Readonly<Record<IconName, string>> = {
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

export function renderResults(
  els: Elements,
  evaluated: EvaluatedRun[],
  visible: EvaluatedRun[],
  limit = 24,
  onShowMore?: () => void,
  locale: Locale = "en"
): void {
  const counts = resultCounts(evaluated);

  els.possibleCount.textContent = String(counts.possible);
  els.nearCount.textContent = String(counts.near);
  els.runCount.textContent = String(evaluated.length);
  const announcement = t("summary.announcement", {
    possible: counts.possible,
    near: counts.near,
    total: evaluated.length,
    visible: visible.length,
  });
  if (els.resultsAnnouncement.textContent !== announcement) {
    els.resultsAnnouncement.textContent = announcement;
  }
  els.results.innerHTML = renderVisibleRuns(visible, limit, locale);
  hideBrokenImages(els.results);
  els.results.querySelector<HTMLButtonElement>("[data-show-more]")?.addEventListener("click", () => onShowMore?.());
}

function resultCounts(runs: EvaluatedRun[]): { possible: number; near: number } {
  let possible = 0;
  let near = 0;

  for (const run of runs) {
    if (run.missingScore === 0) possible += 1;
    else if (run.missingScore <= nearScoreLimit) near += 1;
  }

  return { possible, near };
}

function renderVisibleRuns(runs: EvaluatedRun[], limit: number, locale: Locale): string {
  if (!runs.length) {
    return `
      <div class="empty">
        <span class="empty-icon" aria-hidden="true">${svgIcon("search")}</span>
        <strong>${t("results.emptyTitle")}</strong>
        <span>${t("results.emptyBody")}</span>
      </div>
    `;
  }

  const rendered = runs
    .slice(0, limit)
    .map((run) => renderRunCard(run, locale))
    .join("");
  const remaining = runs.length - limit;
  if (remaining <= 0) return rendered;

  return `${rendered}
    <div class="results-more">
      <p>${t("results.showing", { shown: Math.min(limit, runs.length), total: runs.length })}</p>
      <button class="button button--secondary" type="button" data-show-more>
        ${t("results.showMore", { count: Math.min(24, remaining) })}
      </button>
    </div>`;
}

function renderRunCard(run: EvaluatedRun, locale: Locale): string {
  const status = runStatus(run);

  return `
    <article class="run-card ${status === "possible" ? "" : status}">
      <div class="run-header">
        <div class="run-heading">
          <h3>${escapeHtml(teamTitle(run, locale))}</h3>
          <div class="run-meta">
            <span>${svgIcon("shield")}${escapeHtml(run.boss)}</span>
            <span>${svgIcon("user")}${escapeHtml(run.author)}</span>
            <span>${svgIcon("calendar")}${escapeHtml(formatDate(run.videoDate, locale))}</span>
            <span class="run-cost">${svgIcon("star")}<strong>${run.limitedCost}</strong> ${t("results.cost")}</span>
          </div>
        </div>
        <span class="badge ${status === "possible" ? "" : status}">${statusIcon(status)}${escapeHtml(statusLabel(status, run))}</span>
      </div>
      <div class="team-grid">
        ${run.team.map((member) => renderMember(member, locale)).join("")}
      </div>
      ${renderMissingSection(run, locale)}
      <div class="run-actions">
        ${run.videoUrl ? `<a class="button button--secondary" href="${escapeHtml(run.videoUrl)}" target="_blank" rel="noopener noreferrer">${svgIcon("play")}${t("results.viewRun")}</a>` : "<span></span>"}
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
  if (status === "possible") return t("results.ready");
  if (status === "near") return t("results.nearStatus", { score: run.missingScore });
  return t("results.blockedStatus", { score: run.missingScore });
}

function statusIcon(status: RunStatus): string {
  if (status === "possible") return svgIcon("check");
  if (status === "near") return svgIcon("sparkles");
  return svgIcon("alert");
}

function teamTitle(run: Run, locale: Locale): string {
  return run.team.map((member) => itemLabel("character", member.char, locale)).join(" · ");
}

function renderMember(member: Run["team"][number], locale: Locale): string {
  const characterImage = escapeHtml(itemImageUrl("character", member.char));
  const characterLabel = itemLabel("character", member.char, locale);
  const lightConeName = member.lc ? itemLabel("lightCone", member.lc, locale) : "";
  const lightConeLabel = member.lc ? `${lightConeName} · S${member.superimp}` : t("results.noCone");

  return `
    <div class="member">
      <div class="member-media">
        <img src="${characterImage}" alt="${escapeHtml(characterLabel)}" loading="lazy" decoding="async" />
        <span class="member-level">E${member.eidolon}</span>
        ${renderLightConeImage(member, locale)}
      </div>
      <div class="member-copy">
        <strong>${escapeHtml(characterLabel)}</strong>
        <span>${escapeHtml(lightConeLabel)}</span>
      </div>
    </div>
  `;
}

function renderLightConeImage(member: Run["team"][number], locale: Locale): string {
  if (!member.lc) return "";
  const imageUrl = escapeHtml(itemImageUrl("lightCone", member.lc));
  return `<img class="lc-image" src="${imageUrl}" alt="${escapeHtml(itemLabel("lightCone", member.lc, locale))}" loading="lazy" decoding="async" />`;
}

function renderMissingSection(run: EvaluatedRun, locale: Locale): string {
  if (!run.missing.length) return "";
  return `
    <div class="missing-section">
      <p class="missing-heading">${svgIcon("package")}${t("results.needAdd")}</p>
      <div class="missing-list">${run.missing.map((item) => renderMissingChip(item, locale)).join("")}</div>
    </div>
  `;
}

function renderMissingChip(item: EvaluatedRun["missing"][number], locale: Locale): string {
  const kind = item.kind === "character" ? t("results.character") : t("filters.lightCones");
  const action = t(item.isUpgrade ? "results.upgrade" : "results.new");
  const imageUrl = escapeHtml(itemImageUrl(item.kind, item.name));
  const displayLabel = itemLabel(item.kind, item.name, locale);
  const details = `${kind} ${item.rarity}★ · ${action} · ${item.score} pts`;

  return `
    <span class="missing-chip" title="${escapeHtml(details)}">
      <img src="${imageUrl}" alt="" loading="lazy" decoding="async" />
      <span>
        <strong>${escapeHtml(displayLabel)}</strong>
        <small>${escapeHtml(details)}</small>
      </span>
    </span>
  `;
}

function svgIcon(name: IconName): string {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]}</svg>`;
}

function hideBrokenImages(root: ParentNode): void {
  root.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
    image.addEventListener("error", () => {
      image.hidden = true;
    });
  });
}
