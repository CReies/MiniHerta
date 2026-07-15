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
  domain/                    Reglas y modelos puros
    catalog.ts
    inventory.ts
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
      runs-repository.ts
  ui/                         Presentación DOM
    app-view-controller.ts
    bosses.ts
    dom.ts
    inventory.ts
    render.ts
    results.ts
    theme.ts
  main.ts                     Composition root
```

## Dominio

El dominio contiene funciones puras y no depende de DOM, `localStorage`, `fetch` ni archivos:

- `normalize.ts` transforma entradas externas en entidades `Run`.
- `catalog.ts` construye el catálogo y resuelve rareza y assets.
- `inventory.ts` crea, valida, reconcilia y serializa inventarios.
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

El inventario se clona antes de actualizar sus `Map`, por lo que una vista o prueba nunca observa mutaciones retroactivas de un estado anterior. El estado reúne runs, catálogo, inventario, filtros, búsquedas y estado de carga/error.

## Infraestructura

- `LocalStorageInventoryRepository` adapta `localStorage` al puerto de inventario.
- `HttpRunsRepository` adapta cualquier endpoint JSON al puerto de runs.
- `createDefaultRunsRepositories` configura el JSON local y la API remota como fallback.
- `BrowserJsonFileGateway` encapsula lectura y descarga de archivos del navegador.

Los fallos de una fuente de runs no contaminan el caso de uso: la aplicación intenta el siguiente repositorio configurado y solo publica un error cuando todos fallan.

## Presentación

`AppViewController` conecta eventos DOM con comandos de aplicación y se suscribe al store. Los renders reciben datos y callbacks; no persisten datos ni modifican directamente el inventario.

`main.ts` funciona únicamente como composition root: instancia el store, los adaptadores, la aplicación y el controlador de vista.

## Build y pruebas

`scripts/build.mjs` descubre recursivamente los archivos TypeScript bajo `src/` y conserva su estructura en `dist/`. Añadir una clase o módulo ya no requiere modificar el script de build.

Las pruebas cubren tanto reglas de dominio como límites arquitectónicos: scoring, emisiones del store, inmutabilidad de inventario, fallback de repositorios y persistencia de comandos.

Comandos de validación:

```powershell
pnpm check
pnpm lint
pnpm test
pnpm format:check
```
