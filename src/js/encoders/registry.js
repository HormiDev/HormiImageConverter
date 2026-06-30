(function (global) {
  'use strict';

  var Hormi = global.Hormi;

  /**
   * Crea un Blob desde bytes con su tipo MIME.
   *
   * @param {Uint8Array} bytes Bytes codificados.
   * @param {string} mime Tipo MIME.
   * @returns {Blob} Blob de salida.
   */
  function blobFromBytes(bytes, mime) {
    return new Blob([bytes], { type: mime || 'application/octet-stream' });
  }

  /**
   * Devuelve los ImageData asociados a un raster.
   *
   * @param {object} raster Imagen cargada.
   * @returns {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} Datos RGBA.
   */
  function imageDataOf(raster) {
    return raster.imageData;
  }

  /**
   * Prepara un raster antes de codificarlo.
   *
   * @param {object} raster Imagen cargada.
   * @param {object} options Opciones de exportacion.
   * @returns {object} Raster procesado.
   */
  function preparedRaster(raster, options) {
    if (Hormi.Conversion.Resize) {
      return Hormi.Conversion.Resize.apply(raster, options);
    }
    return raster;
  }

  /**
   * Codifica una imagen usando el formato elegido.
   *
   * @param {string} formatId Identificador de formato.
   * @param {object} raster Imagen cargada.
   * @param {object} options Opciones de exportacion.
   * @returns {Promise<Blob>} Blob codificado.
   */
  async function encode(formatId, raster, options) {
    var format = Hormi.Formats.byId(formatId);
    if (!format) {
      throw new Error('Formato no registrado: ' + formatId);
    }

    var settings = Object.assign({}, options || {}, {
      mime: format.mime
    });

    var prepared = preparedRaster(raster, settings);

    if (format.encoder === 'native') {
      return Hormi.Encoders.Native.encode(prepared, settings);
    }
    if (format.encoder === 'gif') {
      return blobFromBytes(Hormi.Encoders.Gif.encode(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'bmp') {
      return blobFromBytes(Hormi.Encoders.Bmp.encode(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'ico') {
      return blobFromBytes(Hormi.Encoders.Ico.encode(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'tiff') {
      return blobFromBytes(Hormi.Encoders.Tiff.encode(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'tga') {
      return blobFromBytes(Hormi.Encoders.Tga.encode(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'qoi') {
      return blobFromBytes(Hormi.Encoders.Qoi.encode(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'ppm') {
      return blobFromBytes(Hormi.Encoders.Netpbm.encodePpm(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'pgm') {
      return blobFromBytes(Hormi.Encoders.Netpbm.encodePgm(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'pbm') {
      return blobFromBytes(Hormi.Encoders.Netpbm.encodePbm(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'xpm') {
      return blobFromBytes(Hormi.Encoders.Xpm.encode(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'svg') {
      return Hormi.Encoders.Svg.encode(prepared, settings);
    }

    throw new Error('Codificador no implementado: ' + format.encoder);
  }

  Hormi.Encoders.encode = encode;
}(globalThis));
