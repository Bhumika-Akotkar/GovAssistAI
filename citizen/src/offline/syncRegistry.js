import { Outbox } from './Outbox';
import { getDeviceId, getDeviceSecret } from '../lib/device';

let flushTimer = null;
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let visibilityHandlerAttached = false;
let onlineHandlerAttached = false;

const FLUSH_INTERVAL_MS = 60 * 1000;
const DEBOUNCE_MS = 2000;
let lastFlushAttempt = 0;

function debouncedFlush(deviceId, deviceSecret) {
  const now = Date.now();
  if (now - lastFlushAttempt < DEBOUNCE_MS) {
    return;
  }
  lastFlushAttempt = now;
  Outbox.flush(deviceId, deviceSecret);
}

function setupVisibilityHandler(deviceId, deviceSecret) {
  if (visibilityHandlerAttached) return;
  visibilityHandlerAttached = true;
  
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isOnline) {
      debouncedFlush(deviceId, deviceSecret);
    }
  });
}

function setupOnlineHandler(deviceId, deviceSecret) {
  if (onlineHandlerAttached) return;
  onlineHandlerAttached = true;
  
  window.addEventListener('online', () => {
    isOnline = true;
    debouncedFlush(deviceId, deviceSecret);
  });
  
  window.addEventListener('offline', () => {
    isOnline = false;
  });
}

function startPeriodicFlush(deviceId, deviceSecret) {
  if (flushTimer) {
    clearInterval(flushTimer);
  }
  flushTimer = setInterval(() => {
    if (isOnline) {
      Outbox.flush(deviceId, deviceSecret);
    }
  }, FLUSH_INTERVAL_MS);
}

function stopPeriodicFlush() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

export function initSyncRegistry(deviceId, deviceSecret) {
  setupVisibilityHandler(deviceId, deviceSecret);
  setupOnlineHandler(deviceId, deviceSecret);
  startPeriodicFlush(deviceId, deviceSecret);
  
  if (isOnline) {
    setTimeout(() => debouncedFlush(deviceId, deviceSecret), 1000);
  }
}

export function stopSyncRegistry() {
  stopPeriodicFlush();
}

export function triggerSync(deviceId, deviceSecret) {
  debouncedFlush(deviceId, deviceSecret);
}

export function setOnlineStatus(online) {
  isOnline = online;
}

export function getOnlineStatus() {
  return isOnline;
}