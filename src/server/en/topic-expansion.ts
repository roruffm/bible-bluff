// Gezielte englische Ergänzungen aus dem bereits kuratierten deutschen Pool.
// Dieselben IDs bewahren „Neues für alle“ über Sprachwechsel hinweg.
import type { Question } from '../questions';
import type { TalkNotes } from '../../shared/types';

type Entry = { question: Question; notes: TalkNotes };
const entries: Entry[] = [];
function add(id: string, book: string, group: Question['group'], difficulty: Question['difficulty'], prompt: string, answer: string, accept: string[][], bluffs: string[], ref: string, discovery: string, background: string, question: string, crossRef: string, note: string, gap = false) {
  entries.push({ question: { id, book, group, difficulty, prompt, answer, accept, bluffs, ref, discovery, ...(gap ? { kind: 'gap' as const } : {}) }, notes: { background, question, crossRef: { ref: crossRef, note } } });
}
add('mt-schlangen', 'Matthew', 'evangelien', 2,
  'Jesus sends out his disciples: wise as which animals, and harmless as which birds?', 'Serpents and doves', [['serpent', 'dove'], ['snake', 'dove']],
  ['Foxes and lambs', 'Owls and sheep', 'Ravens and sparrows'], 'Matthew 10:16',
  'Jesus sends them like sheep among wolves: they need wisdom without losing their integrity.',
  'Jesus pairs shrewdness with innocence. His followers face danger, but that does not give them permission to become deceitful.',
  'How can we act wisely without becoming dishonest?', 'Romans 16:19', 'Paul asks believers to be wise about what is good and innocent about evil.');
add('mk-wasserkrug', 'Mark', 'evangelien', 2,
  'What was the man carrying whom two disciples were to follow to find the Passover room?', 'A pitcher of water', [['pitcher'], ['water'], ['jug']],
  ['A lamb on his shoulders', 'A red cloak', 'A burning oil lamp'], 'Mark 14:12–16',
  'The man leads them to a house with a furnished upper room. They find things just as Jesus told them.',
  'Jesus gives the disciples a recognisable sign: a man carrying water. Following him leads to the prepared room upstairs.',
  'What helps you take a next step when you do not yet see the whole plan?', 'Luke 22:15', 'Jesus says he has eagerly desired to eat this Passover with his disciples.');
add('mk-kruemel', 'Mark', 'evangelien', 3,
  'How does the Syrophoenician woman respond when Jesus says the children’s bread should not go to the dogs?', 'Even the dogs eat the crumbs under the table', [['crumb'], ['dog', 'table']],
  ['Then I shall be a cat instead', 'But dogs guard the house', 'I brought my own bread'], 'Mark 7:24–30',
  'She stays with the picture Jesus uses and asks for room within it. Jesus tells her that her daughter has been healed.',
  'The woman is a Gentile asking for help for her daughter. She answers Jesus directly, and he grants her request.',
  'What strikes you about the way this woman asks for help?', 'Matthew 15:28', 'Matthew’s account highlights her great faith.');
add('lk-emmaus', 'Luke', 'evangelien', 1,
  'When did the two disciples at Emmaus recognise the risen Jesus?', 'When he broke the bread', [['bread'], ['broke'], ['breaking']],
  ['When he called their names', 'When he began singing a psalm', 'By his travelling cloak'], 'Luke 24:13–35',
  'On the road he had explained the Scriptures. At the table, as he broke the bread, their eyes were opened.',
  'The disciples walk with Jesus without recognising him. They invite him to stay, and recognise him when he blesses and breaks bread.',
  'Have you ever understood an experience only when looking back?', 'Luke 24:32', 'They recall how their hearts burned while he explained the Scriptures.');
add('lk-verloren', 'Luke', 'evangelien', 1,
  'Which three lost things feature in the stories of Luke 15?', 'A sheep, a coin and a son', [['sheep', 'coin'], ['sheep', 'son'], ['coin', 'son']],
  ['A donkey, a key and a daughter', 'A lamb, a jar and a servant', 'A goat, a ring and a brother'], 'Luke 15:1–32',
  'The stories share the joy of finding what was lost. Jesus tells them as people grumble that he welcomes sinners.',
  'A shepherd searches, a woman searches, and a father welcomes his returning son. The chapter repeatedly highlights joy over the lost being found.',
  'Which of these three pictures helps you understand God’s welcome?', 'Luke 19:10', 'Jesus says he came to seek and save the lost.');
