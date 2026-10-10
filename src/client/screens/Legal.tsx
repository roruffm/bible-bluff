// Impressum und Datenschutzerklärung. Die Angaben zum Anbieter stehen an einer Stelle (ANBIETER),
// damit sie sich bei einer Änderung nur einmal anpassen lassen.
import type { ComponentChildren } from 'preact';
import { Button, Logo } from '../components/ui';
import { navigate } from '../lib/router';

const ANBIETER = {
  name: 'Anne Kubbe',
  strasse: 'Steinlestr. 22',
  ort: '60595 Frankfurt am Main',
  email: 'roruffm@gmail.com',
};

const STAND = 'Oktober 2026';

/** Links auf Impressum und Datenschutz – im Spielraum in neuem Tab, damit niemand aus der Partie fällt */
export function LegalLinks({ newTab = false }: { newTab?: boolean }) {
  const link = (path: string, label: string) =>
    newTab ? (
      <a href={path} target="_blank" rel="noopener">
        {label}
      </a>
    ) : (
      <a
        href={path}
        onClick={(e) => {
          e.preventDefault();
          navigate(path);
        }}
      >
        {label}
      </a>
    );
  return (
    <nav class="legal-links" aria-label="Rechtliches">
      {link('/impressum', 'Impressum')}
      <span aria-hidden="true">·</span>
      {link('/datenschutz', 'Datenschutz')}
    </nav>
  );
}

function Address() {
  return (
    <p class="legal-address">
      {ANBIETER.name}
      <br />
      {ANBIETER.strasse}
      <br />
      {ANBIETER.ort}
      <br />
      E-Mail: <a href={`mailto:${ANBIETER.email}`}>{ANBIETER.email}</a>
    </p>
  );
}

function LegalShell({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <main class="page legal">
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
        <h1>{title}</h1>
      </header>
      <article class="card legal-body">{children}</article>
      <Button variant="ghost" block onClick={() => navigate('/')}>
        Zur Startseite
      </Button>
      <LegalLinks />
    </main>
  );
}

export function ImpressumPage() {
  return (
    <LegalShell title="Impressum">
      <h2>Angaben zum Anbieter</h2>
      <p class="muted small">nach § 5 Digitale-Dienste-Gesetz und § 18 Abs. 1 Medienstaatsvertrag</p>
      <Address />
      <h2>Über Bible Bluff</h2>
      <p>
        Bible Bluff ist ein kostenloses, nicht kommerzielles Partyspiel für Gemeinde- und Jugendgruppen. Es gibt keine
        Werbung und keine Bezahlfunktionen.
      </p>
      <h2>Datenschutz</h2>
      <p>
        Was beim Spielen gespeichert wird, steht in der{' '}
        <a
          href="/datenschutz"
          onClick={(e) => {
            e.preventDefault();
            navigate('/datenschutz');
          }}
        >
          Datenschutzerklärung
        </a>
        .
      </p>
    </LegalShell>
  );
}

