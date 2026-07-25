# Arquitectura

## Objetivo

La aplicación mantiene una arquitectura frontend por capas. Las dependencias apuntan hacia el dominio y los detalles del navegador permanecen en el exterior:

```text
UI ────────────────┐
                   v
Infraestructura -> Aplicación -> Dominio -> Shared
                         |
                         v
                  Estado observable
```

La organización interna usa features reales para que cada archivo tenga una sola razón de cambio. No se utilizan barrels globales: cada consumidor importa la API concreta que necesita.

## Estructura

```text
src/
  layouts/
    BaseLayout.astro
  pages/
    index.astro
  domain/
    item.types.ts
    catalog/
      catalog.types.ts
      create-catalog.ts
      item-rarity.ts
    inventory/
      create-inventory.ts
      inventory-levels.ts
      inventory-serialization.ts
      inventory.types.ts
    runs/
      light-cone-usage.ts
      normalize-runs.ts
      parse-runs-payload.ts
      run.types.ts
    scoring/
      evaluate-run.ts
      filter-runs.ts
      scoring.types.ts
  app/
    application-state/
      app-state.types.ts
      app-store.ts
      internal/
        state-immutability.ts
    inventory/
      inventory-actions.ts
      inventory-repository.ts
    results/
      select-results.ts
    runs/
      run-actions.ts
      runs-repository.ts
      internal/
        load-run-repository.ts
        select-run-sources.ts
    herta-application.ts
  infrastructure/
    browser/
      inventory-repository.ts
      json-file-gateway.ts
    http/
      runs/
        create-default-runs-repositories.ts
        folder-runs-repository.ts
        http-runs-repository.ts
        internal/
          parse-runs-manifest.ts
          resolve-run-source-url.ts
  ui/
    application-shell/
      ApplicationHeader.astro
      HeroBanner.astro
      application-elements.ts
      bind-application-events.ts
      create-application-shell.ts
      render-application-state.ts
      render-application-status.ts
      sync-view-navigation.ts
    inventory/
      InventoryTemplates.astro
      InventoryView.astro
      inventory-elements.ts
      inventory-search.ts
      inventory-view.types.ts
      render-inventory.ts
      internal/
        bind-inventory-controls.ts
        create-inventory-card.ts
        inventory-focus.ts
    items/
      item-presentation.ts
      item-search.ts
    localization/
      format-date.ts
      locale.ts
      messages.ts
      translate-document.ts
    run-filters/
      render-run-filter-options.ts
      run-filter-elements.ts
    run-list/
      TeamFinderView.astro
      create-run-list-summary.ts
      render-run-list.ts
      run-list-elements.ts
      internal/
        render-run-card.ts
        run-list-icons.ts
  shared/
    normalize-text.ts
  data/
  generated/
  main.ts
```

## Responsabilidades y APIs públicas

### Dominio

- `catalog/create-catalog.ts`: construye índices y consulta rarezas.
- `inventory/create-inventory.ts`: crea y reconcilia inventarios.
- `inventory/inventory-levels.ts`: define límites y transiciones E/S.
- `inventory/inventory-serialization.ts`: valida, importa y serializa el formato externo.
- `runs/parse-runs-payload.ts`: valida datos externos como `unknown`.
- `runs/normalize-runs.ts`: transforma runs válidos al modelo del dominio.
- `runs/light-cone-usage.ts`: deriva recomendaciones por personaje.
- `scoring/evaluate-run.ts`: calcula faltantes y score.
- `scoring/filter-runs.ts`: filtra, selecciona modos y ordena resultados.

Los archivos `*.types.ts` contienen únicamente contratos de su feature. `item.types.ts` permanece transversal porque `ItemKind` y `Rarity` son vocabulario común de catálogo, inventario, scoring y presentación.

### Aplicación

- `herta-application.ts`: facade estable consumida por la UI.
- `application-state/app-store.ts`: estado observable y comandos de actualización.
- `inventory/inventory-actions.ts`: casos de uso y persistencia de inventario.
- `inventory/inventory-repository.ts`: puerto específico de almacenamiento.
- `runs/run-actions.ts`: fallback, concurrencia y cambio de fuentes.
- `runs/runs-repository.ts`: contratos de fuentes simples y seleccionables.
- `results/select-results.ts`: selección derivada para la presentación.

Los módulos bajo `internal/` encapsulan snapshots, selección y carga detallada. Solo pueden importarse desde su propia feature; una prueba de arquitectura protege esta regla.

