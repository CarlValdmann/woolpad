# Sümboleid kohandamine (Symbol Customization Guide)

## Kuidas muuta stitch sümboleid

Sümboleid saab muuta kahes kohas:

### 1. Käsitsi joonistatud sümbolid (Canvas API)

Need on `src/js/canvas.js` failis `drawStitch()` funktsioonis.

**Asukoht:** `src/js/canvas.js`, funktsioon `drawStitch()`, umbes rida 162-443

**Näited muutmisest:**

#### Näide 1: Muuda `sc` (single crochet) sümbolit

Praegune kood:
```javascript
case 'sc':
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.moveTo(-6 * scale, 0);
    ctx.lineTo(6 * scale, 0);
    ctx.moveTo(0, -6 * scale);
    ctx.lineTo(0, 6 * scale);
    ctx.stroke();
    break;
```

Muuda risti (X) asemel ringiks:
```javascript
case 'sc':
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, 5 * scale, 0, Math.PI * 2);
    ctx.stroke();
    break;
```

#### Näide 2: Muuda `dc` (double crochet) sümbolit

Praegune kood joonistab T-kujulise sümboli ühe horisontaalribaga. 
Kui soovid muuta joone paksust või asukohta:

```javascript
case 'dc':
    ctx.lineWidth = 3 * scale; // Muuda joone paksust (oli 2.5)
    ctx.beginPath();
    ctx.moveTo(0, -8 * scale);
    ctx.lineTo(0, 8 * scale);
    ctx.moveTo(-7 * scale, -4 * scale); // Muuda horisontaalse joone asukohta
    ctx.lineTo(7 * scale, -4 * scale);
    ctx.stroke();
    break;
```

### 2. Text sümbolid (fallback)

Need on `src/js/config.js` failis `stitchSymbols` objekti.

**Asukoht:** `src/js/config.js`, umbes rida 37-67

**NB:** Need sümbolid kasutatakse ainult siis, kui stitch'i case'i ei leitud `drawStitch()` funktsioonis (default case).

Kui soovid muuta text sümbolit:

```javascript
export const stitchSymbols = {
    // ...
    'sc': 'X',  // Muuda '+' asemel 'X'
    // ...
};
```

## Praegused sümbolid

### Käsitsi joonistatud (Canvas API):
- `chain` - ellips (horisontaalne ovaal)
- `slip` - täidetud ring
- `sc` - rist (+)
- `hdc` - T-kujuline
- `dc` - T-kujuline ühe horisontaalribaga
- `tr` - T-kujuline kahe horisontaalribaga
- `dtr` - T-kujuline kolme horisontaalribaga
- `sc2tog`, `sc3tog` - vähendused (inverted V + jooned)
- `dc2tog`, `dc3tog` - vähendused
- `cluster-3dc`, `cluster-3hdc` - kobarid
- `popcorn-5dc` - popcorn
- `shell-5dc` - shell/fan kujuline
- `picot-ch3` - picot
- `fpdc`, `bpdc` - post stitches
- `blo`, `flo` - loop modifiers

### Canvas API võimalused

Kasuta järgmisi Canvas API funktsioone:

- **Jooned:** `ctx.moveTo()`, `ctx.lineTo()`, `ctx.stroke()`
- **Ringid:** `ctx.arc()`, `ctx.ellipse()`
- **Täidetud kujundid:** `ctx.fill()` (peale `beginPath()`)
- **Kõverad:** `ctx.quadraticCurveTo()`, `ctx.bezierCurveTo()`
- **Joone paksus:** `ctx.lineWidth = 2.5 * scale`
- **Värv:** `ctx.strokeStyle = color` või `ctx.fillStyle = color`

**Scale muutuja:** Kõik mõõdud korrutatakse `scale`-iga, et sümbolid sobiksid erinevate suurustega.

## Näide täielikust muudatusest

Kui soovid `sc` sümbolit muuta ringiks, mille sees on punkt:

1. Ava `src/js/canvas.js`
2. Leia `case 'sc':` (umbes rida 204)
3. Asenda kood:

```javascript
case 'sc':
    // Joonista välisring
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, 5 * scale, 0, Math.PI * 2);
    ctx.stroke();
    
    // Joonista keskpunkt
    ctx.beginPath();
    ctx.arc(0, 0, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
    break;
```

4. Salvesta fail
5. Värskenda brauserit (F5 või Cmd+R)

## Tipps

- Testi muudatusi väikeste muudatustega
- Kasuta `scale` muutujat, et sümbolid oleksid suurusega proportsionaalsed
- Vaata, kuidas teised sümbolid on joonistatud, et saada inspiratsiooni
- Pane tähele, et värv (`color`) ja `scale` on juba seadistatud enne switch-case'i

