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
  const s = getSettings();
  // numberToWords helper
  function numWords(n) {
    const ones=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    if(n===0)return'Zero'; let w='';
    if(Math.floor(n/100000)>0){w+=numWords(Math.floor(n/100000))+' Lakh ';n%=100000;}
    if(Math.floor(n/1000)>0){w+=numWords(Math.floor(n/1000))+' Thousand ';n%=1000;}
    if(Math.floor(n/100)>0){w+=numWords(Math.floor(n/100))+' Hundred ';n%=100;}
    if(n>0){if(w)w+='and ';if(n<20)w+=ones[n];else{w+=tens[Math.floor(n/10)];if(n%10>0)w+=' '+ones[n%10];}}
    return w.trim();
  }
  const totalRounded = Math.round(inv.total);
  const roundOff = totalRounded - inv.total;
  const amtWords = numWords(totalRounded) + ' Only.';

  const html = `<!DOCTYPE html><html><head><title>${inv.id}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;color:#1A1A1A;background:white;font-size:12px}
    .page{width:210mm;min-height:297mm;margin:0 auto;padding:12mm 14mm}
    .inv-header-bar{background:#e8f0f7;padding:6px 12px;text-align:center;font-size:16px;font-weight:700;letter-spacing:1px;margin-bottom:12px;border:1px solid #ccc}
    .biz-row{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;padding-bottom:10px;border-bottom:2px solid #333}
    .biz-logo{width:70px;height:70px;background:#1a1a1a;border-radius:4px;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:22px;flex-shrink:0}
    .biz-logo img{width:100%;height:100%;object-fit:cover;border-radius:4px}
    .biz-info{flex:1;padding:0 12px}.biz-name{font-size:18px;font-weight:800}
    .inv-meta{text-align:right;font-size:11px}.inv-meta div{margin-bottom:3px}
    .bill-section{margin-bottom:10px;padding:8px 10px;border:1px solid #ccc;border-radius:4px;background:#fafafa}
    .bill-label{font-size:10px;color:#666;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px}
    .bill-name{font-size:13px;font-weight:800}.bill-addr{font-size:11px;color:#444;margin-top:2px;line-height:1.5}
    table{width:100%;border-collapse:collapse;margin-bottom:0}
    table th{background:#2c3e50;color:white;padding:7px 8px;font-size:11px;font-weight:700;text-align:center;border:1px solid #2c3e50}
    table th:first-child,table th:nth-child(2){text-align:left}
    table td{padding:7px 8px;border:1px solid #ddd;font-size:11px;vertical-align:top}
    table td:first-child{text-align:center;width:30px}
    table td:nth-child(3),table td:nth-child(4),table td:nth-child(5),table td:nth-child(6),table td:nth-child(7){text-align:center}
    table td:last-child{text-align:right;font-weight:600}
    table tbody tr:nth-child(even){background:#f9f9f9}
    .total-row-table td{background:#f0f0f0;font-weight:700;border:1px solid #ccc}
    .summary-section{display:flex;justify-content:space-between;align-items:flex-start;margin-top:10px;border:1px solid #ccc;border-radius:4px;overflow:hidden}
    .words-box{flex:1;padding:10px 12px;background:#fafafa;border-right:1px solid #ccc}
    .words-label{font-size:10px;font-weight:700;color:#666;text-transform:uppercase;margin-bottom:4px}
    .words-value{font-size:12px;font-weight:700}
    .amount-box{width:280px;padding:10px 12px}
    .amt-row{display:flex;justify-content:space-between;padding:3px 0;font-size:11px;border-bottom:1px dashed #eee}
    .amt-row:last-child{border-bottom:none;padding-top:6px;margin-top:4px;border-top:2px solid #333;font-size:13px;font-weight:800}
    .terms-section{margin-top:10px;padding:8px 10px;border:1px solid #ccc;border-radius:4px;background:#fafafa}
    .terms-title{font-size:11px;font-weight:800;margin-bottom:6px}
    .terms-section ol{padding-left:16px}.terms-section ol li{font-size:10px;color:#444;margin-bottom:3px;line-height:1.4}
    .footer-section{display:flex;justify-content:space-between;align-items:flex-end;margin-top:12px;padding-top:10px;border-top:1px solid #ddd}
    .upi-details{font-size:10px;color:#333;line-height:1.7}
    .sign-box{text-align:right}.sign-company{font-size:11px;font-weight:700;margin-bottom:30px}
    .sign-line{border-top:1px solid #333;width:160px;margin-left:auto;padding-top:4px;font-size:10px;color:#666;text-align:center}
    .computer-gen{text-align:center;font-size:10px;color:#888;margin-top:12px;font-style:italic;border-top:1px solid #eee;padding-top:8px}
    @media print{@page{size:A4;margin:10mm}.page{padding:8mm 10mm;width:100%}}
  </style></head><body><div class="page">
  <div class="inv-header-bar">Invoice</div>
  <div class="biz-row">
    <div class="biz-logo">${s.avatar?`<img src="${s.avatar}" alt="Logo"/>`:`<span>${(s.businessName||'FC').slice(0,2).toUpperCase()}</span>`}</div>
    <div class="biz-info"><div class="biz-name">${s.businessName||'FrameCraft Pro'}</div><div style="font-size:11px;color:#555">${s.address||''}</div>${s.gst?`<div style="font-size:10px;color:#555">GSTIN: ${s.gst}</div>`:''}</div>
    <div class="inv-meta"><div><strong>Invoice No: ${inv.id}</strong></div><div>Date of Invoice: ${formatDate(inv.date)}</div>${inv.dueDate?`<div>Due Date: ${formatDate(inv.dueDate)}</div>`:''}<div>Payment: ${inv.paymentMethod||'Cash'}</div></div>
  </div>
  <div class="bill-section">
    <div class="bill-label">Bill To</div>
    <div class="bill-name">${inv.customer.toUpperCase()}</div>
    ${inv.address?`<div class="bill-addr">${inv.address}</div>`:''}
    ${inv.phone?`<div class="bill-addr">Ph: ${inv.phone}</div>`:''}
    ${inv.email?`<div class="bill-addr">Email: ${inv.email}</div>`:''}
  </div>
  <table>
    <thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit</th><th>Rate</th>${(inv.discount||0)>0?'<th>Discount</th><th>Taxable Rate</th>':''}<th>Total</th></tr></thead>
    <tbody>
      ${(inv.items||[]).map((it,i)=>{
        const lt=it.qty*it.price;
        return `<tr><td>${i+1}</td><td><strong>${it.name}</strong>${it.size?`<br><em style="font-size:10px;color:#666">${it.size}</em>`:''}</td><td>${it.qty}</td><td>${it.unit||'Pcs'}</td><td>${it.price.toFixed(2)}</td>${(inv.discount||0)>0?`<td>${inv.discountPct||0}%</td><td>${(it.price*(1-(inv.discountPct||0)/100)).toFixed(2)}</td>`:''}<td>${lt.toFixed(2)}</td></tr>`;
      }).join('')}
      <tr class="total-row-table"><td colspan="4" style="text-align:left">Total (₹)</td><td style="text-align:center">${(inv.items||[]).reduce((s,i)=>s+i.qty,0)}</td>${(inv.discount||0)>0?'<td></td><td></td>':''}<td style="text-align:right">${(inv.subtotal||inv.total).toFixed(2)}</td></tr>
    </tbody>
  </table>
  <div class="summary-section">
    <div class="words-box"><div class="words-label">Total amount (in words)</div><div class="words-value">${amtWords}</div></div>
    <div class="amount-box">
      <div class="amt-row"><span>Subtotal (₹):</span><span>${(inv.subtotal||inv.total).toFixed(2)}</span></div>
      ${(inv.discount||0)>0?`<div class="amt-row"><span>Discount (₹):</span><span>-${inv.discount.toFixed(2)}</span></div>`:''}
      ${(inv.gst||0)>0?`<div class="amt-row"><span>GST (₹):</span><span>${inv.gst.toFixed(2)}</span></div>`:''}
      ${Math.abs(roundOff)>0?`<div class="amt-row"><span>Round Off (₹):</span><span>${roundOff>0?'+':''}${roundOff.toFixed(2)}</span></div>`:''}
      <div class="amt-row"><span>Total Amount (₹):</span><span>${totalRounded.toFixed(2)}</span></div>
      <div class="amt-row"><span>Remaining Amount (₹):</span><span>${totalRounded.toFixed(2)}</span></div>
    </div>
  </div>
  <div class="terms-section">
    <div class="terms-title">Terms:</div>
    <ol>
      <li>All disputes are subject to company Jurisdiction.</li>
      <li>Certified that the particular items given above are true and correct.</li>
      <li>For Feedback/Complaints, Call at: ${s.phone} | Email: ${s.email}${s.website?' | Visit us at: '+s.website:''}</li>
    </ol>
  </div>
  <div class="footer-section">
    <div class="upi-details">
      ${s.upiId?`<div>Scan &amp; Pay using any UPI app</div><div><strong>UPI ID: ${s.upiId}</strong></div><div>UPI Name: ${s.businessName}</div>${s.bank?`<div><strong>Bank: ${s.bank}</strong></div>`:''}`:`<div><strong>${s.businessName}</strong></div><div>${s.phone} | ${s.email}</div>`}
    </div>
    <div class="sign-box"><div class="sign-company">For ${s.businessName}</div><div class="sign-line">Authorised Signatory</div></div>
  </div>
  <div class="computer-gen">This is a Computer Generated Invoice.</div>
  </div><script>window.onload=()=>window.print()<\/script></body></html>`;
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
