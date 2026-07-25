# Despliegue e Infraestructura

## Modelo de Infraestructura

La aplicacion es estatica:

- No necesita API.
- No necesita base de datos.
- No necesita autenticacion.
- No necesita workers ni colas.
- No escribe en servidor durante runtime.

Astro genera un sitio cerrado en `dist/`. El unico requisito de infraestructura es servir ese directorio por HTTP:

- `dist/index.html`
- `dist/_astro/`
- `dist/assets/`
- `dist/runs/`

## Desarrollo Local

Instalar:

```powershell
pnpm install
pnpm approve-builds --all
```

Servidor dev con rebuild automatico:

```powershell
pnpm start:dev
```

Cambiar puerto:

```powershell
$env:PORT="8123"; pnpm start:dev
```

Cambiar host:

```powershell
$env:HOST="0.0.0.0"; pnpm start:dev
```

## Produccion Local

```powershell
pnpm build
pnpm start
```

`pnpm start` ejecuta `pnpm build` antes de servir. El build genera el manifiesto `runs/index.json`, ejecuta Astro/Vite y copia las imagenes y colecciones necesarias a `dist/`.

El server incluido en `scripts/serve.mjs` sirve exclusivamente `dist/` y bloquea path traversal. Es suficiente para uso local o LAN privada. Para internet/publico conviene usar un servidor estatico dedicado.

## Despliegue Estatico

Para desplegar en cualquier hosting estatico, ejecutar:

```powershell
pnpm install
pnpm approve-builds --all
pnpm build
```

Luego publicar unicamente:

```text
dist/
```

No es necesario copiar archivos fuente, `node_modules/`, datasets fuera de `dist/` ni utilidades del repositorio.

## Netlify, Vercel, Cloudflare Pages o Similar

Configuracion generica:

- Install command: `pnpm install`
- Build command: `pnpm build`
- Publish directory: `dist`

Astro usa `/` como base por defecto. Si el proveedor publica bajo un subpath, definir `ASTRO_BASE` con ese prefijo y `ASTRO_SITE` con el origen publico.

## GitHub Pages

El workflow `.github/workflows/pages.yml` deriva la configuracion desde el repositorio:

```text
ASTRO_BASE=/${repo name}
ASTRO_SITE=https://${owner}.github.io
```

Con esas variables Astro genera enlaces validos bajo `https://${owner}.github.io/${repo name}/`. El workflow sube `dist/` directamente como artefacto de Pages; no crea un segundo directorio ni reescribe HTML o imports despues del build.

## Docker Opcional

No hay Dockerfile actualmente. Si se necesita contenedor, basta un build multi-stage:

1. Stage Node: `pnpm install`, `pnpm build`.
2. Stage nginx/caddy: copiar el contenido de `dist/` al document root.

No hace falta proceso Node en runtime si se usa nginx/caddy.

## Variables de Entorno

Variables del build:

| Variable     | Default | Uso                                                                |
| ------------ | ------- | ------------------------------------------------------------------ |
| `ASTRO_BASE` | `/`     | Prefijo publico cuando el sitio se aloja bajo un subpath.          |
| `ASTRO_SITE` | vacio   | Origen publico usado para URLs canonicas y metadatos de la pagina. |

Variables del server local incluido:

| Variable | Default     | Uso                 |
| -------- | ----------- | ------------------- |
| `PORT`   | `8000`      | Puerto HTTP         |
| `HOST`   | `127.0.0.1` | Interfaz de escucha |

Ejemplo:

```powershell
$env:PORT="8123"
$env:HOST="0.0.0.0"
pnpm start
```

Ejemplo de build para un repositorio de GitHub Pages:

```powershell
$env:ASTRO_BASE="/TheHerta"
$env:ASTRO_SITE="https://owner.github.io"
pnpm build
```

## Checks de Release

Antes de publicar:

```powershell
pnpm check
pnpm build
```

Verificar manualmente:

- La pagina abre desde la raiz o el subpath configurado.
- `dist/runs/index.json` indexa las colecciones; el cliente carga la versión de juego más nueva y solicita las demás al cambiar filtros.
- Los bundles bajo `dist/_astro/` y las imagenes bajo `dist/assets/` responden correctamente.
- Importar inventario funciona.
- Exportar inventario descarga JSON.
- Los equipos cercanos muestran score y faltantes.

## Consideraciones de Seguridad

- La app procesa JSON local/en navegador; no envia datos a terceros.
- `scripts/serve.mjs` no debe usarse como edge/public server endurecido.
- Si se expone en internet, usar hosting estatico administrado o servidor web robusto.
- No publicar inventarios personales si contienen datos que no quieres compartir.
