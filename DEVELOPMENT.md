# 🔧 Arenduse juhend

## Arhitektuur

### Praegune struktuur (Monolithic)

Hetkel on kogu kood `index.html` failis:
- HTML struktuuri
- CSS stiilid (`<style>` sees)
- JavaScript kood (`<script>` sees)

**Eelised:**
- ✅ Lihtne deploy'ida (üks fail)
- ✅ Ei vaja build tool'e
- ✅ Kiire testimine
- ✅ Kõik ühes kohas

**Puudused:**
- ❌ Raske hallata suurtes projektides
- ❌ Ei saa koodi taaskasutada
- ❌ Raskem debuggida

### Tulevik: Moodulite süsteem

Kui projekt kasvab, soovitame jagada:

```
src/
├── js/
│   ├── config.js         # Konstandid
│   ├── state.js          # Globaalne olek
│   ├── canvas.js         # Canvas rendering
│   ├── tools.js          # Tööriistad
│   ├── pattern.js        # Mustri analüüs
│   └── ui.js            # UI komponendid
├── css/
│   └── styles.css       # Kõik stiilid
└── assets/
    └── images/          # Ikoonid
```

## 🎨 CSS Struktuuri

### Peamised osad

1. **Reset & Base** (read 1-50)
2. **Top Menu** (read 51-150)
3. **Left Toolbar** (read 151-250)
4. **Canvas Area** (read 251-350)
5. **Right Sidebar** (read 351-550)
6. **Modals** (read 551-650)
7. **Responsive** (read 651-750)

### Värviskeemi

```css
Primary: #6B8CAE (sinine-hall)
Background: #f5f5f5 (hele hall)
White: #ffffff
Border: #e0e0e0
Text: #333333
Light text: #666666
Success: #28a745 (roheline)
```

### Kui lisad uut UI elementi:

1. Lisa HTML struktuuri
2. Lisa CSS klassid
3. Lisa JavaScript event handlerid

## 📝 JavaScript Struktuuri

### Globaalne olek (State)

```javascript
// Peamised muutujad
let currentStitch = 'chain';
let currentColor = '#000000';
let currentShape = 'circle';
let layers = [];
let currentLayerIndex = 0;
```

### Funktsioonide grupid

1. **Configuration** (read 1-100)
   - Konstandid
   - Stitchi sümbolid
   - Nimed

2. **UI Initialization** (read 101-500)
   - `initUI()`
   - `createLeftToolbar()`
   - `createRightSidebar()`

3. **Canvas Rendering** (read 501-800)
   - `drawGrid()`
   - `drawStitch()`
   - `redrawStitches()`

4. **Tools & Events** (read 801-1200)
   - `setToolMode()`
   - `handleDrawMode()`
   - Event listeners

5. **Pattern Analysis** (read 1201-1400)
   - `analyzePattern()`
   - `applySymmetry()`

6. **Layer Management** (read 1401-1500)
   - `addNewLayer()`
   - `previousLayer()`

7. **Export** (read 1501-1600)
   - `savePattern()`
   - `saveJSON()`

## 🔍 Debuggimise strateegiad

### Console.log kasutamine

```javascript
// Vaata praegust olekut
function debugState() {
    console.log('Current stitch:', currentStitch);
    console.log('Layers:', layers);
    console.log('Current layer:', getCurrentLayer());
    console.log('Suggestions:', suggestions);
}
```

### Browser Developer Tools

1. **Elements tab** - HTML struktuuri vaatamine
2. **Console tab** - Errorid ja log'id
3. **Sources tab** - Breakpoint'id
4. **Network tab** - Failide laadimine

### Levinud vead

**"Cannot read property of undefined"**
```javascript
// Vale
const stitch = layers[5].stitches[0];

// Õige
const layer = layers[currentLayerIndex];
if (layer && layer.stitches.length > 0) {
    const stitch = layer.stitches[0];
}
```

**Event listener ei tööta**
```javascript
// Vale - element ei ole veel olemas
const btn = document.getElementById('myBtn');
btn.onclick = myFunction;

// Õige - kontrolli kas element on olemas
const btn = document.getElementById('myBtn');
if (btn) {
    btn.onclick = myFunction;
}
```

## 🧪 Testimine

### Käsitsi testimine

