export type IconName =
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

export function svgIcon(name: IconName): string {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]}</svg>`;
}
