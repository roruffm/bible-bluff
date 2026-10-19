import type { ComponentChildren } from 'preact';
import { useId } from 'preact/hooks';
import { KIDS_SCENES, type KidsSceneMotif } from '../../shared/kids-scenes';
import { Cheek, Cloud, Eye, Flower, Frown, Happy, Hull, Kid, Manger, Smile, Spark, Star, Sun } from './KidsCuteParts';

/** Große Bildergeschichte im Stil der Antwortkarten, drei erkennbare Handlungsschritte.
 * Die Schritte (beat) blenden Figuren ein und aus; Auftritte laufen nach Szenenzeit und stehen nach dem Neuladen an derselben Stelle. */
export function KidsSceneArt({ scene, beat }: { scene:KidsSceneMotif; beat:0|1|2 }) {
  const id = useId();
  return <svg class={`kids-cinema-art scene-${scene} beat-${beat}`} viewBox="0 0 1000 500" role="img" aria-label={KIDS_SCENES[scene].description}>
    <g stroke="#12324a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
      {scene==='ark' ? <ArkScene/> : scene==='manger' ? <MangerScene id={id}/> : scene==='lion' ? <LionScene/> : <BoatScene/>}
    </g>
  </svg>;
}

/** Auftritt at Sekunden nach Szenenbeginn. */
function Enter({ at, how = 'pop', children }: { at:number; how?:'pop'|'fade'|'drop'|'left'|'right'; children:ComponentChildren }) {
  return <g class={`scene-enter scene-${how}`} style={{ '--at': `${at}s` }}>{children}</g>;
}
const Sky = ({ fill }: { fill:string }) => <rect width="1000" height="500" fill={fill} stroke="none"/>;
const Heart = ({ x, y, s = 1 }: { x:number; y:number; s?:number }) => <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -6q-8-10-16-2t16 16q24-8 16-16t-16 2z" fill="#ff8ea8" stroke-width="2.5"/>;
const Sea = ({ y, fill, line, wave = 14 }: { y:number; fill:string; line:string; wave?:number }) => <>
  <path d={`M-100 ${y}${`q40 ${-wave} 80 0t80 0`.repeat(8)}V500h-1400z`} fill={fill}/>
  <path class="scene-wave-line" d={`M-100 ${y + 40}${`q40 ${-wave * .8} 80 0t80 0`.repeat(8)}`} fill="none" stroke={line} stroke-width="5"/>
