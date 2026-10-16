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
  }
] as const;

export type ProfessorInterjectionId = typeof PROFESSOR_INTERJECTIONS[number]['id'];
export function professorInterjection(id: unknown) {
  return PROFESSOR_INTERJECTIONS.find(clip => clip.id === id);
}
