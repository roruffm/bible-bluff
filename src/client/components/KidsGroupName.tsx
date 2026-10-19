import { KIDS_GROUPS, type KidsGroup } from '../../shared/kids-show-questions';

/** Wiedererkennbares Symbol und Name bilden überall eine gemeinsame Beschriftung. */
export function KidsGroupName({ group }: { group:KidsGroup }) {
  return <span class={`kids-group-name group-${group}`} data-group={group}><svg class="kids-group-symbol" viewBox="0 0 40 40" aria-hidden="true">
    {group==='minis' ? <><circle cx="19" cy="18" r="16" fill="#fff0a3"/><path d="m26 26 10 10" fill="none" stroke="#12324a" stroke-width="8" stroke-linecap="round"/><path d="m26 26 10 10" fill="none" stroke="#d8a34e" stroke-width="4" stroke-linecap="round"/><circle cx="17" cy="16" r="12" fill="#a6e1db" stroke="#12324a" stroke-width="2.5"/><path d="M9 13a8 8 0 0 1 6-5" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><circle cx="14" cy="16" r="1.2" fill="#12324a"/><circle cx="21" cy="16" r="1.2" fill="#12324a"/><path d="M14 21q3.5 3 7 0" fill="none" stroke="#176a67" stroke-width="1.6" stroke-linecap="round"/></> : group==='mittis' ? <><circle cx="20" cy="20" r="18" fill="#fff4bd"/><path d="m20 3 5 11 12 2-9 8 3 13-11-7-11 7 3-13-9-8 12-2z" fill="#ffd05a" stroke="#976611" stroke-width="2" stroke-linejoin="round"/><path d="m18 11-3 8-6 1" fill="none" stroke="#fff9d7" stroke-width="2" stroke-linecap="round"/></> : group==='maxis' ? <><path d="M21 2c2 9 13 11 10 20-2 5-7 7-12 5C8 25 7 16 13 10c0 5 4 5 4 5s5-5 4-13" fill="#ff9c45" stroke="#963a22" stroke-width="2" stroke-linejoin="round"/><path d="M21 14c0 5 5 5 4 9-1 3-7 4-10 0-2-3 3-5 6-9" fill="#ffe679"/><path d="m13 27 13 0-3 11h-6z" fill="#93633b" stroke="#12324a" stroke-width="2"/><path d="M12 27h15" stroke="#12324a" stroke-width="3" stroke-linecap="round"/></> : <path d="M20 35C-6 19 7-1 20 12 33-1 46 19 20 35" fill="#dc6d83" stroke="#92394e" stroke-width="2"/>}
  </svg><span>{KIDS_GROUPS[group].name}</span></span>;
}

export function KidsGroupText({ text }: { text:string }) {
  const groups=['minis','mittis','maxis'] as const;
  const names=groups.map(group=>KIDS_GROUPS[group].name);
  return <>{text.split(new RegExp(`(${names.join('|')})`,'g')).map((part,index)=>{
    const group=groups.find(group=>KIDS_GROUPS[group].name===part);
    return group ? <KidsGroupName key={index} group={group}/> : part;
  })}</>;
}
