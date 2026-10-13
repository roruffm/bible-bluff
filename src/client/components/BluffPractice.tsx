import { useState } from 'preact/hooks';
import { BLUFF_MAX } from '../../shared/rules';
import { currentLang, t } from '../lib/i18n';
import { practiceFeedback } from '../lib/practice';
import { Button } from './ui';

export function BluffPractice({ onReveal }: { onReveal: () => void }) {
  const [text, setText] = useState('');
  const [checked, setChecked] = useState(false);
  const feedback = checked ? practiceFeedback(text, currentLang()) : null;
  const ready = feedback === 'ready';
  const examples = [t('Im Henkel eines Wasserkrugs.'), t('In der Sandale eines Steuereintreibers.')];
  return (
    <details class="preview-practice">
      <summary class="preview-answer"><span class="preview-letter">D</span><span>{t('Dein Bluff – erfinde die vierte Antwort')}</span></summary>
      <form class="practice-form stack" onSubmit={(e) => { e.preventDefault(); setChecked(true); }}>
        <p class="small">{t('Erfinde einen anderen Fundort. Glaubwürdig, aber falsch – damit legst du später die anderen rein.')}</p>
        <label class="field"><span>{t('Deine vierte Antwort')}</span><textarea value={text} maxLength={BLUFF_MAX} rows={2} placeholder={t('In …')} onInput={(e) => { setText(e.currentTarget.value); setChecked(false); }} /></label>
        <p class="small muted">{t('Bluff-Tipp: Nimm einen alltäglichen Ort aus der Geschichte und ergänze ein ungewöhnliches Detail. Kurz klingt oft überzeugender.')}</p>
        <details class="practice-help"><summary>{t('Hilf mir beim Anfang')}</summary>
          <p class="small">{t('Nimm einen Vorschlag und ändere ihn nach deinem Geschmack:')}</p>
          {examples.map((example) => <button type="button" class="practice-example" onClick={() => { setText(example); setChecked(false); }}>{example}</button>)}
        </details>
        <Button type="submit" variant="secondary" block>{t('Bluff prüfen')}</Button>
        {feedback && <div class={`practice-feedback${ready ? ' is-ready' : ''}`} role="status">
          {feedback === 'empty' && <p>{t('Schreib zuerst einen Fundort. Zum Beispiel: In …')}</p>}
          {feedback === 'long' && <p>{t('Kürze deinen Bluff auf höchstens {n} Zeichen.', { n: BLUFF_MAX })}</p>}
          {feedback === 'truth' && <p>{t('Das liegt zu nah an der echten Antwort. Wähle einen Fundort ohne Fisch – ein Bluff muss falsch sein.')}</p>}
          {feedback === 'duplicate' && <p>{t('Diese Antwort steht schon oben. Erfinde einen anderen Fundort, damit dein Bluff unverwechselbar ist.')}</p>}
          {ready && <><b>{t('Dein Bluff ist bereit!')}</b><p>{t('„{text}“', { text: text.trim() })}</p><p class="small">{t('Er unterscheidet sich von den anderen Antworten. Ob er überzeugt, entscheiden später deine Mitspielenden.')}</p><Button type="button" variant="gold" block onClick={onReveal}>{t('Auflösung zeigen')}</Button></>}
        </div>}
      </form>
    </details>
  );
}