</>;
function Rain() {
  return <g class="scene-rain">{Array.from({ length:34 }, (_, i) => <g key={i} transform={`translate(${(i * 131) % 1000 + 10} ${(i * 67) % 200})`}><path class="scene-raindrop" style={{ '--d': `${-(i % 9) * .1}s` }} d="M0 -12q8 10 8 16a8 8 0 0 1-16 0q0-6 8-16z" fill="#8fd3f0" stroke-width="3"/></g>)}</g>;
}
/** Kleine Schäfchenwolke mit Gesicht, für Regen und Sturm. */
function FaceCloud({ x, y, s, grumpy = false }: { x:number; y:number; s:number; grumpy?:boolean }) {
  return <><Cloud x={x} y={y} s={s} fill={grumpy ? '#a9b6cc' : '#e3e9f2'}/><g transform={`translate(${x} ${y}) scale(${s})`}>
    {grumpy ? <><Eye x={13} y={-3} s={.3}/><Eye x={23} y={-3} s={.3}/><Frown x={18} y={1} s={.3}/></> : <><Happy x={13} y={-3} s={.32}/><Happy x={23} y={-3} s={.32}/></>}
    <Cheek x={10} y={0} s={.28}/><Cheek x={26} y={0} s={.28}/>
  </g></>;
}
/** Wolliges Schaf; lying = liegt und schläft. */
function Sheep({ lying = false }: { lying?:boolean }) {
  const wool = [[-18, 0], [-6, -9], [8, -9], [18, 0], [6, 9], [-8, 9]];
  return <>
    {!lying && <path d="M-16 12v16m10-16v16m14-16v16m10-16v16" stroke-width="5"/>}
    {wool.map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="12" fill="#fffdf6"/>)}
    {wool.map(([x, y]) => <circle key={`i${x}${y}`} cx={x} cy={y} r="12" fill="#fffdf6" stroke="none"/>)}
    <ellipse cx="0" cy="0" rx="20" ry="12" fill="#fffdf6" stroke="none"/>
    <g transform={lying ? 'translate(4 8)' : undefined}>
      <ellipse cx="17" cy="-22" rx="7" ry="4" fill="#e9dfd4" transform="rotate(-30 17 -22)"/><ellipse cx="41" cy="-22" rx="7" ry="4" fill="#e9dfd4" transform="rotate(30 41 -22)"/>
      <ellipse cx="29" cy="-14" rx="12" ry="14" fill="#e9dfd4"/><circle cx="29" cy="-27" r="7" fill="#fffdf6"/>
      {lying ? <><Happy x={24} y={-14} s={.45}/><Happy x={34} y={-14} s={.45}/></> : <g class="blink"><Eye x={24} y={-15} s={.45}/><Eye x={34} y={-15} s={.45}/></g>}
      <Cheek x={21} y={-8} s={.4}/><Cheek x={37} y={-8} s={.4}/>
    </g>
  </>;
}
function Giraffe() {
  return <>
    <path d="M-18 8v28m10-28v28m22-28v28m10-28v28" stroke="#e0a85a" stroke-width="7"/>
    <path d="M-30 -2q-8 4-8 12" fill="none" stroke-width="3"/>
    <path d="M10 -2V-64q0-14 8-14t8 14v62" fill="#ffd36e"/><ellipse cx="0" cy="4" rx="30" ry="16" fill="#ffd36e"/>
    <circle cx="18" cy="-82" r="12" fill="#ffd36e"/><path d="M11 -92l-1-8m15 8 1-8" stroke-width="3"/>
    {[[-12, 0], [4, 8], [-2, -4], [16, -40], [20, -60], [14, -20]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="3" fill="#d9963a" stroke="none"/>)}
    <g class="blink"><Eye x={14} y={-84} s={.45}/><Eye x={22} y={-84} s={.45}/></g><Cheek x={11} y={-78} s={.45}/><Cheek x={25} y={-78} s={.45}/>
  </>;
}
function Bear() {
  return <>
    <path d="M-12 10v16m26-16v16" stroke="#a87a52" stroke-width="9"/>
    <ellipse cx="0" cy="2" rx="22" ry="17" fill="#c99467"/>
    <circle cx="8" cy="-28" r="6" fill="#c99467"/><circle cx="28" cy="-28" r="6" fill="#c99467"/>
    <circle cx="18" cy="-16" r="16" fill="#c99467"/><ellipse cx="21" cy="-10" rx="7" ry="5" fill="#f1d9b8" stroke-width="2"/>
    <g class="blink"><Eye x={13} y={-18} s={.45}/><Eye x={24} y={-18} s={.45}/></g><Cheek x={9} y={-11} s={.4}/><Cheek x={29} y={-11} s={.4}/>
  </>;
}
/** Noah wie auf der Antwortkarte „Noah baut die Arche“. */
const Noah = ({ x, y, s = 1 }: { x:number; y:number; s?:number }) => <Kid x={x} y={y} s={s} hair="#fffdf6" beard="#fffdf6" robe="#c7a6f0"/>;

