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
2. **Alle** Dateien aus diesem Ordner hochladen (wichtig: auch `apple-touch-icon.png`, `favicon.ico`, `icon-152.png`, `icon-167.png` – nicht nur `icon-192`/`icon-512`, sonst zeigt iOS beim "Zum Home-Bildschirm" kein eigenes Icon an)
3. In den Repo-Settings → Pages → Branch `main` / Root aktivieren
4. Auf dem iPhone die Pages-URL in Safari öffnen → Teilen → "Zum Home-Bildschirm"

**Option B – Netlify Drop (schnellster Weg zum Testen):**
1. Den kompletten Ordner auf https://app.netlify.com/drop ziehen
2. Die generierte URL auf dem iPhone öffnen und zum Home-Bildschirm hinzufügen

Die App aktualisiert sich beim erneuten Öffnen automatisch (Service Worker, netzwerk-first).

## Icons
Das App-Icon ist jetzt der Hamster-Kopf aus der App (nicht mehr der Münz-Platzhalter), in allen relevanten Größen: `apple-touch-icon.png` (180×180, für iPhone/iPad-Homescreen), `icon-152.png`/`icon-167.png` (ältere iPad-Größen), `icon-192.png`/`icon-512.png` (Android/Manifest), `favicon.ico` (Browser-Tab). Alle sind opake PNGs ohne Transparenz – iOS rundet die Ecken selbst ab.

**Warum das Icon vorher nicht angezeigt wurde:** Safari nutzt für "Zum Home-Bildschirm" nicht die Icons aus der `manifest.json`, sondern ausschließlich `<link rel="apple-touch-icon">`-Tags im HTML. Vorher gab es nur einen einzigen `apple-touch-icon`-Link auf `icon-192.png` – fehlte diese Datei beim Hochladen oder war der Pfad falsch, griff iOS ersatzweise auf einen Screenshot der Seite zurück (sieht dann "leer"/falsch aus). Jetzt gibt es mehrere `apple-touch-icon`-Links in passenden Größen plus ein separates `favicon.ico` als Fallback für den Browser-Tab – dadurch ist das Icon deutlich robuster gegen einzelne fehlende Dateien.

## iPhone-15-Optimierungen
- Safe-Area-Insets berücksichtigt (Dynamic Island oben, Home-Indicator unten) – die Kopfzeile rutscht nicht mehr unter die Statusleiste, wenn die App als eigenständige Home-Bildschirm-App (ohne Safari-Leiste) läuft.
- Eingabefelder auf 16px Schriftgröße gesetzt – verhindert, dass iOS beim Tippen automatisch reinzoomt.
- `theme-color` (Statusleisten-/App-Umschalter-Farbe) passt sich jetzt live an Farbthema und Hell/Dunkel-Modus an.
- Kein versehentliches Pinch-Zoom/Doppeltipp-Zoom mehr (fühlt sich mehr wie eine native App an).

## Datenmodell
Alles wird unter dem localStorage-Key `sparhamster_v1` gespeichert. Backup/Restore über Einstellungen → Daten.
