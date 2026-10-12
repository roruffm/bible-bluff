// „Neugierig auf Jesus?“: eine ruhige Karte am Ende einer Partie und eine kurze, ehrliche Seite (/jesus)
// für alle, die mit dem Glauben (noch) wenig anfangen können. Ohne Druck, ohne Anmeldung, ohne Daten.
// Die Seite gibt es auf Deutsch und auf Englisch; die englische zitiert die World English Bible.

import { useEffect } from 'preact/hooks';
import { verseSource } from '../../shared/verses';
import { Button, Logo } from '../components/ui';
import { currentLang, t } from '../lib/i18n';
import { navigate } from '../lib/router';
import { LegalLinks } from './Legal';

/** Am Spielende: im Raum in neuem Tab, damit niemand aus der Partie fällt */
export function CuriousCard({ newTab = false }: { newTab?: boolean }) {
  return (
    <aside class="side-card curious-card" aria-labelledby="curious-title">
      <h2 id="curious-title">{t('Neugierig auf Jesus?')}</h2>
      <p class="muted small">{t('Wer war er – und was hat er mit dir zu tun? Kurz und ehrlich erklärt, ganz ohne Druck.')}</p>
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
        {t('Mehr erfahren')}
      </a>
    </aside>
  );
}

export function JesusPage() {
  const lang = currentLang();
  useEffect(() => {
    const before = document.title;
    document.title = t('Neugierig auf Jesus? – Bible Bluff');
    return () => {
      document.title = before;
    };
  }, [lang]);

  return (
    <main class="page legal jesus">
      <header class="hero legal-hero">
        <a
          href="/"
          class="legal-logo"
          aria-label={t('Zur Startseite')}
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          <Logo />
        </a>
        <h1>{t('Neugierig auf Jesus?')}</h1>
        <p class="tagline">
          {t('Bei Bible Bluff dreht sich vieles um ihn. Hier steht kurz und ehrlich, worum es im christlichen Glauben im Kern geht.')}
        </p>
      </header>

      {lang === 'en' ? <JesusEn /> : <JesusDe />}

      <Button variant="ghost" block onClick={() => navigate('/')}>
        {t('Zur Startseite')}
      </Button>
      <LegalLinks />
    </main>
  );
}

function JesusDe() {
  return (
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
        <cite>Johannes 15,15 ({verseSource('de')})</cite>
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
  );
}

function JesusEn() {
  return (
    <article class="card legal-body">
      <h2>Who was Jesus?</h2>
      <p>
        Jesus lived about 2,000 years ago in Israel. He travelled the country as a teacher, healed people who were ill
        and spoke about God as a Father who goes looking for people. He ate with people others avoided, and he took
        children, the poor and outsiders seriously. Hardly any historians doubt that he really lived.
      </p>

      <h2>What he said about God – and about himself</h2>
      <p>
        Jesus told the story of a father who runs out to meet his lost son when he comes home (Luke 15). That, he said,
        is what God is like. And he said something unusual about himself: anyone who has seen him has seen the Father
        (John 14:9). That’s why Christians believe that in Jesus, God shows us his face.
      </p>

      <h2>Why the cross and Easter matter so much</h2>
      <p>
        Jesus was crucified. Christians believe that he took the blame for everything we’ve done wrong, so that nothing
        stands between us and God any more. And they believe he didn’t stay in the grave: on the third day his friends
        met him alive (1 Corinthians 15:3–5). That’s why Christians celebrate Easter.
      </p>

      <h2>Faith is a relationship</h2>
      <p>
        Being a Christian isn’t mainly about knowing the rules or looking religious. It means trusting Jesus and living
        life with him – like a friendship. He says so himself:
      </p>
      <blockquote class="quiet-verse">
        “I have called you friends.”
        <cite>John 15:15 ({verseSource('en')})</cite>
      </blockquote>
      <p>You can’t earn this friendship. Jesus offers it to anyone who wants it.</p>

      <h2>How you can find out more</h2>
      <ul>
        <li>
          <b>Read Mark’s Gospel.</b> It’s the shortest of the four Gospels, and you can read it in an hour or two – for
          example in the{' '}
          <a href="https://www.bibleserver.com/NLT/Mark1" target="_blank" rel="noopener">
            New Living Translation
          </a>
          , which uses everyday language.
        </li>
        <li>
          <b>Ask questions.</b> Talk to the person who invited you to Bible Bluff. They’ll be glad you asked – even if
          your questions are critical ones.
        </li>
        <li>
          <b>Talk to Jesus yourself.</b> Praying simply means talking to him honestly, in your own words. For example:
          “Jesus, if you’re real, show yourself to me.”
        </li>
        <li>
          <b>Come along.</b> Lots of churches have youth groups and small groups where you can simply turn up.
        </li>
      </ul>

      <h2>Honest questions are welcome</h2>
      <p>
        You don’t have to decide anything today. Doubts are part of it. Jesus didn’t send people with honest questions
        away – not even Thomas, who wanted to see for himself before he would believe (John 20:24–29).
      </p>
    </article>
  );
}
