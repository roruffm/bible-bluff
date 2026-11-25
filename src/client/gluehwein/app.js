import { GameEngine, ROUND_SECONDS, MAX_LIGHTS, MAX_MISSES } from './engine.js';
import { WinterMusic } from './music.js';

const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');
const laneButtons = [...document.querySelectorAll('[data-lane]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let W = 1000, H = 700, pixels = 1, scenery, visualTime = 0, lastTime = 0;
let particles = [], ripple = [], input = null, toastUntil = 0, lastJoke = -99;
let soundOn = true;
let storyReturnFocus = null, resumeAfterStory = false;
const music = new WinterMusic();
let cachedHUD = '', bestScore = 0;
try { bestScore = Number(localStorage.getItem('gluehwein-slide-best')) || 0; } catch {}

const engine = new GameEngine({ onEvent: handleEvent });
const laneY = lane => H * (.34 + lane * .235);
const personScale = () => Math.max(.63, Math.min(1.13, H / 980));
const colors = ['#c88465', '#7c9f9a', '#b79c65', '#776f91', '#a46a64', '#547f85'];
const skins = ['#e6bd93', '#c79368', '#a96f4d', '#76503f'];
const snow = Array.from({length: 55}, (_, i) => ({ x: (i * 197.3 % 1000), y: (i * 113.8 % 1100), speed: 8 + i % 9 * 2, size: 1.6 + i % 4 * .6 }));

function rounded(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function fillRound(c, x, y, w, h, r, color) { c.fillStyle = color; rounded(c, x, y, w, h, r); c.fill(); }
function path(c, pts, fill, stroke, width = 2) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); if (fill) { c.closePath(); c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); } }
function circle(c, x, y, r, color) { c.fillStyle = color; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill(); }

function resize() {
  const rect = canvas.getBoundingClientRect();
  pixels = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * pixels);
  canvas.height = Math.round(rect.height * pixels);
  W = 1000;
  H = rect.height / Math.max(1, rect.width) * 1000;
  makeScenery();
}

function building(c, x, y, width, height, color, lit = false) {
  c.fillStyle = color;
  c.fillRect(x, y-height, width, height);
  path(c, [[x-5,y-height],[x+width/2,y-height-45],[x+width+5,y-height]], color);
  path(c, [[x-5,y-height],[x+width/2,y-height-45],[x+width+5,y-height]], null, '#9bb5b34d', 4);
  c.strokeStyle = '#082a2f88'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(x+width*.5,y-height+8); c.lineTo(x+width*.5,y); c.moveTo(x+4,y-height*.55); c.lineTo(x+width-4,y-height*.55); c.stroke();
  for (let row=0;row<2;row++) for (let col=0;col<2;col++) {
    const wx = x + width*(.19 + col*.43), wy = y-height+15+row*(height*.43);
    fillRound(c,wx,wy,width*.2,16,2,lit ? '#e6bd7899' : '#20474a');
  }
}

function tree(c, x, y, scale) {
  c.save(); c.translate(x,y); c.scale(scale,scale);
  c.fillStyle='#533e30'; c.fillRect(-7,-12,14,24);
  path(c,[[-45,-12],[0,-130],[45,-12]],'#163f3d');
  path(c,[[-37,-48],[0,-146],[37,-48]],'#21504a');
  path(c,[[-25,-84],[0,-154],[25,-84]],'#2b5b50');
  path(c,[[-28,-86],[0,-154],[27,-86]],null,'#c2d1ba55',3);
  for (let i=0;i<10;i++) circle(c, Math.sin(i*2.5)*(12+i*2), -120+i*10,2.8,i%2 ? '#f3d28c' : '#be6b51');
  star(c,0,-158,7,'#f3d292'); c.restore();
}

function star(c,x,y,r,color) {
  c.fillStyle=color; c.beginPath();
  for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2, rr=i%2?r*.4:r; const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;i?c.lineTo(px,py):c.moveTo(px,py);}
  c.closePath();c.fill();
}

