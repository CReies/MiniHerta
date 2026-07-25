import type { Run } from "../../../domain/runs/run.types.js";
import { nearScoreLimit } from "../../../domain/scoring/filter-runs.js";
import type { EvaluatedRun } from "../../../domain/scoring/scoring.types.js";
import { itemImageUrl, itemLabel } from "../../items/item-presentation.js";
import { formatDate } from "../../localization/format-date.js";
import { t, type Locale } from "../../localization/locale.js";
import { svgIcon } from "./run-list-icons.js";

type RunStatus = "possible" | "near" | "blocked";

export function renderRunCard(run: EvaluatedRun, locale: Locale): string {
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

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
