# Codificadores propios

## Binarios

Los helpers de `src/js/core/binary.js` escriben enteros little-endian y big-endian, concatenan buffers y convierten texto/base64.

## Paletas

`src/js/core/palette.js` aplica cuantizacion por corte mediano para `GIF` y `XPM`. La busqueda de color usa distancia RGB cuadratica.

## ZIP

`src/js/zip/zip.js` genera ZIP con metodo `store`, sin compresion. Esto evita dependencias y mantiene compatibilidad con visores ZIP comunes.

## Redimensionado

`src/js/conversion/resize.js` aplica el cambio de resolucion antes de llamar al codificador final. Soporta dimensiones exactas, ancho proporcional, alto proporcional, porcentaje, filtro suavizado bilineal y filtro de vecino mas cercano para pixel art.

## Formatos implementados

- `BMP`: BITMAPINFOHEADER de 40 bytes, 24 o 32 bits, sin compresion.
- `GIF`: GIF89a estatico o animado, tabla global y LZW compatible con reinicios.
- `ICO`: contenedor ICO con un DIB BGRA de una resolucion, tamano actual o cuadrado.
- `TIFF`: baseline little-endian, RGB/RGBA, DPI configurable, sin compresion.
- `TGA`: true-color sin compresion, origen superior o inferior.
- `QOI`: Quite OK Image con canal alfa.
- `PPM/PGM/PBM`: familia Netpbm en ASCII o binario.
- `XPM`: C-style con tabla de colores y nombre de variable configurable.
- `SVG raster`: SVG con PNG embebido como data URI.