Checklist:
- [ ] Joonista pisteid
- [ ] Kustuta pisteid
- [ ] Joonista joon
- [ ] Lisa uus round
- [ ] Vaheta rounde
- [ ] Muuda pisteto suurust
- [ ] Muuda värvi
- [ ] Sümmeetria režiimid
- [ ] Salvesta PNG
- [ ] Salvesta JSON
- [ ] Laadi JSON

### Test Cases

```javascript
// Test 1: Lisa 3 silmust, peaks ilmuma soovitused
function test_autoPattern() {
    // Puhasta
    layers = [{ id: 1, name: 'Test', stitches: [] }];
    
    // Lisa 3 silmust
    const center = getCenter();
    for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        layers[0].stitches.push({
            x: center.x + Math.cos(angle) * 100,
            y: center.y + Math.sin(angle) * 100,
            stitch: 'dc',
            color: '#000000'
        });
    }
    
    analyzePattern();
    
    console.assert(suggestions.length > 0, 'Peaks olema soovitusi');
}
```

## 📦 Deploy

### GitHub Pages

1. Push projekti GitHubi
2. Settings → Pages
3. Vali `main` branch
4. Deploy automaatselt

### Netlify/Vercel

1. Drag & drop kaust
2. Või lingi GitHub repo
3. Auto-deploy iga push'iga

## 🎯 Uue funktsiooni lisamine

### Näide: Lisa uus tööriist

**1. Lisa UI element**
```javascript
// createLeftToolbar() funktsioonis
const newTool = document.createElement('div');
newTool.className = 'tool-icon';
newTool.innerHTML = '🎨';
newTool.title = 'Minu uus tööriist';
newTool.onclick = () => setToolMode('mytool');
toolbar.appendChild(newTool);
```

**2. Lisa tool mode**
```javascript
// setToolMode() funktsioonis lisa case
if (mode === 'mytool') {
    canvas.style.cursor = 'pointer';
}
```

**3. Lisa event handler**
```javascript
// Event listener'is
if (currentToolMode === 'mytool') {
    handleMyTool(x, y);
}
```

**4. Lisa funktsionaalsus**
```javascript
function handleMyTool(x, y) {
    // Sinu loogika siin
    console.log('My tool used at:', x, y);
}
```

## 🔄 Refactoring mooduliteks

Kui oled valmis jagama koodi mooduliteks:

### 1. Eraldi CSS
```html
<!-- index.html -->
<link rel="stylesheet" href="src/css/styles.css">
```

### 2. Eraldi JavaScript moodulid
```html
<!-- index.html -->
<script type="module" src="src/js/main.js"></script>
```

```javascript
// src/js/main.js
import { initCanvas } from './canvas.js';
import { initUI } from './ui.js';

initUI();
initCanvas();
```

### 3. Config eraldi
```javascript
// src/js/config.js
export const stitchSymbols = {
    'chain': '○',
    // ...
};
```

## 💡 Best Practices

### Nimetamine
- **Funktsioonid:** camelCase (`drawStitch`, `getCurrentLayer`)
- **Konstandid:** UPPER_CASE (`STITCH_SYMBOLS`)
- **Klassid:** kebab-case (`tool-icon`, `round-item`)

### Kommentaarid
```javascript
// ✅ Hea kommentaar
// Calculate angle from center to point
const angle = Math.atan2(y - center.y, x - center.x);

// ❌ Halb kommentaar
// Get angle
const angle = Math.atan2(y - center.y, x - center.x);
```

### Error handling
```javascript
// ✅ Hea
try {
    const data = JSON.parse(text);
    loadPattern(data);
} catch (error) {
    console.error('Failed to load:', error);
    alert('Viga: ' + error.message);
}

// ❌ Halb
const data = JSON.parse(text);
loadPattern(data);
```

## 📚 Kasulikud ressursid

- **MDN Web Docs** - HTML/CSS/JS dokumentatsioon
- **Canvas API** - https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **VS Code shortcuts** - Ctrl+K Ctrl+S

## 🆘 Abi saamine

1. Kontrolli Console erroreid
2. Vaata läbi see DEVELOPMENT.md
3. Vaata API.md dokumentatsiooni
4. Debuggi samm-sammult
5. Küsi abi (GitHub Issues)

---

Edu arendamisel! 🚀
