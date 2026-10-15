const SKIN = ['#bd805a','#efbd93','#84523c','#f4d1b0','#ce956b','#a76e4b'];
const SHIRTS = ['#66bfb0','#ec9faf','#86aadd','#b69ad4','#efbc50','#79bd89'];
/** Kleine Vektorfiguren für das Schatzbild und die verständlichen Bewegungsbilder. */
export function ChildFigure({ index = 0, wheelchair = false }: { index?: number; wheelchair?: boolean }) {
  const skin=SKIN[index%SKIN.length], shirt=SHIRTS[index%SHIRTS.length], hair=['#503b32','#8c603d','#332e34','#dda54a'][index%4];
  return <g class="kids-child-figure" fill="none" stroke="#12324a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="m-6 10-9-6m21 6 9-6" stroke={skin} stroke-width="4"/>
    {wheelchair ? <><circle cx="7" cy="24" r="9" stroke="#12324a" stroke-width="2.5"/><path d="M-7 9v16h15m-2-5h9l4 9" stroke="#12324a" stroke-width="2.5"/></> : <path d="m-4 19-1 11m9-11 1 11" stroke="#12324a" stroke-width="3"/>}
    <path d="m-7 9-2 13H9L7 9z" fill={shirt}/>
    <circle cy="0" r="8" fill={skin}/>
    {index%3===0 ? <path d="M-8 1q-6-13 4-12 6-5 11 1 7 0 2 12L5-5-1-2-5-4z" fill={hair} stroke={hair}/> : index%3===1 ? <path d="M-8-1q-3-13 8-10 11-3 8 10L2-6-2-3z" fill={hair} stroke={hair}/> : <path d="M-8 1q-7-15 8-12 15-3 8 12l-3-8-5 3-4-3z" fill={hair} stroke={hair}/>}
    <path d="M-3 0v.5m6-.5v.5m-5 3q2 3 4 0" stroke-width="1.2"/>
  </g>;
}
export function CrownTreasureArt() {
  return <svg viewBox="0 0 300 180" role="img" aria-label="Eine goldene Krone, umringt von zwölf fröhlichen Kindern">
    <rect width="300" height="180" fill="#e3f2ed"/>
    <ellipse cx="150" cy="89" rx="139" ry="78" fill="#fff6d9"/>
    <ellipse cx="150" cy="86" rx="116" ry="54" fill="none" stroke="#e6c875" stroke-width="3" stroke-dasharray="2 8"/>
    <g class="kids-treasure-crown" stroke="#12324a" stroke-width="2.5" stroke-linejoin="round">
      <ellipse cx="150" cy="126" rx="48" ry="7" fill="#ddc68b" stroke="none"/>
      <path d="m98 65 24 22 28-37 28 37 24-22-11 53h-82z" fill="#ffd362"/>
      <path d="m101 73 14 35h70l14-35-21 26-28-37-28 37z" fill="#f1b843" stroke="none"/>
      <path d="M109 107h82v14h-82z" fill="#ffe9a1"/>
      <path d="m150 83 9 11-9 10-9-10z" fill="#70c9ba"/>
      <circle cx="122" cy="99" r="4" fill="#e58ba3"/><circle cx="178" cy="99" r="4" fill="#a08ccf"/>
      <circle cx="98" cy="64" r="4" fill="#fff0ad"/><circle cx="150" cy="49" r="4" fill="#fff0ad"/><circle cx="202" cy="64" r="4" fill="#fff0ad"/>
    </g>
    {Array.from({length:12},(_,i)=>{const a=(i*30-90)*Math.PI/180;return <g key={i} transform={`translate(${(150+117*Math.cos(a)).toFixed(1)} ${(i===0 ? 17 : 82+55*Math.sin(a)).toFixed(1)}) scale(${i===0 ? .85 : 1})`}><ChildFigure index={i} wheelchair={i===3}/></g>;})}
    <g fill="#e6b540"><path d="m81 70 2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="m218 111 2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></g>
  </svg>;
}
