'use client';

import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { secureFetch } from '@/lib/fetch';
import {
  Shield, Users, Target, Plus, Check, Layers, UserPlus, Trash, Link, Key, Filter, ChevronLeft, ChevronRight
} from '@/components/Icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Basic user record */
interface User {
  id: string;
  name: string;
  username: string;
  type?: string;
  email?: string;
}

/** System role definition */
interface Role {
  id: string;
  name: string;
  description: string;
}

/** User group definition */
interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
}

/** Maps a user to a role */
interface UserRole {
  id: string;
  user: User;
  role: Role;
}

/** Maps a user to a group */
interface GroupMember {
  id: string;
  user: User;
  group: Group;
}

/** Maps a group to a role */
interface GroupRole {
  id: string;
  group: Group;
  role: Role;
}

/** Activity participant record */
interface ParticipantRecord {
  id: string;
  user: User;
  activity: {
    id: string;
    name: string;
  };
  type: string;
  sys_created_at: string;
}

/** Access control list entry */
interface Acl {
  id: string;
  table: string;
  operation: string;
  role: Role;
  description: string | null;
}

/** Available admin tab identifiers */
type AdminTab = 'roles' | 'user-roles' | 'groups' | 'group-members' | 'group-roles' | 'acls' | 'participants';

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
const RECORDS_PER_PAGE = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns singular or plural form based on count */
function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/**
 * Case-insensitive substring match; handles null/undefined safely.
 * @param value - The string to search within
 * @param filter - The substring to search for
 * @returns True if the filter is found (or empty), false otherwise
 */
function matchesFilter(value: string | null | undefined, filter: string): boolean {
  if (!filter) return true;
  return (value ?? '').toLowerCase().includes(filter.toLowerCase());
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

/** Brief success notification banner */
function SuccessBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="success-banner">
      <Check size={16} /> {message}
    </div>
  );
}

/** Inline error text banner */
function ErrorBannerInline({ message }: { message: string }) {
  if (!message) return null;
  return <div className="error-banner">{message}</div>;
}

/**
 * Table header cell with an optional filter input toggle.
 * @param label - Column display name
 * @param field - Filter key identifier
 * @param filters - Current filter values map
 * @param showFilterInput - Which columns have their filter input visible
 * @param onToggleFilter - Toggles filter input visibility for a column
 * @param onFilterChange - Updates the filter value for a column
 */
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

/**
 * Administrator dashboard for managing roles, groups, permissions, and participants.
 * Provides tabbed navigation across CRUD interfaces with column-level filtering
 * and confirmation dialogs for destructive actions.
 * @param currentUser - The currently logged-in admin user
 */
