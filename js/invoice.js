// ============================================
//  Invoice Page Logic
// ============================================
let invoiceItems = [];
let currentInvoiceId = '';

document.addEventListener('DOMContentLoaded', () => {
  setupInvoicePage();
});

function setupInvoicePage() {
  currentInvoiceId = generateInvoiceId();
  const numEl = document.getElementById('invoiceNumDisplay');
  if (numEl) numEl.textContent = currentInvoiceId;

  const s = getSettings();
  const bizEl = document.getElementById('bizNameDisplay');
  if (bizEl) bizEl.textContent = s.businessName;

  const summGst = document.getElementById('summaryGst');
  if (summGst) summGst.textContent = s.gst || 'N/A';

  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  const due = new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0];
  const dEl = document.getElementById('invoiceDate');
  const duEl = document.getElementById('invoiceDueDate');
  if (dEl) dEl.value = today;
  if (duEl) duEl.value = due;

  // GST toggle
  const gstToggle = document.getElementById('gstToggle');
  if (gstToggle) {
    gstToggle.addEventListener('change', function() {
      const gstOptions = document.getElementById('gstOptions');
      const gstRow = document.getElementById('gstRow');
      if (gstOptions) gstOptions.style.display = this.checked ? 'block' : 'none';
      if (gstRow) gstRow.style.display = this.checked ? 'flex' : 'none';
      calculateTotals();
    });
  }

  // Load products into quick select
  const qs = document.getElementById('quickProductSelect');
  if (qs) {
    getProducts().forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.size}) - ${formatCurrency(p.price)}`;
      qs.appendChild(opt);
    });
  }

  // Check for product param in URL
  const urlParams = new URLSearchParams(window.location.search);
  const pid = urlParams.get('product');
  if (pid) {
    const p = getProducts().find(p => p.id == pid);
    if (p) addProductToItems(p);
  } else {
    addItem(); // Start with one empty row
  }

  renderItems();
}

function addItem() {
  invoiceItems.push({ description: '', size: '', qty: 1, price: 0 });
  renderItems();
}

function addProductToItems(p) {
  invoiceItems.push({ description: p.name, size: p.size, qty: 1, price: p.price });
  renderItems();
  calculateTotals();
}

function quickAddProduct(pid) {
  if (!pid) return;
  const p = getProducts().find(pr => pr.id == pid);
  if (p) {
    addProductToItems(p);
    document.getElementById('quickProductSelect').value = '';
    showToast(`${p.name} added to invoice`, 'success');
  }
}

function removeItem(idx) {
  invoiceItems.splice(idx, 1);
  renderItems();
  calculateTotals();
}

function renderItems() {
  const tb = document.getElementById('invoiceItems');
  if (!tb) return;
  if (invoiceItems.length === 0) {
    tb.innerHTML = '<tr><td colspan="6" class="text-center py-4" style="color:var(--text-muted)">No items added yet. Click "Add Item" to start.</td></tr>';
    return;
  }
  tb.innerHTML = invoiceItems.map((item, i) => `
    <tr>
      <td>
        <input type="text" class="form-control form-control-sm" value="${item.description}" 
          onchange="updateItem(${i},'description',this.value)" placeholder="Frame description"/>
      </td>
      <td>
        <input type="text" class="form-control form-control-sm" value="${item.size}" 
          onchange="updateItem(${i},'size',this.value)" placeholder="4x6"/>
      </td>
      <td>
        <input type="number" class="form-control form-control-sm" value="${item.qty}" min="1"
          onchange="updateItem(${i},'qty',this.value)" oninput="updateItem(${i},'qty',this.value)"/>
      </td>
      <td>
        <input type="number" class="form-control form-control-sm" value="${item.price}" min="0"
          onchange="updateItem(${i},'price',this.value)" oninput="updateItem(${i},'price',this.value)"/>
      </td>
      <td>
        <strong style="color:var(--primary)">${formatCurrency(item.qty * item.price)}</strong>
      </td>
      <td>
        <button class="btn btn-sm" style="color:#EF4444;background:rgba(239,68,68,0.1);border-radius:6px;padding:4px 8px" onclick="removeItem(${i})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function updateItem(idx, field, value) {
  invoiceItems[idx][field] = field === 'qty' || field === 'price' ? parseFloat(value) || 0 : value;
  calculateTotals();
  // Update total cell without full re-render
  const rows = document.querySelectorAll('#invoiceItems tr');
  if (rows[idx]) {
    const totalCell = rows[idx].querySelectorAll('td')[4];
    if (totalCell) totalCell.innerHTML = `<strong style="color:var(--primary)">${formatCurrency(invoiceItems[idx].qty * invoiceItems[idx].price)}</strong>`;
  }
}