add('lk-fischzug', 'Luke', 'evangelien', 2,
  'What does Peter say to Jesus after the enormous catch of fish?', 'Depart from me, for I am a sinful man', [['sinful'], ['sinner'], ['depart'], ['go', 'away']],
  ['Can you do that again tomorrow?', 'We need a bigger boat!', 'May I sell these fish?'], 'Luke 5:1–11',
  'Peter is overwhelmed and admits his sin. Jesus answers with reassurance and calls him to catch people instead.',
  'After an unsuccessful night, the fishermen let down their nets at Jesus’ word. The catch is so large that they need help from another boat.',
  'What surprises you about Jesus’ response to Peter’s honesty?', 'Isaiah 6:5', 'Isaiah also becomes aware of his own failings in an encounter with God.');
add('joh-junge', 'John', 'evangelien', 1,
  'What did the boy bring to the feeding of the five thousand, according to John?', 'Five barley loaves and two fish', [['barley'], ['five', 'loaf'], ['five', 'loav'], ['fish']],
  ['Three flatbreads and a jug of milk', 'Seven figs and some cheese', 'A basket full of dates'], 'John 6:1–13',
  'John mentions the boy and his barley bread. A small lunch becomes part of a meal with twelve baskets of leftovers.',
  'Andrew points out the boy’s food but wonders how it can possibly feed so many. Jesus gives thanks and distributes it.',
  'What small thing might you be able to offer, even when it seems insufficient?', 'Mark 6:37', 'Jesus tells the disciples to give the crowd something to eat.');
add('joh-speichel', 'John', 'evangelien', 2,
  'What did Jesus use to make mud for the eyes of a man born blind?', 'Earth and saliva', [['earth'], ['saliva'], ['spit'], ['mud'], ['clay']],
  ['Oil and ashes', 'Wine and myrrh', 'Honey and salt'], 'John 9:1–7',
  'Jesus sends him to wash in the pool of Siloam, a name meaning “Sent”. He washes and returns able to see.',
  'Jesus rejects the assumption that the man’s blindness must be punishment for his or his parents’ sin. He then gives the man sight.',
  'How does this story challenge the way we judge other people’s suffering?', 'John 9:25', 'The healed man simply says that he was blind and now can see.');
add('joh-obergewand', 'John', 'evangelien', 3,
  'What did Peter put on before jumping into the water when he recognised Jesus on the shore?', 'His outer garment', [['garment'], ['coat'], ['cloak'], ['robe']],
  ['His sandals', 'A rope around his waist', 'His fishing cap'], 'John 21:7',
  'Peter puts on his outer garment before jumping in: an unusual order for someone about to swim. He hurries towards Jesus.',
  'After a night without fish, a stranger tells the disciples where to cast the net. John recognises Jesus; Peter jumps in to reach him.',
  'What do you notice about Peter’s eagerness to reach Jesus?', 'John 21:17', 'Jesus later entrusts Peter with caring for his sheep.');
add('joh-haare', 'John', 'evangelien', 1,
  'What did Mary of Bethany use to wipe Jesus’ feet after anointing them?', 'Her hair', [['hair']],
  ['Her veil', 'A linen towel', 'The hem of her dress'], 'John 12:1–8',
  'The fragrance of costly nard fills the house. Judas objects to the expense, but Jesus defends Mary.',
  'Mary pours costly perfume on Jesus’ feet at a meal in Bethany. Jesus links her action to the day of his burial.',
  'What makes an act of love seem wasteful to an observer?', 'Mark 14:9', 'In Mark’s anointing account, Jesus says the woman’s deed will be remembered.');
add('1kor-ochse', '1 Corinthians', 'paulus', 3,
  'Which animal does Paul mention to show that those preaching may receive support?', 'An ox treading out the grain', [['ox'], ['oxen'], ['treading'], ['thresh']],
  ['A donkey carrying loads', 'A sheep that knows its shepherd', 'A dog under the table'], '1 Corinthians 9:9–15',
  'Paul cites the rule about not muzzling a working ox. He then explains why he has chosen not to use his own right to support.',
  'Paul applies Deuteronomy 25:4 to human workers: those sharing spiritual things may receive material support.',
  'How can we value people’s work without treating every relationship as a transaction?', '1 Timothy 5:18', 'This letter also cites the ox and says that a worker deserves wages.');
