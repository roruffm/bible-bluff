/** Gemeinsame Bausteine der niedlichen Kids-Zeichnungen: Antwortkarten und Bilderspur-Szenen nutzen dieselben Gesichter und Figuren.
 * Zeichenfläche wie in den Antwortkarten; .blink und .twinkle bewegen sich nur in den Szenen. */
export interface At { x: number; y: number; s?: number }

export const Eye = ({ x, y, s = 1 }: At) => <><ellipse cx={x} cy={y} rx={4.6 * s} ry={5.6 * s} fill="#12324a" stroke="none"/><circle cx={x - 1.6 * s} cy={y - 2 * s} r={1.8 * s} fill="#fff" stroke="none"/></>;
/** Geschlossenes, zufriedenes Auge. */
export const Happy = ({ x, y, s = 1 }: At) => <path d={`M${x - 5 * s} ${y + s}q${5 * s} ${-6 * s} ${10 * s} 0`} fill="none" stroke-width={3 * s}/>;
export const Cheek = ({ x, y, s = 1 }: At) => <ellipse cx={x} cy={y} rx={6 * s} ry={3.6 * s} fill="#ff9fb4" stroke="none" opacity=".8"/>;
export const Smile = ({ x, y, s = 1 }: At) => <path d={`M${x - 5 * s} ${y}q${5 * s} ${5 * s} ${10 * s} 0`} fill="none" stroke-width={2.6 * s}/>;
export const Frown = ({ x, y, s = 1 }: At) => <path d={`M${x - 5 * s} ${y + 3 * s}q${5 * s} ${-5 * s} ${10 * s} 0`} fill="none" stroke-width={2.6 * s}/>;
export const Face = ({ x, y, s = 1 }: At) => <><g class="blink"><Eye x={x - 9 * s} y={y} s={s}/><Eye x={x + 9 * s} y={y} s={s}/></g><Cheek x={x - 15 * s} y={y + 8 * s} s={s}/><Cheek x={x + 15 * s} y={y + 8 * s} s={s}/><Smile x={x} y={y + 8 * s} s={s}/></>;
/** Vierzackiger Glitzerstern; große Sterne bekommen einen kräftigeren Rand. */
export const Spark = ({ x, y, r = 7, fill = '#fff6c2' }: { x: number; y: number; r?: number; fill?: string }) =>
  <path d={`M${x} ${y - r}q${r * .2} ${r * .8} ${r} ${r}q${-r * .8} ${r * .2} ${-r} ${r}q${-r * .2} ${-r * .8} ${-r} ${-r}q${r * .8} ${-r * .2} ${r} ${-r}z`} fill={fill} stroke="#e8b84a" stroke-width={r > 12 ? r / 4 : 2}/>;
/** Sonne mit Gesicht; rays gibt an, wo die Strahlen beginnen und enden (Abstand vom Rand). */
export const Sun = ({ x, y, r = 18, rays = [4, 10] }: { x: number; y: number; r?: number; rays?: [number, number] }) => <>
  {Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return <path key={i} d={`M${x + Math.cos(a) * (r + rays[0])} ${y + Math.sin(a) * (r + rays[0])}L${x + Math.cos(a) * (r + rays[1])} ${y + Math.sin(a) * (r + rays[1])}`} stroke="#f0b83c"/>; })}
  <circle cx={x} cy={y} r={r} fill="#ffd96a"/><Face x={x} y={y - r * .05} s={r / 30}/>
</>;
/** Kraushaar hinter dem Kopf: umrandete Locken, darüber dieselben ohne Rand, damit innen keine Linien stehen bleiben. */
const CURLS = Array.from({ length: 7 }, (_, i) => Math.PI * (1 + i / 6));
const Curls = ({ x, y, s, hair }: { x: number; y: number; s: number; hair: string }) => <>
  {[true, false].map(outline => CURLS.map(a => <circle key={`${outline}${a}`} cx={x + Math.cos(a) * 19 * s} cy={y - 2 * s + Math.sin(a) * 19 * s} r={outline ? 8 * s : 8 * s - 1.5} fill={hair} stroke={outline ? undefined : 'none'}/>))}
