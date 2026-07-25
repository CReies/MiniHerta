export interface InventoryElements {
  readonly inventoryFile: HTMLInputElement;
  readonly exportInventory: HTMLButtonElement;
  readonly resetBuild: HTMLButtonElement;
  readonly characterSearch: HTMLInputElement;
  readonly lightConeSearch: HTMLInputElement;
  readonly characters: HTMLElement;
  readonly lightCones: HTMLElement;
  readonly characterCount: HTMLElement;
  readonly lightConeCount: HTMLElement;
  readonly characterCardTemplate: HTMLTemplateElement;
  readonly lightConeCardTemplate: HTMLTemplateElement;
}

export function queryInventoryElements(): InventoryElements {
  return {
    inventoryFile: requireElement("inventoryFile", HTMLInputElement),
    exportInventory: requireElement("exportInventory", HTMLButtonElement),
    resetBuild: requireElement("resetBuild", HTMLButtonElement),
    characterSearch: requireElement("characterSearch", HTMLInputElement),
    lightConeSearch: requireElement("lightConeSearch", HTMLInputElement),
    characters: requireElement("characters", HTMLElement),
    lightCones: requireElement("lightCones", HTMLElement),
    characterCount: requireElement("characterCount", HTMLElement),
    lightConeCount: requireElement("lightConeCount", HTMLElement),
    characterCardTemplate: requireElement("characterCardTemplate", HTMLTemplateElement),
    lightConeCardTemplate: requireElement("lightConeCardTemplate", HTMLTemplateElement),
  };
}

interface HtmlElementConstructor<T extends HTMLElement> {
  new (): T;
}

function requireElement<T extends HTMLElement>(id: string, constructor: HtmlElementConstructor<T>): T {
  const element = document.getElementById(id);
  if (!(element instanceof constructor)) {
    throw new Error(`Expected #${id} to be a ${constructor.name}`);
  }
  return element;
}