function ArkScene() {
  return <>
    <Sky fill="#cdeffd"/>
    <rect class="scene-from-2" width="1000" height="500" fill="#a6b6cf" fill-opacity=".8" stroke="none"/>
    <g class="scene-before-2"><Sun x={880} y={92} r={40} rays={[8, 22]}/><Cloud x={70} y={80} s={3}/><Cloud x={500} y={60} s={2.4}/></g>
    <g class="scene-from-2"><Enter at={8.8} how="fade"><g fill="none" stroke-width="14"><path d="M70 300a130 130 0 0 1 260 0" stroke="#ff9fb4"/><path d="M84 300a116 116 0 0 1 232 0" stroke="#ffe17a"/><path d="M98 300a102 102 0 0 1 204 0" stroke="#9fe0c8"/></g></Enter></g>
    <path d="M0 392q250-40 500-12t500-6V500H0z" fill="#a9e08f"/>
    <Flower x={60} y={420} s={2.4}/><Flower x={130} y={452} s={2.4} fill="#ffd96a"/><Flower x={950} y={430} s={2.4} fill="#b9a7f0"/>
    <g class="scene-ark-rise"><g class="scene-ark-rock"><g transform="translate(400 102) scale(2.6)" stroke-width="2.7">
      <g class="scene-only-0" fill="none" stroke="#c98d55" stroke-width="3.2"><path d="M40 86V58m26 28V48m26 38V43m26 43V42m26 44V45m26 41V54"/><path d="M34 60q76-36 148-6"/></g>
      <g class="scene-from-1"><Enter at={3}>
        <rect x="58" y="42" width="104" height="44" rx="14" fill="#ffe08f"/><path d="M50 46q60-42 120 0z" fill="#f08a80"/>
        <path d="M64 86V66q0-9 10-9t10 9v20z" fill="#c98d55"/>
        <circle cx="110" cy="62" r="12" fill="#fff8e6"/><circle cx="140" cy="62" r="12" fill="#fff8e6"/>
      </Enter></g>
      <g class="scene-from-2 scene-onboard"><Enter at={7.4} how="fade">
        <path d="M84 40V20q0-8 6-8t6 8v20" fill="#ffd36e"/><circle cx="90" cy="6" r="8" fill="#ffd36e"/><path d="M85 0l-1-5m11 5 1-5" stroke-width="2"/>
        <Eye x={87} y={5} s={.32}/><Eye x={93} y={5} s={.32}/><Cheek x={85} y={9} s={.3}/><Cheek x={95} y={9} s={.3}/>
        <circle cx="110" cy="64" r="8" fill="#c99467"/><circle cx="104" cy="57" r="3.4" fill="#c99467"/><circle cx="116" cy="57" r="3.4" fill="#c99467"/><Eye x={107} y={63} s={.32}/><Eye x={113} y={63} s={.32}/>
        <circle cx="140" cy="64" r="8" fill="#fffdf6"/><path d="M133 58q7-7 14 0" fill="#fffdf6"/><Eye x={137} y={63} s={.32}/><Eye x={143} y={63} s={.32}/>
        <Noah x={74} y={72} s={.42}/>
      </Enter></g>
      <Hull/>
      <g class="scene-only-0"><path class="scene-knock" d="M30 64l-6-6m4 14h-8m14-16v-8" fill="none" stroke="#ffb547" stroke-width="2"/></g>
    </g></g></g>
    <g class="scene-only-1"><path d="M296 446 572 326l8 14-276 120z" fill="#c89762"/><path d="M338 438l-6-14m62-12-6-14m62-12-6-14m62-12-6-14" stroke="#9c6d43" stroke-width="4"/></g>
    <g class="scene-only-0 scene-builder" transform="translate(380 250) scale(2.4)" stroke-width="2.9">
      <Noah x={0} y={0}/>
      <g class="scene-hammer-arm"><path d="M10 32 32 20" stroke-width="7"/><path d="M10 32 32 20" stroke="#ffdcc4" stroke-width="3.6"/><g transform="rotate(-25 34 12)"><rect x="31" y="-2" width="6" height="26" rx="3" fill="#c99467"/><rect x="24" y="-8" width="20" height="10" rx="3" fill="#9aa6b8"/></g></g>
    </g>
    <g class="scene-only-1"><Enter at={3.3}><g transform="translate(868 232) scale(1.5)" stroke-width="3.2">
      <g class="scene-wave-arm"><path d="M12 30 26 8" stroke-width="7"/><path d="M12 30 26 8" stroke="#ffdcc4" stroke-width="3.6"/><circle cx="27" cy="6" r="5" fill="#ffdcc4"/></g>
      <Noah x={0} y={0}/>
    </g></Enter></g>
    <g class="scene-only-1 scene-animal-board">
      <g class="scene-walker" style={{ '--at': '3s' }}><g class="scene-hop"><g transform="translate(300 410) scale(1.5)"><Giraffe/></g></g></g>
      <g class="scene-walker" style={{ '--at': '3.55s' }}><g class="scene-hop"><g transform="translate(300 420) scale(1.5)"><Sheep/></g></g></g>
      <g class="scene-walker" style={{ '--at': '4.1s' }}><g class="scene-hop"><g transform="translate(300 418) scale(1.5)"><Bear/></g></g></g>
    </g>
    <g class="scene-from-2"><Enter at={6.5} how="drop"><FaceCloud x={120} y={92} s={4.2}/><FaceCloud x={780} y={74} s={3.6}/></Enter></g>
    <g class="scene-from-2"><Rain/></g>
    <g class="scene-from-2"><g class="scene-flood"><Sea y={352} fill="#7cc8e8" line="#45a6c8"/></g></g>
  </>;
}

