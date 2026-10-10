import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { BOT_ID, GROUP_LABELS } from '../../shared/rules';
import type { PersonRef, PlayerView, QuestionView } from '../../shared/types';
import { useServerNow } from '../lib/hooks';
import { BotFace } from './Icons';
import { LogoMark } from './LogoMark';

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toLocaleUpperCase('de-DE');
}

export function Avatar({ person, size = 'md', dim = false }: { person: PersonRef; size?: 'sm' | 'md' | 'lg'; dim?: boolean }) {
  const bot = person.id === BOT_ID;
  return (
    <span class={`avatar avatar-${size}${bot ? ' is-bot' : ''}${dim ? ' is-dim' : ''}`} style={{ '--c': person.color }} aria-hidden="true">
      {bot ? <BotFace /> : initials(person.name)}
    </span>
  );
}

export function PersonChip({ person, delay = 0, note }: { person: PersonRef; delay?: number; note?: string }) {
  return (
    <span class="chip pop" style={{ '--c': person.color, animationDelay: `${delay}ms` }}>
      <Avatar person={person} size="sm" />
      <span class="chip-name">{person.name}</span>
      {note && <span class="chip-note">{note}</span>}
    </span>
  );
}

export function Button(props: {
  children: ComponentChildren;
  onClick?: () => void | Promise<unknown>;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  disabled?: boolean;
  type?: 'button' | 'submit';
  block?: boolean;
  small?: boolean;
  /** Erhaben wie „Raum eröffnen“: dunkler Rand und eine Kante darunter */
  raised?: boolean;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const click = async () => {
    if (!props.onClick || busy) return;
    const result = props.onClick();
    if (result instanceof Promise) {
      setBusy(true);
      try {
        await result;
      } catch {
        /* Fehler zeigt der Aufrufer an */
      } finally {
        setBusy(false);
      }
    }
  };
  return (
    <button
      type={props.type ?? 'button'}
      class={`btn btn-${props.variant ?? 'primary'}${props.block ? ' btn-block' : ''}${props.small ? ' btn-small' : ''}${props.raised ? ' btn-raised' : ''}${busy ? ' is-busy' : ''}`}
      disabled={props.disabled || busy}
      onClick={props.type === 'submit' ? undefined : click}
      aria-label={props.label}
    >
      {props.children}
    </button>
  );
}

/** Zweistufiger Knopf für folgenreiche Aktionen – statt eines nativen Bestätigungsdialogs. */
export function ConfirmButton(props: {
  children: ComponentChildren;
  confirm: string;
  onConfirm: () => Promise<unknown> | void;
  variant?: 'danger' | 'secondary' | 'ghost';
  small?: boolean;
  block?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = window.setTimeout(() => setArmed(false), 3500);
    return () => window.clearTimeout(id);
  }, [armed]);
  return (
    <Button
      variant={armed ? 'danger' : props.variant ?? 'secondary'}
      small={props.small}
      block={props.block}
      onClick={() => {
        if (!armed) return setArmed(true);
        setArmed(false);
        return props.onConfirm();
      }}
    >
      {armed ? props.confirm : props.children}
    </Button>
  );
}

