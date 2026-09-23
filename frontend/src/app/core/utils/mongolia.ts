/**
 * Places and formats that this market actually uses.
 * Districts first: that is how people say where a business is.
 */
export const UB_DISTRICTS = [
  'Багануур',
  'Багахангай',
  'Баянгол',
  'Баянзүрх',
  'Налайх',
  'Сонгинохайрхан',
  'Сүхбаатар',
  'Хан-Уул',
  'Чингэлтэй',
];

export const AIMAG_CENTRES = [
  'Дархан',
  'Эрдэнэт',
  'Чойбалсан',
  'Мөрөн',
  'Ховд',
  'Өлгий',
  'Улаангом',
  'Сайншанд',
  'Арвайхээр',
  'Баянхонгор',
  'Зуунмод',
];

export const LOCATION_OPTIONS = ['Улаанбаатар', ...AIMAG_CENTRES];

export const EMPLOYEE_OPTIONS = ['1-10', '11-30', '31-50', '51-100', '100+'];

/**
 * Stored as written: the band is shown straight back on the public page, so a
 * code like `100m-500m` would only have to be translated again on the way out.
 */
export const REVENUE_OPTIONS = [
  '0 – 100 сая ₮',
  '100 – 500 сая ₮',
  '500 сая – 1 тэрбум ₮',
  '1 тэрбум ₮+',
];

/** Mongolian mobile and landline numbers are eight digits, no area code. */
export function phoneProblem(value: string): string | null {
  const digits = value.replace(/\D/g, '').replace(/^976/, '');
  if (digits.length === 0) return null;
  return digits.length === 8 ? null : 'phone';
}

export function formatPhone(value: string | null | undefined): string {
  const digits = String(value ?? '')
    .replace(/\D/g, '')
    .replace(/^976/, '');
  if (digits.length !== 8) return String(value ?? '');
  return `+976 ${digits.slice(0, 4)} ${digits.slice(4)}`;
}

/**
 * Prices are shown in tugrik. Grouping uses commas, the form used on price
 * lists and invoices here, so the number reads the same in both languages.
 */
export function formatTugrik(value: number): string {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}₮`;
}

/**
 * Mongolian Cyrillic to Latin, mirroring `Api::Text::TRANSLITERATION` on the
 * server so a slug built here matches the one the API would build.
 */
const TRANSLITERATION: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'ye',
  ё: 'yo',
  ж: 'j',
  з: 'z',
  и: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  ө: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ү: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: 'i',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

/** Lower-cased, NFKC-normalised, and romanised — safe to feed to a slug. */
export function transliterate(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .split('')
    .map((char) => TRANSLITERATION[char] ?? char)
    .join('');
}
