const API_BASE = '/api';

export async function syncItems(deviceId, deviceSecret, items) {
  const response = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, deviceSecret, items }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Sync failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export async function fetchCatalog() {
  const response = await fetch(`${API_BASE}/sync/catalog`);
  if (!response.ok) throw new Error(`Failed to fetch catalog: ${response.status}`);
  return response.json();
}

export async function fetchLanguages() {
  const response = await fetch(`${API_BASE}/sync/languages`);
  if (!response.ok) throw new Error(`Failed to fetch languages: ${response.status}`);
  return response.json();
}

function qs(params) {
  return new URLSearchParams(params).toString();
}

export async function listConversations(deviceId, deviceSecret) {
  const url = `${API_BASE}/conversations?${qs({ deviceId, deviceSecret })}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'List failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const body = await res.json();
  return body.conversations || [];
}

export async function getConversation(deviceId, deviceSecret, conversationId) {
  const url = `${API_BASE}/conversations/${encodeURIComponent(conversationId)}?${qs({ deviceId, deviceSecret })}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    const err = await res.json().catch(() => ({ error: 'Get failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const body = await res.json();
  return body.conversation || null;
}

export async function updateConversation(deviceId, deviceSecret, conversationId, patch) {
  const res = await fetch(`${API_BASE}/conversations/${encodeURIComponent(conversationId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, deviceSecret, ...patch }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Update failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const body = await res.json();
  return body.conversation || null;
}

export async function deleteConversation(deviceId, deviceSecret, conversationId) {
  const res = await fetch(`${API_BASE}/conversations/${encodeURIComponent(conversationId)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, deviceSecret }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Delete failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function clearAllConversations(deviceId, deviceSecret) {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, deviceSecret }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Clear all failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}