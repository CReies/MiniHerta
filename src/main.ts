import { HertaApplication } from "./app/application.js";
import { AppStore } from "./app/state.js";
import { LocalStorageInventoryRepository } from "./infrastructure/browser/inventory-repository.js";
import { BrowserJsonFileGateway } from "./infrastructure/browser/json-file-gateway.js";
import { createDefaultRunsRepositories } from "./infrastructure/http/default-run-sources.js";
import { AppViewController } from "./ui/app-view-controller.js";
import { getElements } from "./ui/dom.js";

document.addEventListener("DOMContentLoaded", () => {
  const store = new AppStore();
  const application = new HertaApplication(
    store,
    new LocalStorageInventoryRepository(localStorage),
    createDefaultRunsRepositories()
  );
  const view = new AppViewController(getElements(), application, store, new BrowserJsonFileGateway());
  view.start();
});
