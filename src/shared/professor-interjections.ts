/** Kurze, jederzeit manuell abspielbare Ansagen in Professor Bluffs Snorre-Stimme. */
export const PROFESSOR_INTERJECTIONS = [
  {
    "id": "cheer",
    "label": "Freunde anfeuern",
    "category": "Mitmachen",
    "text": "Ihr könnt eure Freunde fleißig anfeuern. Aber nicht die Lösung vorsagen!"
  },
  {
    "id": "support",
    "label": "Mit Bewegung und Geräuschen helfen",
    "category": "Mitmachen",
    "text": "Wer gerade nicht dran ist, kann die Spieler unterstützen, mit der passenden Bewegung oder einem passenden Geräusch. Aber nicht die Lösung vorsagen!"
  },
  {
    "id": "tricky",
    "label": "Richtig knifflig",
    "category": "Spannung",
    "text": "Das ist richtig knifflig!"
  },
  {
    "id": "listen",
    "label": "Erst gut zuhören",
    "category": "Ablauf",
    "text": "Spitzt eure Ohren! Erst gut zuhören. Gleich dürft ihr losgehen!"
  },
  {
    "id": "walk",
    "label": "Langsam zu den Feldern",
    "category": "Ablauf",
    "text": "Geht langsam zu eurem Feld. Wir haben Zeit für alle!"
  },
  {
    "id": "quiet",
    "label": "Kurz leise werden",
    "category": "Ablauf",
    "text": "Pssst! Macht eure Ohren groß und eure Stimmen ganz klein. Gleich geht es weiter!"
  },
  {
    "id": "return",
    "label": "Zurück zur Gruppe",
    "category": "Ablauf",
    "text": "Kommt alle zurück zu eurer Gruppe. Ich warte, bis jeder da ist!"
  },
  {
    "id": "together",
    "label": "Alle gehören dazu",
    "category": "Mut machen",
    "text": "Ob groß oder klein, ihr gehört alle zum Team!"
  },
  {
    "id": "try",
    "label": "Raten ist erlaubt",
    "category": "Mut machen",
    "text": "Du weißt es noch nicht? Dann darfst du raten! Hier muss niemand alles wissen."
  },
  {
    "id": "think",
    "label": "Professor muss nachdenken",
    "category": "Spannung",
    "text": "Moment mal! Da muss sogar mein Professorenkopf kurz nachdenken!"
  },
  {
    "id": "nervous",
    "label": "Professor wird nervös",
    "category": "Spannung",
    "text": "Huch! Ihr seid meinem Bluff auf der Spur. Jetzt werde ich aber nervös!"
  },
  {
    "id": "applause",
    "label": "Applaus für alle",
    "category": "Mut machen",
    "text": "Einen großen Applaus für alle! Ihr habt toll mitgemacht!"
  },
  {
    "id": "regroup-ready",
    "label": "Alle sind zurück · gleich auflösen",
    "category": "Ablauf",
    "text": "Alle sind zurück! Bleibt bei eurer Gruppe. Gleich kommt die Auflösung!"
  },
  {
    "id": "call-minis",
    "label": "Glühwürmchen aufrufen",
    "category": "Gruppenaufrufe",
    "text": "Glühwürmchen, jetzt seid ihr dran! Die anderen Teams feuern euch an!"
  },
  {
    "id": "call-mittis",
    "label": "Leuchtsterne aufrufen",
    "category": "Gruppenaufrufe",
    "text": "Leuchtsterne, jetzt seid ihr dran! Die anderen Teams feuern euch an!"
  },
  {
    "id": "call-maxis",
    "label": "Fackelträger aufrufen",
    "category": "Gruppenaufrufe",
    "text": "Fackelträger, jetzt seid ihr dran! Die anderen Teams feuern euch an!"
  },
  {
    "id": "call-all",
    "label": "Alle Teams zum Finale aufrufen",
    "category": "Gruppenaufrufe",
    "text": "Jetzt sind alle Teams gemeinsam dran! Zusammen knackt ihr meinen Superbluff!"
  },
  {
    "id": "signal-start",
    "label": "Jetzt geht es los",
    "category": "Spielsignale",
    "text": "Jetzt geht es los! Geht ruhig zu eurem Feld."
  },
  {
    "id": "signal-pause",
    "label": "Pause · bleibt stehen",
    "category": "Spielsignale",
    "text": "Kurze Pause! Bleibt bitte, wo ihr seid."
  },
  {
    "id": "signal-resume",
    "label": "Weiter geht es",
    "category": "Spielsignale",
    "text": "Weiter geht es! Ihr könnt weiter euer Feld wählen."
  },
  {
    "id": "signal-stop",
    "label": "Stopp · Helfer prüfen",
    "category": "Spielsignale",
    "text": "Stopp! Bleibt auf eurem Feld. Unsere Helfer schauen nach."
  },
  {
    "id": "signal-countdown",
    "label": "Countdown · fünf bis eins",
    "category": "Spielsignale",
    "text": "Fünf! Vier! Drei! Zwei! Eins!"
  },
  {
    "id": "closing-jesus",
    "label": "Bei Jesus sind wir willkommen",
    "category": "Mut machen",
    "text": "Bei Jesus sind wir willkommen. Jesus lädt die Kinder zu sich ein. Jeder von euch gehört dazu!"
  }
] as const;

export type ProfessorInterjectionId = typeof PROFESSOR_INTERJECTIONS[number]['id'];
export function professorInterjection(id: unknown) {
  return PROFESSOR_INTERJECTIONS.find(clip => clip.id === id);
}
