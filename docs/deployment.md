# Despliegue e Infraestructura

## Modelo de Infraestructura

La aplicacion es estatica:

- No necesita API.
- No necesita base de datos.
- No necesita autenticacion.
- No necesita workers ni colas.
- No escribe en servidor durante runtime.

El unico requisito de infraestructura es servir estos archivos por HTTP:

- `index.html`
- `styles.css`
- `dist/**/*.js`
- `scrapped.json`
- opcionalmente `banner-data/inventory.json` y docs/datos auxiliares

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

`pnpm start` ejecuta `pnpm build` antes de servir.

El server incluido en `scripts/serve.mjs` sirve desde la raiz del repo y bloquea path traversal. Es suficiente para uso local o LAN privada. Para internet/publico conviene usar un servidor estatico dedicado.

## Despliegue Estatico

Para desplegar en cualquier hosting estatico, ejecutar:

```powershell
pnpm install
pnpm approve-builds --all
pnpm build
```

Luego publicar estos paths:

```text
index.html
styles.css
dist/
scrapped.json
banner-data/inventory.json   opcional
```

Tambien puedes publicar todo el repo excepto:

```text
node_modules/
.git/
```

## Netlify, Vercel, Cloudflare Pages o Similar

Configuracion generica:

- Install command: `pnpm install`
- Build command: `pnpm build`
- Publish directory: `.`

Nota: como el publish directory es la raiz, configurar ignores/excludes si el proveedor permite evitar subir `node_modules`, `.git`, datos crudos no necesarios o archivos internos.

## Docker Opcional

No hay Dockerfile actualmente. Si se necesita contenedor, basta un build multi-stage:

1. Stage Node: `pnpm install`, `pnpm build`.
2. Stage nginx/caddy: copiar `index.html`, `styles.css`, `dist/`, `scrapped.json`.

No hace falta proceso Node en runtime si se usa nginx/caddy.

## Variables de Entorno

Solo aplican al server local incluido:

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

## Checks de Release

Antes de publicar:

```powershell
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

Verificar manualmente:

- La pagina abre.
- `scrapped.json` carga.
- Importar inventario funciona.
- Exportar inventario descarga JSON.
- Modo oscuro persiste.
- Los equipos cercanos muestran score y faltantes.

## Consideraciones de Seguridad

- La app procesa JSON local/en navegador; no envia datos a terceros.
- `scripts/serve.mjs` no debe usarse como edge/public server endurecido.
- Si se expone en internet, usar hosting estatico administrado o servidor web robusto.
- No publicar inventarios personales si contienen datos que no quieres compartir.
