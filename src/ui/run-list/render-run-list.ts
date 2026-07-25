import type { EvaluatedRun } from "../../domain/scoring/scoring.types.js";
import { t, type Locale } from "../localization/locale.js";
import { createRunListSummary } from "./create-run-list-summary.js";
import type { RunListElements } from "./run-list-elements.js";
import { renderRunCard } from "./internal/render-run-card.js";
import { svgIcon } from "./internal/run-list-icons.js";

export function renderRunList(
  elements: RunListElements,
  evaluated: readonly EvaluatedRun[],
  visible: readonly EvaluatedRun[],
  limit = 24,
  onShowMore?: () => void,
  locale: Locale = "en"
): void {
  const summary = createRunListSummary(evaluated, visible.length);
  elements.possibleCount.textContent = String(summary.possible);
  elements.nearCount.textContent = String(summary.near);
  elements.runCount.textContent = String(summary.total);

  const announcement = t("summary.announcement", {
    possible: summary.possible,
    near: summary.near,
    total: summary.total,
    visible: summary.visible,
  });
  if (elements.resultsAnnouncement.textContent !== announcement) {
    elements.resultsAnnouncement.textContent = announcement;
  }

  elements.results.innerHTML = renderVisibleRuns(visible, limit, locale);
  hideBrokenImages(elements.results);
  elements.results
    .querySelector<HTMLButtonElement>("[data-show-more]")
    ?.addEventListener("click", () => onShowMore?.());
}

function renderVisibleRuns(runs: readonly EvaluatedRun[], limit: number, locale: Locale): string {
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

function hideBrokenImages(root: ParentNode): void {
  root.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
    image.addEventListener("error", () => {
      image.hidden = true;
    });
  });
}
