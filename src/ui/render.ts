import { nearScoreLimit } from "../domain/scoring.js";
import type { Elements } from "./dom.js";
import type { EvaluatedRun, Inventory, Run } from "../domain/types.js";
import { itemImageUrl } from "../utils/assets.js";
import { escapeHtml, formatDate, normalizeText } from "../utils/text.js";

export function renderBossOptions(els: Elements, runs: Run[]): void {
  const current = els.bossFilter.value || "Todos";
  const bosses = [
    "Todos",
    ...new Set(
      runs
        .map((run) => run.boss)
        .filter(Boolean)
        .sort()
    ),
  ];
  els.bossFilter.innerHTML = bosses
    .map((boss) => `<option value="${escapeHtml(boss)}">${escapeHtml(boss)}</option>`)
    .join("");
  els.bossFilter.value = bosses.includes(current) ? current : "Todos";
}

export function renderInventory(
  els: Elements,
  inventory: Inventory,
  characters: string[],
  lightCones: string[],
  onChange: () => void
): void {
  renderInventoryList({
    root: els.characters,
    items: characters,
    search: els.characterSearch.value,
    owned: inventory.characters,
    label: "E",
    max: 6,
    countEl: els.characterCount,
    kind: "character",
    template: els.rowTemplate,
    onChange,
  });

  renderInventoryList({
    root: els.lightCones,
    items: lightCones,
    search: els.lightConeSearch.value,
    owned: inventory.lightCones,
    label: "S",
    max: 5,
    countEl: els.lightConeCount,
    kind: "lightCone",
    template: els.rowTemplate,
    onChange,
  });
}

export function renderResults(els: Elements, evaluated: EvaluatedRun[], visible: EvaluatedRun[]): void {
  const possible = evaluated.filter((run) => run.missingScore === 0);
  const near = evaluated.filter((run) => run.missingScore > 0 && run.missingScore <= nearScoreLimit);

  els.possibleCount.textContent = String(possible.length);
  els.nearCount.textContent = String(near.length);
  els.runCount.textContent = String(evaluated.length);

  els.results.innerHTML = visible.length
    ? visible.slice(0, 160).map(renderRunCard).join("")
    : `<div class="empty">No hay equipos para esos filtros. Prueba ignorar light cones o cambiar a "Posibles y cercanos".</div>`;
}

function renderInventoryList(options: {
  root: HTMLElement;
  items: string[];
  search: string;
  owned: Map<string, number>;
  label: string;
  max: number;
  countEl: HTMLElement;
  kind: "character" | "lightCone";
  template: HTMLTemplateElement;
  onChange: () => void;
}): void {
  const query = normalizeText(options.search);
  const filtered = options.items.filter((item) => normalizeText(item).includes(query));
  options.root.innerHTML = "";

  for (const item of filtered) {
    const node = options.template.content.firstElementChild?.cloneNode(true) as HTMLElement;
    const checkbox = node.querySelector("input") as HTMLInputElement;
    const image = node.querySelector("img") as HTMLImageElement;
    const name = node.querySelector(".name") as HTMLElement;
    const controlLabel = node.querySelector(".level-control span") as HTMLElement;
    const select = node.querySelector("select") as HTMLSelectElement;

    checkbox.checked = options.owned.has(item);
    checkbox.dataset.item = item;
    image.src = itemImageUrl(options.kind, item);
    image.alt = "";
    image.hidden = false;
    image.onerror = () => {
      image.hidden = true;
    };
    name.textContent = item;
    controlLabel.textContent = options.label;
    select.disabled = !checkbox.checked;
    select.innerHTML = levelValues(options.kind, options.max)
      .map((value) => `<option value="${value}">${value}</option>`)
      .join("");
    select.value = String(options.owned.get(item) ?? (options.kind === "lightCone" ? 1 : 0));

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) options.owned.set(item, Number(select.value));
      else options.owned.delete(item);
      options.onChange();
    });

    select.addEventListener("change", () => {
      if (checkbox.checked) {
        options.owned.set(item, Number(select.value));
        options.onChange();
      }
    });

    options.root.appendChild(node);
  }

  options.countEl.textContent = `${options.owned.size} seleccionados`;
}

function levelValues(kind: "character" | "lightCone", max: number): number[] {
  return kind === "lightCone"
    ? Array.from({ length: max }, (_, index) => index + 1)
    : Array.from({ length: max + 1 }, (_, index) => index);
}

function renderRunCard(run: EvaluatedRun): string {
  const status = run.missingScore === 0 ? "possible" : run.missingScore <= nearScoreLimit ? "near" : "blocked";
  const label =
    status === "possible" ? "Posible" : status === "near" ? `Cercano ${run.missingScore}` : `${run.missingScore} pts`;

  return `
    <article class="run-card ${status === "possible" ? "" : status}">
      <div class="run-header">
        <div>
          <h3>${escapeHtml(run.team.map((member) => member.char).join(" / "))}</h3>
          <p class="meta">${escapeHtml(run.boss)} · ${escapeHtml(run.author)} · ${formatDate(run.videoDate)} · ${run.limitedCost} limited 5★</p>
        </div>
        <span class="badge ${status === "possible" ? "" : status}">${escapeHtml(label)}</span>
      </div>
      <div class="team-grid">
        ${run.team.map(renderMember).join("")}
      </div>
      ${run.missing.length ? `<div class="missing-list">${run.missing.map(renderMissingChip).join("")}</div>` : ""}
      <div class="run-actions">
        ${run.videoUrl ? `<a href="${escapeHtml(run.videoUrl)}" target="_blank" rel="noreferrer">Ver run</a>` : ""}
        <span class="meta">ID ${escapeHtml(run.id)}</span>
      </div>
    </article>
  `;
}

function renderMember(member: Run["team"][number]): string {
  return `
    <div class="member">
      <div class="member-media">
        <img src="${escapeHtml(itemImageUrl("character", member.char))}" alt="" loading="lazy" onerror="this.hidden=true" />
        ${
          member.lc
            ? `<img class="lc-image" src="${escapeHtml(itemImageUrl("lightCone", member.lc))}" alt="" loading="lazy" onerror="this.hidden=true" />`
            : ""
        }
      </div>
      <strong>${escapeHtml(member.char)} E${member.eidolon}</strong>
      <span>${escapeHtml(member.lc || "Sin light cone")} S${member.superimp}</span>
    </div>
  `;
}

function renderMissingChip(item: EvaluatedRun["missing"][number]): string {
  const kind = item.kind === "character" ? "PJ" : "LC";
  const action = item.isUpgrade ? "dupe" : "nuevo";
  return `<span title="${kind} ${item.rarity}★ · ${action} · ${item.score} pts">${escapeHtml(item.label)}</span>`;
}
