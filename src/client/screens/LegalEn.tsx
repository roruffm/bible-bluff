// Englische Fassung von Impressum und Datenschutzerklärung – eine Übersetzung zur Information; verbindlich
// ist die deutsche Fassung (Legal.tsx). Inhaltliche Änderungen bitte immer in beiden Fassungen nachziehen.

import type { ComponentChildren } from 'preact';
import { navigate } from '../lib/router';

function PrivacyLink({ children }: { children: ComponentChildren }) {
  return (
    <a
      href="/datenschutz"
      onClick={(e) => {
        e.preventDefault();
        navigate('/datenschutz');
      }}
    >
      {children}
    </a>
  );
}

export function TranslationNote() {
  return <p class="notice small">This English version is a courtesy translation. The German version is legally binding.</p>;
}

export function ImpressumEn({ address }: { address: ComponentChildren }) {
  return (
    <>
      <TranslationNote />
      <h2>Information about the provider</h2>
      <p class="muted small">
        under § 5 of the German Digital Services Act (DDG) and § 18(1) of the German Interstate Media Treaty (MStV)
      </p>
      {address}
      <h2>About Bible Bluff</h2>
      <p>
        Bible Bluff is a free, non-commercial party game for church and youth groups. There is no advertising and there
        are no payment features.
      </p>
      <h2>Privacy</h2>
      <p>
        What is stored while you play is explained in the <PrivacyLink>privacy policy</PrivacyLink>.
      </p>
    </>
  );
}

