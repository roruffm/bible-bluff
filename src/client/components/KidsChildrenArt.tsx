const SKIN = ['#bd805a','#efbd93','#84523c','#f4d1b0','#ce956b','#a76e4b'];
const SHIRTS = ['#66bfb0','#ec9faf','#86aadd','#b69ad4','#efbc50','#79bd89'];
/** Kleine Vektorfiguren für die verständlichen Bewegungsbilder. */
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
