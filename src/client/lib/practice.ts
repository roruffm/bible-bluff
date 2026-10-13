import { isDuplicate, isTooCloseToTruth } from '../../server/text';
import { BLUFF_MAX } from '../../shared/rules';
import type { Lang } from '../../shared/types';

/** Ausschließlich die ohnehin öffentliche Probefrage, kein Zugriff auf den Spielpool. */
export function practiceFeedback(text: string, lang: Lang): 'empty' | 'long' | 'truth' | 'duplicate' | 'ready' {
  const input = text.trim();
  if (!input) return 'empty';
  if (input.length > BLUFF_MAX) return 'long';
  const answer = lang === 'en' ? 'In the mouth of a fish' : 'Im Maul eines Fisches';
  const accept = lang === 'en' ? [['*fish']] : [['*fisch']];
  if (isTooCloseToTruth(input, { answer, accept })) return 'truth';
  const others = lang === 'en' ? ['In a loaf of bread.', 'In a bird’s nest.'] : ['In einem Brotlaib.', 'In einem Vogelnest.'];
  if (others.some((a) => isDuplicate(input, a))) return 'duplicate';
  return 'ready';
}
