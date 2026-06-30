(function (global) {
  'use strict';

  var Hormi = global.Hormi;

  /**
   * Crea una opcion de calidad comun para formatos con perdida.
   *
   * @param {number} value Valor inicial.
   * @returns {object} Definicion de opcion.
   */
  function qualityOption(value) {
    return {
      id: 'quality',
      label: 'Calidad',
      type: 'range',
      min: 0.1,
      max: 1,
      step: 0.05,
      default: value
    };
  }

  /**
   * Crea una opcion de color de fondo para aplanar alfa.
   *
   * @returns {object} Definicion de opcion.
   */
  function backgroundOption() {
    return {
      id: 'background',
      label: 'Fondo para alfa',
      type: 'color',
      default: '#ffffff'
    };
  }

  /**
   * Crea una opcion para aplanar el canal alfa.
   *
   * @param {boolean} value Valor inicial.
   * @returns {object} Definicion de opcion.
   */
  function flattenAlphaOption(value) {
    return {
      id: 'flattenAlpha',
      label: 'Aplanar transparencia',
      type: 'checkbox',
      default: Boolean(value)
    };
  }

  /**
   * Crea las opciones comunes de resolucion de exportacion.
   *
   * @returns {object[]} Definiciones de opciones.
   */
  function resolutionOptions() {
    var whenUnlocked = { id: 'keepResolution', value: false };
    return [
      {
        id: 'keepResolution',
        label: 'Mantener resolucion original',
        type: 'checkbox',
        default: true
      },
      {
        id: 'resizeMode',
        label: 'Modo de resolucion',
        type: 'select',
        default: 'exact',
        dependsOn: whenUnlocked,
        choices: [
          { value: 'exact', label: 'Ancho y alto exactos' },
          { value: 'width', label: 'Ancho proporcional' },
          { value: 'height', label: 'Alto proporcional' },
          { value: 'percent', label: 'Por porcentaje' }
        ]
      },
      {
        id: 'resizeWidth',
        label: 'Ancho',
        type: 'number',
        min: 1,
        max: 8192,
        step: 1,
        default: 1024,
        dependsOn: whenUnlocked
      },
      {
        id: 'resizeHeight',
        label: 'Alto',
        type: 'number',
        min: 1,
        max: 8192,
        step: 1,
        default: 1024,
        dependsOn: whenUnlocked
      },
      {
        id: 'resizePercent',
        label: 'Porcentaje',
        type: 'number',
        min: 1,
        max: 800,
        step: 1,
        default: 100,
        dependsOn: whenUnlocked
      },
      {
        id: 'resizeFilter',
        label: 'Filtro de escala',
        type: 'select',
        default: 'smooth',
        dependsOn: whenUnlocked,
        choices: [
          { value: 'smooth', label: 'Suavizado' },
          { value: 'nearest', label: 'Pixel art' }
        ]
      }
    ];
  }

  /**
   * Anteponer las opciones comunes a las opciones de formato.
   *
   * @param {object[]} options Opciones especificas.
   * @returns {object[]} Opciones completas.
   */
  function exportOptions(options) {
    return resolutionOptions().concat(options || []);
  }

  /**
   * Crea una opcion de tabla de colores.
   *
   * @param {number} value Valor inicial.
   * @param {number} max Valor maximo.
   * @returns {object} Definicion de opcion.
   */
  function colorsOption(value, max) {
    return {
      id: 'colors',
      label: 'Colores de paleta',
      type: 'range',
      min: 2,
      max: max || 256,
      step: 1,
      default: value
    };
  }

  /**
   * Crea una opcion para activar transparencia indexada.
   *
   * @returns {object} Definicion de opcion.
   */
  function transparencyOption() {
    return {
      id: 'transparency',
      label: 'Transparencia',
      type: 'checkbox',
      default: true
    };
  }

  /**
   * Crea una opcion de umbral de alfa.
   *
   * @returns {object} Definicion de opcion.
   */
  function alphaThresholdOption() {
    return {
      id: 'alphaThreshold',
      label: 'Umbral alfa',
      type: 'range',
      min: 0,
      max: 255,
      step: 1,
      default: 8
    };
  }

  var formats = [
    {
      id: 'png',
      name: 'PNG',
      extension: 'png',
      mime: 'image/png',
      encoder: 'native',
      description: 'Sin perdida, alfa completo, ideal para capturas e interfaz.',
      options: exportOptions([flattenAlphaOption(false), backgroundOption()])
    },
    {
      id: 'jpeg',
      name: 'JPEG',
      extension: 'jpg',
      mime: 'image/jpeg',
      encoder: 'native',
      description: 'Con perdida, sin transparencia, recomendado para fotografia.',
      options: exportOptions([qualityOption(0.92), backgroundOption()])
    },
    {
      id: 'webp',
      name: 'WebP',
      extension: 'webp',
      mime: 'image/webp',
      encoder: 'native',
      description: 'Formato moderno con alfa y compresion eficiente.',
      options: exportOptions([qualityOption(0.9), flattenAlphaOption(false), backgroundOption()])
    },
    {
      id: 'avif',
      name: 'AVIF',
      extension: 'avif',
      mime: 'image/avif',
      encoder: 'native',
      description: 'Formato moderno con perdida; depende del navegador.',
      options: exportOptions([qualityOption(0.8), flattenAlphaOption(false), backgroundOption()])
    },
    {
      id: 'gif',
      name: 'GIF',
      extension: 'gif',
      mime: 'image/gif',
      encoder: 'gif',
      description: 'GIF89a estatico o animado con paleta indexada.',
      options: exportOptions([
        colorsOption(128, 256),
        transparencyOption(),
        alphaThresholdOption(),
        {
          id: 'gifMode',
          label: 'Salida con varias imagenes',
          type: 'select',
          default: 'animation',
          choices: [
            { value: 'animation', label: 'Un GIF animado' },
            { value: 'individual', label: 'GIF individuales' }
          ]
        },
        {
          id: 'fps',
          label: 'FPS',
          type: 'range',
          min: 1,
          max: 60,
          step: 1,
          default: 10
        },
        {
          id: 'loop',
          label: 'Bucle',
          type: 'select',
          default: '0',
          choices: [
            { value: '0', label: 'Infinito' },
            { value: '1', label: 'Una vez' },
            { value: '3', label: '3 repeticiones' },
            { value: '5', label: '5 repeticiones' },
            { value: '10', label: '10 repeticiones' }
          ]
        },
        {
          id: 'canvasMode',
          label: 'Lienzo animado',
          type: 'select',
          default: 'largest',
          choices: [
            { value: 'largest', label: 'Mayor imagen' },
            { value: 'first', label: 'Primera imagen' },
            { value: 'custom', label: 'Personalizado' }
          ]
        },
        {
          id: 'frameWidth',
          label: 'Ancho personalizado',
          type: 'range',
          min: 16,
          max: 4096,
          step: 1,
          default: 512
        },
        {
          id: 'frameHeight',
          label: 'Alto personalizado',
          type: 'range',
          min: 16,
          max: 4096,
          step: 1,
          default: 512
        },
        {
          id: 'fitMode',
          label: 'Ajuste de fotograma',
          type: 'select',
          default: 'contain',
          choices: [
            { value: 'contain', label: 'Encajar completo' },
            { value: 'cover', label: 'Cubrir y recortar' },
            { value: 'stretch', label: 'Estirar' },
            { value: 'center', label: 'Centrar sin escalar' }
          ]
        },
        backgroundOption()
      ])
    },
    {
      id: 'bmp',
      name: 'BMP',
      extension: 'bmp',
      mime: 'image/bmp',
      encoder: 'bmp',
      description: 'Mapa de bits Windows sin compresion.',
      options: exportOptions([
        {
          id: 'bitDepth',
          label: 'Profundidad',
          type: 'select',
          default: '24',
          choices: [
            { value: '24', label: '24 bits RGB' },
            { value: '32', label: '32 bits RGBA' }
          ]
        },
        backgroundOption()
      ])
    },
    {
      id: 'ico',
      name: 'ICO',
      extension: 'ico',
      mime: 'image/x-icon',
      encoder: 'ico',
      description: 'Icono Windows de una resolucion.',
      options: exportOptions([
        {
          id: 'size',
          label: 'Tamano ICO',
          type: 'select',
          default: 'source',
          choices: [{ value: 'source', label: 'Resolucion actual' }].concat(['16', '24', '32', '48', '64', '128', '256'].map(function (size) {
            return { value: size, label: size + ' x ' + size };
          }))
        }
      ])
    },
    {
      id: 'tiff',
      name: 'TIFF',
      extension: 'tiff',
      mime: 'image/tiff',
      encoder: 'tiff',
      description: 'TIFF baseline sin compresion.',
      options: exportOptions([
        {
          id: 'alphaMode',
          label: 'Alfa',
          type: 'select',
          default: 'flatten',
          choices: [
            { value: 'flatten', label: 'Aplanar contra fondo' },
            { value: 'preserve', label: 'Guardar canal alfa' }
          ]
        },
        {
          id: 'dpi',
          label: 'DPI',
          type: 'number',
          min: 1,
          max: 2400,
          step: 1,
          default: 72
        },
        backgroundOption()
      ])
    },
    {
      id: 'tga',
      name: 'TGA',
      extension: 'tga',
      mime: 'image/x-tga',
      encoder: 'tga',
      description: 'Targa sin compresion, util en pipelines graficos.',
      options: exportOptions([
        {
          id: 'bitDepth',
          label: 'Profundidad',
          type: 'select',
          default: '32',
          choices: [
            { value: '24', label: '24 bits RGB' },
            { value: '32', label: '32 bits RGBA' }
          ]
        },
        {
          id: 'origin',
          label: 'Origen',
          type: 'select',
          default: 'top',
          choices: [
            { value: 'top', label: 'Arriba izquierda' },
            { value: 'bottom', label: 'Abajo izquierda' }
          ]
        },
        backgroundOption()
      ])
    },
    {
      id: 'qoi',
      name: 'QOI',
      extension: 'qoi',
      mime: 'image/qoi',
      encoder: 'qoi',
      description: 'Quite OK Image, sin perdida y muy simple.',
      options: exportOptions([
        {
          id: 'colorspace',
          label: 'Espacio de color',
          type: 'select',
          default: 'srgb',
          choices: [
            { value: 'srgb', label: 'sRGB con alfa lineal' },
            { value: 'linear', label: 'Lineal' }
          ]
        }
      ])
    },
    {
      id: 'ppm',
      name: 'PPM',
      extension: 'ppm',
      mime: 'image/x-portable-pixmap',
      encoder: 'ppm',
      description: 'Portable Pixmap RGB.',
      options: exportOptions([
        { id: 'ascii', label: 'ASCII P3', type: 'checkbox', default: false },
        backgroundOption()
      ])
    },
    {
      id: 'pgm',
      name: 'PGM',
      extension: 'pgm',
      mime: 'image/x-portable-graymap',
      encoder: 'pgm',
      description: 'Portable Graymap en escala de grises.',
      options: exportOptions([
        { id: 'ascii', label: 'ASCII P2', type: 'checkbox', default: false },
        backgroundOption()
      ])
    },
    {
      id: 'pbm',
      name: 'PBM',
      extension: 'pbm',
      mime: 'image/x-portable-bitmap',
      encoder: 'pbm',
      description: 'Portable Bitmap monocromo.',
      options: exportOptions([
        { id: 'ascii', label: 'ASCII P1', type: 'checkbox', default: false },
        {
          id: 'threshold',
          label: 'Umbral blanco/negro',
          type: 'range',
          min: 0,
          max: 255,
          step: 1,
          default: 128
        },
        backgroundOption()
      ])
    },
    {
      id: 'xpm',
      name: 'XPM',
      extension: 'xpm',
      mime: 'image/x-xpixmap',
      encoder: 'xpm',
      description: 'Pixmap textual C-style con paleta.',
      options: exportOptions([
        colorsOption(32, 256),
        transparencyOption(),
        alphaThresholdOption(),
        {
          id: 'variableName',
          label: 'Variable C',
          type: 'text',
          default: 'hormi_image'
        }
      ])
    },
    {
      id: 'svg',
      name: 'SVG raster',
      extension: 'svg',
      mime: 'image/svg+xml',
      encoder: 'svg',
      description: 'SVG con la imagen PNG embebida en base64.',
      options: exportOptions([
        {
          id: 'title',
          label: 'Titulo',
          type: 'text',
          default: ''
        },
        flattenAlphaOption(false),
        backgroundOption()
      ])
    }
  ];

  /**
   * Busca un formato por identificador.
   *
   * @param {string} id Identificador de formato.
   * @returns {object|undefined} Definicion encontrada.
   */
  function byId(id) {
    return formats.find(function (format) {
      return format.id === id;
    });
  }

  /**
   * Lista todos los formatos exportables.
   *
   * @returns {object[]} Formatos disponibles.
   */
  function all() {
    return formats.slice();
  }

  Hormi.Formats = {
    all: all,
    byId: byId
  };
}(globalThis));
