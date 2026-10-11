// Anleitung auf der Startseite: zugeklappt, damit die Seite kurz bleibt. Aufgeklappt stehen oben die
// Grundregeln und Punkte, darunter Themen zum Aufklappen – von der Leitung über Joseph bis zum Gespräch danach.

import type { ComponentChildren } from 'preact';
import { BOT_NAME } from '../../shared/rules';
import { navigate } from '../lib/router';
import { Points, RuleSteps } from './ui';

function Topic({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <details class="guide-topic">
      <summary>{title}</summary>
      <ul class="guide-topic-body">{children}</ul>
    </details>
  );
}

export function Guide() {
  return (
    <details class="fold guide">
      <summary>
        <span class="fold-title">So geht’s</span>
        <span class="fold-hint">Anleitung: Ablauf, Punkte, {BOT_NAME}, Herzensrunde, Gespräch danach</span>
      </summary>
      <div class="fold-body">
        <RuleSteps />
        <Points />
        <p class="muted small">
          Bibelwissen hilft, ist aber kein Muss: Gute Einfälle und Menschenkenntnis zählen genauso.
        </p>

        <div class="guide-topics">
          <Topic title="Mit Freunden spielen und leiten">
            <li>
              <b>Raum eröffnen:</b> Du wählst Runden, Rundenart (Fragen, Lückentext oder gemischt), Kategorien,
              Schwierigkeit und Zeiten. Du spielst mit oder leitest nur, etwa am Beamer.
            </li>
            <li>
              <b>Beitreten:</b> Die anderen scannen den QR-Code oder geben Raumcode und Spitznamen ein – ohne App und
              ohne Konto.
            </li>
            <li>
              <b>Leinwand:</b> Über „Leinwand-Ansicht öffnen“ zeigt ein Fernseher oder Beamer alles groß für alle.
            </li>
            <li>
              <b>Leitung:</b> Im Menü „Leitung“ kannst du pausieren, eine Frage tauschen, den Raum sperren oder
              öffentlich zeigen und die Leitung übergeben.
            </li>
            <li>
              <b>Handy gewechselt?</b> Gib im selben Raum denselben Spitznamen ein, dann spielst du am alten Platz
              weiter. Neu laden oder kurz offline sein schadet nicht.
            </li>
          </Topic>

          <Topic title={`Allein gegen ${BOT_NAME}`}>
            <li>
              {BOT_NAME} ist ein Bot und hat immer Zeit. Mit „Gegen {BOT_NAME} spielen“ bekommst du einen eigenen Raum, in
              dem er schon sitzt.
            </li>
            <li>
              Er schreibt Bluffs, rät mit und verteilt Herzen. Die Wahrheit findet er in knapp der Hälfte der Runden – du
              kannst ihn also schlagen.
            </li>
            <li>Du startest, wann du willst, und kannst jederzeit Freunde dazuholen.</li>
            <li>
              Lieber gleich mit anderen? Zeigt jemand seinen Raum öffentlich, steht er oben unter „Offene Räume“. Ein
              Tipp, und du bist dabei.
            </li>
          </Topic>

          <Topic title="Extras in jeder Runde">
            <li>
              <b>Keine Idee?</b> Einmal pro Runde gibt es einen Vorschlag für einen Bluff.
            </li>
            <li>
              <b>Zu nah an der Wahrheit:</b> Stimmt dein Bluff aus Versehen, lehnt das Spiel ihn ab. Dann denkst du dir
              etwas anderes aus.
            </li>
            <li>
              <b>Lieblingsbluff:</b> Nach der Auflösung verteilst du ein Herz. Der Bluff mit den meisten Herzen bringt +1
              Punkt.
            </li>
            <li>
              <b>Liebe deinen Nächsten:</b> Einmal pro Runde kannst du einen eigenen Punkt an jemanden verschenken.
            </li>
            <li>
              <b>Ruhige Minute:</b> Brauchst du eine Pause zum Beten, setzt du eine Runde aus und siehst einen Psalmvers
              mit einem kurzen Gebetsimpuls.
            </li>
          </Topic>

          <Topic title="Herzensrunde">
            <li>
              Zum Schluss eine Runde ohne Punkte und ohne Bluffen: Alle beantworten ehrlich eine Frage, etwa „Was hat
              dich heute an Jesus überrascht?“
            </li>
            <li>
              Die Antworten erscheinen gemischt und ohne Namen. „Diesmal nicht“ ist immer in Ordnung, und mit dem
              Endstand ist alles gelöscht.
            </li>
            <li>
              Sie ist zunächst eingeschaltet. Die Leitung kann sie beim Eröffnen oder im Warteraum ausschalten. Allein
              gegen {BOT_NAME} gibt es keine Herzensrunde.
            </li>
          </Topic>

          <Topic title="Nachbesprechung: vom Spiel ins Gespräch">
            <li>
              <b>Spickzettel:</b> Nach jeder Auflösung sieht nur die Leitung Hintergrundwissen, eine Gesprächsfrage und
              einen Querverweis.
            </li>
            <li>
              <b>Weiter ins Gespräch:</b> Nach dem Endstand wählt die Leitung eine Frage der Partie, vorgeschlagen ist
              die, bei der die meisten danebenlagen. Alle Handys und die Leinwand gehen mit.
            </li>
            <li>
              <b>Vier Schritte:</b> Lesen, Entdecken, Nachfragen, Mitnehmen. So wird aus dem Spieleabend ein
              Hauskreisabend ohne Vorbereitung.
            </li>
            <li>Das Gespräch ist freiwillig: „Zurück zum Endstand“ beendet es jederzeit.</li>
          </Topic>

          <Topic title="Nach der Partie">
            <li>
              <b>Endstand:</b> Siegertreppchen und Auszeichnungen wie Bluff-Meister, Wahrheitsfinder oder Bester Bluff
              des Abends.
            </li>
            <li>
              <b>Entdeckungen:</b> Eine Seite mit allen Fragen, Antworten und Bibelstellen der Partie – ohne Namen, zum
              Teilen und Nachlesen.
            </li>
            <li>
              <b>Mein Vers für die Woche:</b> Ein passender Vers als Sperrbildschirm, auf Wunsch mit täglicher
              Erinnerung im Kalender.
            </li>
            <li>
              <b>Neugierig auf Jesus?</b>{' '}
              <a
                href="/jesus"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/jesus');
                }}
              >
                Eine kurze, ehrliche Seite
              </a>{' '}
              für alle, die mehr wissen wollen.
            </li>
          </Topic>
        </div>
      </div>
    </details>
  );
}
