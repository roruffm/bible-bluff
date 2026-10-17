import type { ProfessorMotion } from '../lib/professor-motion';

export type ProfessorMood = 'confident' | 'nervous' | 'panic' | 'defeated' | 'victory' | 'startled' | 'kind';
type Expression = 'smug' | 'curious' | 'surprised' | 'flustered' | 'warm' | 'delighted' | 'worried' | 'sheepish';
type Pose = 'welcome' | 'explain' | 'watch' | 'stop' | 'startle' | 'balance' | 'glasses' | 'shrug' | 'facepalm' | 'think' | 'cheer' | 'applaud' | 'bow' | 'open' | 'support';
type Hand = 'palm' | 'point' | 'fist' | 'thumb';

const POSES: Record<ProfessorMotion, Pose> = {
  greet: 'welcome', present: 'explain', watch: 'watch', hold: 'stop', listen: 'open',
  startle: 'startle', spin: 'open', stumble: 'balance', 'double-take': 'glasses',
  adjust: 'glasses', shrug: 'shrug', facepalm: 'facepalm', think: 'think',
  encourage: 'support', guide: 'welcome', bow: 'bow', nervous: 'balance',
  celebrate: 'cheer', applaud: 'applaud',
};
function expressionFor(mood: ProfessorMood, motion?: ProfessorMotion): Expression {
  if (motion === 'celebrate' || motion === 'applaud' || motion === 'greet') return 'delighted';
  if (motion === 'encourage' || motion === 'guide' || motion === 'bow' || motion === 'listen') return 'warm';
  if (motion === 'think' || motion === 'watch' || motion === 'adjust') return 'curious';
  if (motion === 'shrug' || motion === 'facepalm') return 'sheepish';
  if (motion === 'stumble') return 'flustered';
  if (motion === 'nervous') return 'worried';
  return ({ confident: 'smug', nervous: 'worried', panic: 'flustered', defeated: 'sheepish', victory: 'delighted', startled: 'surprised', kind: 'warm' } as const)[mood];
}
const LABELS: Partial<Record<ProfessorMotion, string>> = {
  greet: 'begrüßt euch winkend', present: 'stellt seinen Bluff mit erhobenem Zeigefinger vor',
  watch: 'beobachtet neugierig eure Wahl', hold: 'hebt die Hand zum Stopp', listen: 'hört aufmerksam zu',
  adjust: 'rückt verdutzt seine Brille zurecht', shrug: 'hebt ratlos die Schultern',
  facepalm: 'fasst sich verblüfft an die Stirn', celebrate: 'jubelt mit dem Kinderteam',
  applaud: 'applaudiert eurem Einsatz', think: 'grübelt mit der Hand am Kinn',
};

