(function (global) {
  'use strict';

  var MultiFormatImageConverter = global.MultiFormatImageConverter;

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
    if (MultiFormatImageConverter.Conversion.Resize) {
      return MultiFormatImageConverter.Conversion.Resize.apply(raster, options);
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
    var format = MultiFormatImageConverter.Formats.byId(formatId);
    if (!format) {
      throw new Error('Formato no registrado: ' + formatId);
    }

    var settings = Object.assign({}, options || {}, {
      mime: format.mime
    });

    var prepared = preparedRaster(raster, settings);

    if (format.encoder === 'native') {
      return MultiFormatImageConverter.Encoders.Native.encode(prepared, settings);
    }
    if (format.encoder === 'gif') {
      return blobFromBytes(MultiFormatImageConverter.Encoders.Gif.encode(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'bmp') {
      return blobFromBytes(MultiFormatImageConverter.Encoders.Bmp.encode(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'ico') {
      return blobFromBytes(MultiFormatImageConverter.Encoders.Ico.encode(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'tiff') {
      return blobFromBytes(MultiFormatImageConverter.Encoders.Tiff.encode(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'tga') {
      return blobFromBytes(MultiFormatImageConverter.Encoders.Tga.encode(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'qoi') {
      return blobFromBytes(MultiFormatImageConverter.Encoders.Qoi.encode(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'ppm') {
      return blobFromBytes(MultiFormatImageConverter.Encoders.Netpbm.encodePpm(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'pgm') {
      return blobFromBytes(MultiFormatImageConverter.Encoders.Netpbm.encodePgm(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'pbm') {
      return blobFromBytes(MultiFormatImageConverter.Encoders.Netpbm.encodePbm(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'xpm') {
      return blobFromBytes(MultiFormatImageConverter.Encoders.Xpm.encode(imageDataOf(prepared), settings), format.mime);
    }
    if (format.encoder === 'svg') {
      return MultiFormatImageConverter.Encoders.Svg.encode(prepared, settings);
    }

    throw new Error('Codificador no implementado: ' + format.encoder);
  }

  MultiFormatImageConverter.Encoders.encode = encode;
}(globalThis));
