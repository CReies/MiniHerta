import type { Elements } from "./dom.js";

const themeStorageKey = "herta-0cycle-theme-v1";

export function loadTheme(els: Elements): void {
  const saved = localStorage.getItem(themeStorageKey);
  setTheme(saved === "light" ? "light" : "dark", els);
}

export function toggleTheme(els: Elements): void {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(next, els);
  localStorage.setItem(themeStorageKey, next);
}

function setTheme(theme: string, els: Elements): void {
  const normalized = theme === "dark" ? "dark" : "light";
  const nextLabel = normalized === "dark" ? "Modo claro" : "Modo oscuro";
  document.documentElement.dataset.theme = normalized;
  const label = els.themeToggle.querySelector<HTMLElement>("[data-theme-label]");
  if (label) label.textContent = nextLabel;
  els.themeToggle.setAttribute("aria-label", nextLabel);
  els.themeToggle.title = nextLabel;
  els.themeToggle.setAttribute("aria-pressed", String(normalized === "dark"));
}