function MangerScene({ id }: { id:string }) {
  return <>
    <defs>
      <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stop-color="#34437a"/><stop offset="1" stop-color="#5a6aa6"/></linearGradient>
      <radialGradient id={`${id}-glow`}><stop stop-color="#ffe27a" stop-opacity=".75"/><stop offset="1" stop-color="#ffe27a" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1000" height="500" fill={`url(#${id}-sky)`} stroke="none"/>
    {[[60, 60], [150, 170], [260, 40], [380, 90], [640, 40], [760, 110], [880, 50], [940, 190], [70, 290], [930, 300], [330, 200], [690, 200]].map(([x, y], i) => <g key={i} style={{ '--d': `${-(i % 5) * .35}s` }}><Star x={x} y={y} s={3.2}/></g>)}
    <path d="M0 420q250-26 500-4t500 0V500H0z" fill="#c9b48e"/>
    <path d="M205 430V250L500 135l295 115v180z" fill="#8a6a52"/>
    <path d="M205 300h590M205 360h590" stroke="#a07c5f" stroke-width="5"/>
    <g class="scene-from-1"><Enter at={3} how="fade"><path d="M478 95h44l150 335H328z" fill="#fff3b8" stroke="none" opacity=".28"/></Enter></g>
    <g fill="none">
      <path d="M200 248V432m600-184V432" stroke-width="30"/><path d="M200 248V432m600-184V432" stroke="#c98d55" stroke-width="20"/>
      <path d="M150 268 500 125l350 143" stroke-width="34"/><path d="M150 268 500 125l350 143" stroke="#c98d55" stroke-width="24"/>
    </g>
    <path d="M232 432q38-34 84-2zm470 0q40-30 76 0z" fill="#f2cf7a"/>
    <g class="scene-breathe"><g transform="translate(245 402) scale(1.6)" stroke-width="3"><Sheep lying/></g></g>
    <g class="scene-breathe"><g transform="translate(772 398) scale(-1.6 1.6)" stroke-width="3">
      <ellipse cx="0" cy="4" rx="34" ry="17" fill="#c7c5d6"/>
      <path d="M22 -30q-6-22 0-30 8 4 8 26zm14 0q6-22 0-30-8 4-8 26z" fill="#b9b7c8"/>
      <ellipse cx="30" cy="-16" rx="17" ry="15" fill="#c7c5d6"/><ellipse cx="34" cy="-8" rx="11" ry="8" fill="#f1e8dc"/>
      <Happy x={24} y={-19} s={.45}/><Happy x={36} y={-19} s={.45}/><Cheek x={20} y={-12} s={.4}/><Cheek x={42} y={-12} s={.4}/>
    </g></g>
    <g class="scene-from-1 scene-parents">
      <g transform="translate(350 292) scale(2.3)" stroke-width="3"><Enter at={3.6} how="left"><Kid x={0} y={0} robe="#8cbcf2" hood="#8cbcf2"/></Enter></g>
      <g transform="translate(650 292) scale(2.3)" stroke-width="3"><Enter at={3.6} how="right"><Kid x={0} y={0} robe="#c99467" beard="#8a5a3c"/></Enter></g>
    </g>
    <g class="scene-cradle"><g transform="translate(500 360) scale(2.4)" stroke-width="2.9"><Manger x={0} y={0} babyClass="scene-baby"/></g></g>
    <g class="scene-only-1"><g class="scene-burst">{[[430, 300, 14], [575, 290, 12], [500, 268, 16], [455, 250, 9], [548, 245, 10]].map(([x, y, r], i) => <Spark key={i} x={x} y={y} r={r} fill="#ffd96a"/>)}</g></g>
    <g class="scene-from-2" fill="#fff6c2" stroke-width="4" paint-order="stroke" font-weight="900">
      <text class="scene-z" x="440" y="318" font-size="44" style={{ '--d': '0s' }}>z</text><text class="scene-z" x="468" y="288" font-size="34" style={{ '--d': '-.7s' }}>z</text><text class="scene-z" x="492" y="262" font-size="26" style={{ '--d': '-1.4s' }}>z</text>
    </g>
    <g class="scene-from-2"><g class="scene-float" style={{ '--d': '0s' }}><Heart x={410} y={240} s={1.6}/></g><g class="scene-float" style={{ '--d': '-1s' }}><Heart x={600} y={236} s={1.4}/></g></g>
    <g class="scene-star-fly"><g transform="translate(500 66)">
      <circle class="scene-star-glow" r="80" fill={`url(#${id}-glow)`} stroke="none"/>
      <path d="M0 -50 14 -18 48 -15 22 8 30 42 0 24 -30 42 -22 8 -48 -15 -14 -18z" fill="#ffd96a" stroke-width="6"/>
      <g class="blink"><Eye x={-10} y={-2} s={.9}/><Eye x={10} y={-2} s={.9}/></g><Cheek x={-17} y={9} s={.7}/><Cheek x={17} y={9} s={.7}/><Smile x={0} y={8} s={.7}/>
    </g></g>
    {[[160, 150, 10], [260, 108, 12], [360, 80, 9]].map(([x, y, r], i) => <g key={i} class="scene-trail" style={{ '--at': `${.35 + i * .35}s` }}><Spark x={x} y={y} r={r}/></g>)}
  </>;
}

