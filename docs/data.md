# Datos e Inventario

## Fuentes de Datos

`scrapped.json`

- Dataset principal de runs.
- La app toma runs con `subcategory = "0-Cycle"` o `metric_value = 0`.
- Cada run contiene hasta cuatro personajes y cuatro light cones.
- Tambien alimenta el catalogo runtime de items. El catalogo cruza esos nombres con assets generados, rarezas y labels preparados para traducciones futuras.

`banner-data/*.txt`

- Exports crudos de banners.
- Se conservan intactos.

`banner-data/cleaned/*.tsv`

- Copias limpias generadas desde los TXT.
- Formato tabular con columnas `source`, `roll`, `item`, `pity`, `time`.

`banner-data/inventory.json`

- Inventario generado desde los banners.
- Compatible con el importador de la app.

## Regenerar Inventario Desde Banners

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File banner-data\build-inventory.ps1
```

El script:

- Lee `characters.txt`, `lightcones.txt`, `initial.txt` y `perma.txt`.
- Quita encabezados y lineas vacias.
- Interpreta cada registro como tres lineas: roll, item, pity+time.
- Crea TSV limpios en `banner-data/cleaned/`.
- Crea `banner-data/inventory.json`.
- Valida conteos esperados.

## Formato de Inventario

```json
{
  "version": 1,
  "exportedAt": "2026-06-14T00:00:00.000Z",
  "characters": {
    "Acheron": 0,
    "Serval": 6
  },
  "lightCones": {
    "Swordplay": 1,
    "Boundless Choreo": 5
  }
}
```

Personajes:

- `0` significa E0.
- Maximo `6`.

Light cones:

- `1` significa S1.
- Maximo `5`.

## Reglas de Conteo Desde Banners

Personajes:

- 1 copia = E0.
- Cada copia repetida suma 1 eidolon.
- Maximo E6.
- Formula: `eidolon = min(copies - 1, 6)`.

Light cones:

- 1 copia = S1.
- Cada copia repetida suma 1 superimposicion.
- Maximo S5.
- Formula: `superimp = min(copies, 5)`.

Todos los banners cuentan juntos. Los personajes que salen en banners de conos o permanente se cuentan como personajes.

## Importar y Exportar En La App

La app acepta inventarios con estas claves:

- `characters`
- `personajes`
- `lightCones`
- `light_cones`
- `conos`

Al importar:

- Se descartan personajes/conos que no existan en el catalogo construido desde los runs cargados.
- Se ajustan valores fuera de rango.
- Se guarda el resultado en `localStorage`.

Al exportar:

- Se descarga un JSON `herta-inventario-YYYY-MM-DD.json`.
- El JSON usa `characters` y `lightCones`.

## Conteos Actuales Esperados

Con los archivos actuales de `banner-data/`:

- 52 personajes unicos.
- 47 light cones unicos.
- 120 copias de personajes procesadas.
- 147 copias de light cones procesadas.
- 1 personaje queda E6.
- 11 light cones quedan S5.

Si estos numeros cambian despues de actualizar banners, revisar las validaciones de `banner-data/build-inventory.ps1`.
