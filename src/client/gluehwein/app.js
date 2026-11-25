import { GameEngine, ROUND_SECONDS, MAX_LIGHTS, MAX_MISSES } from './engine.js';
import { WinterMusic } from './music.js';
import { PixelRenderer } from './pixel-renderer.js';
import '@fontsource/pixelify-sans/latin-400.css';
import '@fontsource/pixelify-sans/latin-700.css';
import '@fontsource/figtree/latin-400.css';
import '@fontsource/figtree/latin-600.css';

const $ = id => document.getElementById(id);
const canvas = $('game');
const laneButtons = [...document.querySelectorAll('[data-lane]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let W = 1000, H = 700, visualTime = 0, lastTime = 0;
let particles = [], ripple = [], input = null, toastUntil = 0, lastJoke = -99;
let soundOn = true;
let storyReturnFocus = null, resumeAfterStory = false;
const music = new WinterMusic();
let cachedHUD = '', bestScore = 0;
try { bestScore = Number(localStorage.getItem('gluehwein-slide-best')) || 0; } catch {}

const engine = new GameEngine({ onEvent: handleEvent });
const renderer = new PixelRenderer(canvas, { reducedMotion });
const laneY = lane => renderer.laneY(lane);
const personScale = () => renderer.personScale();

function resize() {
  const rect = canvas.getBoundingClientRect();
  H = rect.height / Math.max(1, rect.width) * W;
  renderer.resize(rect.width, rect.height);
}

function render(dt) {
  for (const p of particles) {
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
    p.vy += (p.kind === 'text' ? -8 : 120) * dt;
  }
  particles = particles.filter(p => p.life > 0);
  for (const r of ripple) r.life -= dt;
  ripple = ripple.filter(r => r.life > 0);
  renderer.draw(engine, visualTime, particles, ripple);
}

function toast(text, seconds=2.6, force=false) {
  if(!force&&visualTime<toastUntil-.7)return;
  $('toast').textContent=text;$('toast').classList.add('show');toastUntil=visualTime+seconds;
}

function handleEvent(event) {
  if(event.type==='throw'){
    laneButtons[event.lane].classList.add('pulse');setTimeout(()=>laneButtons[event.lane].classList.remove('pulse'),150);
    tone(240,.055,'triangle',.025);
  }
  if(event.type==='catch'){
    const y=laneY(event.lane);
    ripple.push({x:event.x,lane:event.lane,life:.65});
    particles.push({kind:'text',text:'+'+event.points,x:event.x,y:y-155*personScale(),vx:0,vy:-24,life:1.25});
    if(!reducedMotion)for(let i=0;i<8;i++)particles.push({x:event.x,y:y-30,vx:(Math.random()-.5)*80,vy:-35-Math.random()*70,size:2+Math.random()*2,color:i%2?'#e5c27d':'#e0e8cc',life:.6+Math.random()*.5});
    tone(660,.13,'sine',.04);
    if(event.combo===5)toast('Fünf am Stück. Das wird eine gute Runde!');
    if(event.combo===10)toast('Zehn Treffer in Folge. Stark serviert!');
  }
  if(event.type==='all-lit'){
    toast('Alle 18 Lichter leuchten. Stark gespielt!',3.5,true);
    [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.3,'sine',.025),i*110));
  }
  if(event.type==='spill'){
    if(!reducedMotion)for(let i=0;i<8;i++)particles.push({x:event.x,y:laneY(event.lane),vx:(Math.random()-.5)*100,vy:-Math.random()*50,size:3,color:'#bd795f',life:.6});
    if(visualTime-lastJoke>3.5){toast(event.reason==='short'?'Zu kurz – die nächste Tasse länger aufladen.':'Zu viel Schwung – etwas früher loslassen.');lastJoke=visualTime;}
  }
  if(event.type==='missed-guest' && event.remainingLives>0){
    toast(`Ein Gast geht leer aus. Noch ${event.remainingLives} ${event.remainingLives===1?'Chance':'Chancen'}!`,3,true);
    tone(220,.2,'triangle',.06);
  }
  if(event.type==='finish')finishRound();
}

function tone(frequency,duration,type='sine',volume=.035){
  if(!soundOn)return;
  music.effect(frequency,duration,type,volume);
}

