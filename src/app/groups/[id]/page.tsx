'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Layers, Shield, Users, XCircle, Refresh, Trash } from '@/components/Icons';
import { secureFetch } from '@/lib/fetch';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface UserGroup {
  id: string;
  user: User;
}

interface GroupRole {
  id: string;
  role: Role;
}

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  users: UserGroup[];
  roles: GroupRole[];
}

export default function GroupDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGroup = async () => {
    setLoading(true);
    try {
      const res = await secureFetch(`/api/admin/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
      } else {
        setError('Group not found or access denied');
      }
    } catch (err) {
      setError('Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [uRes, rRes] = await Promise.all([
        secureFetch('/api/users'),
        secureFetch('/api/admin/roles')
      ]);
      if (uRes.ok) setAllUsers(await uRes.json());
      if (rRes.ok) setAllRoles(await rRes.json());
    } catch (err) {
      console.error('Failed to fetch options');
    }
  };

  useEffect(() => {
    fetchGroup();
    fetchOptions();
  }, [groupId]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await secureFetch('/api/admin/group-members', {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUser, groupId })
      });
      if (res.ok) {
        setSelectedUser('');
        fetchGroup();
      } else {
        alert((await res.json()).error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveUser = async (ugId: string) => {
    if (!confirm('Remove user from this group?')) return;
    try {
      const res = await secureFetch(`/api/admin/group-members?id=${ugId}`, { method: 'DELETE' });
      if (res.ok) fetchGroup();
      else alert((await res.json()).error);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setSubmitting(true);
    try {
      const res = await secureFetch('/api/admin/group-roles', {
        method: 'POST',
        body: JSON.stringify({ roleId: selectedRole, groupId })
      });
      if (res.ok) {
        setSelectedRole('');
        fetchGroup();
      } else {
        alert((await res.json()).error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveRole = async (grId: string) => {
    if (!confirm('Remove role from this group?')) return;
    try {
      const res = await secureFetch(`/api/admin/group-roles?id=${grId}`, { method: 'DELETE' });
      if (res.ok) fetchGroup();
      else alert((await res.json()).error);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !group) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner" />
          <p className="loading-text">Loading group details...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center">
        <div className="error-container">
          <XCircle size={48} className="error-icon" />
          <h2 className="error-title">Access Denied</h2>
          <p className="error-message">{error || 'Group not found'}</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            <ArrowLeft size={18} />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)]">
      <header className="dashboard-header">
        <div className="header-brand">
          <button onClick={() => router.push('/')} className="back-button">
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="activity-card" style={{ marginBottom: '32px' }}>
          <div className="activity-card-header">
            <div className="activity-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Layers size={28} style={{ color: 'var(--primary-color)' }} />
                <h1 className="activity-title" style={{ margin: 0 }}>{group.name}</h1>
                <span className="category-badge">{group.category}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{group.description}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={fetchGroup} className="refresh-button" title="Refresh data">
                <Refresh size={20} className={loading ? 'spinning' : ''} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div className="participants-card">
            <div className="participants-header">
              <div>
                <h2 className="participants-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={20} />
                  Group-Users
                </h2>
                <p className="participants-count">
                  {group.users.length} users in this group
                </p>
              </div>
            </div>

            {group.users.length > 0 ? (
              <div className="table-container">
                <table className="participants-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Username</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.users.map((ug) => (
                      <tr key={ug.id}>
                        <td className="font-semibold">{ug.user.name}</td>
                        <td className="text-secondary">{ug.user.username}</td>
                        <td>
                          <button onClick={() => handleRemoveUser(ug.id)} className="btn-icon-danger" title="Remove user">
                            <Trash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <Users size={48} className="empty-icon" />
                <p className="empty-text">No users found in this group</p>
              </div>
            )}

            <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                <option value="">Select User...</option>
                {allUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.username})</option>)}
              </select>
              <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '8px 16px' }}>Add</button>
            </form>
          </div>

          <div className="participants-card">
            <div className="participants-header">
              <div>
                <h2 className="participants-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={20} />
                  Group-Roles
                </h2>
                <p className="participants-count">
                  {group.roles.length} roles assigned to this group
                </p>
              </div>
            </div>

            {group.roles.length > 0 ? (
              <div className="table-container">
                <table className="participants-table">
                  <thead>
                    <tr>
                      <th>Role Name</th>
                      <th>Description</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.roles.map((gr) => (
                      <tr key={gr.id}>
                        <td className="font-semibold">{gr.role.name}</td>
                        <td className="text-secondary">{gr.role.description}</td>
                        <td>
                          <button onClick={() => handleRemoveRole(gr.id)} className="btn-icon-danger" title="Remove role">
                            <Trash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <Shield size={48} className="empty-icon" />
                <p className="empty-text">No roles found for this group</p>
              </div>
            )}

            <form onSubmit={handleAddRole} style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} required style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                <option value="">Select Role...</option>
                {allRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '8px 16px' }}>Add</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
