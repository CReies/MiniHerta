# Arquitectura

## Resumen

La aplicacion es una SPA estatica con TypeScript modular. No usa backend: carga datos JSON desde archivos locales servidos por HTTP, mantiene estado en memoria y persiste el inventario del usuario en `localStorage`.

Aunque `astro` esta instalado para una migracion futura, la app actual se sirve como HTML/CSS/JS estatico. El build propio usa `node:module.stripTypeScriptTypes` para transformar TypeScript a JavaScript en `dist/`.

## Capas

```text
index.html
styles.css
src/main.ts
  app/
    json-file.ts
    results.ts
    state.ts
  domain/
    catalog.ts
    inventory.ts
    normalize.ts
    scoring.ts
    types.ts
  ui/
    bosses.ts
    dom.ts
    inventory.ts
    render.ts
    results.ts
    theme.ts
  utils/
    text.ts
dist/
```

`src/main.ts`

- Hace bootstrap de la app.
- Conecta eventos DOM con acciones de aplicacion.
- No contiene reglas de dominio, parsing de archivos ni detalles de render.

## Aplicacion

`src/app/state.ts`

- Mantiene la forma del estado runtime.
- Crea estado inicial, reemplaza runs, reemplaza/reset inventory y reconcilia inventario contra catalogo.

`src/app/results.ts`

- Selecciona resultados visibles desde estado + filtros.
- Encapsula evaluacion, filtrado por busqueda/modo y ordenamiento.

`src/app/json-file.ts`

- Lee JSON remoto/local.
- Centraliza importacion desde `<input type="file">`.
- Centraliza descarga de JSON.

## Dominio

`src/domain/normalize.ts`

- Convierte cada entrada cruda de `scrapped.json` en `Run`.
- Filtra runs `0-Cycle` o con `metric_value = 0`.
- Normaliza nombres, boss, autor, video, eidolons y superimposiciones.

`src/domain/inventory.ts`

- Define carga, importacion, exportacion y persistencia del inventario.
- Soporta claves `characters`, `personajes`, `lightCones`, `light_cones` y `conos`.
- Limita personajes a `E0-E6` y light cones a `S1-S5`.

`src/domain/catalog.ts`

- Construye el catalogo de personajes y light cones a partir de los runs cargados.
- Centraliza metadatos de items: tipo, nombre canonico, labels localizables, rareza y asset.
- Usa `src/generated/assets.ts` como manifiesto generado de imagenes disponibles.
- Todo lo que no esta en las listas 4 estrellas se considera 5 estrellas para scoring.

`src/domain/scoring.ts`

- Evalua cada run contra el inventario.
- Calcula faltantes y `missingScore`.
- Aplica filtros, modo de resultado y ordenamiento.
- Consulta rarezas en el catalogo, no en listas duplicadas.

## Scoring de Cercania

Los equipos cercanos ya no se ordenan por cantidad simple de faltantes, sino por costo estimado:

| Falta                                     |         Score |
| ----------------------------------------- | ------------: |
| Personaje 4 estrellas nuevo               |            20 |
| Eidolon de personaje 4 estrellas          |  30 por nivel |
| Personaje 5 estrellas nuevo               |           100 |
| Eidolon de personaje 5 estrellas          | 135 por nivel |
| Light cone 4 estrellas nuevo              |            10 |
| Superimposicion de light cone 4 estrellas |  16 por nivel |
| Light cone 5 estrellas nuevo              |            70 |
| Superimposicion de light cone 5 estrellas |  90 por nivel |

Un run es "cercano" si `missingScore <= 220`. Un run es "posible" si `missingScore === 0`.

Estas reglas reflejan:

- Los 4 estrellas son mas faciles de conseguir que 5 estrellas.
- Un light cone cuesta menos que un personaje.
- Obtener un item nuevo es mejor que perseguir dupes/eidolons/superimposiciones.

## UI

`src/ui/render.ts`

- Fachada pequena que reexporta renders especificos.

`src/ui/bosses.ts`

- Renderiza opciones del filtro de boss.

`src/ui/inventory.ts`

- Renderiza listas de personajes y light cones.
- Encapsula creacion de filas, imagenes, selects y eventos por item.

`src/ui/results.ts`

- Renderiza contadores, cards de runs, miembros y chips de faltantes.

`src/ui/dom.ts`

- Centraliza el acceso a elementos DOM.
- Lee filtros actuales desde controles.

`src/ui/theme.ts`

- Maneja modo claro/oscuro.
- Persiste preferencia en `localStorage`.

## Build

`scripts/build.mjs` transforma los archivos TypeScript listados explicitamente en `dist/`.

Importante: si se agrega un nuevo archivo `.ts`, hay que agregarlo a la lista `sources` de `scripts/build.mjs` o migrar a un bundler formal como Vite/Astro.

## Estado

`src/app/state.ts` mantiene el estado de runtime:

- `runs`: runs normalizados.
- `catalog`: personajes y light cones unicos presentes en runs, con metadatos centralizados.
- `inventory`: inventario actual del usuario.

El inventario se guarda bajo la clave `herta-0cycle-inventory-v1`.
El tema se guarda bajo la clave `herta-0cycle-theme-v1`.
