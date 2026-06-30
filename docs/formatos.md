# Formatos soportados

## Exportacion

| Formato | Motor | Opciones |
| --- | --- | --- |
| PNG | Canvas nativo | Resolucion, aplanar alfa, fondo |
| JPG | Canvas nativo | Resolucion, calidad, fondo para alfa |
| WebP | Canvas nativo | Resolucion, calidad, aplanar alfa, fondo |
| AVIF | Canvas nativo | Resolucion, calidad, aplanar alfa, fondo |
| GIF | Codificador propio | Resolucion, colores de paleta, modo animado/individual, transparencia, umbral alfa, FPS, bucle, lienzo, ajuste |
| BMP | Codificador propio | Resolucion, 24/32 bits, fondo para alfa |
| ICO | Codificador propio | Resolucion, tamano actual o cuadrado de icono |
| TIFF | Codificador propio | Resolucion, aplanar alfa o preservar canal alfa, DPI |
| TGA | Codificador propio | Resolucion, 24/32 bits, origen superior/inferior, fondo para alfa |
| QOI | Codificador propio | Resolucion, espacio de color |
| PPM | Codificador propio | Resolucion, binario P6 o ASCII P3, fondo |
| PGM | Codificador propio | Resolucion, binario P5 o ASCII P2, fondo |
| PBM | Codificador propio | Resolucion, binario P4 o ASCII P1, umbral, fondo |
| XPM | Codificador propio | Resolucion, colores de paleta, transparencia, variable C |
| SVG raster | Codificador propio + PNG nativo | Resolucion, titulo, aplanar alfa, fondo |

Todas las exportaciones muestran `Mantener resolucion original` marcado por defecto. Al desmarcarlo se despliegan ancho, alto, porcentaje y filtro de escala. El filtro `Suavizado` usa interpolacion bilineal y `Pixel art` usa vecino mas cercano.

## Importacion

La aplicacion intenta primero importadores propios para:

- `BMP` sin compresion de 24/32 bits.
- `TGA` sin compresion de 8/24/32 bits.
- `QOI`.
- `PPM`, `PGM`, `PBM` en variantes ASCII y binarias de 8 bits.
- `XPM` C-style basico.

Si no hay importador propio aplicable, usa el decodificador del navegador mediante `createImageBitmap` o `HTMLImageElement`.

## Limitaciones previstas

- `GIF` puede exportar un fotograma estatico o una animacion cuando se cargan varias imagenes.
- `ICO` conserva la resolucion de entrada si cabe en el limite del formato; si supera 256 px por lado se reduce proporcionalmente.
- `TIFF` se escribe sin compresion para mantener el codigo local y legible.
- `XPM` reconoce colores hexadecimales y algunos nombres basicos.
- `PPM/PGM/PBM` se limitan a muestras de 8 bits.