export function Segmented<T extends string | number>(props: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div class="segmented" role="radiogroup" aria-label={props.label}>
      {props.options.map((o) => (
        <button
          type="button"
          role="radio"
          aria-checked={o.value === props.value}
          class={o.value === props.value ? 'is-on' : ''}
          disabled={props.disabled}
          onClick={() => props.onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle(props: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <label class="toggle">
      <input
        type="checkbox"
        checked={props.checked}
        disabled={props.disabled}
        onChange={(e) => props.onChange((e.currentTarget as HTMLInputElement).checked)}
      />
      <span class="toggle-track" aria-hidden="true">
        <span class="toggle-thumb" />
      </span>
      <span class="toggle-text">
        <strong>{props.label}</strong>
        {props.hint && <small>{props.hint}</small>}
      </span>
    </label>
  );
}

export function formatSeconds(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Ablaufender Zeitbalken – hält bei Pause an. */
export function Timer(props: { start: number; deadline: number | null; pausedAt?: number | null; big?: boolean }) {
  const now = useServerNow(200);
  if (props.deadline === null) return null;
  const ref = props.pausedAt ?? now;
  const left = Math.max(0, props.deadline - ref);
  const total = Math.max(1, props.deadline - props.start);
  const ratio = Math.min(1, left / total);
  const urgent = left <= 10_000;
  return (
    <div class={`timer${urgent ? ' is-urgent' : ''}${props.big ? ' timer-big' : ''}`} role="timer" aria-label={`Noch ${Math.ceil(left / 1000)} Sekunden`}>
      <div class="timer-bar">
        <div class="timer-fill" style={{ transform: `scaleX(${ratio})` }} />
      </div>
      <span class="timer-num">{formatSeconds(left)}</span>
    </div>
  );
}

const DIFF_LABEL = { 1: 'leicht', 2: 'mittel', 3: 'schwer' } as const;

export function QuestionCard({ question, big = false }: { question: QuestionView; big?: boolean }) {
  return (
    <article class={`question-card${big ? ' is-big' : ''}`} style={{ '--g': `var(--g-${question.group})` }}>
      <header class="question-meta">
        <span class="book-chip">{question.book}</span>
        <span class="group-label">{GROUP_LABELS[question.group]}</span>
        <span class="difficulty" title={`Schwierigkeit: ${DIFF_LABEL[question.difficulty]}`}>
          {[1, 2, 3].map((d) => (
            <i class={d <= question.difficulty ? 'on' : ''} />
          ))}
          <span class="sr-only">Schwierigkeit {DIFF_LABEL[question.difficulty]}</span>
        </span>
      </header>
      <h2 class="question-text">{question.prompt}</h2>
    </article>
  );
}

export function Progress({ players, label }: { players: PlayerView[]; label: string }) {
  const relevant = players.filter((p) => p.plays);
  // Wer eine ruhige Minute macht, zählt nicht mit – auf diese Person wird nicht gewartet
  const counted = relevant.filter((p) => !p.quiet);
  const done = counted.filter((p) => p.done).length;
  return (
    <section class="progress" aria-live="polite">
      <div class="progress-head">
        <span>{label}</span>
        <strong>
          {done} / {counted.length}
        </strong>
      </div>
      <div class="progress-people">
        {relevant.map((p) => (
          <span
            class={`progress-person${p.done ? ' is-done' : ''}${p.online ? '' : ' is-offline'}${p.quiet ? ' is-quiet' : ''}`}
            title={p.quiet ? `${p.name} – ruhige Minute` : p.name}
          >
            <Avatar person={p} size="sm" dim={!p.done} />
            {p.done && <span class="tick" aria-hidden="true">✓</span>}
            {p.quiet && <span class="tick is-quiet" aria-hidden="true">☾</span>}
            <span class="progress-name">{p.name}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  const ref = useRef(onDone);
  ref.current = onDone;
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => ref.current(), 2600);
    return () => window.clearTimeout(id);
  }, [message]);
  if (!message) return null;
  return (
    <div class="toast" role="status">
      {message}
    </div>
  );
}

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div class={`logo${small ? ' logo-small' : ''}`}>
      <LogoMark />
      <span class="logo-words">
        <span class="logo-top">Bible</span>
        <span class="logo-bottom">Bluff</span>
      </span>
    </div>
  );
}

export function Rules({ compact = false }: { compact?: boolean }) {
  return (
    <section class={`rules${compact ? ' is-compact' : ''}`}>
      <h3>So geht’s</h3>
      <ol>
        <li>
          <strong>Bluff schreiben.</strong> Alle sehen dieselbe Bibelfrage und erfinden heimlich eine glaubwürdige,
          aber falsche Antwort.
        </li>
        <li>
          <strong>Abstimmen.</strong> Die echte Antwort steht anonym zwischen euren Bluffs. Tippe auf die, die du für
          wahr hältst.
        </li>
        <li>
          <strong>Aufdecken.</strong> Wer hat was gewählt? Wer hat was erfunden? Und was stimmt wirklich?
        </li>
        <li>
          <strong>Entdecken.</strong> Die Bibelstelle und ein überraschender Satz lösen auf.
        </li>
      </ol>
      <div class="points">
        <span>
          <b>+2</b> richtige Antwort erkannt
        </span>
        <span>
          <b>+1</b> je Person, die auf deinen Bluff hereinfällt
        </span>
      </div>
    </section>
  );
}
