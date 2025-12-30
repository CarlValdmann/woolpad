# 🧵 Heegelmotiivide Redaktor - Professional

Professionaalne veebirakendus heegelmotiivide loomiseks ja redigeerimiseks koos elegantse kasutajaliidesega.

## ✨ Funktsioonid

### 🎨 Põhifunktsioonid
- **14 erinevat heegelpistete tüüpi** - Ahelpistet, kinnispistet, topeltvarras, jne
- **Automaatne mustri jätkamine** - Pärast 3 silmust ringil
- **Mitmekihiline süsteem** - Round/layer haldus
- **Automaatne pööramine** - Pistete suunamine keskpunkti poole
- **Sümmeetria režiimid** - Peegel, radiaalne (4/6/8-suunaline)

### 🛠️ Tööriistad
- ✏️ **Joonista** - Lisa pisteid canvasele
- 🧹 **Kustutaja** - Eemalda pisteid
- 📏 **Sirge joon** - Joonista sirgeid jooni
- ✋ **Liiguta** - Liiguta pisteid ümber
- ⬚ **Vali ala** - Vali, kopeeri, kleebi

### 🎯 UI Funktsioonid
- Vasak vertikaalne toolbar ikoonidega
- Parem sidebar: Rounds, Properties, Stitch Palette
- Minimalistlik ülemine menüüriba
- Alumine statusbar zoomiga
- Hover tooltipid ja visuaalne feedback

### 📊 Kujud
- Ring (circular/mandala patterns)
- Ruut (granny squares)
- Kuusnurk (hexagon motifs)
- Kolmnurk, Kaheksanurk
- Vabakuju (freeform)

## 🚀 Kiirkäivitus

### 1. VS Code'is avamine
```bash
code heegelmotiivid-pro
```

### 2. Live Server kasutamine
1. Installi VS Code extension: **Live Server** (Ritwick Dey)
2. Ava `index.html`
3. Parem-klõps → "Open with Live Server"
4. Brauser avaneb automaatselt

### 3. Alternatiiv: Python HTTP Server
```bash
cd heegelmotiivid-pro
python -m http.server 8000
```
Ava brauser: `http://localhost:8000`

## 📁 Projekti struktuur

```
heegelmotiivid-pro/
├── index.html                 # Peamine HTML fail (kõik koos)
├── README.md                  # See fail
├── DEVELOPMENT.md            # Arenduse juhend
├── TODO.md                   # Tulevased täiendused
├── src/
│   ├── js/
│   │   ├── config.js         # Konfiguratsioon (tulevik)
│   │   ├── state.js          # Globaalne olek (tulevik)
│   │   ├── canvas.js         # Canvas rendering (tulevik)
│   │   ├── tools.js          # Tööriistad (tulevik)
│   │   └── ui.js             # UI komponendid (tulevik)
│   ├── css/
│   │   └── styles.css        # Eraldi CSS (tulevik)
│   └── assets/
│       └── images/           # Ikoonid, pildid
├── docs/
│   ├── DEVELOPMENT.md        # Arenduse juhend
│   ├── API.md               # API dokumentatsioon
│   └── FEATURES.md          # Funktsioonide kirjeldus
└── examples/
    ├── mandala.json         # Näidis mandala
    ├── granny-square.json   # Näidis granny square
    └── hexagon.json         # Näidis kuusnurk
```

## 🔧 Arendamine

### Praegune struktuur
Hetkel on **kõik kood `index.html` failis** (monolithic).
See on lihtsam testimiseks ja kasutusel võtmiseks.

### Tulevik: Moodulite süsteem
Kui projekt kasvab, saame jagada:
1. **HTML** → `index.html`
2. **CSS** → `src/css/styles.css`
3. **JavaScript** → `src/js/` moodulid

### Kuidas alustada
```bash
# 1. Ava projekt
code heegelmotiivid-pro

# 2. Muuda index.html
# Live Server värskendab automaatselt

# 3. Testi
# Ava brauser ja proovi funktsioone

# 4. Git
git init
git add .
git commit -m "Initial commit"
```

