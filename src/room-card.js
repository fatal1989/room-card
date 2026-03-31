// ============================================
// SZERKESZTŐ
// ============================================
class RoomCardEditor extends HTMLElement {

  set hass(hass) {
    this._hass = hass;
    // Entity picker-eknek kell a hass
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

  render() {
    if (!this.config) return;

    this.innerHTML = `
      <style>
        .szerkeszto {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 4px 0;
        }
        .mezocsoport {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .csoport-cim {
          font-size: 11px;
          font-weight: 500;
          color: var(--secondary-text-color);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding-bottom: 4px;
          border-bottom: 1px solid var(--divider-color);
        }
        .mezo-sor {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        label {
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-bottom: 4px;
          display: block;
        }
        .szin-sor {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .szin-elonezet {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid var(--divider-color);
          flex-shrink: 0;
        }
        ha-entity-picker,
        ha-icon-picker,
        ha-textfield {
          display: block;
          width: 100%;
        }
      </style>

      <div class="szerkeszto">

        <div class="mezocsoport">
          <div class="csoport-cim">Alapadatok</div>

          <div>
            <label>Szoba neve</label>
            <ha-textfield
              id="nev"
              .value="${this.config.nev ?? ''}"
              placeholder="pl. Nappali"
            ></ha-textfield>
          </div>

          <div class="mezo-sor">
            <div>
              <label>Hőmérséklet szenzor</label>
              <ha-entity-picker
                id="entity"
                .hass="${this._hass}"
                .value="${this.config.entity ?? ''}"
                domain-filter="sensor"
              ></ha-entity-picker>
            </div>
            <div>
              <label>Páratartalom szenzor</label>
              <ha-entity-picker
                id="paratartalom_entity"
                .hass="${this._hass}"
                .value="${this.config.paratartalom_entity ?? ''}"
                domain-filter="sensor"
              ></ha-entity-picker>
            </div>
          </div>
        </div>

        <div class="mezocsoport">
          <div class="csoport-cim">Megjelenés</div>

          <div>
            <label>Ikon</label>
            <ha-icon-picker
              id="icon"
              .value="${this.config.icon ?? 'mdi:home'}"
            ></ha-icon-picker>
          </div>

          <div>
            <label>Kiemelő szín</label>
            <div class="szin-sor">
              <div
                class="szin-elonezet"
                style="background:${this.config.szin ?? '#4fc3f7'}"
              ></div>
              <ha-textfield
                id="szin"
                .value="${this.config.szin ?? '#4fc3f7'}"
                placeholder="#4fc3f7"
              ></ha-textfield>
            </div>
          </div>

          <div>
            <label>Gyorsszínek</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${[
                { szin: '#ffa726', nev: 'Narancs' },
                { szin: '#66bb6a', nev: 'Zöld' },
                { szin: '#4fc3f7', nev: 'Kék' },
                { szin: '#26c6da', nev: 'Türkiz' },
                { szin: '#ef5350', nev: 'Piros' },
                { szin: '#ab47bc', nev: 'Lila' },
              ].map(({ szin, nev }) => `
                <div
                  class="gyors-szin"
                  title="${nev}"
                  data-szin="${szin}"
                  style="
                    width:28px;height:28px;
                    border-radius:8px;
                    background:${szin};
                    cursor:pointer;
                    border:2px solid ${this.config.szin === szin ? '#fff' : 'transparent'};
                    transition:border-color 0.15s;
                  "
                ></div>
              `).join('')}
            </div>
          </div>
        </div>

      </div>
    `;

    this.querySelector('#nev')
      ?.addEventListener('change', e => this._valueChanged('nev', e.target.value));

    this.querySelector('#entity')
      ?.addEventListener('value-changed', e => this._valueChanged('entity', e.detail.value));

    this.querySelector('#paratartalom_entity')
      ?.addEventListener('value-changed', e => this._valueChanged('paratartalom_entity', e.detail.value));

    this.querySelector('#icon')
      ?.addEventListener('value-changed', e => this._valueChanged('icon', e.detail.value));

    this.querySelector('#szin')
      ?.addEventListener('change', e => {
        this._valueChanged('szin', e.target.value);
        this.querySelector('.szin-elonezet').style.background = e.target.value;
      });

    this.querySelectorAll('.gyors-szin').forEach(el => {
      el.addEventListener('click', () => {
        this._valueChanged('szin', el.dataset.szin);
        this.config = { ...this.config, szin: el.dataset.szin };
        this.render();
      });
    });
  }
}

customElements.define('room-card-editor', RoomCardEditor);


// ============================================
// KÁRTYA
// ============================================
class RoomCard extends HTMLElement {

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  setConfig(config) {
    if (!config.entity) throw new Error('Az entity megadása kötelező');
    this.config = { ...config };
  }

  render() {
    if (!this._hass || !this.config) return;

    const {
      entity,
      nev,
      paratartalom_entity,
      szin = '#4fc3f7',
      icon = 'mdi:home'
    } = this.config;

    const homerseklet = this._hass.states[entity]?.state ?? '–';
    const paratartalom = paratartalom_entity
      ? this._hass.states[paratartalom_entity]?.state + '% páratartalom'
      : '';

    this.innerHTML = `
      <ha-card>
        <div class="kartya-belso">
          <div class="bal-oldal">
            <div class="ikon-hatter" style="background:${szin}22">
              <ha-icon icon="${icon}" style="color:${szin}"></ha-icon>
            </div>
            <div>
              <div class="szoba-nev">${nev ?? entity}</div>
              ${paratartalom ? `<div class="al-szoveg">${paratartalom}</div>` : ''}
            </div>
          </div>
          <div class="homerseklet" style="color:${szin}">
            ${homerseklet}<span class="fok">°C</span>
          </div>
        </div>
      </ha-card>
      <style>
        ha-card {
          background: #242628;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
        }
        .kartya-belso {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
        }
        .bal-oldal { display:flex;align-items:center;gap:10px; }
        .ikon-hatter { border-radius:10px;padding:8px;display:flex;align-items:center; }
        ha-icon { --mdc-icon-size:20px; }
        .szoba-nev { font-size:13px;font-weight:500;color:#e8e9ea; }
        .al-szoveg { font-size:11px;color:#8a8d91;margin-top:2px; }
        .homerseklet { font-size:20px;font-weight:500;letter-spacing:-0.5px; }
        .fok { font-size:12px;color:#8a8d91; }
      </style>
    `;
  }

  static getConfigElement() {
    return document.createElement('room-card-editor');
  }

  static getStubConfig() {
    return {
      entity: 'sensor.nappali_homerseklet',
      nev: 'Nappali',
      szin: '#ffa726',
      icon: 'mdi:sofa'
    };
  }

  getCardSize() { return 1; }
}

customElements.define('room-card', RoomCard);
customElements.define('room-card-editor', RoomCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "room-card",
  name: "Room Card",
  preview: false,
  description: "Szobahőmérséklet és páratartalom kártya",
});
