import type { ComponentChildren, JSX } from 'preact';
import { useId } from 'preact/hooks';
import type { StoryMotif } from '../../shared/kids-show-questions';

/** Neben den Antwortbildern gibt es die Bühne vor dem Superbluff: Sie verrät keine der drei Geschichten. */
export type KidsPictureMotif = StoryMotif | 'stage';
interface At { x: number; y: number; s?: number }

const Eye = ({ x, y, s = 1 }: At) => <><ellipse cx={x} cy={y} rx={4.6 * s} ry={5.6 * s} fill="#12324a" stroke="none"/><circle cx={x - 1.6 * s} cy={y - 2 * s} r={1.8 * s} fill="#fff" stroke="none"/></>;
const Happy = ({ x, y, s = 1 }: At) => <path d={`M${x - 5 * s} ${y + s}q${5 * s} ${-6 * s} ${10 * s} 0`} fill="none" stroke-width={3 * s}/>;
const Cheek = ({ x, y, s = 1 }: At) => <ellipse cx={x} cy={y} rx={6 * s} ry={3.6 * s} fill="#ff9fb4" stroke="none" opacity=".8"/>;
const Smile = ({ x, y, s = 1 }: At) => <path d={`M${x - 5 * s} ${y}q${5 * s} ${5 * s} ${10 * s} 0`} fill="none" stroke-width={2.6 * s}/>;
const Frown = ({ x, y, s = 1 }: At) => <path d={`M${x - 5 * s} ${y + 3 * s}q${5 * s} ${-5 * s} ${10 * s} 0`} fill="none" stroke-width={2.6 * s}/>;
const Face = ({ x, y, s = 1 }: At) => <><Eye x={x - 9 * s} y={y} s={s}/><Eye x={x + 9 * s} y={y} s={s}/><Cheek x={x - 15 * s} y={y + 8 * s} s={s}/><Cheek x={x + 15 * s} y={y + 8 * s} s={s}/><Smile x={x} y={y + 8 * s} s={s}/></>;
/** Vierzackiger Glitzerstern. */
const Spark = ({ x, y, r = 7, fill = '#fff6c2' }: { x: number; y: number; r?: number; fill?: string }) =>
  <path d={`M${x} ${y - r}q${r * .2} ${r * .8} ${r} ${r}q${-r * .8} ${r * .2} ${-r} ${r}q${-r * .2} ${-r * .8} ${-r} ${-r}q${r * .8} ${-r * .2} ${r} ${-r}z`} fill={fill} stroke="#e8b84a" stroke-width="2"/>;
const Sun = ({ x, y, r = 18 }: { x: number; y: number; r?: number }) => <>
  {Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return <path key={i} d={`M${x + Math.cos(a) * (r + 4)} ${y + Math.sin(a) * (r + 4)}L${x + Math.cos(a) * (r + 10)} ${y + Math.sin(a) * (r + 10)}`} stroke="#f0b83c"/>; })}
  <circle cx={x} cy={y} r={r} fill="#ffd96a"/><Face x={x} y={y - r * .05} s={r / 30}/>
</>;
const Coin = ({ x, y, r = 16 }: { x: number; y: number; r?: number }) => <>
  <circle cx={x} cy={y} r={r} fill="#ffd24a"/><circle cx={x} cy={y} r={r * .66} fill="none" stroke="#e0a72a" stroke-width="2.5"/>
  <path d={`M${x - r * .35} ${y - r * .55}q${-r * .25} ${r * .3} 0 ${r * .6}`} fill="none" stroke="#fff6c2" stroke-width="3"/>
</>;
const Roll = ({ x, y, s = 1 }: At) => <>
  <path d={`M${x - 22 * s} ${y + 10 * s}v${-6 * s}q0 ${-22 * s} ${22 * s} ${-22 * s}t${22 * s} ${22 * s}v${6 * s}z`} fill="#efb36a"/>
  <path d={`M${x - 12 * s} ${y - 6 * s}q${12 * s} ${-8 * s} ${24 * s} 0`} fill="none" stroke="#ffe0a6" stroke-width={4 * s}/>
  <Eye x={x - 6 * s} y={y + s} s={.5 * s}/><Eye x={x + 6 * s} y={y + s} s={.5 * s}/><Cheek x={x - 12 * s} y={y + 5 * s} s={.5 * s}/><Cheek x={x + 12 * s} y={y + 5 * s} s={.5 * s}/>
</>;
const Fish = ({ x, y, s = 1, fill = '#8fd3e6' }: At & { fill?: string }) => <>
  <path d={`M${x - 30 * s} ${y}q${26 * s} ${-30 * s} ${58 * s} ${-4 * s}q${-32 * s} ${30 * s} ${-58 * s} ${4 * s}z`} fill={fill}/>
  <path d={`M${x - 28 * s} ${y}l${-14 * s} ${-12 * s}v${24 * s}z`} fill={fill}/>
  <Eye x={x + 14 * s} y={y - 4 * s} s={.55 * s}/><Cheek x={x + 18 * s} y={y + 4 * s} s={.5 * s}/>
