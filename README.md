# Room Card for Home Assistant

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=fatal1989&repository=room-card&category=plugin)

Egy modern, letisztult és nagymértékben testreszabható egyedi kártya (custom card) Home Assistanthez, amellyel egy adott szoba legfontosabb klíma- és környezeti adatait jelenítheted meg.

A kártya saját, beépített grafikus szerkesztővel (Visual Editor) rendelkezik, így YAML kódolás nélkül is könnyedén beállítható!

✨ Főbb funkciók
Klímaadatok megjelenítése: Beltéri/kültéri hőmérséklet, relatív és abszolút páratartalom.

Levegőminőség: Szálló por (PM2.5 / PM10) és CO2 / VOC / AQI értékek támogatása.

Nyílászárók figyelése: Ajtó- és ablakszenzorok állapotának megjelenítése. Az ikon színe dinamikusan változik a kinti és benti hőmérséklet különbsége alapján (pl. piros, ha nyitva van az ablak, de kint sokkal hidegebb/melegebb van).

Dinamikus színtartományok: A hőmérséklet, páratartalom és levegőminőség értékekhez egyedi színtartományokat (tól-ig) rendelhetsz.

Többnyelvűség (i18n): Külön fájlban (translations.js) kezelt nyelvi fájlok. Automatikusan felismeri a Home Assistant nyelvét (Magyar / Angol támogatás beépítve), de a szerkesztőben manuálisan is felülbírálható.

Teljes testreszabhatóság: Állítható betűszínek, háttérszínek (vagy téma alapértelmezett), saroklekerekítés, betű- és ikonméretek.

📥 Telepítés
Mivel a kártya moduláris felépítésű (a nyelvi fájlokat külön kezeli), nagyon fontos, hogy JavaScript Module-ként (ES6) regisztráld a Home Assistantben!

Manuális telepítés
Töltsd le a room-card.js és a translations.js fájlokat.

Másold be mindkét fájlt a Home Assistant config/www/room-card/ mappájába (ha a mappa nem létezik, hozd létre).

Lépj be a Home Assistant felületén a Beállítások -> Irányítópultok (Dashboards) -> jobb felül a három pontra kattintva Erőforrások (Resources) menüpontba.

Kattints az Erőforrás hozzáadása gombra:

URL: /local/room-card/room-card.js

Erőforrás típusa: JavaScript Module (type: module)

Frissítsd a böngésződet (F5 vagy Ctrl+R), vagy ürítsd a gyorsítótárat.

🛠️ Használat
A telepítés után navigálj az egyik Irányítópultodra (Dashboard), kattints a szerkesztésre, majd a kártya hozzáadására. Keresd meg a listában a "Room Card"-ot.

A beállításokat a vizuális szerkesztőben fülekre bontva találod:

Általános: Szoba neve, ikonja és a nyelv beállítása.

Érzékelők: Hőmérséklet, páratartalom, levegőminőség entitások és azok színtartományainak megadása.

Nyílászárók: Ajtó és ablak nyitásérzékelők (binary_sensor) hozzáadása.

Megjelenés: Színek, formák, betű- és ikonméretek finomhangolása.