function calculateTotals() {
  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const discount = parseFloat(document.getElementById('discountPct')?.value || 0);
  const gstOn = document.getElementById('gstToggle')?.checked;
  const gstRate = parseFloat(document.getElementById('gstRate')?.value || 18);

  const discountAmt = subtotal * (discount / 100);
  const afterDiscount = subtotal - discountAmt;
  const gstAmt = gstOn ? afterDiscount * (gstRate / 100) : 0;
  const grandTotal = afterDiscount + gstAmt;

  const fmt = formatCurrency;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('subtotal', fmt(subtotal));
  set('discountAmt', '- ' + fmt(discountAmt));
  set('gstAmt', fmt(gstAmt));
  set('grandTotal', fmt(grandTotal));
  set('gstPct', gstRate);

  const discRow = document.getElementById('discountRow');
  if (discRow) discRow.style.display = discount > 0 ? 'flex' : 'none';

  return { subtotal, discountAmt, gstAmt, grandTotal };
}

function searchCustomers(query) {
  const dd = document.getElementById('customerDropdown');
  if (!dd) return;
  if (!query || query.length < 2) { dd.style.display = 'none'; return; }
  const customers = getCustomers().filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query));
  if (customers.length === 0) { dd.style.display = 'none'; return; }
  dd.style.display = 'block';
  dd.innerHTML = customers.map(c => `
    <div onclick="selectCustomer(${c.id})" style="padding:12px 16px;cursor:pointer;border-bottom:1px solid var(--border);transition:background 0.2s"
      onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background='transparent'">
      <div style="font-weight:600;font-size:0.9rem">${c.name}</div>
      <div style="font-size:0.78rem;color:var(--text-muted)">${c.phone} • ${c.city}</div>
    </div>
  `).join('');
}

function selectCustomer(cid) {
  const c = getCustomers().find(c => c.id === cid);
  if (!c) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  set('customerName', c.name);
  set('customerPhone', c.phone);
  set('customerEmail', c.email || '');
  set('customerAddress', c.city || '');
  document.getElementById('customerDropdown').style.display = 'none';
  showToast(`Customer "${c.name}" selected`, 'info');
}

function buildInvoiceObject() {
  const totals = calculateTotals();
  return {
    id: currentInvoiceId,
    customer: document.getElementById('customerName')?.value || 'Customer',
    phone: document.getElementById('customerPhone')?.value || '',
    email: document.getElementById('customerEmail')?.value || '',
    address: document.getElementById('customerAddress')?.value || '',
    date: document.getElementById('invoiceDate')?.value || '',
    dueDate: document.getElementById('invoiceDueDate')?.value || '',
    status: document.getElementById('invoiceStatus')?.value || 'pending',
    paymentMethod: document.getElementById('paymentMethod')?.value || 'cash',
    items: invoiceItems.map(i => ({ name: i.description, size: i.size, qty: i.qty, price: i.price })),
    notes: document.getElementById('invoiceNotes')?.value || '',
    subtotal: totals.subtotal,
    discount: totals.discountAmt,
    gst: totals.gstAmt,
    total: totals.grandTotal
  };
}

function saveInvoiceOnly() {
  const inv = buildInvoiceObject();
  if (!inv.customer || inv.customer === 'Customer' || !inv.customer.trim()) { showToast('Please enter customer name', 'error'); return; }
  if (invoiceItems.length === 0 || invoiceItems.every(i => !i.description)) { showToast('Please add at least one item', 'error'); return; }
  const invoices = getInvoices();
  invoices.push(inv);
  saveInvoices(invoices);
  showToast('Invoice saved successfully!', 'success');
  // Reset for new invoice
  setTimeout(() => {
    currentInvoiceId = generateInvoiceId();
    const el = document.getElementById('invoiceNumDisplay');
    if (el) el.textContent = currentInvoiceId;
    invoiceItems = [];
    renderItems();
    calculateTotals();
  }, 500);
}