</>;
/** Kleine Figur mit großem Kopf; Bart oder Kopftuch nach Bedarf. */
const Kid = ({ x, y, s = 1, robe = '#8cc4ee', hair = '#8a5a3c', beard, hood }: At & { robe?: string; hair?: string; beard?: string; hood?: string }) => <>
  <path d={`M${x - 18 * s} ${y + 56 * s}q${-s} ${-30 * s} ${18 * s} ${-36 * s} ${19 * s} ${6 * s} ${18 * s} ${36 * s}z`} fill={robe}/>
  <circle cx={x} cy={y} r={21 * s} fill="#ffdcc4"/>
  {beard && <path d={`M${x - 19 * s} ${y + 2 * s}q${3 * s} ${26 * s} ${19 * s} ${26 * s}t${19 * s} ${-26 * s}q${-8 * s} ${9 * s} ${-19 * s} ${9 * s}t${-19 * s} ${-9 * s}z`} fill={beard}/>}
  <path d={`M${x - 21 * s} ${y - s}q${s} ${-22 * s} ${21 * s} ${-22 * s}t${21 * s} ${22 * s}q${-8 * s} ${-10 * s} ${-21 * s} ${-10 * s}t${-21 * s} ${10 * s}z`} fill={hair}/>
  {hood && <path d={`M${x - 25 * s} ${y + 14 * s}q${-4 * s} ${-40 * s} ${25 * s} ${-40 * s}t${25 * s} ${40 * s}`} fill="none" stroke={hood} stroke-width={9 * s}/>}
  <Eye x={x - 8 * s} y={y + 3 * s} s={.7 * s}/><Eye x={x + 8 * s} y={y + 3 * s} s={.7 * s}/><Cheek x={x - 13 * s} y={y + 10 * s} s={.6 * s}/><Cheek x={x + 13 * s} y={y + 10 * s} s={.6 * s}/>
  {!beard && <Smile x={x} y={y + 10 * s} s={.55 * s}/>}
