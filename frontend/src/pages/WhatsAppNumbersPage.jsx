import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  MessageCircle, Plus, Loader2, Trash2, Send, Save, X, Phone, Copy, Check,
} from 'lucide-react';
import { SERVER_URL } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

export default function WhatsAppNumbersPage() {
  const { isAdmin } = useAuth();
  const [instances, setInstances] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [i, a] = await Promise.all([
        axios.get(`${SERVER_URL}/api/whatsapp/instances`),
        axios.get(`${SERVER_URL}/api/agents`),
      ]);
      setInstances(i.data.instances || []);
      setAgents(a.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  const remove = async (id) => {
    if (!confirm('Remove this WhatsApp number? In-flight automations on this number will stop.')) return;
    try { await axios.delete(`${SERVER_URL}/api/whatsapp/instances/${id}`); refresh(); } catch (e) { console.error(e); }
  };

  if (!isAdmin) return <div className="p-6 text-muted-foreground">Admins only.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Phone className="w-6 h-6" /> WhatsApp Numbers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Connect Ultramsg or Meta Cloud API numbers. Each number can be assigned to one automation.</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-2" /> Connect number
        </Button>
      </div>

      {loading && <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}

      {!loading && instances.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Phone className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <div className="font-medium mb-1">No numbers yet</div>
            <div className="text-sm">Click "Connect number" to add your first WhatsApp Business number.</div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {instances.map(i => (
          <Card key={i.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="w-4 h-4" /> {i.phoneNumber}
                </CardTitle>
                <span className="text-xs px-2 py-0.5 rounded bg-muted">{i.provider === 'ultramsg' ? 'Ultramsg' : 'Meta Cloud API'}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Status</span>
                <span className={i.enabled ? 'text-emerald-500' : 'text-zinc-500'}>{i.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              {i.instanceId && <Row label="Instance ID" value={i.instanceId} />}
              {i.phoneNumberId && <Row label="Phone number ID" value={i.phoneNumberId} />}
              {i.businessId && <Row label="WABA ID" value={i.businessId} />}
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Webhook URL</span>
                <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                  {SERVER_URL.replace(/\/$/, '')}/api/whatsapp/webhook
                </code>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => remove(i.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showNew && (
        <NewInstanceDialog
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); refresh(); }}
        />
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <code className="bg-muted px-1.5 py-0.5 rounded truncate max-w-[60%]">{value}</code>
    </div>
  );
}

function NewInstanceDialog({ onClose, onCreated }) {
  const [provider, setProvider] = useState('ultramsg');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verifyToken, setVerifyToken] = useState(() => Math.random().toString(36).slice(2, 14));
  const [apiToken, setApiToken] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const create = async () => {
    setSubmitting(true); setError(null);
    try {
      await axios.post(`${SERVER_URL}/api/whatsapp/instances`, {
        provider, phoneNumber, verifyToken, apiToken,
        instanceId: provider === 'ultramsg' ? instanceId : undefined,
        phoneNumberId: provider === 'cloud_api' ? phoneNumberId : undefined,
        businessId: provider === 'cloud_api' ? businessId : undefined,
        appSecret: provider === 'cloud_api' ? appSecret : undefined,
      });
      onCreated();
    } catch (e) { setError(e.response?.data?.error || e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background border rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">Connect a WhatsApp number</div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3 overflow-auto">
          <Field label="Provider">
            <div className="grid grid-cols-2 gap-2">
              {['ultramsg', 'cloud_api'].map(p => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`p-3 rounded-lg border text-left ${provider === p ? 'border-primary bg-primary/5' : 'hover:border-primary/40'}`}
                >
                  <div className="font-medium text-sm">{p === 'ultramsg' ? 'Ultramsg' : 'Meta Cloud API'}</div>
                  <div className="text-xs text-muted-foreground">
                    {p === 'ultramsg' ? 'Fast setup, unofficial, per-instance billing.' : 'Official, requires Meta Business verification.'}
                  </div>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Phone number (E.164)">
            <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+14155552671" />
          </Field>

          <Field label="Webhook verify token (used for handshake)">
            <Input value={verifyToken} onChange={e => setVerifyToken(e.target.value)} />
            <div className="text-xs text-muted-foreground">Random string. We'll use the same value in your provider's webhook config.</div>
          </Field>

          {provider === 'ultramsg' ? (
            <>
              <Field label="Instance ID">
                <Input value={instanceId} onChange={e => setInstanceId(e.target.value)} placeholder="instance12345" />
              </Field>
              <Field label="API token">
                <Input value={apiToken} onChange={e => setApiToken(e.target.value)} type="password" />
              </Field>
              <div className="text-xs text-muted-foreground">
                In Ultramsg, set the webhook URL to <code>{SERVER_URL.replace(/\/$/, '')}/api/whatsapp/webhook</code> and add <code>webhook_received</code> as the event.
              </div>
            </>
          ) : (
            <>
              <Field label="Meta Phone number ID">
                <Input value={phoneNumberId} onChange={e => setPhoneNumberId(e.target.value)} />
              </Field>
              <Field label="WABA (business) ID">
                <Input value={businessId} onChange={e => setBusinessId(e.target.value)} />
              </Field>
              <Field label="System user access token">
                <Input value={apiToken} onChange={e => setApiToken(e.target.value)} type="password" />
              </Field>
              <Field label="App secret (optional, enables signature verification)">
                <Input value={appSecret} onChange={e => setAppSecret(e.target.value)} type="password" />
              </Field>
            </>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={create} disabled={submitting || !phoneNumber || !apiToken || !verifyToken}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Connect
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
