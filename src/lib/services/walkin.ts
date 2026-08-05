import { kioskApi, staffApi } from '../api';
import {
  setStored, removeStored,
  KIOSK_TOKEN_KEY, STAFF_TOKEN_KEY,
  saveDeviceRole, saveLocationName,
  DeviceRole,
} from '../storage';

export const verifyDeviceToken = async (token: string): Promise<DeviceRole> => {
  // ── Try kiosk role first ───────────────────────────────────────────
  await setStored(KIOSK_TOKEN_KEY, token);
  const kProbe: any = await kioskApi.post('/walkin/check-in', { __probe: true });
  const kStatus = kProbe?.statusCode ?? kProbe?.status;
  const kCode = kProbe?.code;

  if (kCode === 'VALIDATION_ERROR' || kStatus === 400) {
    // Token valid + kiosk role confirmed
    await saveDeviceRole('kiosk');
    return 'kiosk';
  }

  if (kStatus === 401 || kCode === 'UNAUTHORIZED') {
    await removeStored(KIOSK_TOKEN_KEY);
    throw new Error(kProbe?.message || 'Invalid or revoked token');
  }

  if (kStatus === 429) {
    await removeStored(KIOSK_TOKEN_KEY);
    throw new Error('Too many attempts. Please wait a moment and try again.');
  }

  // 403 = kiosk rejected (likely staff token) — try staff role
  await removeStored(KIOSK_TOKEN_KEY);
  await setStored(STAFF_TOKEN_KEY, token);
  const sProbe: any = await staffApi.get('/walkin/queue?page=1&limit=1');
  const sStatus = sProbe?.statusCode ?? sProbe?.status ?? (sProbe?.success === true ? 200 : null);
  const sCode = sProbe?.code;

  if (sProbe?.success === true || sStatus === 200) {
    await saveDeviceRole('staff');
    return 'staff';
  }

  await removeStored(STAFF_TOKEN_KEY);

  if (sStatus === 403 || sCode === 'FORBIDDEN') {
    throw new Error(sProbe?.message || 'This token is not for kiosk or staff access');
  }

  throw new Error(sProbe?.message || 'Invalid or revoked token');
};

export const submitCheckin = (data: { firstName: string; lastName: string; phone: string }) =>
  kioskApi.post('/walkin/check-in', data).then((r: any) => r);

export const getQueue = (params?: object) =>
  staffApi.get('/walkin/queue', { params }).then((r: any) => r);

export const callWalkin = (id: number) =>
  staffApi.post(`/walkin/${id}/call`).then((r: any) => r);

export const completeWalkin = (id: number) =>
  staffApi.post(`/walkin/${id}/complete`).then((r: any) => r);

export const noShowWalkin = (id: number) =>
  staffApi.post(`/walkin/${id}/no-show`).then((r: any) => r);

export const cancelWalkin = (id: number) =>
  staffApi.post(`/walkin/${id}/cancel`).then((r: any) => r);
