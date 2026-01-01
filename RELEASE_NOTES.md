# Release Notes - Uued funktsioonid

## 🎯 Ülevaade

See uuendus lisab rakendusse mitmeid olulisi funktsioone, mis muudavad töö efektiivsemaks ja mugavamaks. Lisatud on kiirklahvid, kopeerimise/kleebimise võimalused, joondustööriistad, PDF eksport ja märkmete süsteem.

---

## ⌨️ Kiirklahvid (Keyboard Shortcuts)

### Tööriistade kiirklahvid
- **V** - Vali "Liiguta" tööriist (Move tool)
- **B** - Vali "Joonista" tööriist (Draw tool)
- **E** - Vali "Kustuta" tööriist (Erase tool)
- **L** - Vali "Joon" tööriist (Line tool)
- **S** - Vali "Vali ala" tööriist (Select tool)

### Valitud elementidega töötamine
- **Delete** või **Backspace** - Kustuta valitud pisteid
- **Ctrl+C** (Windows) / **Cmd+C** (Mac) - Kopeeri valitud pisteid
- **Ctrl+V** (Windows) / **Cmd+V** (Mac) - Kleebi pisteid
- **Ctrl+D** (Windows) / **Cmd+D** (Mac) - Duplikaat valitud pisteid (kohe samasse kohta)

### Ajalugu
- **Ctrl+Z** (Windows) / **Cmd+Z** (Mac) - Tagasi (Undo)
- **Ctrl+Y** või **Ctrl+Shift+Z** (Windows) / **Cmd+Shift+Z** (Mac) - Uuesti (Redo)

### Muud
- **Ctrl+S** (Windows) / **Cmd+S** (Mac) - Salvesta projekt (JSON)

> **Märkus:** Kiirklahvid töötavad ainult siis, kui tekstiväli ei ole fookuses (input/textarea).

---

## 📋 Kopeerimine, Kleebimine ja Duplikaat

### Uued funktsioonid
- **Kopeerimine (Copy)**: Vali pisteid ja vajuta **Ctrl+C** / **Cmd+C** - pisteid salvestatakse lõikelauale
- **Kleebimine (Paste)**: Vajuta **Ctrl+V** / **Cmd+V** - pisteid kleebitakse praegusesse layer'isse 30px paremale ja alla
- **Duplikaat (Duplicate)**: Vali pisteid ja vajuta **Ctrl+D** / **Cmd+D** - pisteid duplikaaditakse kohe samasse kohta (30px paremale)

### Kuidas kasutada
1. Vali pisteid (kasuta "Vali ala" või "Liiguta" tööriista, Shift+klikk lisab valikusse)
2. Vajuta **Ctrl+C** kopeerimiseks
3. Vajuta **Ctrl+V** kleebimiseks (uued pisteid on automaatselt valitud)
4. Vajuta **Ctrl+D** duplikaadiks

---

## ↔️ Joondustööriistad (Alignment Tools)

### Uued tööriistad
Joondustööriistad võimaldavad valitud pisteid korralikult joondada ja jaotada ühtlaselt. Need on kasulikud korrapäraste mustrite loomisel.

### Joondamise valikud
- **←** - Joonda vasakule (kõik valitud pisteid samale X-koordinaadile)
- **→** - Joonda paremale
- **⬌** - Joonda horisontaalselt keskele
- **↑** - Joonda üles (kõik valitud pisteid samale Y-koordinaadile)
- **↓** - Joonda alla
- **⬍** - Joonda vertikaalselt keskele

### Jaotamine
- **↔ Jaota H** - Jaotab pisteid ühtlaselt horisontaalselt (vajab vähemalt 3 pisteid)
- **↕ Jaota V** - Jaotab pisteid ühtlaselt vertikaalselt (vajab vähemalt 3 pisteid)

### Kuidas kasutada
1. Vali vähemalt 2 pisteid (joondamiseks) või 3 pisteid (jaotamiseks)
   - Kasuta "Vali ala" tööriista (⬚) või "Liiguta" tööriista (✋)
   - Kliki pisteidele või lohista valikuala üle pisteide
   - Shift+klikk lisab pisteid valikusse
