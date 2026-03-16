/* ============================================
   Maxhope.AI — Recharge Page Controller
   ============================================ */

const RechargePageController = {
  selectedPackId: null,

  init() {
    if (!Auth.requireAuth()) return;
    SubscriptionManager.init();
    this.renderStatus();
    this.renderPacks();
    this.renderHistory();
  },

  renderStatus() {
    const summary = SubscriptionManager.getDashboardSummary();
    if (!summary) return;

    const planEl = document.getElementById('rb-plan');
    const badgeEl = document.getElementById('rb-status-badge');
    const expiryEl = document.getElementById('rb-expiry');
    const gensEl = document.getElementById('rb-gens');

    if (planEl) planEl.textContent = summary.planLabel;
    if (badgeEl) {
      const label = { active: 'Active', warning: 'Expiring Soon', expired: 'Expired' }[summary.badgeClass] || 'Active';
      badgeEl.innerHTML = `<span class="sub-status-badge ${summary.badgeClass}">${label}</span>`;
    }
    if (expiryEl) {
      expiryEl.textContent = summary.badgeClass === 'expired'
        ? 'Expired'
        : `${summary.expiryDate} (${summary.daysLeft} day${summary.daysLeft !== 1 ? 's' : ''} left)`;
    }
    if (gensEl) {
      gensEl.textContent = summary.isEnterprise ? 'Unlimited' : Number(summary.gensLeft).toLocaleString();
    }

    // Update banner border color
    const banner = document.getElementById('status-banner');
    if (banner) {
      if (summary.badgeClass === 'expired') banner.style.borderColor = 'rgba(248,113,113,0.4)';
      else if (summary.badgeClass === 'warning') banner.style.borderColor = 'rgba(251,191,36,0.4)';
    }
  },

  renderPacks() {
    const grid = document.getElementById('packs-grid');
    if (!grid) return;

    const features = {
      starter_pack: ['500 new generations', '30 days extension', 'All 7 tools access', 'Priority support'],
      pro_pack:     ['1,500 new generations', '30 days extension', 'All 7 tools access', 'Priority support', 'Advanced outputs'],
      max_pack:     ['4,000 new generations', '30 days extension', 'All 7 tools access', 'Priority support', 'Advanced outputs', 'Bulk export']
    };

    grid.innerHTML = SubscriptionManager.RECHARGE_PACKS.map((pack, i) => {
      const price = typeof Currency !== 'undefined' ? Currency.format(pack.usdEquivalent) : '$' + pack.usdEquivalent;
      const isHighlight = i === 1;
      const feats = features[pack.id] || [];
      return `
        <div class="recharge-pack-page-card ${isHighlight ? 'highlight' : ''}" id="page-pack-${pack.id}" onclick="RechargePageController.selectPack('${pack.id}', this)">
          ${isHighlight ? '<div class="pack-badge">Most Popular</div>' : ''}
          <div style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);font-weight:600;">${pack.name}</div>
          <div class="pack-page-price">${price}</div>
          <div class="pack-page-gens">+${pack.generations.toLocaleString()} Generations</div>
          <div class="pack-page-duration">+${pack.durationDays} days subscription</div>
          <ul class="pack-page-features">
            ${feats.map(f => `<li>&#9989; ${f}</li>`).join('')}
          </ul>
          <button class="btn btn-primary btn-block" style="margin-top:16px;" onclick="event.stopPropagation();RechargePageController.selectPack('${pack.id}', document.getElementById('page-pack-${pack.id}'))">
            Select Pack
          </button>
        </div>`;
    }).join('');
  },

  renderHistory() {
    const container = document.getElementById('order-history-container');
    if (!container) return;
    const data = localStorage.getItem('nexusai_user');
    if (!data) return;
    const user = JSON.parse(data);
    const history = (user.subscription && user.subscription.rechargeHistory) || [];

    if (!history.length) {
      container.innerHTML = '<div style="color:var(--muted);font-size:14px;padding:20px 0;">No recharge history yet.</div>';
      return;
    }

    const rows = [...history].reverse().map(h => {
      const date = new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const expiry = new Date(h.newExpiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `
        <tr>
          <td>${date}</td>
          <td>${h.packName || h.packId}</td>
          <td>${h.amountFormatted || ('$' + (h.amountINR / 83.5).toFixed(0))}</td>
          <td class="mono text-green">+${Number(h.generationsAdded).toLocaleString()}</td>
          <td>${expiry}</td>
          <td><span class="sub-status-badge active" style="font-size:10px;">Paid</span></td>
        </tr>`;
    }).join('');

    container.innerHTML = `
      <table class="order-history-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Pack</th>
            <th>Amount</th>
            <th>Generations</th>
            <th>New Expiry</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  },

  selectPack(packId, el) {
    this.selectedPackId = packId;
    // Highlight selected card
    document.querySelectorAll('.recharge-pack-page-card').forEach(c => c.classList.remove('selected'));
    if (el) el.classList.add('selected');

    // Show payment section
    const paySection = document.getElementById('payment-section');
    if (paySection) {
      paySection.classList.remove('hidden');
      paySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Show summary
    const pack = SubscriptionManager.RECHARGE_PACKS.find(p => p.id === packId);
    const summaryEl = document.getElementById('page-pack-summary');
    if (summaryEl && pack) {
      const price = typeof Currency !== 'undefined' ? Currency.format(pack.usdEquivalent) : '$' + pack.usdEquivalent;
      summaryEl.innerHTML = `
        <div>
          <strong>${pack.name}</strong>
          <span style="color:var(--muted);margin-left:8px;">+${pack.generations.toLocaleString()} generations &middot; +${pack.durationDays} days</span>
        </div>
        <div style="font-size:20px;font-weight:800;color:var(--accent);font-family:var(--font-mono);">${price}</div>`;
    }

    // Reset form state
    document.getElementById('payment-form').classList.remove('hidden');
    document.getElementById('payment-processing').classList.add('hidden');
    document.getElementById('payment-success').classList.add('hidden');
    const errEl = document.getElementById('page-payment-error');
    if (errEl) errEl.classList.add('hidden');
  },

  cancelPayment() {
    this.selectedPackId = null;
    document.querySelectorAll('.recharge-pack-page-card').forEach(c => c.classList.remove('selected'));
    const paySection = document.getElementById('payment-section');
    if (paySection) paySection.classList.add('hidden');
    document.getElementById('packs-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  processPayment() {
    const name = (document.getElementById('page-card-name') || {}).value || '';
    const num  = (document.getElementById('page-card-number') || {}).value || '';
    const exp  = (document.getElementById('page-card-expiry') || {}).value || '';
    const cvv  = (document.getElementById('page-card-cvv') || {}).value || '';
    const errEl = document.getElementById('page-payment-error');

    if (!name.trim() || num.replace(/\s/g, '').length < 16 || exp.length < 5 || cvv.length < 3) {
      if (errEl) { errEl.textContent = 'Please fill in all card details correctly.'; errEl.classList.remove('hidden'); }
      return;
    }
    if (errEl) errEl.classList.add('hidden');

    document.getElementById('payment-form').classList.add('hidden');
    document.getElementById('payment-processing').classList.remove('hidden');

    setTimeout(() => {
      const ok = SubscriptionManager.applyRecharge(this.selectedPackId);
      document.getElementById('payment-processing').classList.add('hidden');
      document.getElementById('payment-success').classList.remove('hidden');

      const pack = SubscriptionManager.RECHARGE_PACKS.find(p => p.id === this.selectedPackId);
      const detailEl = document.getElementById('success-detail');
      if (detailEl && pack) {
        detailEl.textContent = `+${pack.generations.toLocaleString()} generations added. Subscription extended by ${pack.durationDays} days.`;
      }

      // Refresh status and history after short delay
      setTimeout(() => {
        this.renderStatus();
        this.renderHistory();
        this.renderPacks();
      }, 500);
    }, 2000);
  }
};

document.addEventListener('DOMContentLoaded', () => RechargePageController.init());