function syncHUD(){
  const t=Math.ceil(engine.remaining),lives=MAX_MISSES-engine.lostCustomers,key=[engine.score,t,engine.lights,lives,engine.state].join(':');
  if(key!==cachedHUD){
    $('score').textContent=engine.score;$('time').textContent=t;$('lives').textContent=lives;
    $('lives').classList.toggle('last-life',lives<=1);
    document.querySelectorAll('.life-heart').forEach((heart, index) => heart.classList.toggle('empty', index >= lives));
    $('lives').parentElement.setAttribute('aria-label',`${lives} von ${MAX_MISSES} Chancen übrig`);
    $('timer-ring').style.strokeDashoffset=175.93*(1-engine.remaining/ROUND_SECONDS);
    document.querySelector('.timer').classList.toggle('urgent',t<=10);
    $('pause').disabled=!['playing','paused'].includes(engine.state);
    $('pause').setAttribute('aria-label',engine.state==='paused'?'Spiel fortsetzen':'Spiel pausieren');
    laneButtons.forEach(b=>b.disabled=engine.state!=='playing');
    cachedHUD=key;
  }
  const power=engine.charge?.power||0,percent=Math.round(power*100);
  $('charge-fill').style.width=percent+'%';$('charge-value').textContent=percent+' %';
  $('charge-meter').setAttribute('aria-valuenow',String(percent));
  $('charge-strip').classList.toggle('charging',!!engine.charge);
  laneButtons.forEach((button,lane)=>{button.classList.toggle('charging',engine.charge?.lane===lane);button.style.setProperty('--charge',engine.charge?.lane===lane?percent+'%':'0%');});
}

function startRound(){
  $('intro').hidden=true;$('results').hidden=true;$('pause-overlay').hidden=true;$('scene-note').hidden=true;
  input=null;engine.start();particles=[];ripple=[];lastJoke=-99;cachedHUD='';
  music.start({restart:true});
  toast('Tasse halten. Schwung aufladen. Loslassen!',4,true);
  tone(523,.12,'sine',.035);syncHUD();$('pause').focus({preventScroll:true});
}

function pauseRound(){
  if(engine.state==='playing'){input=null;engine.pause();music.stop();
    $('pause-overlay').hidden=false;$('resume').focus({preventScroll:true});
  }else if(engine.state==='paused')resumeRound();
  syncHUD();
}

function resumeRound(){
  $('pause-overlay').hidden=true;engine.resume();music.start();cachedHUD='';syncHUD();$('pause').focus({preventScroll:true});
}

function finishRound(){
  music.stop();
  const gameOver=engine.endReason==='customers';
  $('result-score').textContent=engine.score;$('result-served').textContent=engine.served;$('result-lights').textContent=engine.lights;
  const isRecord=engine.score>bestScore;bestScore=Math.max(bestScore,engine.score);
  try{localStorage.setItem('gluehwein-slide-best',String(bestScore));}catch{}
  $('best').textContent=(isRecord?'Neuer persönlicher Rekord: ':'Dein Rekord: ')+bestScore+' Punkte';
  input=null;
  $('result-eyebrow').textContent=gameOver?'DREI GÄSTE GINGEN LEER AUS':'60 SEKUNDEN GESCHAFFT';
  $('result-title').innerHTML=gameOver?'Game Over.<br><em>Noch eine Runde?</em>':engine.lights===18?'Stark serviert.<br><em>Prost!</em>':'Runde geschafft.<br><em>Prost!</em>';
  $('result-comment').textContent=gameOver?'Drei Gäste haben das Tresenende ohne Glühwein erreicht. Versuch es noch einmal!':`${engine.served} Becher serviert. Wie viele schaffst du beim nächsten Mal?`;
  $('results').hidden=false;$('pause-overlay').hidden=true;
  $('results').querySelector('.primary').focus({preventScroll:true});
  if(soundOn)(gameOver?[392,330,262]:[523,659,784]).forEach((hz,i)=>music.effect(hz,.22,'sine',.06,i*.14));
}

function locationOnCanvas(event){
  const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)/r.width*W,y:(event.clientY-r.top)/r.height*H};
}

function openStory(){
  if($('story').open)return;
  storyReturnFocus=document.activeElement;
  resumeAfterStory=engine.state==='playing';
  if(resumeAfterStory){input=null;engine.pause();}
  music.stop();syncHUD();
  $('story').showModal();$('story-close').focus({preventScroll:true});
}

function storyClosed(){
  if(resumeAfterStory&&engine.state==='paused')resumeRound();
  resumeAfterStory=false;
  storyReturnFocus?.focus({preventScroll:true});
}
function nearestLane(y){return [0,1,2].reduce((best,lane)=>Math.abs(y-laneY(lane))<Math.abs(y-laneY(best))?lane:best,0);}

