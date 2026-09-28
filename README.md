# requestVacation

Web app mobile-first per compilare una richiesta di ferie o altra assenza e generare un PDF A4 pronto da allegare a una mail.

## Funzionalità

- dati dipendente e periodo di assenza;
- Ferie, Permesso, Legge 104, Permesso non retribuito, Malattia, ROL / ex festività, Altro;
- note aggiuntive e riepilogo;
- generazione PDF direttamente nel browser;
- preparazione della mail tramite il client del dispositivo;
- salvataggio locale dei dati;
- PWA installabile su iPhone;
- Service Worker per l'utilizzo offline dopo il primo caricamento.

## Versione web

Quando GitHub Pages è abilitato tramite **Settings → Pages → Source: GitHub Actions**, l'app sarà disponibile all'indirizzo:

`https://grievesk.github.io/requestVacation/`

Questo è l'indirizzo da aprire in Safari e da usare per **Aggiungi alla schermata Home**. La visualizzazione del file `index.html` dentro GitHub è solo un'anteprima del codice e non è il modo corretto per eseguire l'app.

## Utilizzo

Non richiede un backend.

Per il test locale:

```bash
python3 -m http.server 8080
```

Poi aprire `http://localhost:8080`.

Per installarla su iPhone, pubblicare la cartella tramite HTTPS e in Safari usare **Condividi → Aggiungi alla schermata Home**.

## PDF

Il PDF viene generato lato client con [jsPDF](https://github.com/parallax/jsPDF).

## Dati e privacy

I dati del modulo vengono mantenuti nel `localStorage` del browser. Non è presente un database o un backend applicativo. **Reset** cancella i dati locali del modulo.

## Struttura

- `index.html` — interfaccia
- `styles.css` — stile responsive
- `app.js` — logica e PDF
- `manifest.webmanifest` — PWA
- `sw.js` — Service Worker
- `icons/icon.svg` — icona

## Licenza

**GNU General Public License v3.0 or later (GPL-3.0-or-later)**. La licenza già presente nel repository è stata mantenuta.

## Stato

Prima versione funzionale / prototipo.

Prossime evoluzioni possibili: intestazione aziendale e logo, firma, condivisione nativa del PDF su iOS, gestione ore/giorni e impostazioni persistenti dell'azienda.