add('1thess-beten', '1 Thessalonians', 'paulus', 1,
  'How often does 1 Thessalonians 5 say Christians should pray?', 'Without ceasing', [['ceasing'], ['continual'], ['always'], ['constantly'], ['nonstop'], ['stop']],
  ['Seven times a day', 'Morning, noon and evening', 'Before each meal'], '1 Thessalonians 5:16–18',
  'The call to prayer stands alongside rejoicing and giving thanks: an ongoing life with God, not merely a timetable.',
  'Three short instructions stand together: rejoice always, pray without ceasing, and give thanks in everything.',
  'How could you stay in conversation with God during an ordinary day?', 'Luke 18:1', 'Jesus tells a parable about always praying and not losing heart.');
add('2thess-essen', '2 Thessalonians', 'paulus', 1,
  'According to 2 Thessalonians 3, who should not eat?', 'Anyone who is unwilling to work', [['work']],
  ['Anyone who cooks on the Sabbath', 'Anyone who gives nothing to the poor', 'Anyone who forgets to say grace'], '2 Thessalonians 3:6–13',
  'Paul addresses people unwilling to work, rather than people unable to work through illness or circumstances beyond their control.',
  'Paul describes deliberate idleness and meddling, and urges people to work quietly. He also tells the community not to grow weary of doing good.',
  'How can a community encourage responsibility while supporting people in need?', 'Galatians 6:2', 'Paul also calls believers to carry one another’s burdens.');
add('1tim-jugend', '1 Timothy', 'pastoral', 1,
  'For what reason should nobody look down on Timothy?', 'Because of his youth', [['youth'], ['young'], ['age']],
  ['Because of his Greek background', 'Because of his shyness', 'Because of his quiet voice'], '1 Timothy 4:12',
  'Rather than proving his status, Timothy should set an example in speech, conduct, love, faith and purity.',
  'Timothy’s example matters more than his age. The letter names five areas in which others can see his faith at work.',
  'In what ways can younger people set an example for older people?', 'Jeremiah 1:7', 'God tells Jeremiah not to say that he is too young.');
add('1joh-licht', '1 John', 'allgemein', 1,
  'Which three words sum up the message in 1 John 1:5?', 'God is light', [['light']],
  ['God is silence', 'God is space', 'God is sound'], '1 John 1:5–9',
  'Light, love and life recur throughout the letter. Walking in the light includes honesty about sin and receiving forgiveness.',
  'The letter says that there is no darkness in God. It connects life in the light with fellowship, confession and forgiveness.',
  'Why might admitting a failure be part of walking in the light?', 'John 8:12', 'Jesus calls himself the light of the world.');
add('lt-taube', 'Genesis', 'at', 1,
  'On her second flight, the dove returned to the ark in the evening with ___ in her beak.', 'a freshly plucked olive leaf', [['olive']],
  ['a vine shoot', 'an ear of wheat', 'a cedar twig'], 'Genesis 8:8–12',
  'The leaf tells Noah that the waters have receded. A week later he sends the dove out again, and she does not return.',
  'Noah does not leave the ark at the first sign of hope. The dove’s journeys mark stages as the floodwaters recede.',
  'What small signs of hope help you through a long wait?', 'Genesis 9:13', 'The rainbow becomes a sign of God’s covenant.', true);
add('lt-loewengrube', 'Daniel', 'at', 1,
  'Daniel explained why the lions had not hurt him: God had sent ___.', 'his angel', [['angel']],
  ['a wall of fire', 'a cloud full of light', 'a deep sleep upon the lions'], 'Daniel 6:16–23',
  'Darius spends the night unable to sleep. In the morning he finds Daniel unharmed because Daniel trusted his God.',
  'Daniel continues praying despite the royal ban. He tells the king that God sent an angel to shut the lions’ mouths.',
  'What would help you keep doing the right thing under pressure?', 'Psalm 34:7', 'The psalm describes God’s angel protecting those who fear him.', true);
add('lt-brot-allein', 'Matthew', 'evangelien', 1,
  'Jesus answers the tempter: a person does not live by bread alone, but by ___.', 'every word from God’s mouth', [['word']],
  ['hope for God’s kingdom', 'love from neighbours', 'the water of life'], 'Matthew 4:1–4',
  'Jesus answers with Deuteronomy 8:3, where Moses recalls the manna in the wilderness: God both provides and speaks.',
  'Jesus is hungry after fasting, but refuses to follow the tempter’s suggestion to turn stones into bread.',
  'What nourishes your life beyond food and possessions?', 'Deuteronomy 8:3', 'Moses connects the gift of manna with dependence on God’s word.', true);
