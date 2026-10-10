import { describe, expect, it } from 'vitest';
import { parseRoute } from '../src/client/lib/router';

describe('Adressen', () => {
  it('kennt Raum, Leinwand, Entdeckungen und die rechtlichen Seiten', () => {
    expect(parseRoute('/')).toEqual({ name: 'home' });
    expect(parseRoute('/neu')).toEqual({ name: 'create' });
    expect(parseRoute('/joseph')).toEqual({ name: 'create', bot: true });
    expect(parseRoute('/r/lampe7')).toEqual({ name: 'room', code: 'LAMPE7' });
    expect(parseRoute('/tv/LAMPE7')).toEqual({ name: 'tv', code: 'LAMPE7' });
    expect(parseRoute('/e/ABCDEFGHJK')).toEqual({ name: 'recap', id: 'abcdefghjk' });
    expect(parseRoute('/impressum')).toEqual({ name: 'impressum' });
    expect(parseRoute('/datenschutz/')).toEqual({ name: 'datenschutz' });
    expect(parseRoute('/gibt-es-nicht')).toEqual({ name: 'home' });
  });
});
