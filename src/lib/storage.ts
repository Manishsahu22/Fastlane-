import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type DeviceRole = 'kiosk' | 'staff';
export type ApiEnv = 'prod' | 'stage' | 'dev';

// Storage keys match the web app exactly
export const KIOSK_TOKEN_KEY = 'walkin_device_token';
export const STAFF_TOKEN_KEY = 'walkin_staff_token';
const ROLE_KEY = 'device_role';
const LOCATION_KEY = 'location_name';
const ENV_KEY = 'api_env';

export const setStored = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
  await SecureStore.setItemAsync(key, value);
};

export const getStored = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
};

export const removeStored = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
  await SecureStore.deleteItemAsync(key);
};

export const saveDeviceRole = (role: DeviceRole) => setStored(ROLE_KEY, role);
export const saveLocationName = (name: string) => setStored(LOCATION_KEY, name);
export const saveApiEnv = (env: ApiEnv) => setStored(ENV_KEY, env);
export const getApiEnv = async (): Promise<ApiEnv> =>
  ((await getStored(ENV_KEY)) as ApiEnv) ?? 'stage';

export const getDeviceRole = async (): Promise<DeviceRole | null> =>
  (await getStored(ROLE_KEY)) as DeviceRole | null;

export const getLocationName = async (): Promise<string | null> =>
  getStored(LOCATION_KEY);

export const isPaired = async (): Promise<DeviceRole | null> => {
  const role = await getStored(ROLE_KEY);
  if (role === 'kiosk') {
    const t = await getStored(KIOSK_TOKEN_KEY);
    return t ? 'kiosk' : null;
  }
  if (role === 'staff') {
    const t = await getStored(STAFF_TOKEN_KEY);
    return t ? 'staff' : null;
  }
  return null;
};

export const clearDeviceInfo = async () => {
  await Promise.all([
    removeStored(KIOSK_TOKEN_KEY),
    removeStored(STAFF_TOKEN_KEY),
    removeStored(ROLE_KEY),
    removeStored(LOCATION_KEY),
    removeStored(ENV_KEY),
  ]);
};
