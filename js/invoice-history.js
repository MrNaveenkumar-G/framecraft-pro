// ============================================
//  Invoice History Logic
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  loadSummaryCards();
  filterInvoices();
});

function loadSummaryCards() {
  const invoices = getInvoices();
  const paid = invoices.filter(i => i.status === 'paid');
  const pending = invoices.filter(i => i.status === 'pending');
  const overdue = invoices.filter(i => i.status === 'overdue');
  const el = document.getElementById('summaryCards');
  if (!el) return;
  const cards = [
    { label:'Total Invoices', value: invoices.length, icon:'fa-file-invoice', color:'#3B82F6', sub: formatCurrency(invoices.reduce((s,i)=>s+i.total,0)) },
    { label:'Paid', value: paid.length, icon:'fa-check-circle', color:'#10B981', sub: formatCurrency(paid.reduce((s,i)=>s+i.total,0)) },
    { label:'Pending', value: pending.length, icon:'fa-clock', color:'#F59E0B', sub: formatCurrency(pending.reduce((s,i)=>s+i.total,0)) },
    { label:'Overdue', value: overdue.length, icon:'fa-exclamation-triangle', color:'#EF4444', sub: formatCurrency(overdue.reduce((s,i)=>s+i.total,0)) },
  ];
  el.innerHTML = cards.map(c => `
    <div class="col-6 col-md-3">
      <div class="stat-card">
        <div class="stat-card-icon" style="background:${c.color}20"><i class="fas ${c.icon}" style="color:${c.color}"></i></div>
        <div class="stat-card-body">
          <div class="label">${c.label}</div>
          <div class="value">${c.value}</div>
          <div class="change" style="color:${c.color}">${c.sub}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function filterInvoices() {
  const search = document.getElementById('searchInv')?.value.toLowerCase() || '';
  const status = document.getElementById('filterStatus')?.value || '';
  const from = document.getElementById('filterFrom')?.value || '';
  const to = document.getElementById('filterTo')?.value || '';

  let invoices = getInvoices().slice().reverse();

  if (search) invoices = invoices.filter(i => i.customer.toLowerCase().includes(search) || i.id.toLowerCase().includes(search) || (i.phone && i.phone.includes(search)));
  if (status) invoices = invoices.filter(i => i.status === status);
  if (from) invoices = invoices.filter(i => i.date >= from);
  if (to) invoices = invoices.filter(i => i.date <= to);

  renderTable(invoices);
}

function renderTable(invoices) {
  const tb = document.getElementById('historyTableBody');
  const empty = document.getElementById('emptyState');
  if (!tb) return;

  if (invoices.length === 0) {
    tb.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  tb.innerHTML = invoices.map(inv => `
    <tr>
      <td><strong>${inv.id}</strong></td>
      <td>
        <div style="font-weight:600">${inv.customer}</div>
        <div style="font-size:0.78rem;color:var(--text-muted)">${inv.phone || ''}</div>
      </td>
      <td>${formatDate(inv.date)}</td>
      <td>${formatDate(inv.dueDate)}</td>
      <td><span style="font-size:0.82rem;color:var(--text-muted)">${inv.items ? inv.items.length : 0} item(s)</span></td>
      <td><strong style="color:var(--primary)">${formatCurrency(inv.total)}</strong></td>
      <td>
        <select class="form-select form-select-sm" style="width:auto;font-size:0.78rem" onchange="updateStatus('${inv.id}',this.value)">
          <option value="paid" ${inv.status==='paid'?'selected':''}>Paid</option>
          <option value="pending" ${inv.status==='pending'?'selected':''}>Pending</option>
          <option value="overdue" ${inv.status==='overdue'?'selected':''}>Overdue</option>
        </select>
      </td>
      <td>
        <div class="d-flex gap-1">
          <button class="btn btn-sm" style="background:rgba(59,130,246,0.1);color:#3B82F6;border-radius:6px;padding:4px 8px" onclick="viewInvoice('${inv.id}')" title="View"><i class="fas fa-eye"></i></button>
          <button class="btn btn-sm" style="background:rgba(200,134,10,0.1);color:var(--primary);border-radius:6px;padding:4px 8px" onclick="printInvoice('${inv.id}')" title="Print"><i class="fas fa-print"></i></button>
          <button class="btn btn-sm" style="background:rgba(37,211,102,0.1);color:#25D366;border-radius:6px;padding:4px 8px" onclick="whatsappInvoice('${inv.id}')" title="WhatsApp"><i class="fab fa-whatsapp"></i></button>
          <button class="btn btn-sm" style="background:rgba(239,68,68,0.1);color:#EF4444;border-radius:6px;padding:4px 8px" onclick="deleteInvoice('${inv.id}')" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateStatus(id, newStatus) {
  const invoices = getInvoices();
  const inv = invoices.find(i => i.id === id);
  if (inv) { inv.status = newStatus; saveInvoices(invoices); showToast(`Status updated to ${newStatus}`, 'success'); loadSummaryCards(); }
}

function viewInvoice(id) {
  const inv = getInvoices().find(i => i.id === id);
  if (!inv) return;
  const s = getSettings();
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <div style="background:linear-gradient(135deg,var(--primary),var(--primary-light));color:white;border-radius:var(--radius);padding:20px;margin-bottom:20px;display:flex;justify-content:space-between">
      <div><div style="opacity:0.8;font-size:0.8rem">INVOICE</div><div style="font-size:1.5rem;font-weight:800">${inv.id}</div><div style="opacity:0.85;font-size:0.85rem">${s.businessName}</div></div>
      <div style="text-align:right"><span class="status-badge status-${inv.status}">${inv.status}</span><div style="margin-top:8px;font-size:0.82rem;opacity:0.85">Due: ${formatDate(inv.dueDate)}</div></div>
    </div>
    <div class="row g-3 mb-3">
      <div class="col-6"><div style="font-size:0.75rem;color:var(--text-muted)">CUSTOMER</div><div style="font-weight:700">${inv.customer}</div><div style="font-size:0.85rem;color:var(--text-muted)">${inv.phone || ''}</div></div>
      <div class="col-6 text-end"><div style="font-size:0.75rem;color:var(--text-muted)">DATE</div><div style="font-weight:600">${formatDate(inv.date)}</div><div style="font-size:0.85rem;color:var(--text-muted)">${inv.paymentMethod || 'Cash'}</div></div>
    </div>
    <table class="history-table w-100 mb-3">
      <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>${(inv.items||[]).map(item => `<tr><td>${item.name}<br><small style="color:var(--text-muted)">${item.size||''}</small></td><td>${item.qty}</td><td>${formatCurrency(item.price)}</td><td><strong>${formatCurrency(item.qty*item.price)}</strong></td></tr>`).join('')}</tbody>
    </table>
    <div class="invoice-totals">
      <div class="total-row"><span>Subtotal</span><span>${formatCurrency(inv.subtotal||inv.total)}</span></div>
      ${(inv.discount||0) > 0 ? `<div class="total-row"><span>Discount</span><span style="color:#10B981">- ${formatCurrency(inv.discount)}</span></div>` : ''}
      ${(inv.gst||0) > 0 ? `<div class="total-row"><span>GST</span><span>${formatCurrency(inv.gst)}</span></div>` : ''}
      <div class="total-row grand"><span>Total</span><span class="grand-amount">${formatCurrency(inv.total)}</span></div>
    </div>
    ${inv.notes ? `<div style="margin-top:16px;padding:12px;background:var(--bg2);border-radius:8px;font-size:0.85rem;color:var(--text-muted)">${inv.notes}</div>` : ''}
  `;
  document.getElementById('modalPrint').onclick = () => printInvoice(id);
  document.getElementById('modalWhatsApp').onclick = () => whatsappInvoice(id);
  new bootstrap.Modal(document.getElementById('invoiceModal')).show();
}

function printInvoice(id) {
  const inv = getInvoices().find(i => i.id === id);
  if (!inv) return;
  // Reuse invoice.js openPrintWindow by loading it inline
  const s = getSettings();
  const fmt = formatCurrency;
  const fd = formatDate;
  const html = `<!DOCTYPE html><html><head><title>${inv.id}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;color:#1A1A1A;padding:40px}.inv-header{background:linear-gradient(135deg,#C8860A,#E8A020);color:white;padding:28px;border-radius:12px;margin-bottom:24px;display:flex;justify-content:space-between}.inv-title{font-size:1.8rem;font-weight:800}table{width:100%;border-collapse:collapse;margin:16px 0}th{background:#F2EDE4;padding:10px 12px;text-align:left;font-size:0.78rem;font-weight:700;text-transform:uppercase}td{padding:10px 12px;border-bottom:1px solid #F2EDE4;font-size:0.88rem}.totals{float:right;width:260px;background:#F2EDE4;padding:16px;border-radius:10px}.tr{display:flex;justify-content:space-between;padding:4px 0;font-size:0.88rem}.grand{border-top:2px solid #ddd;margin-top:8px;padding-top:8px;font-weight:800;font-size:1rem;color:#C8860A}.footer{clear:both;margin-top:40px;text-align:center;font-size:0.78rem;color:#999;border-top:1px solid #eee;padding-top:16px}@media print{@page{margin:15mm}}</style></head><body>
  <div class="inv-header"><div><div style="opacity:0.8;font-size:0.78rem">INVOICE</div><div class="inv-title">${inv.id}</div><div style="opacity:0.85">${s.businessName}</div></div><div style="text-align:right"><div style="opacity:0.8;font-size:0.78rem">DATE / DUE</div><div style="font-weight:600">${fd(inv.date)} / ${fd(inv.dueDate)}</div><div style="margin-top:8px;font-weight:700;text-transform:uppercase">${inv.status}</div></div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
    <div><div style="font-size:0.72rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;margin-bottom:8px">BILL TO</div><div style="font-weight:700;font-size:1rem">${inv.customer}</div><div style="color:#666;font-size:0.85rem">${inv.phone||''}</div><div style="color:#666;font-size:0.85rem">${inv.address||''}</div></div>
    <div><div style="font-size:0.72rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;margin-bottom:8px">FROM</div><div style="font-weight:700;font-size:1rem">${s.businessName}</div><div style="color:#666;font-size:0.85rem">${s.phone}</div>${s.gst?`<div style="color:#666;font-size:0.85rem">GST: ${s.gst}</div>`:''}</div>
  </div>
  <table><thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${(inv.items||[]).map((it,i)=>`<tr><td>${i+1}</td><td><strong>${it.name}</strong>${it.size?`<br><small>${it.size}</small>`:''}</td><td>${it.qty}</td><td>${fmt(it.price)}</td><td><strong>${fmt(it.qty*it.price)}</strong></td></tr>`).join('')}</tbody></table>
  <div class="totals"><div class="tr"><span>Subtotal</span><span>${fmt(inv.subtotal||inv.total)}</span></div>${(inv.discount||0)>0?`<div class="tr"><span>Discount</span><span>- ${fmt(inv.discount)}</span></div>`:''}<div class="tr grand"><span>Total</span><span>${fmt(inv.total)}</span></div></div>
  ${inv.notes?`<div style="clear:both;margin-top:24px;padding:12px;background:#FAFAF8;border-radius:8px;font-size:0.82rem;color:#666">${inv.notes}</div>`:''}
  <div class="footer">${s.businessName} | ${s.phone} | ${s.email}<br>Thank you for your business!</div>
  <script>window.onload=()=>window.print()<\/script></body></html>`;
  const w = window.open('','_blank'); w.document.write(html); w.document.close();
}

function whatsappInvoice(id) {
  const inv = getInvoices().find(i => i.id === id);
  if (!inv) return;
  const s = getSettings();
  const msg = `*Invoice ${inv.id}* - ${s.businessName}\nCustomer: ${inv.customer}\nTotal: ${formatCurrency(inv.total)}\nStatus: ${inv.status}\nDue: ${formatDate(inv.dueDate)}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function deleteInvoice(id) {
  if (!confirm(`Delete Invoice ${id}? This cannot be undone.`)) return;
  const invoices = getInvoices().filter(i => i.id !== id);
  saveInvoices(invoices);
  showToast('Invoice deleted', 'error');
  loadSummaryCards();
  filterInvoices();
}

function clearFilters() {
  ['searchInv','filterStatus','filterFrom','filterTo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  filterInvoices();
}

function exportAll() {
  const invoices = getInvoices();
  const s = getSettings();
  let csv = 'Invoice ID,Customer,Phone,Date,Due Date,Status,Payment,Total\n';
  invoices.forEach(i => { csv += `${i.id},"${i.customer}",${i.phone||''},${i.date},${i.dueDate||''},${i.status},${i.paymentMethod||''},${i.total}\n`; });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `Invoices_${s.businessName}.csv`; a.click();
  showToast('Exported successfully!', 'success');
}

window.filterInvoices = filterInvoices;
window.updateStatus = updateStatus;
window.viewInvoice = viewInvoice;
window.printInvoice = printInvoice;
window.whatsappInvoice = whatsappInvoice;
window.deleteInvoice = deleteInvoice;
window.clearFilters = clearFilters;
window.exportAll = exportAll;
