// ============================================
//  FrameCraft Pro - Home Page Logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  animateStats();
  loadFeaturedProducts();
  setupScrollNav();
});

function animateStats() {
  const animateCount = (el, target, suffix = '') => {
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { start = target; clearInterval(timer); }
      el.textContent = Math.floor(start) + suffix;
    }, 16);
  };
  const c = document.getElementById('statsCustomers');
  const f = document.getElementById('statsFrames');
  const y = document.getElementById('statsYears');
  if (c) animateCount(c, 1200, '+');
  if (f) animateCount(f, 8500, '+');
  if (y) animateCount(y, 8, '+');
}

function loadFeaturedProducts() {
  const container = document.getElementById('featuredProducts');
  if (!container) return;
  const products = getProducts().slice(0, 4);
  container.innerHTML = products.map(p => `
    <div class="col-sm-6 col-lg-3">
      <div class="product-card" onclick="window.location='products.html'">
        <div class="product-img" style="background:${p.gradient}">
          <i class="${p.icon} fa-2x"></i>
        </div>
        <div class="product-body">
          <div class="product-name">${p.name}</div>
          <div class="product-size">${p.size}</div>
          <div class="d-flex align-items-center justify-content-between mt-2">
            <div class="product-price">${formatCurrency(p.price)}</div>
            <span class="badge" style="background:rgba(200,134,10,0.1);color:var(--primary);font-size:0.72rem">In Stock: ${p.stock}</span>
          </div>
          <div class="product-actions">
            <button class="btn-add-invoice" onclick="event.stopPropagation();window.location='invoice.html?product=${p.id}'">
              <i class="fas fa-file-invoice me-1"></i> Add to Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function setupScrollNav() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('mainNav');
    if (nav) {
      if (window.scrollY > 60) { nav.style.boxShadow = '0 4px 24px rgba(0,0,0,0.1)'; }
      else { nav.style.boxShadow = 'none'; }
    }
  });
}