add('lt-petrus-wind', 'Matthew', 'evangelien', 2,
  'Peter walked on the water towards Jesus until he saw ___ and became afraid.', 'the strong wind', [['wind'], ['storm']],
  ['the depth beneath his feet', 'a large fish below him', 'the other disciples laughing'], 'Matthew 14:28–31',
  'As he sinks, Peter calls for help. Jesus immediately reaches out and catches him.',
  'Peter asks to come to Jesus on the water. Fear interrupts his walk, but his cry for help receives an immediate response.',
  'What helps you ask for help when fear takes over?', 'Psalm 56:3', 'The psalmist turns fear into an invitation to trust God.', true);
add('lt-menschenfischer', 'Mark', 'evangelien', 1,
  'Jesus told Simon and Andrew: follow me, and I will make you ___.', 'fishers of men', [['fisher'], ['catch', 'people']],
  ['shepherds of my flock', 'workers in my vineyard', 'messengers of the king'], 'Mark 1:16–18',
  'They leave their nets immediately. Jesus uses their familiar work as a picture of their new calling.',
  'Jesus calls two brothers at their workplace by the Sea of Galilee. They respond by leaving their nets and following him.',
  'How might your everyday skills become useful to other people?', 'Luke 5:10', 'Jesus tells Simon that from now on he will catch people.', true);
add('lt-krippe', 'Luke', 'evangelien', 1,
  'Mary laid her baby in ___ because there was no room for them in the guest room.', 'a manger', [['manger'], ['trough']],
  ['a wicker basket', 'a saddlebag', 'a bed of straw'], 'Luke 2:6–7',
  'The feeding trough becomes the shepherds’ identifying sign: a baby wrapped in cloths and lying in a manger.',
  'Luke gives the shepherds a concrete sign for finding the child. The humble setting contrasts with the angel’s announcement of a Saviour.',
  'What surprises you about the way Jesus enters the world?', 'Luke 2:12', 'The angel tells the shepherds how they will recognise the child.', true);
add('lt-lebensbrot', 'John', 'evangelien', 1,
  'Jesus says: I am ___. Whoever comes to me will never be hungry.', 'the bread of life', [['bread']],
  ['the source of strength', 'the rock in the wilderness', 'the jar that never runs dry'], 'John 6:35',
  'After feeding the crowd, Jesus offers himself. The conversation moves from a meal to the life he gives.',
  'Some in the crowd seek another meal after the feeding miracle. Jesus speaks instead of coming to him and believing in him.',
  'What could it mean to seek Jesus himself rather than only his gifts?', 'John 6:27', 'Jesus speaks about food that endures to eternal life.', true);
add('lt-aussaetzige', 'Luke', 'evangelien', 2,
  'Of ten people healed of leprosy, only ___ returned to thank Jesus.', 'a Samaritan', [['samaritan'], ['=one'], ['=1']],
  ['a tax collector from Jericho', 'a Roman soldier', 'a young shepherd'], 'Luke 17:11–19',
  'The one who returns is a foreigner. He praises God and falls at Jesus’ feet in thanks.',
  'All ten are cleansed on the way to show themselves to the priests. Jesus notices that only one returns to give thanks.',
  'What might you have received recently without stopping to give thanks?', '1 Thessalonians 5:18', 'Paul encourages giving thanks in everything.', true);
add('lt-kana', 'John', 'evangelien', 2,
  'At the wedding in Cana, ___ told the servants to do whatever Jesus said.', 'Mary, Jesus’ mother', [['mary'], ['mother']],
  ['the master of the feast', 'the bridegroom', 'Peter'], 'John 2:1–5',
  'These are Mary’s last recorded words in John. Jesus then turns water into wine, the first of his signs.',
  'Mary notices that the wine has run out. After speaking with Jesus, she directs the servants to follow his instructions.',
  'What do you notice about Mary’s confidence in Jesus?', 'John 2:11', 'John describes the sign as revealing Jesus’ glory.', true);

export const EXTRA_EN_QUESTIONS: Question[] = entries.map((e) => e.question);
export const EXTRA_EN_TALK: Record<string, TalkNotes> = Object.fromEntries(entries.map((e) => [e.question.id, e.notes]));
