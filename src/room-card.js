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
    this._aktivFul = index;
    this.querySelectorAll('.ful-tartalom').forEach((el, i) => {
      el.style.display = i === index ? 'block' : 'none';
    });
    this.querySelectorAll('.ful-gomb').forEach((el, i) => {
      el.classList.toggle('ful-aktiv', i === index);
    });
  }

  _nyilaszaroListaFrissit() {
    const lista = this.querySelector('#nyilaszaro-lista');
    if (!lista) return;
    const entitasok = this.config.nyilaszaro_entitasok ?? [];
    lista.innerHTML = '';
    entitasok.forEach((entitas, index) => {
      const sor = document.createElement('div');
      sor.className = 'nyilaszaro-blokk';
      sor.innerHTML = `
        <div class="nyilaszaro-sor">
          <ha-selector class="nyilaszaro-selector" data-index="${index}"></ha-selector>
          <button class="torles-gomb" data-index="${index}">
            <ha-icon icon="mdi:close" style="--mdc-icon-size:16px"></ha-icon>
          </button>
        </div>
        <ha-textfield
          class="nyilaszaro-nev"
          data-index="${index}"
          placeholder="Egyedi név (opcionális)"
          value="${entitas.nev ?? ''}"
        ></ha-textfield>
      `;
      const selector = sor.querySelector('.nyilaszaro-selector');
      selector.hass = this._hass;
      selector.value = entitas.entity ?? '';
      selector.selector = { entity: { domain: 'binary_sensor', device_class: ['window', 'door', 'garage_door'] } };
      selector.addEventListener('value-changed', e => {
        const ujEntitasok = [...(this.config.nyilaszaro_entitasok ?? [])];
        ujEntitasok[index] = { ...ujEntitasok[index], entity: e.detail.value };
        this._valueChanged('nyilaszaro_entitasok', ujEntitasok);
      });
      sor.querySelector('.nyilaszaro-nev').addEventListener('change', e => {
        const ujEntitasok = [...(this.config.nyilaszaro_entitasok ?? [])];
        ujEntitasok[index] = { ...ujEntitasok[index], nev: e.target.value };
        this._valueChanged('nyilaszaro_entitasok', ujEntitasok);
      });
      sor.querySelector('.torles-gomb').addEventListener('click', () => {
        const ujEntitasok = [...(this.config.nyilaszaro_entitasok ?? [])];
        ujEntitasok.splice(index, 1);
        this._valueChanged('nyilaszaro_entitasok', ujEntitasok);
        this._nyilaszaroListaFrissit();
      });
      lista.appendChild(sor);
    });
  }

  // Színtartomány szerkesztő egy adott érzékelőhöz
  _szintartomanyFrissit(kulcs, kontainerId, egyseg = '') {
    const kontainer = this.querySelector(`#${kontainerId}`);
    if (!kontainer) return;
    const tartomanyok = this.config[kulcs] ?? [];
    kontainer.innerHTML = '';
    tartomanyok.forEach((t, index) => {
      const sor = document.createElement('div');
      sor.className = 'tartomany-sor';
      sor.innerHTML = `
        <input type="number" class="tartomany-tol" placeholder="Tól" value="${t.tol ?? ''}" step="any">
        <input type="number" class="tartomany-ig" placeholder="Ig" value="${t.ig ?? ''}" step="any">
        <input type="color" class="tartomany-szin" value="${t.szin ?? '#ffffff'}">
        <button class="torles-gomb-kis">
          <ha-icon icon="mdi:close" style="--mdc-icon-size:14px"></ha-icon>
        </button>
      `;
      sor.querySelector('.tartomany-tol').addEventListener('change', e => {
        const uj = [...(this.config[kulcs] ?? [])];
        uj[index] = { ...uj[index], tol: parseFloat(e.target.value) };
        this._valueChanged(kulcs, uj);
      });
      sor.querySelector('.tartomany-ig').addEventListener('change', e => {
        const uj = [...(this.config[kulcs] ?? [])];
        uj[index] = { ...uj[index], ig: parseFloat(e.target.value) };
        this._valueChanged(kulcs, uj);
      });
      sor.querySelector('.tartomany-szin').addEventListener('input', e => {
        const uj = [...(this.config[kulcs] ?? [])];
        uj[index] = { ...uj[index], szin: e.target.value };
        this._valueChanged(kulcs, uj);
      });
      sor.querySelector('.torles-gomb-kis').addEventListener('click', () => {
        const uj = [...(this.config[kulcs] ?? [])];
        uj.splice(index, 1);
        this._valueChanged(kulcs, uj);
        this._szintartomanyFrissit(kulcs, kontainerId, egyseg);
      });
      kontainer.appendChild(sor);
    });
  }

  _szintartomanyHozzaad(kulcs, kontainerId, egyseg = '') {
    const uj = [...(this.config[kulcs] ?? []), { tol: null, ig: null, szin: '#4caf50' }];
    this._valueChanged(kulcs, uj);
    this._szintartomanyFrissit(kulcs, kontainerId, egyseg);
  }

  render() {
    if (!this.config) return;

    if (!this.jartMarItt) {
      this.innerHTML = `
        <style>
          .szerkeszto { display: flex; flex-direction: column; gap: 0; padding: 0; }
          .ful-sor {
            display: flex; border-bottom: 1px solid var(--divider-color);
            margin-bottom: 16px; gap: 0; overflow-x: auto;
          }
          .ful-gomb {
            flex: 1; background: none; border: none; border-bottom: 2px solid transparent;
            padding: 10px 4px; font-size: 11px; font-weight: 500;
            color: var(--secondary-text-color); cursor: pointer;
            text-transform: uppercase; letter-spacing: 0.05em;
            transition: color 0.2s, border-color 0.2s; white-space: nowrap;
          }
          .ful-gomb:hover { color: var(--primary-text-color); }
          .ful-aktiv { color: var(--primary-color) !important; border-bottom-color: var(--primary-color) !important; }
          .ful-tartalom { padding: 0 2px; }
          .mezocsoport { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
          .csoport-cim { font-size: 11px; font-weight: 500; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.06em; padding-bottom: 4px; border-bottom: 1px solid var(--divider-color); margin-bottom: 4px; }
          label { font-size: 12px; color: var(--secondary-text-color); margin-bottom: 4px; display: block; }
          .al-label { font-size: 11px; color: var(--secondary-text-color); font-style: italic; margin-top: -4px; margin-bottom: 2px; }
          .szin-sor { display: flex; align-items: center; gap: 8px; }
          input[type="color"] { width: 36px; height: 36px; border: 1px solid var(--divider-color); border-radius: 6px; padding: 0; cursor: pointer; background: none; flex-shrink: 0; }
          input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
          input[type="color"]::-webkit-color-swatch { border: none; border-radius: 4px; }
          ha-entity-picker, ha-icon-picker, ha-textfield { display: block; width: 100%; }
          .slider-sor { display: flex; align-items: center; gap: 10px; }
          .slider-sor input[type="range"] { flex: 1; }
          .slider-ertek { font-size: 12px; color: var(--secondary-text-color); min-width: 36px; text-align: right; }
          .hozzaad-gomb {
            display: flex; align-items: center; gap: 6px;
            background: none; border: 1px dashed var(--divider-color);
            border-radius: 8px; padding: 8px 12px; width: 100%;
            color: var(--secondary-text-color); font-size: 12px;
            cursor: pointer; margin-top: 4px; box-sizing: border-box;
          }
          .hozzaad-gomb:hover { border-color: var(--primary-color); color: var(--primary-color); }
          .nyilaszaro-blokk {
            background: rgba(128,128,128,0.06); border: 1px solid var(--divider-color);
            border-radius: 8px; padding: 8px; margin-bottom: 8px;
            display: flex; flex-direction: column; gap: 6px;
          }
          .nyilaszaro-sor { display: flex; align-items: center; gap: 6px; }
          .nyilaszaro-sor ha-selector { flex: 1; }
          .torles-gomb {
            background: none; border: none; cursor: pointer;
            color: var(--error-color); padding: 4px;
            border-radius: 6px; display: flex; align-items: center; flex-shrink: 0;
          }
          /* Színtartomány */
          .tartomany-blokk { margin-top: 6px; }
          .tartomany-cim { font-size: 11px; color: var(--secondary-text-color); margin-bottom: 4px; display: flex; align-items: center; gap: 4px; }
          .tartomany-sor {
            display: grid; grid-template-columns: 1fr 1fr 36px 28px;
            gap: 4px; align-items: center; margin-bottom: 4px;
          }
          .tartomany-sor input[type="number"] {
            width: 100%; box-sizing: border-box;
            background: var(--input-fill-color, rgba(128,128,128,0.1));
            border: 1px solid var(--divider-color); border-radius: 6px;
            padding: 6px 8px; font-size: 12px; color: var(--primary-text-color);
          }
          .torles-gomb-kis {
            background: none; border: none; cursor: pointer;
            color: var(--error-color); padding: 2px;
            border-radius: 4px; display: flex; align-items: center;
          }
          .tartomany-fejlec {
            display: grid; grid-template-columns: 1fr 1fr 36px 28px;
            gap: 4px; margin-bottom: 2px;
          }
          .tartomany-fejlec span { font-size: 10px; color: var(--secondary-text-color); padding-left: 2px; }
        </style>

        <div class="szerkeszto">

          <div class="ful-sor">
            <button class="ful-gomb" data-ful="0">Általános</button>
            <button class="ful-gomb" data-ful="1">Érzékelők</button>
            <button class="ful-gomb" data-ful="2">Nyílászárók</button>
            <button class="ful-gomb" data-ful="3">Megjelenés</button>
          </div>

          <!-- FÜL 0: ÁLTALÁNOS -->
          <div class="ful-tartalom">
            <div class="mezocsoport">
              <div>
                <label>Szoba neve</label>
                <ha-textfield id="nev" placeholder="pl. Nappali"></ha-textfield>
              </div>
            </div>
          </div>

          <!-- FÜL 1: ÉRZÉKELŐK -->
          <div class="ful-tartalom">
            <div class="mezocsoport">
              <div class="csoport-cim">Hőmérséklet</div>
              <div>
                <label>Beltéri</label>
                <ha-selector id="homerseklet-entitas"></ha-selector>
              </div>
              <div class="tartomany-blokk">
                <div class="tartomany-cim">
                  <ha-icon icon="mdi:palette" style="--mdc-icon-size:13px"></ha-icon> Színtartományok
                </div>
                <div class="tartomany-fejlec">
                  <span>Tól</span><span>Ig</span><span>Szín</span><span></span>
                </div>
                <div id="homerseklet-tartomanyok"></div>
                <button class="hozzaad-gomb" id="homerseklet-tartomany-hozzaad">
                  <ha-icon icon="mdi:plus" style="--mdc-icon-size:14px"></ha-icon> Tartomány hozzáadása
                </button>
              </div>
              <div>
                <label>Külső</label>
                <ha-selector id="kulso-homerseklet-entitas"></ha-selector>
              </div>
            </div>

            <div class="mezocsoport">
              <div class="csoport-cim">Páratartalom</div>
              <div>
                <label>Relatív (%)</label>
                <ha-selector id="paratartalom-entitas"></ha-selector>
              </div>
              <div class="tartomany-blokk">
                <div class="tartomany-cim">
                  <ha-icon icon="mdi:palette" style="--mdc-icon-size:13px"></ha-icon> Színtartományok
                </div>
                <div class="tartomany-fejlec">
                  <span>Tól</span><span>Ig</span><span>Szín</span><span></span>
                </div>
                <div id="paratartalom-tartomanyok"></div>
                <button class="hozzaad-gomb" id="paratartalom-tartomany-hozzaad">
                  <ha-icon icon="mdi:plus" style="--mdc-icon-size:14px"></ha-icon> Tartomány hozzáadása
                </button>
              </div>
              <div>
                <div class="al-label">↳ Abszolút (opcionális)</div>
                <ha-selector id="abs-paratartalom-entitas"></ha-selector>
              </div>
            </div>

            <div class="mezocsoport">
              <div class="csoport-cim">Levegőminőség</div>
              <div>
                <label>Szálló por (PM2.5 / PM10)</label>
                <ha-selector id="szallópor-entitas"></ha-selector>
              </div>
              <div class="tartomany-blokk">
                <div class="tartomany-cim">
                  <ha-icon icon="mdi:palette" style="--mdc-icon-size:13px"></ha-icon> Színtartományok
                </div>
                <div class="tartomany-fejlec">
                  <span>Tól</span><span>Ig</span><span>Szín</span><span></span>
                </div>
                <div id="szallópor-tartomanyok"></div>
                <button class="hozzaad-gomb" id="szallópor-tartomany-hozzaad">
                  <ha-icon icon="mdi:plus" style="--mdc-icon-size:14px"></ha-icon> Tartomány hozzáadása
                </button>
              </div>
              <div>
                <label>CO2 / VOC / AQI</label>
                <ha-selector id="levegominoseg-entitas"></ha-selector>
              </div>
              <div class="tartomany-blokk">
                <div class="tartomany-cim">
                  <ha-icon icon="mdi:palette" style="--mdc-icon-size:13px"></ha-icon> Színtartományok
                </div>
                <div class="tartomany-fejlec">
                  <span>Tól</span><span>Ig</span><span>Szín</span><span></span>
                </div>
                <div id="levego-tartomanyok"></div>
                <button class="hozzaad-gomb" id="levego-tartomany-hozzaad">
                  <ha-icon icon="mdi:plus" style="--mdc-icon-size:14px"></ha-icon> Tartomány hozzáadása
                </button>
              </div>
            </div>
          </div>

          <!-- FÜL 2: NYÍLÁSZÁRÓK -->
          <div class="ful-tartalom">
            <div class="mezocsoport">
              <div id="nyilaszaro-lista"></div>
              <button class="hozzaad-gomb" id="nyilaszaro-hozzaad">
                <ha-icon icon="mdi:plus" style="--mdc-icon-size:16px"></ha-icon> Nyílászáró hozzáadása
              </button>
            </div>
          </div>

          <!-- FÜL 3: MEGJELENÉS -->
          <div class="ful-tartalom">
            <div class="mezocsoport">
              <div class="csoport-cim">Színek</div>
              <div>
                <label>Betűszín</label>
                <div class="szin-sor">
                  <input type="color" id="szin-picker">
                </div>
              </div>
              <div>
                <label>Kártya háttérszíne</label>
                <div class="szin-sor">
                  <input type="color" id="kartya-hatter-picker">
                  <button class="hozzaad-gomb" id="kartya-hatter-reset" style="margin-top:0; flex:1;">
                    Téma alapértelmezett visszaállítása
                  </button>
                </div>
              </div>
            </div>
            <div class="mezocsoport">
              <div class="csoport-cim">Forma</div>
              <div>
                <label>Sarok lekerekítése</label>
                <div class="slider-sor">
                  <input type="range" id="sarok-lekerekites" min="0" max="32" step="1">
                  <span class="slider-ertek" id="sarok-lekerekites-ertek">12px</span>
                </div>
              </div>
            </div>
            <div class="mezocsoport">
              <div class="csoport-cim">Betűméretek</div>
              <div>
                <label>Szoba neve</label>
                <div class="slider-sor">
                  <input type="range" id="nev-betumeret" min="10" max="24" step="1">
                  <span class="slider-ertek" id="nev-betumeret-ertek">13px</span>
                </div>
              </div>
              <div>
                <label>Hőmérséklet</label>
                <div class="slider-sor">
                  <input type="range" id="homerseklet-betumeret" min="14" max="48" step="1">
                  <span class="slider-ertek" id="homerseklet-betumeret-ertek">20px</span>
                </div>
              </div>
              <div>
                <label>Chip – betűméret</label>
                <div class="slider-sor">
                  <input type="range" id="chip-betumeret" min="8" max="16" step="1">
                  <span class="slider-ertek" id="chip-betumeret-ertek">10px</span>
                </div>
              </div>
              <div>
                <label>Chip – ikonméret</label>
                <div class="slider-sor">
                  <input type="range" id="chip-ikonmeret" min="8" max="24" step="1">
                  <span class="slider-ertek" id="chip-ikonmeret-ertek">12px</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      `;

      this.querySelectorAll('.ful-gomb').forEach((gomb, i) => {
        gomb.addEventListener('click', () => this._activeTabSettings(i));
      });

      this.querySelector('#nev')
        ?.addEventListener('change', e => this._valueChanged('nev', e.target.value));
      this.querySelector('#szin-picker')
        ?.addEventListener('input', e => this._valueChanged('textColor', e.target.value));
      this.querySelector('#kartya-hatter-picker')
        ?.addEventListener('input', e => this._valueChanged('cardBackgroundColor', e.target.value));
      this.querySelector('#kartya-hatter-reset')
        ?.addEventListener('click', () => {
          const alapSzin = this.getThemeColor('--card-background-color', '#1c1c1c');
          this._valueChanged('cardBackgroundColor', alapSzin);
          const picker = this.querySelector('#kartya-hatter-picker');
          if (picker) picker.value = alapSzin;
        });
      this.querySelector('#homerseklet-entitas')
        ?.addEventListener('value-changed', e => this._valueChanged('homerseklet_entity', e.detail.value));
      this.querySelector('#kulso-homerseklet-entitas')
        ?.addEventListener('value-changed', e => this._valueChanged('kulso_homerseklet_entity', e.detail.value));
      this.querySelector('#paratartalom-entitas')
        ?.addEventListener('value-changed', e => this._valueChanged('paratartalom_entity', e.detail.value));
      this.querySelector('#abs-paratartalom-entitas')
        ?.addEventListener('value-changed', e => this._valueChanged('abs_paratartalom_entity', e.detail.value));
      this.querySelector('#szallópor-entitas')
        ?.addEventListener('value-changed', e => this._valueChanged('szallópor_entity', e.detail.value));
      this.querySelector('#levegominoseg-entitas')
        ?.addEventListener('value-changed', e => this._valueChanged('levegominoseg_entity', e.detail.value));

      // Tartomány hozzáadás gombok
      this.querySelector('#homerseklet-tartomany-hozzaad')
        ?.addEventListener('click', () => this._szintartomanyHozzaad('homerseklet_tartomanyok', 'homerseklet-tartomanyok'));
      this.querySelector('#paratartalom-tartomany-hozzaad')
        ?.addEventListener('click', () => this._szintartomanyHozzaad('paratartalom_tartomanyok', 'paratartalom-tartomanyok'));
      this.querySelector('#szallópor-tartomany-hozzaad')
        ?.addEventListener('click', () => this._szintartomanyHozzaad('szallópor_tartomanyok', 'szallópor-tartomanyok'));
      this.querySelector('#levego-tartomany-hozzaad')
        ?.addEventListener('click', () => this._szintartomanyHozzaad('levego_tartomanyok', 'levego-tartomanyok'));

      this.querySelector('#nyilaszaro-hozzaad')
        ?.addEventListener('click', () => {
          const ujEntitasok = [...(this.config.nyilaszaro_entitasok ?? []), { entity: '', nev: '' }];
          this._valueChanged('nyilaszaro_entitasok', ujEntitasok);
          this._nyilaszaroListaFrissit();
        });
      this.querySelector('#sarok-lekerekites')
        ?.addEventListener('input', e => {
          const val = parseInt(e.target.value);
          this.querySelector('#sarok-lekerekites-ertek').textContent = val + 'px';
          this._valueChanged('sarokLekerekites', val);
        });
      this.querySelector('#nev-betumeret')
        ?.addEventListener('input', e => {
          const val = parseInt(e.target.value);
          this.querySelector('#nev-betumeret-ertek').textContent = val + 'px';
          this._valueChanged('nevBetumeret', val);
        });
      this.querySelector('#homerseklet-betumeret')
        ?.addEventListener('input', e => {
          const val = parseInt(e.target.value);
          this.querySelector('#homerseklet-betumeret-ertek').textContent = val + 'px';
          this._valueChanged('homersekletBetumeret', val);
        });
      this.querySelector('#chip-betumeret')
        ?.addEventListener('input', e => {
          const val = parseInt(e.target.value);
          this.querySelector('#chip-betumeret-ertek').textContent = val + 'px';
          this._valueChanged('chipBetumeret', val);
        });
      this.querySelector('#chip-ikonmeret')
        ?.addEventListener('input', e => {
          const val = parseInt(e.target.value);
          this.querySelector('#chip-ikonmeret-ertek').textContent = val + 'px';
          this._valueChanged('chipIkonmeret', val);
        });

      this._activeTabSettings(this._aktivFul ?? 0);
      this.jartMarItt = true;
    }

    // Értékek frissítése
    const nevMezo = this.querySelector('#nev');
    if (nevMezo) nevMezo.value = this.config.nev ?? '';

    const szinMezo = this.querySelector('#szin-picker');
    if (szinMezo) szinMezo.value = this.config.textColor ?? this.getThemeColor('--primary-text-color', '#212121');

    const hatterMezo = this.querySelector('#kartya-hatter-picker');
    if (hatterMezo) hatterMezo.value = this.config.cardBackgroundColor ?? this.getThemeColor('--card-background-color', '#1c1c1c');

    const homersekletMezo = this.querySelector('#homerseklet-entitas');
    if (homersekletMezo) {
      homersekletMezo.value = this.config.homerseklet_entity ?? '';
      if (this._hass) homersekletMezo.hass = this._hass;
      homersekletMezo.selector = { entity: { domain: 'sensor', device_class: 'temperature' } };
    }
    const kulsoHomersekletMezo = this.querySelector('#kulso-homerseklet-entitas');
    if (kulsoHomersekletMezo) {
      kulsoHomersekletMezo.value = this.config.kulso_homerseklet_entity ?? '';
      if (this._hass) kulsoHomersekletMezo.hass = this._hass;
      kulsoHomersekletMezo.selector = { entity: { domain: 'sensor', device_class: 'temperature' } };
    }
    const paratartalomMezo = this.querySelector('#paratartalom-entitas');
    if (paratartalomMezo) {
      paratartalomMezo.value = this.config.paratartalom_entity ?? '';
      if (this._hass) paratartalomMezo.hass = this._hass;
      paratartalomMezo.selector = { entity: { domain: 'sensor', device_class: 'humidity' } };
    }
    const absParatartalomMezo = this.querySelector('#abs-paratartalom-entitas');
    if (absParatartalomMezo) {
      absParatartalomMezo.value = this.config.abs_paratartalom_entity ?? '';
      if (this._hass) absParatartalomMezo.hass = this._hass;
      absParatartalomMezo.selector = { entity: { domain: 'sensor' } };
    }
    const szalloporMezo = this.querySelector('#szallópor-entitas');
    if (szalloporMezo) {
      szalloporMezo.value = this.config.szallópor_entity ?? '';
      if (this._hass) szalloporMezo.hass = this._hass;
      szalloporMezo.selector = { entity: { domain: 'sensor', device_class: ['pm25', 'pm10'] } };
    }
    const levegominosegMezo = this.querySelector('#levegominoseg-entitas');
    if (levegominosegMezo) {
      levegominosegMezo.value = this.config.levegominoseg_entity ?? '';
      if (this._hass) levegominosegMezo.hass = this._hass;
      levegominosegMezo.selector = { entity: { domain: 'sensor', device_class: ['carbon_dioxide', 'volatile_organic_compounds', 'aqi'] } };
    }

    // Tartományok frissítése
    this._szintartomanyFrissit('homerseklet_tartomanyok', 'homerseklet-tartomanyok');
    this._szintartomanyFrissit('paratartalom_tartomanyok', 'paratartalom-tartomanyok');
    this._szintartomanyFrissit('szallópor_tartomanyok', 'szallópor-tartomanyok');
    this._szintartomanyFrissit('levego_tartomanyok', 'levego-tartomanyok');

    const sarokSlider = this.querySelector('#sarok-lekerekites');
    if (sarokSlider) {
      const val = this.config.sarokLekerekites ?? 12;
      sarokSlider.value = val;
      this.querySelector('#sarok-lekerekites-ertek').textContent = val + 'px';
    }
    const nevSlider = this.querySelector('#nev-betumeret');
    if (nevSlider) {
      const val = this.config.nevBetumeret ?? 13;
      nevSlider.value = val;
      this.querySelector('#nev-betumeret-ertek').textContent = val + 'px';
    }
    const homersekletSlider = this.querySelector('#homerseklet-betumeret');
    if (homersekletSlider) {
      const val = this.config.homersekletBetumeret ?? 20;
      homersekletSlider.value = val;
      this.querySelector('#homerseklet-betumeret-ertek').textContent = val + 'px';
    }
    const chipBetumeretSlider = this.querySelector('#chip-betumeret');
    if (chipBetumeretSlider) {
      const val = this.config.chipBetumeret ?? 10;
      chipBetumeretSlider.value = val;
      this.querySelector('#chip-betumeret-ertek').textContent = val + 'px';
    }
    const chipIkonmeretSlider = this.querySelector('#chip-ikonmeret');
    if (chipIkonmeretSlider) {
      const val = this.config.chipIkonmeret ?? 12;
      chipIkonmeretSlider.value = val;
      this.querySelector('#chip-ikonmeret-ertek').textContent = val + 'px';
    }

    this._nyilaszaroListaFrissit();
    this._activeTabSettings(this._aktivFul ?? 0);
  }
}

