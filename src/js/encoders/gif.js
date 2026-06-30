(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;
  var Color = Hormi.Core.Color;
  var Palette = Hormi.Core.Palette;

  /**
   * Calcula el numero de bits necesario para una tabla de color.
   *
   * @param {number} tableSize Tamano de tabla.
   * @returns {number} Bits necesarios.
   */
  function colorDepth(tableSize) {
    return Math.max(1, Math.ceil(Math.log(tableSize) / Math.log(2)));
  }

  /**
   * Prepara una paleta GIF para una o varias imagenes.
   *
   * @param {object[]} imageDatas Imagenes RGBA.
   * @param {object} options Opciones de salida.
   * @returns {{palette:object[],transparentIndex:number|null,tableSize:number}} Paleta GIF.
   */
  function buildGifPalette(imageDatas, options) {
    var settings = options || {};
    var useTransparency = Boolean(settings.transparency);
    var alphaThreshold = Number(settings.alphaThreshold || 1);
    var maxColors = Math.max(2, Math.min(256, Number(settings.colors || 128)));
    var visualLimit = useTransparency ? maxColors - 1 : maxColors;
    var totalPixels = imageDatas.reduce(function (total, imageData) {
      return total + (imageData.width * imageData.height);
    }, 0);
    var sample = new Uint8ClampedArray(totalPixels * 4);
    var offset = 0;

    imageDatas.forEach(function (imageData) {
      sample.set(imageData.data, offset);
      offset += imageData.data.length;
    });

    var visualPalette = Palette.quantize({
      width: totalPixels,
      height: 1,
      data: sample
    }, visualLimit, alphaThreshold);
    var palette = useTransparency ? [{ r: 0, g: 0, b: 0 }].concat(visualPalette) : visualPalette;
    var tableSize = Palette.paletteTableSize(Math.max(2, palette.length));

    while (palette.length < tableSize) {
      palette.push({ r: 0, g: 0, b: 0 });
    }

    return {
      palette: palette,
      transparentIndex: useTransparency ? 0 : null,
      tableSize: tableSize
    };
  }

  /**
   * Indexa una imagen RGBA contra una paleta GIF.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @param {object} paletteInfo Paleta preparada.
   * @param {object} options Opciones de transparencia.
   * @returns {Uint8Array} Pixeles indexados.
   */
  function indexGifImage(imageData, paletteInfo, options) {
    var settings = options || {};
    var useTransparency = paletteInfo.transparentIndex !== null;
    var alphaThreshold = Number(settings.alphaThreshold || 1);
    var visualPalette = useTransparency ? paletteInfo.palette.slice(1) : paletteInfo.palette;
    var transparentOffset = useTransparency ? 1 : 0;
    var pixels = new Uint8Array(imageData.width * imageData.height);

    for (var i = 0; i < pixels.length; i += 1) {
      var source = i * 4;
      if (useTransparency && imageData.data[source + 3] < alphaThreshold) {
        pixels[i] = paletteInfo.transparentIndex;
      } else {
        pixels[i] = Palette.nearestColorIndex(
          imageData.data[source],
          imageData.data[source + 1],
          imageData.data[source + 2],
          visualPalette
        ) + transparentOffset;
      }
    }

    return pixels;
  }

  /**
   * Crea un escritor de bits little-endian para LZW GIF.
   *
   * @returns {{write:Function,finish:Function}} Escritor de bits.
   */
  function bitWriter() {
    var bytes = [];
    var current = 0;
    var bitCount = 0;

    return {
      write: function (code, size) {
        current |= code << bitCount;
        bitCount += size;
        while (bitCount >= 8) {
          bytes.push(current & 0xff);
          current >>>= 8;
          bitCount -= 8;
        }
      },
      finish: function () {
        if (bitCount > 0) {
          bytes.push(current & 0xff);
        }
        return new Uint8Array(bytes);
      }
    };
  }

  /**
   * Convierte pixeles indexados en flujo LZW GIF.
   *
   * Usa una variante sin crecimiento de diccionario: emite CLEAR antes de cada
   * pixel. Es mas grande, pero extremadamente compatible y evita desajustes
   * de tamano de codigo entre navegadores y visores.
   *
   * @param {Uint8Array} pixels Pixeles indexados.
   * @param {number} minCodeSize Tamano minimo LZW.
   * @returns {Uint8Array} Datos LZW empaquetados.
   */
  function lzwEncode(pixels, minCodeSize) {
    var clearCode = 1 << minCodeSize;
    var endCode = clearCode + 1;
    var codeSize = minCodeSize + 1;
    var writer = bitWriter();

    for (var i = 0; i < pixels.length; i += 1) {
      writer.write(clearCode, codeSize);
      writer.write(pixels[i], codeSize);
    }

    writer.write(endCode, codeSize);
    return writer.finish();
  }

  /**
   * Divide datos GIF en subbloques de 255 bytes.
   *
   * @param {Uint8Array} bytes Datos de entrada.
   * @returns {Uint8Array[]} Subbloques con terminador.
   */
  function dataSubBlocks(bytes) {
    var parts = [];
    for (var i = 0; i < bytes.length; i += 255) {
      var chunk = bytes.subarray(i, i + 255);
      var block = new Uint8Array(1 + chunk.length);
      block[0] = chunk.length;
      block.set(chunk, 1);
      parts.push(block);
    }
    parts.push(new Uint8Array([0]));
    return parts;
  }

  /**
   * Crea la cabecera logica de pantalla GIF.
   *
   * @param {number} width Ancho.
   * @param {number} height Alto.
   * @returns {Uint8Array} Descriptor logico.
   */
  function logicalScreen(width, height, paletteInfo) {
    var depth = colorDepth(paletteInfo.tableSize);
    var logical = new Uint8Array(7);
    Binary.writeU16LE(logical, 0, width);
    Binary.writeU16LE(logical, 2, height);
    logical[4] = 0x80 | ((depth - 1) << 4) | (depth - 1);
    logical[5] = 0;
    logical[6] = 0;
    return logical;
  }

  /**
   * Crea una tabla de color GIF desde una paleta RGB.
   *
   * @param {object[]} palette Paleta RGB.
   * @returns {Uint8Array} Tabla de color.
   */
  function colorTable(palette) {
    var table = new Uint8Array(palette.length * 3);
    for (var i = 0; i < palette.length; i += 1) {
      table[i * 3] = palette[i].r;
      table[(i * 3) + 1] = palette[i].g;
      table[(i * 3) + 2] = palette[i].b;
    }
    return table;
  }

  /**
   * Crea la extension grafica de control para un fotograma.
   *
   * @param {number|null} transparentIndex Indice transparente.
   * @param {number} delayCs Retardo en centesimas de segundo.
   * @param {number} disposal Metodo de disposicion.
   * @returns {Uint8Array} Bloque GCE.
   */
  function graphicControl(transparentIndex, delayCs, disposal) {
    var hasTransparency = transparentIndex !== null;
    var packed = ((disposal || 0) & 0x07) << 2;
    if (hasTransparency) {
      packed |= 1;
    }
    return new Uint8Array([
      0x21,
      0xf9,
      0x04,
      packed,
      delayCs & 0xff,
      (delayCs >>> 8) & 0xff,
      hasTransparency ? transparentIndex : 0,
      0
    ]);
  }

  /**
   * Crea el descriptor de imagen GIF.
   *
   * @param {number} width Ancho.
   * @param {number} height Alto.
   * @returns {Uint8Array} Descriptor de imagen.
   */
  function imageDescriptor(width, height) {
    var descriptor = new Uint8Array(10);
    descriptor[0] = 0x2c;
    Binary.writeU16LE(descriptor, 5, width);
    Binary.writeU16LE(descriptor, 7, height);
    descriptor[9] = 0;
    return descriptor;
  }

  /**
   * Crea la extension Netscape de bucle para GIF animado.
   *
   * @param {number} loopCount Numero de repeticiones, 0 infinito.
   * @returns {Uint8Array} Bloque de extension.
   */
  function loopExtension(loopCount) {
    var loop = Math.max(0, Math.min(65535, Number(loopCount) || 0));
    return new Uint8Array([
      0x21, 0xff, 0x0b,
      0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30,
      0x03, 0x01, loop & 0xff, (loop >>> 8) & 0xff, 0x00
    ]);
  }

  /**
   * Normaliza FPS a centesimas GIF.
   *
   * @param {number|string} value Fotogramas por segundo.
   * @returns {number} Retardo en centesimas.
   */
  function fpsCentiseconds(value) {
    var fps = Math.max(1, Math.min(60, Number(value) || 10));
    return Math.max(1, Math.min(65535, Math.round(100 / fps)));
  }

  /**
   * Codifica los bloques de un fotograma GIF.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @param {object} paletteInfo Paleta preparada.
   * @param {object} options Opciones de salida.
   * @param {boolean} forceControl Fuerza extension GCE.
   * @returns {Uint8Array[]} Bloques del fotograma.
   */
  function encodeFrame(imageData, paletteInfo, options, forceControl) {
    var settings = options || {};
    var pixels = indexGifImage(imageData, paletteInfo, settings);
    var minCodeSize = Math.max(2, colorDepth(paletteInfo.tableSize));
    var lzw = lzwEncode(pixels, minCodeSize);
    var parts = [];
    var delay = Number(settings.delayCs || 0);
    var disposal = Number(settings.disposal || 0);

    if (forceControl || paletteInfo.transparentIndex !== null || delay > 0) {
      parts.push(graphicControl(paletteInfo.transparentIndex, delay, disposal));
    }
    parts.push(
      imageDescriptor(imageData.width, imageData.height),
      new Uint8Array([minCodeSize])
    );
    return parts.concat(dataSubBlocks(lzw));
  }

  /**
   * Codifica una imagen como GIF89a de un fotograma.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @param {object} options Opciones de salida.
   * @returns {Uint8Array} Bytes GIF.
   */
  function encodeGif(imageData, options) {
    var paletteInfo = buildGifPalette([imageData], options);
    var parts = [
      Binary.asciiBytes('GIF89a'),
      logicalScreen(imageData.width, imageData.height, paletteInfo),
      colorTable(paletteInfo.palette)
    ];
    parts = parts.concat(encodeFrame(imageData, paletteInfo, options, false));
    parts.push(new Uint8Array([0x3b]));
    return Binary.concatBytes(parts);
  }

  /**
   * Calcula el tamano del lienzo para una animacion.
   *
   * @param {object[]} rasters Imagenes de origen.
   * @param {object} options Opciones de animacion.
   * @returns {{width:number,height:number}} Tamano final.
   */
  function animationSize(rasters, options) {
    var settings = options || {};
    var mode = settings.canvasMode || 'largest';
    if (mode === 'first') {
      return { width: rasters[0].width, height: rasters[0].height };
    }
    if (mode === 'custom') {
      return {
        width: Math.max(1, Math.min(4096, Number(settings.frameWidth) || rasters[0].width)),
        height: Math.max(1, Math.min(4096, Number(settings.frameHeight) || rasters[0].height))
      };
    }
    return rasters.reduce(function (size, raster) {
      return {
        width: Math.max(size.width, raster.width),
        height: Math.max(size.height, raster.height)
      };
    }, { width: 1, height: 1 });
  }

  /**
   * Calcula el rectangulo de dibujo de un fotograma.
   *
   * @param {object} imageData Imagen de origen.
   * @param {number} width Ancho de lienzo.
   * @param {number} height Alto de lienzo.
   * @param {string} fitMode Modo de ajuste.
   * @returns {{x:number,y:number,width:number,height:number}} Rectangulo destino.
   */
  function frameRect(imageData, width, height, fitMode) {
    var mode = fitMode || 'contain';
    var scale = 1;
    if (mode === 'stretch') {
      return { x: 0, y: 0, width: width, height: height };
    }
    if (mode === 'contain') {
      scale = Math.min(width / imageData.width, height / imageData.height);
    } else if (mode === 'cover') {
      scale = Math.max(width / imageData.width, height / imageData.height);
    }
    var drawWidth = Math.max(1, Math.round(imageData.width * scale));
    var drawHeight = Math.max(1, Math.round(imageData.height * scale));
    return {
      x: Math.floor((width - drawWidth) / 2),
      y: Math.floor((height - drawHeight) / 2),
      width: drawWidth,
      height: drawHeight
    };
  }

  /**
   * Dibuja un fotograma RGBA sobre un lienzo comun.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen de origen.
   * @param {number} width Ancho de lienzo.
   * @param {number} height Alto de lienzo.
   * @param {object} options Opciones de ajuste.
   * @returns {{width:number,height:number,data:Uint8ClampedArray}} Fotograma compuesto.
   */
  function composeFrame(imageData, width, height, options) {
    var settings = options || {};
    var background = Color.parseHexColor(settings.background || '#ffffff');
    var keepAlpha = Boolean(settings.transparency);
    var out = new Uint8ClampedArray(width * height * 4);
    var rect = frameRect(imageData, width, height, settings.fitMode);

    for (var i = 0; i < width * height; i += 1) {
      var target = i * 4;
      Color.setPixel(out, target, background.r, background.g, background.b, keepAlpha ? 0 : 255);
    }

    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        var relX = (x - rect.x) / rect.width;
        var relY = (y - rect.y) / rect.height;
        if (relX < 0 || relY < 0 || relX >= 1 || relY >= 1) {
          continue;
        }
        var sourceX = Math.min(imageData.width - 1, Math.floor(relX * imageData.width));
        var sourceY = Math.min(imageData.height - 1, Math.floor(relY * imageData.height));
        var source = ((sourceY * imageData.width) + sourceX) * 4;
        var targetOffset = ((y * width) + x) * 4;
        if (keepAlpha) {
          Color.setPixel(
            out,
            targetOffset,
            imageData.data[source],
            imageData.data[source + 1],
            imageData.data[source + 2],
            imageData.data[source + 3]
          );
        } else {
          var pixel = Color.flattenPixel(imageData.data, source, background);
          Color.setPixel(out, targetOffset, pixel.r, pixel.g, pixel.b, 255);
        }
      }
    }

    return { width: width, height: height, data: out };
  }

  /**
   * Codifica varias imagenes como GIF animado.
   *
   * @param {object[]} rasters Imagenes cargadas.
   * @param {object} options Opciones de animacion.
   * @returns {Uint8Array} Bytes GIF animado.
   */
  function encodeAnimation(rasters, options) {
    if (!rasters.length) {
      throw new Error('No hay fotogramas para animar');
    }
    var settings = options || {};
    var size = animationSize(rasters, settings);
    var frames = rasters.map(function (raster) {
      return composeFrame(raster.imageData, size.width, size.height, settings);
    });
    var paletteInfo = buildGifPalette(frames, settings);
    var frameOptions = Object.assign({}, settings, {
      delayCs: fpsCentiseconds(settings.fps),
      disposal: 2
    });
    var parts = [
      Binary.asciiBytes('GIF89a'),
      logicalScreen(size.width, size.height, paletteInfo),
      colorTable(paletteInfo.palette),
      loopExtension(settings.loop)
    ];

    for (var i = 0; i < frames.length; i += 1) {
      parts = parts.concat(encodeFrame(
        frames[i],
        paletteInfo,
        frameOptions,
        true
      ));
    }

    parts.push(new Uint8Array([0x3b]));
    return Binary.concatBytes(parts);
  }

  Hormi.Encoders.Gif = {
    encode: encodeGif,
    encodeAnimation: encodeAnimation
  };
}(globalThis));