export function DatenschutzPage() {
  return (
    <LegalShell title="Datenschutz">
      <p class="muted small">Stand: {STAND}</p>

      <h2>Das Wichtigste in Kürze</h2>
      <ul>
        <li>Zum Mitspielen brauchst du kein Konto, nur einen Spitznamen.</li>
        <li>Es gibt keine Cookies, keine Analyse- oder Werbedienste und keine Weitergabe deiner Daten für Werbung.</li>
        <li>Spielräume werden gelöscht, wenn sie 24 Stunden lang nicht mehr genutzt wurden.</li>
        <li>Ein Raum ist nur dann öffentlich, wenn die Spielleitung ihn bewusst auf der Startseite zeigt.</li>
      </ul>

      <h2>Verantwortlich</h2>
      <Address />

      <h2>Hosting bei Cloudflare</h2>
      <p>
        Bible Bluff läuft bei Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA (Cloudflare Workers und
        die Datenbank Cloudflare D1 mit Speicherort Westeuropa). Wenn du die Seite aufrufst, verarbeitet Cloudflare
        technisch notwendige Daten: deine IP-Adresse, den Zeitpunkt, die aufgerufene Adresse und die Kennung deines
        Browsers. Das ist nötig, um die Seite auszuliefern und vor Angriffen zu schützen. Technische Protokolle werden
        nach wenigen Tagen automatisch gelöscht.
      </p>
      <p>
        Rechtsgrundlage ist das berechtigte Interesse an einem sicheren und funktionierenden Angebot (Art. 6 Abs. 1
        lit. f DSGVO). Cloudflare verarbeitet die Daten im Auftrag auf Grundlage seines Vertrags zur
        Auftragsverarbeitung (Art. 28 DSGVO). Dabei können Daten auch in die USA übermittelt werden. Cloudflare ist nach
        dem EU-U.S. Data Privacy Framework zertifiziert, für das ein Angemessenheitsbeschluss der EU-Kommission besteht
        (Art. 45 DSGVO).
      </p>

      <h2>Was beim Spielen gespeichert wird</h2>
      <p>Wenn du einen Raum eröffnest oder einem Raum beitrittst, speichert der Server für diesen Raum:</p>
      <ul>
        <li>deinen Spitznamen und eine Spielfarbe,</li>
        <li>deine Bluffs, Stimmen, Herzen, verschenkten Punkte und deinen Punktestand,</li>
        <li>wann dein Gerät zuletzt verbunden war, damit das Spiel weiß, auf wen es warten muss,</li>
        <li>eine zufällige Sitzungskennung, und zwar nur als nicht rückrechenbaren Prüfwert,</li>
        <li>die Nummern der Fragen, die die Geräte im Raum schon kennen, damit möglichst neue Fragen kommen.</li>
      </ul>
      <p>
        Diese Daten dienen nur dem Spiel. Rechtsgrundlage ist die Bereitstellung des Spiels, das du nutzen möchtest
        (Art. 6 Abs. 1 lit. b DSGVO). Spielräume werden gelöscht, wenn sie 24 Stunden lang nicht mehr genutzt wurden.
        Bitte verwende einen Spitznamen und schreibe keine persönlichen Angaben über dich oder andere in Bluffs.
      </p>

      <h2>Öffentliche Räume</h2>
      <p>
        Die Spielleitung kann ihren Raum öffentlich zeigen. Dann steht er auf der Startseite mit Raumcode, Zahl der
        Personen, Stand der Partie und Schwierigkeit, aber ohne Spitznamen. Alle, die die Startseite besuchen, können
        dann beitreten und sehen im Raum wie alle anderen die Spitznamen und Bluffs der Runde. Wer in einem öffentlichen
        Raum ist, sieht das im Warteraum. Der Raum verschwindet von der Startseite, sobald die Leitung die Anzeige
        ausschaltet oder den Raum sperrt, die Partie endet oder niemand mehr verbunden ist. Rechtsgrundlage ist die
        Bereitstellung des Spiels (Art. 6 Abs. 1 lit. b DSGVO).
      </p>

      <h2>Entdeckungen-Seiten</h2>
      <p>
        Nach jeder vollständig gespielten Partie legt das Spiel eine dauerhafte Seite an, die man teilen kann. Sie
        enthält die Fragen, Antworten und Lieblingsbluffs der Partie und die Zahl der Mitspielenden, aber keine Namen
        und keinen Raumcode. Die Seite kann jeder öffnen, der den Link kennt. Sie bleibt bestehen, bis jemand ihre
        Löschung verlangt; dafür genügt eine E-Mail mit dem Link. Rechtsgrundlage ist das berechtigte Interesse, eine
        Partie nachlesen und weitergeben zu können (Art. 6 Abs. 1 lit. f DSGVO).
      </p>

      <h2>Gesammelte Bluffs</h2>
      <p>
        Nach jeder Partie merkt sich das Spiel Bluffs, die mindestens zwei Leute reingelegt oder zwei Herzen bekommen
        haben: nur den Text und diese Zahlen, ohne Namen. Bluffs, in denen ein Name aus der Runde vorkommt, werden nicht
        gespeichert. Nach einer Prüfung können sie in späteren Partien als Vorschläge erscheinen. Rechtsgrundlage ist das
        berechtigte Interesse, das Spiel abwechslungsreich zu halten (Art. 6 Abs. 1 lit. f DSGVO).
      </p>

      <h2>Speicherung auf deinem Gerät</h2>
      <p>Das Spiel nutzt den lokalen Speicher deines Browsers, keine Cookies. Dort liegen:</p>
      <ul>
        <li>deine Sitzung je Raum (Raumcode, Sitzungskennung, Spitzname), damit Neuladen nichts kostet,</li>
        <li>dein zuletzt verwendeter Spitzname,</li>
        <li>das gewählte Farbkonzept,</li>
        <li>die Nummern von höchstens 300 Fragen, die du schon gesehen hast.</li>
      </ul>
      <p>
        Diese Speicherung ist für das Spiel, das du aufrufst, unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG). Du
        kannst die Daten jederzeit über die Einstellungen deines Browsers löschen.
      </p>

      <h2>Schrift</h2>
      <p>Die Schrift liegt auf dem eigenen Server. Es wird keine Verbindung zu Google oder anderen Anbietern aufgebaut.</p>

      <h2>Deine Rechte</h2>
      <p>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung, auf
        Datenübertragbarkeit und auf Widerspruch gegen Verarbeitungen aus berechtigtem Interesse (Art. 15 bis 18, 20 und
        21 DSGVO). Schreib dafür eine E-Mail an <a href={`mailto:${ANBIETER.email}`}>{ANBIETER.email}</a>. Weil es keine
        Konten gibt, lassen sich Spielräume keiner Person zuordnen. Nenne deshalb den Raumcode oder den Link der
        Entdeckungen-Seite.
      </p>
      <p>
        Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO), zum Beispiel beim
        Hessischen Beauftragten für Datenschutz und Informationsfreiheit in Wiesbaden.
      </p>
    </LegalShell>
  );
}
