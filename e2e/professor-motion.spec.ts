import { expect, test } from '@playwright/test';
import { createKidsGame, type KidsPhase } from '../src/shared/kids-game';
import { packKidsGame } from '../src/shared/kids-remote';

test.use({ viewport: { width: 1280, height: 800 }, isMobile: false });
test('Professor: große Bewegungen bleiben von Text und Bedienung getrennt und lassen sich reduzieren', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/kids');
  const scenes: { phase: KidsPhase; index: number; result?: 'correct'|'none'; motion: string }[] = [
    { phase: 'welcome', index: 0, motion: 'greet' },
    { phase: 'chapter', index: 0, motion: 'spin' },
    { phase: 'reading', index: 0, motion: 'present' },
    { phase: 'moving', index: 0, motion: 'watch' },
    { phase: 'paused', index: 0, motion: 'listen' },
    { phase: 'locked', index: 0, motion: 'hold' },
    { phase: 'revealed', index: 0, result: 'correct', motion: 'startle' },
    { phase: 'revealed', index: 1, result: 'correct', motion: 'double-take' },
    { phase: 'revealed', index: 2, result: 'correct', motion: 'stumble' },
    { phase: 'revealed', index: 3, result: 'correct', motion: 'adjust' },
    { phase: 'revealed', index: 4, result: 'correct', motion: 'shrug' },
    { phase: 'revealed', index: 5, result: 'correct', motion: 'facepalm' },
    { phase: 'revealed', index: 9, result: 'correct', motion: 'celebrate' },
    { phase: 'revealed', index: 0, result: 'none', motion: 'encourage' },
    { phase: 'revealed', index: 1, result: 'none', motion: 'applaud' },
    { phase: 'returning', index: 0, motion: 'guide' },
    { phase: 'judging', index: 0, motion: 'think' },
    { phase: 'superbluff', index: 9, motion: 'nervous' },
    { phase: 'finished', index: 9, result: 'correct', motion: 'bow' },
  ];
  for (const scene of scenes) {
    const game=createKidsGame(); game.phase=scene.phase; game.index=scene.index;
    if (scene.phase === 'moving') game.deadline=Date.now()+30000;
    game.results=game.results.map((_,index)=>index<scene.index ? 'correct' : index===scene.index ? scene.result??null : null);
    const response=await request.post('/api/kids-remotes',{data:{easy:false,game:packKidsGame(game,Date.now())}});
    expect(response.status()).toBe(201);
    const remote=await response.json();
    await page.evaluate(({id,token})=>sessionStorage.setItem('bb:kids:display',JSON.stringify({id,token})),{id:remote.id,token:remote.ownerToken});
    await page.reload();
    const figure=page.locator(`.professor-showcase[data-motion="${scene.motion}"]`);
    await expect(figure).toBeVisible();
    const transforms:string[]=[];
    for (const time of [0,350,700,1300,2000]) {
      const frame=await figure.evaluate((svg,time)=>{
        const animations=svg.getAnimations({subtree:true});
        for (const animation of animations) { animation.pause(); animation.currentTime=time; }
        const box=svg.getBoundingClientRect(),head=svg.querySelector('.bluff-head')!.getBoundingClientRect();
        const bubble=svg.closest('.kids-reaction')?.querySelector('.kids-reaction-bubble')?.getBoundingClientRect();
        const transforms=Array.from(svg.querySelectorAll('.bluff-performer,.bluff-arm,.bluff-head')).map(el=>getComputedStyle(el).transform).join('|');
        return { animations:animations.length,transforms,
          clipped:getComputedStyle(svg).overflow==='hidden',
          headInside:head.left>=box.left-2 && head.right<=box.right+2 && head.top>=box.top-2 && head.bottom<=box.bottom+2,
          overlap:!!bubble && box.left<bubble.right && box.right>bubble.left && box.top<bubble.bottom && box.bottom>bubble.top,
          overflow:document.documentElement.scrollWidth>innerWidth+1,
        };
      },time);
      expect(frame.animations,scene.motion).toBeGreaterThan(0);
      expect(frame.clipped,scene.motion).toBe(true);
      expect(frame.headInside,`${scene.motion} at ${time} ms`).toBe(true);
      expect(frame.overlap,scene.motion).toBe(false);
      expect(frame.overflow,scene.motion).toBe(false);
      transforms.push(frame.transforms);
    }
    expect(new Set(transforms).size,scene.motion).toBeGreaterThan(1);
    await page.emulateMedia({reducedMotion:'reduce'});
    // Die Medienumschaltung wird erst beim nächsten Style-Abgleich wirksam.
    // Pausierte Animationsobjekte aus den Stichproben sind kein Maß für sichtbare Bewegung.
    await expect.poll(()=>figure.evaluate(svg=>[svg,...svg.querySelectorAll('*')].every(el=>getComputedStyle(el).animationName==='none'))).toBe(true);
    await expect.poll(()=>figure.evaluate(svg=>Array.from(svg.querySelectorAll('.bluff-performer,.bluff-arm,.bluff-head,.bluff-glasses')).every(el=>getComputedStyle(el).transform==='none'))).toBe(true);
    await page.emulateMedia({reducedMotion:'no-preference'});
  }
});