## 📝 Kiirklahvid

- **Ctrl+S** - Salvesta JSON
- **F12** - Developer Tools
- **Ctrl+Shift+R** - Hard reload (kui muudatused ei ilmu)

## 🎯 Peamised komponendid

### Canvas
- `<canvas id="canvas">` - Peamine joonistusala
- Rendering funktsioonid: `drawGrid()`, `drawStitch()`, `redrawStitches()`

### Left Toolbar
- `<div class="left-toolbar">` - Vertikaalne toolbarid
- Tool ikoonid: Joonista, Kustuta, Joon, Liiguta, Vali

### Right Sidebar
- `<div class="right-sidebar">` - Properties paneel
- Rounds list, Properties, Stitch Palette

### State Management
```javascript
let currentStitch = 'chain';
let currentColor = '#000000';
let layers = [{ id: 1, name: 'Round 1', stitches: [] }];
let currentLayerIndex = 0;
```

## 🐛 Debugging

### Browser Console
```javascript
// Vaata oma mustri struktuuri
console.log(layers);

// Kontrolli praegust layer'it
console.log(getCurrentLayer());

// Vaata soovitusi
console.log(suggestions);
```

### Levinud probleemid

**Nupud ei tööta?**
- Kontrolli Console erroreid (F12)
- Veendu, et DOM on laetud
- Kontrolli event listener'eid

**Canvas ei joonista?**
- Kontrolli `ctx` objekti
- Vaata kas `drawStitch()` töötab
- Kontrolli koordinaate

**Mustri jätkamine ei tööta?**
- Kontrolli kas `autoContinueEnabled = true`
- Veendu, et on vähemalt 3 silmust
- Vaata `analyzePattern()` Console log'e

## 📚 API Dokumentatsioon

### Peamised funktsioonid

```javascript
// Canvas
initCanvas()              // Initsialiseerib canvas
drawGrid()               // Joonistab ruudustiku
drawStitch(x, y, ...)    // Joonistab ühe pisteto
redrawStitches()         // Uuendab kogu canvas

// Tools
setToolMode(mode)        // Muudab tööriista
handleDrawMode(x, y)     // Joonistamine
handleEraseMode(x, y)    // Kustutamine

// Layers
addNewLayer()            // Lisa uus round
previousLayer()          // Eelmine round
nextLayer()              // Järgmine round

// Pattern Analysis
analyzePattern()         // Analüüsib mustrit
applySymmetry(x, y)      // Rakendab sümmeetriat

// Export
savePattern()            // PNG eksport
saveJSON()              // JSON eksport
loadJSON()              // JSON import
```

## 🎨 CSS Klassid

```css
.tool-icon              /* Toolbar nupp */
.tool-icon.active       /* Aktiivne tööriist */
.round-item             /* Round list item */
.round-item.active      /* Aktiivne round */
.stitch-palette-item    /* Pisteto paletis */
.property-row           /* Property rida */
```

## 🚧 Tulevased täiendused

Vaata `TODO.md` faili täieliku nimekirja jaoks.

**Kõige olulisemad:**
- [ ] Undo/Redo funktsioonid
- [ ] Custom pistete loomine
- [ ] Kopeeri/Kleebi täisfunktsionaalsus
- [ ] Zoom sisse/välja
- [ ] Mobile optimiseerimine
- [ ] Export PDF formaat
- [ ] Template'id ja näidised

## 📄 Litsents

MIT License - vaba kasutamiseks ja muutmiseks.

## 🤝 Panustamine

Pull request'id on teretulnud! Vaata `DEVELOPMENT.md` arenduse juhiseid.

## 📧 Kontakt

Küsimused? Ava issue või võta ühendust.

---

**Viimati uuendatud:** 2024-12-29
**Versioon:** 2.0.0 Professional
