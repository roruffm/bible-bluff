// Gesprächsstoff zu jeder Frage: Spickzettel für die Spielleitung und Grundlage für das Gespräch
// nach dem Spiel (Lesen → Entdecken → Nachfragen → Mitnehmen). Querverweise mit eigenen Worten,
// ohne Zitate aus urheberrechtlich geschützten Übersetzungen.
//
//  background – Hintergrund für die Leitung (höchstens 230 Zeichen)
//  question   – offene Gesprächsfrage für die Gruppe (höchstens 140 Zeichen)
//  crossRef   – eine andere Bibelstelle, die das Thema weiterführt, mit einem Satz dazu

import type { TalkNotes } from '../shared/types';
import { GAP_TALK } from './lueckentext';

const CLASSIC_TALK: Record<string, TalkNotes> = {
  'mt-schlangen': {
    background: 'Im selben Vers sagt Jesus, er sende die Jünger wie Schafe mitten unter Wölfe. Die Schlange galt seit 1. Mose 3,1 als besonders schlau; das griechische Wort für „ohne Falsch“ heißt wörtlich „unvermischt“.',
    question: 'Wie kann man im Alltag klug handeln, ohne dabei berechnend oder unehrlich zu werden?',
    crossRef: { ref: 'Römer 16,19', note: 'Paulus wünscht der Gemeinde in Rom, klug zu sein für das Gute und unberührt vom Bösen – derselbe doppelte Anspruch wie bei Jesus.' },
  },
  'mt-muenze': {
    background: 'Die Tempelsteuer ging auf den halben Schekel aus 2. Mose 30,13 zurück; zur Zeit Jesu zahlte ihn jeder erwachsene jüdische Mann jährlich. Der Stater im Fisch war vier Drachmen wert – genau die Steuer für zwei.',
    question: 'Wo verzichtet man besser auf ein gutes Recht, um anderen keinen Anstoß zu geben – und wo nicht?',
    crossRef: { ref: '1. Korinther 8,13', note: 'Bevor Paulus einen Glaubensbruder durch sein Essen zu Fall bringt, verzichtet er lieber ganz auf Fleisch – Freiheit mit Rücksicht.' },
  },
  'mt-traum': {
    background: 'Ihr Name wird nicht genannt; spätere Überlieferung nennt sie Procula. Träume, durch die Gott warnt und lenkt, kennt Matthäus schon aus seinen ersten Kapiteln – bei Josef und den Sterndeutern (1,20; 2,12–13).',
    question: 'Warum hört Pilatus nicht auf die Warnung – und was hält Menschen heute davon ab, unter Druck das Richtige zu tun?',
    crossRef: { ref: 'Johannes 19,12', note: 'Pilatus will Jesus freilassen, doch die Ankläger rufen: Wer ihn laufen lässt, ist kein Freund des Kaisers.' },
  },
  'mt-immanuel': {
    background: 'Der Name stammt aus Jesaja 7,14: Als König Ahas vor feindlichen Heeren zitterte, kündigte Jesaja dem Königshaus ein Kind namens Immanuel als Zeichen an. Matthäus sieht das in Jesus erfüllt.',
    question: 'Was bedeutet „Gott mit uns“ gerade in Zeiten, in denen man von Gottes Nähe wenig spürt?',
    crossRef: { ref: 'Psalm 23,4', note: 'Selbst im finsteren Tal fürchtet der Beter kein Unheil, weil Gott bei ihm ist – „Gott mit uns“ als Gebet.' },
  },
  'mt-reden': {
    background: 'Jede Rede schließt mit fast derselben Wendung: „Als Jesus diese Worte beendet hatte …“ (7,28; 11,1; 13,53; 19,1; 26,1). Beim fünften Mal heißt es „alle diese Worte“ – danach beginnt die Passionsgeschichte.',
    question: 'Welche der fünf Reden – Bergpredigt, Aussendung, Gleichnisse, Gemeinde, Wiederkunft – trifft euren Alltag gerade am meisten?',
    crossRef: { ref: '5. Mose 18,15', note: 'Mose kündigt einen Propheten wie ihn an, auf den Israel hören soll – Petrus bezieht das in Apostelgeschichte 3,22 auf Jesus.' },
  },
  'mt-zuerst': {
    background: 'Viele Zuhörer Jesu lebten von der Hand in den Mund – als Tagelöhner, Kleinbauern oder Fischer. Jesus spielt ihre Sorgen nicht herunter: Der Vater weiß, dass sie das alles brauchen (6,32).',
    question: 'Wie sieht es konkret aus, Gottes Reich zuerst zu suchen – im Terminkalender, beim Geld, in Beziehungen?',
    crossRef: { ref: 'Römer 14,17', note: 'Paulus beschreibt Gottes Reich: Es geht nicht ums Essen und Trinken, sondern um Gerechtigkeit, Frieden und Freude im Heiligen Geist.' },
  },
  'mt-sanftmut': {
    background: 'Das griechische Wort meint keine Schwäche, sondern Stärke, die sich beherrscht und auf Gewalt verzichtet. Jesus nennt sich selbst sanftmütig (11,29) und zieht auf einem Esel in Jerusalem ein (21,5).',
    question: 'Wo erlebt ihr, dass Sanftmut am Ende mehr bewirkt als Durchsetzungskraft?',
    crossRef: { ref: 'Galater 5,22-23', note: 'Paulus zählt Sanftmut zur Frucht des Geistes – sie wächst, statt erkämpft zu werden.' },
  },
  'mt-salz': {
    background: 'Salz würzte nicht nur, es machte Fleisch und Fisch haltbar und gehörte zu jedem Speisopfer (3. Mose 2,13). Jesus sagt nicht „Ihr sollt Salz werden“, sondern „Ihr seid das Salz der Erde“.',
    question: 'Woran merkt euer Umfeld, dass ihr Salz seid – und was hilft, nicht fade zu werden?',
    crossRef: { ref: 'Kolosser 4,6', note: 'Paulus wünscht, dass unsere Rede immer freundlich und mit Salz gewürzt ist – Salz zeigt sich auch im Reden.' },
  },
  'mt-sonne': {
    background: 'Im Alten Testament gilt Regen als Segen, den Gott zur rechten Zeit schenkt (5. Mose 11,14). Jesus macht daraus ein Vorbild: So vollkommen wie der Vater sollen auch seine Kinder lieben (5,48).',
    question: 'Warum fällt es so schwer, Menschen Gutes zu gönnen, die uns schaden – und was hilft dabei?',
    crossRef: { ref: 'Lukas 6,35-36', note: 'Bei Lukas heißt es: Gott ist gütig zu den Undankbaren und Bösen – darum seid barmherzig wie euer Vater.' },
  },
  'mt-posaune': {
    background: 'Almosen galten im Judentum als selbstverständliche Pflicht der Gerechtigkeit. Ob wirklich Posaunen erklangen, ist unklar; vielleicht spielt Jesus auf die trichterförmigen Opferkästen im Tempel an.',
    question: 'Wie kann man Gutes tun, ohne dass es ums eigene Ansehen geht – gerade in Zeiten von Social Media?',
    crossRef: { ref: 'Markus 12,41-44', note: 'Jesus beobachtet die Spenden am Tempel und lobt eine arme Witwe, die unbemerkt alles gab, was sie hatte.' },
  },
  'mt-plappern': {
    background: 'Im antiken Gebet zählte oft die richtige Formel: Man reihte möglichst viele Götternamen aneinander, um keinen zu verpassen. Jesus setzt dagegen das Vertrauen zu einem Vater, der seine Kinder kennt.',
    question: 'Was verändert sich am Beten, wenn man es als Gespräch mit einem Vater versteht statt als Pflicht?',
    crossRef: { ref: '1. Könige 18,26-29', note: 'Die Propheten Baals riefen stundenlang und immer lauter – doch es kam keine Antwort.' },
  },
  'mt-unkraut': {
    background: 'Gemeint ist vermutlich der Taumellolch, ein giftiges Gras, das jungem Weizen zum Verwechseln ähnlich sieht. Erst wenn die Ähren reifen, erkennt man den Unterschied.',
    question: 'Wo neigen wir dazu, Menschen vorschnell als „Unkraut“ abzustempeln – und was lehrt uns die Geduld des Bauern?',
    crossRef: { ref: '1. Korinther 4,5', note: 'Paulus rät: Richtet nicht vor der Zeit – erst wenn der Herr kommt, wird das Verborgene offenbar.' },
  },
  'mt-oel': {
    background: 'Bei Hochzeiten holte der Bräutigam die Braut aus ihrem Elternhaus ab; der Festzug begann oft erst spät am Abend. Die Brautjungfern begleiteten ihn mit Fackeln oder Lampen, die regelmäßig Öl brauchten.',
    question: 'Was lässt sich im Glauben nicht von anderen ausleihen – und wie „füllt“ man sein eigenes Öl auf?',
    crossRef: { ref: 'Lukas 12,35-36', note: 'Jesus ruft: Lasst eure Lampen brennen und wartet wie Knechte auf ihren Herrn, der von der Hochzeit heimkommt.' },
  },
  'mt-zoellner': {
    background: 'Zöllner arbeiteten für die Besatzer und galten als Betrüger, Prostituierte als unrein und ausgestoßen. Ausgerechnet sie glaubten Johannes, während die Frommen zwar Ja sagten, aber nicht umkehrten.',
    question: 'Wen würde Jesus heute als Beispiel nennen, um fromme Menschen aufzurütteln?',
    crossRef: { ref: 'Lukas 7,29-30', note: 'Das Volk und die Zöllner ließen sich von Johannes taufen; Pharisäer und Gesetzeslehrer lehnten Gottes Ruf ab.' },
  },
  'mt-kamele': {
    background: 'Getränke wurden durch ein Tuch gesiebt, denn Mücken galten als unrein (3. Mose 11,41). Kamele waren ebenfalls unrein – und das größte Tier im Land. Auf Aramäisch klingen „galma“ und „gamla“ fast gleich.',
    question: 'Wo verlieren wir uns in Kleinigkeiten und übersehen dabei Recht, Barmherzigkeit und Treue?',
    crossRef: { ref: 'Micha 6,8', note: 'Micha fasst zusammen, was Gott wirklich will: Recht tun, Güte lieben und demütig mit Gott gehen.' },
  },
  'mt-markt': {
    background: 'Kinder spielten auf dem Marktplatz Hochzeit und Beerdigung: Die einen pfiffen zum Tanz, die anderen stimmten Klagelieder an. Wer nie mitmacht, verdirbt jedes Spiel.',
    question: 'Welche Ausreden nutzen Menschen heute, um sich Gottes Einladung vom Leib zu halten?',
    crossRef: { ref: 'Lukas 7,31-35', note: 'Lukas erzählt dasselbe Bild und schließt: Die Weisheit wird gerechtfertigt von allen ihren Kindern.' },
  },
  'mt-meile': {
    background: 'Eine römische Meile maß knapp anderthalb Kilometer. Für viele Juden war der Tragedienst für die Besatzer eine Demütigung. Jesus verlangt keine Unterwerfung, sondern die freie Entscheidung, mehr zu geben.',
    question: 'Wie könnte heute eine „zweite Meile“ aussehen – bei Menschen, die uns etwas abverlangen?',
    crossRef: { ref: 'Markus 15,21', note: 'Simon von Kyrene wurde gezwungen, Jesu Kreuz zu tragen – genau diese Art von Zwangsdienst meint Jesus.' },
  },
  'mt-jesus': {
    background: 'Jeschua war zur Zeit Jesu ein häufiger Name – der Geschichtsschreiber Josephus erwähnt zahlreiche Männer, die so hießen. Seine Bedeutung bekam er durch den, der ihn trug.',
    question: 'Wovon brauchen Menschen heute Rettung – und was bedeutet es, dass Gott selbst rettet?',
    crossRef: { ref: 'Apostelgeschichte 4,12', note: 'Petrus bekennt vor dem Hohen Rat: In keinem anderen ist das Heil, auch kein anderer Name ist uns gegeben.' },
  },
  'mk-leinentuch': {
    background: 'Unmittelbar davor heißt es, dass alle Jünger Jesus im Stich ließen und flohen (14,50). Auffällig: Das Wort für das Leinentuch verwendet Markus sonst nur noch beim Begräbnis Jesu (15,46).',
    question: 'Warum erzählt die Bibel so ungeschönt, wie Jesu Begleiter davonliefen – und was gibt das Menschen, die selbst versagt haben?',
    crossRef: { ref: 'Markus 16,7', note: 'Am leeren Grab erhalten die Frauen den Auftrag, den Jüngern und Petrus zu sagen: Jesus geht ihnen nach Galiläa voraus.' },
  },
  'mk-effata': {
    background: 'Die Heilung spielt im Gebiet der Zehn Städte, wo viele Nichtjuden lebten. Jesus nimmt den Mann beiseite, berührt Ohren und Zunge und seufzt zum Himmel – eine sehr persönliche Zuwendung.',
    question: 'Wo braucht es heute ein „Effata“ – bei Ohren, Herzen oder Türen, die sich verschlossen haben?',
    crossRef: { ref: 'Jesaja 35,4-6', note: 'Jesaja verheißt: Gott kommt und hilft – dann öffnen sich die Ohren der Tauben, und die Stummen jubeln.' },
  },
  'mk-dach': {
    background: 'Häuser in Galiläa hatten meist flache Dächer aus Balken, Zweigen und Lehm, oft über eine Außentreppe erreichbar. Markus schreibt wörtlich, dass die Männer das Dach „aufgruben“.',
    question: 'Wie können Freunde heute für jemanden glauben, beten und anpacken, der es selbst gerade nicht kann?',
    crossRef: { ref: 'Galater 6,2', note: 'Paulus ruft dazu auf, die Lasten der anderen mitzutragen – so wird das Gesetz Christi erfüllt.' },
  },
  'mk-kissen': {
    background: 'Der See Genezareth liegt gut 200 Meter unter dem Meeresspiegel, umgeben von Bergen. Fallwinde können dort plötzlich heftige Stürme auslösen – im Boot saßen erfahrene Fischer, und doch hatten sie Todesangst.',
    question: 'Wie geht man damit um, wenn Gott im Sturm zu „schlafen“ scheint – und was hilft dann beim Vertrauen?',
    crossRef: { ref: 'Psalm 121,4', note: 'Der Psalm versichert, dass Israels Beschützer weder einnickt noch schläft – auch wenn es im Sturm anders wirkt.' },
  },
  'mk-hauptmann': {
    background: 'Ein Hauptmann führte etwa 80 bis 100 Soldaten. Auch der Kaiser trug einen Gottessohn-Titel: Tiberius ließ sich auf Münzen „Sohn des göttlichen Augustus“ nennen.',
    question: 'Was sieht der Hauptmann ausgerechnet am sterbenden Jesus – und was sagt das darüber, wie Gott sich zeigt?',
    crossRef: { ref: '1. Korinther 1,23-24', note: 'Paulus verkündigt den gekreuzigten Christus – für viele anstößig oder töricht, für die Berufenen aber Gottes Kraft und Weisheit.' },
  },
  'mk-heuschrecken': {
    background: 'Heuschrecken gehörten zu den wenigen Insekten, die das Gesetz als Speise erlaubte (3. Mose 11,22). „Wilder Honig“ war Honig wilder Bienen oder vielleicht süßer Baumsaft – Nahrung, die die Wüste selbst bot.',
    question: 'Wie kann man heute wie Johannes der Täufer auf Jesus hinweisen – im Freundeskreis, in Schule oder Job, in der Familie?',
    crossRef: { ref: 'Johannes 3,30', note: 'Der Täufer sagt über Jesus: Er soll immer größer werden, ich aber kleiner – so versteht ein Wegbereiter seine Rolle.' },
  },
  'mk-donnersoehne': {
    background: 'Markus nennt den ursprünglichen Beinamen „Boanerges“, vermutlich aus dem Aramäischen. Die Brüder waren Fischer, Söhne des Zebedäus – und ehrgeizig: Sie baten Jesus um die Ehrenplätze neben ihm (10,35–37).',
    question: 'Wie kann aus hitzigem Eifer – auch für den Glauben – etwas werden, das anderen dient statt schadet?',
    crossRef: { ref: 'Jakobus 1,19-20', note: 'Der Jakobusbrief rät, schnell zuzuhören, aber langsam zu reden und zu zürnen – menschlicher Zorn bewirkt nicht, was vor Gott recht ist.' },
  },
  'mk-wasserkrug': {
    background: 'Zum Passafest war Jerusalem voller Pilger, und das Passalamm musste innerhalb der Stadt gegessen werden. Vielleicht hielt Jesus den Ort bewusst geheim, damit der Verrat das Mahl nicht verhindern konnte.',
    question: 'Wie gelingt es, Jesus zu folgen, wenn man nur den nächsten Schritt kennt und nicht den ganzen Weg?',
    crossRef: { ref: 'Hebräer 11,8', note: 'Abraham folgt Gottes Ruf und bricht auf, ohne zu wissen, wohin er kommen wird – Vertrauen Schritt für Schritt.' },
  },
  'mk-arzt': {
    background: 'Levi saß am Zoll in Kapernaum, an einer wichtigen Handelsstraße. Ein gemeinsames Essen bedeutete im Orient Gemeinschaft und Annahme – darum empörten sich die Schriftgelehrten so.',
    question: 'Wer hat es heute schwer, in unseren Gemeinden willkommen zu sein – und was würde Jesus tun?',
    crossRef: { ref: 'Hosea 6,6', note: 'Bei Matthäus zitiert Jesus den Propheten Hosea: Gott will Barmherzigkeit und nicht Opfer.' },
  },
  'mk-groesste': {
    background: 'Kurz zuvor hatte Jesus zum zweiten Mal sein Leiden angekündigt (9,31). Die Jünger verstehen es nicht und streiten stattdessen über ihren Rang. Kinder hatten damals kaum Rechte und kein Ansehen.',
    question: 'Woran misst unsere Gesellschaft Größe – und wie sähe Größe nach Jesu Maßstab heute aus?',
    crossRef: { ref: 'Markus 10,43-45', note: 'Jesus sagt: Wer groß sein will, soll Diener sein – denn auch der Menschensohn kam, um zu dienen.' },
  },
  'mk-unrein': {
    background: 'Die Pharisäer wuschen sich die Hände nicht aus Hygiene, sondern nach der Überlieferung der Ältesten, um rituell rein zu sein (7,3). Jesus wirft ihnen vor, über Menschensatzungen Gottes Gebot zu vergessen.',
    question: 'Wo legen wir mehr Wert auf äußere Regeln als auf ein ehrliches Herz?',
    crossRef: { ref: 'Psalm 51,12', note: 'David bittet: Schaffe in mir, Gott, ein reines Herz – Reinheit beginnt innen.' },
  },
  'mk-bartimaeus': {
    background: 'Bartimäus saß bettelnd am Weg vor Jericho, auf dem Pilger nach Jerusalem zogen. Er ruft Jesus als Erster im Markusevangelium „Sohn Davids“ – und wirft seinen Mantel ab, als Jesus ihn ruft.',
    question: 'Warum ist es wichtig, Gott seine Bitten konkret zu sagen, obwohl er sie schon kennt?',
    crossRef: { ref: 'Philipper 4,6', note: 'Paulus rät: Sorgt euch um nichts, sondern bringt eure Anliegen mit Dank vor Gott.' },
  },
  'mk-kruemel': {
    background: 'Die Frau war Griechin aus der Gegend von Tyrus, also keine Jüdin. Jesus spricht von „Hündlein“, kleinen Haushunden, nicht von Straßenhunden – sie nimmt das Bild auf und wendet es zu ihren Gunsten.',
    question: 'Was können wir von der Hartnäckigkeit dieser Mutter für unser eigenes Beten lernen?',
    crossRef: { ref: 'Matthäus 15,28', note: 'Bei Matthäus sagt Jesus zu ihr: Frau, dein Glaube ist groß! Dir geschehe, wie du willst.' },
  },
  'mk-abba': {
    background: 'Markus überliefert das aramäische Wort und übersetzt es gleich für seine griechischen Leser. In Gethsemane ringt Jesus mit seinem Tod – und spricht Gott trotzdem so vertraut an.',
    question: 'Was verändert es am Beten in schweren Zeiten, Gott als liebenden Vater anzusprechen?',
    crossRef: { ref: 'Galater 4,6', note: 'Paulus schreibt: Gott hat den Geist seines Sohnes in unsere Herzen gesandt, der ruft: Abba, lieber Vater!' },
  },
  'mk-hosianna': {
    background: 'Psalm 118 gehörte zu den Liedern, die beim Passafest gesungen wurden. Die Menge breitet Kleider und Zweige auf den Weg – so begrüßte man einen König (2. Könige 9,13).',
    question: 'Wie können Lob und Hilferuf im Gebet zusammengehören?',
    crossRef: { ref: 'Sacharja 9,9', note: 'Sacharja kündigt einen gerechten König an, der arm auf einem Esel in Jerusalem einzieht.' },
  },
  'lk-zachaeus': {
    background: 'Jericho war eine reiche Oasenstadt an einer wichtigen Handelsstraße – ein einträglicher Ort für Zolleinnahmen. Der Maulbeerfeigenbaum hat einen kurzen Stamm und tief ansetzende, weit ausladende Äste.',
    question: 'Was verändert sich bei Menschen, die angenommen werden, bevor sie sich bessern – so wie Zachäus?',
    crossRef: { ref: 'Römer 5,8', note: 'Paulus schreibt, dass Christus für uns starb, als wir noch Sünder waren – so beweist Gott seine Liebe.' },
  },
  'lk-adam': {
    background: 'Lukas setzt den Stammbaum direkt hinter Jesu Taufe, bei der Gott ihn seinen Sohn nennt. Die Liste läuft rückwärts und endet bei Adam, der unmittelbar von Gott stammt (3,38).',
    question: 'Wie verändert es den Blick auf Menschen anderer Herkunft, dass Jesus für die ganze Menschheit gekommen ist?',
    crossRef: { ref: 'Apostelgeschichte 17,26', note: 'In Athen erklärt Paulus, dass Gott aus einem einzigen Menschen alle Völker der Erde gemacht hat.' },
  },
  'lk-zwoelf': {
    background: 'Pilger reisten in großen Gruppen, darum fiel Jesu Fehlen erst nach einer Tagesreise auf. Seine ersten Worte bei Lukas sprechen von seinem Vater – gemeint ist Gott, nicht Josef (2,49).',
    question: 'Welche Rolle spielen ehrliche Fragen für einen wachsenden Glauben – so wie bei Jesus unter den Lehrern im Tempel?',
    crossRef: { ref: '1. Samuel 2,26', note: 'Vom jungen Samuel, der am Heiligtum aufwuchs, heißt es wie später von Jesus: Er wuchs und fand Gunst bei Gott und Menschen.' },
  },
  'lk-johanna': {
    background: 'Sie hieß Johanna; ihr Mann Chuzas war Verwalter bei Herodes Antipas, also Beamter am Fürstenhof. Später gehört Johanna zu den Frauen, die das leere Grab finden und den Aposteln davon berichten (24,10).',
    question: 'Wer sind heute die „Johannas“, die Gottes Arbeit im Hintergrund mittragen – und wie kann man sie würdigen?',
    crossRef: { ref: 'Römer 16,1-2', note: 'Paulus empfiehlt Phöbe aus der Gemeinde in Kenchreä – sie hat viele unterstützt, darunter ihn selbst.' },
  },
  'lk-emmaus': {
    background: 'Beim jüdischen Mahl sprach der Hausherr das Dankgebet und brach das Brot – in Emmaus übernimmt der Gast diese Rolle. Der Ort lag etwa elf Kilometer von Jerusalem entfernt; wo genau, ist unklar.',
    question: 'Woran merkt man oft erst im Rückblick, dass Jesus einen Weg mitgegangen ist?',
    crossRef: { ref: 'Apostelgeschichte 2,42', note: 'Die erste Gemeinde hält fest an der Lehre der Apostel, an der Gemeinschaft, am Brotbrechen und am Gebet.' },
  },
  'lk-samariter': {
    background: 'Der Weg von Jerusalem hinab nach Jericho führt rund 1000 Höhenmeter durch einsames Wüstengebiet und galt als gefährlich. Juden und Samaritaner waren seit Jahrhunderten miteinander verfeindet.',
    question: 'Wer ist heute der Mensch am Wegrand, an dem man leicht vorbeigeht – und was hilft, stehen zu bleiben?',
    crossRef: { ref: '3. Mose 19,34', note: 'Schon das Gesetz Mose gebietet, den Fremden im Land wie einen Einheimischen zu behandeln und ihn zu lieben wie sich selbst.' },
  },
  'lk-verloren': {
    background: 'Anlass ist der Vorwurf, Jesus nehme Sünder an und esse mit ihnen (15,1–2). Auffällig ist die Steigerung: Es fehlt eins von hundert, dann eins von zehn, schließlich einer von zwei Söhnen.',
    question: 'Warum fällt es dem älteren Bruder so schwer mitzufeiern – und wo kennt man dieses Gefühl heute?',
    crossRef: { ref: 'Hesekiel 34,11-16', note: 'Gott kündigt an, selbst nach seinen Schafen zu suchen, das Verlorene heimzuholen und das Verwundete zu verbinden.' },
  },
  'lk-fisch': {
    background: 'Viele Griechen hielten eine leibliche Auferstehung für unvorstellbar; in Athen spotteten manche darüber (Apostelgeschichte 17,32). Lukas notiert zudem: Vor Freude konnten die Jünger es noch nicht glauben (24,41).',
    question: 'Was bedeutet es für die christliche Hoffnung, dass der Auferstandene einen echten Leib hat, der isst und berührt werden kann?',
    crossRef: { ref: 'Philipper 3,20-21', note: 'Paulus erwartet, dass Christus unseren vergänglichen Leib verwandeln wird, sodass er seinem verherrlichten Leib gleicht.' },
  },
  'lk-fuchs': {
    background: 'Gemeint ist Herodes Antipas, Sohn Herodes des Großen und Landesfürst über Galiläa. Er hatte bereits Johannes den Täufer hinrichten lassen – die Warnung war also ernst zu nehmen.',
    question: 'Was hilft, den eigenen Auftrag nicht aufzugeben, wenn Druck oder Drohungen kommen?',
    crossRef: { ref: 'Lukas 23,8-11', note: 'Als Herodes Jesus endlich vor sich hat, hofft er auf ein Wunder – doch Jesus schweigt, und Herodes verspottet ihn.' },
  },
  'lk-wehe': {
    background: 'Lukas stellt den vier Seligpreisungen (6,20-23) vier Weherufe gegenüber. „Wehe“ ist dabei kein Fluch, sondern ein Ausruf der Klage und Warnung, voller Sorge um die Angesprochenen.',
    question: 'Warum kann Beliebtheit gefährlich werden – und wie geht man ehrlich mit Lob um?',
    crossRef: { ref: 'Galater 1,10', note: 'Paulus fragt: Suche ich Menschen zu gefallen? Wollte er das, wäre er nicht mehr Christi Knecht.' },
  },
  'lk-diener': {
    background: 'Zum Dienen schürzte man das lange Gewand hoch und band es mit dem Gürtel fest. Normalerweise tat das der Knecht für seinen Herrn (17,7-8) – Jesus dreht das Bild um.',
    question: 'Was bedeutet es für unseren Glauben, dass Gott sich nicht zu schade ist, uns zu dienen?',
    crossRef: { ref: 'Lukas 22,27', note: 'Beim letzten Mahl fragt Jesus: Wer ist größer, der zu Tisch sitzt oder der dient? Ich bin unter euch wie ein Diener.' },
  },
  'lk-tageloehner': {
    background: 'Tagelöhner standen noch unter den Knechten des Hauses: Sie wurden nur für einen Tag angeheuert und hatten keinerlei Sicherheit. Der Sohn will nicht mehr Sohn sein, nur noch irgendwie überleben.',
    question: 'Warum fällt es manchmal leichter, sich Gottes Liebe zu „verdienen“, als sie sich einfach schenken zu lassen?',
    crossRef: { ref: 'Galater 4,7', note: 'Paulus schreibt: Du bist nicht mehr Knecht, sondern Kind – und als Kind auch Erbe durch Gott.' },
  },
  'lk-pharisaeer': {
    background: 'Pharisäer nahmen das Gesetz sehr ernst und taten oft mehr als verlangt; viele Menschen bewunderten sie. Zöllner dagegen galten als Kollaborateure und Betrüger. Jesus erzählt eine Geschichte mit Schock-Ende.',
    question: 'Warum vergleichen wir uns so gern mit anderen – und was macht das mit unserem Gebet?',
    crossRef: { ref: 'Psalm 51,19', note: 'David betet: Die Opfer, die Gott gefallen, sind ein geängsteter Geist und ein zerschlagenes Herz.' },
  },
  'lk-simon': {
    background: 'Bei Gastmählern lag man auf Polstern, die Füße vom Tisch weg – so konnte die Frau von hinten an Jesu Füße kommen. Fußwasser, Kuss und Öl gehörten zur höflichen Begrüßung eines Gastes.',
    question: 'Was hat Dankbarkeit mit Vergebung zu tun – und warum lieben manche Menschen Gott so überschwänglich?',
    crossRef: { ref: '1. Johannes 4,19', note: 'Johannes schreibt: Wir lieben, weil Gott uns zuerst geliebt hat.' },
  },
  'lk-scheunen': {
    background: 'Anlass ist ein Erbstreit: Jemand will, dass Jesus seinen Bruder zum Teilen bringt (12,13). Jesus lehnt ab und warnt vor Habgier – denn niemand lebt davon, dass er viele Güter hat (12,15).',
    question: 'Was heißt es konkret, „reich bei Gott“ zu sein – und wie viel Vorsorge ist gesund?',
    crossRef: { ref: 'Jakobus 4,13-15', note: 'Jakobus warnt vor Plänen ohne Gott: Ihr wisst nicht, was morgen ist – sagt lieber: Wenn der Herr will.' },
  },
  'lk-pflug': {
    background: 'Ein Pflug wurde mit einer Hand geführt, die andere trieb die Ochsen an; wer nicht nach vorn schaute, zog krumme Furchen. Elia erlaubte Elisa noch, sich von seinen Eltern zu verabschieden (1. Könige 19,20).',
    question: 'Was zieht Menschen beim Glauben zurück – und was hilft, den Blick nach vorn zu richten?',
    crossRef: { ref: 'Philipper 3,13-14', note: 'Paulus vergisst, was hinter ihm liegt, und streckt sich nach dem aus, was vor ihm ist.' },
  },
  'lk-raben': {
    background: 'Raben haben weder Vorratskeller noch Scheune – das greift die Geschichte vom reichen Kornbauern direkt davor auf (12,16-21). Schon Psalm 147,9 sagt, dass Gott die jungen Raben versorgt.',
    question: 'Welche Sorgen rauben Menschen heute am meisten Kraft – und was kann Vertrauen daran ändern?',
    crossRef: { ref: '1. Petrus 5,7', note: 'Petrus ermutigt: Werft alle eure Sorge auf Gott, denn er sorgt für euch.' },
  },
  'lk-martha': {
    background: 'Martha nimmt Jesus in ihr Haus auf – Gastfreundschaft war Ehrensache. Maria sitzt zu seinen Füßen, die übliche Haltung eines Schülers bei seinem Lehrer; für eine Frau war das damals ungewöhnlich.',
    question: 'Wie findet man zwischen Tun und Hören eine gute Balance – im Alltag und in der Gemeinde?',
    crossRef: { ref: 'Apostelgeschichte 22,3', note: 'Paulus erzählt, er sei zu den Füßen Gamaliels unterrichtet worden – so saßen Schüler bei ihrem Lehrer.' },
  },
  'lk-fischzug': {
    background: 'Petrus hatte die ganze Nacht nichts gefangen; tagsüber zu fischen galt als sinnlos. Trotzdem fährt er auf Jesu Wort hinaus. Erst angesichts des Wunders erkennt er, wer da in seinem Boot sitzt.',
    question: 'Warum fühlen sich Menschen in Gottes Nähe oft klein – und wie geht Jesus damit um?',
    crossRef: { ref: 'Jesaja 6,5-8', note: 'Jesaja sieht Gottes Herrlichkeit und ruft: Weh mir, ich bin unreiner Lippen – dann wird er gereinigt und gesandt.' },
  },
  'lk-zelot': {
    background: 'Matthäus und Markus nennen ihn Kananäus, nach dem aramäischen Wort für Eiferer. Ob Simon gegen Rom kämpfte oder vor allem für das Gesetz eiferte, ist in der Forschung umstritten.',
    question: 'Was hält eine Gruppe zusammen, in der Menschen mit ganz gegensätzlichen Überzeugungen sind?',
    crossRef: { ref: 'Epheser 2,14', note: 'Paulus schreibt: Christus ist unser Friede, er hat die trennende Wand der Feindschaft niedergerissen.' },
  },
  'joh-kana': {
    background: 'Die Krüge waren aus Stein, weil Stein nach jüdischem Verständnis nicht unrein werden konnte; sie dienten der rituellen Reinigung (2,6). Hochzeiten dauerten bis zu einer Woche, fehlender Wein war eine Blamage.',
    question: 'Warum beginnt Jesus seine Zeichen ausgerechnet auf einer Hochzeitsfeier – und was sagt das über Gottes Art?',
    crossRef: { ref: 'Jesaja 25,6', note: 'Jesaja sieht Gott auf seinem Berg ein Festmahl für alle Völker bereiten – mit feinsten Speisen und edlem Wein.' },
  },
  'joh-153': {
    background: 'Der See Genezareth hieß auch See Tiberias – nach der Stadt, die Herodes Antipas zu Ehren von Kaiser Tiberius gründete. Hieronymus deutete die 153 als Zahl aller bekannten Fischarten – ein Bild für Menschen aller Art.',
    question: 'Wo begegnet Jesus Menschen heute mitten im Alltag – so wie den Jüngern nach einer erfolglosen Nacht beim Fischen?',
    crossRef: { ref: 'Lukas 5,4-10', note: 'Bei seiner Berufung fängt Petrus nach leerer Nacht schon einmal Unmengen Fische – damals drohen die Netze zu reißen.' },
  },
  'joh-junge': {
    background: 'Die Speisung der Fünftausend ist das einzige Wunder Jesu, das alle vier Evangelien erzählen. Johannes stellt sie in die Nähe des Passafests und lässt die Rede vom Brot des Lebens folgen.',
    question: 'Was könnte es heute heißen, Jesus das Wenige hinzuhalten, das man hat – so wie der Junge seine Brote und Fische?',
    crossRef: { ref: '2. Könige 4,42-44', note: 'Auch Elisa lässt zwanzig Gerstenbrote an hundert Männer verteilen – alle essen, und es bleibt sogar etwas übrig.' },
  },
  'joh-handschriften': {
    background: 'Sie fehlt in den ältesten erhaltenen Abschriften; spätere bringen sie an verschiedenen Stellen, eine Gruppe sogar im Lukasevangelium. Viele Forscher halten sie dennoch für eine sehr alte, wohl echte Jesus-Überlieferung.',
    question: 'Was macht diese Geschichte so wertvoll, dass Christen sie trotz unsicherer Herkunft bewahrt und weitererzählt haben?',
    crossRef: { ref: 'Johannes 3,17', note: 'Gott sandte seinen Sohn nicht, um die Welt zu verurteilen, sondern um sie zu retten – so begegnet Jesus auch der Frau.' },
  },
  'joh-ichbin': {
    background: 'Die Bildworte stehen in Johannes 6,35; 8,12; 10,9; 10,11; 11,25; 14,6 und 15,1. Daneben gibt es das „Ich bin“ ohne Bild: Als Jesus es sogar auf die Zeit vor Abraham bezieht, wollen ihn die Zuhörer steinigen (8,58-59).',
    question: 'Welches der sieben Bilder hilft euch am meisten zu verstehen, wer Jesus ist – und warum gerade dieses?',
    crossRef: { ref: '2. Mose 3,14', note: 'Am Dornbusch stellt sich Gott Mose als „Ich bin“ vor – viele hören dieses Echo in Jesu Ich-bin-Worten mit.' },
  },
  'joh-nikodemus': {
    background: 'Nikodemus war Pharisäer und wohl Mitglied des Hohen Rates. Warum er nachts kam, sagt der Text nicht – vielleicht aus Vorsicht; bei Johannes schwingt aber auch der Gegensatz von Licht und Finsternis mit (3,19-21).',
    question: 'Was hält Menschen heute davon ab, offen mit ihren Fragen zu Jesus zu kommen – und was hilft ihnen dabei?',
    crossRef: { ref: 'Johannes 6,37', note: 'Jesus verspricht, niemanden abzuweisen, der zu ihm kommt – auch Nikodemus wird in der Nacht nicht weggeschickt.' },
  },
  'joh-brunnen': {
    background: 'Im Text steht „die sechste Stunde“, gezählt ab Sonnenaufgang – also gegen zwölf Uhr. Juden und Samaritaner stritten auch um den richtigen Ort der Anbetung: Jerusalem oder der Berg Garizim (4,20).',
    question: 'Warum beginnt Jesus das Gespräch mit einer Bitte statt mit einer Belehrung – und was folgt daraus für Gespräche über den Glauben?',
    crossRef: { ref: 'Johannes 7,37-38', note: 'Am Laubhüttenfest lädt Jesus alle Durstigen zu sich ein und verspricht Glaubenden lebendiges Wasser – wie der Frau am Brunnen.' },
  },
  'joh-speichel': {
    background: 'Speichel galt in der Antike als Heilmittel, auch bei Augenleiden. Brisant war der Tag: Es war Sabbat (9,14), und einen Brei zu kneten zählte nach damaliger Auslegung wohl zur verbotenen Arbeit.',
    question: 'Warum fragen Menschen bei Krankheit und Leid so schnell nach Schuld – und wie antwortet Jesus darauf?',
    crossRef: { ref: 'Lukas 13,4-5', note: 'Auch beim Einsturz des Turms von Siloah bestreitet Jesus, dass die achtzehn Toten schuldiger waren als alle anderen.' },
  },
  'joh-obergewand': {
    background: '„Nackt“ heißt hier wohl: nur leicht bekleidet. Erkannt hat Jesus zuerst der Jünger, den Jesus liebte – doch Petrus, der ihn in der Nacht vor der Kreuzigung dreimal verleugnet hatte, handelt sofort.',
    question: 'Was hilft Menschen nach eigenem Versagen, wieder auf Jesus zuzugehen – so stürmisch wie Petrus hier?',
    crossRef: { ref: 'Matthäus 14,28-31', note: 'Schon einmal wagte sich Petrus aus dem Boot zu Jesus aufs Wasser – als er zu sinken begann, griff Jesus nach ihm.' },
  },
  'joh-haare': {
    background: 'Judas schätzt den Wert auf 300 Denare – etwa ein Jahreslohn eines Tagelöhners; Nardenöl wurde aus dem Himalaya-Gebiet eingeführt. Jesus deutet die Salbung als Vorbereitung auf sein Begräbnis (12,7).',
    question: 'Wie kann Hingabe an Jesus heute aussehen, die – wie bei Maria – nicht zuerst nach dem Nutzen fragt?',
    crossRef: { ref: 'Markus 14,3-9', note: 'Markus erzählt eine ähnliche Salbung in Betanien – und Jesus sagt, überall auf der Welt werde man von dieser Tat erzählen.' },
  },
  'joh-fuesse': {
    background: 'Füße zu waschen galt als niedrigste Arbeit, meist für Sklaven. Jesus tut es kurz vor seinem Tod und sagt: Ich habe euch ein Beispiel gegeben, damit ihr tut, wie ich getan habe (13,15).',
    question: 'Warum fällt es oft schwerer, sich dienen zu lassen, als selbst zu dienen?',
    crossRef: { ref: 'Philipper 2,5-7', note: 'Paulus beschreibt, wie Christus sich selbst erniedrigte und Knechtsgestalt annahm.' },
  },
  'joh-folge': {
    background: 'Kurz zuvor hatte Jesus Petrus angedeutet, dass er einen gewaltsamen Tod sterben wird (21,18-19). Daraus entstand das Gerücht, der andere Jünger werde nicht sterben – Johannes stellt das richtig (21,23).',
    question: 'Wo vergleichen wir unseren Weg mit dem anderer – und was hilft, beim eigenen Ruf zu bleiben?',
    crossRef: { ref: 'Galater 6,4', note: 'Paulus rät: Jeder prüfe sein eigenes Werk, statt sich mit anderen zu vergleichen.' },
  },
  'joh-speise': {
    background: 'Juden und Samaritaner mieden einander, und ein Rabbi sprach öffentlich nicht mit einer fremden Frau – darum wundern sich die Jünger (4,27). Danach kommen viele aus dem Ort, um Jesus zu hören.',
    question: 'Was nährt einen Menschen mehr als Essen – und wie erlebt man das im Alltag?',
    crossRef: { ref: '5. Mose 8,3', note: 'Mose erinnert Israel: Der Mensch lebt nicht vom Brot allein, sondern von allem, was aus Gottes Mund kommt.' },
  },
  'joh-wind': {
    background: 'Nikodemus war ein Lehrer Israels und Mitglied des Hohen Rates. Jesus spricht mit ihm über eine Geburt „von oben“ – das griechische Wort kann auch „von neuem“ heißen, und Nikodemus versteht es wörtlich.',
    question: 'Woran erkennt man das Wirken des Heiligen Geistes, wenn man ihn selbst nicht sieht?',
    crossRef: { ref: 'Apostelgeschichte 2,2', note: 'An Pfingsten kommt der Geist mit einem Brausen vom Himmel, wie von einem gewaltigen Wind.' },
  },
  'joh-weizenkorn': {
    background: 'Anlass ist die Bitte einiger Griechen, Jesus zu sehen (12,20-21). Jesus antwortet mit dem Bild vom Korn: Seine Stunde ist gekommen, und durch seinen Tod wird er alle zu sich ziehen (12,32).',
    question: 'Wo erlebt man, dass Loslassen oder Verzicht neues Leben möglich macht?',
    crossRef: { ref: '1. Korinther 15,36-38', note: 'Paulus erklärt die Auferstehung: Was du säst, wird nicht lebendig, wenn es nicht stirbt – Gott gibt ihm einen neuen Leib.' },
  },
  'joh-gaertner': {
    background: 'Maria kam früh am Morgen, als es noch dunkel war (20,1). Sie sucht den Leichnam und rechnet nicht mit einem Lebenden – darum erkennt sie Jesus nicht, obwohl er vor ihr steht.',
    question: 'Warum erkennen wir Gottes Wirken manchmal nicht, obwohl es direkt vor uns liegt?',
    crossRef: { ref: 'Lukas 24,15-16', note: 'Auch die Emmaus-Jünger gehen neben Jesus her, doch ihre Augen werden gehalten, sodass sie ihn nicht erkennen.' },
  },
  'joh-name': {
    background: '„Rabbuni“ ist eine besonders ehrerbietige, persönliche Form von Rabbi. Maria wird die erste Zeugin der Auferstehung – Jesus schickt sie zu den Jüngern, die er hier „meine Brüder“ nennt (20,17).',
    question: 'Was bedeutet es, dass Gott jeden Menschen persönlich beim Namen kennt?',
    crossRef: { ref: 'Jesaja 43,1', note: 'Gott spricht zu Israel: Fürchte dich nicht, ich habe dich erlöst; ich habe dich bei deinem Namen gerufen.' },
  },
  'joh-vier-tage': {
    background: 'Nach späterer jüdischer Überlieferung blieb die Seele drei Tage beim Leichnam; am vierten Tag galt der Tod als endgültig. Jesus wartet bewusst noch zwei Tage, bevor er aufbricht (11,6).',
    question: 'Wie geht man mit Situationen um, in denen Gott scheinbar zu spät kommt?',
    crossRef: { ref: 'Römer 4,17', note: 'Paulus beschreibt Gott als den, der die Toten lebendig macht und ins Dasein ruft, was nicht ist.' },
  },
  'joh-weinte': {
    background: 'Maria und die Trauergäste klagen laut (11,33). Für Jesus steht ein anderes Wort, das leise Tränen meint. Die Umstehenden sagen: Seht, wie lieb er ihn gehabt hat (11,36).',
    question: 'Was bedeutet es für unsere Trauer, dass Jesus selbst geweint hat?',
    crossRef: { ref: 'Römer 12,15', note: 'Paulus ermutigt: Freut euch mit den Fröhlichen und weint mit den Weinenden.' },
  },
  'joh-sand': {
    background: 'Die Ankläger stellen eine Falle: Spricht Jesus die Frau frei, bricht er das Gesetz des Mose; verurteilt er sie, verliert er seinen Ruf der Barmherzigkeit und gerät mit dem römischen Recht in Konflikt.',
    question: 'Warum fällt es so leicht, über die Fehler anderer zu urteilen – und was hilft dagegen?',
    crossRef: { ref: 'Römer 2,1', note: 'Paulus warnt: Worin du den anderen richtest, verurteilst du dich selbst, weil du dasselbe tust.' },
  },
  'joh-malchus': {
    background: 'Jesus befiehlt Petrus sofort, das Schwert wegzustecken (18,11). Wenig später fragt ausgerechnet ein Verwandter des Malchus Petrus, ob er ihn nicht im Garten gesehen habe (18,26).',
    question: 'Wie reagiert man, wenn man selbst angegriffen wird – und was zeigt uns Jesus dabei?',
    crossRef: { ref: 'Matthäus 26,52', note: 'Jesus sagt Petrus: Stecke dein Schwert weg, denn wer das Schwert nimmt, wird durchs Schwert umkommen.' },
  },
  'joh-thomas': {
    background: 'Thomas ist bei Johannes kein Zweifler von Natur: In 11,16 will er sogar mit Jesus sterben. Nach der Auferstehung will er nur sehen, was die anderen Jünger schon gesehen haben – die Wunden (20,20).',
    question: 'Welchen Platz haben ehrliche Zweifel im Glauben – und wie geht eine Gemeinde gut damit um?',
    crossRef: { ref: 'Judas 1,22', note: 'Judas schreibt: Erbarmt euch derer, die zweifeln.' },
  },
  'apg-eutychus': {
    background: 'Die Gemeinde in Troas traf sich am ersten Tag der Woche zum Brotbrechen – einer der frühesten Hinweise auf christliche Treffen am Sonntag. Der Name Eutychus bedeutet übrigens „Glückskind“.',
    question: 'Was macht diese Nacht in Troas besonders – und was davon würdet ihr euch für eure Gemeindetreffen wünschen?',
    crossRef: { ref: '1. Könige 17,21-22', note: 'Elia streckt sich über den toten Sohn einer Witwe und betet, bis das Kind wieder lebt – Paulus’ Umarmung erinnert daran.' },
  },
  'apg-korb': {
    background: 'Laut Lukas bewachten jüdische Gegner die Tore; Paulus selbst nennt den Statthalter des Nabatäerkönigs Aretas (2. Korinther 11,32). Vielleicht hatte er sich zuvor in Arabien Feinde gemacht (Galater 1,17).',
    question: 'Warum fällt es oft schwer, von Schwäche und Scheitern zu erzählen – und was verändert sich, wenn man es wie Paulus tut?',
    crossRef: { ref: '2. Korinther 12,9', note: 'Der Herr sagt Paulus, seine Gnade genüge, denn seine Kraft wirke gerade in der Schwachheit – darum rühmt sich Paulus seiner Schwächen.' },
  },
  'apg-saulus': {
    background: 'Saul hieß der erste König Israels, der wie Paulus aus dem Stamm Benjamin kam (Philipper 3,5). Der lateinische Name Paulus bedeutet „klein“; ab der Begegnung mit Sergius Paulus auf Zypern nennt Lukas ihn nur noch Paulus.',
    question: 'Wie kann es helfen, in zwei Kulturen zu Hause zu sein, um Menschen von Jesus zu erzählen – damals wie heute?',
    crossRef: { ref: '1. Korinther 9,20-22', note: 'Paulus wird den Juden wie ein Jude und Menschen ohne Gesetz wie einer von ihnen, um möglichst viele zu gewinnen.' },
  },
  'apg-christen': {
    background: 'Antiochia in Syrien war nach Rom und Alexandria wohl die drittgrößte Stadt des Reiches. Den Namen „Christen“ – Christus-Leute – gaben vermutlich Außenstehende; im Neuen Testament steht er nur dreimal.',
    question: 'Was müsste man an einer Gemeinde sehen, damit Außenstehende sie „Christus-Leute“ nennen?',
    crossRef: { ref: 'Johannes 13,35', note: 'Jesus sagt, an ihrer Liebe untereinander werden alle erkennen, dass sie seine Jünger sind.' },
  },
  'apg-lydia': {
    background: 'Lydia stammte aus Thyatira in Kleinasien, wo Inschriften eine Färbergilde belegen; echter Purpur war ein Luxusgut. Als „Gottesfürchtige“ verehrte sie den Gott Israels, war aber wohl keine Jüdin.',
    question: 'Wie können Beruf, Besitz und Gastfreundschaft dem Glauben dienen – so wie bei der Geschäftsfrau Lydia?',
    crossRef: { ref: 'Philipper 4,15-16', note: 'Paulus erinnert daran, dass anfangs nur die Gemeinde in Philippi ihn finanziell unterstützte – sogar bis nach Thessalonich.' },
  },
  'apg-schatten': {
    background: 'Die Gemeinde traf sich in der Halle Salomos, einem Säulengang am Tempelplatz. Auffällig: Lukas sagt nicht ausdrücklich, dass der Schatten heilte – nur, dass alle gesund wurden (5,16).',
    question: 'Was bewegt Menschen, ihre Kranken auf die Straße zu tragen – und wie kann eine Gemeinde heute Kranken nahe sein?',
    crossRef: { ref: 'Markus 6,56', note: 'Schon bei Jesus legte man Kranke auf die Marktplätze, damit sie wenigstens den Saum seines Gewandes berühren konnten.' },
  },
  'apg-landkarte': {
    background: 'Das griechische Wort für Zeugen, „martyres“, gab später den Märtyrern ihren Namen. Dass Samarien dazugehört, war nach der alten Feindschaft bemerkenswert; das Buch endet in Rom, der Hauptstadt des Reiches.',
    question: 'Was wäre heute euer „Jerusalem“, euer „Samarien“ und euer „Ende der Erde“?',
    crossRef: { ref: 'Jesaja 49,6', note: 'Gott macht seinen Knecht zum Licht für die Völker, damit sein Heil bis ans Ende der Erde reicht – aufgegriffen in Apostelgeschichte 13,47.' },
  },
  'apg-rhode': {
    background: 'Kurz zuvor hatte König Herodes Agrippa I. Jakobus, den Bruder des Johannes, hinrichten lassen (12,2). Die Beter trafen sich im Haus der Maria, der Mutter des Markus; „Rhode“ bedeutet „Rose“.',
    question: 'Warum fällt es manchmal schwer zu glauben, dass Gott ein Gebet erhört – und was ist an dieser Geschichte tröstlich?',
    crossRef: { ref: 'Lukas 24,41', note: 'Vor lauter Freude können die Jünger nicht glauben, dass der Auferstandene vor ihnen steht – ähnlich fassungslos wie die Beter bei Petrus.' },
  },
  'apg-zeltmacher': {
    background: 'Aquila und Priszilla waren aus Rom gekommen, weil Kaiser Claudius die Juden ausgewiesen hatte, wohl um 49 n. Chr. Das griechische Wort für Zeltmacher meint vielleicht auch allgemein Lederarbeiter.',
    question: 'Was bedeutet es für den Wert ganz normaler Arbeit, dass Paulus neben seiner Mission Zelte herstellte?',
    crossRef: { ref: 'Kolosser 3,23', note: 'Paulus ermutigt, jede Arbeit von Herzen zu tun – als Dienst für den Herrn und nicht nur für Menschen.' },
  },
  'apg-los': {
    background: 'Losen war in Israel vertraut, etwa bei der Landverteilung (Josua 18,10) oder beim Tempeldienst des Zacharias (Lukas 1,9). Infrage kam nur, wer Jesus von der Johannestaufe bis zur Himmelfahrt begleitet hatte (1,21-22).',
    question: 'Was hilft einer Gemeinde heute, wichtige Entscheidungen gemeinsam und im Vertrauen auf Gott zu treffen?',
    crossRef: { ref: 'Sprüche 16,33', note: 'Man wirft das Los, doch die Entscheidung kommt vom Herrn – so verstand Israel das Losen.' },
  },
  'apg-tuecher': {
    background: 'Ephesus war in der Antike berühmt für Magie und Zauberformeln. Die Tücher und Schürzen stammten vermutlich aus Paulus’ Handwerksarbeit; bald darauf verbrennen Bekehrte Zauberbücher im Wert von 50.000 Silbermünzen (19,19).',
    question: 'Was unterscheidet echtes Gottvertrauen von dem Versuch, Gott mit bestimmten Worten oder Dingen zu steuern?',
    crossRef: { ref: 'Matthäus 7,21-23', note: 'Jesus warnt: Nicht jeder, der in seinem Namen Wunder tut, gehört zu ihm – entscheidend ist, Gottes Willen zu tun.' },
  },
  'apg-tabita': {
    background: 'Tabita ist aramäisch, Dorkas der griechische Name – beide bedeuten Gazelle; sie lebte in der Hafenstadt Joppe, heute Jaffa. Witwen hatten oft keinen Versorger, deshalb kümmerte sich die Gemeinde besonders um sie (6,1).',
    question: 'Warum hinterlässt gerade praktische Hilfe wie Tabitas Nähen so tiefe Spuren – und wo begegnet ihr solchen Menschen heute?',
    crossRef: { ref: 'Markus 5,40-42', note: 'Jesus schickt alle hinaus und weckt die Tochter des Jaïrus mit „Talita kum“ – Petrus handelt bei Tabita fast genauso.' },
  },
  'apg-unbekannt': {
    background: 'Auch der antike Reiseschriftsteller Pausanias erwähnt Altäre „unbekannter Götter“ bei Athen. Auf Paulus’ Rede reagierten die Zuhörer gemischt: Manche spotteten, andere wollten mehr hören, einige glaubten (17,32-34).',
    question: 'Wo gibt es heute „Altäre für den unbekannten Gott“ – Sehnsüchte, an die man im Gespräch über Gott anknüpfen kann?',
    crossRef: { ref: '1. Petrus 3,15-16', note: 'Petrus ermutigt, jederzeit Auskunft über die eigene Hoffnung zu geben, wenn jemand fragt – mit Sanftmut und Achtung.' },
  },
  'apg-betrunken': {
    background: 'Pfingsten war das jüdische Wochenfest, 50 Tage nach dem Passa – der Name kommt vom griechischen Wort für „der Fünfzigste“. Deshalb waren besonders viele Juden aus aller Welt in Jerusalem (2,5-11).',
    question: 'Was lässt sich von Petrus lernen, der auf Spott mit Humor und einer klaren Erklärung antwortet?',
    crossRef: { ref: '1. Samuel 1,13-15', note: 'Auch Hanna wird für betrunken gehalten: Eli sieht sie still beten, doch sie schüttet ihr Herz vor Gott aus.' },
  },
  'apg-loblieder': {
    background: 'Verhaftet wurden sie, weil Paulus eine Magd von einem Wahrsagegeist befreit hatte und ihre Besitzer Einnahmen verloren. Als römische Bürger hätten sie nicht ohne Urteil geschlagen werden dürfen (16,37).',
    question: 'Wie kann Gotteslob in schweren Zeiten aussehen, ohne Schmerz und Not zu überspielen?',
    crossRef: { ref: 'Habakuk 3,17-18', note: 'Habakuk will sich an Gott freuen, auch wenn Feigenbaum, Weinstock und Felder nichts tragen und die Ställe leer sind.' },
  },
  'apg-beroea': {
    background: 'Paulus musste nachts aus Thessalonich fliehen und kam nach Beröa (17,10). Dort lasen die Juden die Schriftrollen der Synagoge – das Neue Testament gab es noch nicht. Viele kamen zum Glauben.',
    question: 'Wie kann man offen für Neues sein und trotzdem alles prüfen?',
    crossRef: { ref: '1. Thessalonicher 5,21', note: 'Paulus rät der Gemeinde in Thessalonich: Prüft alles und das Gute behaltet.' },
  },
  'apg-barnabas': {
    background: 'Barnabas war Levit und stammte aus Zypern. Er verkaufte einen Acker und legte den Erlös den Aposteln zu Füßen (4,37) – ein Vorbild für das Teilen in der ersten Gemeinde.',
    question: 'Was macht einen Menschen zu einem echten Ermutiger – und wie kann man das lernen?',
    crossRef: { ref: 'Hebräer 10,24', note: 'Der Hebräerbrief ruft dazu auf, aufeinander zu achten und einander zur Liebe und zu guten Werken anzuspornen.' },
  },
  'roem-tertius': {
    background: 'Tertius ist lateinisch und heißt „der Dritte“ – im nächsten Vers grüßt passenderweise ein Quartus, „der Vierte“. Entstanden ist der Brief wahrscheinlich in Korinth (vgl. 16,23).',
    question: 'Wer arbeitet in eurer Gemeinde im Hintergrund – und wie könnte man diesen Menschen einmal sichtbar danken?',
    crossRef: { ref: 'Jeremia 36,4', note: 'Auch Jeremia diktierte: Sein Schreiber Baruch schrieb alle Worte, die Gott zum Propheten geredet hatte, auf eine Buchrolle.' },
  },
  'roem-spanien': {
    background: 'Spanien galt als westlicher Rand der bekannten Welt. Zuvor wollte Paulus noch die Kollekte nach Jerusalem bringen (15,25-26) – dort wurde er verhaftet, und ob er Spanien je erreichte, ist offen.',
    question: 'Wie geht ihr damit um, wenn gute Pläne – auch solche für Gott – ganz anders laufen als gedacht?',
    crossRef: { ref: 'Apostelgeschichte 28,30-31', note: 'Die Apostelgeschichte endet mit Paulus in Rom: Zwei Jahre empfängt er Besucher und verkündigt ungehindert – von Spanien ist keine Rede.' },
  },
  'roem-phoebe': {
    background: 'Kenchreä war der östliche Hafen von Korinth. Vermutlich überbrachte Phöbe den Brief nach Rom; Paulus nennt sie „diakonos“ – Dienerin oder Diakonin – und eine Förderin vieler, auch seiner selbst.',
    question: 'Welche Frauen haben euren Glauben geprägt – und was habt ihr von ihnen mitgenommen?',
    crossRef: { ref: 'Lukas 8,1-3', note: 'Mit Jesus zogen auch Frauen wie Maria aus Magdala, Johanna und Susanna, die ihn und die Jünger aus eigenem Besitz versorgten.' },
  },
  'roem-kohlen': {
    background: 'Unmittelbar davor überlässt Paulus die Vergeltung ausdrücklich Gott (12,19). Der Hintergrund des Bildes ist unsicher; manche denken an einen ägyptischen Bußbrauch, bei dem Reuige ein Becken mit Glut auf dem Kopf trugen.',
    question: 'Wie sieht „Böses mit Gutem überwinden“ im Alltag konkret aus – und was macht es oft so schwer?',
    crossRef: { ref: '2. Könige 6,21-23', note: 'Elisa rät dem König, gefangene Feinde zu bewirten statt zu töten – danach kommen keine aramäischen Streiftrupps mehr ins Land.' },
  },
  'roem-kuss': {
    background: 'In der Antike küssten sich zur Begrüßung vor allem Verwandte und enge Freunde. Als „Friedenskuss“ wurde der Gruß später Teil des Gottesdienstes – Justin der Märtyrer beschreibt ihn schon um 150 n. Chr.',
    question: 'Wie kann man in der Gemeinde Herzlichkeit zeigen, ohne jemandem zu nahe zu treten?',
    crossRef: { ref: 'Apostelgeschichte 20,36-38', note: 'Beim Abschied in Milet beten die Ältesten aus Ephesus mit Paulus, umarmen ihn unter Tränen und küssen ihn.' },
  },
  '1kor-chloe': {
    background: 'Chloë wird nur hier erwähnt. Ihre „Leute“ waren vermutlich Angehörige oder Bedienstete ihres Hauses, die Paulus in Ephesus aufsuchten – dort schrieb er den Brief (16,8).',
    question: 'Was unterscheidet ehrliches Ansprechen von Lästern – und wie gelingt das in einer Gemeinde?',
    crossRef: { ref: 'Matthäus 18,15', note: 'Jesus rät, jemanden, der an einem schuldig geworden ist, zuerst unter vier Augen anzusprechen – um ihn zurückzugewinnen.' },
  },
  '1kor-parteien': {
    background: 'Apollos, ein redegewandter Jude aus Alexandria, wirkte nach Paulus in Korinth (Apg 18,24-19,1). Kephas ist der aramäische Beiname des Petrus und bedeutet „Fels“.',
    question: 'Wie kann man Vorbilder im Glauben schätzen, ohne dass ein Fanclub daraus wird?',
    crossRef: { ref: '1. Korinther 3,5-7', note: 'Paulus nennt sich und Apollos nur Diener: Einer pflanzt, der andere gießt – wachsen lässt allein Gott.' },
  },
  '1kor-500': {
    background: 'Paulus schrieb Mitte der 50er-Jahre und gibt in 15,3-5 eine noch ältere Bekenntnisformel weiter, die er selbst empfangen hatte – vermutlich eines der frühesten Zeugnisse des Osterglaubens.',
    question: 'Warum war es Paulus wichtig, Zeugen zu nennen – und was macht ein Glaubenszeugnis heute glaubwürdig?',
    crossRef: { ref: 'Johannes 20,24-29', note: 'Thomas will erst glauben, wenn er Jesu Wunden sieht und berührt; Jesus begegnet ihm und nennt alle selig, die glauben, ohne zu sehen.' },
  },
  '1kor-ochse': {
    background: 'Beim Dreschen liefen Rinder über das ausgebreitete Getreide oder zogen einen Dreschschlitten darüber. Ohne Maulkorb konnten sie dabei fressen – das Gesetz schützte so auch die Tiere.',
    question: 'Wie kann eine Gemeinde gut für die sorgen, die für sie arbeiten – ob angestellt oder ehrenamtlich?',
    crossRef: { ref: 'Apostelgeschichte 18,1-4', note: 'In Korinth wohnt Paulus bei Aquila und Priszilla, arbeitet mit ihnen als Zeltmacher und lehrt jeden Sabbat in der Synagoge.' },
  },
  '1kor-hohelied': {
    background: 'Heute hört man das Kapitel oft bei Hochzeiten. In Korinth aber wurden manche Gaben offenbar höher geschätzt als andere; Paulus antwortet mit dem Bild vom Leib, der jedes Glied braucht (12,12-27).',
    question: 'Was ändert sich, wenn man 1. Korinther 13 nicht als Hochzeitstext liest, sondern als Brief an eine zerstrittene Gemeinde?',
    crossRef: { ref: '1. Petrus 4,8-10', note: 'Petrus verbindet beides: Vor allem sollen Christen einander lieben und jede empfangene Gabe zum Dienst aneinander einsetzen.' },
  },
  '2kor-pfahl': {
    background: 'Der Pfahl kam nach außergewöhnlichen Offenbarungen, damit Paulus nicht überheblich würde (12,1-7). Gedeutet wurde er unter anderem als Krankheit, Anfeindung oder innere Anfechtung.',
    question: 'Wie kann man Gott weiter vertrauen, wenn ein Gebet anders beantwortet wird als erhofft?',
    crossRef: { ref: 'Matthäus 26,39-44', note: 'Auch Jesus bittet in Gethsemane dreimal, der Kelch möge an ihm vorübergehen – und stellt sich doch unter Gottes Willen.' },
  },
  '2kor-see': {
    background: 'Paulus schrieb diese Liste Jahre vor seinem bekanntesten Schiffbruch vor Malta (Apg 27). Die drei Schiffbrüche, die er hier nennt, erwähnt die Apostelgeschichte gar nicht.',
    question: 'Was hilft Menschen, in schweren Zeiten durchzuhalten – und wie kann eine Gemeinde sie dabei tragen?',
    crossRef: { ref: 'Apostelgeschichte 14,19-20', note: 'In Lystra wird Paulus gesteinigt und für tot gehalten; als die Jünger ihn umringen, steht er auf und geht zurück in die Stadt.' },
  },
  '2kor-schatz': {
    background: 'Ton war billig und zerbrechlich, doch man verwahrte darin oft Wertvolles – auch Schriftrollen vom Toten Meer wurden in Tonkrügen gefunden. Der Schatz ist das Licht der Erkenntnis Gottes, von dem 4,6 spricht.',
    question: 'Wie verändert es den Blick auf eigene Schwächen, dass Gott gerade durch zerbrechliche Menschen wirkt?',
    crossRef: { ref: 'Richter 7,16-20', note: 'Gideons 300 Männer tragen Fackeln in leeren Krügen; erst als sie die Krüge zerschlagen, leuchtet das Licht hervor.' },
  },
  '2kor-geber': {
    background: 'Für „fröhlich“ steht im Griechischen hilaros – daher das englische „hilarious“. Die Wendung erinnert an die griechische Fassung von Sprüche 22,8, wo Gott einen fröhlichen, freigebigen Menschen segnet.',
    question: 'Was macht Geben fröhlich statt zur Pflicht – beim Geld, aber auch bei Zeit und Kraft?',
    crossRef: { ref: '2. Korinther 8,1-5', note: 'Die armen Gemeinden Mazedoniens geben freiwillig und voller Freude, sogar über ihre Kräfte – zuerst schenken sie sich selbst dem Herrn.' },
  },
  'gal-petrus': {
    background: 'In Antiochia, einer der größten Städte des Reiches, entstand früh eine Gemeinde aus Juden und Nichtjuden; dort hießen die Jünger erstmals „Christen“ (Apg 11,26). Sogar Barnabas ließ sich mitreißen (2,13).',
    question: 'Wie kann man offen widersprechen und trotzdem respektvoll bleiben – gerade in Glaubensfragen?',
    crossRef: { ref: 'Apostelgeschichte 10,28', note: 'Im Haus des römischen Hauptmanns Kornelius erklärt Petrus, Gott habe ihm gezeigt, keinen Menschen unrein zu nennen.' },
  },
  'gal-buchstaben': {
    background: 'Briefe wurden in der Antike häufig diktiert; oft schrieb der Absender nur den Schluss selbst. Im Galaterbrief fehlt zudem der sonst übliche Dank am Anfang – Paulus kommt sofort zur Sache (1,6).',
    question: 'Wie zeigt man heute, dass einem etwas wirklich ernst ist – in Beziehungen, aber auch im Glauben?',
    crossRef: { ref: 'Philemon 1,18-19', note: 'Auch im Philemonbrief greift Paulus selbst zur Feder – als Bürgschaft: Falls Onesimus etwas schuldet, will er selbst dafür aufkommen.' },
  },
  'gal-frucht': {
    background: 'Direkt davor zählt Paulus die „Werke des Fleisches“ auf (5,19-21). Den letzten Begriff der Frucht, griechisch enkrateia, übersetzt Luther mit „Keuschheit“ – gemeint ist Selbstbeherrschung.',
    question: 'Woran merkt man im Alltag, dass die Frucht des Geistes in einem Menschen wächst?',
    crossRef: { ref: 'Johannes 15,4-5', note: 'Jesus vergleicht sich mit dem Weinstock: Die Reben bringen nur Frucht, wenn sie mit ihm verbunden bleiben.' },
  },
  'gal-430': {
    background: 'Die Zahl stammt aus 2. Mose 12,40. Paulus rechnet wohl wie die griechische Übersetzung des Alten Testaments, die dort die Zeit in Kanaan und Ägypten zusammenzählt.',
    question: 'Was verändert sich im Glauben, wenn Gottes Zusage am Anfang steht – und nicht die eigene Leistung?',
    crossRef: { ref: '1. Mose 15,5-6', note: 'Gott zeigt Abram die Sterne als Bild für seine Nachkommen; Abram glaubt, und Gott rechnet ihm das als Gerechtigkeit an.' },
  },
  'eph-schwert': {
    background: 'Das Bild knüpft an Jesaja an: Dort legt Gott selbst Gerechtigkeit wie einen Panzer an und setzt den Helm des Heils auf (Jesaja 59,17). Paulus schrieb als Gefangener in Ketten (6,20).',
    question: 'Wie kann Gottes Wort in schweren Momenten Halt geben, ohne dass man Bibelverse als Waffe gegen andere benutzt?',
    crossRef: { ref: 'Matthäus 4,1-11', note: 'In der Wüste antwortet Jesus auf jede Versuchung des Teufels mit einem Wort aus der Schrift.' },
  },
  'eph-tychikus': {
    background: 'Tychikus stammte aus der Provinz Asia, zu der Ephesus gehörte, und war schon früher mit Paulus unterwegs (Apg 20,4). Im Neuen Testament wird er insgesamt fünfmal erwähnt.',
    question: 'Wem könntet ihr ein „Tychikus“ sein – jemand, der Verbindung hält, Neuigkeiten teilt und Mut macht?',
    crossRef: { ref: '2. Timotheus 4,12', note: 'Paulus schreibt, er habe Tychikus nach Ephesus gesandt – wieder ist er der verlässliche Bote.' },
  },
  'eph-adresse': {
    background: 'Die Worte fehlen im ältesten erhaltenen Papyrus des Briefs (um 200 n. Chr.) und ursprünglich in zwei großen Handschriften des 4. Jahrhunderts. Zudem fehlen persönliche Grüße, obwohl Paulus lange in Ephesus wirkte.',
    question: 'Was im Epheserbrief könnte auch eurer Gemeinde heute gelten – so, als wäre er direkt an euch adressiert?',
    crossRef: { ref: 'Kolosser 4,16', note: 'Paulus lässt Briefe in mehreren Gemeinden vorlesen und erwähnt einen Brief aus Laodizea – manche vermuten darin den Epheserbrief.' },
  },
  'eph-sonne': {
    background: 'Die Mahnung, im Zorn nicht zu sündigen, stammt aus Psalm 4,5. Wenige Verse später ruft Paulus dazu auf, Bitterkeit abzulegen und einander zu vergeben, wie Gott in Christus vergeben hat (4,31-32).',
    question: 'Was hilft, Ärger anzusprechen, bevor er sich festsetzt – zu Hause, in der Schule oder im Job?',
    crossRef: { ref: 'Jakobus 1,19-20', note: 'Jakobus rät, schnell zum Hören, aber langsam zum Reden und zum Zorn zu sein, denn menschlicher Zorn schafft keine Gerechtigkeit vor Gott.' },
  },
  'phil-evodia': {
    background: 'Die Gemeinde in Philippi begann am Fluss mit betenden Frauen, darunter die Purpurhändlerin Lydia (Apg 16,13-15). Paulus bittet zudem einen vertrauten Mitarbeiter, den beiden beizustehen (4,3).',
    question: 'Was braucht es, damit Menschen nach einem Streit wieder gut zusammenarbeiten können – in der Gemeinde und anderswo?',
    crossRef: { ref: 'Matthäus 5,23-24', note: 'Jesus lehrt: Wer opfern will und merkt, dass ein anderer etwas gegen ihn hat, soll sich zuerst mit ihm versöhnen.' },
  },
  'phil-epaphroditus': {
    background: 'Die Philipper unterstützten Paulus immer wieder (4,15-16); Epaphroditus war ihr Gesandter – griechisch apostolos (2,25). Sein Name leitet sich von der Göttin Aphrodite ab und war damals verbreitet.',
    question: 'Wie kann eine Gemeinde für Menschen da sein, die sich für andere einsetzen und dabei an ihre Grenzen kommen?',
    crossRef: { ref: 'Matthäus 25,35-40', note: 'Jesus sagt: Wer Hungrige versorgt, Kranke besucht und zu Gefangenen kommt, hat es ihm selbst getan.' },
  },
  'phil-buergerrecht': {
    background: 'Schon in 1,27 nutzt Paulus ein verwandtes Wort: Lebt als Bürger so, wie es dem Evangelium entspricht. Ausgerechnet in Philippi hatte er sich selbst auf sein römisches Bürgerrecht berufen (Apostelgeschichte 16,37).',
    question: 'Wie lebt man als Bürger des Himmels mitten in dieser Welt – ohne sich aus ihr zurückzuziehen?',
    crossRef: { ref: 'Epheser 2,19', note: 'Paulus schreibt Nichtjuden: Ihr seid keine Fremden mehr, sondern habt Bürgerrecht in Gottes Volk und gehört zu seinem Haus.' },
  },
  'phil-vermag': {
    background: 'Paulus schreibt aus der Haft (1,13) und dankt für eine Gabe aus Philippi (4,10-18). Das Wort für „zufrieden“ war ein Lieblingsbegriff griechischer Philosophen – doch Paulus findet die Kraft nicht in sich, sondern in Christus.',
    question: 'Warum kann Überfluss den Glauben genauso herausfordern wie Mangel – und was hilft, in beidem zufrieden zu bleiben?',
    crossRef: { ref: 'Sprüche 30,8-9', note: 'Agur bittet Gott, ihm weder Armut noch Reichtum zu geben – denn Sattheit wie Not können von Gott wegführen.' },
  },
  'kol-laodizea': {
    background: 'Kolossä, Laodizea und Hierapolis lagen nah beieinander im Lykostal in der heutigen Türkei. Paulus kannte diese Gemeinden wohl nicht persönlich (2,1); Epaphras hatte sich um alle drei gekümmert (1,7; 4,13).',
    question: 'Was verändert sich, wenn man die Briefe der Bibel als Post an echte Gemeinden mit echten Fragen liest?',
    crossRef: { ref: 'Offenbarung 3,14-16', note: 'In der Offenbarung richtet Christus eine eigene Botschaft an Laodizea und tadelt die Gemeinde: weder kalt noch warm, sondern lau.' },
  },
  'kol-arzt': {
    background: 'Lukas wird im Neuen Testament nur dreimal namentlich erwähnt (auch 2. Timotheus 4,11; Philemon 24). Weil Paulus ihn nicht zu seinen jüdischen Mitarbeitern zählt (4,10-11), war er vermutlich kein Jude.',
    question: 'Welche leicht übersehenen Fähigkeiten aus Beruf und Alltag bringen Menschen in eine Gemeinde ein?',
    crossRef: { ref: 'Apostelgeschichte 16,10', note: 'Hier erzählt die Apostelgeschichte plötzlich in der Wir-Form – nach alter Überlieferung, weil Lukas als Verfasser selbst mitreiste.' },
  },
  'kol-onesimus': {
    background: 'Tychikus stammte aus der Provinz Asia (Apostelgeschichte 20,4). Den Sklaven Onesimus (Philemon 16) stellt Paulus ohne Hinweis auf seinen Stand vor: als „treuen und geliebten Bruder“, der einer von ihnen ist.',
    question: 'Wie verändert sich das Miteinander, wenn Menschen in der Gemeinde zuerst Geschwister sind – unabhängig von Stand oder Herkunft?',
    crossRef: { ref: 'Kolosser 3,11', note: 'Im selben Brief: In Christus zählen Herkunft und Stand nicht mehr – ob Sklave oder Freier, Christus ist alles und in allen.' },
  },
  '1thess-sabbate': {
    background: 'Thessalonich war Hauptstadt der römischen Provinz Makedonien und lag an der Via Egnatia, einer wichtigen Fernstraße. Gegner warfen den Missionaren vor, sie brächten den ganzen Erdkreis in Aufruhr (Apostelgeschichte 17,6).',
    question: 'Was brauchen Menschen, die neu im Glauben sind, wenn ihre Begleiter nicht lange bleiben können?',
    crossRef: { ref: '1. Thessalonicher 3,1-6', note: 'Paulus hielt die Sorge nicht mehr aus und schickte Timotheus zur Stärkung – der brachte gute Nachricht von ihrem Glauben und ihrer Liebe.' },
  },
  '1thess-eltern': {
    background: 'Wandernde Redner und Philosophen standen damals oft im Verdacht, auf Geld und Ansehen aus zu sein. Paulus grenzt sich bewusst davon ab: keine Schmeichelei, keine versteckte Habgier, keine Ehrsucht (2,3-6).',
    question: 'Wie sieht es heute aus, Menschen im Glauben so zu begleiten wie eine liebevolle Mutter oder ein ermutigender Vater?',
    crossRef: { ref: 'Jesaja 66,13', note: 'Gott selbst verspricht seinem Volk, es zu trösten, wie eine Mutter ihr Kind tröstet.' },
  },
  '1thess-haende': {
    background: 'In der griechisch-römischen Oberschicht galt Handarbeit als wenig ehrenhaft. Paulus aber arbeitete als Zeltmacher (Apostelgeschichte 18,3) und verdiente auch in Thessalonich seinen Unterhalt mit eigener Arbeit (2,9).',
    question: 'Wie kann gewöhnliche Arbeit – im Beruf, in der Schule oder zu Hause – ein Ausdruck von Glauben sein?',
    crossRef: { ref: 'Epheser 4,28', note: 'Wer früher gestohlen hat, soll mit eigenen Händen ehrlich arbeiten – damit er auch Bedürftigen etwas abgeben kann.' },
  },
  '1thess-beten': {
    background: 'Fromme Juden beteten zu festen Zeiten, etwa dreimal am Tag (vgl. Daniel 6,11). Paulus schreibt, dass er selbst unablässig an die Gemeinde denkt und Gott für sie dankt (1,2-3; 2,13).',
    question: 'Was kann helfen, mitten in einem vollen Alltag mit Gott im Gespräch zu bleiben?',
    crossRef: { ref: 'Lukas 18,1-8', note: 'Jesus erzählt von einer hartnäckigen Witwe, um zu zeigen: Man soll immer beten und nicht aufgeben.' },
  },
  '2thess-essen': {
    background: 'Die frühen Gemeinden versorgten Bedürftige (vgl. Apostelgeschichte 2,44-45) – das ließ sich auch ausnutzen. Paulus spielt im Griechischen mit Worten: Sie arbeiten nicht, sondern treiben sich geschäftig herum (3,11).',
    question: 'Wie kann eine Gemeinde großzügig helfen und zugleich Menschen ermutigen, selbst Verantwortung zu tragen?',
    crossRef: { ref: 'Galater 6,2-5', note: 'Paulus hält beides zusammen: Helft einander, Lasten zu tragen – und doch hat jeder seine eigene Last zu tragen.' },
  },
  '2thess-gruss': {
    background: 'Paulus diktierte seine Briefe wohl meist einem Schreiber – in Römer 16,22 grüßt dieser, Tertius, sogar selbst. Den Schlussgruß eigenhändig zu schreiben, war in der Antike üblich (vgl. 1. Korinther 16,21).',
    question: 'Woran kann man heute erkennen, ob eine Botschaft, die sich auf Gott oder die Bibel beruft, vertrauenswürdig ist?',
    crossRef: { ref: '1. Thessalonicher 5,21', note: 'Schon im ersten Brief rät Paulus derselben Gemeinde, alles zu prüfen und das Gute festzuhalten.' },
  },
  '2thess-tag': {
    background: '„Tag des Herrn“ ist ein Begriff der Propheten (etwa Amos 5,18; Joel 2,1) für Gottes richtendes Eingreifen. Die Gemeinde litt unter Verfolgung (1,4); vermutlich war sie deshalb für solche Parolen besonders anfällig.',
    question: 'Wie kann man mit beunruhigenden Endzeit-Botschaften umgehen, ohne ängstlich oder gleichgültig zu werden?',
    crossRef: { ref: 'Markus 13,7', note: 'Jesus mahnt mit demselben griechischen Wort wie Paulus: Erschreckt nicht, wenn ihr von Kriegen hört – das ist noch nicht das Ende.' },
  },
  '1tim-lystra': {
    background: 'In Lystra hielt man Paulus und Barnabas zuerst für die Götter Hermes und Zeus – dann wurde Paulus dort gesteinigt (Apostelgeschichte 14,8-19). Timotheus hat das wohl miterlebt (2. Timotheus 3,10-11).',
    question: 'Was können Menschen, die zwischen zwei Kulturen aufgewachsen sind, in eine Gemeinde einbringen?',
    crossRef: { ref: '1. Korinther 9,19-22', note: 'Paulus wird den Juden wie ein Jude und den anderen wie einer von ihnen – allen alles, um möglichst viele zu gewinnen.' },
  },
  '1tim-wein': {
    background: 'Dass Timotheus nur Wasser trank, war wohl bewusster Verzicht. In Ephesus forderten manche Lehrer strenge Enthaltsamkeit (4,3) – Paulus hält dagegen: Alles, was Gott geschaffen hat, ist gut (4,4).',
    question: 'Wie gehören Gottvertrauen und vernünftige Sorge für die eigene Gesundheit zusammen?',
    crossRef: { ref: 'Lukas 10,34', note: 'Der barmherzige Samariter versorgt die Wunden des Überfallenen mit Öl und Wein – damals übliche Heilmittel.' },
  },
  '1tim-jugend': {
    background: '„Jung“ konnte man damals bis etwa 40 genannt werden. Timotheus sollte in Ephesus auch Ältere leiten – Paulus rät ihm, sie mit Achtung wie Väter und Mütter zu ermahnen (5,1-2).',
    question: 'Wie können Jüngere und Ältere in einer Gemeinde voneinander lernen und einander ernst nehmen?',
    crossRef: { ref: 'Jeremia 1,6-8', note: 'Jeremia wendet ein, er sei zu jung – doch Gott sendet ihn trotzdem und verspricht, bei ihm zu sein.' },
  },
  '1tim-geld': {
    background: 'Ähnliche Sprüche kannten auch griechische Philosophen. Paulus richtet sich gegen Lehrer, die Frömmigkeit als Geschäft sahen (6,5), und rät Reichen, freigebig zu sein (6,17-18).',
    question: 'Woran merkt man, ob man Geld nutzt – oder ob das Geld anfängt, einen selbst zu bestimmen?',
    crossRef: { ref: 'Matthäus 6,24', note: 'Jesus sagt: Niemand kann zwei Herren dienen – man kann nicht zugleich Gott und dem Mammon, also dem Geld, dienen.' },
  },
  '2tim-mantel': {
    background: 'Paulus ist in Rom in Haft (1,16-17) und rechnet mit seinem Tod (4,6); Timotheus soll vor dem Winter kommen (4,21) – danach ruhte die Seefahrt weitgehend. Mit den Pergamenten waren vermutlich Schriftrollen oder Notizen gemeint.',
    question: 'Wie wirkt Paulus auf euch, wenn er aus der Haft um einen warmen Mantel und um Bücher bittet?',
    crossRef: { ref: 'Hebräer 13,3', note: 'Christen sollen an Gefangene denken, als wären sie selbst mit ihnen gefangen – und an die, die misshandelt werden.' },
  },
  '2tim-familie': {
    background: 'Timotheus kannte die heiligen Schriften – also das Alte Testament – schon von Kind auf (3,15). Da sein Vater Grieche war (Apostelgeschichte 16,1), lernte er sie wohl vor allem von Mutter und Großmutter.',
    question: 'Wie kann Glaube an die nächste Generation weitergegeben werden – in Familien und in der Gemeinde?',
    crossRef: { ref: '5. Mose 6,6-7', note: 'Israel soll Gottes Worte im Herzen tragen, sie den Kindern einprägen und davon reden – zu Hause, unterwegs, beim Hinlegen und Aufstehen.' },
  },
  '2tim-bilder': {
    background: 'Bei den Olympischen Spielen schworen Athleten, zehn Monate nach den Vorschriften trainiert zu haben. Paulus erklärt seine Bilder nicht ausführlich, sondern lädt Timotheus ein, selbst nachzudenken (2,7).',
    question: 'Welches der drei Bilder – Soldat, Sportler oder Bauer – passt für euch am besten zum Glauben im Alltag, und warum?',
    crossRef: { ref: 'Jakobus 5,7-8', note: 'Wie ein Bauer geduldig auf Früh- und Spätregen wartet, sollen auch Christen geduldig sein und ihr Herz stärken.' },
  },
  '2tim-demas': {
    background: 'Demas war früher Mitarbeiter des Paulus und grüßte zusammen mit Lukas (Kolosser 4,14; Philemon 24). Was „diese Welt lieb gewinnen“ genau meint, sagt der Text nicht – nur, dass er nach Thessalonich ging.',
    question: 'Wie können Gemeinden Menschen begegnen, die sich zurückgezogen haben – ohne sie abzuschreiben?',
    crossRef: { ref: 'Apostelgeschichte 15,37-39', note: 'Wegen Markus trennten sich Paulus und Barnabas einst im Streit – umso bemerkenswerter, dass Paulus ihn später wieder schätzt.' },
  },
  'tit-kreta': {
    background: 'Schon Homer nannte Kreta die Insel der hundert Städte – Titus sollte „in jeder Stadt“ Älteste einsetzen. Eine Mission dort erwähnt die Apostelgeschichte nicht; Paulus kommt nur als Gefangener vorbei (27,7-13).',
    question: 'Was macht gute Leitung in einer Gemeinde aus – damals auf Kreta und heute?',
    crossRef: { ref: '1. Petrus 5,2-3', note: 'Älteste sollen die Herde Gottes freiwillig und uneigennützig hüten – nicht als Herrscher, sondern als Vorbilder.' },
  },
  'tit-zitat': {
    background: 'Nach alter Überlieferung stammt der Vers von Epimenides aus Knossos (um 600 v. Chr.), der als Seher galt. In der Logik ist der Satz als Epimenides-Paradox bekannt: Ein Kreter sagt, alle Kreter lügen.',
    question: 'Wie kann man klare Worte finden, wenn etwas falsch läuft, ohne ganze Gruppen abzustempeln?',
    crossRef: { ref: 'Apostelgeschichte 2,11', note: 'An Pfingsten hören auch Kreter in ihrer eigenen Sprache von Gottes großen Taten – die gute Nachricht gilt allen Völkern.' },
  },
  'tit-winter': {
    background: 'Gemeint ist vermutlich Nikopolis („Siegesstadt“) in Epirus an der Westküste Griechenlands. Octavian, der spätere Kaiser Augustus, hatte sie nach seinem Sieg bei Actium 31 v. Chr. gegründet.',
    question: 'Wie findet man im Einsatz für Gott und andere ein gesundes Maß zwischen Arbeit und Ruhe?',
    crossRef: { ref: 'Markus 6,31', note: 'Jesus lädt seine Jünger nach ihrem Einsatz ein, an einen einsamen Ort zu kommen und ein wenig auszuruhen.' },
  },
  'phlm-name': {
    background: 'Onesimus war ein häufiger Sklavenname – Sklaven erhielten oft Namen, die ihren Nutzen ausdrückten. Paulus nennt ihn sein „Kind“, das er in der Haft zum Glauben geführt hat (Vers 10).',
    question: 'Wie kann aus einer Geschichte des Scheiterns ein Neuanfang werden – und was braucht es dafür von anderen?',
    crossRef: { ref: 'Philemon 1,16-17', note: 'Paulus bittet Philemon, Onesimus nicht mehr als Sklaven, sondern als geliebten Bruder aufzunehmen – so wie ihn selbst.' },
  },
  'phlm-schulden': {
    background: 'Onesimus war Sklave Philemons und hatte ihn wohl verlassen; bei Paulus in der Haft wurde er Christ (V. 10). Sein Name bedeutet „nützlich“ – darauf spielt Paulus an: einst unnütz, jetzt nützlich (V. 11).',
    question: 'Wo braucht es heute Menschen, die wie Paulus zwischen zwei Seiten vermitteln – und was kann sie das kosten?',
    crossRef: { ref: 'Kolosser 2,13-14', note: 'Gott vergibt alle Schuld und heftet den Schuldschein, der gegen uns stand, ans Kreuz – Paulus’ Angebot wirkt wie ein Echo davon.' },
  },
  'phlm-haus': {
    background: 'Die ersten Christen trafen sich meist in Privathäusern; eigene Kirchenbauten kamen erst ab dem 3. Jahrhundert auf. Der Brief nennt neben Philemon auch Apphia, vermutlich seine Frau, und Archippus (vgl. Kolosser 4,17).',
    question: 'Wie kann eine Gemeinde mithelfen, dass Versöhnung zwischen zwei Menschen gelingt?',
    crossRef: { ref: 'Römer 16,3-5', note: 'Paulus grüßt Priska und Aquila, die für ihn ihr Leben riskierten, und die Gemeinde, die sich in ihrem Haus trifft.' },
  },
  'hebr-melchisedek': {
    background: 'Melchisedek taucht in 1. Mose 14 ohne Herkunft auf und verschwindet wieder; Hebräer 7,3 deutet dieses Schweigen als Bild für ein bleibendes Priestertum. Sein Name bedeutet „König der Gerechtigkeit“.',
    question: 'Was heißt es für den Alltag, dass Jesus als Priester für immer bei Gott für Menschen eintritt?',
    crossRef: { ref: 'Psalm 110,4', note: 'In diesem Königspsalm schwört Gott: Priester für immer nach dem Vorbild Melchisedeks – der Hebräerbrief bezieht das auf Jesus.' },
  },
  'hebr-engel': {
    background: 'Das griechische Wort für Gastfreundschaft, philoxenia, heißt wörtlich „Liebe zu Fremden“. Gasthäuser hatten oft einen schlechten Ruf; reisende Christen waren deshalb auf offene Türen in den Gemeinden angewiesen.',
    question: 'Wie kann Gastfreundschaft heute aussehen – gerade gegenüber Menschen, die man noch nicht kennt?',
    crossRef: { ref: 'Matthäus 25,35-40', note: 'Jesus stellt sich an die Seite der Fremden: Wer sie aufnimmt und Bedürftigen hilft, tut es ihm selbst.' },
  },
  'hebr-verfasser': {
    background: 'Der Text beginnt ohne Absender und nennt sich selbst ein „Wort der Ermahnung“ (13,22) – vermutlich eine aufgeschriebene Predigt. Schon der Kirchenvater Origenes meinte im 3. Jahrhundert: Wer ihn schrieb, weiß nur Gott.',
    question: 'Wie geht man gut damit um, dass die Bibel manche Fragen offenlässt – etwa die nach dem Verfasser?',
    crossRef: { ref: '1. Korinther 3,5-7', note: 'Paulus fragt, wer Apollos und wer Paulus sei: nur Diener – das Wachstum schenkt allein Gott.' },
  },
  'hebr-rahab': {
    background: 'Josua 2 erzählt, wie Rahab, die als Prostituierte in Jericho lebte, Josuas Kundschafter auf ihrem Dach versteckte. Eine rote Schnur im Fenster war das vereinbarte Zeichen; so wurde sie mit ihrer Familie verschont (Josua 6,25).',
    question: 'Was sagt es über Gott, dass er Menschen wie Rahab zu Vorbildern macht – und was heißt das für eine Gemeinde?',
    crossRef: { ref: 'Matthäus 1,5', note: 'Im Stammbaum Jesu nennt Matthäus Rahab als Mutter des Boas – direkt neben Rut, einer weiteren Ausländerin.' },
  },
  'jak-zunge': {
    background: 'Der Abschnitt beginnt mit einer Warnung an Lehrende: Sie werden strenger beurteilt (3,1). Ähnliche Bilder von Zaum und Steuerruder finden sich auch bei griechischen Philosophen.',
    question: 'Wie können Worte heute aufbauen oder zerstören – im Netz, in der Familie oder in der Gemeinde?',
    crossRef: { ref: 'Epheser 4,29', note: 'Paulus rät, nur Worte zu sagen, die aufbauen und den Hörenden guttun – das positive Gegenstück zu Jakobus 3.' },
  },
  'jak-spiegel': {
    background: 'Spiegel waren damals aus poliertem Metall, meist Bronze, und zeigten ein weniger klares Bild als heute. Jakobus stellt dem flüchtigen Blick das genaue Hineinschauen in das „vollkommene Gesetz der Freiheit“ gegenüber (V. 25).',
    question: 'Was hilft dabei, dass Gehörtes aus Bibel oder Predigt nicht gleich verfliegt, sondern im Alltag ankommt?',
    crossRef: { ref: 'Hesekiel 33,31-32', note: 'Die Leute hören Hesekiels Worte gern wie ein schönes Lied – doch sie tun nicht, was er sagt.' },
  },
  'jak-elia': {
    background: 'In 1. Könige 18,1 kündigt Gott den Regen „im dritten Jahr“ an. Die Zahl dreieinhalb Jahre nennt auch Jesus in Lukas 4,25 – vermutlich nach jüdischer Überlieferung.',
    question: 'Was macht Mut, weiter zu beten, wenn sich lange nichts zu verändern scheint?',
    crossRef: { ref: '1. Könige 18,42-45', note: 'Elia kauert auf dem Karmel, den Kopf zwischen den Knien; beim siebten Mal sieht sein Diener eine kleine Wolke, dann regnet es.' },
  },
  'jak-daemonen': {
    background: 'Der Satz „Gott ist nur einer“ greift das Schma Israel auf (5. Mose 6,4), das nach jüdischem Brauch morgens und abends gebetet wird. Jakobus’ vermutlich judenchristliche Leser kannten es also aus ihrem Alltag.',
    question: 'Wie zeigt sich im Alltag, dass Glaube mehr ist als die richtige Meinung über Gott?',
    crossRef: { ref: 'Galater 5,6', note: 'Auch Paulus betont: In Christus zählt nicht die Beschneidung, sondern ein Glaube, der sich in Liebe auswirkt.' },
  },
  '1petr-babylon': {
    background: 'Babylon hatte einst Jerusalem zerstört und wurde so zum Sinnbild einer gottfernen Weltmacht. Nach alter Überlieferung starb Petrus in Rom als Märtyrer, und Markus schrieb dort auf, was Petrus von Jesus erzählte.',
    question: 'Wie können Christen in einer Gesellschaft leben, die anders denkt – ohne sich abzuschotten oder sich selbst zu verlieren?',
    crossRef: { ref: 'Jeremia 29,7', note: 'Jeremia schreibt den Verbannten in Babylon, sie sollen das Wohl der Stadt suchen und für sie beten.' },
  },
  '1petr-steine': {
    background: 'Im Judentum galt der Tempel in Jerusalem als „Haus Gottes“. Petrus überträgt diese Sprache auf die Gemeinde: Alle Glaubenden sind eine heilige Priesterschaft und bringen geistliche Opfer dar (V. 5).',
    question: 'Was bedeutet es für eine Gemeinde, dass alle zum Bau gehören – nicht nur die, die vorne stehen?',
    crossRef: { ref: 'Epheser 2,19-22', note: 'Paulus beschreibt die Gemeinde als Bau mit Christus als Eckstein, der zu einem heiligen Tempel für Gott wächst.' },
  },
  '1petr-hoffnung': {
    background: '„Rede und Antwort“ steht für das griechische apologia, das auch die Verteidigung vor Gericht bezeichnete – daher das Wort Apologetik. Christen waren damals eine oft verleumdete Minderheit (2,12).',
    question: 'Wie lässt sich die christliche Hoffnung so erklären, dass auch Außenstehende sie verstehen?',
    crossRef: { ref: 'Kolosser 4,5-6', note: 'Paulus rät, Außenstehenden klug zu begegnen und stets freundlich zu reden, damit man jedem passend antworten kann.' },
  },
  '1petr-arche': {
    background: 'Gerettet wurden Noah, seine Frau, seine drei Söhne und deren Frauen (1. Mose 7,13). Frühe Christen sahen in der Acht ein Zeichen des Neuanfangs: Der Sonntag, an dem Jesus auferstand, galt ihnen als „achter Tag“.',
    question: 'Wo erleben Menschen heute so etwas wie eine Arche – einen Ort, an dem sie Schutz und einen Neuanfang finden?',
    crossRef: { ref: '1. Mose 9,12-15', note: 'Nach der Flut schließt Gott einen Bund mit allem Leben: Nie wieder soll eine Flut alles vernichten – der Regenbogen ist das Zeichen.' },
  },
  '2petr-tag': {
    background: 'Petrus antwortet auf Spötter, die fragen, wo die versprochene Wiederkunft Jesu bleibe – seit die Väter gestorben seien, ändere sich nichts (3,3-4). Das Warten beschäftigte die Gemeinden also schon früh.',
    question: 'Wie verändert es das Warten, wenn man Gottes Zeit als Geduld statt als Verspätung versteht?',
    crossRef: { ref: 'Psalm 90,4', note: 'Der Psalm sagt, für Gott seien tausend Jahre wie ein vergangener Tag oder eine Nachtwache – genau darauf spielt Petrus an.' },
  },
  '2petr-verklaerung': {
    background: 'Die Evangelien nennen den Berg nicht; nach alter Überlieferung war es der Tabor in Galiläa, manche denken an den Hermon. Für „verklärt“ steht dort das griechische metamorphoō – daher unser Wort „Metamorphose“.',
    question: 'Wie können Erinnerungen an besondere Glaubensmomente Halt geben, wenn Gott gerade fern scheint?',
    crossRef: { ref: 'Matthäus 17,1-8', note: 'Vor Petrus, Jakobus und Johannes wird Jesus verwandelt, Mose und Elia erscheinen, und Gott nennt ihn seinen geliebten Sohn.' },
  },
  '2petr-eselin': {
    background: 'Bileam, ein Seher von außerhalb Israels, sollte gegen Lohn Israel verfluchen, musste es aber segnen (4. Mose 22-24). Eine alte Inschrift aus Deir Alla in Jordanien nennt ebenfalls „Bileam, Sohn Beors“.',
    question: 'Wie gelingt es, sich auch von unerwarteter Seite etwas sagen zu lassen – selbst wenn es unbequem ist?',
    crossRef: { ref: '4. Mose 24,17', note: 'Ausgerechnet Bileam kündigt einen Stern aus Jakob an – ein Wort, das später oft auf den Messias gedeutet wurde.' },
  },
  '2petr-paulus': {
    background: 'Petrus nennt Paulus einen geliebten Bruder, obwohl Paulus ihm in Antiochia einst offen widersprochen hatte (Galater 2,11-14). Paulusbriefe wurden offenbar schon früh gesammelt und weitergegeben.',
    question: 'Wie kann eine Gruppe gut mit Bibelstellen umgehen, die schwer zu verstehen sind?',
    crossRef: { ref: 'Apostelgeschichte 8,30-35', note: 'Der Äthiopier versteht den Jesajatext nicht allein; er bittet Philippus zu sich, der ihm die Stelle von Jesus her erklärt.' },
  },
  '1joh-licht': {
    background: 'Der Gegensatz von Licht und Finsternis prägt auch das Johannesevangelium und war im damaligen Judentum verbreitet – in den Schriften von Qumran ist etwa von „Söhnen des Lichts“ die Rede.',
    question: 'Warum fällt es oft so schwer, Fehler ans Licht zu bringen – und was kann dabei helfen?',
    crossRef: { ref: 'Johannes 8,12', note: 'Jesus nennt sich das Licht der Welt: Wer ihm folgt, bleibt nicht im Dunkeln, sondern hat das Licht des Lebens.' },
  },
  '1joh-gewiss': {
    background: 'Eine Gruppe hatte die Gemeinde verlassen (2,19) und wohl Verunsicherung hinterlassen. Johannes betont: Ewiges Leben ist nicht nur Zukunft – wer den Sohn hat, hat das Leben schon jetzt (V. 12).',
    question: 'Was gibt Menschen im Glauben Gewissheit – und was kann sie ins Wanken bringen?',
    crossRef: { ref: 'Römer 8,38-39', note: 'Paulus ist gewiss: Weder Tod noch Leben noch irgendeine Macht kann uns von Gottes Liebe in Christus trennen.' },
  },
  '1joh-antichrist': {
    background: 'Das Wort kommt nur fünfmal vor, alle Stellen stehen in 1. und 2. Johannes. Die griechische Vorsilbe „anti“ kann „gegen“ und „anstelle von“ bedeuten – also Gegner Christi oder falscher Ersatz für ihn.',
    question: 'Wie kann man heute erkennen, ob eine Botschaft über Jesus vertrauenswürdig ist?',
    crossRef: { ref: '1. Johannes 4,1-3', note: 'Johannes rät, die Geister zu prüfen: Jeder Geist, der bekennt, dass Jesus Christus als Mensch kam, ist von Gott.' },
  },
  '2joh-herrin': {
    background: '„Herrin“ übersetzt das griechische kyria, die weibliche Form von kyrios („Herr“); manche lesen es auch als Eigennamen. Am Ende grüßen die Kinder ihrer „auserwählten Schwester“ (V. 13) – vielleicht eine Nachbargemeinde.',
    question: 'Was macht eine Gemeinde zu einer Familie – und wo stößt dieses Bild an Grenzen?',
    crossRef: { ref: 'Markus 3,33-35', note: 'Jesus nennt alle, die Gottes Willen tun, seine Brüder, Schwestern und Mutter – eine Familie über Blutsbande hinaus.' },
  },
  '2joh-tinte': {
    background: 'Geschrieben wurde meist mit Rußtinte und Schreibrohr auf Papyrus; der kurze Brief passte wohl auf ein einziges Blatt. Sehr ähnlich endet auch der 3. Johannesbrief (V. 13-14).',
    question: 'Was kann ein persönliches Gespräch, was Nachrichten und Chats nicht können?',
    crossRef: { ref: 'Römer 1,11-12', note: 'Paulus sehnt sich danach, die Christen in Rom zu sehen, damit sie einander durch den gemeinsamen Glauben stärken.' },
  },
  '3joh-diotrephes': {
    background: 'Das griechische Wort für „gern der Erste sein“ kommt im Neuen Testament nur hier vor. Der Älteste hatte der Gemeinde schon geschrieben, doch Diotrephes erkannte ihn nicht an und redete schlecht über ihn (V. 9-10).',
    question: 'Wie sieht gute Leitung aus, die anderen Raum lässt – in der Gemeinde, aber auch in Schule und Beruf?',
    crossRef: { ref: 'Markus 10,43-45', note: 'Jesus sagt: Wer unter euch der Erste sein will, soll allen dienen – wie er selbst gekommen ist, um zu dienen.' },
  },
  '3joh-demetrius': {
    background: 'Wandernde Missionare waren auf Gastfreundschaft angewiesen, und Empfehlungsschreiben öffneten ihnen Türen. Demetrius war vermutlich einer von ihnen und überbrachte den Brief an Gajus.',
    question: 'Was macht Christen für ihr Umfeld glaubwürdig – und wie entsteht so ein guter Ruf wie der von Demetrius?',
    crossRef: { ref: 'Römer 16,1-2', note: 'Paulus empfiehlt Phöbe aus Kenchreä und bittet die Gemeinde, sie aufzunehmen und ihr in allem zu helfen.' },
  },
  'jud-michael': {
    background: 'Mose wurde in Moab begraben, doch niemand kennt sein Grab (5. Mose 34,6). Die Szene stammt vermutlich aus einer jüdischen Schrift, die der Kirchenvater Origenes „Himmelfahrt des Mose“ nennt.',
    question: 'Wie kann man jemandem klar widersprechen, ohne ihn herabzusetzen – und was hilft es, das Urteil Gott zu überlassen?',
    crossRef: { ref: 'Sacharja 3,1-2', note: 'Als der Satan den Hohenpriester Jeschua anklagt, heißt es wie in Judas 9: Der Herr weise dich zurecht.' },
  },
  'jud-henoch': {
    background: 'Das Buch trägt den Namen Henochs, der nach 1. Mose 5,24 mit Gott lebte, bis Gott ihn wegnahm. Die jüdische Schrift entstand teils schon vor Christus und gehört in der äthiopisch-orthodoxen Kirche bis heute zur Bibel.',
    question: 'Wo begegnen euch kluge Gedanken außerhalb der Bibel – und wie prüft ihr, was davon trägt?',
    crossRef: { ref: 'Apostelgeschichte 17,28', note: 'In Athen zitiert Paulus griechische Dichter, nach denen wir Menschen von Gottes Geschlecht sind – Worte von außerhalb der Bibel.' },
  },
  'jud-bruder': {
    background: 'Markus 6,3 nennt einen Jakobus und einen Judas unter Jesu Brüdern. Zunächst glaubten seine Brüder nicht an ihn (Johannes 7,5), nach Ostern beteten sie mit den Jüngern (Apostelgeschichte 1,14).',
    question: 'Warum stellt sich Judas wohl als Diener statt als Bruder Jesu vor – und wo wäre so eine Haltung heute gefragt?',
    crossRef: { ref: 'Jakobus 1,1', note: 'Auch Jakobus nennt sich am Briefanfang nur Diener Gottes und des Herrn Jesus Christus – kein Wort von Verwandtschaft.' },
  },
  'offb-patmos': {
    background: 'Patmos ist eine kleine, felsige Insel in der Ägäis vor der Westküste der heutigen Türkei. Nach alter Überlieferung kam Johannes gegen Ende der Herrschaft Kaiser Domitians (81–96 n. Chr.) dorthin.',
    question: 'Wie kann ein Ort der Einsamkeit oder Begrenzung zu einem Ort werden, an dem Menschen Gott neu begegnen?',
    crossRef: { ref: 'Hesekiel 1,1', note: 'Auch Hesekiel lebt unter Verschleppten am Fluss Kebar, als sich der Himmel öffnet und er Visionen von Gott sieht.' },
  },
  'offb-lau': {
    background: 'Laodizea bezog sein Wasser über eine Leitung; es kam vermutlich lauwarm an, anders als die heißen Quellen im nahen Hierapolis. Bekannt war die Stadt für schwarze Wolle und wohl auch für Augensalbe (vgl. Vers 18).',
    question: 'Was macht es so leicht, sich im Wohlstand selbstgenügsam zu fühlen – und was bedeutet es, dass Jesus trotzdem anklopft?',
    crossRef: { ref: 'Sprüche 30,8-9', note: 'Der Beter bittet weder um Armut noch um Reichtum: Satt könnte er Gott verleugnen, arm könnte er stehlen.' },
  },
  'offb-selig': {
    background: 'Die Offenbarung richtet sich an sieben Gemeinden und wurde dort wohl im Gottesdienst vorgelesen: Einer liest vor, alle hören zu. Bücher waren teuer, und viele Menschen konnten nicht selbst lesen.',
    question: 'Was verändert sich, wenn eine Gruppe die Bibel gemeinsam laut liest – statt jeder allein und still?',
    crossRef: { ref: 'Lukas 11,28', note: 'Jesus preist selig, wer Gottes Wort hört und befolgt – derselbe Gedanke wie am Anfang der Offenbarung.' },
  },
  'offb-blaetter': {
    background: 'Nach dem Sündenfall bewachten Cherubim den Weg zum Baum des Lebens (1. Mose 3,24). Nun wächst er zu beiden Seiten des Stroms, und es wird keinen Fluch mehr geben (Offenbarung 22,3).',
    question: 'Was könnte „Heilung der Völker“ bedeuten – und wo zeigt sich davon heute schon etwas?',
    crossRef: { ref: 'Hesekiel 47,12', note: 'Hesekiel sieht an einem Strom aus dem Heiligtum Bäume, die jeden Monat Frucht tragen und deren Blätter heilen.' },
  },
  'offb-meer': {
    background: 'In der Offenbarung steigt ein Tier aus dem Meer (13,1), wie schon in Daniel 7 vier Tiere. Zudem trennte das Meer Johannes auf Patmos von seinen Gemeinden.',
    question: 'Wofür könnte das „Meer“ heute stehen – und was tröstet daran, dass es in Gottes neuer Welt verschwindet?',
    crossRef: { ref: 'Markus 4,39-41', note: 'Jesus gebietet Wind und Wellen, es wird still – und die Jünger fragen, wer er ist, dass ihm sogar das Meer gehorcht.' },
  },
  'nt-synoptisch': {
    background: 'Bekannt machte den Begriff Johann Jakob Griesbach, der im 18. Jahrhundert die drei Evangelien in Spalten nebeneinander abdruckte. Die meisten Forscher halten Markus für das älteste, das Matthäus und Lukas wohl kannten.',
    question: 'Warum ist es vielleicht ein Geschenk, dass wir Jesus durch vier unterschiedliche Evangelien kennenlernen statt durch eines?',
    crossRef: { ref: 'Lukas 1,1-4', note: 'Lukas erwähnt, dass schon viele die Ereignisse um Jesus aufgeschrieben haben; er selbst ist allem sorgfältig nachgegangen.' },
  },
  'nt-katholisch': {
    background: 'Griechisch „katholikos“ heißt „das Ganze betreffend“: Die Briefe wenden sich meist an die ganze Christenheit, nicht an eine Ortsgemeinde. So nennt sie schon der Kirchenhistoriker Eusebius im 4. Jahrhundert.',
    question: 'Was verbindet Christen über Gemeinde- und Konfessionsgrenzen hinweg – und wo wird das bei euch sichtbar?',
    crossRef: { ref: 'Johannes 17,20-21', note: 'Jesus betet nicht nur für seine Jünger, sondern auch für alle, die durch ihr Wort glauben werden – um ihre Einheit.' },
  },
  'nt-paulusbriefe': {
    background: 'Die 13 Briefe stehen grob nach Länge geordnet: erst die an Gemeinden, dann die an Einzelne. Oft nennt Paulus Mitabsender wie Timotheus, manche Briefe diktierte er einem Schreiber (Römer 16,22).',
    question: 'Wie verändert sich der Blick auf die Briefe, wenn man bedenkt, dass Paulus an echte Menschen mit echten Fragen schrieb?',
    crossRef: { ref: '2. Petrus 3,15-16', note: 'Der 2. Petrusbrief erwähnt die Briefe des Paulus: Manches darin sei schwer zu verstehen und werde verdreht.' },
  },
  'nt-pastoral': {
    background: 'Der Sammelname kam erst im 18. Jahrhundert auf. Timotheus sollte in Ephesus falschen Lehren wehren (1. Timotheus 1,3), Titus auf Kreta in jeder Stadt Älteste einsetzen (Titus 1,5).',
    question: 'Was zeichnet gute Hirten in einer Gemeinde aus – und wo kümmern sich Menschen um andere, ganz ohne Amt oder Titel?',
    crossRef: { ref: '1. Petrus 5,2-3', note: 'Die Ältesten sollen die Herde Gottes freiwillig und mit Hingabe hüten – nicht als Herrscher, sondern als Vorbilder.' },
  },
  'at-axt': {
    background: 'Die Prophetenjünger wollten am Jordan eine größere Bleibe bauen. Eisen war wertvoll: Zu Sauls Zeit mussten Israeliten ihre Werkzeuge sogar bei den Philistern schärfen lassen (1. Samuel 13,20).',
    question: 'Warum steht wohl auch so eine kleine Alltagsgeschichte in der Bibel – und welche „kleinen“ Sorgen darf man Gott bringen?',
    crossRef: { ref: 'Philipper 4,6', note: 'Paulus ermutigt, sich nicht zu sorgen, sondern Gott in allen Dingen die eigenen Anliegen mit Dank im Gebet zu sagen.' },
  },
  'at-raben': {
    background: 'Elia hatte König Ahab eine Dürre angekündigt (1. Könige 17,1) und sollte sich verstecken. Ahab verehrte Baal, der als Gott des Regens galt – die Dürre war wohl auch eine Kampfansage an Baal.',
    question: 'Wie kann Gott heute durch unerwartete Menschen versorgen – vielleicht sogar durch solche, die wir gering schätzen?',
    crossRef: { ref: 'Lukas 12,24', note: 'Jesus verweist auf die Raben: Sie säen und ernten nicht, und doch ernährt Gott sie – Menschen sind ihm noch viel mehr wert.' },
  },
  'at-ziegenfelle': {
    background: 'Schon vor der Geburt der Zwillinge hatte Rebekka von Gott gehört, der Ältere werde dem Jüngeren dienen (1. Mose 25,23). Der Segen des Vaters galt als wirksam und unwiderruflich (1. Mose 27,33).',
    question: 'Was richtet Täuschung in einer Familie an – und was braucht es, damit nach so einem Bruch Versöhnung möglich wird?',
    crossRef: { ref: '1. Mose 33,4', note: 'Nach vielen Jahren läuft Esau seinem Bruder Jakob entgegen, umarmt und küsst ihn, und beide weinen.' },
  },
  'at-loewenhonig': {
    background: 'Simson gab seinen Eltern vom Honig, verschwieg aber, woher er stammte (Richter 14,9). Wer das Aas eines Tieres berührte, das auf Tatzen geht – etwa eines Löwen –, wurde nach 3. Mose 11,27 unrein.',
    question: 'Wie geht man gut mit einer Begabung oder Berufung um – und woran merkt man, dass man sie leichtfertig verspielt?',
    crossRef: { ref: 'Richter 16,19-20', note: 'Delila lässt Simson die Locken abschneiden; er erwacht und ahnt nicht, dass der Herr ihn verlassen hat.' },
  },
  'at-wahnsinn': {
    background: 'Ausgerechnet Gat war Goliats Heimatstadt (1. Samuel 17,4), und David hatte gerade dessen Schwert erhalten (21,10). Achischs Leute erkannten in ihm den David, von dem man sang, er habe Zehntausende erschlagen.',
    question: 'Wie passen kluges Handeln in Gefahr und Vertrauen auf Gott zusammen – gerade bei Davids ungewöhnlicher List?',
    crossRef: { ref: 'Psalm 56,1-5', note: 'Auch dieser Psalm verweist in der Überschrift auf Gat: Wenn der Beter Angst hat, setzt er sein Vertrauen auf Gott.' },
  },
  'at-ziegel': {
    background: 'Hesekiel lebte seit 597 v. Chr. unter den Verschleppten in Babylonien, wo man mit Lehmziegeln baute und auf Tontafeln schrieb. Jerusalem stand da noch – 587/586 v. Chr. wurde es zerstört.',
    question: 'Warum wirken Bilder und Handlungen oft stärker als Worte – und wie kann Glaube heute im Alltag sichtbar werden?',
    crossRef: { ref: 'Johannes 13,14-15', note: 'Nach der Fußwaschung sagt Jesus, er habe ein Beispiel gegeben: Auch die Jünger sollen einander die Füße waschen.' },
  },
  'at-mundschenk': {
    background: 'Mit Artahsasta ist Artaxerxes I. gemeint; sein 20. Regierungsjahr (Nehemia 2,1) entspricht etwa 445 v. Chr. Ein Mundschenk kostete wohl auch den Wein vor, um den König vor Gift zu schützen.',
    question: 'Was können wir von Nehemias kurzem Gebet mitten im Gespräch für Schule, Beruf und Alltag lernen?',
    crossRef: { ref: 'Sprüche 21,1', note: 'Gott hält auch das Herz eines Königs in der Hand und lenkt es wie Wasserläufe in die Richtung, die er will.' },
  },
  'at-wurm': {
    background: 'Ninive war zeitweise Hauptstadt Assyriens, der Großmacht, die um 722 v. Chr. das Nordreich Israel eroberte. Die Staude war vermutlich ein schnell wachsender Rizinus mit großen Blättern.',
    question: 'Warum fällt es oft schwer, Gottes Barmherzigkeit ausgerechnet denen zu gönnen, die uns oder anderen geschadet haben?',
    crossRef: { ref: 'Lukas 15,28-32', note: 'Der ältere Bruder ärgert sich über das Fest für den Heimgekehrten; der Vater wirbt um ihn – auch diese Geschichte endet offen.' },
  },
  'at-joch': {
    background: 'Gesandte aus Edom, Moab, Ammon, Tyrus und Sidon waren damals bei König Zedekia, vermutlich um einen Aufstand gegen Babel zu planen. Hananja versprach, binnen zwei Jahren kämen die Verschleppten heim (28,3-4).',
    question: 'Woran kann man erkennen, ob eine Botschaft von Gott kommt – gerade wenn eine angenehmere Stimme das Gegenteil verspricht?',
    crossRef: { ref: '5. Mose 18,21-22', note: 'Gott nennt ein Merkmal: Kündigt ein Prophet in seinem Namen etwas an, das nicht eintrifft, hat Gott nicht gesprochen.' },
  },
};

export const TALK: Record<string, TalkNotes> = { ...CLASSIC_TALK, ...GAP_TALK };

export function talkNotes(questionId: string): TalkNotes | null {
  return TALK[questionId] ?? null;
}
