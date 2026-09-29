import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { adminFetch } from '../lib/adminApi';

// JSON template to show admins the expected structure
const JSON_TEMPLATE = JSON.stringify([
  {
    "name": "PM Kisan Samman Nidhi",
    "description": "Income support of ₹6,000/year to small and marginal farmers.",
    "sector": "Agriculture",
    "state": "All India",
    "minAge": 18,
    "maxAge": null,
    "maxIncome": null,
    "gender": "any",
    "category": "any",
    "benefits": "₹2,000 every 4 months directly to bank account.",
    "applicationProcess": "Apply online at pmkisan.gov.in or at nearest CSC center.",
    "requiredDocuments": "Aadhaar, bank passbook, land records",
    "siteUrl": "https://pmkisan.gov.in",
    "tags": ["farmer", "central", "PM", "agriculture", "income support"],
    "images": [],
    "dynamicDetails": {
      "Annual Benefit": "₹6,000",
      "Payment Frequency": "Every 4 months",
      "Ministry": "Ministry of Agriculture"
    },
    "qualifyingQuestions": [
      { "id": "q1", "question": "Do you own agricultural land?", "type": "boolean" },
      { "id": "q2", "question": "Is the land registered in your name?", "type": "boolean" }
    ],
    "applicationSteps": [
      {
        "step": 1,
        "title": "Visit the Official Portal",
        "description": "Go to pmkisan.gov.in and click on 'Farmer Corner' in the top menu.",
        "imageUrl": "",
        "actionLabel": "Open Portal",
        "actionUrl": "https://pmkisan.gov.in",
        "tip": "Use a desktop browser for best experience.",
        "warning": null
      },
      {
        "step": 2,
        "title": "New Farmer Registration",
        "description": "Click 'New Farmer Registration' and enter your Aadhaar number.",
        "imageUrl": "",
        "actionLabel": null,
        "actionUrl": null,
        "tip": null,
        "warning": "Your Aadhaar must be linked to your mobile number for OTP verification."
      }
    ],
    "isActive": true
  }
], null, 2);

