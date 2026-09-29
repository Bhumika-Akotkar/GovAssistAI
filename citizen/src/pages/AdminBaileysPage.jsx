import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function AdminBaileysPage() {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInstanceId, setNewInstanceId] = useState('');
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [qrCodes, setQrCodes] = useState({}); // instanceId -> qr string
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected
  const navigate = useNavigate();

  // Normalize status - handles both string and object forms from the server
  const normalizeStatus = (rawStatus) => {
    if (!rawStatus) return 'unknown';
    if (typeof rawStatus === 'string') return rawStatus;
    if (typeof rawStatus === 'object') {
      return rawStatus.connection || rawStatus.status || JSON.stringify(rawStatus);
    }
    return String(rawStatus);
  };

  const isConnected = (rawStatus) => {
    const s = normalizeStatus(rawStatus);
    return s === 'connected' || s === 'open';
  };

  const isScanQr = (rawStatus) => normalizeStatus(rawStatus) === 'scan_qr';

  const getDisplayStatus = (rawStatus) => {
    const s = normalizeStatus(rawStatus);
    if (s === 'connected' || s === 'open') return 'Connected';
    if (s === 'scan_qr') return 'Scan QR';
    if (s === 'disconnected' || s === 'close') return 'Disconnected';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  // localStorage functions
  const STORAGE_KEY = 'baileys_instances';
  
  const saveInstancesToStorage = (instancesData) => {
    try {
      const data = {
        instances: instancesData,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('[AdminBaileysPage] Saved instances to localStorage:', instancesData.length);
    } catch (err) {
      console.error('[AdminBaileysPage] Error saving to localStorage:', err);
    }
  };

  const loadInstancesFromStorage = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        console.log('[AdminBaileysPage] Loaded instances from localStorage:', parsed.instances.length);
        return parsed.instances;
      }
    } catch (err) {
      console.error('[AdminBaileysPage] Error loading from localStorage:', err);
    }
    return null;
  };

  const clearStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[AdminBaileysPage] Cleared localStorage');
    } catch (err) {
      console.error('[AdminBaileysPage] Error clearing localStorage:', err);
    }
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname}:8083/baileys`;
    let ws = null;
    let reconnectTimeout = null;
    let reconnectAttempts = 0;
    let isComponentMounted = true;
    const MAX_RECONNECT_ATTEMPTS = 10;
    const BASE_RECONNECT_DELAY = 3000;

    const connectWebSocket = () => {
      if (!isComponentMounted) return;

      try {
        // Only create new connection if current one is closed/errored
        if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
          console.log('[AdminBaileysPage] Connection already exists, skipping');
          return;
        }

        console.log('[AdminBaileysPage] Creating new WebSocket connection...');
        setConnectionStatus('connecting');
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          if (!isComponentMounted) return;
          console.log('[AdminBaileysPage] WebSocket connected');
          setConnectionStatus('connected');
          setError('');
          reconnectAttempts = 0; // Reset counter on successful connection
        };
        
        ws.onmessage = (event) => {
          if (!isComponentMounted) return;
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'initial':
                console.log('[AdminBaileysPage] Received initial instances:', data.instances);
                setInstances(data.instances);
                saveInstancesToStorage(data.instances);
                break;
              case 'qr':
                console.log('[AdminBaileysPage] Received QR code for instance:', data.instanceId);
                setQrCodes(prev => ({ ...prev, [data.instanceId]: data.qr }));
                setSuccess(`QR code ready for ${data.instanceId}! Scan with WhatsApp.`);
                break;
              case 'connectionUpdate':
                console.log('[AdminBaileysPage] Connection update for instance:', data.instanceId, data.status);
                setInstances(prev => {
                  const updated = prev.map(inst => 
                    inst.instanceId === data.instanceId 
                      ? { ...inst, status: data.status, phoneNumber: data.phoneNumber }
                      : inst
                  );
                  saveInstancesToStorage(updated);
                  return updated;
                });
                if (isConnected(data.status)) {
                  setSuccess(`Instance ${data.instanceId} connected successfully!`);
                  // Clear QR for this instance once connected
                  setQrCodes(prev => { const n = { ...prev }; delete n[data.instanceId]; return n; });
                }
                break;
              case 'instanceRemoved':
                console.log('[AdminBaileysPage] Instance removed:', data.instanceId);
                setInstances(prev => {
                  const updated = prev.filter(inst => inst.instanceId !== data.instanceId);
                  saveInstancesToStorage(updated);
                  return updated;
                });
                break;
            }
          } catch (err) {
            console.error('[AdminBaileysPage] Error parsing WebSocket message:', err);
          }
        };

        ws.onerror = (error) => {
          if (!isComponentMounted) return;
          console.error('[AdminBaileysPage] WebSocket error:', error);
          setConnectionStatus('disconnected');
          setError('Failed to connect to real-time updates. Using localStorage fallback.');
          const storageInstances = loadInstancesFromStorage();
          if (storageInstances) {
            setInstances(storageInstances);
          }
        };

        ws.onclose = (event) => {
          if (!isComponentMounted) return;
          console.log('[AdminBaileysPage] WebSocket closed - Code:', event.code, 'Reason:', event.reason);
          setConnectionStatus('disconnected');
          
          // Don't reconnect if it was a normal closure or if we've exceeded max attempts
          if (event.code === 1000 || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log('[AdminBaileysPage] Not reconnecting - normal closure or max attempts reached');
            return;
          }

          reconnectAttempts++;
          const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1), 30000); // Exponential backoff, max 30s
          
          console.log(`[AdminBaileysPage] Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms...`);
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(connectWebSocket, delay);
        };
      } catch (err) {
        console.error('[AdminBaileysPage] Error creating WebSocket:', err);
        setConnectionStatus('disconnected');
        setError('Failed to establish WebSocket connection. Using localStorage fallback.');
        const storageInstances = loadInstancesFromStorage();
        if (storageInstances) {
          setInstances(storageInstances);
        }
        
        // Retry connection creation errors
        if (isComponentMounted && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1), 30000);
          reconnectTimeout = setTimeout(connectWebSocket, delay);
        }
      }
    };

    // Initial connection attempt with delay to prevent rapid reconnections
    const initialTimeout = setTimeout(() => {
      connectWebSocket();
    }, 1000);

    return () => {
      isComponentMounted = false;
      clearTimeout(initialTimeout);
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close(1000, 'Component unmounting'); // Normal closure
      }
    };
  }, [selectedInstance]);

  const loadInstances = async () => {
    try {
      const response = await fetch('http://localhost:8083/api/baileys/instances');
      if (response.ok) {
        const data = await response.json();
        setInstances(data);
        saveInstancesToStorage(data);
      } else {
        // Fallback to localStorage if server request fails
        const storageInstances = loadInstancesFromStorage();
        if (storageInstances) {
          setInstances(storageInstances);
          setError('Server unavailable - showing cached instances from localStorage');
        } else {
          setError('Failed to load instances from server and no cached data available');
        }
      }
    } catch (err) {
      console.error('[AdminBaileysPage] Error loading instances:', err);
      // Fallback to localStorage on network error
      const storageInstances = loadInstancesFromStorage();
      if (storageInstances) {
        setInstances(storageInstances);
        setError('Network error - showing cached instances from localStorage');
      } else {
        setError('Failed to load instances and no cached data available');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstances();
  }, []);

  const handleCreateInstance = async () => {
    if (!newInstanceId.trim()) {
      setError('Instance ID is required');
      return;
    }

    try {
      const response = await fetch('http://localhost:8083/api/baileys/instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: newInstanceId }),
        credentials: 'include'
      });

      if (response.ok) {
        setSuccess('Instance created successfully');
        setShowCreateModal(false);
        setNewInstanceId('');
        setSelectedInstance(newInstanceId);
        
        // Add to localStorage immediately for persistence
        const newInstance = {
          instanceId: newInstanceId,
          status: 'initializing',
          createdAt: Date.now()
        };
        setInstances(prev => {
          const updated = [...prev, newInstance];
          saveInstancesToStorage(updated);
          return updated;
        });
        
        loadInstances();
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to create instance');
      }
    } catch (err) {
      console.error('[AdminBaileysPage] Error creating instance:', err);
      setError('Failed to create instance - server unavailable');
      
      // Create instance in localStorage even if server is unavailable
      const newInstance = {
        instanceId: newInstanceId,
        status: 'offline',
        createdAt: Date.now(),
        message: 'Instance created offline - will sync when server is available'
      };
      setInstances(prev => {
        const updated = [...prev, newInstance];
        saveInstancesToStorage(updated);
        return updated;
      });
      setSuccess('Instance created locally (will sync when server is available)');
      setShowCreateModal(false);
      setNewInstanceId('');
      setSelectedInstance(newInstanceId);
    }
  };

  const handleRemoveInstance = async (instanceId) => {
    if (!confirm('Are you sure you want to remove this instance?')) return;
    
    try {
      const response = await fetch(`http://localhost:8083/api/baileys/instance/${instanceId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setSuccess('Instance removed successfully');
        setInstances(prev => {
          const updated = prev.filter(inst => inst.instanceId !== instanceId);
          saveInstancesToStorage(updated);
          return updated;
        });
        setQrCodes(prev => { const n = { ...prev }; delete n[instanceId]; return n; });
        loadInstances();
      } else {
        setError('Failed to remove instance');
      }
    } catch (err) {
      console.error('[AdminBaileysPage] Error removing instance:', err);
      setInstances(prev => {
        const updated = prev.filter(inst => inst.instanceId !== instanceId);
        saveInstancesToStorage(updated);
        return updated;
      });
      setQrCodes(prev => { const n = { ...prev }; delete n[instanceId]; return n; });
      setSuccess('Instance removed locally (will sync when server is available)');
    }
  };

  const handleReconnectInstance = async (instanceId) => {
    try {
      setError('');
      setSuccess('');
      const response = await fetch(`http://localhost:8083/api/baileys/instance/${instanceId}/reconnect`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        setSuccess(`Reconnecting ${instanceId}... QR code will appear shortly.`);
        // Update instance status optimistically - mark as active so Reconnect button hides
        setInstances(prev => prev.map(inst =>
          inst.instanceId === instanceId ? { ...inst, status: 'connecting', isActive: true } : inst
        ));
      } else {
        const body = await response.json().catch(() => ({}));
        setError(body.error || 'Failed to reconnect instance');
      }
    } catch (err) {
      console.error('[AdminBaileysPage] Error reconnecting instance:', err);
      setError('Failed to reconnect - server unavailable');
    }
  };

  const handleSendTestMessage = async (instanceId) => {
    const phoneNumber = prompt('Enter phone number (with country code, e.g., 919876543210):');
    if (!phoneNumber) return;

    const message = prompt('Enter test message:');
    if (!message) return;

    try {
      const response = await fetch(`http://localhost:8083/api/baileys/instance/${instanceId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber,
          type: 'text',
          body: message
        }),
        credentials: 'include'
      });

      if (response.ok) {
        setSuccess('Test message sent successfully');
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to send message');
      }
    } catch (err) {
      setError('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-2">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="bg-forest text-white p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">WhatsApp (Baileys) Admin</h1>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400' :
                connectionStatus === 'connecting' ? 'bg-yellow-400' :
                'bg-red-400'
              }`}></div>
              <span className="text-sm opacity-75">
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => navigate('/admin/schemes')}
            >
              Back to Schemes
            </Button>
            <Button 
              variant="white" 
              size="sm"
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Messages */}
        {error && (
          <div className="bg-danger/10 text-danger p-4 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-forest/10 text-forest p-4 rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-ink">WhatsApp Instances</h2>
            <p className="text-ink-2">{instances.length} active instances</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            Create New Instance
          </Button>
        </div>



        {/* Instances List */}
        <div className="space-y-4">
          {instances.length === 0 ? (
            <Card className="p-8 text-center text-ink-2">
              No WhatsApp instances found. Click "Create New Instance" to add one.
            </Card>
          ) : (
            instances.map((instance) => {
              const rawStatus = instance.status;
              const statusStr = normalizeStatus(rawStatus);
              const connected = isConnected(rawStatus);
              const scanQr = isScanQr(rawStatus);
              const providerActive = instance.isActive === true;
              // Show Reconnect only when no active provider is running
              const needsReconnect = !providerActive && !connected && !scanQr;
              // Show 'Initializing' when provider is running but not yet connected/scanning
              const isInitializing = providerActive && !connected && !scanQr && statusStr !== 'connecting';
              const effectiveStatus = isInitializing ? 'initializing' : statusStr;
              const displayStatus = isInitializing ? 'Initializing...' : getDisplayStatus(rawStatus);
              const instanceQr = qrCodes[instance.instanceId];

              return (
              <Card key={instance.instanceId} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-ink">{instance.instanceId}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        connected
                          ? 'bg-forest/10 text-forest'
                          : scanQr
                          ? 'bg-yellow-100 text-yellow-800'
                          : isInitializing || effectiveStatus === 'connecting'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {displayStatus}
                      </span>
                    </div>
                    {instance.phoneNumber && (
                      <p className="text-ink-2 text-sm mb-2">
                        Phone: {instance.phoneNumber}
                      </p>
                    )}
                    <p className="text-ink-2 text-xs">
                      Status: {effectiveStatus}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {connected && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSendTestMessage(instance.instanceId)}
                      >
                        Test Message
                      </Button>
                    )}
                    {needsReconnect && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReconnectInstance(instance.instanceId)}
                      >
                        Reconnect
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveInstance(instance.instanceId)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Per-instance QR Code */}
                {instanceQr && (
                  <div className="mt-4 pt-4 border-t border-line">
                    <p className="text-sm font-medium text-ink mb-3">Scan with WhatsApp to connect:</p>
                    <div className="flex justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(instanceQr)}`}
                        alt={`QR Code for ${instance.instanceId}`}
                        className="border-4 border-white rounded-lg shadow"
                      />
                    </div>
                    <p className="text-center text-ink-2 mt-3 text-xs">
                      WhatsApp → Settings → Linked Devices → Link a Device
                    </p>
                  </div>
                )}
              </Card>
            )})
          )}
        </div>
      </div>

      {/* Create Instance Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-ink mb-4">Create New WhatsApp Instance</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Instance ID</label>
                <input
                  type="text"
                  value={newInstanceId}
                  onChange={(e) => setNewInstanceId(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-lg"
                  placeholder="e.g., demo-instance-1"
                />
                <p className="text-xs text-ink-2 mt-1">A unique identifier for this WhatsApp instance</p>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button 
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateInstance}>
                  Create Instance
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
