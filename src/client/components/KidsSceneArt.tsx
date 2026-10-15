import { KIDS_SCENES, type KidsSceneMotif } from '../../shared/kids-scenes';

/** Große, eigenständige Bildergeschichte; drei erkennbare Handlungsschritte statt eines Symbol-Resets. */
export function KidsSceneArt({ scene, beat }: { scene:KidsSceneMotif; beat:0|1|2 }) {
  return <svg class={`kids-cinema-art scene-${scene} beat-${beat}`} viewBox="0 0 1000 500" role="img" aria-label={KIDS_SCENES[scene].description}>
    <defs><linearGradient id={`scene-sky-${scene}`} x2="0" y2="1"><stop stop-color={scene==='manger' ? '#273d69' : '#bde5e5'}/><stop offset="1" stop-color={scene==='manger' ? '#677ca3' : '#f5f6d9'}/></linearGradient></defs>
    <rect width="1000" height="500" fill={`url(#scene-sky-${scene})`}/>
    <g stroke="#12324a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      {scene==='ark' ? <ArkScene/> : scene==='manger' ? <MangerScene/> : scene==='lion' ? <LionScene/> : <BoatScene/>}
    </g>
  </svg>;
}

function Sun() { return <g class="scene-sun"><circle cx="840" cy="85" r="40" fill="#ffd362" stroke="#c58a1c"/>{Array.from({length:8},(_,i)=><path key={i} d="M840 25v-12" transform={`rotate(${i*45} 840 85)`} stroke="#c58a1c"/>)}</g>; }
function Clouds() { return <g class="scene-clouds" fill="#e5edf1" stroke="none"><path d="M0 72Q45 15 105 61q18-67 85-32 65-6 80 52H0zm590-9q35-54 89-30 47-49 94 2 73-26 102 37H590z"/><path d="M276 48q18-37 53-26 20-36 69-15 42-10 69 41z"/></g>; }
function Rain() { return <g class="scene-rain" stroke="#549aba" stroke-width="5" opacity=".7">{Array.from({length:25},(_,i)=><g key={i} transform={`translate(${(i*137)%1030} ${20+(i*83)%260})`}><path class="scene-raindrop" d="m0 0-13 29" style={{'--drop-delay':`${i%7*-.13}s`}}/></g>)}</g>; }
function Waves() { return <g class="scene-water" stroke="#3c98aa" stroke-width="4"><path d="M0 399q50-35 100 0t100 0 100 0 100 0 100 0 100 0 100 0 100 0 100 0 100 0v101H0z" fill="#78c9d2"/><g class="scene-wave-lines" fill="none"><path d="M-50 442q50-25 100 0t100 0 100 0 100 0 100 0 100 0 100 0 100 0 100 0 100 0 100 0"/><path d="M0 477q50-20 100 0t100 0 100 0 100 0 100 0 100 0 100 0 100 0 100 0 100 0"/></g></g>; }