function saveAndPrint() {
  const inv = buildInvoiceObject();
  if (!inv.customer || !inv.customer.trim()) { showToast('Please enter customer name', 'error'); return; }
  // Save first
  const invoices = getInvoices();
  const existing = invoices.findIndex(i => i.id === inv.id);
  if (existing >= 0) { invoices[existing] = inv; } else { invoices.push(inv); }
  saveInvoices(invoices);

  // Open print window
  openPrintWindow(inv);
}

function openPrintWindow(inv) {
  const s = getSettings();
  const printHTML = `<!DOCTYPE html><html><head><title>${inv.id} - Invoice</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;color:#1A1A1A;background:white;padding:40px}
    .inv-header{background:linear-gradient(135deg,#C8860A,#E8A020);color:white;padding:32px;border-radius:16px;margin-bottom:32px;display:flex;justify-content:space-between;align-items:flex-start}
    .inv-num{font-size:0.8rem;opacity:0.8;margin-bottom:4px}
    .inv-title{font-size:2rem;font-weight:800}
    .inv-biz{opacity:0.85;margin-top:4px}
    .inv-dates{text-align:right;font-size:0.85rem}
    .section{margin-bottom:24px}
    .section-title{font-weight:700;font-size:0.85rem;letter-spacing:1px;text-transform:uppercase;color:#9A6508;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #F2EDE4}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
    .info-item .label{font-size:0.75rem;color:#666;margin-bottom:2px}
    .info-item .value{font-weight:600;font-size:0.9rem}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th{background:#F2EDE4;padding:10px 12px;text-align:left;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#666}
    td{padding:12px;border-bottom:1px solid #F0EDE4;font-size:0.88rem}
    tr:last-child td{border-bottom:none}
    .totals{margin-left:auto;width:280px;margin-top:24px;background:#F2EDE4;border-radius:12px;padding:20px}
    .total-row{display:flex;justify-content:space-between;padding:4px 0;font-size:0.88rem;color:#666}
    .grand-row{display:flex;justify-content:space-between;padding:10px 0 0;margin-top:8px;border-top:2px solid #E0D9CE;font-weight:800;font-size:1.1rem}
    .grand-row .amount{color:#C8860A}
    .footer{margin-top:40px;text-align:center;font-size:0.8rem;color:#999;border-top:1px solid #eee;padding-top:20px}
    .notes-box{background:#FAFAF8;border:1px solid #E0D9CE;border-radius:8px;padding:16px;font-size:0.85rem;color:#666;margin-top:12px}
    .badge{display:inline-block;padding:4px 12px;border-radius:40px;font-size:0.72rem;font-weight:700;text-transform:uppercase}
    .paid{background:rgba(16,185,129,0.12);color:#10B981}
    .pending{background:rgba(245,158,11,0.12);color:#F59E0B}
    @media print{body{padding:20px}@page{margin:15mm}}
  </style></head><body>
  <div class="inv-header">
    <div>
      <div class="inv-num">INVOICE NUMBER</div>
      <div class="inv-title">${inv.id}</div>
      <div class="inv-biz">${s.businessName}</div>
    </div>
    <div class="inv-dates">
      <div><strong>Date:</strong> ${formatDate(inv.date)}</div>
      <div style="margin-top:4px"><strong>Due:</strong> ${formatDate(inv.dueDate)}</div>
      <div style="margin-top:8px"><span class="badge ${inv.status}">${inv.status.toUpperCase()}</span></div>
    </div>
  </div>
  <div class="info-grid" style="margin-bottom:24px">
    <div class="section">
      <div class="section-title">Bill To</div>
      <div class="info-item"><div class="label">Customer Name</div><div class="value">${inv.customer}</div></div>
      ${inv.phone ? `<div class="info-item" style="margin-top:8px"><div class="label">Phone</div><div class="value">${inv.phone}</div></div>` : ''}
      ${inv.email ? `<div class="info-item" style="margin-top:8px"><div class="label">Email</div><div class="value">${inv.email}</div></div>` : ''}
      ${inv.address ? `<div class="info-item" style="margin-top:8px"><div class="label">Address</div><div class="value">${inv.address}</div></div>` : ''}
    </div>
    <div class="section">
      <div class="section-title">From</div>
      <div class="info-item"><div class="label">Business</div><div class="value">${s.businessName}</div></div>
      <div class="info-item" style="margin-top:8px"><div class="label">Phone</div><div class="value">${s.phone}</div></div>
      <div class="info-item" style="margin-top:8px"><div class="label">Email</div><div class="value">${s.email}</div></div>
      ${s.gst ? `<div class="info-item" style="margin-top:8px"><div class="label">GST No.</div><div class="value">${s.gst}</div></div>` : ''}
      <div class="info-item" style="margin-top:8px"><div class="label">Payment</div><div class="value">${inv.paymentMethod || 'Cash'}</div></div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Items</div>
    <table>
      <thead><tr><th>#</th><th>Description</th><th>Size</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
      <tbody>
        ${inv.items.map((item, i) => `
          <tr>
            <td>${i+1}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.size || '-'}</td>
            <td>${item.qty}</td>
            <td>${formatCurrency(item.price)}</td>
            <td><strong>${formatCurrency(item.qty * item.price)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>${formatCurrency(inv.subtotal)}</span></div>
    ${inv.discount > 0 ? `<div class="total-row"><span>Discount</span><span style="color:#10B981">- ${formatCurrency(inv.discount)}</span></div>` : ''}
    ${inv.gst > 0 ? `<div class="total-row"><span>GST</span><span>${formatCurrency(inv.gst)}</span></div>` : ''}
    <div class="grand-row"><span>Grand Total</span><span class="amount">${formatCurrency(inv.total)}</span></div>
  </div>
  ${inv.notes ? `<div class="section" style="margin-top:24px"><div class="section-title">Notes & Terms</div><div class="notes-box">${inv.notes}</div></div>` : ''}
  <div class="footer">
    <strong>${s.businessName}</strong> • ${s.phone} • ${s.email} • ${s.address}<br/>
    Thank you for your business! 🖼️
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
  </body></html>`;

  const win = window.open('', '_blank');
  win.document.write(printHTML);
  win.document.close();
}

function shareWhatsApp() {
  const inv = buildInvoiceObject();
  const s = getSettings();
  const msg = `*Invoice ${inv.id}* from *${s.businessName}*\n\nCustomer: ${inv.customer}\nDate: ${formatDate(inv.date)}\n\nItems:\n${inv.items.map(i => `• ${i.name} x${i.qty} = ${formatCurrency(i.qty * i.price)}`).join('\n')}\n\n*Total: ${formatCurrency(inv.total)}*\n\nDue: ${formatDate(inv.dueDate)}\nPayment: ${inv.paymentMethod}\n\n${s.businessName} | ${s.phone}`;
  const phone = document.getElementById('customerPhone')?.value?.replace(/\D/g,'') || '';
  window.open(`https://wa.me/${phone ? '91'+phone : ''}?text=${encodeURIComponent(msg)}`, '_blank');
}

function resetInvoice() {
  if (!confirm('Reset invoice? All items will be cleared.')) return;
  invoiceItems = [];
  renderItems();
  calculateTotals();
  ['customerName','customerPhone','customerEmail','customerAddress'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const notes = document.getElementById('invoiceNotes');
  if (notes) notes.value = 'Thank you for your business! Payment due within 7 days.';
  showToast('Invoice reset', 'info');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#customerName') && !e.target.closest('#customerDropdown')) {
    const dd = document.getElementById('customerDropdown');
    if (dd) dd.style.display = 'none';
  }
});

window.addItem = addItem;
window.removeItem = removeItem;
window.updateItem = updateItem;
window.quickAddProduct = quickAddProduct;
window.calculateTotals = calculateTotals;
window.searchCustomers = searchCustomers;
window.selectCustomer = selectCustomer;
window.saveAndPrint = saveAndPrint;
window.saveInvoiceOnly = saveInvoiceOnly;
window.shareWhatsApp = shareWhatsApp;
window.resetInvoice = resetInvoice;
