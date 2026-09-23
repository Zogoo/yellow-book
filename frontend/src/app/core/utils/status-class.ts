import { transliterate } from './mongolia';
/** Badge classes shared by every table (port of `useStatusClass`). */
export function getStatusClass(status: unknown, variant: 'badge' | 'soft' = 'badge'): string {
  const key = String(status ?? '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .trim();
  const badge = variant === 'badge';
  if (['approved', 'active', 'verified'].includes(key)) {
    return badge ? 'bg-green-100 text-green-700' : 'text-green-500 bg-green-50';
  }
  if (key === 'pending')
    return badge ? 'bg-amber-100 text-amber-700' : 'text-amber-500 bg-amber-50';
  if (key === 'inactive') return badge ? 'bg-gray-100 text-gray-700' : 'text-gray-500 bg-gray-50';
  if (['rejected', 'suspended', 'banned'].includes(key)) {
    return badge ? 'bg-red-100 text-red-700' : 'text-red-500 bg-red-50';
  }
  if (key === 'on hold' || key === 'hold')
    return badge ? 'bg-gray-100 text-gray-700' : 'text-gray-600 bg-gray-50';
  return badge ? 'bg-gray-100 text-gray-700' : 'text-gray-500 bg-gray-50';
}

export function getRoleClass(role: unknown): string {
  const key = String(role ?? '')
    .toLowerCase()
    .replace(/_/g, ' ');
  if (key === 'super admin') return 'bg-purple-100 text-purple-700';
  if (key === 'admin') return 'bg-blue-100 text-blue-700';
  if (key === 'moderator') return 'bg-orange-100 text-orange-700';
  if (key === 'support') return 'bg-teal-100 text-teal-700';
  return 'bg-gray-100 text-gray-700';
}

export function getSignupMethodClass(method: unknown): string {
  const key = String(method ?? '').toLowerCase();
  if (key === 'google') return 'bg-red-50 text-red-600';
  if (key === 'facebook') return 'bg-blue-50 text-blue-600';
  if (key === 'twitter') return 'bg-sky-50 text-sky-600';
  if (key === 'email') return 'bg-orange-50 text-orange-600';
  return 'bg-gray-50 text-gray-600';
}

export function getFilterChipClass(type: string): string {
  switch (type) {
    case 'service':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'specialization':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'emergency':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'rating':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'price':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function titleCase(value: unknown): string {
  return String(value ?? '')
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function toApiStatus(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

export function formatDate(value: unknown): string {
  if (!value) return '—';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function slugify(value: unknown): string {
  return transliterate(String(value ?? '').replace(/&/g, ' and '))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * A comparison key that keeps Cyrillic. Stripping to `[a-z0-9]` used to fold
 * every Mongolian name to an empty string, so unrelated names matched.
 */
export function normalizeName(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

export function getDefaultListingImage(category: unknown): string {
  const key = normalizeName(category);
  const map: Record<string, string> = {
    animalsandpets: '/logo/p1.png',
    animalspets: '/logo/p1.png',
    beautywellbeing: '/logo/p2.png',
    beautywellbeings: '/logo/p2.png',
    foodbeverage: '/logo/p3.png',
    tourismhospitality: '/logo/image6.png',
    itsoftware: '/logo/image7.png',
  };
  return map[key] ?? '/logo/logo.png';
}