function ArkScene() { return <>
  <Sun/><Clouds/><path d="M0 405q200-30 420 0t580 0v95H0z" fill="#c9db9c" stroke="none"/>
  <g class="scene-ark-float"><g class="scene-ark-ship">
    <path d="M310 330h545l-75 110H390z" fill="#bb8150"/><path d="M346 360h465M365 391h425M400 420h367" fill="none" stroke="#8c5d39"/>
    <path d="M385 326V205h365v121" fill="#ffe2a0"/><path d="m350 205 217-99 220 99z" fill="#d57a67"/><path d="M523 329v-97h92v97" fill="#694f48"/>
    <g class="scene-onboard"><g transform="translate(411 246)"><Animal kind="sheep"/></g><g transform="translate(658 242)"><Animal kind="giraffe"/></g><circle cx="575" cy="263" r="18" fill="#efb98e"/><path d="M554 257q18-30 40 0m-33 15q14 26 27 0" fill="#fff0ad"/></g>
  </g></g>
  <path class="scene-gangplank" d="m190 425 335-95 7 17-335 95z" fill="#c89762"/>
  <g class="scene-builder" transform="translate(230 235)"><ScenePerson robe="#81c3b3" beard/><g class="scene-hammer-arm"><path d="m66 99 46-15 13-35" fill="none" stroke="#efb98e" stroke-width="14"/><path d="m123 51 14-34" stroke="#906744" stroke-width="10"/><path d="m123 18 30 12" stroke="#7a8e98" stroke-width="17"/></g></g>
  <g class="scene-animal-board"><g transform="translate(75 342)"><Animal kind="sheep"/></g><g transform="translate(180 300)"><Animal kind="giraffe"/></g></g>
  <g class="scene-ark-weather"><Rain/><Waves/></g>
</>; }
function MangerScene() { return <>
  <g class="scene-stars" fill="#fff0ad" stroke="none">{[[80,60],[150,170],[280,45],[718,60],[865,160],[930,50],[72,280]].map(([x,y],i)=><path key={i} d={`m${x} ${y-7} 3 5 6 2-6 3-3 6-3-6-6-3 6-2z`}/>)}</g>
  <path d="M0 427q300-32 500 0t500 0v73H0z" fill="#c9b48d" stroke="none"/>
  <path d="M195 420V145h610v275" fill="#b98b62"/><path d="m155 147 345-110 345 110z" fill="#7e6253"/>
  <path d="M235 420V165h530v255" fill="#856955" stroke="none"/><path d="M235 385h530M255 180v200m480-200v200" stroke="#aa835c"/>
  <g transform="translate(500 72)"><g class="scene-guiding-star"><path d="m0-49 12 33 34 4-27 22 9 34L0 25l-28 19 9-34-27-22 34-4z" fill="#ffd362" stroke="#b58d31"/><circle r="63" fill="none" stroke="#ffe7a1" stroke-width="2" opacity=".55"/></g></g>
  <g class="scene-parents"><g transform="translate(300 234)"><ScenePerson robe="#80c6d5" hair="#654d42"/></g><g transform="translate(638 232)"><ScenePerson robe="#ceaaa9" beard hair="#685244"/></g></g>
  <path d="m292 434 33-18m-20 40 22-13m403-10-38-18m16 44-27-15m-304-6 13 18m-10-42 20 20m278-9-14 20" stroke="#ebd17e"/>
  <g transform="translate(410 319)"><g class="scene-cradle">
    <path d="m-17 24 40 85h148l39-85z" fill="#c89862"/><path d="m23 107-16 25m162-25 18 25" stroke="#78533d" stroke-width="9"/>
    <path d="m-12 22 29-18 22 18L65 2l26 20 21-19 28 19 24-18 36 18" fill="#f3d57e"/>
    <ellipse cx="108" cy="29" rx="62" ry="31" fill="#f7f2dc"/><path d="m96 3 15 54m10-52 15 45" stroke="#e3d6bc" stroke-width="3"/>
    <circle cx="44" cy="21" r="25" fill="#efb98e"/><path d="m29 20q6 8 12 0m8 0q6 8 12 0m-20 12q5 5 10 0" fill="none" stroke-width="3"/>
  </g></g>
  <g class="scene-sleep-marks" fill="#fff0ad" stroke="none"><text x="578" y="288" font-size="34" font-weight="800">z</text><text x="611" y="259" font-size="24" font-weight="800">z</text></g>
</>; }
function LionScene() { return <>
  <path d="M0 0h1000v500H0z" fill="#e0c7ab" stroke="none"/><path d="M101 450V245q0-192 400-197 398 5 398 197v205" fill="#ac907e" stroke="#927867" stroke-width="12"/>
  <path d="M152 443V258q0-158 350-161 345 3 345 161v185" fill="#f3dfb5" stroke="none"/>
  <path d="m17 130 73-28m-56 97 56-16m822-84 65 30m-56 64 66 25M37 347l50 3m839 4 50-8" stroke="#bea187" stroke-width="9"/>
  <ellipse cx="500" cy="429" rx="435" ry="37" fill="#d9bd94" stroke="none"/>
  <g class="scene-angel"><path d="M483 213q-155 23-183-104 92-10 183 104m34 0q155 23 183-104-92-10-183 104" fill="#fffaf0" stroke="#d9ba79"/><path d="m324 134 98 60m253-60-98 60" stroke="#ead9b6" stroke-width="3"/><circle cx="500" cy="136" r="28" fill="#f6ccab"/><path d="M471 136q0-47 29-37 35-8 29 37l-27-20z" fill="#e9c574"/><ellipse cx="500" cy="83" rx="35" ry="9" fill="none" stroke="#d6ac43"/><path d="m482 163-33 87h104l-33-87" fill="#fffdf1"/></g>
  <g transform="translate(455 243)"><ScenePerson robe="#8fbfcb" beard/><path d="m29 95 16 21 14-21" fill="none" stroke="#efb98e" stroke-width="12"/></g>
  <g transform="translate(168 277)"><g class="scene-lion-rest"><FriendlyLion/></g></g><g transform="translate(656 277)"><g class="scene-lion-rest"><FriendlyLion/></g></g>
  <g class="scene-peace-hearts" fill="#cf8e9a" stroke="none"><path d="M358 285c-19-24-43 9 0 33 43-24 19-57 0-33m279 0c-19-24-43 9 0 33 43-24 19-57 0-33"/></g>
</>; }
function BoatScene() { return <>
  <Sun/><Clouds/><Rain/>
  <g class="scene-boat-rock"><g class="scene-small-boat">
    <g transform="translate(340 244) scale(.72)"><ScenePerson robe="#dba079" beard/></g><g transform="translate(437 235) scale(.72)"><ScenePerson robe="#9fb984" beard/></g>
    <g class="scene-sleeper"><rect x="563" y="322" width="90" height="35" rx="13" fill="#fffdf5"/><path d="M613 326q76-53 137 12l-10 26H595z" fill="#9c8cc8"/><circle cx="593" cy="321" r="24" fill="#efb98e"/><path d="M570 312q21-23 45 0m-34 9q7 9 14 0" fill="none" stroke="#765447"/><path d="m583 333 18 11 18-14" fill="#765447"/>
      <text x="666" y="289" font-size="33" font-weight="800" fill="#12324a" stroke="none">z z</text>
    </g>
    <g class="scene-standing" transform="translate(574 176)"><ScenePerson robe="#f8efda" beard/><path d="m68 95 30-29 2-45m-9 12 8-13 8 14" fill="none" stroke="#efb98e" stroke-width="13"/><path d="m23 85 29 70" stroke="#b58e81" stroke-width="12"/></g>
    <path d="M271 357h521l-60 93H330z" fill="#bd8753"/><path d="M299 383h464M318 412h427" stroke="#926238"/><path d="m300 345 465 0" stroke="#e0b279" stroke-width="10"/>
  </g></g>
  <Waves/>
  <g class="scene-calm-birds" fill="none" stroke="#557c91"><path d="M180 126q13-14 26 0 13-14 26 0m440-34q13-14 26 0 13-14 26 0"/></g>
</>; }

