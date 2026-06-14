import type { Elements } from "./dom.js";

const themeStorageKey = "herta-0cycle-theme-v1";

export function loadTheme(els: Elements): void {
  const saved = localStorage.getItem(themeStorageKey);
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  setTheme(saved || (prefersDark ? "dark" : "light"), els);
}

export function toggleTheme(els: Elements): void {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(next, els);
  localStorage.setItem(themeStorageKey, next);
}

function setTheme(theme: string, els: Elements): void {
  const normalized = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = normalized;
  els.themeToggle.textContent = normalized === "dark" ? "Modo claro" : "Modo oscuro";
  els.themeToggle.setAttribute("aria-pressed", String(normalized === "dark"));
}
