import { messages, type MessageKey } from "./messages.js";

/** Browser locale state for the presentation layer. */
export type Locale = "en" | "es";

const storageKey = "herta-locale";
let locale: Locale = "en";
const listeners = new Set<() => void>();

export function initializeLocale(): Locale {
  const stored = readStoredLocale();
  locale = isLocale(stored) ? stored : detectBrowserLocale();
  document.documentElement.lang = locale;
  return locale;
}

export function getLocale(): Locale {
  return locale;
}

export function setLocale(next: string): void {
  if (!isLocale(next) || next === locale) return;
  locale = next;
  persistLocale(locale);
  document.documentElement.lang = locale;
  for (const listener of listeners) listener();
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function t(key: MessageKey, values: Record<string, string | number> = {}): string {
  let message: string = messages[locale][key] ?? messages.en[key];
  for (const [name, value] of Object.entries(values)) message = message.replaceAll(`{${name}}`, String(value));
  return message;
}

function detectBrowserLocale(): Locale {
  const preferred = navigator.languages[0] ?? navigator.language;
  return preferred.toLowerCase().startsWith("es") ? "es" : "en";
}

function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "es";
}

function readStoredLocale(): string | null {
  try {
    return localStorage.getItem(storageKey);
  } catch (error) {
    console.warn("The browser denied access to the saved locale preference.", error);
    return null;
  }
}

function persistLocale(value: Locale): void {
  try {
    localStorage.setItem(storageKey, value);
  } catch (error) {
    // The active locale still changes in memory when private browsing blocks persistence.
    console.warn("The browser could not persist the locale preference.", error);
  }
}
