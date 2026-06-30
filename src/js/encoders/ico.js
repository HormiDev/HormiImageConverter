(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;

  /**
   * Redimensiona ImageData con vecino mas cercano.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen origen.
   * @param {number} width Ancho de salida.
   * @param {number} height Alto de salida.
   * @returns {{width:number,height:number,data:Uint8ClampedArray}} Imagen redimensionada.
   */
  function resizeNearest(imageData, width, height) {
    var out = new Uint8ClampedArray(width * height * 4);
    for (var y = 0; y < height; y += 1) {
      var sourceY = Math.min(imageData.height - 1, Math.floor((y / height) * imageData.height));
      for (var x = 0; x < width; x += 1) {
        var sourceX = Math.min(imageData.width - 1, Math.floor((x / width) * imageData.width));
        var source = ((sourceY * imageData.width) + sourceX) * 4;
        var target = ((y * width) + x) * 4;
        out[target] = imageData.data[source];
        out[target + 1] = imageData.data[source + 1];
        out[target + 2] = imageData.data[source + 2];
        out[target + 3] = imageData.data[source + 3];
      }
    }
    return { width: width, height: height, data: out };
  }

  /**
   * Calcula las dimensiones que puede declarar un ICO.
   *
   * @param {{width:number,height:number}} imageData Imagen origen.
   * @param {object} settings Opciones de salida.
   * @returns {{width:number,height:number}} Dimensiones del icono.
   */
  function iconSize(imageData, settings) {
    if (settings.size && settings.size !== 'source') {
      var rawSquare = Number(settings.size || 64);
      var square = Number.isFinite(rawSquare) ? Math.round(Math.max(16, Math.min(256, rawSquare))) : 64;
      return { width: square, height: square };
    }

    if (imageData.width <= 256 && imageData.height <= 256) {
      return { width: imageData.width, height: imageData.height };
    }

    var scale = Math.min(256 / imageData.width, 256 / imageData.height);
    return {
      width: Math.max(1, Math.round(imageData.width * scale)),
      height: Math.max(1, Math.round(imageData.height * scale))
    };
  }

  /**
   * Crea el bloque DIB BGRA de un icono.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen de icono.
   * @returns {Uint8Array} Bytes DIB para ICO.
   */
  function makeIconDib(imageData) {
    var width = imageData.width;
    var height = imageData.height;
    var xorBytes = width * height * 4;
    var maskStride = Math.ceil(width / 32) * 4;
    var maskBytes = maskStride * height;
    var out = new Uint8Array(40 + xorBytes + maskBytes);
    var offset = 0;

    offset = Binary.writeU32LE(out, offset, 40);
    offset = Binary.writeU32LE(out, offset, width);
    offset = Binary.writeU32LE(out, offset, height * 2);
    offset = Binary.writeU16LE(out, offset, 1);
    offset = Binary.writeU16LE(out, offset, 32);
    offset = Binary.writeU32LE(out, offset, 0);
    offset = Binary.writeU32LE(out, offset, xorBytes + maskBytes);
    offset = Binary.writeU32LE(out, offset, 2835);
    offset = Binary.writeU32LE(out, offset, 2835);
    offset = Binary.writeU32LE(out, offset, 0);
    Binary.writeU32LE(out, offset, 0);

    for (var y = 0; y < height; y += 1) {
      var sourceY = height - 1 - y;
      for (var x = 0; x < width; x += 1) {
        var source = ((sourceY * width) + x) * 4;
        var target = 40 + ((y * width) + x) * 4;
        out[target] = imageData.data[source + 2];
        out[target + 1] = imageData.data[source + 1];
        out[target + 2] = imageData.data[source];
        out[target + 3] = imageData.data[source + 3];
      }
    }

    return out;
  }

  /**
   * Codifica una imagen como ICO de una sola resolucion.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @param {object} options Opciones de salida.
   * @returns {Uint8Array} Bytes ICO.
   */
  function encodeIco(imageData, options) {
    var settings = options || {};
    var size = iconSize(imageData, settings);
    var icon = size.width === imageData.width && size.height === imageData.height
      ? imageData
      : resizeNearest(imageData, size.width, size.height);
    var dib = makeIconDib(icon);
    var out = new Uint8Array(6 + 16 + dib.length);
    var offset = 0;

    offset = Binary.writeU16LE(out, offset, 0);
    offset = Binary.writeU16LE(out, offset, 1);
    offset = Binary.writeU16LE(out, offset, 1);
    out[offset] = icon.width === 256 ? 0 : icon.width;
    out[offset + 1] = icon.height === 256 ? 0 : icon.height;
    out[offset + 2] = 0;
    out[offset + 3] = 0;
    offset += 4;
    offset = Binary.writeU16LE(out, offset, 1);
    offset = Binary.writeU16LE(out, offset, 32);
    offset = Binary.writeU32LE(out, offset, dib.length);
    offset = Binary.writeU32LE(out, offset, 22);
    out.set(dib, 22);
    return out;
  }

  Hormi.Encoders.Ico = {
    encode: encodeIco
  };
}(globalThis));