function ScenePerson({ robe, hair='#745544', beard=false }: { robe:string; hair?:string; beard?:boolean }) { return <>
  <path d="m25 149-7 29m45-29 7 29" stroke="#614f43" stroke-width="13"/>
  <path d="M20 74q24-23 48 0l18 81H4z" fill={robe}/><path d="m19 88-15 32m64-32 15 30" stroke="#efb98e" stroke-width="13"/>
  <circle cx="44" cy="43" r="31" fill="#efb98e"/><path d="M13 40q-3-42 32-38 34-2 30 38L57 23 41 29 28 21z" fill={hair}/>
  {beard && <path d="M17 54q28 51 55 0L55 67H35z" fill={hair}/>}<path d="m29 44 1 1m26-1 1 1m-22 11q9 9 18 0" fill="none" stroke-width="3.5"/>
</>; }
function Animal({ kind }: { kind:'sheep'|'giraffe' }) { return kind==='sheep' ? <g>
  <path d="m13 61-2 27m47-26 2 26" stroke="#796052" stroke-width="8"/>
  <path d="M2 38q-7-19 14-23 8-21 28-8 23-11 30 12 17 13 5 33-4 28-30 18-25 14-36-8-21-1-11-24" fill="#fffaf0"/>
  <ellipse cx="70" cy="39" rx="21" ry="26" fill="#c79e7b"/><path d="m52 22-13-7m47 7 14-7" stroke="#c79e7b" stroke-width="10"/><circle cx="76" cy="37" r="3" fill="#12324a" stroke="none"/><path d="m76 50 5-2"/>
  </g> : <g><path d="m9 70 1 33m45-33 4 33" stroke="#dba759" stroke-width="8"/><path d="M4 51h47V-7h20v80H4z" fill="#edc879"/><ellipse cx="75" cy="-7" rx="27" ry="17" fill="#edc879"/><path d="m59-18-6-13m18 11 1-14" stroke="#9d7443" stroke-width="5"/><circle cx="83" cy="-12" r="3" fill="#12324a" stroke="none"/><path d="m14 57 7 4m17-4 4 7m18-35 7 3m-7-26 6 3" stroke="#b88346" stroke-width="8"/></g>; }
function FriendlyLion() { return <>
  <path d="M21 119q-38-4-23-38" fill="none" stroke="#bc7843" stroke-width="10"/>
  <ellipse cx="78" cy="119" rx="74" ry="33" fill="#e6b461"/><path d="M25 139h31m56 0h28" stroke="#bd874a" stroke-width="14"/>
  <g class="scene-lion-head"><circle cx="88" cy="67" r="63" fill="#bb7843"/><circle cx="88" cy="72" r="44" fill="#ffd47d"/>
  <path d="M62 61q9-10 18 0m18 0q9-10 18 0m-38 18h19l-9 10z" fill="#12324a"/><path d="M88 89v11m-18-1q18 15 36 0" fill="none"/>
  <path d="m51 81-21-4m22 15-23 4m96-15 21-4m-22 15 23 4" stroke-width="3"/></g>
</>; }
