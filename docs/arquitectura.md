# Arquitectura

## Estructura

```text
src/
  index.html
  css/
    styles.css
  js/
    app.js
    core/
    conversion/
    encoders/
    formats/
    importers/
    ui/
    zip/
tests/
docs/
```

## Flujo

1. `app.js` recibe archivos desde input o drag and drop.
2. `conversion/file-loader.js` carga cada archivo.
3. Los importadores propios decodifican formatos no nativos cuando aplica.
4. El navegador decodifica el resto en un `canvas`.
5. `formats/catalog.js` define formato, extension, MIME y opciones.
6. `conversion/resize.js` mantiene o cambia la resolucion antes de exportar.
7. `encoders/registry.js` llama al codificador adecuado.
8. `conversion/converter.js` nombra salidas, genera ZIP y descarga.

## Convenciones

- Cada modulo se registra bajo `window.MultiFormatImageConverter`.
- Se usan scripts clasicos para permitir apertura directa con `file://`.
- Los archivos se mantienen pequenos por responsabilidad.
- Las funciones publicas y auxiliares tienen comentarios en espanol con argumentos y retorno.
