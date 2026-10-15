import { KIDS_GROUPS, type KidsGroup } from '../../shared/kids-show-questions';

/** Wiedererkennbares Symbol und Name bilden überall eine gemeinsame Beschriftung. */
export function KidsGroupName({ group }: { group:KidsGroup }) {
  return <span class={`kids-group-name group-${group}`} data-group={group}><svg class="kids-group-symbol" viewBox="0 0 40 40" aria-hidden="true">
    {group==='minis' ? <><circle cx="20" cy="27" r="12" fill="#fff0a3"/><path d="M18 14Q3 5 6 18q4 7 13 3m3-7Q37 5 34 18q-4 7-13 3" fill="#a6e1db" stroke="#176a67" stroke-width="2"/><path d="m16 9-3-5m11 5 3-5" fill="none" stroke="#12324a" stroke-width="2" stroke-linecap="round"/><ellipse cx="20" cy="24" rx="7" ry="11" fill="#ffd65f" stroke="#12324a" stroke-width="2"/><path d="M14 23h12" stroke="#12324a" stroke-width="2"/><circle cx="20" cy="12" r="6" fill="#177d71" stroke="#12324a" stroke-width="2"/><circle cx="18" cy="11" r="1" fill="#fff"/><circle cx="22" cy="11" r="1" fill="#fff"/></> : group==='mittis' ? <><circle cx="20" cy="20" r="18" fill="#fff4bd"/><path d="m20 3 5 11 12 2-9 8 3 13-11-7-11 7 3-13-9-8 12-2z" fill="#ffd05a" stroke="#976611" stroke-width="2" stroke-linejoin="round"/><path d="m18 11-3 8-6 1" fill="none" stroke="#fff9d7" stroke-width="2" stroke-linecap="round"/></> : group==='maxis' ? <><path d="M21 2c2 9 13 11 10 20-2 5-7 7-12 5C8 25 7 16 13 10c0 5 4 5 4 5s5-5 4-13" fill="#ff9c45" stroke="#963a22" stroke-width="2" stroke-linejoin="round"/><path d="M21 14c0 5 5 5 4 9-1 3-7 4-10 0-2-3 3-5 6-9" fill="#ffe679"/><path d="m13 27 13 0-3 11h-6z" fill="#93633b" stroke="#12324a" stroke-width="2"/><path d="M12 27h15" stroke="#12324a" stroke-width="3" stroke-linecap="round"/></> : <path d="M20 35C-6 19 7-1 20 12 33-1 46 19 20 35" fill="#dc6d83" stroke="#92394e" stroke-width="2"/>}
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