</>;
/** Krippe mit schlafendem Baby. */
const Manger = ({ x, y, s = 1 }: At) => <>
  <path d={`M${x - 30 * s} ${y + 34 * s}l${-10 * s} ${14 * s}m${80 * s} ${-14 * s}l${10 * s} ${14 * s}`} stroke-width={4 * s}/>
  <path d={`M${x - 44 * s} ${y + 4 * s}h${88 * s}l${-12 * s} ${32 * s}h${-64 * s}z`} fill="#d9a26a"/>
  {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${x - 40 * s + i * 13 * s} ${y + 6 * s}l${4 * s} ${-12 * s}`} stroke="#e8b84a" stroke-width={3 * s}/>)}
  <ellipse cx={x + 6 * s} cy={y} rx={30 * s} ry={13 * s} fill="#fff8e6"/><circle cx={x - 14 * s} cy={y - 4 * s} r={12 * s} fill="#ffe2cf"/>
  <Happy x={x - 19 * s} y={y - 5 * s} s={.55 * s}/><Happy x={x - 9 * s} y={y - 5 * s} s={.55 * s}/><Cheek x={x - 22 * s} y={y + s} s={.5 * s}/><Cheek x={x - 6 * s} y={y + s} s={.5 * s}/>
</>;
const Calendar = ({ x, w, children }: { x: number; w: number; children: ComponentChildren }) => <>
  <rect x={x} y="22" width={w} height="106" rx="16" fill="#fffdf6"/><path d={`M${x} 46h${w}`} stroke="#e9d6a8"/>
  <path d={`M${x + w * .25} 14v18m${w * .5} -18v18`} stroke-width="7"/>{children}
</>;
const Hull = () => <><path d="M22 84q88 10 176 0-6 36-34 42H56q-28-6-34-42z" fill="#e0a26a"/><path d="M42 102q68 8 136 0" fill="none" stroke="#b97c48"/></>;
const Waves = () => <path d="M8 130q14-10 28 0t28 0 28 0 28 0 28 0 28 0 28 0" fill="none" stroke="#45a6c8" stroke-width="4"/>;
const Flower = ({ x, y, fill = '#ff9fb4' }: { x: number; y: number; fill?: string }) => <>
  <path d={`M${x} ${y + 12}v-10`} stroke="#5ea86a" stroke-width="3"/>
  {[0, 72, 144, 216, 288].map(a => <circle key={a} cx={x + Math.cos(a * Math.PI / 180) * 4.5} cy={y + Math.sin(a * Math.PI / 180) * 4.5} r="3.6" fill={fill} stroke-width="1.6"/>)}
  <circle cx={x} cy={y} r="2.6" fill="#ffd96a" stroke-width="1.6"/>
</>;
/** Liegender Löwe für die Löwengrube, flip = -1 schaut nach links. */
const Lion = ({ x, y, flip = 1 }: { x: number; y: number; flip?: number }) => <g transform={`translate(${x} ${y}) scale(${flip} 1)`}>
  <path d="M-4 18q-30 2-30-14 0-14 20-14h24z" fill="#f2c26c"/>
  <path d="M-32 6q-12-2-12-12" fill="none" stroke-width="3"/><circle cx="-45" cy="-8" r="4" fill="#d58b4c"/>
  <path d="M-22 18v6m14-6v6" stroke-width="5"/>
  {Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2; return <circle key={i} cx={12 + Math.cos(a) * 15} cy={-6 + Math.sin(a) * 15} r="7.5" fill="#d58b4c"/>; })}
  <circle cx="12" cy="-6" r="15" fill="#d58b4c" stroke="none"/><circle cx="12" cy="-4" r="12" fill="#ffd98a"/>
  <Happy x={7} y={-7} s={.55}/><Happy x={17} y={-7} s={.55}/><Cheek x={4} y={-1} s={.5}/><Cheek x={20} y={-1} s={.5}/>
  <path d="M10 -2h4l-2 2.5z" fill="#7a4a2a" stroke-width="1.6"/>
</g>;
const Cloud = ({ x, y }: { x: number; y: number }) => <path d={`M${x} ${y}q2-10 12-10 4-8 14-4 10-2 10 8 8 2 4 8h-36q-6-1-4-2z`} fill="#fff" stroke-width="2"/>;
const Star = ({ x, y }: { x: number; y: number }) => <path d={`M${x} ${y - 4}l1.2 3 3 .2-2.3 2 .8 3-2.7-1.6-2.7 1.6.8-3-2.3-2 3-.2z`} fill="#ffe27a" stroke="none"/>;
const Sky = ({ fill }: { fill: string }) => <rect width="220" height="140" fill={fill} stroke="none"/>;
const Ground = ({ fill, y = 104 }: { fill: string; y?: number }) => <path d={`M0 ${y}q110-14 220 0V140H0z`} fill={fill}/>;

/** Kleine Kulissen hinter den Figuren. Der Bildrahmen schneidet alles auf die runden Ecken zu. */
const SCENES = {
  sea: () => <><Sky fill="#cdeffd"/><Cloud x={26} y={30}/><path d="M0 98q27-8 55 0t55 0 55 0 55 0V140H0z" fill="#7cc8e8"/></>,
  storm: () => <><Sky fill="#b9c7de"/><path d="M0 98q27-12 55 0t55 0 55 0 55 0V140H0z" fill="#6fb6d6"/></>,
  under: () => <><Sky fill="#8fd3f0"/><g fill="none" stroke="#fff" stroke-width="2"><circle cx="40" cy="40" r="5"/><circle cx="52" cy="26" r="3.5"/><circle cx="186" cy="36" r="4.5"/></g><Ground fill="#f2dca8" y={112}/><path d="M24 126q-8-20 4-36m10 36q8-22-2-40m168 40q8-18-2-34" fill="none" stroke="#5ea86a" stroke-width="5"/></>,
  meadow: () => <><Sky fill="#d7f3ff"/><Cloud x={150} y={26}/><Ground fill="#a9e08f"/></>,
  desert: () => <><Sky fill="#ffe9c2"/><circle cx="186" cy="30" r="13" fill="#ffd24a" stroke="none"/><path d="M0 110q50-24 110-6t110-10V140H0z" fill="#f2cf8a"/></>,
  night: () => <><Sky fill="#3f4f86"/>{[[24, 24], [50, 14], [178, 20], [200, 46], [150, 12], [70, 36]].map(([x, y]) => <Star key={x} x={x} y={y}/>)}<Ground fill="#c9b48e" y={110}/></>,
  table: () => <><Sky fill="#fff1dd"/><path d="M0 100h220V140H0z" fill="#ffd7df"/><path d="M0 100h220" stroke-width="3"/><path d="M30 100v40m40-40v40m40-40v40m40-40v40m40-40v40" stroke="#ff9fb4" stroke-width="6" opacity=".5"/></>,
  bed: () => <><Sky fill="#ece4ff"/><path d="M0 104h220V140H0z" fill="#d9b483"/></>,
  palace: () => <><Sky fill="#f6e3ff"/><path d="M0 0h40q-6 60 0 140H0zM220 0h-40q6 60 0 140h40z" fill="#c58cdc" stroke="none" opacity=".75"/><path d="M60 112h100l8 20H52z" fill="#e65f78"/></>,
  sky: () => <><Sky fill="#d7f3ff"/><Cloud x={24} y={30}/><Cloud x={166} y={46}/><Ground fill="#bfe8a8" y={118}/></>,
  wall: () => <><Sky fill="#fff7e0"/><rect x="168" y="16" width="38" height="34" rx="6" fill="#bfe8ff" stroke-width="3"/><path d="M187 16v34M168 33h38" stroke-width="2.5"/></>,
};

interface Picture { scene?: keyof typeof SCENES; /** Passt die Figur in die Kulisse; ganze Szenen zeichnen ihren Hintergrund selbst. */ fit?: string; art: () => JSX.Element }
const PICTURES: Record<KidsPictureMotif, Picture> = {
  ark: { scene: 'sea', fit: 'translate(19.8 16.2) scale(.813)', art: () => <>
    <path d="M150 66a40 40 0 0 1 64 0" fill="none" stroke="#ff9fb4" stroke-width="7"/><path d="M157 66a33 33 0 0 1 50 0" fill="none" stroke="#ffe17a" stroke-width="7"/><path d="M164 66a26 26 0 0 1 36 0" fill="none" stroke="#9fe0c8" stroke-width="7"/>
    <path d="M150 84V50q0-14 8-14t8 14v34" fill="#ffd36e"/><circle cx="158" cy="30" r="12" fill="#ffd36e"/><path d="M151 20l-1-8m15 8 1-8" stroke-width="3"/>
    <circle cx="152" cy="54" r="2.5" fill="#d9963a" stroke="none"/><circle cx="162" cy="66" r="2.5" fill="#d9963a" stroke="none"/>
    <Eye x={154} y={28} s={.45}/><Eye x={162} y={28} s={.45}/><Cheek x={151} y={34} s={.45}/><Cheek x={165} y={34} s={.45}/>
    <circle cx="74" cy="50" r="26" fill="#ffdcc4"/>
    <path d="M50 54q4 34 24 34t24-34q-8 10-24 10t-24-10z" fill="#fffdf6"/><path d="M50 46q2-22 24-22t24 22q-10-8-24-8t-24 8z" fill="#fffdf6"/>
    <Eye x={65} y={48} s={.8}/><Eye x={83} y={48} s={.8}/><Cheek x={58} y={57} s={.8}/><Cheek x={90} y={57} s={.8}/>
    <path d="M100 66q12-14 20-6" fill="none" stroke-width="5"/><circle cx="122" cy="58" r="5" fill="#ffdcc4"/>
    <Hull/>
    <circle cx="78" cy="112" r="5" fill="#fff8e6" stroke-width="2.5"/><circle cx="110" cy="114" r="5" fill="#fff8e6" stroke-width="2.5"/><circle cx="142" cy="112" r="5" fill="#fff8e6" stroke-width="2.5"/>
    <Waves/>
  </> },
  mary: { scene: 'night', fit: 'translate(20.5 17.9) scale(.806)', art: () => <>
    <circle cx="110" cy="50" r="40" fill="#fff3b8" stroke="#f0c955" stroke-width="3"/>
    <Spark x={42} y={34} r={8}/><Spark x={182} y={30} r={6}/>
    <path d="M66 134q-6-44 18-62h52q24 18 18 62z" fill="#8cbcf2"/>
    <circle cx="110" cy="52" r="34" fill="#8cbcf2"/><circle cx="110" cy="58" r="25" fill="#ffdcc4"/>
    <path d="M88 52q4-22 22-22t22 22q-10-9-22-9t-22 9z" fill="#8a5a3c"/>
    <Face x={110} y={58} s={.9}/>
    <ellipse cx="112" cy="110" rx="34" ry="18" fill="#fff8e6"/><circle cx="94" cy="106" r="13" fill="#ffe2cf"/>
    <Happy x={89} y={105} s={.6}/><Happy x={99} y={105} s={.6}/><Cheek x={86} y={111} s={.6}/><Cheek x={102} y={111} s={.6}/>
    <path d="M118 104q12 2 22 8" fill="none" stroke="#ead9b5" stroke-width="3"/>
    <path d="M72 118q40 24 80-6" fill="none" stroke="#6a9fdc" stroke-width="8"/>
  </> },
  lion: { art: () => <>
    <Sky fill="#d9c6a4"/>
    <path d="M8 132V72Q8 14 110 12q102 2 102 60v60z" fill="#d9c6a4"/>
    <path d="M28 132V78q0-42 82-44 82 2 82 44v54z" fill="#9b8669"/>
    <circle cx="110" cy="76" r="34" fill="#fff3b8" stroke="none" opacity=".9"/>
    <path d="M20 132q90-12 180 0z" fill="#c9b48e"/>
    <path d="M96 128l2-30q12-8 24 0l2 30z" fill="#8cc4ee"/><path d="M104 128v6m12-6v6" stroke-width="4"/>
    <circle cx="110" cy="74" r="19" fill="#ffdcc4"/>
    <path d="M91 72q1-20 19-20t19 20q-7-8-19-8t-19 8z" fill="#8a5a3c"/>
    <Eye x={103} y={76} s={.65}/><Eye x={117} y={76} s={.65}/><Cheek x={97} y={82} s={.6}/><Cheek x={123} y={82} s={.6}/><Smile x={110} y={83} s={.5}/>
    <path d="M105 108l5-8 5 8z" fill="#ffdcc4" stroke-width="2"/>
    <Lion x={58} y={112}/><Lion x={162} y={112} flip={-1}/>
    <Flower x={36} y={116} fill="#ffd96a"/><Flower x={186} y={118}/>
  </> },
  'one-day': { scene: 'wall', fit: 'translate(13.5 13.7) scale(.877)', art: () => <Calendar x={40} w={140}><Sun x={110} y={88} r={22}/></Calendar> },
  'three-days': { scene: 'wall', fit: 'translate(13.5 13.7) scale(.877)', art: () => <Calendar x={14} w={192}>{[54, 110, 166].map(x => <Sun key={x} x={x} y={88} r={15}/>)}</Calendar> },
  'forty-days': { scene: 'wall', fit: 'translate(13.5 13.7) scale(.877)', art: () => <Calendar x={30} w={160}>
    <text x="110" y="92" text-anchor="middle" font-size="44" font-weight="900" fill="#12324a" stroke="none">40</text>
    {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={50 + (i % 20) * 6.3} cy={104 + Math.floor(i / 20) * 9} r="2.6" fill={['#ff9fb4', '#ffd24a', '#8fd3e6', '#a8dd8e'][i % 4]} stroke="none"/>)}
  </Calendar> },
  coin: { scene: 'under', fit: 'translate(7.9 11.4) scale(1.006)', art: () => <>
    <Spark x={40} y={30}/>
    <path d="M36 74q44-52 112-18 14 8 20 18-6 10-20 18-68 34-112-18z" fill="#8fd3e6"/><path d="M40 74 14 50v48z" fill="#8fd3e6"/>
    <path d="M88 46q8-20 26-18-2 14-12 22z" fill="#6fbfd8"/><path d="M78 88q10 12 24 10" fill="none" stroke="#6fbfd8" stroke-width="5"/>
    <Eye x={132} y={64}/><Cheek x={138} y={80}/><Coin x={172} y={78} r={17}/>
  </> },
  'coin-bread': { scene: 'table', fit: 'translate(-2.2 -.5) scale(1.02)', art: () => <>
    <Coin x={110} y={44} r={18}/>
    <path d="M50 124V90q0-42 60-42t60 42v34z" fill="#efb36a"/><path d="M80 52q30 6 60 0" fill="none" stroke-width="4"/>
    <Face x={110} y={94}/>
  </> },
  'coin-pillow': { scene: 'bed', fit: 'translate(9.1 11.3) scale(.917)', art: () => <>
    <Coin x={172} y={108} r={17}/>
    <path d="M28 56q82-26 164 0l-8 56q-74-18-148 0z" fill="#d9cdf5"/><path d="M28 56l-12-10m176 10 12-10m-20 66 12 10M36 112l-12 10" stroke-width="4"/>
    <Happy x={96} y={82}/><Happy x={124} y={82}/><Cheek x={86} y={92}/><Cheek x={134} y={92}/><Smile x={110} y={92} s={.8}/>
    <g fill="#8c7cc8" stroke="none" font-weight="900"><text x="158" y="44" font-size="20">z</text><text x="172" y="30" font-size="15">z</text></g>
  </> },
  ship: { scene: 'sea', fit: 'translate(14.8 4.2) scale(.898)', art: () => <>
    <Hull/><rect x="58" y="42" width="104" height="44" rx="14" fill="#ffe08f"/><path d="M50 46q60-42 120 0z" fill="#f08a80"/><Waves/>
    <circle cx="86" cy="64" r="15" fill="#fff8e6"/><circle cx="134" cy="64" r="15" fill="#fff8e6"/>
    <circle cx="86" cy="66" r="10" fill="#c99467"/><circle cx="78" cy="57" r="4" fill="#c99467"/><circle cx="94" cy="57" r="4" fill="#c99467"/><Eye x={82} y={65} s={.4}/><Eye x={90} y={65} s={.4}/>
    <circle cx="134" cy="66" r="10" fill="#fffdf6"/><Eye x={130} y={65} s={.4}/><Eye x={138} y={65} s={.4}/><path d="M126 58q8-8 16 0" fill="#fffdf6"/>
  </> },
  tree: { scene: 'meadow', fit: 'translate(21.5 19.8) scale(.805)', art: () => <>
    <path d="M96 132V84h28v48z" fill="#c99467"/>
    <path d="M110 92q-60 4-62-34 0-34 34-36 12-22 40-10 32-8 42 22 22 30-10 54z" fill="#9fdc8a"/>
    <Face x={110} y={58}/>
    <circle cx="70" cy="46" r="7" fill="#ff8e8e"/><circle cx="152" cy="40" r="7" fill="#ff8e8e"/><circle cx="148" cy="76" r="7" fill="#ff8e8e"/>
    <Spark x={30} y={110} r={6}/><Spark x={190} y={104} r={6}/>
  </> },
  manger: { scene: 'night', fit: 'translate(23.8 18.4) scale(.758)', art: () => <><Spark x={110} y={22} r={12} fill="#ffd96a"/><Manger x={110} y={82} s={1.25}/></> },
  leaf: { scene: 'sky', fit: 'translate(6.3 13) scale(.926)', art: () => <>
    <Spark x={56} y={34} r={8}/><Spark x={170} y={98} r={6}/>
    <path d="M58 122q40-40 104-92" fill="none" stroke="#6aa774" stroke-width="7"/>
    <path d="M86 98q-30-6-34-30 28-2 40 22z" fill="#a8dd8e"/><path d="M128 60q-6-30 14-46 16 26-2 48z" fill="#a8dd8e"/>
    <path d="M104 84q8-46 52-56-2 52-52 56z" fill="#8fd17a"/>
    <Eye x={122} y={58} s={.7}/><Eye x={136} y={54} s={.7}/><Cheek x={118} y={66} s={.7}/><Cheek x={142} y={60} s={.7}/><Smile x={130} y={64} s={.6}/>
  </> },
  crown: { scene: 'palace', fit: 'translate(12.2 19) scale(.877)', art: () => <>
    <Spark x={40} y={30} r={8}/><Spark x={184} y={40}/><Spark x={110} y={14} r={6}/>
    <path d="M44 56l28 22 38-44 38 44 28-22-12 62H56z" fill="#ffd96a"/>
    <circle cx="44" cy="54" r="8" fill="#ffb3c4"/><circle cx="110" cy="32" r="9" fill="#9fe0c8"/><circle cx="176" cy="54" r="8" fill="#ffb3c4"/>
    <rect x="54" y="104" width="112" height="18" rx="9" fill="#f6bf4a"/>
    <g stroke-width="2"><circle cx="82" cy="113" r="5" fill="#8cbcf2"/><circle cx="110" cy="113" r="5" fill="#ff9fb4"/><circle cx="138" cy="113" r="5" fill="#8cbcf2"/></g>
    <path d="M78 70q4 10 2 22" fill="none" stroke="#fff6c2" stroke-width="5"/>
  </> },
  bread: { art: () => <>
    <Sky fill="#fff1dd"/>
    <path d="M0 140V100h220v40z" fill="#c99467"/><path d="M0 100h220" stroke-width="3"/>
    <path d="M0 108h220v10H0zm0 18h220v10H0z" fill="#ff9fb4" stroke="none" opacity=".55"/>
    <ellipse cx="110" cy="104" rx="80" ry="14" fill="#fffdf6"/>
    <path d="M96 30q-8-10 0-20m14 22q-8-10 0-20m14 22q-8-10 0-20" fill="none" stroke="#e8d9c8"/>
    <path d="M56 102V80q0-40 54-40t54 40v22z" fill="#efb36a"/><path d="M68 66q42-22 84 0" fill="none" stroke="#ffe0a6" stroke-width="6"/>
    <Eye x={98} y={82} s={.9}/><Eye x={122} y={82} s={.9}/><Cheek x={88} y={92} s={.9}/><Cheek x={132} y={92} s={.9}/><Smile x={110} y={92} s={.8}/>
    <path d="M176 100q8-30 22-50" fill="none" stroke="#e6c06a" stroke-width="3"/>
    {[0, 1, 2, 3].map(i => <ellipse key={i} cx={182 + i * 4} cy={84 - i * 10} rx="4" ry="7" fill="#f2cf7a" stroke-width="2" transform={`rotate(30 ${182 + i * 4} ${84 - i * 10})`}/>)}
  </> },
  raven: { scene: 'sky', fit: 'translate(20.2 9.2) scale(.885)', art: () => <>
    <Spark x={160} y={26}/>
    <path d="M88 116l-6 16m26-16 6 16" fill="none" stroke="#f2a24a" stroke-width="5"/>
    <ellipse cx="108" cy="78" rx="52" ry="44" fill="#6b708c"/><path d="M62 82q-18 4-26 20 22 4 34-6z" fill="#565b78"/>
    <ellipse cx="100" cy="92" rx="26" ry="20" fill="#858ba8" stroke="none"/>
    <Eye x={110} y={64}/><Eye x={134} y={64}/><Cheek x={104} y={78}/><Cheek x={142} y={78}/>
    <path d="M118 74l10 10 10-10z" fill="#f6b45a"/><path d="M96 40q8-14 18-4" fill="none"/>
  </> },
  donkey: { art: () => <>
    <Sky fill="#d7f3ff"/>
    <circle cx="184" cy="28" r="14" fill="#ffe27a"/>
    <path d="M26 30q4-10 16-8 6-10 18-2 12 0 10 10H28z" fill="#fff" stroke-width="2.5"/>
    <path d="M0 140V108q60-26 120-10t100 6v36z" fill="#a9e08f"/>
    <path d="M150 140q-6-20 10-36" fill="none" stroke="#e6d3a8" stroke-width="10"/>
    <path d="M78 110v20m14-20v20m30-20v20m14-20v20" stroke="#9c9aae" stroke-width="9"/>
    <ellipse cx="108" cy="96" rx="40" ry="22" fill="#c7c5d6"/>
    <path d="M68 92q-12 4-12 16" fill="none" stroke-width="3"/><path d="M56 108l-3 6 6-1z" fill="#6c6a80" stroke-width="2"/>
    <path d="M120 90q14-14 14-40h20q2 30-14 48z" fill="#c7c5d6"/>
    <path d="M134 40q-10-26-2-34 10 4 10 30zm22 0q10-26 2-34-10 4-10 30z" fill="#b9b7c8"/>
    <ellipse cx="146" cy="50" rx="22" ry="20" fill="#c7c5d6"/><ellipse cx="150" cy="60" rx="14" ry="10" fill="#f1e8dc"/>
    <Eye x={140} y={46} s={.6}/><Eye x={154} y={46} s={.6}/><Cheek x={134} y={54} s={.55}/><Cheek x={162} y={54} s={.55}/><Smile x={150} y={63} s={.45}/>
    <Flower x={160} y={30}/>
    <Flower x={40} y={120}/><Flower x={60} y={126} fill="#ffd96a"/><Flower x={196} y={116} fill="#b9a7f0"/>
  </> },
  camel: { scene: 'desert', fit: 'translate(10.9 14.7) scale(.87)', art: () => <>
    <Spark x={40} y={30}/>
    <path d="M62 104v24m22-24v24m44-24v24m20-24v24" fill="none" stroke="#c99467" stroke-width="12"/>
    <path d="M46 110q-6-34 18-44 6-28 28-16 10-24 30-6 16-14 28 6 10 14 2 60z" fill="#e0b47e"/>
    <path d="M140 96q16-6 16-30V44h18v26q0 34-26 40z" fill="#e0b47e"/>
    <ellipse cx="170" cy="40" rx="26" ry="20" fill="#e8bf8c"/><path d="M154 24l-3-9m15 7 2-9" fill="none" stroke-width="4"/>
    <Eye x={162} y={37} s={.8}/><Eye x={178} y={37} s={.8}/><Cheek x={155} y={47} s={.8}/><Cheek x={186} y={47} s={.8}/><Smile x={170} y={49} s={.7}/>
    <path d="M46 100q-14 2-14 16" fill="none" stroke-width="4"/>
    <path d="M70 66q8-8 16 0m24-14q8-8 16 0" fill="none" stroke="#f3d3a6" stroke-width="4"/>
  </> },
  'five-breads-two-fish': { scene: 'table', fit: 'translate(3.4 -3.5) scale(1.011)', art: () => <>
    {[[36, 58], [76, 58], [116, 58], [56, 94], [96, 94]].map(([x, y]) => <Roll key={`${x}-${y}`} x={x} y={y} s={.8}/>)}
    <Fish x={170} y={66} s={.8}/><Fish x={170} y={104} s={.8} fill="#9fe0c8"/>
  </> },
  'three-breads-milk': { scene: 'table', fit: 'translate(-4.5 -12) scale(1.011)', art: () => <>
    {[[46, 108], [92, 108], [69, 74]].map(([x, y]) => <Roll key={`${x}-${y}`} x={x} y={y} s={.9}/>)}
    <path d="M140 46h40l6 16v56q0 10-10 10h-32q-10 0-10-10V62z" fill="#fffdf6"/><path d="M186 66q16 2 14 22t-16 18" fill="none" stroke-width="5"/>
    <path d="M134 92h52" stroke="#8fd3e6" stroke-width="7"/>
    <Eye x={152} y={76} s={.55}/><Eye x={168} y={76} s={.55}/><Cheek x={146} y={84} s={.5}/><Cheek x={174} y={84} s={.5}/>
  </> },
  'seven-figs-cheese': { scene: 'table', fit: 'translate(2.1 0) scale(.915)', art: () => <>
    {[[34, 52], [62, 52], [90, 52], [48, 86], [76, 86], [104, 86], [62, 118]].map(([x, y]) => <g key={`${x}-${y}`}>
      <path d={`M${x} ${y - 16}q14 12 12 24-2 10-12 10t-12-10q-2-12 12-24z`} fill="#b48ad8"/><path d={`M${x} ${y - 16}l2-6`} stroke="#6aa774" stroke-width="3"/>
      <circle cx={x - 4} cy={y - 2} r="2.2" fill="#fff" stroke="none" opacity=".8"/>
    </g>)}
    <path d="M128 118h74V64z" fill="#ffd96a"/><path d="M202 64l12 9v54l-12-9z" fill="#f2c24a"/><path d="M202 118l12 9h-74l-12-9z" fill="#f6cf5c"/>
    <g fill="#f2c24a" stroke-width="2"><circle cx="186" cy="104" r="5"/><circle cx="194" cy="86" r="3.5"/></g>
    <Eye x={160} y={104} s={.55}/><Eye x={174} y={104} s={.55}/><Cheek x={156} y={112} s={.5}/><Smile x={167} y={111} s={.45}/>
  </> },
  runner: { scene: 'meadow', fit: 'translate(30.4 2.9) scale(.926)', art: () => <>
    <path d="M20 66h42M12 84h46M26 102h34" stroke="#9fe0c8" stroke-width="6"/>
    <path d="M110 104l-24 18m40-14 18 20" stroke-width="9"/>
    <ellipse cx="82" cy="124" rx="9" ry="5" fill="#ff8e8e"/><ellipse cx="148" cy="128" rx="9" ry="5" fill="#ff8e8e"/>
    <path d="M114 80l-24-12m48 12 22 8" stroke-width="7"/>
    <path d="M100 72q22-14 40 4l-10 34q-20 6-32-6z" fill="#9fe0c8"/>
    <circle cx="128" cy="48" r="21" fill="#ffdcc4"/><path d="M107 47q1-22 21-22t21 22q-8-10-21-10t-21 10z" fill="#8a5a3c"/>
    <Eye x={120} y={50} s={.7}/><Eye x={136} y={50} s={.7}/><Cheek x={115} y={57} s={.6}/><Cheek x={141} y={57} s={.6}/>
    <path d="M122 58q6 8 12 0z" fill="#ff8e8e" stroke-width="2.5"/><path d="M156 34q6 8 0 12-6-4 0-12z" fill="#8fd3e6" stroke-width="2"/>
  </> },
  twins: { scene: 'meadow', fit: 'translate(-7.6 8.4) scale(1.069)', art: () => <>
    <path d="M98 100h24" stroke-width="5"/>
    <Kid x={80} y={54} robe="#ffb3c4"/><Kid x={140} y={54} robe="#ffb3c4"/>
    <path d="M110 22q-8-10-16-2t16 16q24-8 16-16t-16 2z" fill="#ff8ea8" stroke-width="2.5"/>
  </> },
  small: { scene: 'meadow', fit: 'translate(13.9 13.9) scale(.862)', art: () => <>
    <rect x="146" y="14" width="24" height="116" rx="5" fill="#fffdf6"/>
    {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M146 ${26 + i * 15}h${i % 2 ? 8 : 14}`} stroke-width="3"/>)}
    <Kid x={96} y={86} s={.7} robe="#a8dd8e"/>
    <path d="M126 128V82m-6 8 6-8 6 8m-12 30 6 8 6-8" fill="none" stroke-width="3"/>
    <Spark x={60} y={40}/>
  </> },
  'ark-build': { scene: 'meadow', fit: 'translate(11.3 15.7) scale(.862)', art: () => <>
    <path d="M66 96h140l-24 32H90z" fill="#e0a26a"/>
    <path d="M90 96V64m28 32V56m28 40V52m28 44V60" stroke="#c98d55" stroke-width="7"/><path d="M84 62q56-24 110 0" fill="none" stroke="#c98d55" stroke-width="7"/>
    <Kid x={44} y={60} hair="#fffdf6" beard="#fffdf6" robe="#c7a6f0"/>
    <g transform="rotate(-30 74 52)"><rect x="70" y="40" width="8" height="38" rx="4" fill="#c99467"/><rect x="60" y="30" width="28" height="14" rx="4" fill="#9aa6b8"/></g>
    <path d="M92 28q-4-10 4-16m6 20q4-10 12-10" fill="none" stroke="#ffb547" stroke-width="3"/>
  </> },
  boat: { scene: 'storm', fit: 'translate(24.2 19.7) scale(.787)', art: () => <>
    <path d="M14 50q0-20 22-20 8-18 30-10 18-6 22 12 12 4 6 18H22q-10 0-8-10z" fill="#a9b6cc"/>
    <Eye x={46} y={40} s={.5}/><Eye x={62} y={40} s={.5}/><Frown x={54} y={48} s={.5}/>
    <path d="m40 62-8 14h10l-8 14" fill="none" stroke="#ffd24a" stroke-width="4"/>
    <Sun x={186} y={32} r={14}/>
    <path d="M50 104h120l-18 24H68z" fill="#e0a26a"/>
    <Kid x={110} y={54} s={.9} robe="#fffdf6" beard="#8a5a3c"/>
    <path d="M124 74l20-24" stroke-width="6"/><circle cx="146" cy="47" r="5" fill="#ffdcc4"/>
    <Waves/>
  </> },
  nativity: { scene: 'night', fit: 'translate(31.3 25.3) scale(.715)', art: () => <>
    <Spark x={110} y={12} r={11} fill="#ffd96a"/>
    <path d="M24 68 110 26l86 42" fill="none" stroke="#c98d55" stroke-width="10"/>
    <Kid x={54} y={66} s={.8} robe="#8cbcf2" hood="#8cbcf2"/><Kid x={166} y={66} s={.8} robe="#c99467" beard="#8a5a3c"/>
    <Manger x={110} y={100} s={.85}/>
  </> },
  stage: { art: () => <>
    <Sky fill="#4a4a86"/>
    <path d="M78 0h64l46 118H32z" fill="#fff3b8" stroke="none" opacity=".3"/>
    <path d="M0 112h220V140H0z" fill="#d9a26a"/><path d="M0 124h220" fill="none" stroke="#b97c48"/>
    <ellipse cx="110" cy="116" rx="58" ry="8" fill="#fff3b8" stroke="none" opacity=".7"/>
    <text x="110" y="100" text-anchor="middle" font-size="72" font-weight="900" fill="#ffd96a" stroke-width="4" paint-order="stroke">?</text>
    <Spark x={70} y={44}/><Spark x={152} y={36} r={8}/><Spark x={156} y={88} r={6}/>
    <path d="M0 0h54q-20 56 4 112H0zM220 0h-54q20 56-4 112h58z" fill="#e65f78"/>
    <path d="M14 0q8 56 0 112M206 0q-8 56 0 112" fill="none" stroke="#c8445e" stroke-width="3"/>
    <path d="M0 0h220v14q-27 12-55 0t-55 0-55 0-55 0z" fill="#c8445e"/>
  </> },
};

/** Niedliche Figur in einer kleinen Szene, als Bildkarte mit Rahmen. Das Motiv hängt an der Antwort, nicht am Feld. */
export function StoryPicture({ motif }: { motif: KidsPictureMotif }) {
  const id = useId();
  const { scene, fit, art: Art } = PICTURES[motif];
  const Scene = scene && SCENES[scene];
  return <svg class="kids-story-picture" viewBox="-11 -7 242 154" aria-hidden="true" data-motif={motif}>
    <defs><clipPath id={`${id}-frame`}><rect width="220" height="140" rx="18"/></clipPath></defs>
    <g stroke="#12324a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
      <g clip-path={`url(#${id}-frame)`}>{Scene && <Scene/>}<g transform={fit}><Art/></g></g>
      <rect width="220" height="140" rx="18" fill="none"/>
    </g>
  </svg>;
}