function makeScenery() {
  scenery=document.createElement('canvas');scenery.width=canvas.width;scenery.height=canvas.height;
  const c=scenery.getContext('2d'),s=canvas.width/W;c.scale(s,s);
  const grad=c.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#12373e');grad.addColorStop(.5,'#1a4143');grad.addColorStop(1,'#1e4545');c.fillStyle=grad;c.fillRect(0,0,W,H);
  const horizon = H*.245;
  for(let i=0;i<33;i++){circle(c,(i*137.3)%1000,12+(i*43.7)%Math.max(20,horizon*.7),i%4===0?1.5:.85,'#dce4cb66');}
  c.globalAlpha=.6;
  building(c,12,horizon,93,77,'#244b4f');building(c,111,horizon,84,90,'#2b5353',true);
  building(c,248,horizon,98,101,'#294d4e');building(c,349,horizon,100,127,'#305352',true);
  building(c,453,horizon,93,101,'#2d5050',true);building(c,550,horizon,87,81,'#284a4e');
  building(c,646,horizon,88,92,'#23494b');building(c,886,horizon,96,110,'#2c4e50',true);
  c.globalAlpha=1;tree(c,801,horizon+11,Math.min(1,H/830));
  path(c,[[0,horizon+14],[1000,horizon+14]],null,'#7a969042',4);
  for(let lane=0;lane<3;lane++){
    const y=laneY(lane), sc=personScale();
    // Three polished wooden counters, each a separate playable lane.
    c.shadowColor='#06252a77';c.shadowBlur=12;c.shadowOffsetY=12;
    fillRound(c,77,y+5,865,42*sc+10,9,'#694537');c.shadowBlur=0;c.shadowOffsetY=0;
    fillRound(c,77,y-9,865,25*sc+8,8,'#b4845a');
    c.fillStyle='#d9b28688';c.fillRect(87,y-7,844,3);
    for(let j=1;j<5;j++){path(c,[[89,y+j*9*sc+12],[930,y+j*9*sc+12]],null,'#3d302526',1.5);}
    c.setLineDash([5,12]);path(c,[[210,y+3],[887,y+3]],null,'#f3d09b3d',2);c.setLineDash([]);
    fillRound(c,83,y+35*sc,35,34*sc,4,'#12343b');
    c.fillStyle='#d8cbb0';c.font=`${Math.max(20,23*sc)}px Georgia`;c.textAlign='center';c.fillText(String(lane+1),100,y+59*sc);
    // Snow on the far edge and supporting legs.
    path(c,[[80,y-10],[260,y-11],[370,y-9],[620,y-12],[825,y-9],[940,y-11]],null,'#c7d5c7bb',3);
    fillRound(c,147,y+48*sc,18,Math.max(10,Math.min(55,H*.035)),3,'#493c32');
    fillRound(c,858,y+48*sc,18,Math.max(10,Math.min(55,H*.035)),3,'#493c32');
    // A little chalkboard invitation, always decorative.
    fillRound(c,30,y-48*sc,112,33*sc,4,'#123237');c.strokeStyle='#b7956377';c.lineWidth=2;c.strokeRect(31,y-47*sc,110,31*sc);
    c.fillStyle='#e3c99c';c.font=`${21*sc}px Georgia`;c.textAlign='center';c.fillText('Glühwein',86,y-25*sc);
  }
  // Snowy little visitor at the edge of the square.
  const sy=Math.min(H-39,laneY(2)+98*personScale());
  c.save();c.translate(965,sy);c.scale(personScale()*.65,personScale()*.65);
  circle(c,0,0,28,'#c7d6ca');circle(c,0,-34,19,'#d4dfd1');
  fillRound(c,-21,-59,42,6,2,'#17333b');fillRound(c,-14,-78,28,23,3,'#16313a');
  path(c,[[3,-36],[23,-32],[3,-29]],'#ce8d59');circle(c,-4,-41,2.2,'#23434a');circle(c,6,-42,2.2,'#23434a');
  fillRound(c,-20,-21,38,9,3,'#b66f5b');c.restore();
}

