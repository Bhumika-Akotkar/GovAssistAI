const STORAGE_KEYS = {
  DEVICE_ID: 'sahayak_device_id',
  DEVICE_SECRET: 'sahayak_device_secret',
};

function generateDeviceId() {
  return crypto.randomUUID();
}

function generateDeviceSecret() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function getDeviceId() {
  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

export function getDeviceSecret() {
  let deviceSecret = localStorage.getItem(STORAGE_KEYS.DEVICE_SECRET);
  if (!deviceSecret) {
    deviceSecret = generateDeviceSecret();
    localStorage.setItem(STORAGE_KEYS.DEVICE_SECRET, deviceSecret);
  }
  return deviceSecret;
}

export function clearDeviceIdentity() {
  localStorage.removeItem(STORAGE_KEYS.DEVICE_ID);
  localStorage.removeItem(STORAGE_KEYS.DEVICE_SECRET);
}

export function hasDeviceIdentity() {
  return !!localStorage.getItem(STORAGE_KEYS.DEVICE_ID) && !!localStorage.getItem(STORAGE_KEYS.DEVICE_SECRET);
}