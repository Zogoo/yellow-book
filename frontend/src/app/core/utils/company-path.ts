/**
 * Readable, shareable company URL: `/companies/:id/:slug`. The id does the lookup; the
 * slug is for people and search engines. Old `/agency?slug=&id=` links still resolve.
 */
export function companyPath(company: { id: number | string; slug?: string | null }): string[] {
  const slug = (company.slug ?? '').trim();
  return slug ? ['/companies', String(company.id), slug] : ['/companies', String(company.id)];
}
