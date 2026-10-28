import { JavaMifiApiClient } from '@javamifi/api-client';

const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;

export const API_BASE_URL = metaEnv?.VITE_API_BASE_URL || 'http://localhost:3001';

export const WEB_BASE_URL = metaEnv?.VITE_WEB_BASE_URL || 'http://localhost:3000';

export const apiClient = new JavaMifiApiClient({
  baseUrl: API_BASE_URL,
  getToken: () => localStorage.getItem('javamifi_admin_token'),
  onUnauthorized: () => {
    localStorage.removeItem('javamifi_admin_token');
  },
});