function beginPointer(e,lane,target){
  if(input||!engine.beginCharge(lane))return;
  input={type:'pointer',id:e.pointerId};target.setPointerCapture(e.pointerId);e.preventDefault();syncHUD();
}
function releasePointer(e){
  if(input?.type!=='pointer'||input.id!==e.pointerId)return;
  input=null;engine.releaseCharge();e.preventDefault();syncHUD();
}
function cancelInput(){input=null;engine.cancelCharge();syncHUD();}
canvas.addEventListener('pointerdown',e=>beginPointer(e,nearestLane(locationOnCanvas(e).y),canvas));
for(const target of [canvas,...laneButtons]){
  target.addEventListener('pointerup',releasePointer);
  target.addEventListener('pointercancel',cancelInput);
  target.addEventListener('lostpointercapture',e=>{if(input?.type==='pointer'&&input.id===e.pointerId)cancelInput();});
  target.addEventListener('contextmenu',e=>e.preventDefault());
}
laneButtons.forEach((button,lane)=>{
  button.addEventListener('pointerdown',e=>beginPointer(e,lane,button));
  button.addEventListener('keydown',e=>{
    if(!['Enter',' '].includes(e.key)||e.repeat||input)return;
    if(engine.beginCharge(lane)){input={type:'key',key:e.key};e.preventDefault();}
  });
});
$('start').addEventListener('click',startRound);
$('again').addEventListener('click',startRound);
document.querySelectorAll('.story-open').forEach(button=>button.addEventListener('click',openStory));
$('story-close').addEventListener('click',()=>$('story').close());
$('story-return').addEventListener('click',()=>$('story').close());
$('story').addEventListener('close',storyClosed);
$('story').addEventListener('click',e=>{
  if(e.target!==$('story'))return;
  const r=$('story').getBoundingClientRect();
  if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('story').close();
});
$('pause').addEventListener('click',pauseRound);$('resume').addEventListener('click',resumeRound);
$('sound').addEventListener('click',()=>{
  soundOn=!soundOn;music.setEnabled(soundOn);
  $('sound-label').textContent=soundOn?'Musik an':'Musik aus';$('sound').setAttribute('aria-pressed',String(soundOn));
  $('sound').setAttribute('aria-label',soundOn?'Musik und Klänge ausschalten':'Musik und Klänge einschalten');
  if(soundOn&&engine.state==='playing')music.start();
});
document.addEventListener('keydown',e=>{
  if($('story').open)return;
  if(['1','2','3'].includes(e.key)&&engine.state==='playing'){
    e.preventDefault();if(!e.repeat&&!input&&engine.beginCharge(Number(e.key)-1))input={type:'key',key:e.key};
  }
  if(e.key==='Escape'||(e.code==='Space'&&!['BUTTON','A'].includes(document.activeElement?.tagName))){
    if(['playing','paused'].includes(engine.state)){e.preventDefault();pauseRound();}
  }
});
document.addEventListener('keyup',e=>{
  if(input?.type==='key'&&input.key===e.key){input=null;engine.releaseCharge();e.preventDefault();syncHUD();}
});
document.addEventListener('pointerup',releasePointer);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&engine.state==='playing')pauseRound();});

$('share').addEventListener('click',async()=>{
  const url=new URL('./',location.href).href;
  const text=`${engine.score} Punkte und ${engine.served} Becher serviert! Knackst du meinen Rekord bei Glühwein-Slide?`;
  try{
    if(navigator.share){await navigator.share({title:'Glühwein-Slide',text,url});return;}
    if(navigator.clipboard){await navigator.clipboard.writeText(text+'\n'+url);$('share').textContent='Link kopiert';setTimeout(()=>$('share').textContent='Spiel teilen',2500);return;}
    window.prompt('Spiel-Link zum Kopieren',url);
  }catch(error){
    if(error.name==='AbortError')return;
    try{await navigator.clipboard.writeText(url);$('share').textContent='Link kopiert';}catch{window.prompt('Spiel-Link zum Kopieren',url);}
  }
});

window.addEventListener?.('blur',()=>{if(engine.state==='playing')pauseRound();});
new ResizeObserver(resize).observe($('stage'));resize();syncHUD();
function frame(time){
  const dt=lastTime?Math.min((time-lastTime)/1000,1):0;lastTime=time;
  if(engine.state!=='paused')visualTime+=dt;
  let pending=dt;
  while(pending>1e-7&&engine.state==='playing'){
    const step=Math.min(.05,pending);engine.update(step);pending-=step;
  }
  syncHUD();render(engine.state==='paused'?0:dt);
  if(visualTime>toastUntil)$('toast').classList.remove('show');
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
