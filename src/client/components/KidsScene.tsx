import type { RefObject } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { KidsAction, KidsGame } from '../../shared/kids-game';
import { KIDS_SCENES, KIDS_SCENE_MS, kidsSceneBeat } from '../../shared/kids-scenes';
import { KidsSceneArt } from './KidsSceneArt';
import './kids-scene.css';

export function KidsScene({ game, act, sound, toggleSound, disabled, primaryRef }: { game:KidsGame; act:(action:KidsAction)=>void; sound:boolean; toggleSound:()=>void; disabled:boolean; primaryRef:RefObject<HTMLButtonElement> }) {
  const scene=game.rounds[game.index].question.scene!;
  const elapsed=()=>Math.min(KIDS_SCENE_MS,Math.max(0,KIDS_SCENE_MS-((game.deadline??Date.now())-Date.now())));
  const [time,setTime]=useState(elapsed), [offset]=useState(elapsed);
  useEffect(()=>{ const timer=window.setInterval(()=>setTime(elapsed()),100); return()=>clearInterval(timer); },[game.deadline]);
  const beat=kidsSceneBeat(time), caption=KIDS_SCENES[scene].captions[beat];
  return <section class="kids-cinema" aria-labelledby="kids-cinema-title" style={{'--scene-offset':`${-offset}ms`}} data-scene={scene}>
    <header><span class="kids-eyebrow">DIE BILDERSPUR</span><h1 id="kids-cinema-title">Augen auf, Detektive!</h1><span class="kids-cinema-listen" aria-hidden="true">◉</span></header>
    <div class="kids-cinema-screen"><KidsSceneArt scene={scene} beat={beat}/><div class="kids-cinema-steps" aria-hidden="true">{[0,1,2].map(i=><i key={i} class={i<=beat ? 'is-seen' : ''}/>)}</div></div>
    <p class="kids-cinema-caption" role="status">{caption}</p>
    <div class="kids-cinema-progress" role="progressbar" aria-label="Fortschritt der Szene" aria-valuemin={0} aria-valuemax={10} aria-valuenow={Math.min(10,Math.floor(time/1000))}><span style={{width:`${time/KIDS_SCENE_MS*100}%`}}/></div>
    <footer><p>Erst schauen. Gleich wird geraten!</p><div class="kids-cinema-controls"><button type="button" class="kids-tool" aria-pressed={sound} onClick={toggleSound}>{sound ? 'Klang ausschalten' : 'Klang einschalten'}</button><button type="button" class="kids-button kids-primary" ref={primaryRef} disabled={disabled} onClick={()=>act('end-scene')}>Zur Frage →</button></div></footer>
  </section>;
}
