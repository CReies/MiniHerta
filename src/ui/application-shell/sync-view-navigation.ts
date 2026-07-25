import type { ApplicationShellElements } from "./application-elements.js";

export type ApplicationView = "inventario" | "team-finder";

export function currentApplicationView(): ApplicationView {
  return window.location.hash === "#inventario" ? "inventario" : "team-finder";
}

export function syncViewNavigation(elements: ApplicationShellElements): void {
  const view = currentApplicationView();

  for (const page of elements.viewPages) {
    page.hidden = page.dataset.view !== view;
  }

  for (const link of elements.viewLinks) {
    const active = link.dataset.viewLink === view;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}
