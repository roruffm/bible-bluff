# Forscher-Szenen: Emmy-Sprache

Die drei Aufnahmen sprechen wortgleich die drei Beschriftungen aus `src/shared/kids-scenes.ts`. Die zehnsekündige Szene und ihre Bildwechsel bei 0, 3 und 6,5 Sekunden bleiben maßgeblich. Die Sprachsegmente sind ohne Tempoänderung in diese drei Zeitfenster gesetzt; geschnitten wurde ausschließlich in den Sprechpausen. Der erste Laut folgt der Einblendung um etwa 80–180 ms.

Quellen sind die vom Betreiber bereitgestellten ElevenLabs-MP3s vom 22.10.2026, Stimme „Emmy – Children's Books“, Dateinamen jeweils `ElevenLabs_2026-10-22T<Zeit>_Emmy - Children's Books_pvc_sp100_s50_sb75_v4.mp3`:

| Szene | Quellzeit | Quellabschnitte in Sekunden | Zielanfänge |
| --- | --- | --- | --- |
| Arche | 13_07_20 | 0–2,75; 3,04–5,08; 5,48–8,515875 | 0; 3; 6,5 |
| Krippe | 13_08_45 | 0–2,16; 2,44–4,10; 4,53–6,530563 | 0; 3; 6,5 |
| Löwen | 13_09_53 | 0–1,32; 1,70–3,96; 4,31–6,608938 | 0; 3; 6,5 |

Jeden Quellabschnitt mit FFmpeg `atrim`, `asetpts=PTS-STARTPTS` und `adelay` versetzen, mit `amix=inputs=3:normalize=0` mischen, mit `apad,atrim=duration=10` auf zehn Sekunden ergänzen. Ausgabe: Mono-MP3, `libmp3lame -q:a 4`, ohne Quellmetadaten. Die Dateien liegen unter `src/client/public/audio/kids-scenes/`.

`playKidsScene` nutzt dieselbe absolute Frist wie Text und Animation. Nach Laden, Neuladen oder erneutem Einschalten des Tons beginnt die Aufnahme am aktuellen Szenenversatz; Abbrechen verhindert einen verspäteten Start. Alle drei Dateien werden beim Vorbereiten in den Speicher und in die Offline-Kopie geladen. Die Bootsszene im Finale behält ihre erzeugte Geräuschkulisse.
