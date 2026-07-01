(function (global) {
  'use strict';

  var MultiFormatImageConverter = global.MultiFormatImageConverter;

  /**
   * Crea un elemento con clase CSS.
   *
   * @param {string} tag Etiqueta HTML.
   * @param {string} className Clase CSS.
   * @returns {HTMLElement} Elemento creado.
   */
  function element(tag, className) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    return node;
  }

  /**
   * Traduce una etiqueta de opcion.
   *
   * @param {object} item Definicion con clave de traduccion.
   * @returns {string} Etiqueta visible.
   */
  function labelText(item) {
    return MultiFormatImageConverter.I18n.t(item.labelKey, null, item.label);
  }

  /**
   * Aplica un valor ya elegido a un control recien renderizado.
   *
   * @param {HTMLElement} control Control contenedor.
   * @param {object} option Definicion de opcion.
   * @param {object} values Valores previos.
   * @returns {void}
   */
  function restoreValue(control, option, values) {
    var input;
    var output;
    if (!values || !Object.prototype.hasOwnProperty.call(values, option.id)) {
      return;
    }
    input = control.querySelector('[data-option-id="' + option.id + '"]');
    if (!input) {
      return;
    }
    if (input.dataset.optionType === 'boolean') {
      input.checked = Boolean(values[option.id]);
    } else {
      input.value = values[option.id];
    }
    output = control.querySelector('output');
    if (output) {
      output.value = input.value;
    }
  }

  /**
   * Crea un input numerico tipo rango con lectura visible.
   *
   * @param {object} option Definicion de opcion.
   * @returns {HTMLElement} Control creado.
   */
  function rangeControl(option) {
    var wrap = element('label', 'option-row option-row--range');
    var span = element('span', 'option-label');
    var value = element('output', 'option-value');
    var input = document.createElement('input');
    input.type = 'range';
    input.min = option.min;
    input.max = option.max;
    input.step = option.step;
    input.value = option.default;
    input.dataset.optionId = option.id;
    input.dataset.optionType = 'number';
    value.value = input.value;
    input.addEventListener('input', function () {
      value.value = input.value;
    });
    span.textContent = labelText(option);
    wrap.append(span, input, value);
    return wrap;
  }

  /**
   * Crea un input numerico compacto.
   *
   * @param {object} option Definicion de opcion.
   * @returns {HTMLElement} Control creado.
   */
  function numberControl(option) {
    var wrap = element('label', 'option-row');
    var span = element('span', 'option-label');
    var input = document.createElement('input');
    span.textContent = labelText(option);
    input.type = 'number';
    input.min = option.min;
    input.max = option.max;
    input.step = option.step || 1;
    input.value = option.default;
    input.dataset.optionId = option.id;
    input.dataset.optionType = 'number';
    wrap.append(span, input);
    return wrap;
  }

  /**
   * Crea un input de color.
   *
   * @param {object} option Definicion de opcion.
   * @returns {HTMLElement} Control creado.
   */
  function colorControl(option) {
    var wrap = element('label', 'option-row option-row--color');
    var span = element('span', 'option-label');
    var input = document.createElement('input');
    span.textContent = labelText(option);
    input.type = 'color';
    input.value = option.default;
    input.dataset.optionId = option.id;
    input.dataset.optionType = 'string';
    wrap.append(span, input);
    return wrap;
  }

  /**
   * Crea un selector desplegable.
   *
   * @param {object} option Definicion de opcion.
   * @returns {HTMLElement} Control creado.
   */
  function selectControl(option) {
    var wrap = element('label', 'option-row');
    var span = element('span', 'option-label');
    var select = document.createElement('select');
    span.textContent = labelText(option);
    select.dataset.optionId = option.id;
    select.dataset.optionType = 'string';
    option.choices.forEach(function (choice) {
      var item = document.createElement('option');
      item.value = choice.value;
      item.textContent = labelText(choice);
      select.appendChild(item);
    });
    select.value = option.default;
    wrap.append(span, select);
    return wrap;
  }

  /**
   * Crea una casilla de verificacion.
   *
   * @param {object} option Definicion de opcion.
   * @returns {HTMLElement} Control creado.
   */
  function checkboxControl(option) {
    var wrap = element('label', 'option-row option-row--check');
    var input = document.createElement('input');
    var span = element('span', 'option-label');
    input.type = 'checkbox';
    input.checked = Boolean(option.default);
    input.dataset.optionId = option.id;
    input.dataset.optionType = 'boolean';
    span.textContent = labelText(option);
    wrap.append(input, span);
    return wrap;
  }

  /**
   * Crea una caja de texto corta.
   *
   * @param {object} option Definicion de opcion.
   * @returns {HTMLElement} Control creado.
   */
  function textControl(option) {
    var wrap = element('label', 'option-row');
    var span = element('span', 'option-label');
    var input = document.createElement('input');
    span.textContent = labelText(option);
    input.type = 'text';
    input.value = option.default || '';
    input.dataset.optionId = option.id;
    input.dataset.optionType = 'string';
    wrap.append(span, input);
    return wrap;
  }

  /**
   * Crea el control HTML adecuado para una opcion.
   *
   * @param {object} option Definicion de opcion.
   * @returns {HTMLElement} Control creado.
   */
  function optionControl(option, values) {
    var control;
    if (option.type === 'range') {
      control = rangeControl(option);
    } else if (option.type === 'number') {
      control = numberControl(option);
    } else if (option.type === 'color') {
      control = colorControl(option);
    } else if (option.type === 'select') {
      control = selectControl(option);
    } else if (option.type === 'checkbox') {
      control = checkboxControl(option);
    } else {
      control = textControl(option);
    }

    if (option.dependsOn) {
      control.dataset.dependsId = option.dependsOn.id;
      control.dataset.dependsValue = String(option.dependsOn.value);
    }
    restoreValue(control, option, values);
    return control;
  }

  /**
   * Lee el valor actual de un control segun su tipo.
   *
   * @param {HTMLElement} input Control de opcion.
   * @returns {string|boolean|number} Valor actual.
   */
  function inputValue(input) {
    if (input.dataset.optionType === 'boolean') {
      return input.checked;
    }
    if (input.dataset.optionType === 'number') {
      return Number(input.value);
    }
    return input.value;
  }

  /**
   * Actualiza visibilidad de controles condicionados.
   *
   * @param {HTMLElement} container Contenedor de opciones.
   * @returns {void}
   */
  function updateDependencies(container) {
    container.querySelectorAll('[data-depends-id]').forEach(function (row) {
      var controller = container.querySelector('[data-option-id="' + row.dataset.dependsId + '"]');
      var expected = row.dataset.dependsValue;
      var visible = controller && String(inputValue(controller)) === expected;
      row.hidden = !visible;
    });
  }

  /**
   * Conecta eventos para desplegar opciones dependientes.
   *
   * @param {HTMLElement} container Contenedor de opciones.
   * @returns {void}
   */
  function bindOptionDependencies(container) {
    if (container.dataset.dependenciesBound === 'true') {
      updateDependencies(container);
      return;
    }
    container.dataset.dependenciesBound = 'true';
    container.addEventListener('input', function () {
      updateDependencies(container);
    });
    container.addEventListener('change', function () {
      updateDependencies(container);
    });
    updateDependencies(container);
  }

  /**
   * Renderiza las opciones del formato seleccionado.
   *
   * @param {HTMLElement} container Contenedor destino.
   * @param {object} format Formato seleccionado.
   * @param {object} values Valores previos.
   * @returns {void}
   */
  function renderFormatOptions(container, format, values) {
    container.replaceChildren();
    if (!format.options.length) {
      var empty = element('p', 'empty-options');
      empty.textContent = MultiFormatImageConverter.I18n.t('options.empty');
      container.appendChild(empty);
      return;
    }
    format.options.forEach(function (option) {
      container.appendChild(optionControl(option, values));
    });
    bindOptionDependencies(container);
  }

  /**
   * Lee las opciones actuales del formulario.
   *
   * @param {HTMLElement} container Contenedor de opciones.
   * @returns {object} Opciones serializadas.
   */
  function readOptions(container) {
    var values = {};
    container.querySelectorAll('[data-option-id]').forEach(function (input) {
      var id = input.dataset.optionId;
      var type = input.dataset.optionType;
      if (type === 'boolean') {
        values[id] = input.checked;
      } else if (type === 'number') {
        values[id] = Number(input.value);
      } else {
        values[id] = input.value;
      }
    });
    return values;
  }

  MultiFormatImageConverter.UI.Options = {
    readOptions: readOptions,
    renderFormatOptions: renderFormatOptions
  };
}(globalThis));
