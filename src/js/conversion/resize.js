(function (global) {
  'use strict';

  var Hormi = global.Hormi;

  /**
   * Limita un valor numerico entre dos extremos.
   *
   * @param {number} value Valor de entrada.
   * @param {number} min Valor minimo.
   * @param {number} max Valor maximo.
   * @returns {number} Valor acotado.
   */
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Convierte un valor a entero positivo dentro del rango admitido.
   *
   * @param {number|string} value Valor de entrada.
   * @param {number} fallback Valor usado si la entrada no es valida.
   * @returns {number} Entero positivo.
   */
  function positiveInteger(value, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number) || number <= 0) {
      return fallback;
    }
    return clamp(Math.round(number), 1, 8192);
  }

  /**
   * Calcula el tamano de salida segun las opciones de resolucion.
   *
   * @param {{width:number,height:number}} imageData Imagen de origen.
   * @param {object} options Opciones de exportacion.
   * @returns {{width:number,height:number}} Dimensiones de salida.
   */
  function targetSize(imageData, options) {
    var settings = options || {};
    var mode = settings.resizeMode || 'exact';
    var width = imageData.width;
    var height = imageData.height;

    if (mode === 'percent') {
      var percent = clamp(Number(settings.resizePercent) || 100, 1, 800) / 100;
      return {
        width: positiveInteger(width * percent, width),
        height: positiveInteger(height * percent, height)
      };
    }

    if (mode === 'width') {
      var targetWidth = positiveInteger(settings.resizeWidth, width);
      return {
        width: targetWidth,
        height: positiveInteger((targetWidth / width) * height, height)
      };
    }

    if (mode === 'height') {
      var targetHeight = positiveInteger(settings.resizeHeight, height);
      return {
        width: positiveInteger((targetHeight / height) * width, width),
        height: targetHeight
      };
    }

    return {
      width: positiveInteger(settings.resizeWidth, width),
      height: positiveInteger(settings.resizeHeight, height)
    };
  }

  /**
   * Copia un pixel RGBA entre buffers.
   *
   * @param {Uint8ClampedArray} target Buffer destino.
   * @param {number} targetOffset Posicion destino.
   * @param {Uint8ClampedArray|Uint8Array} source Buffer origen.
   * @param {number} sourceOffset Posicion origen.
   * @returns {void}
   */
  function copyPixel(target, targetOffset, source, sourceOffset) {
    target[targetOffset] = source[sourceOffset];
    target[targetOffset + 1] = source[sourceOffset + 1];
    target[targetOffset + 2] = source[sourceOffset + 2];
    target[targetOffset + 3] = source[sourceOffset + 3];
  }

  /**
   * Redimensiona una imagen con vecino mas cercano.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen origen.
   * @param {number} width Ancho de salida.
   * @param {number} height Alto de salida.
   * @returns {{width:number,height:number,data:Uint8ClampedArray}} Imagen redimensionada.
   */
  function resizeNearest(imageData, width, height) {
    var out = new Uint8ClampedArray(width * height * 4);
    for (var y = 0; y < height; y += 1) {
      var sourceY = Math.min(imageData.height - 1, Math.floor(((y + 0.5) * imageData.height) / height));
      for (var x = 0; x < width; x += 1) {
        var sourceX = Math.min(imageData.width - 1, Math.floor(((x + 0.5) * imageData.width) / width));
        copyPixel(
          out,
          ((y * width) + x) * 4,
          imageData.data,
          ((sourceY * imageData.width) + sourceX) * 4
        );
      }
    }
    return { width: width, height: height, data: out };
  }

  /**
   * Mezcla dos valores de color.
   *
   * @param {number} a Primer valor.
   * @param {number} b Segundo valor.
   * @param {number} amount Peso del segundo valor.
   * @returns {number} Valor interpolado.
   */
  function lerp(a, b, amount) {
    return a + ((b - a) * amount);
  }

  /**
   * Lee un canal con coordenadas acotadas.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen origen.
   * @param {number} x Coordenada X.
   * @param {number} y Coordenada Y.
   * @param {number} channel Canal RGBA.
   * @returns {number} Valor del canal.
   */
  function sampleChannel(imageData, x, y, channel) {
    var sourceX = clamp(x, 0, imageData.width - 1);
    var sourceY = clamp(y, 0, imageData.height - 1);
    return imageData.data[((sourceY * imageData.width) + sourceX) * 4 + channel];
  }

  /**
   * Redimensiona una imagen con interpolacion bilineal.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen origen.
   * @param {number} width Ancho de salida.
   * @param {number} height Alto de salida.
   * @returns {{width:number,height:number,data:Uint8ClampedArray}} Imagen redimensionada.
   */
  function resizeSmooth(imageData, width, height) {
    var out = new Uint8ClampedArray(width * height * 4);
    var scaleX = imageData.width / width;
    var scaleY = imageData.height / height;

    for (var y = 0; y < height; y += 1) {
      var sourceY = ((y + 0.5) * scaleY) - 0.5;
      var y0 = Math.floor(sourceY);
      var y1 = y0 + 1;
      var amountY = sourceY - y0;
      for (var x = 0; x < width; x += 1) {
        var sourceX = ((x + 0.5) * scaleX) - 0.5;
        var x0 = Math.floor(sourceX);
        var x1 = x0 + 1;
        var amountX = sourceX - x0;
        var target = ((y * width) + x) * 4;

        for (var channel = 0; channel < 4; channel += 1) {
          var top = lerp(
            sampleChannel(imageData, x0, y0, channel),
            sampleChannel(imageData, x1, y0, channel),
            amountX
          );
          var bottom = lerp(
            sampleChannel(imageData, x0, y1, channel),
            sampleChannel(imageData, x1, y1, channel),
            amountX
          );
          out[target + channel] = Math.round(lerp(top, bottom, amountY));
        }
      }
    }

    return { width: width, height: height, data: out };
  }

  /**
   * Crea un canvas desde ImageData si el navegador esta disponible.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @returns {HTMLCanvasElement|null} Canvas creado o null fuera del navegador.
   */
  function canvasFromImageData(imageData) {
    if (!global.document || !global.ImageData) {
      return null;
    }
    var canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(
      new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height),
      0,
      0
    );
    return canvas;
  }

  /**
   * Redimensiona ImageData usando el filtro elegido.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen origen.
   * @param {object} options Opciones de exportacion.
   * @returns {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} Imagen procesada.
   */
  function resizeImageData(imageData, options) {
    var size = targetSize(imageData, options);
    if (size.width === imageData.width && size.height === imageData.height) {
      return imageData;
    }
    if ((options || {}).resizeFilter === 'nearest') {
      return resizeNearest(imageData, size.width, size.height);
    }
    return resizeSmooth(imageData, size.width, size.height);
  }

  /**
   * Aplica el redimensionado comun a un raster cargado.
   *
   * @param {object} raster Imagen cargada.
   * @param {object} options Opciones de exportacion.
   * @returns {object} Raster original o redimensionado.
   */
  function applyResize(raster, options) {
    if (!raster || !raster.imageData || !options || options.keepResolution !== false) {
      return raster;
    }

    var imageData = resizeImageData(raster.imageData, options);
    if (imageData === raster.imageData) {
      return raster;
    }

    var canvas = canvasFromImageData(imageData);
    return Object.assign({}, raster, {
      width: imageData.width,
      height: imageData.height,
      imageData: imageData,
      canvas: canvas || raster.canvas
    });
  }

  Hormi.Conversion.Resize = {
    apply: applyResize,
    resizeImageData: resizeImageData,
    resizeNearest: resizeNearest,
    resizeSmooth: resizeSmooth,
    targetSize: targetSize
  };
}(globalThis));
