# Pruebas

## Ejecutar

```sh
make test
```

Equivale a:

```sh
node tests/test-runner.mjs
```

## Cobertura actual

Las pruebas cargan los scripts clasicos en Node, generan una imagen RGBA pequena y validan:

- Round-trip exacto en `QOI`.
- Redimensionado comun antes de exportar con `QOI`.
- Round-trip exacto en `BMP` de 32 bits.
- Round-trip exacto en `TGA` de 32 bits.
- Origen inferior de `TGA`.
- Exportacion e importacion RGB en `PPM`.
- Importacion de dimensiones en `PGM`.
- Monocromo valido en `PBM`.
- Transparencia basica en `XPM`.
- Nombre de variable saneado en `XPM`.
- Flujo LZW, cabecera y cierre de `GIF`.
- GIF animado con varios fotogramas y lienzo comun.
- Agrupacion de varias imagenes como una unica animacion GIF desde el conversor.
- Directorio basico de `ICO` y resolucion actual por defecto.
- Cabecera baseline de `TIFF` y DPI configurable.
- Estructura local y central de `ZIP`.

## Pruebas manuales recomendadas

1. Abrir `src/index.html`.
2. Arrastrar varias imagenes reales.
3. Exportar a cada formato con ZIP activado.
4. Desmarcar `Mantener resolucion original` y probar escala exacta, proporcional y porcentaje.
5. Reimportar `BMP`, `TGA`, `QOI`, `PPM`, `PGM`, `PBM` y `XPM`.
6. Probar `PNG/JPG/WebP/AVIF` en el navegador objetivo.
