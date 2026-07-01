(function (global) {
  'use strict';

  /**
   * Crea el espacio de nombres global de la aplicacion.
   *
   * @returns {object} Objeto raiz compartido por todos los scripts.
   */
  function createNamespace() {
    return {
      Core: {},
      Encoders: {},
      Importers: {},
      Conversion: {},
      I18n: {},
      UI: {},
      Zip: {},
      Formats: {}
    };
  }

  global.MultiFormatImageConverter = global.MultiFormatImageConverter || createNamespace();
}(globalThis));
