/**
 * adminApi.js
 * Shared utility for admin API calls.
 * Reads the admin token from localStorage and injects it as a Bearer token.
 */

const API = 'http://localhost:8083';

export function getAdminToken() {
  return localStorage.getItem('admin_token');
}

export function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem('admin_user') || 'null');
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

/**
 * Authenticated fetch wrapper for admin API calls.
 * Always sends the Bearer token from localStorage.
 */
export async function adminFetch(path, options = {}) {
  const token = getAdminToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // If unauthorized, clear session
  if (res.status === 401 || res.status === 403) {
    // We could clear session here, but let's just let the caller handle it.
  }

  return res;
}