2. Leia paremal sidebar'is "Joondustööriistad" sektsioon
3. Kliki soovitud joondamise või jaotamise nuppu

### Näide
1. Joonista 5 pisteid erinevatel koordinaatidel
2. Vali need kõik
3. Kliki "→" nuppu - kõik pisteid joondatakse paremale
4. Kliki "⬌" nuppu - kõik pisteid joondatakse horisontaalselt keskele
5. Kliki "↔ Jaota H" - pisteid jaotatakse ühtlaselt horisontaalselt

---

## 📄 PDF Export

### Uus funktsioon
Rakendus toetab nüüd mustrite eksportimist PDF formaati. See on kasulik mustrite jagamiseks, printimiseks või arhiveerimiseks.

### Funktsioonid
- Kõrge kvaliteediga PDF eksport
- Automaatne skaleerimine A4 lehe suurusele
- Metadata (pealkiri, kuupäev, autor)
- Footer kuupäevaga

### Kuidas kasutada
1. Kliki top menu'sse nuppu **"📄 Export PDF"**
2. PDF fail allalaaditakse automaatselt
3. Faili nimi: `heegelmotiiv_YYYY-MM-DD.pdf`

### Märkused
- PDF eksport kasutab jsPDF teeki (laetakse CDN'ist)
- Kui PDF export ei tööta, kontrolli internetiühendust
- Mustrid skaleeritakse automaatselt A4 lehele sobivaks

---

## 📝 Märkmed (Notes/Annotations)

### Uus funktsioon
Rakendus toetab nüüd märkmete lisamist mustrile. Märkmed on kasulikud juhiste, märkuste või kommentaaride lisamiseks.

### Funktsioonid
- Märkmete lisamine canvas'ile
- Märkmete redigeerimine
- Märkmete kustutamine
- Visuaalne märkmete ikoon (oranž ringikujuline ikoon 📝)

### Kuidas kasutada

#### Märkme lisamine
1. Vali vasakust toolbar'ist **📝** (Märkmed) tööriist
2. Kliki canvas'il soovitud kohale
3. Sisesta märkuse tekst modaalaknas
4. Kliki "Salvesta"

#### Märkme redigeerimine
1. Kasuta **📝** (Märkmed) tööriista
2. Kliki olemasolevale märkusele
3. Muuda teksti modaalaknas
4. Kliki "Salvesta" või "Kustuta"

### Märkused
- Märkmed on nähtavad kui oranž ringikujuline ikoon canvas'il
- Märkmed salvestatakse koos projektiga (JSON export/import)
- Märkmete ikoonid on alati nähtavad (ei peitu grid'i või pisteide taga)

---

## 🔧 Tehnilised täiendused

### State Management
- Lisatud `clipboard` state'i (kopeeritud pisteid)
- Lisatud `notes` array state'i (märkmed)
- Lisatud `nextNoteId` järjestamiseks

### UI Täiendused
- Lisatud "Joondustööriistad" sektsioon paremasse sidebar'isse
- Lisatud 📝 märkmete tööriist vasakusse toolbar'isse
- Lisatud PDF export nupp top menu'sse
- Lisatud märkmete modal'id (add/edit)

### Dokumentatsioon
- Loodud `KEYBOARD_SHORTCUTS.md` - kiirklahvide seletused
- Loodud `ALIGNMENT_TOOLS.md` - joondustööriistade kasutusjuhend
- Loodud `RELEASE_NOTES.md` - see fail

---

## 🐛 Parandused

- Parandatud PDF export (lisatud px→mm teisendus, parandatud jsPDF laadimine)
- Parandatud kiirklahvide töötamine tekstiväljades (ignoreeritakse õigesti)

---

## 📚 Lisainfo

Täpsemad seletused leiad:
- `KEYBOARD_SHORTCUTS.md` - kõik kiirklahvid
- `ALIGNMENT_TOOLS.md` - joondustööriistade üksikasjalik juhend

---

## 🙏 Tagasiside

Kui leiad vigu või soovid uusi funktsioone, palun anna teada!

