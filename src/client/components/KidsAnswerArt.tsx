import type { StoryMotif } from '../../shared/kids-show-questions';

/** Ergänzt die bestehenden Bilder um inhaltlich genaue, auch ohne Lesen erkennbare Antworten. */
export function AnswerMotifArt({ motif }: { motif: StoryMotif }) {
  if (motif === 'one-day' || motif === 'three-days' || motif === 'forty-days') {
    const count = motif === 'one-day' ? 1 : motif === 'three-days' ? 3 : 40;
    return <g>
      <rect x="15" y="20" width="190" height="108" rx="13" fill="#fffdf1"/>
      <path d="M15 46h190" stroke="#cfb885"/>
      <path d="M52 12v19m116-19v19" stroke-width="8"/>
      {count === 40 ? <>
        <text x="110" y="84" text-anchor="middle" font-size="43" font-weight="900" fill="#12324a" stroke="none">40</text>
        {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={38 + (i % 10) * 16} cy={94 + Math.floor(i / 10) * 8} r="2.7" fill="#d49a26" stroke="none"/>)}
      </> : Array.from({ length: count }, (_, i) => <g key={i} transform={`translate(${count === 1 ? 88 : 35 + i * 55} 60)`}>
        <circle cx="13" cy="15" r="12" fill="#ffd362"/>
        <path d="M13-4v-5m0 43v5M-6 15h-5m43 0h5M0 2l-4-4m30 30 4 4M0 28l-4 4M26 2l4-4" stroke="#c58a1c" stroke-width="2.5"/>
        <path d="M20 42q-13 13-23-1 13 5 11-10 4 4 12 11" fill="#9c8cc8" stroke-width="2"/>
      </g>)}
    </g>;
  }
  if (motif === 'coin-bread') return <g>
    <Loaf x={42} y={49} scale={1.25}/>
    <path d="M91 94q14-25 35 0v25H91z" fill="#fff0b0"/>
    <GoldCoin x={109} y={95} r={19}/>
  </g>;
  if (motif === 'coin-pillow') return <g>
    <GoldCoin x={140} y={106} r={22}/>
    <path d="M30 41q76-22 157 0l-9 56q-76-14-143 0z" fill="#fffdf5"/>
    <path d="M43 47q67-14 129 0l-6 36q-64-10-116 0z" fill="#ddd4ef" stroke="#a594bf" stroke-width="2"/>
    <path d="m32 40-8-9m163 9 9-8m-19 66 10 7M35 98l-10 8"/>
  </g>;
  if (motif === 'raven') return <g>
    <path d="m87 105-13 23m50-23 10 23m-70 0h23m41 0h23" fill="none"/>
    <path d="M48 55q18-20 57-5 28-34 60-9 28 35-3 60-39 26-72 3L31 91l29-12z" fill="#56586e"/>
    <path d="m159 56 37 12-35 9" fill="#dfaa54"/>
    <path d="M63 68q65-18 59 30-32 12-59-30" fill="#777c96"/>
    <circle cx="148" cy="50" r="6" fill="#fff" stroke="none"/><circle cx="150" cy="50" r="2.8" fill="#12324a" stroke="none"/>
  </g>;
  if (motif === 'camel') return <g>
    <path d="m55 97-8 30m36-29-2 29m47-29 4 29m15-35 11 35" fill="none" stroke="#b98650" stroke-width="12"/>
    <path d="M29 91q-10-32 10-30" fill="none" stroke="#b98650" stroke-width="7"/>
    <path d="M39 68q7-35 28-32 19-1 23 32 19-6 37-1l11-45 25-3 17 18-18 13-4 39q-41 33-104 15z" fill="#d9ae72"/>
    <path d="m145 22-3-14 14 9m-78 39 7 9" fill="#c38e55"/>
    <circle cx="158" cy="30" r="3.5" fill="#12324a" stroke="none"/>
    <path d="m166 40 10-3"/>
  </g>;
  if (motif === 'five-breads-two-fish') return <g>
    {[[30,27],[86,27],[142,27],[58,67],[114,67]].map(([x,y],i)=><Loaf key={i} x={x} y={y} scale={.6}/>)}
    <SmallFish x={40} y={108}/><SmallFish x={116} y={108}/>
  </g>;
  if (motif === 'three-breads-milk') return <g>
    {[[22,31],[83,31],[52,78]].map(([x,y],i)=><Loaf key={i} x={x} y={y} scale={.65}/>)}
    <path d="M161 46h21v23q18 15 13 40-17 20-44 0-5-25 10-40z" fill="#fbfaf4"/>
    <path d="M182 68q30-4 22 23l-10 3" fill="none"/>
    <path d="M158 88q17 8 32 0v20q-14 10-32 0z" fill="#b9dbed" stroke="none"/>
    <ellipse cx="172" cy="46" rx="11" ry="4" fill="#d6c4a9"/>
  </g>;
  if (motif === 'seven-figs-cheese') return <g>
    {[[26,31],[64,31],[102,31],[26,72],[64,72],[102,72],[64,110]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}>
      <path d="M0-11q-2 9-11 15-8 16 11 17 19-1 11-17Q2-2 0-11" fill="#a580bb" stroke-width="2.5"/>
      <path d="m0-10 2-7" stroke="#569258" stroke-width="3"/>
    </g>)}
    <path d="m137 78 43-33 25 42v26h-68z" fill="#ffd978"/>
    <path d="m137 78 68 9" stroke="#c28b36"/>
    <circle cx="157" cy="96" r="5" fill="#e6ac45" stroke="none"/><circle cx="187" cy="100" r="4" fill="#e6ac45" stroke="none"/>
  </g>;
  if (motif === 'runner') return <g>
    <path d="M25 54h39M15 73h43M29 92h25" fill="none" stroke="#77a9b8" stroke-width="5"/>
    <circle cx="138" cy="28" r="16" fill="#efb98e"/>
    <path d="M124 49 99 77l33 17 27-34z" fill="#81cfbd"/>
    <path d="m119 55-24-9-16 15m65 2 21 14 20-15M105 80l-15 26-28 3m66-20 16 22-13 18" fill="none" stroke-width="11"/>
    <path d="m58 109 14 3m56 18 15-1" stroke="#8e654b" stroke-width="10"/>
  </g>;
  if (motif === 'small') return <g>
    <path d="M164 18v108h26M164 27h17m-17 20h10m-10 20h17m-17 20h10m-10 20h17" stroke="#8b9faa" fill="none" stroke-width="4"/>
    <circle cx="87" cy="69" r="23" fill="#efb98e"/>
    <path d="M65 65q-2-33 24-27 26-4 21 27L97 51l-8 6-10-5z" fill="#8e654b"/>
    <path d="m79 71 1 1m15-1 1 1m-17 9q8 7 16 0" fill="none"/>
    <path d="M64 125v-21q23-26 46 0v21" fill="#eaa0ab"/>
    <path d="M127 45v78m-7-71 7-7 7 7m-14 64 7 7 7-7" stroke="#6a9893" fill="none" stroke-width="2.5"/>
  </g>;
  return null;
}

function GoldCoin({ x, y, r }: { x:number; y:number; r:number }) {
  return <g><circle cx={x} cy={y} r={r} fill="#ffd362"/><circle cx={x} cy={y} r={r*.7} fill="none" stroke="#b18426" stroke-width="2"/><path d={`M${x} ${y-8}v16m-5-14 5-3`} stroke="#b18426" stroke-width="2.5"/></g>;
}
function Loaf({ x, y, scale = 1 }: { x:number; y:number; scale?:number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M0 42V21Q0 0 37 0t37 21v21z" fill="#dfa054"/>
    <path d="m16 13 6 13m14-15 6 13m13-11 6 13" stroke="#fff0b0" stroke-width="4"/>
  </g>;
}
function SmallFish({ x, y }: { x:number; y:number }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d="M12 0q25-24 48 0-23 25-48 0L0-12v24z" fill="#79c9c6" stroke-width="2.5"/>
    <circle cx="48" cy="-3" r="2.5" fill="#12324a" stroke="none"/>
  </g>;
}
