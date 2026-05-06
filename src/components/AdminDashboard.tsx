'use client';

import { useState, useEffect } from 'react';
import { secureFetch } from '@/lib/fetch';
import { Shield, Users, Target, Plus, Check, Layers, UserPlus, Trash2, Link, Key, Filter } from 'lucide-react';

export default function AdminDashboard({ currentUser }: { currentUser: any }) {
  const [activeTab, setActiveTab] = useState<'roles' | 'user-roles' | 'groups' | 'group-members' | 'group-roles' | 'acls'>('roles');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilterInput, setShowFilterInput] = useState<Record<string, boolean>>({});

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupRoles, setGroupRoles] = useState<any[]>([]);
  const [acls, setAcls] = useState<any[]>([]);

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

  // ACL form states
  const [aclTable, setAclTable] = useState('');
  const [aclOperation, setAclOperation] = useState('');
  const [aclRoleId, setAclRoleId] = useState('');
  const [aclDescription, setAclDescription] = useState('');

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
      const [uRes, rRes, gRes, urRes, gmRes, grRes, aRes] = await Promise.all([
        secureFetch('/api/users'),
        secureFetch('/api/admin/roles'),
        secureFetch('/api/admin/groups'),
        secureFetch('/api/admin/user-roles'),
        secureFetch('/api/admin/group-members'),
        secureFetch('/api/admin/group-roles'),
        secureFetch('/api/admin/acls')
      ]);

      if (uRes.ok) setUsers(await uRes.json());
      if (rRes.ok) setRoles(await rRes.json());
      if (gRes.ok) setGroups(await gRes.json());
      if (urRes.ok) setUserRoles(await urRes.json());
      if (gmRes.ok) setGroupMembers(await gmRes.json());
      if (grRes.ok) setGroupRoles(await grRes.json());
      if (aRes.ok) setAcls(await aRes.json());
    } catch (e: any) {
      showError(e.message || 'Failed to load data');
    }
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setFilters({});
    setShowFilterInput({});
  };

  const renderFilterHeader = (label: string, field: string) => (
    <th className="filterable-th">
      <div className="th-content">
        <span>{label}</span>
        <button 
          type="button"
          className={`filter-toggle ${filters[field] ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setShowFilterInput(prev => ({ ...prev, [field]: !prev[field] }));
          }}
        >
          <Filter size={12} />
        </button>
      </div>
      {showFilterInput[field] && (
        <div className="filter-input-wrapper">
          <input 
            className="header-filter-input"
            placeholder={`Search...`}
            value={filters[field] || ''}
            onChange={e => setFilters(prev => ({ ...prev, [field]: e.target.value }))}
            autoFocus
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </th>
  );

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

  const handleCreateAcl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aclTable || !aclOperation || !aclRoleId) return;
    try {
      const res = await secureFetch('/api/admin/acls', {
        method: 'POST',
        body: JSON.stringify({ table: aclTable, operation: aclOperation, roleId: aclRoleId, description: aclDescription })
      });
      if (res.ok) {
        const roleName = roles.find(r => r.id === aclRoleId)?.name || 'Role';
        showSuccess(`ACL created: ${aclTable}.${aclOperation} for ${roleName}`);
        setAclTable(''); setAclOperation(''); setAclRoleId(''); setAclDescription('');
        fetchData();
      } else { const d = await res.json(); showError(d.error); }
    } catch (e: any) { showError(e.message); }
  };

  // ─── RENDER ────────────────────────────────────

  return (
    <div className="admin-dashboard fade-in">
      <div className="admin-nav">
        <button className={activeTab === 'roles' ? 'active' : ''} onClick={() => handleTabChange('roles')}>
          <Shield size={16} /> Roles
        </button>
        <button className={activeTab === 'groups' ? 'active' : ''} onClick={() => handleTabChange('groups')}>
          <Layers size={16} /> Groups
        </button>
        <button className={activeTab === 'group-members' ? 'active' : ''} onClick={() => handleTabChange('group-members')}>
          <UserPlus size={16} /> Group Members
        </button>
        <button className={activeTab === 'group-roles' ? 'active' : ''} onClick={() => handleTabChange('group-roles')}>
          <Link size={16} /> Group Roles
        </button>
        <button className={activeTab === 'user-roles' ? 'active' : ''} onClick={() => handleTabChange('user-roles')}>
          <Target size={16} /> User Roles
        </button>
        <button className={activeTab === 'acls' ? 'active' : ''} onClick={() => handleTabChange('acls')}>
          <Key size={16} /> ACLs
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

            <div className="table-container">
              {roles.length === 0 ? (
                <div className="empty-state">No roles defined yet</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      {renderFilterHeader('Name', 'role_name')}
                      {renderFilterHeader('Description', 'role_desc')}
                      <th>System ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles
                      .filter(r => !filters.role_name || r.name.toLowerCase().includes(filters.role_name.toLowerCase()))
                      .filter(r => !filters.role_desc || r.description.toLowerCase().includes(filters.role_desc.toLowerCase()))
                      .map(r => (
                      <tr key={r.id}>
                        <td className="font-bold">{r.name}</td>
                        <td>{r.description}</td>
                        <td><span className="sys-id-tag">{r.id.slice(0, 8)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
            <div className="table-container">
              {groups.length === 0 ? (
                <div className="empty-state">No groups created yet</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      {renderFilterHeader('Name', 'group_name')}
                      {renderFilterHeader('Description', 'group_desc')}
                      {renderFilterHeader('Category', 'group_cat')}
                    </tr>
                  </thead>
                  <tbody>
                    {groups
                      .filter(g => !filters.group_name || g.name.toLowerCase().includes(filters.group_name.toLowerCase()))
                      .filter(g => !filters.group_desc || g.description.toLowerCase().includes(filters.group_desc.toLowerCase()))
                      .filter(g => !filters.group_cat || g.category.toLowerCase().includes(filters.group_cat.toLowerCase()))
                      .map(g => (
                      <tr key={g.id}>
                        <td className="font-bold">{g.name}</td>
                        <td>{g.description}</td>
                        <td><span className="category-badge">{g.category}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
            <div className="table-container">
              {groupMembers.length === 0 ? (
                <div className="empty-state">No group memberships yet</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      {renderFilterHeader('User', 'gm_user')}
                      {renderFilterHeader('Group', 'gm_group')}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupMembers
                      .filter(gm => !filters.gm_user || gm.user.name.toLowerCase().includes(filters.gm_user.toLowerCase()) || gm.user.username.toLowerCase().includes(filters.gm_user.toLowerCase()))
                      .filter(gm => !filters.gm_group || gm.group.name.toLowerCase().includes(filters.gm_group.toLowerCase()))
                      .map(gm => (
                      <tr key={gm.id}>
                        <td>
                          <div className="item-info">
                            <strong>{gm.user.name}</strong>
                            <span>{gm.user.username}</span>
                          </div>
                        </td>
                        <td><span className="font-bold">{gm.group.name}</span></td>
                        <td>
                          <button
                            className="btn-icon-danger"
                            onClick={() => handleRemoveMember(gm.id, gm.user.name, gm.group.name)}
                            title="Remove from group"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
            <div className="table-container">
              {groupRoles.length === 0 ? (
                <div className="empty-state">No group-role assignments yet</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      {renderFilterHeader('Group', 'gr_group')}
                      {renderFilterHeader('Role Inherited', 'gr_role')}
                    </tr>
                  </thead>
                  <tbody>
                    {groupRoles
                      .filter(gr => !filters.gr_group || gr.group.name.toLowerCase().includes(filters.gr_group.toLowerCase()))
                      .filter(gr => !filters.gr_role || gr.role.name.toLowerCase().includes(filters.gr_role.toLowerCase()))
                      .map(gr => (
                      <tr key={gr.id}>
                        <td className="font-bold">{gr.group.name}</td>
                        <td><span className="role-badge">{gr.role.name}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
            <div className="table-container">
              {userRoles.length === 0 ? (
                <div className="empty-state">No user-role assignments yet</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      {renderFilterHeader('User', 'ur_user')}
                      {renderFilterHeader('Role Assigned', 'ur_role')}
                    </tr>
                  </thead>
                  <tbody>
                    {userRoles
                      .filter(ur => !filters.ur_user || ur.user.name.toLowerCase().includes(filters.ur_user.toLowerCase()) || ur.user.username.toLowerCase().includes(filters.ur_user.toLowerCase()))
                      .filter(ur => !filters.ur_role || ur.role.name.toLowerCase().includes(filters.ur_role.toLowerCase()))
                      .map(ur => (
                      <tr key={ur.id}>
                        <td>
                          <div className="item-info">
                            <strong>{ur.user.name}</strong>
                            <span>{ur.user.username}</span>
                          </div>
                        </td>
                        <td><span className="role-badge">{ur.role.name}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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

        {/* ─── ACL TAB (sys_acl) ─── */}
        {activeTab === 'acls' && (
          <div className="admin-panel">
            <h3>Access Control Lists</h3>
            <p className="panel-subtitle">Define table-level permissions for roles (e.g., who can read/write events).</p>
            <div className="table-container">
              {acls.length === 0 ? (
                <div className="empty-state">No ACLs defined yet</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      {renderFilterHeader('Table', 'acl_table')}
                      {renderFilterHeader('Operation', 'acl_op')}
                      {renderFilterHeader('Role', 'acl_role')}
                      {renderFilterHeader('Description', 'acl_desc')}
                    </tr>
                  </thead>
                  <tbody>
                    {acls
                      .filter(acl => !filters.acl_table || acl.table.toLowerCase().includes(filters.acl_table.toLowerCase()))
                      .filter(acl => !filters.acl_op || acl.operation.toLowerCase().includes(filters.acl_op.toLowerCase()))
                      .filter(acl => !filters.acl_role || acl.role.name.toLowerCase().includes(filters.acl_role.toLowerCase()))
                      .filter(acl => !filters.acl_desc || (acl.description && acl.description.toLowerCase().includes(filters.acl_desc.toLowerCase())))
                      .map(acl => (
                      <tr key={acl.id}>
                        <td className="font-bold text-uppercase">{acl.table}</td>
                        <td><span className="operation-badge">{acl.operation}</span></td>
                        <td><span className="role-badge">{acl.role.name}</span></td>
                        <td className="text-small">{acl.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <form className="admin-form" onSubmit={handleCreateAcl}>
              <h4>Create New ACL</h4>
              <select value={aclTable} onChange={e => setAclTable(e.target.value)} required>
                <option value="">Select Table...</option>
                <option value="event">Event [event]</option>
                <option value="user">User [user]</option>
                <option value="group">Group [group]</option>
                <option value="role">Role [role]</option>
                <option value="participant">Participant [participant]</option>
                <option value="userrole">User Roles [userrole]</option>
                <option value="usergroupm2m">Group Members [usergroupm2m]</option>
                <option value="rolegroupm2m">Group Roles [rolegroupm2m]</option>
                <option value="accesscontrollist">ACL [accesscontrollist]</option>
              </select>
              <select value={aclOperation} onChange={e => setAclOperation(e.target.value)} required>
                <option value="">Select Operation...</option>
                <option value="read">read</option>
                <option value="write">write</option>
                <option value="create">create</option>
                <option value="delete">delete</option>
              </select>
              <select value={aclRoleId} onChange={e => setAclRoleId(e.target.value)} required>
                <option value="">Select Role...</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <input placeholder="Description (optional)" value={aclDescription} onChange={e => setAclDescription(e.target.value)} />
              <button type="submit" className="btn-primary"><Plus size={16} /> Add ACL</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}