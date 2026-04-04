// ============================================
//  FrameCraft Pro - Core App Logic (app.js)
// ============================================

// ---- Default Data ----
const DEFAULT_SETTINGS = {
  businessName: "FrameCraft Pro",
  ownerName: "Shop Owner",
  phone: "+91 98765 43210",
  email: "hello@framecraft.com",
  address: "Coimbatore, Tamil Nadu",
  gst: "33AAAAA0000A1Z5",
  theme: "light",
  primaryColor: "#C8860A",
  currency: "₹",
  avatar: "",
  logoText: "FC"
};

const SAMPLE_PRODUCTS = [
  { id: 1, name: "Classic Wood Frame", size: "4x6 inch", price: 150, category: "wood", color: "#8B5E3C", stock: 45, icon: "fas fa-border-all", gradient: "linear-gradient(135deg,#8B5E3C,#D4A05A)" },
  { id: 2, name: "Premium Metal Frame", size: "5x7 inch", price: 280, category: "metal", color: "#6B7280", stock: 30, icon: "fas fa-square", gradient: "linear-gradient(135deg,#4B5563,#9CA3AF)" },
  { id: 3, name: "Wedding Collection", size: "8x10 inch", price: 650, category: "premium", color: "#B45309", stock: 20, icon: "fas fa-heart", gradient: "linear-gradient(135deg,#C8860A,#F59E0B)" },
  { id: 4, name: "Baby Moments Frame", size: "4x4 inch", price: 200, category: "kids", color: "#DB2777", stock: 35, icon: "fas fa-baby", gradient: "linear-gradient(135deg,#DB2777,#F9A8D4)" },
  { id: 5, name: "Collage Frame 3-in-1", size: "10x12 inch", price: 450, category: "collage", color: "#2563EB", stock: 25, icon: "fas fa-th", gradient: "linear-gradient(135deg,#2563EB,#60A5FA)" },
  { id: 6, name: "A4 Certificate Frame", size: "A4", price: 180, category: "wood", color: "#059669", stock: 40, icon: "fas fa-certificate", gradient: "linear-gradient(135deg,#059669,#34D399)" },
  { id: 7, name: "Floating Glass Frame", size: "6x8 inch", price: 380, category: "glass", color: "#0891B2", stock: 15, icon: "fas fa-images", gradient: "linear-gradient(135deg,#0891B2,#67E8F9)" },
  { id: 8, name: "Rustic Vintage Frame", size: "5x5 inch", price: 320, category: "premium", color: "#92400E", stock: 18, icon: "fas fa-leaf", gradient: "linear-gradient(135deg,#92400E,#D97706)" }
];

const SAMPLE_INVOICES = [
  { id: "INV-001", customer: "Priya Rajan", phone: "9876543210", date: "2025-01-05", dueDate: "2025-01-12", status: "paid", items: [{name:"Classic Wood Frame 4x6",qty:2,price:150},{name:"Baby Moments Frame",qty:1,price:200}], total: 500 },
  { id: "INV-002", customer: "Mahesh Kumar", phone: "9988776655", date: "2025-01-08", dueDate: "2025-01-15", status: "pending", items: [{name:"Wedding Collection 8x10",qty:3,price:650}], total: 1950 },
  { id: "INV-003", customer: "Sathya Vel", phone: "9123456789", date: "2025-01-01", dueDate: "2025-01-08", status: "overdue", items: [{name:"Floating Glass Frame",qty:2,price:380}], total: 760 },
  { id: "INV-004", customer: "Anitha Devi", phone: "9876501234", date: "2025-01-10", dueDate: "2025-01-17", status: "paid", items: [{name:"Collage Frame 3-in-1",qty:1,price:450},{name:"A4 Certificate Frame",qty:2,price:180}], total: 810 },
  { id: "INV-005", customer: "Ravi Chandran", phone: "9001234567", date: "2025-01-12", dueDate: "2025-01-19", status: "pending", items: [{name:"Premium Metal Frame",qty:4,price:280}], total: 1120 }
];

