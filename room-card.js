import { translations } from './translations.js';

// ============================================
// Editor
// ============================================
class RoomCardEditor extends HTMLElement {

  set hass(hass) {
    this._hass = hass;
    this.querySelectorAll('ha-entity-picker').forEach(el => {
      el.hass = hass;
    });
  }

  setConfig(config) {
    this.config = { ...config };
    this.render();
  }

  _valueChanged(key, value) {
    this.config = { ...this.config, [key]: value };
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }
  
  _t(key) {
    let lang = this.config.language;
    if (!lang || lang === 'auto') {
        lang = this._hass?.language?.startsWith('hu') ? 'hu' : 'en';
    }
    return translations[lang]?.[key] || translations['hu']?.[key] || key;
  }

  getThemeColor(cssVarName, fallbackColor = '#ffffff') {
    const styles = getComputedStyle(this);
    let color = styles.getPropertyValue(cssVarName).trim();
    if (!color) return fallbackColor;
    if (color.startsWith('rgb')) {
      const rgb = color.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        color = '#' + rgb.slice(0, 3).map(x => {
          const hex = parseInt(x).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');
      }
    }
    return color.startsWith('#') ? color : fallbackColor;
  }

  _activeTabSettings(index) {
    this._activeTab = index;
    this.querySelectorAll('.tab-content').forEach((el, i) => {
      el.style.display = i === index ? 'block' : 'none';
    });
    this.querySelectorAll('.tab-button').forEach((el, i) => {
      el.classList.toggle('tab-active', i === index);
    });
  }

  _updateDoorWindowList() {
    const list = this.querySelector('#door-window-list');
    if (!list) return;

    const entities = this.config.door_window_entities ?? [];
    list.innerHTML = '';

    entities.forEach((entityObj, index) => {
      const row = document.createElement('div');
      row.className = 'door-window-block';

      row.innerHTML = `
        <div class="door-window-row">
          <ha-selector class="door-window-selector" data-index="${index}"></ha-selector>
          <button class="delete-btn" data-index="${index}">
            <ha-icon icon="mdi:close" style="--mdc-icon-size:16px"></ha-icon>
          </button>
        </div>
        <div class="door-window-row">
          <ha-textfield
            class="door-window-name"
            data-index="${index}"
            placeholder="${this._t('custom_name')}"
            value="${entityObj.name ?? ''}"
            style="flex: 1;"
          ></ha-textfield>
          <ha-icon-picker
            class="door-window-icon"
            data-index="${index}"
            value="${entityObj.icon ?? ''}"
            style="width: 120px;"
          ></ha-icon-picker>
        </div>
      `;

      const selector = row.querySelector('.door-window-selector');
      selector.hass = this._hass;
      selector.value = entityObj.entity ?? '';
      selector.selector = {
        entity: {
          domain: 'binary_sensor',
          device_class: ['window', 'door', 'garage_door']
        }
      };

      selector.addEventListener('value-changed', e => {
        const newEntities = [...(this.config.door_window_entities ?? [])];
        newEntities[index] = { ...newEntities[index], entity: e.detail.value };
        this._valueChanged('door_window_entities', newEntities);
      });

      row.querySelector('.door-window-name').addEventListener('change', e => {
        const newEntities = [...(this.config.door_window_entities ?? [])];
        newEntities[index] = { ...newEntities[index], name: e.target.value };
        this._valueChanged('door_window_entities', newEntities);
      });

      row.querySelector('.door-window-icon').addEventListener('value-changed', e => {
        const newEntities = [...(this.config.door_window_entities ?? [])];
        newEntities[index] = { ...newEntities[index], icon: e.detail.value };
        this._valueChanged('door_window_entities', newEntities);
      });

      row.querySelector('.delete-btn').addEventListener('click', () => {
        const newEntities = [...(this.config.door_window_entities ?? [])];
        newEntities.splice(index, 1);
        this._valueChanged('door_window_entities', newEntities);
        this._updateDoorWindowList();
      });

      list.appendChild(row);
    });
  }

  _updateColorRanges(configKey, containerId) {
    const container = this.querySelector(`#${containerId}`);
    if (!container) return;

    const ranges = this.config[configKey] ?? [];
    container.innerHTML = '';

    ranges.forEach((range, index) => {
      const row = document.createElement('div');
      row.className = 'range-row';

      row.innerHTML = `
        <input type="number" class="range-from" placeholder="${this._t('from')}" value="${range.from ?? ''}" step="any">
        <input type="number" class="range-to" placeholder="${this._t('to')}" value="${range.to ?? ''}" step="any">
        <input type="color" class="range-color" value="${range.color ?? '#ffffff'}">
        <button class="delete-btn-small">
          <ha-icon icon="mdi:close" style="--mdc-icon-size:14px"></ha-icon>
        </button>
      `;

      row.querySelector('.range-from').addEventListener('change', e => {
        const newRanges = [...(this.config[configKey] ?? [])];
        newRanges[index] = { ...newRanges[index], from: parseFloat(e.target.value) };
        this._valueChanged(configKey, newRanges);
      });

      row.querySelector('.range-to').addEventListener('change', e => {
        const newRanges = [...(this.config[configKey] ?? [])];
        newRanges[index] = { ...newRanges[index], to: parseFloat(e.target.value) };
        this._valueChanged(configKey, newRanges);
      });

      row.querySelector('.range-color').addEventListener('input', e => {
        const newRanges = [...(this.config[configKey] ?? [])];
        newRanges[index] = { ...newRanges[index], color: e.target.value };
        this._valueChanged(configKey, newRanges);
      });

      row.querySelector('.delete-btn-small').addEventListener('click', () => {
        const newRanges = [...(this.config[configKey] ?? [])];
        newRanges.splice(index, 1);
        this._valueChanged(configKey, newRanges);
        this._updateColorRanges(configKey, containerId);
      });

      container.appendChild(row);
    });
  }

  _addColorRange(configKey, containerId) {
    const newRanges = [...(this.config[configKey] ?? []), { from: null, to: null, color: '#4caf50' }];
    this._valueChanged(configKey, newRanges);
    this._updateColorRanges(configKey, containerId);
  }

  render() {
    if (!this.config) return;

    const lang = this.config.language || this._hass?.language || 'hu';
    if (this._currentLang !== lang) {
      this._currentLang = lang;
      this._initialized = false;
    }

    if (!this._initialized) {
      this.innerHTML = `
        <style>
          .editor { display: flex; flex-direction: column; gap: 0; padding: 0; }
          .tab-row { display: flex; border-bottom: 1px solid var(--divider-color); margin-bottom: 16px; gap: 0; overflow-x: auto; }
          .tab-button { flex: 1; background: none; border: none; border-bottom: 2px solid transparent; padding: 10px 4px; font-size: 11px; font-weight: 500; color: var(--secondary-text-color); cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; transition: color 0.2s, border-color 0.2s; white-space: nowrap; }
          .tab-button:hover { color: var(--primary-text-color); }
          .tab-active { color: var(--primary-color) !important; border-bottom-color: var(--primary-color) !important; }
          .tab-content { padding: 0 2px; }
          .field-group { display: flex; flex-direction: column; gap: 8px; }
          .group-title { font-size: 11px; font-weight: 500; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.06em; padding-bottom: 4px; margin-bottom: 4px; margin-top: 8px; }
          .separator { border: 0; border-top: 1px dashed rgba(128, 128, 128, 0.4); margin: 16px 0; }
          label { font-size: 12px; color: var(--secondary-text-color); margin-bottom: 4px; display: block; }
          .sub-label { font-size: 11px; color: var(--secondary-text-color); font-style: italic; margin-top: -4px; margin-bottom: 2px; }
          .color-row { display: flex; align-items: center; gap: 8px; }
          input[type="color"] { width: 36px; height: 36px; border: 1px solid var(--divider-color); border-radius: 6px; padding: 0; cursor: pointer; background: none; flex-shrink: 0; }
          input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
          input[type="color"]::-webkit-color-swatch { border: none; border-radius: 4px; }
          select.dropdown-select { width: 100%; padding: 10px; border-radius: 4px; background: var(--input-fill-color, rgba(128,128,128,0.1)); color: var(--primary-text-color); border: 1px solid var(--divider-color); margin-bottom: 8px;}
          ha-entity-picker, ha-icon-picker, ha-textfield { display: block; width: 100%; }
          .entity-row { display: flex; gap: 8px; align-items: center; }
          .entity-row ha-selector { flex: 1; }
          .entity-row ha-icon-picker { width: 120px; flex-shrink: 0; }
          .slider-row { display: flex; align-items: center; gap: 10px; }
          .slider-row input[type="range"] { flex: 1; width: 100%; }
          .slider-value { font-size: 12px; color: var(--secondary-text-color); min-width: 36px; text-align: right; }
          .add-btn { display: flex; align-items: center; gap: 6px; background: none; border: 1px dashed var(--divider-color); border-radius: 8px; padding: 8px 12px; width: 100%; color: var(--secondary-text-color); font-size: 12px; cursor: pointer; margin-top: 4px; box-sizing: border-box; }
          .add-btn:hover { border-color: var(--primary-color); color: var(--primary-color); }
          .door-window-block { background: rgba(128,128,128,0.06); border: 1px solid var(--divider-color); border-radius: 8px; padding: 8px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 6px; }
          .door-window-row { display: flex; align-items: center; gap: 6px; }
          .door-window-row ha-selector { flex: 1; }
          .delete-btn { background: none; border: none; cursor: pointer; color: var(--error-color); padding: 4px; border-radius: 6px; display: flex; align-items: center; flex-shrink: 0; }
          .range-block { margin-top: 6px; }
          .range-title { font-size: 11px; color: var(--secondary-text-color); margin-bottom: 4px; display: flex; align-items: center; gap: 4px; }
          .range-row { display: grid; grid-template-columns: 1fr 1fr 36px 28px; gap: 4px; align-items: center; margin-bottom: 4px; }
          .range-row input[type="number"] { width: 100%; box-sizing: border-box; background: var(--input-fill-color, rgba(128,128,128,0.1)); border: 1px solid var(--divider-color); border-radius: 6px; padding: 6px 8px; font-size: 12px; color: var(--primary-text-color); }
          .delete-btn-small { background: none; border: none; cursor: pointer; color: var(--error-color); padding: 2px; border-radius: 4px; display: flex; align-items: center; }
          .range-header { display: grid; grid-template-columns: 1fr 1fr 36px 28px; gap: 4px; margin-bottom: 2px; }
          .range-header span { font-size: 10px; color: var(--secondary-text-color); padding-left: 2px; }
          .grid-2-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        </style>

        <div class="editor">

          <div class="tab-row">
            <button class="tab-button" data-tab="0">${this._t('general')}</button>
            <button class="tab-button" data-tab="1">${this._t('sensors')}</button>
            <button class="tab-button" data-tab="2">${this._t('doors')}</button>
            <button class="tab-button" data-tab="3">${this._t('appearance')}</button>
          </div>

          <div class="tab-content">
            <div class="field-group">
              <div>
                <label>${this._t('language')}</label>
                <select id="lang-selector" class="dropdown-select">
                  <option value="auto" ${!this.config.language || this.config.language === 'auto' ? 'selected' : ''}>${this._t('language_auto')}</option>
                  <option value="hu" ${this.config.language === 'hu' ? 'selected' : ''}>Magyar</option>
                  <option value="en" ${this.config.language === 'en' ? 'selected' : ''}>English</option>
                </select>
              </div>
              <div style="margin-top: 8px;">
                <label>${this._t('room_name')}</label>
                <ha-textfield id="room-name" placeholder="${this._t('room_name_ph')}"></ha-textfield>
              </div>
              <div class="grid-2-col" style="margin-top: 8px;">
                <div>
                  <label>${this._t('icon') || 'Ikon'}</label>
                  <ha-icon-picker id="card-icon"></ha-icon-picker>
                </div>
                <div>
                  <label>${this._t('icon_color') || 'Ikon színe'}</label>
                  <div class="color-row">
                    <input type="color" id="icon-color-picker">
                  </div>
                </div>
              </div>
            </div>

            <hr class="separator">

            <div class="field-group">
              <div class="group-title">${this._t('actions') || 'Kattintás esemény'}</div>
              <div>
                <label>${this._t('tap_action') || 'Művelet'}</label>
                <ha-selector id="tap-action-selector"></ha-selector>
              </div>
            </div>
          </div>

          <div class="tab-content">
            
            <div class="field-group">
              <div class="group-title">${this._t('temp')}</div>
              <div>
                <label>${this._t('indoor')}</label>
                <div class="entity-row">
                  <ha-selector id="temp-entity"></ha-selector>
                  <button class="delete-btn-small clear-entity" data-target="temperature_entity" title="Törlés">
                    <ha-icon icon="mdi:close" style="--mdc-icon-size:14px"></ha-icon>
                  </button>
                </div>
              </div>
              <div class="range-block">
                <div class="range-title">
                  <ha-icon icon="mdi:palette" style="--mdc-icon-size:13px"></ha-icon> ${this._t('color_ranges')}
                </div>
                <div class="range-header">
                  <span>${this._t('from')}</span><span>${this._t('to')}</span><span>${this._t('color')}</span><span></span>
                </div>
                <div id="temp-ranges"></div>
                <button class="add-btn" id="temp-range-add">
                  <ha-icon icon="mdi:plus" style="--mdc-icon-size:14px"></ha-icon> ${this._t('add_range')}
                </button>
              </div>
              <div style="margin-top: 8px;">
                <label>${this._t('outdoor')}</label>
                <div class="entity-row">
                  <ha-selector id="outdoor-temp-entity"></ha-selector>
                  <button class="delete-btn-small clear-entity" data-target="outdoor_temperature_entity" title="Törlés">
                    <ha-icon icon="mdi:close" style="--mdc-icon-size:14px"></ha-icon>
                  </button>
                </div>
              </div>
            </div>

            <hr class="separator">

            <div class="field-group">
              <div class="group-title">${this._t('humidity')}</div>
              <div>
                <label>${this._t('relative')}</label>
                <div class="entity-row">
                  <ha-selector id="humidity-entity"></ha-selector>
                  <ha-icon-picker id="humidity-icon"></ha-icon-picker>
                  <button class="delete-btn-small clear-entity" data-target="humidity_entity" title="Törlés">
                    <ha-icon icon="mdi:close" style="--mdc-icon-size:14px"></ha-icon>
                  </button>
                </div>
              </div>
              <div class="range-block">
                <div class="range-title">
                  <ha-icon icon="mdi:palette" style="--mdc-icon-size:13px"></ha-icon> ${this._t('color_ranges')}
                </div>
                <div class="range-header">
                  <span>${this._t('from')}</span><span>${this._t('to')}</span><span>${this._t('color')}</span><span></span>
                </div>
                <div id="humidity-ranges"></div>
                <button class="add-btn" id="humidity-range-add">
                  <ha-icon icon="mdi:plus" style="--mdc-icon-size:14px"></ha-icon> ${this._t('add_range')}
                </button>
              </div>
              <div style="margin-top: 8px;">
                <div class="sub-label">${this._t('absolute')}</div>
                <div class="entity-row">
                  <ha-selector id="abs-humidity-entity"></ha-selector>
                  <button class="delete-btn-small clear-entity" data-target="abs_humidity_entity" title="Törlés">
                    <ha-icon icon="mdi:close" style="--mdc-icon-size:14px"></ha-icon>
                  </button>
                </div>
              </div>
            </div>

            <hr class="separator">

            <div class="field-group">
              <div class="group-title">${this._t('air_quality')}</div>
              <div>
                <label>${this._t('dust')}</label>
                <div class="entity-row">
                  <ha-selector id="dust-entity"></ha-selector>
                  <ha-icon-picker id="dust-icon"></ha-icon-picker>
                  <button class="delete-btn-small clear-entity" data-target="dust_entity" title="Törlés">
                    <ha-icon icon="mdi:close" style="--mdc-icon-size:14px"></ha-icon>
                  </button>
                </div>
              </div>
              <div class="range-block">
                <div class="range-title">
                  <ha-icon icon="mdi:palette" style="--mdc-icon-size:13px"></ha-icon> ${this._t('color_ranges')}
                </div>
                <div class="range-header">
                  <span>${this._t('from')}</span><span>${this._t('to')}</span><span>${this._t('color')}</span><span></span>
                </div>
                <div id="dust-ranges"></div>
                <button class="add-btn" id="dust-range-add">
                  <ha-icon icon="mdi:plus" style="--mdc-icon-size:14px"></ha-icon> ${this._t('add_range')}
                </button>
              </div>
              <div style="margin-top: 16px;">
                <label>${this._t('co2')}</label>
                <div class="entity-row">
                  <ha-selector id="air-quality-entity"></ha-selector>
                  <ha-icon-picker id="air-quality-icon"></ha-icon-picker>
                  <button class="delete-btn-small clear-entity" data-target="air_quality_entity" title="Törlés">
                    <ha-icon icon="mdi:close" style="--mdc-icon-size:14px"></ha-icon>
                  </button>
                </div>
              </div>
              <div class="range-block">
                <div class="range-title">
                  <ha-icon icon="mdi:palette" style="--mdc-icon-size:13px"></ha-icon> ${this._t('color_ranges')}
                </div>
                <div class="range-header">
                  <span>${this._t('from')}</span><span>${this._t('to')}</span><span>${this._t('color')}</span><span></span>
                </div>
                <div id="air-quality-ranges"></div>
                <button class="add-btn" id="air-quality-range-add">
                  <ha-icon icon="mdi:plus" style="--mdc-icon-size:14px"></ha-icon> ${this._t('add_range')}
                </button>
              </div>
            </div>
          </div>

          <div class="tab-content">
            
            <div class="field-group">
              <div class="group-title">${this._t('door_colors_title') || 'Nyitott állapot színei (hőkülönbség alapján)'}</div>
              <div class="grid-2-col">
                <div>
                  <label>${this._t('color_colder') || 'Ha kint hidegebb van'}</label>
                  <div class="color-row">
                    <input type="color" id="door-color-colder">
                  </div>
                </div>
                <div>
                  <label>${this._t('color_warmer') || 'Ha kint melegebb van'}</label>
                  <div class="color-row">
                    <input type="color" id="door-color-warmer">
                  </div>
                </div>
              </div>
            </div>

            <hr class="separator">

            <div class="field-group">
              <div id="door-window-list"></div>
              <button class="add-btn" id="door-window-add">
                <ha-icon icon="mdi:plus" style="--mdc-icon-size:16px"></ha-icon> ${this._t('add_door')}
              </button>
            </div>
          </div>

          <div class="tab-content">
            
            <div class="field-group">
              <div class="group-title">${this._t('background_effects')}</div>
              <div>
                <label>${this._t('bg_image')}</label>
                <ha-textfield id="bg-image" placeholder="/local/livingroom.jpg"></ha-textfield>
              </div>
            </div>

            <hr class="separator">

            <div class="field-group">
              <div class="group-title">${this._t('glassmorphism')}</div>
              <div class="grid-2-col">
                <div>
                  <label>${this._t('blur')} (px)</label>
                  <div class="slider-row">
                    <input type="range" id="glass-blur" min="0" max="50" step="1">
                    <span class="slider-value" id="glass-blur-value">10px</span>
                  </div>
                </div>
                <div>
                  <label>${this._t('bg_opacity') || 'Átlátszatlanság (Opacity)'} (%)</label>
                  <div class="slider-row">
                    <input type="range" id="bg-opacity" min="0" max="100" step="1">
                    <span class="slider-value" id="bg-opacity-value">100%</span>
                  </div>
                </div>
              </div>
            </div>

            <hr class="separator">

            <div class="field-group">
              <div class="group-title">${this._t('box_shadow')}</div>
              <div class="grid-2-col">
                <div>
                  <label>${this._t('offset_x')} (px)</label>
                  <div class="slider-row">
                    <input type="range" id="shadow-x" min="-20" max="20" step="1">
                    <span class="slider-value" id="shadow-x-value">0px</span>
                  </div>
                </div>
                <div>
                  <label>${this._t('offset_y')} (px)</label>
                  <div class="slider-row">
                    <input type="range" id="shadow-y" min="-20" max="20" step="1">
                    <span class="slider-value" id="shadow-y-value">4px</span>
                  </div>
                </div>
                <div>
                  <label>${this._t('blur')} (px)</label>
                  <div class="slider-row">
                    <input type="range" id="shadow-blur" min="0" max="50" step="1">
                    <span class="slider-value" id="shadow-blur-value">8px</span>
                  </div>
                </div>
                <div>
                  <label>${this._t('opacity')} (%)</label>
                  <div class="slider-row">
                    <input type="range" id="shadow-opacity" min="0" max="100" step="1">
                    <span class="slider-value" id="shadow-opacity-value">20%</span>
                  </div>
                </div>
              </div>
              <div style="margin-top: 8px;">
                <label>${this._t('shadow_color')}</label>
                <div class="color-row">
                  <input type="color" id="shadow-color">
                </div>
              </div>
            </div>

            <hr class="separator">

            <div class="field-group">
              <div class="group-title">${this._t('colors')}</div>
              <div class="grid-2-col">
                <div>
                  <label>${this._t('text_color')}</label>
                  <div class="color-row">
                    <input type="color" id="text-color-picker">
                  </div>
                </div>
                <div>
                  <label>${this._t('card_bg')}</label>
                  <div class="color-row">
                    <input type="color" id="card-bg-picker">
                    <button class="add-btn" id="card-bg-reset" style="margin-top:0; flex:1; padding: 0 4px; height: 36px;">
                      ${this._t('reset_theme')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <hr class="separator">

            <div class="field-group">
              <div class="group-title">${this._t('shape')}</div>
              <div>
                <label>${this._t('corner_radius')}</label>
                <div class="slider-row">
                  <input type="range" id="corner-radius" min="0" max="32" step="1">
                  <span class="slider-value" id="corner-radius-value">12px</span>
                </div>
              </div>
            </div>
            
            <hr class="separator">

            <div class="field-group" style="margin-bottom: 24px;">
              <div class="group-title">${this._t('font_sizes')}</div>
              <div class="grid-2-col">
                <div>
                  <label>${this._t('room_name')}</label>
                  <div class="slider-row">
                    <input type="range" id="name-font-size" min="10" max="24" step="1">
                    <span class="slider-value" id="name-font-size-value">13px</span>
                  </div>
                </div>
                <div>
                  <label>${this._t('temp')}</label>
                  <div class="slider-row">
                    <input type="range" id="temp-font-size" min="14" max="48" step="1">
                    <span class="slider-value" id="temp-font-size-value">20px</span>
                  </div>
                </div>
                <div>
                  <label>${this._t('chip_font')}</label>
                  <div class="slider-row">
                    <input type="range" id="chip-font-size" min="8" max="16" step="1">
                    <span class="slider-value" id="chip-font-size-value">10px</span>
                  </div>
                </div>
                <div>
                  <label>${this._t('chip_icon')}</label>
                  <div class="slider-row">
                    <input type="range" id="chip-icon-size" min="8" max="24" step="1">
                    <span class="slider-value" id="chip-icon-size-value">12px</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      `;

      this.querySelectorAll('.tab-button').forEach((btn, i) => {
        btn.addEventListener('click', () => this._activeTabSettings(i));
      });

      this.querySelector('#lang-selector')?.addEventListener('change', e => this._valueChanged('language', e.target.value));
      this.querySelector('#room-name')?.addEventListener('change', e => this._valueChanged('name', e.target.value));
      this.querySelector('#text-color-picker')?.addEventListener('input', e => this._valueChanged('text_color', e.target.value));
      this.querySelector('#card-bg-picker')?.addEventListener('input', e => this._valueChanged('card_background_color', e.target.value));
      this.querySelector('#card-bg-reset')?.addEventListener('click', () => {
        const defaultColor = this.getThemeColor('--card-background-color', '#1c1c1c');
        this._valueChanged('card_background_color', defaultColor);
        const picker = this.querySelector('#card-bg-picker');
        if (picker) picker.value = defaultColor;
      });
      
      // HA selectors
      this.querySelector('#temp-entity')?.addEventListener('value-changed', e => this._valueChanged('temperature_entity', e.detail.value));
      this.querySelector('#outdoor-temp-entity')?.addEventListener('value-changed', e => this._valueChanged('outdoor_temperature_entity', e.detail.value));
      this.querySelector('#humidity-entity')?.addEventListener('value-changed', e => this._valueChanged('humidity_entity', e.detail.value));
      this.querySelector('#humidity-icon')?.addEventListener('value-changed', e => this._valueChanged('humidity_icon', e.detail.value));
      this.querySelector('#abs-humidity-entity')?.addEventListener('value-changed', e => this._valueChanged('abs_humidity_entity', e.detail.value));
      this.querySelector('#dust-entity')?.addEventListener('value-changed', e => this._valueChanged('dust_entity', e.detail.value));
      this.querySelector('#dust-icon')?.addEventListener('value-changed', e => this._valueChanged('dust_icon', e.detail.value));
      this.querySelector('#air-quality-entity')?.addEventListener('value-changed', e => this._valueChanged('air_quality_entity', e.detail.value));
      this.querySelector('#air-quality-icon')?.addEventListener('value-changed', e => this._valueChanged('air_quality_icon', e.detail.value));
      this.querySelector('#card-icon')?.addEventListener('value-changed', e => this._valueChanged('icon', e.detail.value));
      this.querySelector('#icon-color-picker')?.addEventListener('input', e => this._valueChanged('icon_color', e.target.value));

    // Tap action selector inicializálása
      const tapActionSelector = this.querySelector('#tap-action-selector');
      if (tapActionSelector) {
        tapActionSelector.selector = { ui_action: {} };
        tapActionSelector.addEventListener('value-changed', e => {
          this._valueChanged('tap_action', e.detail.value);
        });
      }

      // Clear gombok eseménykezelői
      this.querySelectorAll('.clear-entity').forEach(btn => {
        btn.addEventListener('click', e => {
          const target = e.currentTarget.dataset.target;
          this._valueChanged(target, '');
        });
      });

      this.querySelector('#temp-range-add')?.addEventListener('click', () => this._addColorRange('temperature_ranges', 'temp-ranges'));
      this.querySelector('#humidity-range-add')?.addEventListener('click', () => this._addColorRange('humidity_ranges', 'humidity-ranges'));
      this.querySelector('#dust-range-add')?.addEventListener('click', () => this._addColorRange('dust_ranges', 'dust-ranges'));
      this.querySelector('#air-quality-range-add')?.addEventListener('click', () => this._addColorRange('air_quality_ranges', 'air-quality-ranges'));

      this.querySelector('#door-window-add')?.addEventListener('click', () => {
        const newEntities = [...(this.config.door_window_entities ?? []), { entity: '', name: '', icon: '' }];
        this._valueChanged('door_window_entities', newEntities);
        this._updateDoorWindowList();
      });

      this.querySelector('#door-color-colder')?.addEventListener('input', e => this._valueChanged('door_color_colder', e.target.value));
      this.querySelector('#door-color-warmer')?.addEventListener('input', e => this._valueChanged('door_color_warmer', e.target.value));

      this.querySelector('#bg-image')?.addEventListener('change', e => this._valueChanged('bg_image', e.target.value));
      
      // Sliders
      const addSliderListener = (id, configKey, unit = '') => {
        this.querySelector(`#${id}`)?.addEventListener('input', e => {
          const val = parseInt(e.target.value);
          this.querySelector(`#${id}-value`).textContent = val + unit;
          this._valueChanged(configKey, val);
        });
      };

      addSliderListener('glass-blur', 'glass_blur', 'px');
      addSliderListener('bg-opacity', 'bg_opacity', '%');
      addSliderListener('shadow-x', 'shadow_x', 'px');
      addSliderListener('shadow-y', 'shadow_y', 'px');
      addSliderListener('shadow-blur', 'shadow_blur', 'px');
      addSliderListener('shadow-opacity', 'shadow_opacity', '%');
      addSliderListener('corner-radius', 'corner_radius', 'px');
      addSliderListener('name-font-size', 'name_font_size', 'px');
      addSliderListener('temp-font-size', 'temp_font_size', 'px');
      addSliderListener('chip-font-size', 'chip_font_size', 'px');
      addSliderListener('chip-icon-size', 'chip_icon_size', 'px');

      this.querySelector('#shadow-color')?.addEventListener('input', e => {
        this._valueChanged('shadow_color', e.target.value);
      });

      this._activeTabSettings(this._activeTab ?? 0);
      this._initialized = true;
    }

    // Populate Fields
    const setVal = (selector, val) => { const el = this.querySelector(selector); if (el) el.value = val; };
    const setSlider = (id, val, unit) => {
      const slider = this.querySelector(`#${id}`);
      if (slider) { slider.value = val; this.querySelector(`#${id}-value`).textContent = val + unit; }
    };
    // Tap action értékének dinamikus frissítése
    const tapActionEl = this.querySelector('#tap-action-selector');
    if (tapActionEl) {
      tapActionEl.hass = this._hass;
      const currentAction = this.config.tap_action || { action: 'more-info' };
      // Csak akkor írjuk felül, ha tényleg változott az érték (így nem záródnak be az al-menük)
      if (JSON.stringify(tapActionEl.value) !== JSON.stringify(currentAction)) {
        tapActionEl.value = currentAction;
      }
    }

    setVal('#room-name', this.config.name ?? '');
    setVal('#text-color-picker', this.config.text_color ?? this.getThemeColor('--primary-text-color', '#212121'));
    setVal('#card-bg-picker', this.config.card_background_color ?? this.getThemeColor('--card-background-color', '#1c1c1c'));
    setVal('#card-icon', this.config.icon ?? 'mdi:home');
    setVal('#icon-color-picker', this.config.icon_color ?? this.getThemeColor('--primary-text-color', '#212121'));
    setVal('#humidity-icon', this.config.humidity_icon ?? '');
    setVal('#dust-icon', this.config.dust_icon ?? '');
    setVal('#air-quality-icon', this.config.air_quality_icon ?? '');
    setVal('#bg-image', this.config.bg_image ?? '');
    setVal('#shadow-color', this.config.shadow_color ?? '#000000');

    setVal('#door-color-colder', this.config.door_color_colder ?? '#42a5f5');
    setVal('#door-color-warmer', this.config.door_color_warmer ?? '#ef5350');

    setSlider('glass-blur', this.config.glass_blur ?? 0, 'px');
    setSlider('bg-opacity', this.config.bg_opacity ?? 100, '%');
    setSlider('shadow-x', this.config.shadow_x ?? 0, 'px');
    setSlider('shadow-y', this.config.shadow_y ?? 4, 'px');
    setSlider('shadow-blur', this.config.shadow_blur ?? 8, 'px');
    setSlider('shadow-opacity', this.config.shadow_opacity ?? 20, '%');
    setSlider('corner-radius', this.config.corner_radius ?? 12, 'px');
    setSlider('name-font-size', this.config.name_font_size ?? 13, 'px');
    setSlider('temp-font-size', this.config.temp_font_size ?? 20, 'px');
    setSlider('chip-font-size', this.config.chip_font_size ?? 10, 'px');
    setSlider('chip-icon-size', this.config.chip_icon_size ?? 12, 'px');

    const setupEntitySelector = (id, configKey, domain, deviceClasses = null) => {
      const el = this.querySelector(`#${id}`);
      if (!el) return;
      el.value = this.config[configKey] ?? '';
      if (this._hass) el.hass = this._hass;
      const selectorConfig = { domain };
      if (deviceClasses) selectorConfig.device_class = deviceClasses;
      el.selector = { entity: selectorConfig };
    };

    setupEntitySelector('temp-entity', 'temperature_entity', 'sensor', 'temperature');
    setupEntitySelector('outdoor-temp-entity', 'outdoor_temperature_entity', 'sensor', 'temperature');
    setupEntitySelector('humidity-entity', 'humidity_entity', 'sensor', 'humidity');
    setupEntitySelector('abs-humidity-entity', 'abs_humidity_entity', 'sensor');
    setupEntitySelector('dust-entity', 'dust_entity', 'sensor', ['pm25', 'pm10']);
    setupEntitySelector('air-quality-entity', 'air_quality_entity', 'sensor', ['carbon_dioxide', 'volatile_organic_compounds', 'aqi']);

    this._updateColorRanges('temperature_ranges', 'temp-ranges');
    this._updateColorRanges('humidity_ranges', 'humidity-ranges');
    this._updateColorRanges('dust_ranges', 'dust-ranges');
    this._updateColorRanges('air_quality_ranges', 'air-quality-ranges');

    this._updateDoorWindowList();
    this._activeTabSettings(this._activeTab ?? 0);
  }
}

customElements.define('room-card-editor', RoomCardEditor);

// ============================================
// CARD
// ============================================
class RoomCard extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set hass(hass) {
    const oldState = this._hass?.states;
    this._hass = hass;
    
