import { AppStore } from "./app/application-state/app-store.js";
import { HertaApplication } from "./app/herta-application.js";
import { LocalStorageInventoryRepository } from "./infrastructure/browser/inventory-repository.js";
import { BrowserJsonFileGateway } from "./infrastructure/browser/json-file-gateway.js";
import { createDefaultRunsRepositories } from "./infrastructure/http/runs/create-default-runs-repositories.js";
import { queryApplicationElements } from "./ui/application-shell/application-elements.js";
import { createApplicationShell } from "./ui/application-shell/create-application-shell.js";
import { initializeLocale } from "./ui/localization/locale.js";
import { translateDocument } from "./ui/localization/translate-document.js";

document.addEventListener("DOMContentLoaded", () => {
  initializeLocale();
  translateDocument();
  const store = new AppStore();
  const application = new HertaApplication(
    store,
    new LocalStorageInventoryRepository(localStorage),
    createDefaultRunsRepositories()
  );
  const shell = createApplicationShell(queryApplicationElements(), application, store, new BrowserJsonFileGateway());
  shell.start();
  window.addEventListener("pagehide", () => shell.stop(), { once: true });
});
