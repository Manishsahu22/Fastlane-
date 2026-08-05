// eslint-disable-next-line import/no-named-as-default-member
import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ENV_URLS: Record<string, string> = {
  prod:  'https://api.qliniq.ai/api/v1',
  stage: 'https://api.stage.qliniq.ai/api/v1',
  dev:   'https://api.dev.qliniq.ai/api/v1',
};

const getStored = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
};

const resolveBaseURL = async (): Promise<string> => {
  if (Platform.OS === 'web') return '/api/v1';
  const env = await getStored('api_env');
  return ENV_URLS[env ?? 'stage'] ?? ENV_URLS.stage;
};

// Kiosk device client — sends X-Walkin-Token header
export const kioskApi = axios.create({
  timeout: 15000,
  validateStatus: () => true,
  headers: { 'Content-Type': 'application/json' },
});
kioskApi.interceptors.request.use(async (config) => {
  config.baseURL = await resolveBaseURL();
  const token = await getStored('walkin_device_token');
  if (token) config.headers['X-Walkin-Token'] = token;
  return config;
});
kioskApi.interceptors.response.use((r) => r.data, (e) => Promise.reject(e));

// Staff device client — sends X-Walkin-Staff-Token header
export const staffApi = axios.create({
  timeout: 15000,
  validateStatus: () => true,
  headers: { 'Content-Type': 'application/json' },
});
staffApi.interceptors.request.use(async (config) => {
  config.baseURL = await resolveBaseURL();
  const token = await getStored('walkin_staff_token');
  if (token) config.headers['X-Walkin-Staff-Token'] = token;
  return config;
});
staffApi.interceptors.response.use((r) => r.data, (e) => Promise.reject(e));
