# The Herta 0-Cycle Finder

Aplicacion local para cruzar runs 0-cycle de Honkai: Star Rail contra tu inventario real de personajes, eidolons, light cones y superimposiciones.

La app carga inicialmente la versión de juego más nueva disponible en `runs/` y solicita las demás bajo demanda al cambiar el endgame o la versión. También permite importar/exportar inventario, calcula equipos posibles y ordena equipos cercanos con un scoring ponderado por dificultad de obtener personajes/conos.

## Quick Start

Requisitos:

- Windows PowerShell
- Node.js 22.12 o superior
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

Por defecto sirve en `http://127.0.0.1:8000/`.

Si el puerto esta ocupado:

```powershell
$env:PORT="8123"; pnpm start
$env:PORT="8123"; pnpm start:dev
```

## Scripts

- `pnpm build`: genera `runs/index.json`, construye la pagina con Astro/Vite y copia `assets/` y `runs/` al directorio cerrado `dist/`.
- `pnpm start`: ejecuta el build y sirve exclusivamente `dist/`.
- `pnpm start:dev`: ejecuta un build inicial, sirve `dist/` y recompila al cambiar `src/`, `runs/`, `styles.css` o `astro.config.mjs`.
- `pnpm typecheck`: valida el TypeScript del cliente sin emitir archivos.
- `pnpm typecheck:scripts`: valida los scripts Node del build y las utilidades.
- `pnpm astro:check`: valida las paginas y layouts de Astro.
- `pnpm check`: ejecuta typecheck, Astro check, lint, pruebas y validación de formato.
- `pnpm test`: transpila los modulos TypeScript a `.test-dist/` y ejecuta las pruebas de Node.
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

- `src/pages/index.astro`: pagina estatica y shell HTML de la app.
- `src/layouts/BaseLayout.astro`: layout base, metadatos y carga de estilos.
- `styles.css`: estilos globales y tema oscuro.
- `src/main.ts`: entrypoint del cliente y composition root.
- `src/`: paginas Astro y codigo fuente TypeScript.
- `dist/`: sitio estatico completo generado por `pnpm build`; es el unico directorio que se publica.
- `runs/`: datasets de runs organizados por modo y temporada.
- `banner-data/`: exports crudos de banners, TSV limpios e inventario generado.
- `scripts/`: build, server local, modo dev y utilidades.

## Estado Actual

La app no requiere backend ni base de datos. Astro genera el HTML estatico y Vite empaqueta el cliente; en runtime todo corre en el navegador y el inventario persiste en `localStorage`. El servidor Node incluido solo sirve `dist/` para desarrollo o hosting local.
