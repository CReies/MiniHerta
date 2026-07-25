# Arquitectura

## Objetivo

La aplicación sigue una arquitectura por capas inspirada en Clean Architecture. Las dependencias apuntan hacia el dominio y los detalles del navegador quedan en el exterior. Esto permite sustituir la persistencia, las fuentes de runs o la interfaz sin reescribir las reglas de scoring.

```text
UI ────────────────┐
                   v
Infraestructura -> Aplicación -> Dominio
                         |
                         v
                  Estado observable
```

## Estructura

```text
src/
  layouts/
    BaseLayout.astro           Layout HTML, metadatos y estilos globales
  pages/
    index.astro                Pagina estatica y shell de la interfaz
  domain/                    Reglas y modelos puros
    catalog.ts
    inventory.ts
    light-cone-usage.ts
    normalize.ts
    scoring.ts
    types.ts
  app/                       Casos de uso y puertos
    application.ts
    ports.ts
    results.ts
    state.ts
  infrastructure/            Adaptadores externos
    browser/
      inventory-repository.ts
      json-file-gateway.ts
    http/
      default-run-sources.ts
      folder-runs-repository.ts
      runs-repository.ts
  ui/                         Presentación DOM
    app-view-controller.ts
    bosses.ts
    dom.ts
    escape-html.ts
    format-date.ts
    i18n.ts
    inventory.ts
    inventory-search.ts
    item-presentation.ts
    results.ts
  shared/
    normalize-text.ts
  data/
    spanish-item-names.ts
  generated/
    assets.ts
  main.ts                     Composition root
```

## Dominio

El dominio contiene funciones puras y no depende de DOM, `localStorage`, `fetch` ni archivos:

- `normalize.ts` transforma entradas externas en entidades `Run`.
- `catalog.ts` construye el catálogo indexado y resuelve rarezas; no conoce traducciones ni assets.
- `inventory.ts` crea, valida, reconcilia y serializa inventarios.
- `light-cone-usage.ts` calcula los conos mas usados por personaje.
- `scoring.ts` evalúa runs, faltantes, filtros y ordenamiento.
- `types.ts` define el lenguaje común del negocio.

El scoring ponderado mantiene estas reglas:

| Falta                                     |         Score |
| ----------------------------------------- | ------------: |
| Personaje 4 estrellas nuevo               |            20 |
| Eidolon de personaje 4 estrellas          |  30 por nivel |
| Personaje 5 estrellas nuevo               |           100 |
| Eidolon de personaje 5 estrellas          | 135 por nivel |
| Light cone 4 estrellas nuevo              |            10 |
| Superimposición de light cone 4 estrellas |  16 por nivel |
| Light cone 5 estrellas nuevo              |            70 |
| Superimposición de light cone 5 estrellas |  90 por nivel |

Un run es cercano con `missingScore <= 220` y posible con `missingScore === 0`.

## Aplicación

`HertaApplication` expone los casos de uso de la app:

- inicializar las fuentes con fallback ordenado;
- cargar runs importados;
- importar, exportar, actualizar y reiniciar inventario;
- cambiar filtros y búsquedas;
- persistir después de cada comando relevante.

La clase depende de los puertos `RunsRepository` e `InventoryRepository`, no de implementaciones concretas. Para añadir una API, IndexedDB o una fuente cacheada solo es necesario implementar el puerto correspondiente y registrarlo en `main.ts`.

## Estado reactivo

`AppStore` es la fuente única de verdad. Cada comando crea un nuevo objeto de estado y emite una notificación a sus suscriptores:

```text
evento DOM -> caso de uso -> AppStore.commit -> suscriptores -> render
```

El store normaliza y congela los runs que recibe, clona sus `Map` internos al exponer snapshots y vuelve a clonar el inventario antes de actualizarlo. Una vista o prueba no puede alterar el estado interno ni observar mutaciones retroactivas. Sus contratos exponen colecciones de solo lectura. El estado reúne runs, catálogo, inventario, filtros, búsquedas y un estado discriminado de carga/error que no permite combinaciones inválidas.

## Infraestructura

- `LocalStorageInventoryRepository` adapta `localStorage` al puerto de inventario.
- `HttpRunsRepository` adapta cualquier endpoint JSON al puerto de runs.
- `FolderRunsRepository` carga el manifiesto generado de `runs/`, trae inicialmente la versión de juego más nueva y obtiene las demás bajo demanda. La fecha estable del dataset y la ruta resuelven empates de forma determinista.
- `createDefaultRunsRepositories` configura la carpeta local como fuente predeterminada.
- `BrowserJsonFileGateway` encapsula lectura y descarga de archivos del navegador.

Los fallos de una fuente de runs no contaminan el caso de uso: la aplicación intenta el siguiente repositorio configurado y solo publica un error cuando todos fallan.

## Presentación

`src/pages/index.astro` define el shell HTML y carga `src/main.ts` desde un `<script>` procesado por Vite. `BaseLayout.astro` centraliza el documento base, los metadatos y los estilos globales.

En el cliente, `AppViewController` conecta eventos DOM con comandos de aplicación y se suscribe al store. Los renders reciben datos y callbacks; no persisten datos ni modifican directamente el inventario.

`item-presentation.ts` adapta nombres canónicos del dominio a etiquetas localizadas y URLs de imágenes. De este modo, los archivos generados y las traducciones permanecen en presentación. `inventory-search.ts` mantiene las búsquedas como transformaciones puras y comprobables.

`main.ts` funciona únicamente como composition root: instancia el store, los adaptadores, la aplicación y el controlador de vista.

## Build y pruebas

`scripts/build.mjs` genera primero `runs/index.json`, invoca el build estatico de Astro y copia `assets/` y `runs/` al resultado. Astro genera el HTML y Vite empaqueta el entrypoint del cliente y sus imports en `dist/_astro/`.

`dist/` queda como un artefacto cerrado: contiene `index.html`, los bundles versionados, las imagenes y las colecciones de runs. El servidor local y los despliegues consumen ese directorio sin leer archivos fuente del repositorio.

Las pruebas no reutilizan el bundle de producción. `scripts/build-test-modules.mjs` transpila los modulos TypeScript a `.test-dist/`, un directorio ignorado por Git, y `node --test` importa esos modulos.

Las pruebas cubren tanto reglas de dominio como límites arquitectónicos: scoring, validación profunda de inventarios, manifiestos y runs reales, cancelación lógica de cargas obsoletas, snapshots defensivos del store, fallback de repositorios y persistencia de comandos. Un test estático impide dependencias hacia capas superiores y ciclos entre módulos.

Comandos de validación:

```powershell
pnpm check
pnpm format:check
pnpm build
```