const SAMPLE_CUSTOMERS = [
  { id: 1, name: "Priya Rajan", phone: "9876543210", email: "priya@email.com", city: "Chennai", totalOrders: 5, totalSpent: 2400 },
  { id: 2, name: "Mahesh Kumar", phone: "9988776655", email: "mahesh@email.com", city: "Coimbatore", totalOrders: 3, totalSpent: 3200 },
  { id: 3, name: "Sathya Vel", phone: "9123456789", email: "sathya@email.com", city: "Erode", totalOrders: 7, totalSpent: 4100 },
  { id: 4, name: "Anitha Devi", phone: "9876501234", email: "anitha@email.com", city: "Salem", totalOrders: 2, totalSpent: 1600 },
  { id: 5, name: "Ravi Chandran", phone: "9001234567", email: "ravi@email.com", city: "Trichy", totalOrders: 4, totalSpent: 2800 }
];

const SAMPLE_REMINDERS = [
  { id: 1, title: "Follow up with Mahesh - INV-002", type: "payment", date: "2025-01-15", priority: "urgent", done: false, note: "₹1,950 pending payment" },
  { id: 2, title: "Deliver Wedding Frames to Sathya", type: "delivery", date: "2025-01-16", priority: "today", done: false, note: "3 units, address: Erode" },
  { id: 3, title: "Order Wood Stock from Supplier", type: "stock", date: "2025-01-20", priority: "upcoming", done: false, note: "4x6 Classic frames running low" },
  { id: 4, title: "Call Priya about bulk order", type: "customer", date: "2025-01-18", priority: "upcoming", done: false, note: "Interested in 20+ frames for office" },
  { id: 5, title: "Renew Business License", type: "admin", date: "2025-02-01", priority: "upcoming", done: false, note: "Due before Feb 1" }
];

// ============================================
//  Storage Helpers
// ============================================
function getSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('fc_settings') || '{}') }; } catch(e) { return DEFAULT_SETTINGS; }
}
function saveSettings(s) { localStorage.setItem('fc_settings', JSON.stringify(s)); }
function getProducts() {
  try { return JSON.parse(localStorage.getItem('fc_products') || 'null') || SAMPLE_PRODUCTS; } catch(e) { return SAMPLE_PRODUCTS; }
}
function saveProducts(p) { localStorage.setItem('fc_products', JSON.stringify(p)); }
function getInvoices() {
  try { return JSON.parse(localStorage.getItem('fc_invoices') || 'null') || SAMPLE_INVOICES; } catch(e) { return SAMPLE_INVOICES; }
}
function saveInvoices(inv) { localStorage.setItem('fc_invoices', JSON.stringify(inv)); }
function getCustomers() {
  try { return JSON.parse(localStorage.getItem('fc_customers') || 'null') || SAMPLE_CUSTOMERS; } catch(e) { return SAMPLE_CUSTOMERS; }
}
function saveCustomers(c) { localStorage.setItem('fc_customers', JSON.stringify(c)); }
function getReminders() {
  try { return JSON.parse(localStorage.getItem('fc_reminders') || 'null') || SAMPLE_REMINDERS; } catch(e) { return SAMPLE_REMINDERS; }
}
function saveReminders(r) { localStorage.setItem('fc_reminders', JSON.stringify(r)); }