/** Liegender Löwe aus der Antwortkarte, groß; brüllt im ersten Schritt, lächelt und schläft danach. */
function BigLion({ x, y, flip = 1 }: { x:number; y:number; flip?:number }) {
  return <g transform={`translate(${x} ${y}) scale(${3.6 * flip} 3.6)`} stroke-width="1.9">
    <g class="scene-lion-tail"><path d="M-32 6q-12-2-12-12" fill="none" stroke-width="3"/><circle cx="-45" cy="-8" r="4" fill="#d58b4c"/></g>
    <path d="M-4 18q-30 2-30-14 0-14 20-14h24z" fill="#f2c26c"/>
    <path d="M-22 18v6m14-6v6" stroke-width="5"/>
    <ellipse cx="14" cy="20" rx="7" ry="4" fill="#f2c26c"/><ellipse cx="26" cy="20" rx="7" ry="4" fill="#f2c26c"/>
    <g class="scene-lion-head">
      {Array.from({ length:9 }, (_, i) => { const a = i / 9 * Math.PI * 2; return <circle key={i} cx={12 + Math.cos(a) * 15} cy={-6 + Math.sin(a) * 15} r="7.5" fill="#d58b4c"/>; })}
      <circle cx="12" cy="-6" r="15" fill="#d58b4c" stroke="none"/><circle cx="12" cy="-4" r="12" fill="#ffd98a"/>
      <g class="scene-before-2"><g class="blink"><Eye x={7} y={-8} s={.5}/><Eye x={17} y={-8} s={.5}/></g></g>
      <g class="scene-from-2"><Happy x={7} y={-7} s={.55}/><Happy x={17} y={-7} s={.55}/></g>
      <Cheek x={4} y={-1} s={.5}/><Cheek x={20} y={-1} s={.5}/>
      <path d="M10 -2h4l-2 2.5z" fill="#7a4a2a" stroke-width="1.6"/>
      <g class="scene-only-0"><ellipse cx="12" cy="4" rx="3.6" ry="3.2" fill="#7a4a2a" stroke-width="1.4"/><ellipse cx="12" cy="5.4" rx="2" ry="1.2" fill="#ff9fb4" stroke="none"/></g>
      <g class="scene-from-1"><Smile x={12} y={2} s={.4}/></g>
    </g>
    <g class="scene-only-0"><path class="scene-roar" d="M30 -10q5 6 0 12m6-18q9 12 0 24" fill="none" stroke="#fff6c2" stroke-width="2.2"/></g>
  </g>;
}
function LionScene() {
  return <>
    <Sky fill="#d9c6a4"/>
    <path d="M40 520V270Q40 40 500 30q460 10 460 240v250z" fill="#d9c6a4"/>
    <path d="M70 160q20-10 34 0m800 0q18-12 32 0M60 360q16-8 30 0m826 6q16-10 30 0" fill="none" stroke="#bfa985" stroke-width="5"/>
    <path d="M120 520V285Q120 110 500 100q380 10 380 185v235z" fill="#9b8669"/>
    <circle class="scene-glow" cx="500" cy="290" r="160" fill="#fff3b8" stroke="none"/>
    <path d="M70 478q430-46 860 0V500H70z" fill="#c9b48e"/>
    <g class="scene-from-1"><Enter at={3} how="drop">
      <g class="scene-angel"><g transform="translate(500 112) scale(1.9)" stroke-width="3">
        <g transform="rotate(25 -26 34)"><ellipse class="scene-wing scene-wing-left" cx="-26" cy="34" rx="24" ry="12" fill="#fff"/></g>
        <g transform="rotate(-25 26 34)"><ellipse class="scene-wing scene-wing-right" cx="26" cy="34" rx="24" ry="12" fill="#fff"/></g>
        <Kid x={0} y={0} robe="#fffdf6" hair="#ffd96a"/>
        <ellipse cx="0" cy="-30" rx="15" ry="4.5" fill="none" stroke="#e8b84a" stroke-width="4"/>
      </g></g>
      <g class="scene-sparkle"><Spark x={370} y={86} r={13}/><Spark x={636} y={100} r={11}/><Spark x={392} y={196} r={9}/><Spark x={612} y={204} r={10}/></g>
    </Enter></g>
    <g transform="translate(500 300) scale(2.5)" stroke-width="2.8"><Kid x={0} y={0} robe="#8cc4ee"/><path d="M-5 34l5-8 5 8z" fill="#ffdcc4" stroke-width="2"/></g>
    <BigLion x={250} y={400}/><BigLion x={750} y={400} flip={-1}/>
    <g class="scene-from-2"><g class="scene-float" style={{ '--d': '0s' }}><Heart x={300} y={300} s={1.7}/></g><g class="scene-float" style={{ '--d': '-.9s' }}><Heart x={700} y={296} s={1.5}/></g></g>
    <Flower x={100} y={470} s={2.8}/><Flower x={150} y={488} s={2.4} fill="#ffd96a"/><Flower x={900} y={474} s={2.8} fill="#b9a7f0"/>
  </>;
}

