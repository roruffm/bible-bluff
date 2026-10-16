# Professor Bluff: neue Phasenansagen (Entwurf)

Status: Einbindung vorbereitet, noch nicht veröffentlicht. Die elf unten genannten
MP3-Dateien fehlen. ElevenLabs hat die angefragte Erzeugung mit „Free Tier access
has been disabled“ abgewiesen. Die bestehende Live-Version bleibt deshalb bestehen.

Stimme: Snorre – Nervous & Eccentric, über die ElevenLabs-Stimmensuche bestätigt.
Voice-ID: `JSV4pJFuHRMCWZTxkpoQ`, Modell: `eleven_multilingual_v2`.
Es wurden vier Varianten angefragt; alle vier sind mit der Kontosperre fehlgeschlagen.
Erzeugungsversuche nicht automatisch wiederholen. Erst nach Freigabe der
Spracherzeugung fortsetzen.

## Aufnahmen

Zielverzeichnis: `src/client/public/professor-bluff/`.

| Dateiname | Gesprochener Text | Zuordnung |
| --- | --- | --- |
| `interjection-regroup-ready.mp3` | Alle sind zurück! Bleibt bei eurer Gruppe. Gleich kommt die Auflösung! | Zwischensequenz vor der Wertung |
| `interjection-call-minis.mp3` | Glühwürmchen, jetzt seid ihr dran! Die anderen Teams feuern euch an! | Kapitelstart und Vorlesen der Glühwürmchen-Aufgabe |
| `interjection-call-mittis.mp3` | Leuchtsterne, jetzt seid ihr dran! Zeigt uns euren Spürsinn! | Vorlesen der Leuchtsterne-Aufgabe |
| `interjection-call-maxis.mp3` | Fackelträger, jetzt seid ihr dran! Knackt meinen nächsten Bluff! | Vorlesen der Fackelträger-Aufgabe |
| `interjection-call-all.mp3` | Jetzt sind alle Teams gemeinsam dran! Zusammen knackt ihr meinen Superbluff! | Finalankündigung und Finalfrage |
| `interjection-signal-start.mp3` | Jetzt geht es los! Geht ruhig zu eurem Feld. | Laufende Antwortwahl |
| `interjection-signal-pause.mp3` | Kurze Pause! Bleibt bitte, wo ihr seid. | Pause |
| `interjection-signal-resume.mp3` | Weiter geht es! Ihr könnt weiter euer Feld wählen. | Fortgesetzte Antwortwahl |
| `interjection-signal-stop.mp3` | Stopp! Bleibt auf eurem Feld. Unsere Helfer schauen nach. | Gestoppte Antwortwahl, Helfer prüfen |
| `interjection-signal-countdown.mp3` | Fünf! Vier! Drei! Zwei! Eins! | Per Knopfdruck für die letzten fünf Sekunden vormerken |
| `interjection-closing-jesus.mp3` | Bei Jesus sind wir willkommen. Jesus lädt die Kinder zu sich ein. Jeder von euch gehört dazu! | Abschluss |

Der vorhandene Rückruf `interjection-return.mp3` bleibt unverändert verfügbar.

## Countdown vorbereiten

Die Zahlen einzeln erzeugen beziehungsweise aus der Sammelaufnahme sauber schneiden.
Jede Zahl beginnt am Anfang eines genau eine Sekunde langen Abschnitts: fünf bei
0 s, vier bei 1 s, drei bei 2 s, zwei bei 3 s und eins bei 4 s. Die kombinierte Datei
hat genau fünf Sekunden Audionutzdaten. Vor und nach jeder Zahl kurze Fades gegen
Schnittknackser; eventuelle Stille auf genau eine Sekunde auffüllen. Aussprache und
Lautstärke mit den vorhandenen Snorre-Clips vergleichen.

Die Technik aktiviert den gesprochenen Countdown manuell während der Antwortwahl.
Der Beamer plant die Aufnahme anhand der laufenden Deadline ein. Bei verspätetem
Laden werden bereits vergangene Zahlen übersprungen; nach Ablauf startet nichts.
Pause, ein anderes Audio, Phasenwechsel und Neuladen lösen keine nachträgliche
Sprachausgabe aus. Nach einer Pause die Vormerkung bei Bedarf erneut aktivieren.

## Fertigstellen

1. ElevenLabs-Freigabe prüfen und die fehlenden Aufnahmen erstellen.
2. Elf MP3-Dateien unter den genannten Namen ergänzen, Schnitte und Countdown prüfen.
3. `npm run check` und die vorhandenen Browserprüfungen ausführen. Der bestehende
   Aufnahmentest verlangt zu jeder Ansage eine echte MP3-Datei.
4. Zusammenführen und Veröffentlichung über die bestehende Cloudflare-Anbindung prüfen.
