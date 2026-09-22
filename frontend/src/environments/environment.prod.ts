// Production: Rails serves the built app from public/, so the API is same-origin.
export const environment = {
  production: true,
  apiUrl: '/api/v1',
  // Only show the Google button when the backend has credentials for it.
  googleAuthEnabled: false,
  defaultLocale: 'en',
  availableLocales: ['en'],
};
