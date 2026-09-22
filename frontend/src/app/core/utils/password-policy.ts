/**
 * One password policy, stated and enforced identically everywhere.
 * It mirrors `Api::Params.parse_password` on the server.
 */
export const PASSWORD_RULE_TEXT =
  'At least 12 characters, with an upper case letter, a lower case letter, a number and a symbol.';

export function passwordProblem(password: string): string | null {
  if (!password) return 'Enter a password.';
  if (password.length < 12) return 'Use at least 12 characters.';
  if (!/[a-z]/.test(password)) return 'Add a lower case letter.';
  if (!/[A-Z]/.test(password)) return 'Add an upper case letter.';
  if (!/\d/.test(password)) return 'Add a number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Add a symbol.';
  return null;
}
