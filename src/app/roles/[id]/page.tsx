'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Users, Layers, XCircle, Refresh, Trash } from '@/components/Icons';
import { secureFetch } from '@/lib/fetch';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface UserRole {
  id: string;
  user: User;
}

interface GroupRole {
  id: string;
  group: Group;
}

interface Role {
  id: string;
  name: string;
  description: string;
  users: UserRole[];
  groups: GroupRole[];
}

export default function RoleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params.id as string;

  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRole = async () => {
    setLoading(true);
    try {
      const res = await secureFetch(`/api/admin/roles/${roleId}`);
      if (res.ok) {
        const data = await res.json();
        setRole(data);
      } else {
        setError('Role not found or access denied');
      }
    } catch (err) {
      setError('Failed to load role details');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [uRes, gRes] = await Promise.all([
        secureFetch('/api/users'),
        secureFetch('/api/admin/groups')
      ]);
      if (uRes.ok) setAllUsers(await uRes.json());
      if (gRes.ok) setAllGroups(await gRes.json());
    } catch (err) {
      console.error('Failed to fetch options');
    }
  };

  useEffect(() => {
    fetchRole();
    fetchOptions();
  }, [roleId]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await secureFetch('/api/admin/user-roles', {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUser, roleId })
      });
      if (res.ok) {
        setSelectedUser('');
        fetchRole();
      } else {
        alert((await res.json()).error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveUser = async (urId: string) => {
    if (!confirm('Remove user from this role?')) return;
    try {
      const res = await secureFetch(`/api/admin/user-roles?id=${urId}`, { method: 'DELETE' });
      if (res.ok) fetchRole();
      else alert((await res.json()).error);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setSubmitting(true);
    try {
      const res = await secureFetch('/api/admin/group-roles', {
        method: 'POST',
        body: JSON.stringify({ groupId: selectedGroup, roleId })
      });
      if (res.ok) {
        setSelectedGroup('');
        fetchRole();
      } else {
        alert((await res.json()).error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveGroup = async (grId: string) => {
    if (!confirm('Remove role from this group?')) return;
    try {
      const res = await secureFetch(`/api/admin/group-roles?id=${grId}`, { method: 'DELETE' });
      if (res.ok) fetchRole();
      else alert((await res.json()).error);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !role) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner" />
          <p className="loading-text">Loading role details...</p>
        </div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center">
        <div className="error-container">
          <XCircle size={48} className="error-icon" />
          <h2 className="error-title">Access Denied</h2>
          <p className="error-message">{error || 'Role not found'}</p>
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
                <Shield size={28} style={{ color: 'var(--primary-color)' }} />
                <h1 className="activity-title" style={{ margin: 0 }}>{role.name}</h1>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{role.description}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={fetchRole} className="refresh-button" title="Refresh data">
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
                  User-Role
                </h2>
                <p className="participants-count">
                  {role.users.length} users with this role
                </p>
              </div>
            </div>

            {role.users.length > 0 ? (
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
                    {role.users.map((ur) => (
                      <tr key={ur.id}>
                        <td className="font-semibold">{ur.user.name}</td>
                        <td className="text-secondary">{ur.user.username}</td>
                        <td>
                          <button onClick={() => handleRemoveUser(ur.id)} className="btn-icon-danger" title="Remove user">
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
                <p className="empty-text">No users found with this role</p>
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
                  <Layers size={20} />
                  Group-Role
                </h2>
                <p className="participants-count">
                  {role.groups.length} groups with this role
                </p>
              </div>
            </div>

            {role.groups.length > 0 ? (
              <div className="table-container">
                <table className="participants-table">
                  <thead>
                    <tr>
                      <th>Group Name</th>
                      <th>Category</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {role.groups.map((gr) => (
                      <tr key={gr.id}>
                        <td className="font-semibold">{gr.group.name}</td>
                        <td>
                          <span className="category-badge">{gr.group.category}</span>
                        </td>
                        <td>
                          <button onClick={() => handleRemoveGroup(gr.id)} className="btn-icon-danger" title="Remove group">
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
                <Layers size={48} className="empty-icon" />
                <p className="empty-text">No groups found with this role</p>
              </div>
            )}

            <form onSubmit={handleAddGroup} style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} required style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                <option value="">Select Group...</option>
                {allGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '8px 16px' }}>Add</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