function mug(c,x,y,scale=1,gold=false,rotation=0) {
  c.save();c.translate(x,y);c.rotate(rotation);c.scale(scale,scale);
  c.strokeStyle=gold?'#edce8a':'#dc9673';c.lineWidth=4;c.beginPath();c.arc(16,-9,8,-Math.PI*.6,Math.PI*.6);c.stroke();
  fillRound(c,-17,-26,34,31,6,gold?'#e1ba72':'#ad5548');
  c.fillStyle='#f4d49a';c.beginPath();c.ellipse(0,-25,17,5,0,0,Math.PI*2);c.fill();
  c.fillStyle='#633438';c.beginPath();c.ellipse(0,-25,12,3,0,0,Math.PI*2);c.fill();
  star(c,0,-10,6,'#f7dfad');
  c.strokeStyle='#efead4a0';c.lineWidth=2;c.beginPath();
  for(let j=0;j<2;j++){let off=Math.sin(visualTime*2+j)*3;c.moveTo(-5+j*10,-32);c.bezierCurveTo(-10+j*10+off,-40,2+j*10-off,-43,-4+j*10,-50);}
  c.stroke();c.restore();
}

function person(c,guest) {
  const s=personScale(), y=laneY(guest.lane), bob=guest.served?Math.sin(visualTime*6)*1.5:Math.sin(visualTime*3+guest.phase)*2;
  c.save();c.translate(guest.x,y-8+bob);c.scale(s,s);
  if(guest.served)c.globalAlpha=Math.min(1,guest.leaveIn*2);
  c.fillStyle=colors[guest.color];c.beginPath();c.roundRect(-29,-67,58,60,[24,24,5,5]);c.fill();
  fillRound(c,-8,-77,16,22,5,skins[guest.skin]);
  c.fillStyle=skins[guest.skin];c.beginPath();c.ellipse(0,-96,22,25,0,0,Math.PI*2);c.fill();
  if(guest.hat){path(c,[[-23,-100],[-19,-124],[0,-135],[18,-122],[23,-100]],colors[(guest.color+2)%colors.length]);fillRound(c,-24,-107,48,13,4,'#c6d0b9');circle(c,0,-135,8,'#d7d9c6');}
  else{path(c,[[-22,-101],[-20,-116],[-9,-123],[11,-122],[23,-109],[21,-97],[13,-108],[0,-111],[-10,-103]],'#554034');}
  circle(c,-7,-95,2,'#324446');circle(c,8,-95,2,'#324446');
  c.strokeStyle='#765847';c.lineWidth=1.8;c.beginPath();c.arc(1,-89,6,.25,Math.PI-.25);c.stroke();
  fillRound(c,-27,-77,54,12,5,'#dec592');fillRound(c,9,-71,11,33,3,'#dec592');
  c.strokeStyle=colors[guest.color];c.lineWidth=14;c.lineCap='round';path(c,[[-20,-52],[-39,-30],[-22,-16]],null,colors[guest.color],14);
  circle(c,-20,-14,7,skins[guest.skin]);
  if(guest.served){mug(c,27,-38,.8,false,-.15);circle(c,30,-43,6,skins[guest.skin]);c.fillStyle='#f0d596';c.font='26px Georgia';c.textAlign='center';c.fillText('✓',0,-150);}
  else{path(c,[[21,-51],[38,-22],[23,-10]],null,colors[guest.color],13);circle(c,21,-10,7,skins[guest.skin]);}
  c.restore();
}