export default function AdminDashboard({ currentUser }: { currentUser: User }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('roles');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilterInput, setShowFilterInput] = useState<Record<string, boolean>>({});

  // -- Data stores --
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupRoles, setGroupRoles] = useState<GroupRole[]>([]);
  const [acls, setAcls] = useState<Acl[]>([]);
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);

  // -- Form states --
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
  // Feedback helpers
  // -----------------------------------------------------------------------

  /** Show a green success banner that auto-dismisses after 3s */
  const showSuccess = useCallback((msg: string) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  }, []);

  /** Show a red error banner that auto-dismisses after 5s */
  const showError = useCallback((msg: string) => {
    setError(msg);
    setSuccess('');
    setTimeout(() => setError(''), 5000);
  }, []);

  // -----------------------------------------------------------------------
  // Filter helpers
  // -----------------------------------------------------------------------

  /** Toggle filter input visibility for a given column */
  const toggleFilter = useCallback((field: string) => {
    setShowFilterInput((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  /** Update the filter value and reset to page 1 */
  const updateFilter = useCallback((field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  }, []);

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  /** Fetches all admin data entities in parallel (users, roles, groups, memberships, ACLs, participants) */
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

      const pRes = await secureFetch('/api/admin/participants');
      if (pRes.ok) setParticipants(await pRes.json());
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

  /** Resets filters, filter visibility, and pagination to defaults */
  const handleTabChange = useCallback((tab: AdminTab) => {
    setActiveTab(tab);
    setFilters({});
    setShowFilterInput({});
    setCurrentPage(1);
  }, []);

  // ── CREATE ROLE ────────────────────────────────────────────────────────

  /** Submits a new system role via POST and refreshes the data */
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

  /** Submits a new group via POST and refreshes the data */
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

  /** Assigns a role to a user via POST and refreshes the data */
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

  /** Adds a user to a group via POST and refreshes the data */
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

  /** Stages a group member removal for confirmation; resets on dialog dismiss */
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

  /** Stages a participant removal for confirmation; resets on dialog dismiss */
  const requestRemoveParticipant = useCallback(
    (id: string, userName: string, activityName: string) => {
      setConfirmMessage(`Remove ${userName} from activity "${activityName}"?`);
      setConfirmAction(() => async () => {
        try {
          const res = await secureFetch(`/api/admin/participants?id=${id}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            showSuccess(`Removed ${userName} from "${activityName}"`);
            fetchData();
          } else {
            const d = await res.json();
            showError(d.error);
          }
        } catch (err) {
          showError(err instanceof Error ? err.message : 'Failed to remove participant');
        }
      });
    },
    [showSuccess, showError, fetchData],
  );

  // ── ASSIGN GROUP ROLE ─────────────────────────────────────────────────

  /** Assigns a role to a group via POST and refreshes the data */
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

  /** Creates a new ACL entry (table-operation-role mapping) via POST */
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

  /** Memoised helper to render a filterable table header cell */
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

  /** Pagination component for switching between pages of tabular data */
  const Pagination = useCallback(({ totalRecords }: { totalRecords: number }) => {
    const totalPages = Math.ceil(totalRecords / RECORDS_PER_PAGE);
    if (totalPages <= 1) return null;

    return (
      <div className="pagination fade-in">
        <button
          className="pagination-btn"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>

        <button
          className="pagination-btn"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }, [currentPage]);

  // -----------------------------------------------------------------------
  // Render helpers for each tab (extracted so JSX stays flat)
  // -----------------------------------------------------------------------

  /** Memoised tab: System Roles CRUD */
  const rolesTab = useMemo(
    () => (
      <div className="admin-panel">
        <h3>System Roles</h3>
        <p className="panel-subtitle">
          Define roles that can be assigned to users or inherited through groups.
        </p>
        {/* ... role table, filter, create form ... */}
      </div>
    ),
    [roles, filters, renderFilterHeader, newRoleName, newRoleDesc, handleCreateRole],
  );

  /** Memoised tab: Groups management */
  const groupsTab = useMemo(
    () => (
      <div className="admin-panel">
        <h3>Groups</h3>
        <p className="panel-subtitle">
          Groups organise users and inherit roles. Adding a user to a group
          grants them all roles assigned to that group.
        </p>
        {/* ... group table, filter, create form ... */}
      </div>
    ),
    [groups, filters, renderFilterHeader, newGroupName, newGroupDesc, newGroupCategory, handleCreateGroup],
  );

  /** Memoised tab: Group membership management */
  const groupMembersTab = useMemo(
    () => (
      <div className="admin-panel">
        <h3>Group Members</h3>
        <p className="panel-subtitle">
          Manage which users belong to which groups.
        </p>
        {/* ... group members table, add form ... */}
      </div>
    ),
    [groupMembers, filters, renderFilterHeader, users, groups, memberUser, memberGroup, handleAddMember, requestRemoveMember],
  );

  /** Memoised tab: Group-to-Role assignments */
  const groupRolesTab = useMemo(
    () => (
      <div className="admin-panel">
        <h3>Group → Role Assignments</h3>
        <p className="panel-subtitle">
          Assign roles to groups. All members of the group will automatically inherit these roles.
        </p>
        {/* ... group roles table, assign form ... */}
      </div>
    ),
    [groupRoles, filters, renderFilterHeader, groups, roles, grGroupId, grRoleId, handleAssignGroupRole],
  );

  /** Memoised tab: User-to-Role assignments */
  const userRolesTab = useMemo(
    () => (
      <div className="admin-panel">
        <h3>User → Role Assignments</h3>
        <p className="panel-subtitle">
          Directly assign roles to individual users. Roles inherited from groups
          are managed automatically.
        </p>
        {/* ... user roles table, assign form ... */}
      </div>
    ),
    [userRoles, filters, renderFilterHeader, users, roles, selectedUser, selectedRole, handleAssignRole],
  );

  /** Memoised tab: ACL management */
  const aclsTab = useMemo(
    () => (
      <div className="admin-panel">
        <h3>Access Control Lists</h3>
        <p className="panel-subtitle">
          Define table-level permissions for roles.
        </p>
        {/* ... ACL table, create form ... */}
      </div>
    ),
    [acls, filters, renderFilterHeader, roles, aclTable, aclOperation, aclRoleId, aclDescription, handleCreateAcl],
  );

  /** Memoised tab: Activity participant management */
  const participantsTab = useMemo(
    () => (
      <div className="admin-panel">
        <h3>Activity Participants</h3>
        <p className="panel-subtitle">
          View and manage all user associations with activities.
        </p>
        {/* ... participants table ... */}
      </div>
    ),
    [participants, filters, renderFilterHeader, currentPage, requestRemoveParticipant],
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  /** Map active tab key to its memoised JSX */
  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'roles': return rolesTab;
      case 'groups': return groupsTab;
      case 'group-members': return groupMembersTab;
      case 'group-roles': return groupRolesTab;
      case 'user-roles': return userRolesTab;
      case 'acls': return aclsTab;
      case 'participants': return participantsTab;
      default: return null;
    }
  }, [activeTab, rolesTab, groupsTab, groupMembersTab, groupRolesTab, userRolesTab, aclsTab, participantsTab]);

  return (
    <div className="admin-dashboard fade-in">
      <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
        Developer Panel
      </h2>
      <div className="admin-nav">
        {/* Tab navigation buttons ... */}
      </div>

      <SuccessBanner message={success} />
      <ErrorBannerInline message={error} />

      <div className="admin-content">{tabContent}</div>

      {/* ---------- Confirmation dialog (replaces confirm() ) ---------- */}
      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal-content" style={{ maxWidth: '400px', padding: '24px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <p style={{ marginBottom: '20px', fontWeight: 500 }}>{confirmMessage}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => { confirmAction(); setConfirmAction(null); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}