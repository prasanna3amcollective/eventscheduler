'use client';

import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { secureFetch } from '@/lib/fetch';
import {
  Shield, Users, Target, Plus, Check, Layers, UserPlus, Trash, Link, Key, Filter
} from '@/components/Icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface User {
  id: string;
  name: string;
  username: string;
  type?: string;
  email?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
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
  role: Role;
}

interface GroupMember {
  id: string;
  user: User;
  group: Group;
}

interface GroupRole {
  id: string;
  group: Group;
  role: Role;
}

interface Acl {
  id: string;
  table: string;
  operation: string;
  role: Role;
  description: string | null;
}

type AdminTab = 'roles' | 'user-roles' | 'groups' | 'group-members' | 'group-roles' | 'acls';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GROUPS_CATEGORIES = ['Security', 'Operations', 'Management', 'Custom'] as const;
const ACL_TABLES = [
  'activity', 'user', 'group', 'role', 'participant',
  'userrole', 'usergroupm2m', 'rolegroupm2m', 'accesscontrollist',
] as const;
const ACL_OPERATIONS = ['read', 'write', 'create', 'delete'] as const;

const FILTER_DELAY_MS = 300;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/** Case-insensitive substring match; handles null/undefined safely. */
function matchesFilter(value: string | null | undefined, filter: string): boolean {
  if (!filter) return true;
  return (value ?? '').toLowerCase().includes(filter.toLowerCase());
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function SuccessBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="success-banner">
      <Check size={16} /> {message}
    </div>
  );
}

function ErrorBannerInline({ message }: { message: string }) {
  if (!message) return null;
  return <div className="error-banner">{message}</div>;
}

