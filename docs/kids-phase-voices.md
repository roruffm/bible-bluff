# Professor Bluff: Phasenansagen

Die elf unten genannten MP3-Dateien ergänzen die bisherigen zwölf freien Ansagen.
Alle Clips sind in der Smartphone-Steuerung bei der passenden Spielphase und
zusätzlich in der aufklappbaren Gesamtauswahl erreichbar. Sprache startet manuell
und erklingt am Beamer.

Stimme: Snorre – Nervous & Eccentric, über die ElevenLabs-Stimmensuche bestätigt.
Voice-ID: `JSV4pJFuHRMCWZTxkpoQ`, Modell: `eleven_multilingual_v2`.
Die Aufnahmen wurden am 16.10.2026 mit ElevenLabs erstellt und anhand der
transkribierten Wortzeiten und der Pausen in der Aufnahme geschnitten.
Erzeugungs-Flow: `pzQFLU40bOmd4qQ8g2Qa`, Sprachknoten: `eFQyjvneV16Xs8aFrFnU`.

Die drei Gruppenaufrufe wurden anschließend durch die vom Nutzer bereitgestellten
Snorre-Aufnahmen vom 16.10.2026 (13:07:34, 13:08:20 und 13:08:45) ersetzt.
Die Dateien wurden unverändert übernommen und anhand ihres gesprochenen Gruppennamens
Glühwürmchen, Leuchtsterne beziehungsweise Fackelträger zugeordnet.

## Aufnahmen

Zielverzeichnis: `src/client/public/professor-bluff/`.

| Dateiname | Gesprochener Text | Zuordnung |
| --- | --- | --- |
| `interjection-regroup-ready.mp3` | Alle sind zurück! Bleibt bei eurer Gruppe. Gleich kommt die Auflösung! | Zwischensequenz vor der Wertung |
| `interjection-call-minis.mp3` | Glühwürmchen, jetzt seid ihr dran! Die anderen Teams feuern euch an! | Kapitelstart und Vorlesen der Glühwürmchen-Aufgabe |
| `interjection-call-mittis.mp3` | Leuchtsterne, jetzt seid ihr dran! Die anderen Teams feuern euch an! | Vorlesen der Leuchtsterne-Aufgabe |
| `interjection-call-maxis.mp3` | Fackelträger, jetzt seid ihr dran! Die anderen Teams feuern euch an! | Vorlesen der Fackelträger-Aufgabe |
| `interjection-call-all.mp3` | Jetzt sind alle Teams gemeinsam dran! Zusammen knackt ihr meinen Superbluff! | Finalankündigung und Finalfrage |
| `interjection-signal-start.mp3` | Jetzt geht es los! Geht ruhig zu eurem Feld. | Laufende Antwortwahl |
| `interjection-signal-pause.mp3` | Kurze Pause! Bleibt bitte, wo ihr seid. | Pause |
| `interjection-signal-resume.mp3` | Weiter geht es! Ihr könnt weiter euer Feld wählen. | Fortgesetzte Antwortwahl |
| `interjection-signal-stop.mp3` | Stopp! Bleibt auf eurem Feld. Unsere Helfer schauen nach. | Gestoppte Antwortwahl, Helfer prüfen |
| `interjection-signal-countdown.mp3` | Fünf! Vier! Drei! Zwei! Eins! | Per Knopfdruck für die letzten fünf Sekunden vormerken |
| `interjection-closing-jesus.mp3` | Bei Jesus sind wir willkommen. Jesus lädt die Kinder zu sich ein. Jeder von euch gehört dazu! | Abschluss |

Der vorhandene Rückruf `interjection-return.mp3` bleibt unverändert verfügbar.

## Countdown

Die Zahlen wurden einzeln aus der Sammelaufnahme geschnitten.
Jede Zahl beginnt am Anfang eines genau eine Sekunde langen Abschnitts: fünf bei
0 s, vier bei 1 s, drei bei 2 s, zwei bei 3 s und eins bei 4 s. Die kombinierte Datei
hat genau fünf Sekunden Audionutzdaten (220500 Samples bei 44,1 kHz, nach MP3-Dekodierung
geprüft). Kurze Fades vermeiden Schnittknackser; jede Zahl wurde mit Stille auf eine
Sekunde ergänzt. Die weiteren erzeugten Phasenansagen sind auf -18 LUFS normalisiert;
die drei vom Nutzer gelieferten Gruppenaufrufe behalten ihre Original-Lautstärke.

Die Technik aktiviert den gesprochenen Countdown manuell während der Antwortwahl.
Der Beamer plant die Aufnahme anhand der laufenden Deadline ein. Bei verspätetem
Laden werden bereits vergangene Zahlen übersprungen; nach Ablauf startet nichts.
Pause, ein anderes Audio, Phasenwechsel und Neuladen lösen keine nachträgliche
Sprachausgabe aus. Nach einer Pause die Vormerkung bei Bedarf erneut aktivieren.

## Prüfung

`npm run check` prüft Typen, Spielzustand und Produktionsbuild. Der Aufnahmentest
verlangt zu jeder Ansage eine echte MP3-Datei. Die Countdown-Tests prüfen geplanten
Start, verspäteten Download, abgelaufene Zeit und Abbruch vor beziehungsweise nach
dem Laden. Die Browserprüfungen prüfen weiterhin die geräteübergreifende Wiedergabe.
