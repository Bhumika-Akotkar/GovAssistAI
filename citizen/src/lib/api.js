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