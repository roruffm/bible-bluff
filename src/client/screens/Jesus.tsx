// „Neugierig auf Jesus?“: eine ruhige Karte am Ende einer Partie und eine kurze, ehrliche Seite (/jesus)
// für alle, die mit dem Glauben (noch) wenig anfangen können. Ohne Druck, ohne Anmeldung, ohne Daten.

import { useEffect } from 'preact/hooks';
import { VERSE_SOURCE } from '../../shared/verses';
import { Button, Logo } from '../components/ui';
import { navigate } from '../lib/router';
import { LegalLinks } from './Legal';

/** Am Spielende: im Raum in neuem Tab, damit niemand aus der Partie fällt */
export function CuriousCard({ newTab = false }: { newTab?: boolean }) {
  return (
    <aside class="side-card curious-card" aria-labelledby="curious-title">
      <h2 id="curious-title">Neugierig auf Jesus?</h2>
      <p class="muted small">Wer war er – und was hat er mit dir zu tun? Kurz und ehrlich erklärt, ganz ohne Druck.</p>
      <a
        class="btn btn-secondary btn-block"
        href="/jesus"
        {...(newTab
          ? { target: '_blank', rel: 'noopener' }
          : {
              onClick: (e: MouseEvent) => {
                e.preventDefault();
                navigate('/jesus');
              },
            })}
      >
        Mehr erfahren
      </a>
    </aside>
  );
}

export function JesusPage() {
  useEffect(() => {
    const before = document.title;
    document.title = 'Neugierig auf Jesus? – Bible Bluff';
    return () => {
      document.title = before;
    };
  }, []);

  return (
    <main class="page legal jesus">
      <header class="hero legal-hero">
        <a
          href="/"
          class="legal-logo"
          aria-label="Zur Startseite"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          <Logo />
        </a>
        <h1>Neugierig auf Jesus?</h1>
        <p class="tagline">
          Bei Bible Bluff dreht sich vieles um ihn. Hier steht kurz und ehrlich, worum es im christlichen Glauben im Kern
          geht.
        </p>
      </header>

      <article class="card legal-body">
        <h2>Wer war Jesus?</h2>
        <p>
          Jesus lebte vor rund 2000 Jahren in Israel. Er zog als Lehrer durchs Land, heilte Kranke und sprach von Gott wie
          von einem Vater, der Menschen sucht. Er aß mit Leuten, um die andere einen Bogen machten, und nahm Kinder, Arme
          und Außenseiter ernst. Dass er gelebt hat, bezweifelt auch in der Geschichtswissenschaft kaum jemand.
        </p>

        <h2>Was er über Gott sagte – und über sich</h2>
        <p>
          Jesus erzählte von einem Vater, der seinem verlorenen Sohn entgegenläuft, als der nach Hause kommt (Lukas 15).
          So, sagte er, ist Gott. Und er sagte etwas Ungewöhnliches über sich selbst: Wer ihn sieht, sieht den Vater
          (Johannes 14,9). Christen glauben deshalb: In Jesus zeigt Gott sein Gesicht.
        </p>

        <h2>Warum Kreuz und Ostern so wichtig sind</h2>
        <p>
          Jesus wurde gekreuzigt. Christen glauben, dass er dabei unsere Schuld auf sich genommen hat, damit nichts mehr
          zwischen uns und Gott steht. Und sie glauben, dass er nicht im Grab geblieben ist: Am dritten Tag begegneten
          seine Freunde ihm lebendig (1. Korinther 15,3–5). Darum feiern Christen Ostern.
        </p>

        <h2>Glaube ist eine Beziehung</h2>
        <p>
          Christsein heißt nicht vor allem, Regeln zu kennen oder fromm zu wirken. Es heißt, Jesus zu vertrauen und mit
          ihm zu leben – wie in einer Freundschaft. Er selbst sagt:
        </p>
        <blockquote class="quiet-verse">
          „Euch aber habe ich gesagt, dass ihr Freunde seid.“
          <cite>Johannes 15,15 ({VERSE_SOURCE})</cite>
        </blockquote>
        <p>Diese Freundschaft kann man sich nicht verdienen. Jesus schenkt sie jedem, der sie haben will.</p>

        <h2>Wie du mehr herausfinden kannst</h2>
        <ul>
          <li>
            <b>Lies das Markusevangelium.</b> Es ist das kürzeste der vier Evangelien und in ein bis zwei Stunden gelesen –
            zum Beispiel in der Übersetzung{' '}
            <a href="https://www.bibleserver.com/HFA/Markus1" target="_blank" rel="noopener">
              „Hoffnung für alle“
            </a>{' '}
            in heutiger Sprache.
          </li>
          <li>
            <b>Frag nach.</b> Rede mit der Person, die dich zu Bible Bluff eingeladen hat. Sie freut sich über deine Fragen –
            auch über kritische.
          </li>
          <li>
            <b>Rede mit Jesus selbst.</b> Beten heißt: ehrlich mit ihm reden, in deinen eigenen Worten. Zum Beispiel:
            „Jesus, wenn es dich gibt, dann zeig dich mir.“
          </li>
          <li>
            <b>Komm vorbei.</b> Viele Gemeinden haben Jugendgruppen und Hauskreise, zu denen man einfach dazukommen kann.
          </li>
        </ul>

        <h2>Ehrliche Fragen sind willkommen</h2>
        <p>
          Du musst heute nichts entscheiden. Zweifel gehören dazu. Jesus hat Menschen mit ehrlichen Fragen nicht
          weggeschickt – auch Thomas nicht, der erst sehen wollte, bevor er glaubte (Johannes 20,24–29).
        </p>
      </article>

      <Button variant="ghost" block onClick={() => navigate('/')}>
        Zur Startseite
      </Button>
      <LegalLinks />
    </main>
  );
}
