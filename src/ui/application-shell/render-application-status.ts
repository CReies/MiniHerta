import type { AppStatus } from "../../app/application-state/app-state.types.js";
import { t } from "../localization/locale.js";
import type { MessageKey } from "../localization/messages.js";

const statusMessages: Readonly<
  Record<Exclude<AppStatus, { type: "idle" } | { type: "ready" }>["message"], MessageKey>
> = {
  loadingRuns: "status.loading",
  runsDownloadFailed: "error.download",
  runCollectionFailed: "error.collection",
  runsFileInvalid: "error.runsFile",
  inventoryFileInvalid: "error.inventoryFile",
  inventoryStorageReadFailed: "error.inventoryStorageRead",
  inventoryStorageWriteFailed: "error.inventoryStorageWrite",
};

export function renderApplicationStatus(element: HTMLElement, status: AppStatus): void {
  if (status.type === "idle" || status.type === "ready") {
    element.hidden = true;
    element.textContent = "";
    element.removeAttribute("data-status");
    return;
  }

  element.hidden = false;
  element.dataset.status = status.type;
  element.setAttribute("role", status.type === "error" ? "alert" : "status");
  element.setAttribute("aria-live", status.type === "error" ? "assertive" : "polite");
  element.textContent = t(statusMessages[status.message]);
}
