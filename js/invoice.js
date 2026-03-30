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

function numberToWords(n) {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (n === 0) return 'Zero';
  if (n < 0) return 'Minus ' + numberToWords(-n);
  let words = '';
  if (Math.floor(n/10000000) > 0) { words += numberToWords(Math.floor(n/10000000)) + ' Crore '; n %= 10000000; }
  if (Math.floor(n/100000) > 0) { words += numberToWords(Math.floor(n/100000)) + ' Lakh '; n %= 100000; }
  if (Math.floor(n/1000) > 0) { words += numberToWords(Math.floor(n/1000)) + ' Thousand '; n %= 1000; }
  if (Math.floor(n/100) > 0) { words += numberToWords(Math.floor(n/100)) + ' Hundred '; n %= 100; }
  if (n > 0) { if (words !== '') words += 'and '; if (n < 20) words += ones[n]; else { words += tens[Math.floor(n/10)]; if (n%10 > 0) words += ' ' + ones[n%10]; } }
  return words.trim();
}

function openPrintWindow(inv) {
  const s = getSettings();
  const totalRounded = Math.round(inv.total);
  const roundOff = totalRounded - inv.total;
  const amountWords = numberToWords(totalRounded) + ' Only.';

  const printHTML = `<!DOCTYPE html><html><head><title>${inv.id}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;color:#1A1A1A;background:white;font-size:12px}
    .page{width:210mm;min-height:297mm;margin:0 auto;padding:12mm 14mm;position:relative}
    /* Header */
    .inv-header-bar{background:#e8f0f7;padding:6px 12px;text-align:center;font-size:16px;font-weight:700;letter-spacing:1px;margin-bottom:12px;border:1px solid #ccc}
    .biz-row{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;padding-bottom:10px;border-bottom:2px solid #333}
    .biz-logo{width:70px;height:70px;background:#1a1a1a;border-radius:4px;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:22px;flex-shrink:0}
    .biz-logo img{width:100%;height:100%;object-fit:cover;border-radius:4px}
    .biz-info{flex:1;padding:0 12px}
    .biz-name{font-size:18px;font-weight:800;color:#1a1a1a}
    .biz-state{font-size:11px;color:#555;margin-top:2px}
    .inv-meta{text-align:right;font-size:11px}
    .inv-meta div{margin-bottom:3px}
    .inv-meta strong{font-size:12px}
    /* Bill To */
    .bill-section{margin-bottom:10px;padding:8px 10px;border:1px solid #ccc;border-radius:4px;background:#fafafa}
    .bill-label{font-size:10px;color:#666;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px}
    .bill-name{font-size:13px;font-weight:800;color:#1a1a1a}
    .bill-addr{font-size:11px;color:#444;margin-top:2px;line-height:1.5}
    .bill-phone{font-size:11px;color:#444;margin-top:3px}
    /* Items Table */
    table{width:100%;border-collapse:collapse;margin-bottom:0}
    table th{background:#2c3e50;color:white;padding:7px 8px;font-size:11px;font-weight:700;text-align:center;border:1px solid #2c3e50}
    table th:first-child,table th:nth-child(2){text-align:left}
    table td{padding:7px 8px;border:1px solid #ddd;font-size:11px;vertical-align:top}
    table td:first-child{text-align:center;width:30px}
    table td:nth-child(3),table td:nth-child(4),table td:nth-child(5),table td:nth-child(6),table td:nth-child(7){text-align:center}
    table td:last-child{text-align:right;font-weight:600}
    table tbody tr:nth-child(even){background:#f9f9f9}
    .total-row-table td{background:#f0f0f0;font-weight:700;border:1px solid #ccc}
    /* Amount Summary */
    .summary-section{display:flex;justify-content:space-between;align-items:flex-start;margin-top:10px;border:1px solid #ccc;border-radius:4px;overflow:hidden}
    .words-box{flex:1;padding:10px 12px;background:#fafafa;border-right:1px solid #ccc}
    .words-label{font-size:10px;font-weight:700;color:#666;text-transform:uppercase;margin-bottom:4px}
    .words-value{font-size:12px;font-weight:700;color:#1a1a1a;line-height:1.4}
    .amount-box{width:280px;padding:10px 12px}
    .amt-row{display:flex;justify-content:space-between;padding:3px 0;font-size:11px;border-bottom:1px dashed #eee}
    .amt-row:last-child{border-bottom:none;padding-top:6px;margin-top:4px;border-top:2px solid #333;font-size:13px;font-weight:800}
    .amt-row span:last-child{font-weight:600;text-align:right}
    /* Terms */
    .terms-section{margin-top:10px;padding:8px 10px;border:1px solid #ccc;border-radius:4px;background:#fafafa}
    .terms-title{font-size:11px;font-weight:800;margin-bottom:6px;color:#1a1a1a}
    .terms-section ol{padding-left:16px}
    .terms-section ol li{font-size:10px;color:#444;margin-bottom:3px;line-height:1.4}
    /* Payment & Sign */
    .footer-section{display:flex;justify-content:space-between;align-items:flex-end;margin-top:12px;padding-top:10px;border-top:1px solid #ddd}
    .upi-box{display:flex;align-items:flex-start;gap:10px}
    .upi-qr{width:70px;height:70px;background:#1a1a1a;border-radius:4px;display:flex;align-items:center;justify-content:center;color:white;font-size:8px;text-align:center;padding:4px}
    .upi-details{font-size:10px;color:#333;line-height:1.7}
    .upi-details strong{font-size:11px}
    .sign-box{text-align:right}
    .sign-company{font-size:11px;font-weight:700;margin-bottom:30px}
    .sign-line{border-top:1px solid #333;width:160px;margin-left:auto;padding-top:4px;font-size:10px;color:#666;text-align:center}
    .computer-gen{text-align:center;font-size:10px;color:#888;margin-top:12px;font-style:italic;border-top:1px solid #eee;padding-top:8px}
    @media print{body{margin:0}@page{size:A4;margin:10mm}.page{padding:8mm 10mm;width:100%}}
  </style></head><body>
  <div class="page">
    <!-- Header -->
    <div class="inv-header-bar">Invoice</div>

    <!-- Business Info Row -->
    <div class="biz-row">
      <div class="biz-logo">
        ${s.avatar ? `<img src="${s.avatar}" alt="Logo"/>` : `<span>${(s.businessName||'FC').slice(0,2).toUpperCase()}</span>`}
      </div>
      <div class="biz-info">
        <div class="biz-name">${s.businessName || 'FrameCraft Pro'}</div>
        <div class="biz-state">${s.address || 'Tamil Nadu'}</div>
        ${s.gst ? `<div style="font-size:10px;color:#555;margin-top:2px">GSTIN: ${s.gst}</div>` : ''}
      </div>
      <div class="inv-meta">
        <div><strong>Invoice No: ${inv.id}</strong></div>
        <div>Date of Invoice: ${formatDate(inv.date)}</div>
        ${inv.dueDate ? `<div>Due Date: ${formatDate(inv.dueDate)}</div>` : ''}
        <div style="margin-top:4px">Payment: ${inv.paymentMethod || 'Cash'}</div>
      </div>
    </div>

    <!-- Bill To -->
    <div class="bill-section">
      <div class="bill-label">Bill To</div>
      <div class="bill-name">${inv.customer.toUpperCase()}</div>
      ${inv.address ? `<div class="bill-addr">${inv.address}</div>` : ''}
      ${inv.phone ? `<div class="bill-phone">Ph: ${inv.phone}</div>` : ''}
      ${inv.email ? `<div class="bill-phone">Email: ${inv.email}</div>` : ''}
    </div>

    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit</th>
          <th>Rate</th>
          ${inv.discount > 0 ? '<th>Discount</th><th>Taxable Rate</th>' : ''}
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${inv.items.map((item, i) => {
          const lineTotal = item.qty * item.price;
          return `<tr>
            <td>${i+1}</td>
            <td><strong>${item.name}</strong>${item.size ? `<br><em style="font-size:10px;color:#666">${item.size}</em>` : ''}</td>
            <td>${item.qty}</td>
            <td>${item.unit || 'Pcs'}</td>
            <td>${item.price.toFixed(2)}</td>
            ${inv.discount > 0 ? `<td>${inv.discountPct||0}%</td><td>${(item.price*(1-(inv.discountPct||0)/100)).toFixed(2)}</td>` : ''}
            <td>${lineTotal.toFixed(2)}</td>
          </tr>`;
        }).join('')}
        <tr class="total-row-table">
          <td colspan="${inv.discount > 0 ? 4 : 4}" style="text-align:left;font-weight:700">Total (₹)</td>
          <td style="text-align:center;font-weight:700">${inv.items.reduce((s,i)=>s+i.qty,0)}</td>
          ${inv.discount > 0 ? '<td></td><td></td>' : ''}
          <td style="text-align:right;font-weight:800">${(inv.subtotal||inv.total).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Amount Summary -->
    <div class="summary-section">
      <div class="words-box">
        <div class="words-label">Total amount (in words)</div>
        <div class="words-value">${amountWords}</div>
      </div>
      <div class="amount-box">
        <div class="amt-row"><span>Subtotal (₹):</span><span>${(inv.subtotal||inv.total).toFixed(2)}</span></div>
        ${inv.discount > 0 ? `<div class="amt-row"><span>Discount (₹):</span><span>-${inv.discount.toFixed(2)}</span></div>` : ''}
        ${inv.gst > 0 ? `<div class="amt-row"><span>GST (₹):</span><span>${inv.gst.toFixed(2)}</span></div>` : ''}
        ${Math.abs(roundOff) > 0 ? `<div class="amt-row"><span>Round Off (₹):</span><span>${roundOff > 0 ? '+' : ''}${roundOff.toFixed(2)}</span></div>` : ''}
        <div class="amt-row"><span>Total Amount (₹):</span><span>${totalRounded.toFixed(2)}</span></div>
        <div class="amt-row"><span style="font-weight:800">Remaining Amount (₹):</span><span style="color:#C8860A">${totalRounded.toFixed(2)}</span></div>
      </div>
    </div>

    <!-- Terms -->
    ${inv.notes ? `
    <div class="terms-section">
      <div class="terms-title">Terms:</div>
      <ol>
        ${inv.notes.split('\n').filter(Boolean).map(t => `<li>${t}</li>`).join('')}
        <li>For Feedback/Complaints, Call: ${s.phone} | Email: ${s.email}${s.website ? ` | ${s.website}` : ''}</li>
      </ol>
    </div>` : `
    <div class="terms-section">
      <div class="terms-title">Terms:</div>
      <ol>
        <li>All disputes are subject to company Jurisdiction.</li>
        <li>Certified that the particular items given above are true and correct.</li>
        <li>For Feedback/Complaints, Call: ${s.phone} | Email: ${s.email}</li>
      </ol>
    </div>`}

    <!-- Footer: UPI + Signature -->
    <div class="footer-section">
      <div class="upi-box">
        ${s.upiId ? `
        <div class="upi-qr">QR<br/>Code</div>
        <div class="upi-details">
          <div>Scan &amp; Pay using any UPI app</div>
          <div><strong>UPI ID: ${s.upiId}</strong></div>
          <div>UPI Name: ${s.businessName}</div>
          ${s.bank ? `<div><strong>Bank: ${s.bank}</strong></div>` : ''}
          ${s.bankBranch ? `<div>Branch: ${s.bankBranch}</div>` : ''}
        </div>` : `
        <div class="upi-details">
          <div><strong>${s.businessName}</strong></div>
          <div>${s.phone}</div>
          <div>${s.email}</div>
        </div>`}
      </div>
      <div class="sign-box">
        <div class="sign-company">For ${s.businessName}</div>
        <div class="sign-line">Authorised Signatory</div>
      </div>
    </div>

    <div class="computer-gen">This is a Computer Generated Invoice.</div>
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