/** Gezeichnete Grundposen bleiben auch nach der kurzen Bewegung und ohne Animation erkennbar. */
export function ProfessorBluff({ mood = 'confident', motion }: { mood?: ProfessorMood; motion?: ProfessorMotion }) {
  const pose = motion ? POSES[motion] : 'explain', expression = expressionFor(mood, motion);
  const label = motion && LABELS[motion] || (mood === 'startled' ? 'erschrickt über eure Punkte' : mood === 'kind' ? 'macht euch Mut' : mood === 'panic' ? 'ist aufgeregt' : '');
  return <svg class={`bluff-professor professor-character mood-${mood} pose-${pose}${motion ? ` professor-showcase motion-${motion}` : ''}`} data-motion={motion} data-pose={pose} data-expression={expression} viewBox={motion ? '-28 -38 296 326' : '0 0 240 280'} role="img" aria-label={`Professor Bluff${label ? ` ${label}` : ''}`}>
    <svg class="bluff-canvas" x="0" y="0" width="240" height="280" viewBox="0 0 240 280" overflow="visible">
      <ellipse class="bluff-shadow" cx="120" cy="267" rx="72" ry="8" fill="#09283c35"/>
      <g class="bluff-performer">
        <g class="bluff-body">
          <g class="bluff-legs" stroke="#12324a" stroke-linecap="round" stroke-linejoin="round">
            <path d="m91 241-9 18m61-18 10 18" fill="none" stroke-width="13"/>
            <path d="M80 256q-15 0-17 9h29l-3-9m65 0q15 0 17 9h-29l3-9" fill="#28354d" stroke-width="4"/>
          </g>
          <path d="M71 180q49-23 98 0l23 65-59 14-13-18-13 18-60-14z" fill="#7258ac" stroke="#12324a" stroke-width="5" stroke-linejoin="round"/>
          <path d="m76 182-17 57 43 11 10-43-15-29m66 4 16 57-42 11-10-43 15-29" fill="#8469bf"/>
          <path d="m98 173 22 44 22-44-22 6z" fill="#fff8e5"/>
          <path d="m96 176-10 16 23 18 11 23m24-57 10 16-23 18-11 23" fill="none" stroke="#4d3f85" stroke-width="4" stroke-linejoin="round"/>
          <path d="m120 188-18-10v23l18-8 18 8v-23z" fill="#ffda68" stroke="#12324a" stroke-width="3" stroke-linejoin="round"/>
          <rect x="116" y="185" width="8" height="11" rx="3" fill="#e9a746" stroke="#12324a" stroke-width="2"/>
          <path d="m148 214 17-3-3 9-9-2-5 7" fill="#ffedb0" stroke="#4d3f85" stroke-width="2.5"/>
          <path d="m146 224 22-4" stroke="#4d3f85" stroke-width="3" stroke-linecap="round"/>
          <circle cx="120" cy="226" r="3" fill="#ffda68"/><circle cx="120" cy="238" r="3" fill="#ffda68"/>
        </g>
        <BluffHead expression={expression}/>
        <Arms pose={pose}/>
        {(expression === 'flustered' || expression === 'worried') && <g class="bluff-sweat" fill="#78dbe0" stroke="#12324a" stroke-width="2.5"><path d="M193 67q16 23 3 26-14-2-3-26"/></g>}
      </g>
    </svg>
  </svg>;
}

function Arm({ side, d, x, y, hand = 'palm', angle = 0 }: { side: 'left'|'right'; d: string; x: number; y: number; hand?: Hand; angle?: number }) {
  return <g class={`bluff-arm bluff-arm-${side}`}>
    <path d={d} fill="none" stroke="#12324a" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>
    <path d={d} fill="none" stroke="#957cce" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <g class="bluff-hand" transform={`translate(${x} ${y}) rotate(${angle})`} fill="#f6c89e" stroke="#12324a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      {hand === 'palm' && <><path d="M-8 9-11-3q-1-5 3-5l3 5-2-11q0-5 4-4l3 12 1-14q2-4 5-1l-1 15 4-11q4-3 6 1L9-1l4-4q5-1 5 3L8 12q-8 6-16-3z"/><path d="m-3 3 1 5m8-6-2 6" fill="none" stroke="#ce9273" stroke-width="2"/></>}
      {hand === 'point' && <><path d="M-8 10-9-1q0-5 5-4l3 3v-21q0-6 5-5l2 23q5-4 8 0l-2 15q-10 7-20 0z"/><path d="m4 1 7 1" fill="none" stroke="#ce9273" stroke-width="2"/></>}
      {hand === 'fist' && <><path d="M-10 6v-12q5-8 13-6l9 4 1 12-9 8-10-1z"/><path d="M-8-3h13m-7-7v7m7-5v6" fill="none" stroke="#ce9273" stroke-width="2"/></>}
      {hand === 'thumb' && <><path d="M-9 9V-4l8-2 4-14q4-5 7 0L7-7l9 1-4 16-12 3z"/><path d="M-2-3v13" fill="none" stroke="#ce9273" stroke-width="2"/></>}
    </g>
  </g>;
}