### Infraestructura

- `LocalStorageInventoryRepository`: adapta `localStorage` al puerto de inventario.
- `BrowserJsonFileGateway`: adapta lectura y descarga de JSON del navegador.
- `HttpRunsRepository`: obtiene y valida una colección HTTP.
- `FolderRunsRepository`: mantiene el manifiesto y carga fuentes bajo demanda.
- `createDefaultRunsRepositories`: configura los adaptadores concretos usados por `main.ts`.

El parseo del manifiesto y la resolución segura de URLs son detalles internos del adaptador de runs.

### Presentación

- `create-application-shell.ts`: coordina ciclo de vida, suscripciones y limpieza.
- `bind-application-events.ts`: registra eventos y delega acciones.
- `render-application-state.ts`: elige el renderer de la vista activa.
- `inventory/render-inventory.ts`: coordina la vista de inventario.
- `run-list/render-run-list.ts`: actualiza resumen, lista y paginación.
- `run-filters/render-run-filter-options.ts`: renderiza opciones dependientes de la fuente.
- `localization/locale.ts`: mantiene el locale observable.
- `localization/translate-document.ts`: traduce el DOM estático y los templates.
- `items/item-presentation.ts`: adapta nombres y assets canónicos para la UI.

Los componentes Astro contienen únicamente markup estático. No se hidratan componentes ni se introduce un framework UI; `main.ts` continúa siendo el único composition root del cliente.

## Dirección permitida de dependencias

```text
shared -> ninguna capa
domain -> shared
app -> domain, shared
infrastructure -> app, domain, shared
ui -> app, domain, data, generated, shared
main.ts -> app, infrastructure, ui
```

Además:

- Una feature no puede importar el directorio `internal/` de otra feature.
- Dominio y aplicación no pueden usar DOM, `fetch`, `localStorage` ni assets.
- Infraestructura no puede depender de UI.
- UI no puede depender de implementaciones de infraestructura.
- Las pruebas `layer-boundaries.test.mjs` comprueban estas reglas y la ausencia de ciclos.

## Flujo de estado

```text
evento DOM
  -> HertaApplication
  -> acción de inventario o runs
  -> AppStore.commit
  -> suscriptores
  -> renderApplicationState
  -> renderer de la feature activa
```

`AppStore` normaliza y congela runs, clona inventarios y catálogos al exponer snapshots y usa un estado discriminado de carga/error. Los efectos de persistencia y red quedan fuera del store.

## Cómo agregar una funcionalidad

1. Identificar la capa propietaria de la regla.
2. Crear una carpeta de feature solo si existen al menos dos responsabilidades cohesionadas o una frontera interna que proteger.
3. Definir tipos y funciones puras en dominio antes de agregar efectos.
4. Exponer un caso de uso o puerto específico desde aplicación cuando la UI o infraestructura lo necesiten.
5. Mantener render, elementos DOM y eventos dentro de la feature visual.
6. Importar archivos públicos de forma explícita; usar `internal/` solo dentro de la misma feature.
7. Añadir pruebas a la función pura o al contrato observable, no a delegaciones triviales.
8. Ejecutar typecheck, pruebas, límites, Astro Check, lint, formato y build.

## Prevención de módulos monolíticos

Un módulo debe revisarse cuando coordina y ejecuta detalles al mismo tiempo, mezcla cálculo con efectos o cambia por varias razones. La división debe realizarse por responsabilidad, no por número de líneas.

Antes de crear un archivo nuevo:

- su responsabilidad debe poder describirse en una frase;
- debe reducir acoplamiento, complejidad o necesidad de mocks;
- su API pública debe ser mínima;
- helpers triviales y exclusivos deben permanecer privados;
- archivos de datos extensos no deben fragmentarse sin beneficio;
- no deben crearse barrels que oculten la procedencia de dependencias.

Los coordinadores ensamblan funciones; no contienen validadores, HTML detallado, persistencia ni reglas de negocio. Los renderizadores reciben datos preparados y callbacks explícitos.

## Build y pruebas

`scripts/build.mjs` genera `runs/index.json`, ejecuta el build estático de Astro y copia `assets/` y `runs/` a `dist/`. Las pruebas transpilan TypeScript a `.test-dist/`, separado del bundle de producción.

Comandos principales:

```powershell
pnpm check
pnpm build
```
