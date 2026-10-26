import { JavaMifiApiClient } from '@javamifi/api-client';

export const apiClient = new JavaMifiApiClient({
  baseUrl: 'http://localhost:3001',
  getToken: () => localStorage.getItem('javamifi_admin_token'),
  onUnauthorized: () => {
    localStorage.removeItem('javamifi_admin_token');
  },
});
