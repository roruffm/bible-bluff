// Anleitung über „So geht’s“: Grundregeln und Punkte, darunter Themen zum Aufklappen.

import type { ComponentChildren } from 'preact';
import { BOT_NAME } from '../../shared/rules';
import { t, tj } from '../lib/i18n';
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

/** Ein Punkt mit fettem Stichwort davor */
function Item({ label, children }: { label: string; children: ComponentChildren }) {
  return (
    <li>
      <b>{label}</b> {children}
    </li>
  );
}

export function Guide() {
  const bot = BOT_NAME;
  return (
    <section class="fold guide" aria-labelledby="guide-title">
      <h2 class="home-panel-heading" id="guide-title">{t('So geht’s')}</h2>
      <div class="fold-body">
        <RuleSteps />
        <Points />
        <p class="muted small">{t('Bibelwissen hilft, ist aber kein Muss: Gute Einfälle und Menschenkenntnis zählen genauso.')}</p>

        <div class="guide-topics">
          <Topic title={t('Mit Freunden spielen und leiten')}>
            <Item label={t('Raum eröffnen:')}>
              {t(
                'Du wählst Runden, Rundenart (Fragen, Lückentext oder gemischt), Kategorien, Schwierigkeit und Zeiten. Du spielst mit oder leitest nur, etwa am Beamer.',
              )}
            </Item>
            <Item label={t('Beitreten:')}>
              {t('Die anderen scannen den QR-Code oder geben Raumcode und Spitznamen ein – ohne App und ohne Konto.')}
            </Item>
            <Item label={t('Leinwand:')}>
              {t('Über „Leinwand-Ansicht öffnen“ zeigt ein Fernseher oder Beamer alles groß für alle.')}
            </Item>
            <Item label={t('Leitung:')}>
              {t(
                'Im Menü „Leitung“ kannst du pausieren, eine Frage tauschen, den Raum sperren oder öffentlich zeigen und die Leitung übergeben.',
              )}
            </Item>
            <Item label={t('Handy gewechselt?')}>
              {t(
                'Gib im selben Raum denselben Spitznamen ein, dann spielst du am alten Platz weiter. Neu laden oder kurz offline sein schadet nicht.',
              )}
            </Item>
          </Topic>

          <Topic title={t('Allein gegen {bot}', { bot })}>
            <li>
              {t('{bot} ist ein Bot und hat immer Zeit. Mit „Gegen {bot} spielen“ bekommst du einen eigenen Raum, in dem er schon sitzt.', {
                bot,
              })}
            </li>
            <li>
              {t(
                'Er schreibt Bluffs, rät mit und verteilt Herzen. Die Wahrheit findet er in knapp der Hälfte der Runden – du kannst ihn also schlagen.',
              )}
            </li>
            <li>{t('Du startest, wann du willst, und kannst jederzeit Freunde dazuholen.')}</li>
            <li>
              {t(
                'Lieber gleich mit anderen? Zeigt jemand seinen Raum öffentlich, steht er oben unter „Offene Räume“. Ein Tipp, und du bist dabei.',
              )}
            </li>
          </Topic>

          <Topic title={t('Extras in jeder Runde')}>
            <Item label={t('Keine Idee?')}>{t('Einmal pro Runde gibt es einen Vorschlag für einen Bluff.')}</Item>
            <Item label={t('Zu nah an der Wahrheit:')}>
              {t('Stimmt dein Bluff aus Versehen, lehnt das Spiel ihn ab. Dann denkst du dir etwas anderes aus.')}
            </Item>
            <Item label={t('Lieblingsbluff:')}>
              {t('Nach der Auflösung verteilst du ein Herz. Der Bluff mit den meisten Herzen bringt +1 Punkt.')}
            </Item>
            <Item label={t('Liebe deinen Nächsten:')}>
              {t('Einmal pro Runde kannst du einen eigenen Punkt an jemanden verschenken.')}
            </Item>
            <Item label={t('Ruhige Minute:')}>
              {t('Brauchst du eine Pause zum Beten, setzt du eine Runde aus und siehst einen Psalmvers mit einem kurzen Gebetsimpuls.')}
            </Item>
          </Topic>

          <Topic title={t('Herzensrunde')}>
            <li>
              {t(
                'Zum Schluss eine Runde ohne Punkte und ohne Bluffen: Alle beantworten ehrlich eine Frage, etwa „Was hat dich heute an Jesus überrascht?“',
              )}
            </li>
            <li>
              {t('Die Antworten erscheinen gemischt und ohne Namen. „Diesmal nicht“ ist immer in Ordnung, und mit dem Endstand ist alles gelöscht.')}
            </li>
            <li>
              {t(
                'Sie ist zunächst eingeschaltet. Die Leitung kann sie beim Eröffnen oder im Warteraum ausschalten. Allein gegen {bot} gibt es keine Herzensrunde.',
                { bot },
              )}
            </li>
          </Topic>

          <Topic title={t('Nachbesprechung: vom Spiel ins Gespräch')}>
            <Item label={t('Spickzettel:')}>
              {t('Nach jeder Auflösung sieht nur die Leitung Hintergrundwissen, eine Gesprächsfrage und einen Querverweis.')}
            </Item>
            <Item label={t('Weiter ins Gespräch:')}>
              {t(
                'Nach dem Endstand wählt die Leitung eine Frage der Partie, vorgeschlagen ist die, bei der die meisten danebenlagen. Alle Handys und die Leinwand gehen mit.',
              )}
            </Item>
            <Item label={t('Vier Schritte:')}>
              {t('Lesen, Entdecken, Nachfragen, Mitnehmen. So wird aus dem Spieleabend ein Hauskreisabend ohne Vorbereitung.')}
            </Item>
            <li>{t('Das Gespräch ist freiwillig: „Zurück zum Endstand“ beendet es jederzeit.')}</li>
          </Topic>

          <Topic title={t('Nach der Partie')}>
            <Item label={t('Endstand:')}>
              {t('Siegertreppchen und Auszeichnungen wie Bluff-Meister, Wahrheitsfinder oder Bester Bluff des Abends.')}
            </Item>
            <Item label={t('Entdeckungen:')}>
              {t('Eine Seite mit allen Fragen, Antworten und Bibelstellen der Partie – ohne Namen, zum Teilen und Nachlesen.')}
            </Item>
            <Item label={t('Mein Vers für die Woche:')}>
              {t('Ein passender Vers als Sperrbildschirm, auf Wunsch mit täglicher Erinnerung im Kalender.')}
            </Item>
            <Item label={t('Neugierig auf Jesus?')}>
              {tj('{link} für alle, die mehr wissen wollen.', {
                link: (
                  <a
                    href="/jesus"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/jesus');
                    }}
                  >
                    {t('Eine kurze, ehrliche Seite')}
                  </a>
                ),
              })}
            </Item>
          </Topic>
        </div>
        <p class="muted small">{t('Fragen aus allen 27 Büchern des Neuen Testaments und ausgewählten Geschichten des Alten Testaments · freikirchlich-pfingstliche Lernfassung')}</p>
      </div>
    </section>
  );
}
