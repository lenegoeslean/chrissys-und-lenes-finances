# Sparhamster – Finanztracker

Persönliche Finanz-PWA, gebaut nach dem gleichen Prinzip wie lenegoeslean: einzelne HTML/JS-Datei, kein Backend, alle Daten liegen nur lokal auf dem Gerät (localStorage).

## Features (v1)
- **Heute**: Schnellerfassung von Ein-/Ausgaben, Begleiter "Sparhamster" mit Wachstumsstufen & Streak (Tage im Budgetrahmen)
- **Kalender**: Monatsübersicht mit Tages-Drilldown, grüner/roter Punkt für Netto-Tag
- **Budget**: Monatslimits pro Kategorie mit Fortschrittsbalken, Sparziel mit Zieldatum-Prognose
- **Vermögen**: Konten (Bargeld/Giro/Spar/Depot/Sonstiges), Kontostandsverlauf, Nettovermögens-Chart, Vermögensziel
- **Trends**: Einnahmen/Ausgaben der letzten 6 Monate, Kategorien-Aufschlüsselung, Sparquote
- **Mehr**: App-Name, 5 Farbthemen + Hell/Dunkel/Automatisch, eigene Kategorien, JSON-Backup Export/Import, Reset

## Deployment (wie beim Fitness-Tracker)

**Option A – GitHub Pages (empfohlen für dauerhafte Installation):**
1. Neues Repo anlegen, z. B. `github.com/lenegoeslean/finanztracker`
2. Diese Dateien hochladen (`index.html`, `app.js`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`)
3. In den Repo-Settings → Pages → Branch `main` / Root aktivieren
4. Auf dem iPhone die Pages-URL in Safari öffnen → Teilen → "Zum Home-Bildschirm"

**Option B – Netlify Drop (schnellster Weg zum Testen):**
1. Den kompletten Ordner auf https://app.netlify.com/drop ziehen
2. Die generierte URL auf dem iPhone öffnen und zum Home-Bildschirm hinzufügen

Die App aktualisiert sich beim erneuten Öffnen automatisch (Service Worker, netzwerk-first).

## Icons
Die aktuellen Icons (`icon-192.png`, `icon-512.png`) sind ein einfacher Platzhalter (Münze mit €-Symbol). Können jederzeit ausgetauscht werden – gleiche Dateinamen beibehalten oder `manifest.json` + `index.html` anpassen.

## Datenmodell
Alles wird unter dem localStorage-Key `sparhamster_v1` gespeichert. Backup/Restore über Einstellungen → Daten.