customElements.define('room-card-editor', RoomCardEditor);


// ============================================
// KÁRTYA
// ============================================
class RoomCard extends HTMLElement {

    set hass(hass) {
      const oldState = this._hass?.states;
      this._hass = hass;
    
      if (!oldState) {
        this.render();
        return;
      }
    
      const entity = this.config?.homerseklet_entity;
      if (entity && oldState[entity]?.state !== hass.states[entity]?.state) {
        this.render();
      }
    }

  setConfig(config) {
    this.config = { ...config };
  }

  // Tartomány alapján szín kikeresése
  _tartomanySzin(ertek, tartomanyok) {
    if (!tartomanyok?.length) return null;
    const val = parseFloat(ertek);
    if (isNaN(val)) return null;
    for (const t of tartomanyok) {
      const tolOk = t.tol === null || t.tol === undefined || val >= t.tol;
      const igOk = t.ig === null || t.ig === undefined || val <= t.ig;
      if (tolOk && igOk) return t.szin;
    }
    return null;
  }

  render() {
    if (!this._hass || !this.config) return;

    const themeBackgroundColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--card-background-color').trim();
    const themeTextColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary-text-color').trim();

    const {
      homerseklet_entity,
      kulso_homerseklet_entity,
      paratartalom_entity,
      abs_paratartalom_entity,
      szallópor_entity,
      levegominoseg_entity,
      homerseklet_tartomanyok,
      paratartalom_tartomanyok,
      szallópor_tartomanyok,
      levego_tartomanyok,
      nev,
      szin,
      textColor = themeTextColor,
      cardBackgroundColor = themeBackgroundColor,
      sarokLekerekites = 12,
      nevBetumeret = 13,
      homersekletBetumeret = 20,
      chipBetumeret = 10,
      chipIkonmeret = 12,
      icon = 'mdi:home'
    } = this.config;

    const homerseklet = this._hass.states[homerseklet_entity]?.state ?? '–';
    const belsoHo = parseFloat(this._hass.states[homerseklet_entity]?.state);
    const kulsoHo = kulso_homerseklet_entity
      ? parseFloat(this._hass.states[kulso_homerseklet_entity]?.state)
      : null;

    const paratartalom = paratartalom_entity
      ? this._hass.states[paratartalom_entity]?.state : null;
    const absParatartalom = abs_paratartalom_entity
      ? this._hass.states[abs_paratartalom_entity]?.state : null;
    const absParatartalomEgyseg = abs_paratartalom_entity
      ? this._hass.states[abs_paratartalom_entity]?.attributes?.unit_of_measurement ?? 'g/m³' : '';

    let paratartalomSzoveg = null;
    if (paratartalom !== null) {
      paratartalomSzoveg = `${paratartalom}%`;
      if (absParatartalom !== null) paratartalomSzoveg += ` · ${absParatartalom} ${absParatartalomEgyseg}`;
    }

    const szallopor = szallópor_entity
      ? this._hass.states[szallópor_entity]?.state : null;
    const szalloporEgyseg = szallópor_entity
      ? this._hass.states[szallópor_entity]?.attributes?.unit_of_measurement ?? 'µg/m³' : '';

    const levego = levegominoseg_entity
      ? this._hass.states[levegominoseg_entity]?.state : null;
    const levegoEgyseg = levegominoseg_entity
      ? this._hass.states[levegominoseg_entity]?.attributes?.unit_of_measurement ?? '' : '';

    // Chip színek tartomány alapján (ha nincs tartomány, visszaesik az eredeti logikára)
    const homersekletChipSzin = this._tartomanySzin(homerseklet, homerseklet_tartomanyok);
    const paratartalomChipSzin = this._tartomanySzin(paratartalom, paratartalom_tartomanyok);
    const szalloporChipSzin = this._tartomanySzin(szallopor, szallópor_tartomanyok)
      ?? this._szalloporSzinKod(szallopor);
    const levegoChipSzin = this._tartomanySzin(levego, levego_tartomanyok)
      ?? this._levegoSzinKod(levego, levegoEgyseg);

    // Nyílászárók
    const nyilaszaroChipek = [];
    if (this.config.nyilaszaro_entitasok?.length > 0) {
      for (const entitas of this.config.nyilaszaro_entitasok) {
        if (!entitas.entity) continue;
        const allapot = this._hass.states[entitas.entity];
        if (!allapot) continue;
        const nyitva = allapot.state === 'on';
        const chipNev = entitas.nev?.trim() || allapot.attributes?.friendly_name || entitas.entity;
        const deviceClass = allapot.attributes?.device_class ?? 'window';
        let ikonNyitva = 'mdi:window-open', ikonZarva = 'mdi:window-closed';
        if (deviceClass === 'door') { ikonNyitva = 'mdi:door-open'; ikonZarva = 'mdi:door-closed'; }
        else if (deviceClass === 'garage_door') { ikonNyitva = 'mdi:garage-open'; ikonZarva = 'mdi:garage'; }
        let ikonSzin = 'inherit';
        if (nyitva && kulsoHo !== null && !isNaN(kulsoHo) && !isNaN(belsoHo)) {
          const diff = kulsoHo - belsoHo;
          if (diff < -2) ikonSzin = '#42a5f5';
          else if (diff > 2) ikonSzin = '#ef5350';
          else ikonSzin = '#66bb6a';
        }
        nyilaszaroChipek.push({ nyitva, chipNev, ikonNyitva, ikonZarva, ikonSzin });
      }
    }

    // Chip HTML segédfüggvény egyedi színnel
    const chipHTML = (ikon, szoveg, egyediSzin, extraClass = '') => {
      if (egyediSzin) {
        return `<div class="chip" style="background:${egyediSzin}22; color:${egyediSzin};">
          <ha-icon icon="${ikon}" class="chip-ikon" style="color:${egyediSzin}"></ha-icon>
          <span>${szoveg}</span>
        </div>`;
      }
      return `<div class="chip ${extraClass}">
        <ha-icon icon="${ikon}" class="chip-ikon"></ha-icon>
        <span>${szoveg}</span>
      </div>`;
    };

    this.innerHTML = `
      <ha-card>
        <div class="kartya-belso">
          <div class="bal-oldal">
            <div class="ikon-hatter" style="background:${szin}22">
              <ha-icon icon="${icon}" style="color:${szin}"></ha-icon>
            </div>
            <div class="info-blokk">
              <div class="szoba-nev">${nev ?? homerseklet_entity ?? '–'}</div>
              <div class="chip-sor">

                ${paratartalomSzoveg !== null
                  ? chipHTML('mdi:water-percent', paratartalomSzoveg, paratartalomChipSzin)
                  : ''}

                ${szallopor !== null
                  ? chipHTML('mdi:blur', `${szallopor} ${szalloporEgyseg}`, szalloporChipSzin)
                  : ''}

                ${levego !== null
                  ? chipHTML('mdi:molecule-co2', `${levego} ${levegoEgyseg}`, levegoChipSzin)
                  : ''}

                ${nyilaszaroChipek.map(chip => `
                  <div class="chip ${chip.nyitva ? 'chip-nyitva' : 'chip-zarva'}">
                    <ha-icon icon="${chip.nyitva ? chip.ikonNyitva : chip.ikonZarva}"
                      class="chip-ikon" style="color:${chip.ikonSzin}"></ha-icon>
                    <span>${chip.chipNev}</span>
                  </div>`).join('')}

              </div>
            </div>
          </div>
          <div class="homerseklet" style="${homersekletChipSzin ? `color:${homersekletChipSzin}` : ''}">
            ${homerseklet}<span class="fok">°C</span>
          </div>
        </div>
      </ha-card>
      <style>
        ha-card {
          background: ${cardBackgroundColor};
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: ${sarokLekerekites}px;
          overflow: hidden;
        }
        .kartya-belso {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 14px 16px; gap: 8px;
        }
        .bal-oldal { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
        .info-blokk { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .ikon-hatter { border-radius: 10px; padding: 8px; display: flex; align-items: center; flex-shrink: 0; }
        ha-icon { --mdc-icon-size: 20px; }
        .szoba-nev { font-size: ${nevBetumeret}px; font-weight: 500; color: ${textColor}; }
        .homerseklet { font-size: ${homersekletBetumeret}px; font-weight: 500; color: ${textColor}; letter-spacing: -0.5px; flex-shrink: 0; }
        .fok { font-size: ${Math.round(homersekletBetumeret * 0.7)}px; color: inherit; }
        .chip-sor { display: flex; flex-wrap: wrap; gap: 4px; }
        .chip {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: ${chipBetumeret}px; color: ${textColor};
          background: rgba(128,128,128,0.12);
          border-radius: 6px; padding: 2px 6px;
        }
        .chip-ikon { --mdc-icon-size: ${chipIkonmeret}px !important; }
        .chip-jo { background: rgba(76,175,80,0.15); color: #4caf50; }
        .chip-kozepes { background: rgba(255,152,0,0.15); color: #ff9800; }
        .chip-rossz { background: rgba(244,67,54,0.15); color: #f44336; }
        .chip-nyitva { background: rgba(255,152,0,0.12); }
        .chip-zarva { background: rgba(76,175,80,0.12); }
      </style>
    `;
  }

  // Visszaadja a beépített szín kódot (ha nincs egyedi tartomány)
  _szalloporSzinKod(ertek) {
    const pm = parseFloat(ertek);
    if (isNaN(pm)) return null;
    if (pm <= 12) return '#4caf50';
    if (pm <= 35) return '#ff9800';
    return '#f44336';
  }

  _levegoSzinKod(ertek, egyseg) {
    const val = parseFloat(ertek);
    if (isNaN(val)) return null;
    if (egyseg === 'ppm') {
      if (val <= 800) return '#4caf50';
      if (val <= 1200) return '#ff9800';
      return '#f44336';
    }
    if (val <= 50) return '#4caf50';
    if (val <= 100) return '#ff9800';
    return '#f44336';
  }

  static getConfigElement() {
    return document.createElement('room-card-editor');
  }

  static getStubConfig() {
    return {
      homerseklet_entity: 'sensor.nappali_homerseklet',
      paratartalom_entity: 'sensor.nappali_paratartalom',
      nev: 'Nappali',
      szin: '#ffa726',
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
  description: "Szobahőmérséklet és páratartalom kártya",
});
