import type { AppStore } from "../../app/application-state/app-store.js";
import type { AppState } from "../../app/application-state/app-state.types.js";
import type { HertaApplication } from "../../app/herta-application.js";
import { getLocale, subscribeLocale } from "../localization/locale.js";
import { translateDocument } from "../localization/translate-document.js";
import type { ApplicationElements } from "./application-elements.js";
import { bindApplicationEvents, type JsonFileGateway } from "./bind-application-events.js";
import { renderApplicationState } from "./render-application-state.js";
import { currentApplicationView, syncViewNavigation } from "./sync-view-navigation.js";

export interface ApplicationShell {
  start(): void;
  stop(): void;
}

interface ShellRuntime {
  resultLimit: number;
  unsubscribeStore: (() => void) | null;
  unsubscribeLocale: (() => void) | null;
  unbindEvents: (() => void) | null;
}

interface StartShellOptions {
  readonly elements: ApplicationElements;
  readonly application: HertaApplication;
  readonly store: AppStore;
  readonly files: JsonFileGateway;
  readonly runtime: ShellRuntime;
  readonly render: (state: AppState) => void;
  readonly handleHashChange: () => void;
}

export function createApplicationShell(
  elements: ApplicationElements,
  application: HertaApplication,
  store: AppStore,
  files: JsonFileGateway
): ApplicationShell {
  const runtime: ShellRuntime = {
    resultLimit: 24,
    unsubscribeStore: null,
    unsubscribeLocale: null,
    unbindEvents: null,
  };
  const render = createShellRenderer(elements, application, store, runtime);
  const handleHashChange = (): void => {
    syncViewNavigation(elements.shell);
    render(store.snapshot);
  };

  return {
    start: () =>
      startShell({
        elements,
        application,
        store,
        files,
        runtime,
        render,
        handleHashChange,
      }),
    stop: () => stopShell(runtime, handleHashChange),
  };
}

function createShellRenderer(
  elements: ApplicationElements,
  application: HertaApplication,
  store: AppStore,
  runtime: ShellRuntime
): (state: AppState) => void {
  const render = (state: AppState): void => {
    renderApplicationState({
      elements,
      application,
      state,
      view: currentApplicationView(),
      resultLimit: runtime.resultLimit,
      onShowMore: () => {
        runtime.resultLimit += 24;
        render(store.snapshot);
      },
    });
  };
  return render;
}

function startShell(options: StartShellOptions): void {
  options.elements.shell.languageSelect.value = getLocale();
  options.runtime.unbindEvents = bindApplicationEvents({
    elements: options.elements,
    application: options.application,
    files: options.files,
    onResultCriteriaChanged: () => {
      options.runtime.resultLimit = 24;
    },
  });
  window.addEventListener("hashchange", options.handleHashChange);
  syncViewNavigation(options.elements.shell);
  options.runtime.unsubscribeStore = options.store.subscribe(options.render);
  options.runtime.unsubscribeLocale = subscribeLocale(() => {
    options.elements.shell.languageSelect.value = getLocale();
    translateDocument();
    options.render(options.store.snapshot);
  });
  void options.application.initialize();
}

function stopShell(runtime: ShellRuntime, handleHashChange: () => void): void {
  runtime.unsubscribeStore?.();
  runtime.unsubscribeStore = null;
  runtime.unsubscribeLocale?.();
  runtime.unsubscribeLocale = null;
  runtime.unbindEvents?.();
  runtime.unbindEvents = null;
  window.removeEventListener("hashchange", handleHashChange);
}
