'use client';

import { useState, useEffect } from 'react';
import { secureFetch } from '@/lib/fetch';
import { Shield, Users, Target, Plus, Check, Layers, UserPlus, Trash2, Link } from 'lucide-react';

export default function AdminDashboard({ currentUser }: { currentUser: any }) {
  const [activeTab, setActiveTab] = useState<'roles' | 'user-roles' | 'groups' | 'group-members' | 'group-roles'>('roles');
  
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupRoles, setGroupRoles] = useState<any[]>([]);
  
  // Form states
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('');
  
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const [memberUser, setMemberUser] = useState('');
  const [memberGroup, setMemberGroup] = useState('');

  const [grRoleId, setGrRoleId] = useState('');
  const [grGroupId, setGrGroupId] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setSuccess('');
    setTimeout(() => setError(''), 5000);
  };

  const fetchData = async () => {
    try {
      const [uRes, rRes, gRes, urRes, gmRes, grRes] = await Promise.all([
        secureFetch('/api/users'),
        secureFetch('/api/admin/roles'),
        secureFetch('/api/admin/groups'),
        secureFetch('/api/admin/user-roles'),
        secureFetch('/api/admin/group-members'),
        secureFetch('/api/admin/group-roles')
      ]);

      if (uRes.ok) setUsers(await uRes.json());
      if (rRes.ok) setRoles(await rRes.json());
      if (gRes.ok) setGroups(await gRes.json());
      if (urRes.ok) setUserRoles(await urRes.json());
      if (gmRes.ok) setGroupMembers(await gmRes.json());
      if (grRes.ok) setGroupRoles(await grRes.json());
    } catch (e: any) {
      showError(e.message || 'Failed to load data');
    }
  };

  // ─── HANDLERS ───────────────────────────────────

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await secureFetch('/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify({ name: newRoleName, description: newRoleDesc })
      });
      if (res.ok) {
        showSuccess(`Role "${newRoleName}" created`);
        setNewRoleName(''); setNewRoleDesc('');
        fetchData();
      } else { const d = await res.json(); showError(d.error); }
    } catch (e: any) { showError(e.message); }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await secureFetch('/api/admin/groups', {
        method: 'POST',
        body: JSON.stringify({ name: newGroupName, description: newGroupDesc, category: newGroupCategory })
      });
      if (res.ok) {
        showSuccess(`Group "${newGroupName}" created`);
        setNewGroupName(''); setNewGroupDesc(''); setNewGroupCategory('');
        fetchData();
      } else { const d = await res.json(); showError(d.error); }
    } catch (e: any) { showError(e.message); }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedRole) return;
    try {
      const res = await secureFetch('/api/admin/user-roles', {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUser, roleId: selectedRole })
      });
      if (res.ok) {
        const userName = users.find(u => u.id === selectedUser)?.name || 'User';
        const roleName = roles.find(r => r.id === selectedRole)?.name || 'Role';
        showSuccess(`Assigned "${roleName}" to ${userName}`);
        setSelectedUser(''); setSelectedRole('');
        fetchData();
      } else { const d = await res.json(); showError(d.error); }
    } catch (e: any) { showError(e.message); }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberUser || !memberGroup) return;
    try {
      const res = await secureFetch('/api/admin/group-members', {
        method: 'POST',
        body: JSON.stringify({ userId: memberUser, groupId: memberGroup })
      });
      if (res.ok) {
        const userName = users.find(u => u.id === memberUser)?.name || 'User';
        const groupName = groups.find(g => g.id === memberGroup)?.name || 'Group';
        showSuccess(`Added ${userName} to "${groupName}"`);
        setMemberUser(''); setMemberGroup('');
        fetchData();
      } else { const d = await res.json(); showError(d.error); }
    } catch (e: any) { showError(e.message); }
  };

  const handleRemoveMember = async (id: string, userName: string, groupName: string) => {
    if (!confirm(`Remove ${userName} from "${groupName}"?`)) return;
    try {
      const res = await secureFetch(`/api/admin/group-members?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess(`Removed ${userName} from "${groupName}"`);
        fetchData();
      } else { const d = await res.json(); showError(d.error); }
    } catch (e: any) { showError(e.message); }
  };

  const handleAssignGroupRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grRoleId || !grGroupId) return;
    try {
      const res = await secureFetch('/api/admin/group-roles', {
        method: 'POST',
        body: JSON.stringify({ roleId: grRoleId, groupId: grGroupId })
      });
      if (res.ok) {
        const roleName = roles.find(r => r.id === grRoleId)?.name || 'Role';
        const groupName = groups.find(g => g.id === grGroupId)?.name || 'Group';
        showSuccess(`Assigned "${roleName}" role to group "${groupName}"`);
        setGrRoleId(''); setGrGroupId('');
        fetchData();
      } else { const d = await res.json(); showError(d.error); }
    } catch (e: any) { showError(e.message); }
  };

  // ─── RENDER ────────────────────────────────────

  return (
    <div className="admin-dashboard fade-in">
      <div className="admin-nav">
        <button className={activeTab === 'roles' ? 'active' : ''} onClick={() => setActiveTab('roles')}>
          <Shield size={16} /> Roles
        </button>
        <button className={activeTab === 'groups' ? 'active' : ''} onClick={() => setActiveTab('groups')}>
          <Layers size={16} /> Groups
        </button>
        <button className={activeTab === 'group-members' ? 'active' : ''} onClick={() => setActiveTab('group-members')}>
          <UserPlus size={16} /> Group Members
        </button>
        <button className={activeTab === 'group-roles' ? 'active' : ''} onClick={() => setActiveTab('group-roles')}>
          <Link size={16} /> Group Roles
        </button>
        <button className={activeTab === 'user-roles' ? 'active' : ''} onClick={() => setActiveTab('user-roles')}>
          <Target size={16} /> User Roles
        </button>
      </div>

      {success && <div className="success-banner"><Check size={16} /> {success}</div>}
      {error && <div className="error-banner">{error}</div>}

      <div className="admin-content">

        {/* ─── ROLES TAB (sys_user_role definition) ─── */}
        {activeTab === 'roles' && (
          <div className="admin-panel">
            <h3>System Roles</h3>
            <p className="panel-subtitle">Define roles that can be assigned to users or inherited through groups.</p>
            <div className="list-container">
              {roles.length === 0 && <div className="empty-state">No roles defined yet</div>}
              {roles.map(r => (
                <div key={r.id} className="list-item">
                  <div className="item-info">
                    <strong>{r.name}</strong>
                    <span>{r.description}</span>
                  </div>
                  <span className="sys-id-tag">{r.id.slice(0,8)}</span>
                </div>
              ))}
            </div>
            <form className="admin-form" onSubmit={handleCreateRole}>
              <h4>Create New Role</h4>
              <input placeholder="Role Name (e.g. event_manager)" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} required />
              <input placeholder="Description" value={newRoleDesc} onChange={e => setNewRoleDesc(e.target.value)} required />
              <button type="submit" className="btn-primary"><Plus size={16} /> Add Role</button>
            </form>
          </div>
        )}

        {/* ─── GROUPS TAB (sys_user_group) ─── */}
        {activeTab === 'groups' && (
          <div className="admin-panel">
            <h3>Groups</h3>
            <p className="panel-subtitle">Groups organize users and inherit roles. Adding a user to a group grants them all roles assigned to that group.</p>
            <div className="list-container">
              {groups.length === 0 && <div className="empty-state">No groups created yet</div>}
              {groups.map(g => (
                <div key={g.id} className="list-item">
                  <div className="item-info">
                    <strong>{g.name}</strong>
                    <span>{g.description}</span>
                  </div>
                  <span className="category-badge">{g.category}</span>
                </div>
              ))}
            </div>
            <form className="admin-form" onSubmit={handleCreateGroup}>
              <h4>Create New Group</h4>
              <input placeholder="Group Name (e.g. Event Admins)" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} required />
              <input placeholder="Description" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} required />
              <select value={newGroupCategory} onChange={e => setNewGroupCategory(e.target.value)} required>
                <option value="">Select Category...</option>
                <option value="Security">Security</option>
                <option value="Operations">Operations</option>
                <option value="Management">Management</option>
                <option value="Custom">Custom</option>
              </select>
              <button type="submit" className="btn-primary"><Plus size={16} /> Add Group</button>
            </form>
          </div>
        )}

        {/* ─── GROUP MEMBERS TAB (sys_user_grmember) ─── */}
        {activeTab === 'group-members' && (
          <div className="admin-panel">
            <h3>Group Members</h3>
            <p className="panel-subtitle">Manage which users belong to which groups. Adding a user to a group automatically inherits all roles assigned to that group.</p>
            <div className="list-container">
              {groupMembers.length === 0 && <div className="empty-state">No group memberships yet</div>}
              {groupMembers.map(gm => (
                <div key={gm.id} className="list-item">
                  <div className="item-info">
                    <strong>{gm.user.name} ({gm.user.username})</strong>
                    <span>Member of <b>{gm.group.name}</b></span>
                  </div>
                  <button
                    className="btn-icon-danger"
                    onClick={() => handleRemoveMember(gm.id, gm.user.name, gm.group.name)}
                    title="Remove from group"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <form className="admin-form" onSubmit={handleAddMember}>
              <h4>Add User to Group</h4>
              <select value={memberUser} onChange={e => setMemberUser(e.target.value)} required>
                <option value="">Select User...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.username})</option>)}
              </select>
              <select value={memberGroup} onChange={e => setMemberGroup(e.target.value)} required>
                <option value="">Select Group...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name} — {g.category}</option>)}
              </select>
              <button type="submit" className="btn-primary"><UserPlus size={16} /> Add to Group</button>
            </form>
          </div>
        )}

        {/* ─── GROUP ROLES TAB (sys_group_has_role) ─── */}
        {activeTab === 'group-roles' && (
          <div className="admin-panel">
            <h3>Group → Role Assignments</h3>
            <p className="panel-subtitle">Assign roles to groups. All members of the group will automatically inherit these roles.</p>
            <div className="list-container">
              {groupRoles.length === 0 && <div className="empty-state">No group-role assignments yet</div>}
              {groupRoles.map(gr => (
                <div key={gr.id} className="list-item">
                  <div className="item-info">
                    <strong>{gr.group.name}</strong>
                    <span className="role-badge">{gr.role.name}</span>
                  </div>
                </div>
              ))}
            </div>
            <form className="admin-form" onSubmit={handleAssignGroupRole}>
              <h4>Assign Role to Group</h4>
              <select value={grGroupId} onChange={e => setGrGroupId(e.target.value)} required>
                <option value="">Select Group...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <select value={grRoleId} onChange={e => setGrRoleId(e.target.value)} required>
                <option value="">Select Role...</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <button type="submit" className="btn-primary"><Link size={16} /> Assign Role to Group</button>
            </form>
          </div>
        )}

        {/* ─── USER ROLES TAB (sys_user_has_role) ─── */}
        {activeTab === 'user-roles' && (
          <div className="admin-panel">
            <h3>User → Role Assignments</h3>
            <p className="panel-subtitle">Directly assign roles to individual users. Roles inherited from groups are managed automatically.</p>
            <div className="list-container">
              {userRoles.length === 0 && <div className="empty-state">No user-role assignments yet</div>}
              {userRoles.map(ur => (
                <div key={ur.id} className="list-item">
                  <div className="item-info">
                    <strong>{ur.user.name} ({ur.user.username})</strong>
                    <span className="role-badge">{ur.role.name}</span>
                  </div>
                </div>
              ))}
            </div>
            <form className="admin-form" onSubmit={handleAssignRole}>
              <h4>Assign Role to User</h4>
              <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required>
                <option value="">Select User...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.username})</option>)}
              </select>
              <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} required>
                <option value="">Select Role...</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <button type="submit" className="btn-primary"><Target size={16} /> Assign Role</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