    if (!oldState) {
      this.render();
      return;
    }
    
    const entity = this.config?.temperature_entity;
    if (entity && oldState[entity]?.state !== hass.states[entity]?.state) {
      this.render();
    }
  }

  setConfig(config) {
    this.config = { ...config };
  }

  _getRangeColor(value, ranges) {
    if (!ranges?.length) return null;
    const val = parseFloat(value);
    if (isNaN(val)) return null;
    for (const r of ranges) {
      const fromOk = r.from === null || r.from === undefined || val >= r.from;
      const toOk = r.to === null || r.to === undefined || val <= r.to;
      if (fromOk && toOk) return r.color;
    }
    return null;
  }

  _hexToRgb(hexColor) {
    if (!hexColor || !hexColor.startsWith('#')) return '128, 128, 128';
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(x => x + x).join('');
    }
    if (hex.length !== 6) return '128, 128, 128';
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }

  _handleTap() {
    const actionConfig = this.config.tap_action || { action: 'more-info' };
    if (actionConfig.action === 'none') return;
    
    // Alapértelmezett entitás a more-info részére, ha nincs explicit megadva a tap_action-ben
    const actionEntity = this.config.temperature_entity || '';

    const event = new CustomEvent('hass-action', {
      bubbles: true,
      composed: true,
      detail: {
        config: {
          ...this.config,
          tap_action: actionConfig,
          entity: actionEntity
        },
        action: 'tap'
      }
    });
    this.dispatchEvent(event);
  }

  render() {
    if (!this._hass || !this.config) return;

    const themeBackgroundColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--card-background-color').trim() || '#1c1c1c';
    const themeTextColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary-text-color').trim();

    const {
      temperature_entity,
      outdoor_temperature_entity,
      humidity_entity,
      humidity_icon = 'mdi:water-percent',
      abs_humidity_entity,
      dust_entity,
      dust_icon = 'mdi:blur',
      air_quality_entity,
      air_quality_icon = 'mdi:molecule-co2',
      temperature_ranges,
      humidity_ranges,
      dust_ranges,
      air_quality_ranges,
      door_window_entities = [],
      door_color_colder = '#42a5f5',
      door_color_warmer = '#ef5350',
      name,
      icon_color,
      bg_image = '',
      glass_blur = 0,
      bg_opacity = 100, 
      shadow_x = 0,
      shadow_y = 4,
      shadow_blur = 8,
      shadow_color = '#000000',
      shadow_opacity = 20,
      text_color = themeTextColor,
      card_background_color = themeBackgroundColor,
      corner_radius = 12,
      name_font_size = 13,
      temp_font_size = 20,
      chip_font_size = 10,
      chip_icon_size = 12,
      icon = 'mdi:home',
      tap_action
    } = this.config;

    const temperature = temperature_entity && this._hass.states[temperature_entity] 
      ? this._hass.states[temperature_entity].state 
      : null;
    const indoorTemp = parseFloat(this._hass.states[temperature_entity]?.state);
    const outdoorTemp = outdoor_temperature_entity
      ? parseFloat(this._hass.states[outdoor_temperature_entity]?.state)
      : null;

    const humidity = humidity_entity
      ? this._hass.states[humidity_entity]?.state : null;
    const absHumidity = abs_humidity_entity
      ? this._hass.states[abs_humidity_entity]?.state : null;
    const absHumidityUnit = abs_humidity_entity
      ? this._hass.states[abs_humidity_entity]?.attributes?.unit_of_measurement ?? 'g/m³' : '';

    let humidityText = null;
    if (humidity !== null) {
      humidityText = `${humidity}%`;
      if (absHumidity !== null) humidityText += ` · ${absHumidity} ${absHumidityUnit}`;
    }

    const dust = dust_entity
      ? this._hass.states[dust_entity]?.state : null;
    const dustUnit = dust_entity
      ? this._hass.states[dust_entity]?.attributes?.unit_of_measurement ?? 'µg/m³' : '';

    const airQuality = air_quality_entity
      ? this._hass.states[air_quality_entity]?.state : null;
    const airQualityUnit = air_quality_entity
      ? this._hass.states[air_quality_entity]?.attributes?.unit_of_measurement ?? '' : '';

    const tempChipColor = this._getRangeColor(temperature, temperature_ranges);
    const humidityChipColor = this._getRangeColor(humidity, humidity_ranges);
    const dustChipColor = this._getRangeColor(dust, dust_ranges);
    const airQualityChipColor = this._getRangeColor(airQuality, air_quality_ranges);

    const doorWindowChips = [];
    if (door_window_entities.length > 0) {
      for (const entityObj of door_window_entities) {
        if (!entityObj.entity) continue;
        const stateObj = this._hass.states[entityObj.entity];
        if (!stateObj) continue;
        const isOpen = stateObj.state === 'on';
        const chipName = entityObj.name?.trim() || stateObj.attributes?.friendly_name || entityObj.entity;
        
        let iconOpen = 'mdi:window-open', iconClosed = 'mdi:window-closed';
        if (entityObj.icon) {
          iconOpen = entityObj.icon;
          iconClosed = entityObj.icon;
        } else {
          const deviceClass = stateObj.attributes?.device_class ?? 'window';
          if (deviceClass === 'door') { iconOpen = 'mdi:door-open'; iconClosed = 'mdi:door-closed'; }
          else if (deviceClass === 'garage_door') { iconOpen = 'mdi:garage-open'; iconClosed = 'mdi:garage'; }
        }

        let chipIconColor = 'inherit';
        if (isOpen && outdoorTemp !== null && !isNaN(outdoorTemp) && !isNaN(indoorTemp)) {
          const diff = outdoorTemp - indoorTemp;
          if (diff < 0) chipIconColor = door_color_colder;
          else if (diff > 0) chipIconColor = door_color_warmer;
        }
        
        doorWindowChips.push({ isOpen, chipName, iconOpen, iconClosed, chipIconColor });
      }
    }

    const renderChip = (iconName, text, customColor, extraClass = '') => {
      if (customColor) {
        return `<div class="chip" style="background:${customColor}22; color:${customColor};">
          <ha-icon icon="${iconName}" class="chip-icon" style="color:${customColor}"></ha-icon>
          <span>${text}</span>
        </div>`;
      }
      return `<div class="chip ${extraClass}">
        <ha-icon icon="${iconName}" class="chip-icon"></ha-icon>
        <span>${text}</span>
      </div>`;
    };

    const customShadowCss = `box-shadow: ${shadow_x}px ${shadow_y}px ${shadow_blur}px color-mix(in srgb, ${shadow_color} ${shadow_opacity}%, transparent);`;

    let customBackgroundCss = `background: ${card_background_color};`;
    let customBackdropCss = '';
    
    if (bg_image) {
      const overlayColor = `color-mix(in srgb, #000000 ${bg_opacity}%, transparent)`;
      customBackgroundCss = `
        background: linear-gradient(${overlayColor}, ${overlayColor}), url('${bg_image}');
        background-size: cover;
        background-position: center;
      `;
    } else if (bg_opacity < 100) {
      customBackgroundCss = `background: color-mix(in srgb, ${card_background_color} ${bg_opacity}%, transparent);`;
    }

    if (glass_blur > 0) {
      customBackdropCss = `backdrop-filter: blur(${glass_blur}px); -webkit-backdrop-filter: blur(${glass_blur}px);`;
    }

    const isClickable = !tap_action || tap_action.action !== 'none';

    this.shadowRoot.innerHTML = `
      <ha-card>
        <div class="card-inner">
          <div class="left-side">
            ${icon ? `
            <div class="icon-background" style="background:${icon_color ?? text_color}22">
              <ha-icon icon="${icon}" style="color:${icon_color ?? text_color}"></ha-icon>
            </div>
            ` : ''}
            <div class="info-block">
              <div class="room-name">${name ?? temperature_entity ?? '–'}</div>
              <div class="chip-row">

                ${humidityText !== null
                  ? renderChip(humidity_icon, humidityText, humidityChipColor)
                  : ''}

                ${dust !== null
                  ? renderChip(dust_icon, `${dust} ${dustUnit}`, dustChipColor)
                  : ''}

                ${airQuality !== null
                  ? renderChip(air_quality_icon, `${airQuality} ${airQualityUnit}`, airQualityChipColor)
                  : ''}

                ${doorWindowChips.map(chip => {
                  if (chip.chipIconColor !== 'inherit') {
                    return renderChip(chip.isOpen ? chip.iconOpen : chip.iconClosed, chip.chipName, chip.chipIconColor);
                  }
                  return `<div class="chip">
                    <ha-icon icon="${chip.isOpen ? chip.iconOpen : chip.iconClosed}"
                      class="chip-icon"></ha-icon>
                    <span>${chip.chipName}</span>
                  </div>`;
                }).join('')}

              </div>
            </div>
          </div>
          ${temperature !== null ? `
          <div class="temperature" style="${tempChipColor ? `color:${tempChipColor}` : ''}">
            ${temperature}<span class="degree">°C</span>
          </div>
          ` : ''}
        </div>
      </ha-card>
      <style>
        ha-card { 
          ${customBackgroundCss}
          ${customBackdropCss}
          ${customShadowCss}
          border: 1px solid rgba(255,255,255,0.07); 
          border-radius: ${corner_radius}px; 
          overflow: hidden; 
          ${isClickable ? 'cursor: pointer;' : ''}
        }
        .card-inner { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; gap: 8px; }
        .left-side { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
        .info-block { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .icon-background { border-radius: 10px; padding: 8px; display: flex; align-items: center; flex-shrink: 0; background-color: rgba(128,128,128,0.15); }
        ha-icon { --mdc-icon-size: 20px; }
        .room-name { font-size: ${name_font_size}px; font-weight: 500; color: ${text_color}; }
        .temperature { font-size: ${temp_font_size}px; font-weight: 500; color: ${text_color}; letter-spacing: -0.5px; flex-shrink: 0; }
        .degree { font-size: ${Math.round(temp_font_size * 0.7)}px; color: inherit; }
        .chip-row { display: flex; flex-wrap: wrap; gap: 4px; }
        .chip { display: inline-flex; align-items: center; gap: 3px; font-size: ${chip_font_size}px; color: ${text_color}; background: rgba(128,128,128,0.15); border-radius: 6px; padding: 2px 6px; }
        .chip-icon { --mdc-icon-size: ${chip_icon_size}px !important; color: inherit; }
      </style>
    `;

    const cardElement = this.shadowRoot.querySelector('ha-card');
    if (cardElement) {
      cardElement.addEventListener('click', () => this._handleTap());
    }
  }

  static getConfigElement() { return document.createElement('room-card-editor'); }

  static getStubConfig() {
    return {
      name: 'Szoba neve',
      icon_color: '#ffa726',
      icon: 'mdi:sofa'
    };
  }

  getCardSize() { return 1; }
}

customElements.define('room-card', RoomCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "room-card",
  name: "Room Card",
  preview: false,
  description: "Room temperature and humidity card",
});
