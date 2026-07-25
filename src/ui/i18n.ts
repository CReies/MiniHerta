/** Browser locale state and DOM translation for the presentation layer. */
export type Locale = "en" | "es";

const storageKey = "herta-locale";
let locale: Locale = "en";
const listeners = new Set<() => void>();

const messages = {
  en: {
    "meta.description": "Find Honkai: Star Rail 0-cycle teams compatible with your characters and Light Cones.",
    "meta.title": "0-Cycle Team Finder",
    "skip.main": "Skip to main content",
    "nav.aria": "Main views",
    "nav.teamFinder": "Team Finder",
    "nav.inventory": "Inventory",
    "actions.loadRuns": "Load runs",
    "actions.import": "Import",
    "actions.export": "Export",
    "actions.reset": "Reset",
    "language.label": "Language",
    "hero.aria": "Featured boss",
    "inventory.eyebrow": "Your collection",
    "inventory.title": "Inventory",
    "inventory.subtitle": "Build your account and review the Light Cones most often used with each character.",
    "inventory.charactersEyebrow": "Characters and frequent builds",
    "inventory.characters": "Characters",
    "inventory.characterSearchLabel": "Search for a character or recommended Light Cone",
    "inventory.characterSearch": "Search character or Light Cone",
    "inventory.otherEyebrow": "Outside the recommendations",
    "inventory.otherCones": "Other Light Cones",
    "inventory.coneSearchLabel": "Search for another Light Cone",
    "inventory.coneSearch": "Search other Light Cones",
    "inventory.note": "Each character's three most used Light Cones are inside their card. Only the rest appear here.",
    "results.eyebrow": "Recommendations",
    "results.title": "Teams for your account",
    "results.subtitle": "From teams you can already use to those that need more investment.",
    "filters.version": "Version",
    "filters.endgame": "Endgame",
    "filters.lightCones": "Light Cones",
    "filters.strict": "Light Cone and superimposition",
    "filters.name": "Light Cone only",
    "filters.ignore": "Ignore Light Cones",
    "filters.search": "Search results",
    "filters.searchPlaceholder": "Character, author, or Light Cone",
    "summary.possible": "possible now",
    "summary.near": "nearby teams",
    "summary.total": "runs analyzed",
    "summary.announcement": "{visible} matching teams. {possible} possible now, {near} nearby, {total} runs analyzed.",
    "card.character": "Character",
    "card.owned": "Owned",
    "card.add": "Add",
    "card.topCones": "Most used Light Cones",
    "card.topRuns": "Top 3 in runs",
    "level.superimposition": "Superimposition",
    "level.eidolon": "Eidolon",
    "filter.all": "All",
    "status.loading": "Loading runs...",
    "error.runsFile": "That file does not appear to be valid runs JSON.",
    "error.inventoryFile": "That inventory does not appear to be valid JSON.",
    "error.inventoryStorageRead":
      "The saved inventory is unreadable. It was left untouched; import or reset it to replace the stored data.",
    "error.inventoryStorageWrite":
      "The inventory changed in this tab, but the browser could not save it. Export a copy before closing.",
    "error.download":
      "I couldn't download the runs. Open this folder with a local server or use the “Load runs” button.",
    "error.collection": "I couldn't load that run collection.",
    "inventory.characterCount": "{owned} of {total} on your account",
    "inventory.coneCount": "{owned} on your account · {recommended} with characters",
    "inventory.noCharacters": "No characters or recommended Light Cones match your search.",
    "inventory.noOtherCones": "No other Light Cones match your search.",
    "inventory.noRecommendations": "No Light Cones have been recorded for this character yet.",
    "inventory.use": "{count} use",
    "inventory.uses": "{count} uses",
    "inventory.removeAria": "Remove {item} from inventory",
    "inventory.addAria": "Add {item} to inventory",
    "level.characterAria": "Eidolon for {item}",
    "level.coneAria": "Superimposition for {item}",
    "level.decreaseAria": "Decrease {prefix} for {item}",
    "level.increaseAria": "Increase {prefix} for {item}",
    "results.emptyTitle": "No teams found",
    "results.emptyBody": "Try another boss, change the Light Cone criteria, or clear the search.",
    "results.showing": "Showing {shown} of {total} teams",
    "results.showMore": "Show {count} more",
    "results.cost": "cost",
    "results.viewRun": "View run",
    "results.ready": "Ready to play",
    "results.nearStatus": "{score} pts to complete",
    "results.blockedStatus": "{score} pts missing",
    "results.noCone": "No Light Cone",
    "results.needAdd": "You need to add",
    "results.character": "Character",
    "results.new": "new",
    "results.upgrade": "upgrade",
    "date.missing": "no date",
  },
  es: {
    "meta.description":
      "Encuentra equipos de 0 ciclos de Honkai: Star Rail compatibles con tus personajes y Conos de Luz.",
    "meta.title": "Buscador de equipos de 0 ciclos",
    "skip.main": "Saltar al contenido principal",
    "nav.aria": "Vistas principales",
    "nav.teamFinder": "Buscador de equipos",
    "nav.inventory": "Inventario",
    "actions.loadRuns": "Cargar runs",
    "actions.import": "Importar",
    "actions.export": "Exportar",
    "actions.reset": "Reiniciar",
    "language.label": "Idioma",
    "hero.aria": "Jefe destacado",
    "inventory.eyebrow": "Tu colección",
    "inventory.title": "Inventario",
    "inventory.subtitle": "Arma tu cuenta y revisa los Conos de Luz que más se usan con cada personaje.",
    "inventory.charactersEyebrow": "Personajes y builds frecuentes",
    "inventory.characters": "Personajes",
    "inventory.characterSearchLabel": "Buscar personaje o Cono de Luz recomendado",
    "inventory.characterSearch": "Buscar personaje o Cono de Luz",
    "inventory.otherEyebrow": "Fuera de las recomendaciones",
    "inventory.otherCones": "Otros Conos de Luz",
    "inventory.coneSearchLabel": "Buscar otro Cono de Luz",
    "inventory.coneSearch": "Buscar en otros Conos de Luz",
    "inventory.note":
      "Los tres Conos de Luz más usados de cada personaje están dentro de su tarjeta. Aquí solo aparecen los demás.",
    "results.eyebrow": "Recomendaciones",
    "results.title": "Equipos para tu cuenta",
    "results.subtitle": "De los que ya puedes usar a los que requieren más inversión.",
    "filters.version": "Versión",
    "filters.endgame": "Contenido final",
    "filters.lightCones": "Conos de Luz",
    "filters.strict": "Cono de Luz y superimposición",
    "filters.name": "Solo el Cono de Luz",
    "filters.ignore": "Ignorar Conos de Luz",
    "filters.search": "Buscar en resultados",
    "filters.searchPlaceholder": "Personaje, autor o Cono de Luz",
    "summary.possible": "posibles ahora",
    "summary.near": "equipos cercanos",
    "summary.total": "runs analizados",
    "summary.announcement":
      "{visible} equipos coincidentes. {possible} posibles ahora, {near} equipos cercanos, {total} runs analizadas.",
    "card.character": "Personaje",
    "card.owned": "En cuenta",
    "card.add": "Añadir",
    "card.topCones": "Conos más usados",
    "card.topRuns": "Top 3 en runs",
    "level.superimposition": "Superimposición",
    "level.eidolon": "Eidolon",
    "filter.all": "Todos",
    "status.loading": "Cargando runs...",
    "error.runsFile": "Ese archivo no parece ser un JSON válido de runs.",
    "error.inventoryFile": "Ese inventario no parece ser un JSON válido.",
    "error.inventoryStorageRead":
      "El inventario guardado no se puede leer. No se sobrescribió; impórtalo o reinícialo para reemplazar los datos guardados.",
    "error.inventoryStorageWrite":
      "El inventario cambió en esta pestaña, pero el navegador no pudo guardarlo. Exporta una copia antes de cerrar.",
    "error.download":
      "No pude descargar las runs. Abre esta carpeta con un servidor local o usa el botón “Cargar runs”.",
    "error.collection": "No pude cargar esa colección de runs.",
    "inventory.characterCount": "{owned} de {total} en tu cuenta",
    "inventory.coneCount": "{owned} en tu cuenta · {recommended} junto a personajes",
    "inventory.noCharacters": "No hay personajes ni Conos de Luz recomendados que coincidan con la búsqueda.",
    "inventory.noOtherCones": "No hay otros Conos de Luz que coincidan.",
    "inventory.noRecommendations": "Aún no hay Conos de Luz registrados para este personaje.",
    "inventory.use": "{count} uso",
    "inventory.uses": "{count} usos",
    "inventory.removeAria": "Quitar {item} del inventario",
    "inventory.addAria": "Añadir {item} al inventario",
    "level.characterAria": "Eidolon de {item}",
    "level.coneAria": "Superimposición de {item}",
    "level.decreaseAria": "Reducir {prefix} de {item}",
    "level.increaseAria": "Aumentar {prefix} de {item}",
    "results.emptyTitle": "No encontramos equipos",
    "results.emptyBody": "Prueba con otro jefe, cambia el criterio de Conos de Luz o limpia la búsqueda.",
    "results.showing": "Mostrando {shown} de {total} equipos",
    "results.showMore": "Mostrar {count} más",
    "results.cost": "coste",
    "results.viewRun": "Ver run",
    "results.ready": "Listo para jugar",
    "results.nearStatus": "{score} pts para completar",
    "results.blockedStatus": "{score} pts faltantes",
    "results.noCone": "Sin Cono de Luz",
    "results.needAdd": "Necesitas añadir",
    "results.character": "Personaje",
    "results.new": "nuevo",
    "results.upgrade": "mejora",
    "date.missing": "sin fecha",
  },
} as const;

export type MessageKey = keyof (typeof messages)["en"];

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

export function translateDocument(root: ParentNode = document): void {
  translateTree(root);
  root.querySelectorAll<HTMLTemplateElement>("template").forEach((template) => translateTree(template.content));
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", t("meta.description"));
  document.title = t("meta.title");
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
