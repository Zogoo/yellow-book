/**
 * One password policy, stated and enforced identically everywhere.
 * It mirrors `Api::Params.parse_password` on the server. Messages are i18n keys.
 */
export const PASSWORD_RULE_TEXT = 'auth.passwordRule';

export function passwordProblem(password: string): string | null {
  if (!password) return 'auth.passwordEnter';
  if (password.length < 12) return 'auth.passwordLength';
  if (!/[a-z]/.test(password)) return 'auth.passwordLower';
  if (!/[A-Z]/.test(password)) return 'auth.passwordUpper';
  if (!/\d/.test(password)) return 'auth.passwordNumber';
  if (!/[^A-Za-z0-9]/.test(password)) return 'auth.passwordSymbol';
  return null;
}