function Arms({ pose }: { pose: Pose }) {
  const leftHip = <Arm side="left" d="M72 193Q41 193 48 221L72 226" x={75} y={225} hand="fist" angle={-30}/>;
  const leftOpen = <Arm side="left" d="M72 193Q46 210 24 187" x={21} y={180} angle={-45}/>;
  const rightOpen = <Arm side="right" d="M169 195Q196 210 217 187" x={220} y={180} angle={45}/>;
  if (pose === 'explain') return <>{leftHip}<Arm side="right" d="M169 195Q210 215 211 175" x={212} y={164} hand="point" angle={10}/></>;
  if (pose === 'think' || pose === 'watch') return <>{leftHip}<Arm side="right" d="M169 195Q199 207 183 177L146 166" x={140} y={162} hand="fist" angle={-55}/></>;
  if (pose === 'glasses') return <>{leftHip}<Arm side="right" d="M169 195Q209 181 189 145L177 122" x={174} y={114} hand="point" angle={-65}/></>;
  if (pose === 'facepalm') return <>{leftHip}<Arm side="right" d="M169 195Q210 177 183 130L158 88" x={152} y={79} angle={-35}/></>;
  if (pose === 'stop') return <>{leftHip}<Arm side="right" d="M169 195Q205 213 211 164" x={213} y={152}/></>;
  if (pose === 'startle' || pose === 'cheer') return <><Arm side="left" d="M72 193Q35 207 24 160" x={21} y={150} hand={pose === 'cheer' ? 'fist' : 'palm'} angle={-20}/><Arm side="right" d="M169 195Q205 207 216 160" x={219} y={150} hand={pose === 'cheer' ? 'fist' : 'palm'} angle={20}/></>;
  if (pose === 'shrug') return <><Arm side="left" d="M72 189Q42 214 25 188" x={19} y={184} angle={-90}/><Arm side="right" d="M169 191Q198 214 217 188" x={224} y={184} angle={90}/></>;
  if (pose === 'applaud') return <><Arm side="left" d="M72 193Q62 224 103 211" x={109} y={201} angle={30}/><Arm side="right" d="M169 195Q179 226 136 212" x={130} y={201} angle={-30}/></>;
  if (pose === 'bow') return <><Arm side="left" d="M72 193Q45 209 34 231" x={29} y={234} angle={-130}/><Arm side="right" d="M169 195Q164 220 129 215" x={121} y={214} hand="fist" angle={-70}/></>;
  if (pose === 'welcome') return <>{leftOpen}<Arm side="right" d="M169 195Q204 205 214 166" x={217} y={153} angle={20}/></>;
  if (pose === 'support') return <>{leftOpen}<Arm side="right" d="M169 195Q199 217 214 184" x={217} y={175} hand="thumb" angle={10}/></>;
  if (pose === 'balance') return <><Arm side="left" d="M72 193Q43 182 21 200" x={13} y={199} angle={-70}/><Arm side="right" d="M169 195Q199 183 220 200" x={228} y={199} angle={70}/></>;
  return <>{leftOpen}{rightOpen}</>;
}