// ============================================
//  Theme Management
// ============================================
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('themeIcon');
  if (icon) { icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'; }
}
function toggleTheme() {
  const s = getSettings();
  s.theme = s.theme === 'dark' ? 'light' : 'dark';
  saveSettings(s);
  applyTheme(s.theme);
}
function applyPrimaryColor(color) {
  document.documentElement.style.setProperty('--primary', color);
  const hex = color;
  const lighten = lightenColor(hex, 20);
  const darken = lightenColor(hex, -20);
  document.documentElement.style.setProperty('--primary-light', lighten);
  document.documentElement.style.setProperty('--primary-dark', darken);
}
function lightenColor(hex, amount) {
  let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  r = Math.min(255,Math.max(0,r+amount)); g = Math.min(255,Math.max(0,g+amount)); b = Math.min(255,Math.max(0,b+amount));
  return '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

// ============================================
//  Navbar Setup
// ============================================
function setupNavbar() {
  const s = getSettings();
  const navName = document.getElementById('navUserName');
  if (navName) navName.textContent = s.ownerName || 'User';
  const navAvatar = document.getElementById('navAvatar');
  if (navAvatar) {
    if (s.avatar) { navAvatar.src = s.avatar; navAvatar.style.display='block'; }
    else { navAvatar.style.display='none'; navAvatar.src=''; }
  }
  const navBrand = document.querySelector('.brand-text');
  if (navBrand) navBrand.innerHTML = s.businessName ? `<strong>${s.businessName.split(' ')[0]}</strong>${s.businessName.split(' ').slice(1).join(' ')}` : 'Frame<strong>Craft</strong>';
  // Footer contact
  const fa = document.getElementById('footerAddress');
  const fp = document.getElementById('footerPhone');
  const fe = document.getElementById('footerEmail');
  if (fa) fa.textContent = s.address;
  if (fp) fp.textContent = s.phone;
  if (fe) fe.textContent = s.email;
  // Reminder badge
  const badge = document.getElementById('reminderBadge');
  if (badge) {
    const rems = getReminders().filter(r => !r.done).length;
    badge.textContent = rems;
    badge.style.display = rems > 0 ? 'flex' : 'none';
  }
}

// ============================================
//  Utility Functions
// ============================================
function formatCurrency(amount) {
  const s = getSettings();
  return s.currency + ' ' + parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function generateInvoiceId() {
  const invoices = getInvoices();
  const last = invoices.length > 0 ? parseInt(invoices[invoices.length-1].id.replace('INV-','')) : 0;
  return 'INV-' + String(last+1).padStart(3,'0');
}
function showToast(msg, type='success') {
  const container = document.querySelector('.toast-container') || (() => {
    const el = document.createElement('div'); el.className = 'toast-container'; document.body.appendChild(el); return el;
  })();
  const toast = document.createElement('div');
  toast.className = 'custom-toast';
  const colors = { success:'#10B981', error:'#EF4444', warning:'#F59E0B', info:'#3B82F6' };
  toast.style.borderLeftColor = colors[type] || colors.success;
  toast.innerHTML = `<div style="display:flex;align-items:center;gap:10px"><i class="fas ${type==='success'?'fa-check-circle':type==='error'?'fa-times-circle':type==='warning'?'fa-exclamation-triangle':'fa-info-circle'}" style="color:${colors[type]||colors.success}"></i><span style="font-size:0.9rem;font-weight:500;color:var(--text)">${msg}</span></div>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'slideInRight 0.3s ease reverse'; setTimeout(() => toast.remove(), 300); }, 3000);
}
function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0,2);
}

// ============================================
//  Init on Every Page
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const s = getSettings();
  applyTheme(s.theme);
  if (s.primaryColor) applyPrimaryColor(s.primaryColor);
  setupNavbar();
  // Page title
  if (s.businessName) document.title = document.title.replace('FrameCraft Pro', s.businessName);
});
window.toggleTheme = toggleTheme;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.showToast = showToast;
window.getSettings = getSettings;
window.saveSettings = saveSettings;
window.getProducts = getProducts;
window.saveProducts = saveProducts;
window.getInvoices = getInvoices;
window.saveInvoices = saveInvoices;
window.getCustomers = getCustomers;
window.saveCustomers = saveCustomers;
window.getReminders = getReminders;
window.saveReminders = saveReminders;
window.getInitials = getInitials;
window.generateInvoiceId = generateInvoiceId;

// ============================================
//  Mobile Sidebar Toggle
// ============================================
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar) return;
  sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('show');
}
function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
}
// Close sidebar on nav link click (mobile)
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sidebar-menu a').forEach(a => {
    a.addEventListener('click', () => {
      if (window.innerWidth < 992) closeSidebar();
    });
  });
});
window.toggleSidebar = toggleSidebar;
window.closeSidebar  = closeSidebar;
