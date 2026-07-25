# The Herta 0-Cycle Finder

Aplicacion local para cruzar runs 0-cycle de Honkai: Star Rail contra tu inventario real de personajes, eidolons, light cones y superimposiciones.

La app carga inicialmente la colección más recientemente actualizada de `runs/` y solicita las demás bajo demanda al cambiar el endgame o la versión. También permite importar/exportar inventario, calcula equipos posibles y ordena equipos cercanos con un scoring ponderado por dificultad de obtener personajes/conos.

## Quick Start

Requisitos:

- Windows PowerShell
- Node.js disponible para `pnpm`
- `pnpm` 11+

Instalar dependencias:

```powershell
pnpm install
pnpm approve-builds --all
```

Build:

```powershell
pnpm build
```

Servir en modo normal:

```powershell
pnpm start
```

Modo desarrollo con rebuild automatico:

```powershell
pnpm start:dev
```

Por defecto sirve en `http://127.0.0.1:8000/index.html`.

Si el puerto esta ocupado:

```powershell
$env:PORT="8123"; pnpm start
$env:PORT="8123"; pnpm start:dev
```

## Scripts

- `pnpm build`: transpila `src/**/*.ts` a `dist/**/*.js`.
- `pnpm start`: ejecuta build y sirve los archivos estaticos.
- `pnpm start:dev`: ejecuta build inicial, sirve la app y recompila al cambiar `src/`, `index.html` o `styles.css`.
- `pnpm typecheck`: valida TypeScript sin emitir archivos.
- `pnpm lint`: corre ESLint.
- `pnpm format`: aplica Prettier.
- `pnpm format:check`: valida formato.
- `pnpm runs:download`: descarga del archivo oficial las colecciones soportadas en `runs/`. Acepta filtros por versión, modo y boss; consulta [Descarga de runs](docs/data.md#descarga-de-runs).
- `pnpm assets:download`: completa los assets de todas las colecciones en `runs/` y regenera su manifiesto.

## Documentacion

- [Arquitectura](docs/architecture.md)
- [Despliegue e infraestructura](docs/deployment.md)
- [Datos e inventario](docs/data.md)

## Archivos Importantes

- `index.html`: shell HTML de la app.
- `styles.css`: estilos globales, modo claro y modo oscuro.
- `src/`: codigo fuente TypeScript.
- `dist/`: JavaScript generado por `pnpm build`.
- `runs/`: datasets de runs organizados por modo y temporada.
- `banner-data/`: exports crudos de banners, TSV limpios e inventario generado.
- `scripts/`: build, server local, modo dev y utilidades.

## Estado Actual

La app no requiere backend ni base de datos. Todo corre en el navegador y persiste el inventario en `localStorage`. El servidor Node incluido solo sirve archivos estaticos para desarrollo/local hosting.