/** Ein Jünger, der sich am Bootsrand festhält; im Sturm besorgt, danach froh. */
const Disciple = ({ x, robe, worried }: { x:number; robe:string; worried?:boolean }) => <g transform={`translate(${x} 300) scale(1.8)`} stroke-width="3.6"><Kid x={0} y={0} robe={robe} beard="#8a5a3c" worried={worried}/></g>;
function BoatScene() {
  return <>
    <Sky fill="#cdeffd"/>
    <rect class="scene-before-2" width="1000" height="500" fill="#97a8c6" stroke="none"/>
    <g class="scene-from-2"><Enter at={6.6}><Sun x={860} y={92} r={40} rays={[8, 22]}/></Enter></g>
    <g class="scene-from-2"><Enter at={6.9} how="fade"><Cloud x={90} y={86} s={3}/><Cloud x={520} y={64} s={2.4}/><path d="M180 186q13-14 26 0 13-14 26 0m430-40q13-14 26 0 13-14 26 0" fill="none" stroke="#557c91" stroke-width="5"/></Enter></g>
    <g class="scene-before-2">
      <FaceCloud x={70} y={110} s={5} grumpy/><FaceCloud x={640} y={96} s={4.4} grumpy/>
      <g class="scene-flash" fill="none"><path d="M150 160l-22 44h28l-22 46m596-104-20 40h26l-20 42" stroke-width="17"/><path d="M150 160l-22 44h28l-22 46m596-104-20 40h26l-20 42" stroke="#ffd24a" stroke-width="9"/></g>
      <Rain/>
      <Sea y={330} fill="#6fb6d6" line="#3f8fb6" wave={30}/>
    </g>
    <g class="scene-from-2"><Sea y={352} fill="#7cc8e8" line="#45a6c8" wave={10}/></g>
    <g class="scene-boat-rock">
      <g class="scene-before-2"><Disciple x={360} robe="#dba079" worried/><Disciple x={640} robe="#9fb984" worried/></g>
      <g class="scene-from-2"><Disciple x={360} robe="#dba079"/><Disciple x={640} robe="#9fb984"/></g>
      <g class="scene-only-1"><ellipse class="scene-sleep-glow" cx="470" cy="345" rx="100" ry="54" fill="#fff3b8" stroke="none" opacity=".85"/></g>
      <g class="scene-before-2 scene-sleeper">
        <path d="M470 340q80-26 140 8l-6 30H470z" fill="#fffdf6"/>
        <ellipse cx="436" cy="362" rx="38" ry="17" fill="#9c8cc8"/>
        <circle cx="452" cy="340" r="28" fill="#ffdcc4"/>
        <path d="M428 348q4 22 24 22t24-22q-8 8-24 8t-24-8z" fill="#8a5a3c"/>
        <path d="M424 338q2-26 28-26t28 26q-10-10-28-10t-28 10z" fill="#8a5a3c"/>
        <Happy x={442} y={340} s={.7}/><Happy x={462} y={340} s={.7}/><Cheek x={434} y={350} s={.6}/><Cheek x={470} y={350} s={.6}/>
      </g>
      <g class="scene-only-1" fill="#fff6c2" stroke-width="4" paint-order="stroke" font-weight="900">
        <text class="scene-z" x="490" y="300" font-size="40" style={{ '--d': '0s' }}>z</text><text class="scene-z" x="520" y="270" font-size="30" style={{ '--d': '-.7s' }}>z</text><text class="scene-z" x="545" y="244" font-size="24" style={{ '--d': '-1.4s' }}>z</text>
      </g>
      <g class="scene-from-2 scene-standing"><Enter at={6.5}>
        <g transform="translate(500 270) scale(2)" stroke-width="3.2">
          <path d="M12 30 40 -6" stroke-width="7"/><path d="M12 30 40 -6" stroke="#ffdcc4" stroke-width="3.6"/><circle cx="41" cy="-8" r="5.5" fill="#ffdcc4"/>
          <Kid x={0} y={0} robe="#fffdf6" beard="#8a5a3c"/>
        </g>
        <g class="scene-sparkle"><Spark x={612} y={226} r={13}/><Spark x={560} y={190} r={9}/><Spark x={640} y={270} r={8}/></g>
      </Enter></g>
      <path d="M280 372h440l-64 84H344z" fill="#e0a26a"/><path d="M306 404h388" stroke="#b97c48" stroke-width="5"/>
      <circle cx="392" cy="372" r="9" fill="#ffdcc4" stroke-width="5"/><circle cx="608" cy="372" r="9" fill="#ffdcc4" stroke-width="5"/>
    </g>
    <g class="scene-before-2"><Sea y={420} fill="#6fb6d6" line="#3f8fb6" wave={26}/></g>
    <g class="scene-from-2"><Sea y={428} fill="#7cc8e8" line="#45a6c8" wave={8}/></g>
  </>;
}
