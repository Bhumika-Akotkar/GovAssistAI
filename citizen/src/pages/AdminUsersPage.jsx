import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { adminFetch } from '../lib/adminApi';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', role: 'user' });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminFetch('/api/users');
      if (response.ok) {
        setUsers(await response.json());
      } else {
        throw new Error('Failed to load users');
      }
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await adminFetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('User deleted successfully');
        loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (err) {
      setError('Failed to delete user');
      setTimeout(() => setError(''), 3000);
    }
  };

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setEditForm({ name: user.name || '', phone: user.phone || '', role: user.role || 'user' });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
  };

  const handleSave = async (id) => {
    try {
      const res = await adminFetch(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setSuccess('User updated successfully');
        setEditingUserId(null);
        loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Failed to update user');
      }
    } catch (err) {
      setError('Failed to update user');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-ink-2">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen notranslate bg-paper">
      <div className="bg-forest text-white p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">User Management</h1>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/schemes')}>Schemes Admin</Button>
            <Button variant="white" size="sm" onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {error && <div className="bg-danger/10 text-danger p-4 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-forest/10 text-forest p-4 rounded-lg mb-4">{success}</div>}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-ink">Manage Users</h2>
          <p className="text-ink-2">Total Users: {users.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-paper-2 border-b border-line">
                  <th className="p-4 font-semibold text-sm text-ink">Phone</th>
                  <th className="p-4 font-semibold text-sm text-ink">Name</th>
                  <th className="p-4 font-semibold text-sm text-ink">Role</th>
                  <th className="p-4 font-semibold text-sm text-ink">Joined At</th>
                  <th className="p-4 font-semibold text-sm text-ink text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-ink-2">No users found.</td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="border-b border-line last:border-0 hover:bg-gray-50/50">
                      {editingUserId === user.id ? (
                        <>
                          <td className="p-4">
                            <input 
                              type="text" 
                              className="w-full px-2 py-1 border border-line rounded text-sm"
                              value={editForm.phone} 
                              onChange={e => setEditForm({ ...editForm, phone: e.target.value })} 
                            />
                          </td>
                          <td className="p-4">
                            <input 
                              type="text" 
                              className="w-full px-2 py-1 border border-line rounded text-sm"
                              value={editForm.name} 
                              onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                            />
                          </td>
                          <td className="p-4">
                            <select 
                              className="w-full px-2 py-1 border border-line rounded text-sm"
                              value={editForm.role} 
                              onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td className="p-4 text-sm text-ink-2">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <Button size="sm" onClick={() => handleSave(user.id)}>Save</Button>
                            <Button variant="secondary" size="sm" onClick={cancelEdit}>Cancel</Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 text-sm font-medium">{user.phone}</td>
                          <td className="p-4 text-sm">{user.name || '-'}</td>
                          <td className="p-4 text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-ink-2">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <Button variant="secondary" size="sm" onClick={() => startEdit(user)}>Edit</Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)}>Delete</Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