function FilterableTh({
  label,
  field,
  filters,
  showFilterInput,
  onToggleFilter,
  onFilterChange,
}: {
  label: string;
  field: string;
  filters: Record<string, string>;
  showFilterInput: Record<string, boolean>;
  onToggleFilter: (field: string) => void;
  onFilterChange: (field: string, value: string) => void;
}) {
  return (
    <th className="filterable-th">
      <div className="th-content">
        <span>{label}</span>
        <button
          type="button"
          className={`filter-toggle ${filters[field] ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFilter(field);
          }}
        >
          <Filter size={12} />
        </button>
      </div>
      {showFilterInput[field] && (
        <div className="filter-input-wrapper">
          <input
            className="header-filter-input"
            placeholder="Search..."
            value={filters[field] || ''}
            onChange={(e) => onFilterChange(field, e.target.value)}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </th>
  );
}

// ---------------------------------------------------------------------------
// AdminDashboard
// ---------------------------------------------------------------------------

export default function AdminDashboard({ currentUser }: { currentUser: User }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('roles');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilterInput, setShowFilterInput] = useState<Record<string, boolean>>({});

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupRoles, setGroupRoles] = useState<GroupRole[]>([]);
  const [acls, setAcls] = useState<Acl[]>([]);

  // -- Form states --
  // Roles
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // Groups
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('');

  // User-Role assignment
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Group membership
  const [memberUser, setMemberUser] = useState('');
  const [memberGroup, setMemberGroup] = useState('');

  // Group-Role assignment
  const [grRoleId, setGrRoleId] = useState('');
  const [grGroupId, setGrGroupId] = useState('');

  // ACL
  const [aclTable, setAclTable] = useState('');
  const [aclOperation, setAclOperation] = useState('');
  const [aclRoleId, setAclRoleId] = useState('');
  const [aclDescription, setAclDescription] = useState('');

  // -- Feedback --
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // -- Confirmation dialog (replaces confirm() calls) --
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  const showSuccess = useCallback((msg: string) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  }, []);

  const showError = useCallback((msg: string) => {
    setError(msg);
    setSuccess('');
    setTimeout(() => setError(''), 5000);
  }, []);

  const toggleFilter = useCallback((field: string) => {
    setShowFilterInput((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const updateFilter = useCallback((field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      const [uRes, rRes, gRes, urRes, gmRes, grRes, aRes] = await Promise.all([
        secureFetch('/api/users'),
        secureFetch('/api/admin/roles'),
        secureFetch('/api/admin/groups'),
        secureFetch('/api/admin/user-roles'),
        secureFetch('/api/admin/group-members'),
        secureFetch('/api/admin/group-roles'),
        secureFetch('/api/admin/acls'),
      ]);

      if (uRes.ok) setUsers(await uRes.json());
      if (rRes.ok) setRoles(await rRes.json());
      if (gRes.ok) setGroups(await gRes.json());
      if (urRes.ok) setUserRoles(await urRes.json());
      if (gmRes.ok) setGroupMembers(await gmRes.json());
      if (grRes.ok) setGroupRoles(await grRes.json());
      if (aRes.ok) setAcls(await aRes.json());
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load data');
    }
  }, [showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleTabChange = useCallback((tab: AdminTab) => {
    setActiveTab(tab);
    setFilters({});
    setShowFilterInput({});
  }, []);

  // ── CREATE ROLE ────────────────────────────────────────────────────────

  const handleCreateRole = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      try {
        const res = await secureFetch('/api/admin/roles', {
          method: 'POST',
          body: JSON.stringify({ name: newRoleName, description: newRoleDesc }),
        });
        if (res.ok) {
          showSuccess(`Role "${newRoleName}" created`);
          setNewRoleName('');
          setNewRoleDesc('');
          fetchData();
        } else {
          const d = await res.json();
          showError(d.error);
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to create role');
      }
    },
    [newRoleName, newRoleDesc, showSuccess, showError, fetchData],
  );

  // ── CREATE GROUP ───────────────────────────────────────────────────────

  const handleCreateGroup = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      try {
        const res = await secureFetch('/api/admin/groups', {
          method: 'POST',
          body: JSON.stringify({
            name: newGroupName,
            description: newGroupDesc,
            category: newGroupCategory,
          }),
        });
        if (res.ok) {
          showSuccess(`Group "${newGroupName}" created`);
          setNewGroupName('');
          setNewGroupDesc('');
          setNewGroupCategory('');
          fetchData();
        } else {
          const d = await res.json();
          showError(d.error);
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to create group');
      }
    },
    [newGroupName, newGroupDesc, newGroupCategory, showSuccess, showError, fetchData],
  );

  // ── ASSIGN USER ROLE ───────────────────────────────────────────────────

  const handleAssignRole = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!selectedUser || !selectedRole) return;
      try {
        const res = await secureFetch('/api/admin/user-roles', {
          method: 'POST',
          body: JSON.stringify({ userId: selectedUser, roleId: selectedRole }),
        });
        if (res.ok) {
          const userName = users.find((u) => u.id === selectedUser)?.name ?? 'User';
          const roleName = roles.find((r) => r.id === selectedRole)?.name ?? 'Role';
          showSuccess(`Assigned "${roleName}" to ${userName}`);
          setSelectedUser('');
          setSelectedRole('');
          fetchData();
        } else {
          const d = await res.json();
          showError(d.error);
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to assign role');
      }
    },
    [selectedUser, selectedRole, users, roles, showSuccess, showError, fetchData],
  );

  // ── ADD GROUP MEMBER ──────────────────────────────────────────────────

  const handleAddMember = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!memberUser || !memberGroup) return;
      try {
        const res = await secureFetch('/api/admin/group-members', {
          method: 'POST',
          body: JSON.stringify({ userId: memberUser, groupId: memberGroup }),
        });
        if (res.ok) {
          const userName = users.find((u) => u.id === memberUser)?.name ?? 'User';
          const groupName = groups.find((g) => g.id === memberGroup)?.name ?? 'Group';
          showSuccess(`Added ${userName} to "${groupName}"`);
          setMemberUser('');
          setMemberGroup('');
          fetchData();
        } else {
          const d = await res.json();
          showError(d.error);
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to add member');
      }
    },
    [memberUser, memberGroup, users, groups, showSuccess, showError, fetchData],
  );

  const requestRemoveMember = useCallback(
    (id: string, userName: string, groupName: string) => {
      setConfirmMessage(`Remove ${userName} from "${groupName}"?`);
      setConfirmAction(() => async () => {
        try {
          const res = await secureFetch(`/api/admin/group-members?id=${id}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            showSuccess(`Removed ${userName} from "${groupName}"`);
            fetchData();
          } else {
            const d = await res.json();
            showError(d.error);
          }
        } catch (err) {
          showError(err instanceof Error ? err.message : 'Failed to remove member');
        }
      });
    },
    [showSuccess, showError, fetchData],
  );

  // ── ASSIGN GROUP ROLE ─────────────────────────────────────────────────

  const handleAssignGroupRole = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!grRoleId || !grGroupId) return;
      try {
        const res = await secureFetch('/api/admin/group-roles', {
          method: 'POST',
          body: JSON.stringify({ roleId: grRoleId, groupId: grGroupId }),
        });
        if (res.ok) {
          const roleName = roles.find((r) => r.id === grRoleId)?.name ?? 'Role';
          const groupName = groups.find((g) => g.id === grGroupId)?.name ?? 'Group';
          showSuccess(`Assigned "${roleName}" role to group "${groupName}"`);
          setGrRoleId('');
          setGrGroupId('');
          fetchData();
        } else {
          const d = await res.json();
          showError(d.error);
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to assign group role');
      }
    },
    [grRoleId, grGroupId, roles, groups, showSuccess, showError, fetchData],
  );

  // ── CREATE ACL ─────────────────────────────────────────────────────────

  const handleCreateAcl = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!aclTable || !aclOperation || !aclRoleId) return;
      try {
        const res = await secureFetch('/api/admin/acls', {
          method: 'POST',
          body: JSON.stringify({
            table: aclTable,
            operation: aclOperation,
            roleId: aclRoleId,
            description: aclDescription,
          }),
        });
        if (res.ok) {
          const roleName = roles.find((r) => r.id === aclRoleId)?.name ?? 'Role';
          showSuccess(`ACL created: ${aclTable}.${aclOperation} for ${roleName}`);
          setAclTable('');
          setAclOperation('');
          setAclRoleId('');
          setAclDescription('');
          fetchData();
        } else {
          const d = await res.json();
          showError(d.error);
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to create ACL');
      }
    },
    [aclTable, aclOperation, aclRoleId, aclDescription, roles, showSuccess, showError, fetchData],
  );

  // -----------------------------------------------------------------------
  // Filter header factory (memoised)
  // -----------------------------------------------------------------------

  const renderFilterHeader = useCallback(
    (label: string, field: string) => (
      <FilterableTh
        label={label}
        field={field}
        filters={filters}
        showFilterInput={showFilterInput}
        onToggleFilter={toggleFilter}
        onFilterChange={updateFilter}
      />
    ),
    [filters, showFilterInput, toggleFilter, updateFilter],
  );

  // -----------------------------------------------------------------------
  // Render helpers for each tab (extracted so JSX stays flat)
  // -----------------------------------------------------------------------

  const rolesTab = useMemo(
    () => (
      <div className="admin-panel">
        <h3>System Roles</h3>
        <p className="panel-subtitle">
          Define roles that can be assigned to users or inherited through groups.
        </p>

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
                  .filter(
                    (r) =>
                      matchesFilter(r.name, filters.role_name) &&
                      matchesFilter(r.description, filters.role_desc),
                  )
                  .map((r) => (
                    <tr key={r.id}>
                      <td className="font-bold">{r.name}</td>
                      <td>{r.description}</td>
                      <td>
                        <span className="sys-id-tag">{r.id.slice(0, 8)}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        <form className="admin-form" onSubmit={handleCreateRole}>
          <h4>Create New Role</h4>
          <input
            placeholder="Role Name (e.g. event_manager)"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            required
          />
          <input
            placeholder="Description"
            value={newRoleDesc}
            onChange={(e) => setNewRoleDesc(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">
            <Plus size={16} /> Add Role
          </button>
        </form>
      </div>
    ),
    [roles, filters, renderFilterHeader, newRoleName, newRoleDesc, handleCreateRole],
  );

  const groupsTab = useMemo(
    () => (
      <div className="admin-panel">
        <h3>Groups</h3>
        <p className="panel-subtitle">
          Groups organise users and inherit roles. Adding a user to a group
          grants them all roles assigned to that group.
        </p>

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
                  .filter(
                    (g) =>
                      matchesFilter(g.name, filters.group_name) &&
                      matchesFilter(g.description, filters.group_desc) &&
                      matchesFilter(g.category, filters.group_cat),
                  )
                  .map((g) => (
                    <tr key={g.id}>
                      <td className="font-bold">{g.name}</td>
                      <td>{g.description}</td>
                      <td>
                        <span className="category-badge">{g.category}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        <form className="admin-form" onSubmit={handleCreateGroup}>
          <h4>Create New Group</h4>
          <input
            placeholder="Group Name (e.g. Activity Admins)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            required
          />
          <input
            placeholder="Description"
            value={newGroupDesc}
            onChange={(e) => setNewGroupDesc(e.target.value)}
            required
          />
          <select
            value={newGroupCategory}
            onChange={(e) => setNewGroupCategory(e.target.value)}
            required
          >
            <option value="">Select Category...</option>
            {GROUPS_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary">
            <Plus size={16} /> Add Group
          </button>
        </form>
      </div>
    ),
    [groups, filters, renderFilterHeader, newGroupName, newGroupDesc, newGroupCategory, handleCreateGroup],
  );

  const groupMembersTab = useMemo(
    () => (
      <div className="admin-panel">
        <h3>Group Members</h3>
        <p className="panel-subtitle">
          Manage which users belong to which groups. Adding a user to a group
          automatically inherits all roles assigned to that group.
        </p>

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
                  .filter(
                    (gm) =>
                      (matchesFilter(gm.user.name, filters.gm_user) ||
                        matchesFilter(gm.user.username, filters.gm_user)) &&
                      matchesFilter(gm.group.name, filters.gm_group),
                  )
                  .map((gm) => (
                    <tr key={gm.id}>
                      <td>
                        <div className="item-info">
                          <strong>{gm.user.name}</strong>
                          <span>{gm.user.username}</span>
                        </div>
                      </td>
                      <td>
                        <span className="font-bold">{gm.group.name}</span>
                      </td>
                      <td>
                        <button
                          className="btn-icon-danger"
                          onClick={() =>
                            requestRemoveMember(gm.id, gm.user.name, gm.group.name)
                          }
                          title="Remove from group"
                        >
                          <Trash size={16} />
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
          <select
            value={memberUser}
            onChange={(e) => setMemberUser(e.target.value)}
            required
          >
            <option value="">Select User...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.username})
              </option>
            ))}
          </select>
          <select
            value={memberGroup}
            onChange={(e) => setMemberGroup(e.target.value)}
            required
          >
            <option value="">Select Group...</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — {g.category}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary">
            <UserPlus size={16} /> Add to Group
          </button>
        </form>
      </div>
    ),
    [
      groupMembers,
      filters,
      renderFilterHeader,
      users,
      groups,
      memberUser,
      memberGroup,
      handleAddMember,
      requestRemoveMember,
    ],
  );

  const groupRolesTab = useMemo(
    () => (
      <div className="admin-panel">
        <h3>Group → Role Assignments</h3>
        <p className="panel-subtitle">
          Assign roles to groups. All members of the group will automatically
          inherit these roles.
        </p>

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
                  .filter(
                    (gr) =>
                      matchesFilter(gr.group.name, filters.gr_group) &&
                      matchesFilter(gr.role.name, filters.gr_role),
                  )
                  .map((gr) => (
                    <tr key={gr.id}>
                      <td className="font-bold">{gr.group.name}</td>
                      <td>
                        <span className="role-badge">{gr.role.name}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        <form className="admin-form" onSubmit={handleAssignGroupRole}>
          <h4>Assign Role to Group</h4>
          <select
            value={grGroupId}
            onChange={(e) => setGrGroupId(e.target.value)}
            required
          >
            <option value="">Select Group...</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <select
            value={grRoleId}
            onChange={(e) => setGrRoleId(e.target.value)}
            required
          >
            <option value="">Select Role...</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary">
            <Link size={16} /> Assign Role to Group
          </button>
        </form>
      </div>
    ),
    [groupRoles, filters, renderFilterHeader, groups, roles, grGroupId, grRoleId, handleAssignGroupRole],
  );

  const userRolesTab = useMemo(
    () => (
      <div className="admin-panel">
        <h3>User → Role Assignments</h3>
        <p className="panel-subtitle">
          Directly assign roles to individual users. Roles inherited from groups
          are managed automatically.
        </p>

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
                  .filter(
                    (ur) =>
                      (matchesFilter(ur.user.name, filters.ur_user) ||
                        matchesFilter(ur.user.username, filters.ur_user)) &&
                      matchesFilter(ur.role.name, filters.ur_role),
                  )
                  .map((ur) => (
                    <tr key={ur.id}>
                      <td>
                        <div className="item-info">
                          <strong>{ur.user.name}</strong>
                          <span>{ur.user.username}</span>
                        </div>
                      </td>
                      <td>
                        <span className="role-badge">{ur.role.name}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        <form className="admin-form" onSubmit={handleAssignRole}>
          <h4>Assign Role to User</h4>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            required
          >
            <option value="">Select User...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.username})
              </option>
            ))}
          </select>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            required
          >
            <option value="">Select Role...</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary">
            <Target size={16} /> Assign Role
          </button>
        </form>
      </div>
    ),
    [userRoles, filters, renderFilterHeader, users, roles, selectedUser, selectedRole, handleAssignRole],
  );

  const aclsTab = useMemo(
    () => (
      <div className="admin-panel">
        <h3>Access Control Lists</h3>
        <p className="panel-subtitle">
          Define table-level permissions for roles (e.g., who can read/write
          activities).
        </p>

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
                  .filter(
                    (acl) =>
                      matchesFilter(acl.table, filters.acl_table) &&
                      matchesFilter(acl.operation, filters.acl_op) &&
                      matchesFilter(acl.role.name, filters.acl_role) &&
                      matchesFilter(acl.description, filters.acl_desc),
                  )
                  .map((acl) => (
                    <tr key={acl.id}>
                      <td className="font-bold text-uppercase">{acl.table}</td>
                      <td>
                        <span className="operation-badge">{acl.operation}</span>
                      </td>
                      <td>
                        <span className="role-badge">{acl.role.name}</span>
                      </td>
                      <td className="text-small">{acl.description}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        <form className="admin-form" onSubmit={handleCreateAcl}>
          <h4>Create New ACL</h4>
          <select
            value={aclTable}
            onChange={(e) => setAclTable(e.target.value)}
            required
          >
            <option value="">Select Table...</option>
            {ACL_TABLES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={aclOperation}
            onChange={(e) => setAclOperation(e.target.value)}
            required
          >
            <option value="">Select Operation...</option>
            {ACL_OPERATIONS.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
          <select
            value={aclRoleId}
            onChange={(e) => setAclRoleId(e.target.value)}
            required
          >
            <option value="">Select Role...</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Description (optional)"
            value={aclDescription}
            onChange={(e) => setAclDescription(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            <Plus size={16} /> Add ACL
          </button>
        </form>
      </div>
    ),
    [acls, filters, renderFilterHeader, roles, aclTable, aclOperation, aclRoleId, aclDescription, handleCreateAcl],
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'roles':
        return rolesTab;
      case 'groups':
        return groupsTab;
      case 'group-members':
        return groupMembersTab;
      case 'group-roles':
        return groupRolesTab;
      case 'user-roles':
        return userRolesTab;
      case 'acls':
        return aclsTab;
      default:
        return null;
    }
  }, [activeTab, rolesTab, groupsTab, groupMembersTab, groupRolesTab, userRolesTab, aclsTab]);

  return (
    <div className="admin-dashboard fade-in">
      <div className="admin-nav">
        <button
          className={activeTab === 'roles' ? 'active' : ''}
          onClick={() => handleTabChange('roles')}
        >
          <Shield size={16} /> Roles
        </button>
        <button
          className={activeTab === 'groups' ? 'active' : ''}
          onClick={() => handleTabChange('groups')}
        >
          <Layers size={16} /> Groups
        </button>
        <button
          className={activeTab === 'group-members' ? 'active' : ''}
          onClick={() => handleTabChange('group-members')}
        >
          <UserPlus size={16} /> Group Members
        </button>
        <button
          className={activeTab === 'group-roles' ? 'active' : ''}
          onClick={() => handleTabChange('group-roles')}
        >
          <Link size={16} /> Group Roles
        </button>
        <button
          className={activeTab === 'acls' ? 'active' : ''}
          onClick={() => handleTabChange('acls')}
        >
          <Key size={16} /> ACLs
        </button>
      </div>

      <SuccessBanner message={success} />
      <ErrorBannerInline message={error} />

      <div className="admin-content">{tabContent}</div>

      {/* ---------- Confirmation dialog (replaces confirm() ) ---------- */}
      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '400px', padding: '24px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ marginBottom: '20px', fontWeight: 500 }}>{confirmMessage}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn-secondary"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  confirmAction();
                  setConfirmAction(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}