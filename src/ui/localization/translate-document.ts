import { t } from "./locale.js";
import { messages, type MessageKey } from "./messages.js";

export function translateDocument(root: ParentNode = document): void {
  translateTree(root);
  root.querySelectorAll<HTMLTemplateElement>("template").forEach((template) => translateTree(template.content));
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", t("meta.description"));
  document.title = t("meta.title");
}

function translateTree(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (isMessageKey(key)) element.textContent = t(key);
  });
  root.querySelectorAll<HTMLElement>("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (isMessageKey(key)) element.setAttribute("placeholder", t(key));
  });
  root.querySelectorAll<HTMLElement>("[data-i18n-aria-label]").forEach((element) => {
    const key = element.dataset.i18nAriaLabel;
    if (isMessageKey(key)) element.setAttribute("aria-label", t(key));
  });
}

function isMessageKey(value: string | undefined): value is MessageKey {
  return typeof value === "string" && Object.hasOwn(messages.en, value);
}