export default function AdminSchemesPage() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'import'
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const navigate = useNavigate();

  const emptyForm = {
    name: '', description: '', state: '', minAge: '', maxAge: '', maxIncome: '',
    gender: '', category: '', sector: '', benefits: '', applicationProcess: '',
    requiredDocuments: '', isActive: true, siteUrl: '',
    tagsRaw: '', // comma-separated
    dynamicDetailsRaw: '', // JSON string
    qualifyingQuestionsRaw: '', // JSON string
    applicationStepsRaw: '', // JSON string
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { loadSchemes(); }, []);

  const loadSchemes = async () => {
    setLoading(true);
    try {
      const response = await adminFetch('/api/schemes');
      if (response.ok) {
        setSchemes(await response.json());
      } else {
        throw new Error('Failed to load schemes');
      }
    } catch (err) {
      setError('Failed to load schemes. Please login again.');
    } finally {
      setLoading(false);
    }
  };

  const schemeToForm = (scheme) => ({
    name: scheme.name || '',
    description: scheme.description || '',
    state: scheme.state || '',
    minAge: scheme.minAge || '',
    maxAge: scheme.maxAge || '',
    maxIncome: scheme.maxIncome || '',
    gender: scheme.gender || '',
    category: scheme.category || '',
    sector: scheme.sector || '',
    benefits: scheme.benefits || '',
    applicationProcess: scheme.applicationProcess || '',
    requiredDocuments: scheme.requiredDocuments || '',
    isActive: scheme.isActive !== undefined ? scheme.isActive : true,
    siteUrl: scheme.siteUrl || '',
    tagsRaw: Array.isArray(scheme.tags) ? scheme.tags.join(', ') : '',
    dynamicDetailsRaw: scheme.dynamicDetails ? JSON.stringify(scheme.dynamicDetails, null, 2) : '',
    qualifyingQuestionsRaw: scheme.qualifyingQuestions ? JSON.stringify(scheme.qualifyingQuestions, null, 2) : '',
    applicationStepsRaw: scheme.applicationSteps ? JSON.stringify(scheme.applicationSteps, null, 2) : '',
  });

  const handleCreate = () => { setEditingScheme(null); setFormData(emptyForm); setShowModal(true); };
  const handleEdit = (scheme) => { setEditingScheme(scheme); setFormData(schemeToForm(scheme)); setShowModal(true); };

  const handleDelete = async (id) => {
    if (!confirm('Delete this scheme?')) return;
    try {
      const res = await adminFetch(`/api/schemes/${id}`, { method: 'DELETE' });
      if (res.ok) { setSuccess('Deleted successfully'); loadSchemes(); setTimeout(() => setSuccess(''), 3000); }
      else throw new Error();
    } catch { setError('Failed to delete'); setTimeout(() => setError(''), 3000); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    // Parse JSON fields
    let tags = null, dynamicDetails = null, qualifyingQuestions = null, applicationSteps = null;
    try {
      if (formData.tagsRaw.trim()) tags = formData.tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
      if (formData.dynamicDetailsRaw.trim()) dynamicDetails = JSON.parse(formData.dynamicDetailsRaw);
      if (formData.qualifyingQuestionsRaw.trim()) qualifyingQuestions = JSON.parse(formData.qualifyingQuestionsRaw);
      if (formData.applicationStepsRaw.trim()) applicationSteps = JSON.parse(formData.applicationStepsRaw);
    } catch (e) {
      setError('JSON parse error in one of the advanced fields. Please check the JSON syntax.');
      return;
    }

    const data = {
      ...formData,
      minAge: formData.minAge ? parseInt(formData.minAge) : null,
      maxAge: formData.maxAge ? parseInt(formData.maxAge) : null,
      maxIncome: formData.maxIncome ? parseFloat(formData.maxIncome) : null,
      tags, dynamicDetails, qualifyingQuestions, applicationSteps,
    };
    delete data.tagsRaw; delete data.dynamicDetailsRaw; delete data.qualifyingQuestionsRaw; delete data.applicationStepsRaw;

    try {
      const url = editingScheme ? `/api/schemes/${editingScheme.id}` : '/api/schemes';
      const method = editingScheme ? 'PUT' : 'POST';
      const res = await adminFetch(url, { method, body: JSON.stringify(data) });
      if (!res.ok) throw new Error();
      setSuccess(editingScheme ? 'Scheme updated!' : 'Scheme created!');
      setShowModal(false);
      loadSchemes();
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed to save scheme'); setTimeout(() => setError(''), 3000); }
  };

  const handleJsonImport = async () => {
    setJsonError(''); setImportResult(null);
    let parsed;
    try {
      parsed = JSON.parse(jsonInput.trim());
      if (!Array.isArray(parsed)) parsed = [parsed]; // allow single object too
    } catch (e) {
      setJsonError('Invalid JSON. Please check your input.');
      return;
    }

    setImportLoading(true);
    try {
      const res = await adminFetch('/api/schemes/import', {
        method: 'POST',
        body: JSON.stringify({ schemes: parsed }),
      });
      const result = await res.json();
      if (res.ok) {
        setImportResult(result);
        loadSchemes();
      } else {
        setJsonError(result.error || 'Import failed');
      }
    } catch { setJsonError('Network error during import'); }
    finally { setImportLoading(false); }
  };

  const setField = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-ink-2">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen notranslate bg-paper">
      {/* Header */}
      <div className="bg-forest text-white p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Government Schemes Admin</h1>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/baileys')}>WhatsApp Setup</Button>
            <Button variant="white" size="sm" onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Alerts */}
        {error && <div className="bg-danger/10 text-danger p-4 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-forest/10 text-forest p-4 rounded-lg mb-4">{success}</div>}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-paper-2 p-1 rounded-xl w-fit">
          {[['list', '📋 Schemes'], ['import', '📥 JSON Import'], ['upload', '🖼️ Image Uploader']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key ? 'bg-white text-forest shadow-sm' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ─── SCHEMES LIST TAB ─── */}
        {activeTab === 'list' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-ink">Manage Schemes</h2>
                <p className="text-ink-2">{schemes.length} schemes</p>
              </div>
              <Button onClick={handleCreate}>+ Add New Scheme</Button>
            </div>
            <div className="space-y-4">
              {schemes.length === 0 ? (
                <Card className="p-8 text-center text-ink-2">No schemes yet. Use JSON Import or Add New Scheme.</Card>
              ) : (
                schemes.map(scheme => (
                  <Card key={scheme.id} className="p-5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-base font-semibold text-ink">{scheme.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${scheme.isActive ? 'bg-forest/10 text-forest' : 'bg-gray-200 text-gray-600'}`}>
                            {scheme.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {scheme.applicationSteps && Array.isArray(scheme.applicationSteps) && scheme.applicationSteps.length > 0 && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs">📋 {scheme.applicationSteps.length} steps</span>
                          )}
                        </div>
                        <p className="text-ink-2 text-sm mb-2 line-clamp-2">{scheme.description}</p>
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {scheme.sector && <span className="bg-paper-2 px-2 py-0.5 rounded">{scheme.sector}</span>}
                          {scheme.state && <span className="bg-paper-2 px-2 py-0.5 rounded">{scheme.state}</span>}
                          {scheme.category && <span className="bg-paper-2 px-2 py-0.5 rounded">{scheme.category}</span>}
                          {Array.isArray(scheme.tags) && scheme.tags.slice(0, 3).map((t, i) => (
                            <span key={i} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">#{t}</span>
                          ))}
                          {scheme.siteUrl && (
                            <a href={scheme.siteUrl} target="_blank" rel="noopener noreferrer" className="bg-green-50 text-green-600 px-2 py-0.5 rounded hover:underline">🔗 Portal</a>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(scheme)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(scheme.id)}>Delete</Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </>
        )}

        {/* ─── JSON IMPORT TAB ─── */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-ink mb-1">JSON Bulk Import</h2>
              <p className="text-ink-2 text-sm">Paste a JSON array of schemes (or a single object). Existing schemes (matched by name) will be updated. New ones will be created.</p>
            </div>

            {/* Template hint */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-forest hover:text-forest-2 list-none flex items-center gap-1">
                <span className="group-open:rotate-90 transition-transform inline-block">▶</span> Show JSON template / schema
              </summary>
              <pre className="mt-3 p-4 bg-gray-900 text-green-300 rounded-xl text-xs overflow-auto max-h-80 font-mono leading-relaxed">
                {JSON_TEMPLATE}
              </pre>
            </details>

            {/* JSON editor */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Paste JSON here</label>
              <textarea
                value={jsonInput}
                onChange={e => { setJsonInput(e.target.value); setJsonError(''); setImportResult(null); }}
                className="w-full h-72 px-4 py-3 border border-line rounded-xl font-mono text-sm bg-gray-50 focus:outline-none focus:border-forest resize-y"
                placeholder='[{ "name": "...", "description": "...", ... }]'
                spellCheck={false}
              />
            </div>

            {jsonError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{jsonError}</div>
            )}

            {importResult && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-4 rounded-xl">
                <p className="font-semibold mb-1">Import complete!</p>
                <ul className="text-sm space-y-0.5">
                  <li>✅ Created: {importResult.created}</li>
                  <li>🔄 Updated: {importResult.updated}</li>
                  <li>❌ Failed: {importResult.failed}</li>
                </ul>
                {importResult.errors?.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-red-600">Show errors ({importResult.errors.length})</summary>
                    <ul className="mt-1 space-y-1">
                      {importResult.errors.map((e, i) => <li key={i} className="text-xs text-red-600">{e}</li>)}
                    </ul>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleJsonImport} disabled={!jsonInput.trim() || importLoading}>
                {importLoading ? 'Importing…' : '📥 Import Schemes'}
              </Button>
              <Button variant="secondary" onClick={() => setJsonInput(JSON_TEMPLATE)}>Load Template</Button>
              <Button variant="secondary" onClick={() => { setJsonInput(''); setJsonError(''); setImportResult(null); }}>Clear</Button>
            </div>
          </div>
        )}

        {/* ─── IMAGE UPLOADER TAB ─── */}
        {activeTab === 'upload' && (
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold text-ink mb-2">Image Uploader</h2>
            <p className="text-ink-2 mb-6">
              Upload screenshots for your step-by-step guides. You will get a URL back that you can paste into your JSON or Scheme editor.
            </p>
            <Card className="p-6">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  
                  const formData = new FormData();
                  formData.append('image', file);
                  
                  setImportLoading(true);
                  try {
                    // adminFetch uses JSON by default, but we need FormData here, so use fetch directly but with the auth header
                    const token = localStorage.getItem('admin_token');
                    const res = await fetch('http://localhost:8083/api/upload', {
                      method: 'POST',
                      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                      body: formData,
                    });
                    
                    const result = await res.json();
                    if (res.ok) {
                      setSuccess(`Image uploaded successfully!`);
                      setImportResult(result.url); // store URL here temporarily
                      navigator.clipboard.writeText(result.url);
                    } else {
                      setError(result.error || 'Upload failed');
                    }
                  } catch (err) {
                    setError('Network error during upload');
                  } finally {
                    setImportLoading(false);
                    e.target.value = ''; // clear input
                    setTimeout(() => setSuccess(''), 3000);
                    setTimeout(() => setError(''), 3000);
                  }
                }}
                className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-forest/10 file:text-forest hover:file:bg-forest/20 mb-4"
                disabled={importLoading}
              />
              
              {importLoading && <div className="text-sm text-ink-2 mb-2">Uploading...</div>}

              {importResult && typeof importResult === 'string' && (
                <div className="bg-paper-2 p-4 rounded-lg mt-4">
                  <p className="text-sm text-ink-2 mb-2">Image URL (Copied to clipboard!):</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={importResult} 
                      className="w-full px-3 py-2 bg-white border border-line rounded-lg text-sm font-mono text-ink"
                    />
                    <Button onClick={() => navigator.clipboard.writeText(importResult)}>Copy</Button>
                  </div>
                  <img src={importResult} alt="Preview" className="mt-4 rounded border border-line max-h-48 object-contain" />
                </div>
              )}
            </Card>
          </div>
        )}

      </div>

      {/* ─── EDIT / CREATE MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="w-full max-w-3xl my-8 p-6">
            <h2 className="text-xl font-bold text-ink mb-5">{editingScheme ? 'Edit Scheme' : 'Create New Scheme'}</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Basic Info */}
              <section>
                <h3 className="text-sm font-semibold text-ink-2 uppercase tracking-wide mb-3">Basic Info</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Scheme Name *</label>
                    <input type="text" value={formData.name} onChange={e => setField('name', e.target.value)}
                      className="w-full px-3 py-2 border border-line rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Description *</label>
                    <textarea value={formData.description} onChange={e => setField('description', e.target.value)}
                      className="w-full px-3 py-2 border border-line rounded-lg min-h-[70px]" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Official Site URL</label>
                    <input type="url" value={formData.siteUrl} onChange={e => setField('siteUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-line rounded-lg" placeholder="https://pmkisan.gov.in" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Tags (comma separated)</label>
                    <input type="text" value={formData.tagsRaw} onChange={e => setField('tagsRaw', e.target.value)}
                      className="w-full px-3 py-2 border border-line rounded-lg" placeholder="farmer, central, PM, agriculture" />
                  </div>
                </div>
              </section>

              {/* Eligibility */}
              <section>
                <h3 className="text-sm font-semibold text-ink-2 uppercase tracking-wide mb-3">Eligibility Filters</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[['sector','text','Sector','Agriculture'],['state','text','State','Maharashtra'],['minAge','number','Min Age','18'],['maxAge','number','Max Age','65'],['maxIncome','number','Max Income (₹)','500000']].map(([key,type,label,ph]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-ink mb-1">{label}</label>
                      <input type={type} value={formData[key]} onChange={e => setField(key, e.target.value)}
                        className="w-full px-3 py-2 border border-line rounded-lg" placeholder={ph} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Gender</label>
                    <select value={formData.gender} onChange={e => setField('gender', e.target.value)} className="w-full px-3 py-2 border border-line rounded-lg">
                      <option value="">Any</option><option value="male">Male</option><option value="female">Female</option><option value="any">Any</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Category</label>
                    <select value={formData.category} onChange={e => setField('category', e.target.value)} className="w-full px-3 py-2 border border-line rounded-lg">
                      <option value="">Any</option><option value="general">General</option><option value="obc">OBC</option><option value="sc/st">SC/ST</option><option value="any">Any</option>
                    </select>
                  </div>
                  <div className="flex items-center col-span-2">
                    <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setField('isActive', e.target.checked)} className="w-4 h-4 mr-2" />
                    <label htmlFor="isActive" className="text-sm text-ink">Active (visible to AI and citizens)</label>
                  </div>
                </div>
              </section>

              {/* Content */}
              <section>
                <h3 className="text-sm font-semibold text-ink-2 uppercase tracking-wide mb-3">Content</h3>
                <div className="space-y-3">
                  {[['benefits','Benefits / What will the citizen get?'],['applicationProcess','Application Process (plain text summary)'],['requiredDocuments','Required Documents']].map(([key,label]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-ink mb-1">{label}</label>
                      <textarea value={formData[key]} onChange={e => setField(key, e.target.value)}
                        className="w-full px-3 py-2 border border-line rounded-lg min-h-[55px]" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Advanced JSON fields */}
              <section>
                <h3 className="text-sm font-semibold text-ink-2 uppercase tracking-wide mb-3">Advanced (JSON)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Dynamic Details <span className="text-ink-3 font-normal">(JSON object: key-value pairs)</span></label>
                    <textarea value={formData.dynamicDetailsRaw} onChange={e => setField('dynamicDetailsRaw', e.target.value)}
                      className="w-full px-3 py-2 border border-line rounded-lg font-mono text-xs min-h-[60px] bg-gray-50"
                      placeholder={'{"Annual Benefit": "₹6,000", "Ministry": "Agriculture"}'} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Qualifying Questions <span className="text-ink-3 font-normal">(JSON array)</span></label>
                    <textarea value={formData.qualifyingQuestionsRaw} onChange={e => setField('qualifyingQuestionsRaw', e.target.value)}
                      className="w-full px-3 py-2 border border-line rounded-lg font-mono text-xs min-h-[60px] bg-gray-50"
                      placeholder={'[{"id":"q1","question":"Do you own land?","type":"boolean"}]'} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Application Steps <span className="text-ink-3 font-normal">(JSON array — for the visual guide)</span></label>
                    <textarea value={formData.applicationStepsRaw} onChange={e => setField('applicationStepsRaw', e.target.value)}
                      className="w-full px-3 py-2 border border-line rounded-lg font-mono text-xs min-h-[100px] bg-gray-50"
                      placeholder={'[{"step":1,"title":"Visit Portal","description":"...","imageUrl":"","actionUrl":"https://pmkisan.gov.in","actionLabel":"Open","tip":"","warning":""}]'} />
                  </div>
                </div>
              </section>

              <div className="flex gap-2 justify-end pt-2 border-t border-line">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">{editingScheme ? 'Update Scheme' : 'Create Scheme'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