</>;
/** Kleine Figur mit großem Kopf; Hautfarbe, Kraushaar, Bart oder Kopftuch nach Bedarf, schlafend oder besorgt. */
export const Kid = ({ x, y, s = 1, robe = '#8cc4ee', hair = '#8a5a3c', skin = '#ffdcc4', curly, beard, hood, sleepy, worried }: At & { robe?: string; hair?: string; skin?: string; curly?: boolean; beard?: string; hood?: string; sleepy?: boolean; worried?: boolean }) => <>
  <path d={`M${x - 18 * s} ${y + 56 * s}q${-s} ${-30 * s} ${18 * s} ${-36 * s} ${19 * s} ${6 * s} ${18 * s} ${36 * s}z`} fill={robe}/>
  {curly && <Curls x={x} y={y} s={s} hair={hair}/>}
  <circle cx={x} cy={y} r={21 * s} fill={skin}/>
  {beard && <path d={`M${x - 19 * s} ${y + 2 * s}q${3 * s} ${26 * s} ${19 * s} ${26 * s}t${19 * s} ${-26 * s}q${-8 * s} ${9 * s} ${-19 * s} ${9 * s}t${-19 * s} ${-9 * s}z`} fill={beard}/>}
  <path d={`M${x - 21 * s} ${y - s}q${s} ${-22 * s} ${21 * s} ${-22 * s}t${21 * s} ${22 * s}q${-8 * s} ${-10 * s} ${-21 * s} ${-10 * s}t${-21 * s} ${10 * s}z`} fill={hair}/>
  {hood && <path d={`M${x - 25 * s} ${y + 14 * s}q${-4 * s} ${-40 * s} ${25 * s} ${-40 * s}t${25 * s} ${40 * s}`} fill="none" stroke={hood} stroke-width={9 * s}/>}
  {sleepy ? <><Happy x={x - 8 * s} y={y + 3 * s} s={.7 * s}/><Happy x={x + 8 * s} y={y + 3 * s} s={.7 * s}/></> : <g class="blink"><Eye x={x - 8 * s} y={y + 3 * s} s={.7 * s}/><Eye x={x + 8 * s} y={y + 3 * s} s={.7 * s}/></g>}
  <Cheek x={x - 13 * s} y={y + 10 * s} s={.6 * s}/><Cheek x={x + 13 * s} y={y + 10 * s} s={.6 * s}/>
  {worried ? <Frown x={x} y={y + (beard ? 13 : 10) * s} s={.5 * s}/> : !beard && <Smile x={x} y={y + 10 * s} s={.55 * s}/>}
</>;
/** Krippe mit schlafendem Baby; babyClass erlaubt der Szene, das Baby erst später zu zeigen. */
export const Manger = ({ x, y, s = 1, babyClass }: At & { babyClass?: string }) => <>
  <path d={`M${x - 30 * s} ${y + 34 * s}l${-10 * s} ${14 * s}m${80 * s} ${-14 * s}l${10 * s} ${14 * s}`} stroke-width={4 * s}/>
  <path d={`M${x - 44 * s} ${y + 4 * s}h${88 * s}l${-12 * s} ${32 * s}h${-64 * s}z`} fill="#d9a26a"/>
  {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${x - 40 * s + i * 13 * s} ${y + 6 * s}l${4 * s} ${-12 * s}`} stroke="#e8b84a" stroke-width={3 * s}/>)}
  <g class={babyClass}>
    <ellipse cx={x + 6 * s} cy={y} rx={30 * s} ry={13 * s} fill="#fff8e6"/><circle cx={x - 14 * s} cy={y - 4 * s} r={12 * s} fill="#ffe2cf"/>
    <Happy x={x - 19 * s} y={y - 5 * s} s={.55 * s}/><Happy x={x - 9 * s} y={y - 5 * s} s={.55 * s}/><Cheek x={x - 22 * s} y={y + s} s={.5 * s}/><Cheek x={x - 6 * s} y={y + s} s={.5 * s}/>
  </g>
</>;
/** Schiffsrumpf der Arche. */
export const Hull = () => <><path d="M22 84q88 10 176 0-6 36-34 42H56q-28-6-34-42z" fill="#e0a26a"/><path d="M42 102q68 8 136 0" fill="none" stroke="#b97c48"/></>;
export const Flower = ({ x, y, s = 1, fill = '#ff9fb4' }: At & { fill?: string }) => <g transform={`translate(${x} ${y}) scale(${s})`}>
  <path d="M0 12v-10" stroke="#5ea86a" stroke-width="3"/>
  {[0, 72, 144, 216, 288].map(a => <circle key={a} cx={Math.cos(a * Math.PI / 180) * 4.5} cy={Math.sin(a * Math.PI / 180) * 4.5} r="3.6" fill={fill} stroke-width="1.6"/>)}
  <circle r="2.6" fill="#ffd96a" stroke-width="1.6"/>
</g>;
export const Cloud = ({ x, y, s = 1, fill = '#fff' }: At & { fill?: string }) => <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 0q2-10 12-10 4-8 14-4 10-2 10 8 8 2 4 8h-36q-6-1-4-2z" fill={fill} stroke-width="2"/>;
export const Star = ({ x, y, s = 1 }: At) => <g transform={`translate(${x} ${y}) scale(${s})`}><path class="twinkle" d="M0 -4l1.2 3 3 .2-2.3 2 .8 3-2.7-1.6-2.7 1.6.8-3-2.3-2 3-.2z" fill="#ffe27a" stroke="none"/></g>;