const BROWS: Record<Expression, [string, string]> = {
  smug: ['M75 79q14-9 28-3', 'M137 72q14-7 27 2'],
  curious: ['M76 80q14-4 27 0', 'M138 68q13-9 25 1'],
  surprised: ['M76 67q14-10 27-2', 'M138 65q14-8 25 2'],
  flustered: ['M75 71q14-10 27-1', 'M138 74q13-7 26 2'],
  warm: ['M76 80q14-8 27-2', 'M138 78q14-6 25 2'],
  delighted: ['M76 75q14-9 27-2', 'M138 73q14-7 25 2'],
  worried: ['M76 78q14 0 27-10', 'M138 68q14 10 25 10'],
  sheepish: ['M76 73q14-7 27 1', 'M138 80q14-5 25 0'],
};
function BluffHead({ expression }: { expression: Expression }) {
  const happy = expression === 'warm' || expression === 'delighted';
  const pupilY = expression === 'curious' ? 101 : expression === 'worried' ? 108 : 105;
  const pupilX = expression === 'curious' ? 4 : expression === 'sheepish' ? -5 : 0;
  return <g class="bluff-head">
    <path d="M62 99 44 75l24 2-9-31 31 15 9-32 22 24 30-24 6 30 30-10-8 29 22 12-23 24z" fill="#fff0ad" stroke="#12324a" stroke-width="4" stroke-linejoin="round"/>
    <path class="bluff-hair-highlight" d="m75 60 20 12 9-23 15 16 23-22" fill="none" stroke="#fff9dc" stroke-width="5" stroke-linecap="round"/>
    <circle cx="59" cy="119" r="11" fill="#efb98e" stroke="#12324a" stroke-width="4"/><circle cx="181" cy="119" r="11" fill="#efb98e" stroke="#12324a" stroke-width="4"/>
    <ellipse cx="120" cy="113" rx="61" ry="65" fill="#f6c89e" stroke="#12324a" stroke-width="5"/>
    <path d="M70 116q-2 33 23 47" fill="none" stroke="#efb187" stroke-width="6" stroke-linecap="round"/>
    <g class="bluff-brows" fill="none" stroke="#12324a" stroke-width="6" stroke-linecap="round"><path class="bluff-brow-left" d={BROWS[expression][0]}/><path class="bluff-brow-right" d={BROWS[expression][1]}/></g>
    <g class="bluff-glasses">
      <g fill="#fffdf5" fill-opacity=".83" stroke="#12324a" stroke-width="5"><circle cx="90" cy="104" r="25"/><circle cx="150" cy="104" r="25"/><path d="M115 102h10M64 99l-9-3m121 3 9-3" fill="none"/></g>
      <g class="bluff-eyes" fill="#12324a">
        {happy ? <path d={expression === 'delighted' ? 'M79 106q11-14 22 0m38 0q11-14 22 0' : 'M81 106q9-10 18 0m42 0q9-10 18 0'} fill="none" stroke="#12324a" stroke-width="4" stroke-linecap="round"/> : <>{[91,149].map(x=><g class="bluff-pupil" key={x}><ellipse cx={x + pupilX} cy={pupilY} rx={expression === 'surprised' ? 4 : 5} ry={expression === 'surprised' || expression === 'flustered' ? 11 : expression === 'smug' ? 6 : 8}/><circle cx={x + pupilX + 1.4} cy={pupilY - 2.5} r="1.6" fill="#fffdf1"/></g>)}</>}
      </g>
      <path class="bluff-lens-shine" d="m73 94 9-9m55 16 17-17" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".75"/>
    </g>
    {happy && <g fill="#ed9d90" opacity=".65"><ellipse cx="75" cy="133" rx="9" ry="5"/><ellipse cx="165" cy="133" rx="9" ry="5"/></g>}
    <path d="m119 110-8 24 16 1" fill="#efb98e" stroke="#12324a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="bluff-moustache" d="M120 140q-23-18-40 8 20 11 40-1 20 12 40 1-18-26-40-8" fill="#fff0ad" stroke="#12324a" stroke-width="3"/>
    <g class="bluff-mouth" stroke="#12324a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      {expression === 'surprised' ? <ellipse cx="120" cy="160" rx="9" ry="12" fill="#543b59"/> : expression === 'flustered' ? <path d="M105 160q13-12 29 1-14 13-29-1z" fill="#fffdf1"/> : expression === 'worried' ? <path d="M107 165q13-12 26 0" fill="none"/> : expression === 'sheepish' ? <path d="M108 161q14 5 26-3" fill="none"/> : expression === 'curious' ? <path d="M113 162h14" fill="none"/> : expression === 'delighted' ? <><path d="M103 157q17 24 34 0z" fill="#543b59"/><path d="M113 167q7-5 14 0" stroke="#ef9b9c" stroke-width="4"/></> : <path d="M104 157q16 16 32 0" fill="#fffdf1"/>}
    </g>
  </g>;
}
export function ProfessorHead({ mood = 'confident' }: { mood?: ProfessorMood }) {
  return <svg class={`bluff-professor-head mood-${mood}`} viewBox="35 22 175 166" role="img" aria-label="Professor Bluffs Kopf"><BluffHead expression={expressionFor(mood)}/></svg>;
}
