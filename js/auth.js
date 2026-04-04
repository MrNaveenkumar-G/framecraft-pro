// ============================================
//  FrameCraft Pro - Auth System (auth.js)
// ============================================

// ---- Default Users ----
const DEFAULT_USERS = [
  { id: 1, username: 'admin', password: 'admin123', name: 'Admin User', role: 'admin', active: true, createdAt: '2025-01-01' },
  { id: 2, username: 'staff', password: 'staff123', name: 'Staff Member', role: 'staff', active: true, createdAt: '2025-01-01' }
];

// ---- Role Permissions ----
const ROLE_PERMISSIONS = {
  admin: {
    label: 'Admin',
    icon: 'fa-user-shield',
    color: '#C8860A',
    pages: ['dashboard', 'invoice', 'invoice-history', 'customers', 'products', 'reminders', 'settings', 'about', 'contact', 'index', 'user-management'],
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canPrint: true,
    canExport: true,
    canManageUsers: true,
    canViewReports: true,
    canManageSettings: true
  },
  staff: {
    label: 'Staff',
    icon: 'fa-user-tie',
    color: '#2563EB',
    pages: ['dashboard', 'invoice', 'invoice-history', 'customers', 'products', 'reminders', 'about', 'contact', 'index'],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canPrint: true,
    canExport: false,
    canManageUsers: false,
    canViewReports: true,
    canManageSettings: false
  },
  customer: {
    label: 'Customer',
    icon: 'fa-user',
    color: '#059669',
    pages: ['customer-shop', 'about', 'contact'],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canPrint: false,
    canExport: false,
    canManageUsers: false,
    canViewReports: false,
    canManageSettings: false
  }
};

// ============================================
//  User Management
// ============================================
function getUsers() {
  try { return JSON.parse(localStorage.getItem('fc_users') || 'null') || DEFAULT_USERS; }
  catch(e) { return DEFAULT_USERS; }
}
function saveUsers(users) { localStorage.setItem('fc_users', JSON.stringify(users)); }

// ============================================
//  Session Management
// ============================================
function getSession() {
  try { return JSON.parse(sessionStorage.getItem('fc_session') || 'null'); }
  catch(e) { return null; }
}
function setSession(data) { sessionStorage.setItem('fc_session', JSON.stringify(data)); }
function clearSession() { sessionStorage.removeItem('fc_session'); }

function logout() {
  clearSession();
  window.location.href = 'login.html';
}

// ============================================
//  Permission Checks
// ============================================
function hasPermission(permission) {
  const session = getSession();
  if (!session) return false;
  const perms = ROLE_PERMISSIONS[session.role];
  return perms ? !!perms[permission] : false;
}

function canAccessPage(pageName) {
  const session = getSession();
  if (!session) return false;
  const perms = ROLE_PERMISSIONS[session.role];
  return perms ? perms.pages.includes(pageName) : false;
}

// ============================================
//  Auth Guard - Call on every protected page
// ============================================
function requireAuth(allowedRoles) {
  const session = getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    if (session.role === 'customer') window.location.href = 'customer-shop.html';
    else window.location.href = 'dashboard.html';
    return null;
  }
  return session;
}

// ============================================
//  Navbar Setup with Auth
// ============================================
function setupAuthNavbar() {
  const session = getSession();
  if (!session) return;

  const navName = document.getElementById('navUserName');
  const navAvatar = document.getElementById('navAvatar');
  const navRoleBadge = document.getElementById('navRoleBadge');
  const s = getSettings();
  const perm = ROLE_PERMISSIONS[session.role];

  if (navName) navName.textContent = session.name || 'User';
  if (navAvatar && s.avatar) { navAvatar.src = s.avatar; navAvatar.style.display = 'block'; }
  if (navRoleBadge) {
    navRoleBadge.textContent = perm?.label || session.role;
    navRoleBadge.style.background = (perm?.color || '#ccc') + '20';
    navRoleBadge.style.color = perm?.color || '#ccc';
  }

  // Hide settings link for non-admin
  const settingsLinks = document.querySelectorAll('.nav-settings-link, .sidebar-settings');
  settingsLinks.forEach(el => {
    if (session.role !== 'admin') el.style.display = 'none';
  });

  // Hide delete buttons for staff
  if (session.role === 'staff') {
    document.querySelectorAll('.btn-delete, [data-requires="admin"]').forEach(el => el.style.display = 'none');
  }

  // Hide export for non-admin
  if (!hasPermission('canExport')) {
    document.querySelectorAll('[data-requires-export]').forEach(el => el.style.display = 'none');
  }
}

// ============================================
//  Sidebar Menu — role-based show/hide
// ============================================
function setupSidebarByRole() {
  const session = getSession();
  if (!session) return;

  // Settings menu — admin only
  const settingsMenu = document.querySelector('.sidebar-settings');
  if (settingsMenu && session.role !== 'admin') settingsMenu.style.display = 'none';

  // User management — admin only
  const userMgmt = document.querySelector('.sidebar-users');
  if (userMgmt && session.role !== 'admin') userMgmt.style.display = 'none';

  // Reminder count badge
  const rc = document.getElementById('reminderCount');
  const sc = document.getElementById('sidebarReminderCount');
  const count = getReminders().filter(r => !r.done).length;
  if (rc) { rc.textContent = count; rc.style.display = count > 0 ? '' : 'none'; }
  if (sc) { sc.textContent = count; sc.style.display = count > 0 ? '' : 'none'; }
}

// ============================================
//  Expose globals
// ============================================
window.getUsers = getUsers;
window.saveUsers = saveUsers;
window.getSession = getSession;
window.setSession = setSession;
window.clearSession = clearSession;
window.logout = logout;
window.hasPermission = hasPermission;
window.canAccessPage = canAccessPage;
window.requireAuth = requireAuth;
window.setupAuthNavbar = setupAuthNavbar;
window.setupSidebarByRole = setupSidebarByRole;
window.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
