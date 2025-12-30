# 📚 API Dokumentatsioon

## Peamised funktsioonid

### Canvas Rendering

#### `initCanvas()`
Initsialiseerib canvas'e ja joonistab algse ruudustiku.

```javascript
initCanvas();
```

#### `drawGrid()`
Joonistab ruudustiku canvasele vastavalt valitud kujule.

```javascript
drawGrid();
```

#### `drawStitch(x, y, stitch, color, isSuggestion, size, rotation)`
Joonistab ühe pisteto.

**Parameetrid:**
- `x` (number) - X koordinaat
- `y` (number) - Y koordinaat  
- `stitch` (string) - Pisteto tüüp (nt 'chain', 'dc')
- `color` (string) - Värv hex formaadis
- `isSuggestion` (boolean) - Kas on soovitus
- `size` (number) - Pisteto suurus pikslites
- `rotation` (number) - Pöördenurk kraadides

```javascript
drawStitch(300, 300, 'dc', '#000000', false, 22, 0);
```

### Tool Management

#### `setToolMode(mode)`
Vahetab aktiivset tööriista.

**Parameetrid:**
- `mode` (string) - 'draw', 'erase', 'line', 'move', 'select'

```javascript
setToolMode('draw');
```

### Layer Management

#### `addNewLayer()`
Lisab uue layer'i (round).

```javascript
addNewLayer();
```

#### `getCurrentLayer()`
Tagastab praeguse aktiivse layer'i.

**Tagastab:** Object

```javascript
const layer = getCurrentLayer();
console.log(layer.stitches);
```

### Pattern Analysis

#### `analyzePattern()`
Analüüsib mustrit ja genereerib soovitused.

```javascript
analyzePattern();
```

#### `applySymmetry(x, y)`
Rakendab sümmeetriat punktile.

**Tagastab:** Array of {x, y} points

```javascript
const points = applySymmetry(300, 200);
```

### Export/Import

#### `savePattern()`
Eksportib mustri PNG pildina.

```javascript
savePattern();
```

#### `saveJSON()`
Salvestab mustri JSON formaadis.

```javascript
saveJSON();
```

#### `loadJSON()`
Laadib mustri JSON failist.

```javascript
loadJSON();
```

## Andmestruktuurid

### Layer Object
```javascript
{
  id: 1,
  name: 'Round 1',
  stitches: [],
  visible: true
}
```

### Stitch Object
```javascript
{
  x: 300,
  y: 300,
  stitch: 'dc',
  color: '#000000',
  size: 22,
  rotation: 0
}
```

### Suggestion Object
```javascript
{
  x: 350,
  y: 300,
  stitch: 'dc',
  color: '#000000',
  size: 22,
  rotation: 0,
  radius: 100,
  angle: 1.57
}
```

## Globaalsed muutujad

```javascript
currentStitch        // Praegune pisteto tüüp
currentColor         // Praegune värv
currentShape         // Praegune kuju
currentStitchSize    // Praegune suurus
currentRotation      // Praegune pööramine
currentToolMode      // Praegune tööriist
symmetryMode         // Sümmeetria režiim
layers               // Array of layer objects
currentLayerIndex    // Praegune layer index
suggestions          // Array of suggestion objects
autoContinueEnabled  // Automaatne jätkamine sisse/välja
```

## Events

### Canvas Events

```javascript
canvas.addEventListener('mousedown', handler);
canvas.addEventListener('mousemove', handler);
canvas.addEventListener('mouseup', handler);
canvas.addEventListener('click', handler);
```

### Keyboard Events

```javascript
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 's') {
    saveJSON();
  }
});
```

## Utilities

### `getCenter()`
Tagastab canvas'e keskpunkti.

**Tagastab:** {x, y}

```javascript
const center = getCenter();
```

### `getDistanceFromCenter(x, y)`
Arvutab kauguse keskpunktist.

**Tagastab:** number

```javascript
const distance = getDistanceFromCenter(300, 300);
```

### `getAngleFromCenter(x, y)`
Arvutab nurga keskpunktist.

**Tagastab:** number (radiaanides)

```javascript
const angle = getAngleFromCenter(300, 300);
```
