# 🚀 Kiirkäivitus - VS Code

## 1️⃣ Ava projekt VS Code'is

```bash
cd heegelmotiivid-pro
code .
```

Või VS Code'is: `File → Open Folder → vali heegelmotiivid-pro`

## 2️⃣ Installi Live Server

1. Vajuta `Ctrl+Shift+X` (Extensions)
2. Otsi "**Live Server**"
3. Kliki "Install" (autor: Ritwick Dey)

## 3️⃣ Käivita rakendus

**Meetod 1: Live Server (soovitatud)**
1. Ava `index.html`
2. Parem-klõps faili peal
3. Vali "**Open with Live Server**"
4. Brauser avaneb automaatselt aadressil `http://127.0.0.1:5500`

**Meetod 2: Python HTTP Server**
```bash
python -m http.server 8000
```
Ava brauser: `http://localhost:8000`

## 4️⃣ Alusta arendamist

### Ava Developer Tools
- Vajuta `F12` brauseris
- Vaata Console erroreid
- Testi funktsioone

### Tee muudatusi
1. Muuda `index.html` faili
2. Salvesta (`Ctrl+S`)
3. Live Server värskendab automaatselt
4. Vaata tulemust brauseris

## 📁 Failide ülevaade

```
heegelmotiivid-pro/
├── index.html           ← PEAMINE FAIL (alusta siit)
├── README.md           ← Projekti ülevaade
├── DEVELOPMENT.md      ← Arenduse juhend
├── TODO.md            ← Tulevased täiendused
├── QUICKSTART.md      ← See fail
└── src/               ← Tulevased moodulid
```

## 🎯 Mida teha edasi?

### Õpi projekti tundma
1. **Loe README.md** - Funktsioonide ülevaade
2. **Loe DEVELOPMENT.md** - Arenduse juhend
3. **Vaata TODO.md** - Mida lisada

### Testi rakendust
- ✏️ Joonista pisteid
- 🧹 Kustuta pisteid
- 📏 Joonista jooni
- 🔄 Proovi sümmeetriat
- 💾 Salvesta PNG/JSON

### Muuda koodi
1. **CSS muutmine** - Otsi `<style>` tag'i
2. **JavaScript muutmine** - Otsi `<script>` tag'i
3. **HTML muutmine** - Muuda struktuuri

## 🐛 Probleemid?

### Live Server ei tööta?
- Kontrolli, et extension on installitud
- Restart VS Code
- Proovi teist porti

### Muudatused ei ilmu?
- Vajuta `Ctrl+Shift+R` (hard refresh)
- Clear browser cache
- Kontrolli Console erroreid

### Nupud ei tööta?
- Ava Console (`F12`)
- Vaata erroreid
- Kontrolli, et DOM on laetud

## 💡 VS Code Nipid

### Kiirklahvid
- `Ctrl+P` - Quick open (failide otsimine)
- `Ctrl+Shift+F` - Find in all files
- `Ctrl+/` - Kommenteeri
- `Alt+Shift+F` - Format document
- `Ctrl+D` - Select next occurrence

### Kasulikud extension'id
- Live Server ✅ (VAJALIK)
- Prettier (Code formatter)
- Auto Rename Tag
- Bracket Pair Colorizer

### Split View
- `Ctrl+\` - Split editor
- Näita HTML ja CSS kõrvuti

## 📚 Õppematerjalid

### Projekt
- [README.md](README.md) - Peamine dokumentatsioon
- [DEVELOPMENT.md](DEVELOPMENT.md) - Arenduse juhend
- [TODO.md](TODO.md) - Tulevased features

### Web Development
- MDN Web Docs - HTML/CSS/JavaScript
- Canvas API - Joonistamine
- DOM API - Elemendid ja events

## ✅ Checklist

- [ ] VS Code installitud
- [ ] Live Server extension installitud
- [ ] Projekt avatud VS Code'is
- [ ] index.html avatud Live Server'iga
- [ ] Developer Tools avatud (F12)
- [ ] README.md läbi loetud
- [ ] Rakendus testitud

## 🎉 Valmis!

Nüüd oled valmis arendama!

**Järgmised sammud:**
1. Proovi kõiki funktsioone
2. Vaata koodi
3. Tee väike muudatus
4. Vaata tulemust
5. Loe DEVELOPMENT.md

**Küsimused?**
- Vaata DEVELOPMENT.md
- Kontrolli Console erroreid
- Loe dokumentatsiooni

Edu! 🚀
