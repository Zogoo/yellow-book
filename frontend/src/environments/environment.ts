// Development: Angular dev server on :4200 talks cross-origin to the Rails API.
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001/api/v1',
  // Only show the Google button when the backend has credentials for it.
  googleAuthEnabled: false,
  defaultLocale: 'mn',
  availableLocales: ['mn', 'en'],
};
