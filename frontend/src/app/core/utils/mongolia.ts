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

export const REVENUE_OPTIONS = [
  { value: '0-100m', label: '0 – 100 сая ₮' },
  { value: '100m-500m', label: '100 – 500 сая ₮' },
  { value: '500m-1b', label: '500 сая – 1 тэрбум ₮' },
  { value: '1b+', label: '1 тэрбум ₮+' },
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
