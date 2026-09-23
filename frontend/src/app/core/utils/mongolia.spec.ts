import { formatPhone, formatTugrik, transliterate } from './mongolia';
import { normalizeName, slugify } from './status-class';

describe('Mongolian text helpers', () => {
  it('romanises Cyrillic so slugs stay linkable', () => {
    expect(transliterate('Гоо Урлан')).toBe('goo urlan');
    expect(slugify('Гоо Урлан Салон')).toBe('goo-urlan-salon');
    expect(slugify('Тэхномон Солюшнс')).toBe('tekhnomon-solyushns');
  });

  it('keeps Cyrillic in comparison keys instead of folding it away', () => {
    // The old ASCII-only version turned every Mongolian name into ''.
    expect(normalizeName('Гоо сайхан')).toBe('гоосайхан');
    expect(normalizeName('Гоо Сайхан!')).toBe(normalizeName('гоо сайхан'));
    expect(normalizeName('Гоо сайхан')).not.toBe(normalizeName('Аялал жуулчлал'));
  });

  it('formats the eight-digit phone numbers used here', () => {
    expect(formatPhone('+97688220044')).toBe('+976 8822 0044');
    expect(formatPhone('88220044')).toBe('+976 8822 0044');
    expect(formatPhone('123')).toBe('123');
    expect(formatPhone(null)).toBe('');
  });

  it('prices in tugrik, not dollars', () => {
    expect(formatTugrik(45000)).toBe('45,000₮');
  });
});