function drawLanterns(c) {
  const top=H*.075;
  c.strokeStyle='#b9b4997d';c.lineWidth=2;c.beginPath();
  c.moveTo(0,top-12);c.quadraticCurveTo(250,top+42,500,top-8);c.quadraticCurveTo(750,top+42,1000,top-12);c.stroke();
  for(let i=0;i<18;i++){
    const x=28+i*55.6, group=x<500?x/500:(x-500)/500;
    const y=top+Math.sin(group*Math.PI)*23, lit=i<engine.lights;
    if(lit){const glow=c.createRadialGradient(x,y+13,1,x,y+13,37);glow.addColorStop(0,'#edc77a66');glow.addColorStop(1,'#edc77a00');c.fillStyle=glow;c.fillRect(x-37,y-25,74,74);}
    path(c,[[x,y-3],[x,y+6]],null,'#a59d79',2);
    fillRound(c,x-7,y+5,14,20,3,lit?'#f0cd80':'#496265');
    c.strokeStyle=lit?'#f9e1ab':'#8c9a884d';c.lineWidth=1.4;c.strokeRect(x-7,y+5,14,20);
  }
}

function render(dt) {
  const scale=canvas.width/W;ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);if(scenery)ctx.drawImage(scenery,0,0);ctx.setTransform(scale,0,0,scale,0,0);
  drawLanterns(ctx);
  for(const guest of [...engine.guests].sort((a,b)=>a.lane-b.lane||a.x-b.x))person(ctx,guest);
  for(let lane=0;lane<3;lane++){
    const y=laneY(lane), charging=engine.charge?.lane===lane;
    if(engine.state==='playing'){
      const pulse=1+Math.sin(visualTime*3+lane)*.07;
      ctx.strokeStyle=charging?'#e7c77fcc':'#d9c48e44';ctx.lineWidth=charging?3:2;
      ctx.beginPath();ctx.ellipse(144,y+2,43*pulse,19*pulse,0,0,Math.PI*2);ctx.stroke();
    }
    mug(ctx,139,y-1,personScale()*1.15);
    if(charging){
      const power=engine.charge.power,barY=y-76*personScale(),barColor=power>.9?'#edac78':'#e6bd78';
      fillRound(ctx,68,barY,165,18,9,'#09232a');
      if(power>0)fillRound(ctx,71,barY+3,Math.max(6,159*power),12,6,barColor);
      ctx.fillStyle='#f9e6bd';ctx.font=`500 ${Math.max(22,14*W/(canvas.width/pixels))}px system-ui`;ctx.textAlign='center';
      ctx.fillText(Math.round(power*100)+' %',150,barY-12);
    }
  }
  for(const cup of engine.cups){
    const wobble=reducedMotion?0:Math.sin(cup.age*14)*.04;
    ctx.fillStyle='#041a2344';ctx.beginPath();ctx.ellipse(cup.x,laneY(cup.lane)+8,22*personScale(),6*personScale(),0,0,Math.PI*2);ctx.fill();
    mug(ctx,cup.x,laneY(cup.lane),personScale(),false,wobble);
  }
  for(const r of ripple){r.life-=dt;ctx.globalAlpha=Math.max(0,r.life*1.7);ctx.strokeStyle='#ebcd8c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,laneY(r.lane)-25*personScale(),(1-r.life)*70,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
  ripple=ripple.filter(r=>r.life>0);
  for(const p of particles){
    p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.kind==='text'?-8:120)*dt;
    ctx.globalAlpha=Math.max(0,Math.min(1,p.life));
    if(p.kind==='text'){ctx.fillStyle='#f9dfab';ctx.font=`500 ${28*personScale()}px system-ui`;ctx.textAlign='center';ctx.fillText(p.text,p.x,p.y);}
    else circle(ctx,p.x,p.y,p.size,p.color);
    ctx.globalAlpha=1;
  }
  particles=particles.filter(p=>p.life>0);
  if(!reducedMotion)for(const flake of snow){
    const fy=(flake.y+visualTime*flake.speed)%(H+20)-10;
    circle(ctx,(flake.x+Math.sin(visualTime*.25+flake.y)*12+1000)%1000,fy,flake.size,'#e4ead533');
  }
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
