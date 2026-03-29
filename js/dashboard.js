// ============================================
//  Dashboard Logic
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  setupDashboard();
});

function setupDashboard() {
  const now = new Date();
  const el = document.getElementById('dashboardDate');
  if (el) el.textContent = now.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  loadStats();
  loadRevenueChart();
  loadStatusChart();
  loadRecentInvoices();
  loadDashboardReminders();
  loadStockOverview();

  const rc = document.getElementById('reminderCount');
  const sc = document.getElementById('sidebarReminderCount');
  const count = getReminders().filter(r => !r.done).length;
  if (rc) { rc.textContent = count; rc.style.display = count > 0 ? '' : 'none'; }
  if (sc) { sc.textContent = count; sc.style.display = count > 0 ? '' : 'none'; }
}

function loadStats() {
  const invoices = getInvoices();
  const customers = getCustomers();
  const totalRev = invoices.filter(i => i.status === 'paid').reduce((s,i) => s+i.total, 0);
  const pending = invoices.filter(i => i.status !== 'paid').reduce((s,i) => s+i.total, 0);

  const rv = document.getElementById('statRevenue');
  const iv = document.getElementById('statInvoices');
  const cv = document.getElementById('statCustomers');
  const pv = document.getElementById('statPending');
  if (rv) rv.textContent = formatCurrency(totalRev);
  if (iv) animateNum(iv, invoices.length);
  if (cv) animateNum(cv, customers.length);
  if (pv) pv.textContent = formatCurrency(pending);
}

function animateNum(el, target) {
  let n = 0; const step = target / 30;
  const t = setInterval(() => { n += step; if (n >= target) { n = target; clearInterval(t); } el.textContent = Math.floor(n); }, 30);
}

function loadRevenueChart() {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const tc = isDark ? '#9AA0B0' : '#666';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const data = [12400, 18200, 15600, 22100, 19800, 24500, 21300, 28600, 25100, 31200, 27800, 35000];
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Revenue (₹)',
        data: data,
        borderColor: '#C8860A',
        backgroundColor: 'rgba(200,134,10,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#C8860A',
        pointRadius: 4,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: isDark ? '#2A2F40' : '#F0EDE4' }, ticks: { color: tc, font: { size: 11 } } },
        y: { grid: { color: isDark ? '#2A2F40' : '#F0EDE4' }, ticks: { color: tc, font: { size: 11 }, callback: v => '₹' + (v/1000).toFixed(0) + 'k' } }
      }
    }
  });
}

function loadStatusChart() {
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;
  const invoices = getInvoices();
  const paid = invoices.filter(i => i.status === 'paid').length;
  const pending = invoices.filter(i => i.status === 'pending').length;
  const overdue = invoices.filter(i => i.status === 'overdue').length;
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Paid','Pending','Overdue'],
      datasets: [{ data: [paid,pending,overdue], backgroundColor: ['#10B981','#F59E0B','#EF4444'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: { responsive: true, plugins: { legend: { display: false } }, cutout: '70%' }
  });
  const legend = document.getElementById('statusLegend');
  if (legend) {
    legend.innerHTML = [
      { label:'Paid', count:paid, color:'#10B981' },
      { label:'Pending', count:pending, color:'#F59E0B' },
      { label:'Overdue', count:overdue, color:'#EF4444' }
    ].map(l => `
      <div class="d-flex align-items-center justify-content-between mb-2">
        <div class="d-flex align-items-center gap-2">
          <div style="width:10px;height:10px;border-radius:50%;background:${l.color}"></div>
          <span style="font-size:0.85rem;color:var(--text-muted)">${l.label}</span>
        </div>
        <strong style="font-size:0.85rem">${l.count}</strong>
      </div>
    `).join('');
  }
}

function loadRecentInvoices() {
  const tb = document.getElementById('recentInvoicesTable');
  if (!tb) return;
  const invoices = getInvoices().slice(-5).reverse();
  tb.innerHTML = invoices.map(inv => `
    <tr onclick="window.location='invoice-history.html'" style="cursor:pointer">
      <td><strong>${inv.id}</strong><br><small style="color:var(--text-muted)">${formatDate(inv.date)}</small></td>
      <td>${inv.customer}</td>
      <td><strong>${formatCurrency(inv.total)}</strong></td>
      <td><span class="status-badge status-${inv.status}">${inv.status}</span></td>
    </tr>
  `).join('');
}

function loadDashboardReminders() {
  const el = document.getElementById('dashboardReminders');
  if (!el) return;
  const reminders = getReminders().filter(r => !r.done).slice(0, 4);
  if (reminders.length === 0) { el.innerHTML = '<div class="empty-state"><i class="fas fa-bell-slash"></i><p>No reminders</p></div>'; return; }
  const icons = { payment:'fa-rupee-sign', delivery:'fa-truck', stock:'fa-boxes', customer:'fa-user', admin:'fa-cog' };
  el.innerHTML = reminders.map(r => `
    <div class="reminder-card rem-${r.priority}" style="margin-bottom:10px;padding:14px">
      <div class="reminder-icon"><i class="fas ${icons[r.type]||'fa-bell'}"></i></div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:0.88rem;color:var(--text)">${r.title}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">${formatDate(r.date)}</div>
      </div>
    </div>
  `).join('');
}

function loadStockOverview() {
  const el = document.getElementById('stockOverview');
  if (!el) return;
  const products = getProducts();
  el.innerHTML = products.map(p => {
    const pct = Math.round((p.stock / 50) * 100);
    const color = pct > 60 ? '#10B981' : pct > 30 ? '#F59E0B' : '#EF4444';
    return `
      <div class="col-sm-6 col-md-4 col-lg-3">
        <div style="background:var(--bg2);border-radius:var(--radius-sm);padding:14px">
          <div style="font-weight:600;font-size:0.85rem;color:var(--text);margin-bottom:4px">${p.name}</div>
          <div style="font-size:0.78rem;color:var(--text-muted)">Stock: <strong style="color:var(--text)">${p.stock} units</strong></div>
          <div class="stock-bar mt-2"><div class="stock-fill" style="width:${pct}%;background:${color}"></div></div>
        </div>
      </div>
    `;
  }).join('');
}

function exportReport() {
  const invoices = getInvoices();
  const s = getSettings();
  let csv = 'Invoice ID,Customer,Date,Status,Total\n';
  invoices.forEach(i => { csv += `${i.id},${i.customer},${i.date},${i.status},${i.total}\n`; });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${s.businessName}_Report.csv`; a.click();
  showToast('Report exported successfully!', 'success');
}
window.exportReport = exportReport;