export function DatenschutzEn({ address, email, updated }: { address: ComponentChildren; email: string; updated: string }) {
  return (
    <>
      <p class="muted small">Last updated: {updated}</p>
      <TranslationNote />

      <h2>The essentials in brief</h2>
      <ul>
        <li>You don’t need an account to play – just a nickname.</li>
        <li>There are no cookies, no analytics or advertising services, and your data is never passed on for advertising.</li>
        <li>Game rooms are deleted once they haven’t been used for 24 hours.</li>
        <li>Nicknames used in games are stored separately in a protected list for the administrator.</li>
        <li>A room is only public if the host deliberately shows it on the home page.</li>
      </ul>

      <h2>Who is responsible</h2>
      {address}

      <h2>Hosting with Cloudflare</h2>
      <p>
        Bible Bluff runs on Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA (Cloudflare Workers and the
        Cloudflare D1 database, stored in Western Europe). When you open the site, Cloudflare processes technically
        necessary data: your IP address, the time, the address you requested and your browser’s identifier. This is
        needed to deliver the site and to protect it against attacks. Technical logs are deleted automatically after a
        few days.
      </p>
      <p>
        The legal basis is the legitimate interest in a secure, working service (Art. 6(1)(f) GDPR). Cloudflare
        processes the data on our behalf under its data processing agreement (Art. 28 GDPR). Data may also be
        transferred to the USA. Cloudflare is certified under the EU-U.S. Data Privacy Framework, for which the European
        Commission has adopted an adequacy decision (Art. 45 GDPR).
      </p>

      <h2>What is stored while you play</h2>
      <p>When you create or join a room, the server stores the following for that room:</p>
      <ul>
        <li>your nickname and a player colour,</li>
        <li>your bluffs, votes, hearts, points given away and your score,</li>
        <li>when your device was last connected, so the game knows who it needs to wait for,</li>
        <li>a random session ID – only as a check value that can’t be reversed,</li>
        <li>the numbers of the questions the devices in the room already know, so that new questions come up where possible,</li>
        <li>your answer in the heart-to-heart, if the host has switched it on (see below).</li>
      </ul>
      <p>
        This data is only used for the game. The legal basis is providing the game you want to use (Art. 6(1)(b) GDPR).
        Game rooms are deleted once they haven’t been used for 24 hours. Please use a nickname, and don’t write personal
        details about yourself or others in your bluffs.
      </p>

      <h2>Nicknames used in games</h2>
      <p>
        From the start of a game, a separate list stores each human participant’s nickname and the first and most
        recent time it was recorded. People joining an ongoing game are included; the bot and hosts who do not play
        are not. The administrator uses this list to see which nicknames have played. It contains no room codes,
        session IDs, IP addresses or links to bluffs, votes or heart-to-heart answers. Only the administrator with
        the admin key can access it. Equivalent spellings are grouped without identifying individual people.
      </p>
      <p>
        This list remains after game rooms are deleted, until the administrator removes an entry. You can request
        removal by emailing <a href={`mailto:${email}`}>{email}</a> with the nickname. The nickname may be recorded
        again if it is used to play another game.
      </p>

      <h2>Public rooms</h2>
      <p>
        The host can show their room publicly. It is then listed on the home page with its room code, the number of
        people, how far the game has got and the difficulty – but without nicknames. Anyone visiting the home page can
        then join and, like everyone else in the room, sees the nicknames and bluffs of the round. People in a public
        room can see this in the waiting room. The room disappears from the home page as soon as the host switches the
        listing off or locks the room, the game ends, or nobody has been connected for 15 minutes. The legal basis is
        providing the game (Art. 6(1)(b) GDPR).
      </p>

      <h2>Heart-to-heart</h2>
      <p>
        If the host has switched on the heart-to-heart, everyone can write an honest answer at the end – or skip it.
        The server only links your answer to you until the answers are shown. After that it only keeps the texts,
        shuffled and unassigned, and they are deleted too once the final scores appear. The answers are shown on all
        devices in the room without names. They don’t go on the discoveries page or into the collected bluffs. Bear in
        mind that people who know you well might recognise you by your words. The legal basis is providing the game
        (Art. 6(1)(b) GDPR).
      </p>

      <h2>My verse for the week</h2>
      <p>
        The lock-screen image is created on your device; the server doesn’t find out which verse you choose. If you tap
        “Add to calendar”, your device downloads a calendar file from the server. Only the chosen verse, the start date,
        the time and the language are sent, and none of it is stored. The reminders end up in your own calendar.
      </p>

      <h2>Discoveries pages</h2>
      <p>
        After every fully played game, the game creates a permanent page that can be shared. It contains the questions,
        answers and favourite bluffs of the game and the number of players, but no names and no room code. Anyone with
        the link can open the page. It stays online until someone asks for it to be deleted; an email with the link is
        enough. The legal basis is the legitimate interest in being able to read a game again and pass it on
        (Art. 6(1)(f) GDPR).
      </p>

      <h2>Collected bluffs</h2>
      <p>
        After every game, the game remembers bluffs that fooled at least two people or received two hearts: only the
        text and these numbers, without names. Bluffs that contain a name from the round are not stored. After a check,
        they may appear as suggestions in later games. At the moment this only applies to games in German. The legal
        basis is the legitimate interest in keeping the game varied (Art. 6(1)(f) GDPR).
      </p>

      <h2>Storage on your device</h2>
      <p>The game uses your browser’s local storage, not cookies. It holds:</p>
      <ul>
        <li>your session for each room (room code, session ID, nickname), so reloading doesn’t cost you anything,</li>
        <li>the nickname you used last,</li>
        <li>an unsent bluff draft in the current browser tab, until you submit it or the round ends,</li>
        <li>the colour scheme and language you chose,</li>
        <li>the numbers of up to 300 questions you’ve already seen.</li>
      </ul>
      <p>
        This storage is strictly necessary for the game you are using (§ 25(2) no. 2 of the German Telecommunications
        Digital Services Data Protection Act, TDDDG). You can delete the data at any time in your browser settings.
      </p>

      <h2>Font</h2>
      <p>The font is served from our own server. No connection is made to Google or any other provider.</p>

      <h2>Links to other sites</h2>
      <p>
        The “Curious about Jesus?” page links to bibleserver.com. Only when you tap one of these links does your browser
        connect to the other site; that site’s privacy policy then applies.
      </p>

      <h2>Your rights</h2>
      <p>
        You have the right of access, rectification, erasure and restriction of processing, the right to data
        portability and the right to object to processing based on legitimate interests (Art. 15 to 18, 20 and 21
        GDPR). To exercise these rights, email <a href={`mailto:${email}`}>{email}</a>. Because there are no accounts,
        game rooms can’t be linked to a person, so please give the room code or the link to the discoveries page.
      </p>
      <p>
        You can also complain to a data protection supervisory authority (Art. 77 GDPR), for example the Hessian
        Commissioner for Data Protection and Freedom of Information in Wiesbaden.
      </p>
    </>
  );
}
